import { Elysia } from 'elysia';
import { google } from 'googleapis';
import { componentLoggers } from '../logger.js';

const logger = componentLoggers.security;

export const authRoutes = new Elysia({ prefix: '/api/v1/auth' })
    .get('/google', ({ query, set }) => {
        const { type } = query as { type?: string };

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/v1/auth/google/callback';

        if (!clientId || !clientSecret) {
            set.status = 500;
            return { error: 'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET' };
        }

        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        );

        // Determine scopes based on type
        let scopes = [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
        ];

        if (type === 'gdrive_oauth') {
            scopes.push('https://www.googleapis.com/auth/drive.readonly');
        } else if (type === 'gcalendar_oauth') {
            scopes.push('https://www.googleapis.com/auth/calendar.readonly');
        } else if (type === 'gmail_oauth') {
            scopes.push('https://www.googleapis.com/auth/gmail.readonly');
        }

        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            state: type // Pass type as state to retrieve it in callback
        });

        return Response.redirect(url);
    })

    .get('/google/callback', async ({ query, set }) => {
        const { code, state } = query as { code?: string; state?: string };

        if (!code) {
            set.status = 400;
            return 'No code provided';
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/v1/auth/google/callback';

        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        );

        try {
            const { tokens } = await oauth2Client.getToken(code);
            oauth2Client.setCredentials(tokens);

            logger.info({ state }, 'OAuth successful');

            // Return HTML that posts message to opener and closes
            set.headers['Content-Type'] = 'text/html';
            return `
                <html>
                    <body>
                        <h1>Authentication Successful</h1>
                        <p>You can close this window now.</p>
                        <script>
                            window.opener.postMessage({ 
                                type: 'OAUTH_SUCCESS', 
                                credentialType: '${state}',
                                tokens: ${JSON.stringify(tokens)}
                            }, '*');
                            window.close();
                        </script>
                    </body>
                </html>
            `;
        } catch (error) {
            logger.error({ error }, 'OAuth failed');
            set.status = 500;
            return 'Authentication failed';
        }
    });
