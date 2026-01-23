import { Elysia } from 'elysia';

/**
 * OAuth and Authentication Routes
 *
 * Handles OAuth flows for:
 * - Google Drive OAuth
 * - Gmail OAuth
 * - Google Calendar OAuth
 * - API Token validation
 */

// OAuth configuration from environment
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/v1/auth/google/callback';

// Scopes for different credential types
const SCOPES: Record<string, string[]> = {
    gmail_oauth: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
    ],
    gdrive_oauth: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.readonly',
    ],
    gcalendar_oauth: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
    ],
};

// Temporary state storage for OAuth flow (in production, use Redis)
const oauthStates = new Map<string, { type: string; timestamp: number }>();

// Cleanup old states every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [state, data] of oauthStates.entries()) {
        if (now - data.timestamp > 10 * 60 * 1000) { // 10 minute expiry
            oauthStates.delete(state);
        }
    }
}, 5 * 60 * 1000);

export const authRoutes = new Elysia({ prefix: '/api/v1/auth' })
    /**
     * Initiate Google OAuth flow
     * GET /api/v1/auth/google?type=gdrive_oauth|gmail_oauth|gcalendar_oauth
     */
    .get('/google', ({ query, set }) => {
        const credentialType = query.type as string;

        if (!credentialType || !SCOPES[credentialType]) {
            set.status = 400;
            return errorPage('Invalid credential type. Must be: gmail_oauth, gdrive_oauth, or gcalendar_oauth');
        }

        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
            set.status = 500;
            return errorPage('Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
        }

        // Generate state token
        const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        oauthStates.set(state, { type: credentialType, timestamp: Date.now() });

        // Build OAuth URL
        const scopes = SCOPES[credentialType];
        const params = new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            redirect_uri: GOOGLE_REDIRECT_URI,
            response_type: 'code',
            scope: scopes.join(' '),
            access_type: 'offline',
            prompt: 'consent',
            state,
        });

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

        // Return HTML page that performs the redirect client-side
        // This avoids issues with Elysia CORS middleware consuming 302 status
        set.headers['content-type'] = 'text/html';
        return `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${authUrl}"></head><body><p>Redirecting to Google...</p><script>window.location.href="${authUrl}";</script></body></html>`;
    })

    /**
     * Google OAuth callback handler
     * GET /api/v1/auth/google/callback?code=...&state=...
     */
    .get('/google/callback', async ({ query, set }) => {
        set.headers['content-type'] = 'text/html; charset=utf-8';

        const code = query.code as string;
        const state = query.state as string;
        const error = query.error as string;

        if (error) {
            return errorPage(`OAuth Error: ${error}`);
        }

        if (!code || !state) {
            set.status = 400;
            return errorPage('Missing code or state parameter');
        }

        // Verify state
        const stateData = oauthStates.get(state);
        if (!stateData) {
            set.status = 400;
            return errorPage('Invalid or expired state token. Please try again.');
        }
        oauthStates.delete(state);

        try {
            // Exchange code for tokens
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: GOOGLE_CLIENT_ID!,
                    client_secret: GOOGLE_CLIENT_SECRET!,
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: GOOGLE_REDIRECT_URI,
                }),
            });

            if (!tokenResponse.ok) {
                const errorData = await tokenResponse.text();
                console.error('Token exchange failed:', errorData);
                return errorPage('Failed to exchange authorization code for tokens.');
            }

            const tokens = await tokenResponse.json();

            // Return success page that posts message to parent window
            return successPage(stateData.type, tokens);
        } catch (err) {
            console.error('OAuth callback error:', err);
            return errorPage('An error occurred during authentication.');
        }
    })

    /**
     * Validate an API token
     * POST /api/v1/auth/validate
     */
    .post('/validate', async ({ body, set }) => {
        const { type, token } = body as { type: string; token: string };

        if (!type || !token) {
            set.status = 400;
            return { valid: false, error: 'Missing type or token' };
        }

        try {
            let valid = false;
            let details: Record<string, any> = {};

            switch (type) {
                case 'anthropic':
                    // Validate Anthropic API key
                    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
                        method: 'POST',
                        headers: {
                            'x-api-key': token,
                            'anthropic-version': '2023-06-01',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            model: 'claude-3-haiku-20240307',
                            max_tokens: 1,
                            messages: [{ role: 'user', content: 'Hi' }],
                        }),
                    });
                    valid = anthropicRes.ok || anthropicRes.status === 400; // 400 means valid key, just bad request
                    details = { provider: 'Anthropic', checked: new Date().toISOString() };
                    break;

                case 'openai':
                    // Validate OpenAI API key
                    const openaiRes = await fetch('https://api.openai.com/v1/models', {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                    valid = openaiRes.ok;
                    details = { provider: 'OpenAI', checked: new Date().toISOString() };
                    break;

                case 'google':
                    // Validate Google API key (Gemini)
                    const googleRes = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${token}`);
                    valid = googleRes.ok;
                    details = { provider: 'Google', checked: new Date().toISOString() };
                    break;

                default:
                    // For other types, just check if token is non-empty
                    valid = token.length > 10;
                    details = { provider: type, checked: new Date().toISOString() };
            }

            return { valid, details };
        } catch (err) {
            console.error('Token validation error:', err);
            return { valid: false, error: 'Validation request failed' };
        }
    })

    /**
     * Refresh Google OAuth tokens
     * POST /api/v1/auth/refresh
     */
    .post('/refresh', async ({ body, set }) => {
        const { refresh_token } = body as { refresh_token: string };

        if (!refresh_token) {
            set.status = 400;
            return { error: 'Missing refresh_token' };
        }

        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
            set.status = 500;
            return { error: 'Google OAuth credentials not configured' };
        }

        try {
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: GOOGLE_CLIENT_ID,
                    client_secret: GOOGLE_CLIENT_SECRET,
                    refresh_token,
                    grant_type: 'refresh_token',
                }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Token refresh failed:', errorData);
                set.status = 400;
                return { error: 'Failed to refresh tokens' };
            }

            const tokens = await response.json();
            return { success: true, tokens };
        } catch (err) {
            console.error('Token refresh error:', err);
            set.status = 500;
            return { error: 'Token refresh request failed' };
        }
    });

// Helper: Generate error page HTML
function errorPage(message: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Authentication Error</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
        }
        .container {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            padding: 40px;
            max-width: 400px;
            text-align: center;
        }
        .icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        h1 {
            font-size: 24px;
            margin: 0 0 16px 0;
        }
        p {
            color: rgba(255,255,255,0.6);
            margin: 0 0 24px 0;
            line-height: 1.5;
        }
        button {
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
        }
        button:hover {
            background: rgba(255,255,255,0.15);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">❌</div>
        <h1>Authentication Failed</h1>
        <p>${escapeHtml(message)}</p>
        <button onclick="window.close()">Close Window</button>
    </div>
</body>
</html>
    `.trim();
}

// Helper: Generate success page HTML that posts message to parent
function successPage(credentialType: string, tokens: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Authentication Successful</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
        }
        .container {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            padding: 40px;
            max-width: 400px;
            text-align: center;
        }
        .icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        h1 {
            font-size: 24px;
            margin: 0 0 16px 0;
            color: #4ade80;
        }
        p {
            color: rgba(255,255,255,0.6);
            margin: 0;
            line-height: 1.5;
        }
        .spinner {
            width: 24px;
            height: 24px;
            border: 2px solid rgba(255,255,255,0.1);
            border-top-color: #4ade80;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 16px auto 0;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">✅</div>
        <h1>Connected!</h1>
        <p>Authentication successful. This window will close automatically.</p>
        <div class="spinner"></div>
    </div>
    <script>
        // Post message to parent window
        if (window.opener) {
            window.opener.postMessage({
                type: 'OAUTH_SUCCESS',
                credentialType: '${escapeHtml(credentialType)}',
                tokens: ${JSON.stringify(tokens)}
            }, '*');
        }
        // Close after short delay
        setTimeout(() => window.close(), 2000);
    </script>
</body>
</html>
    `.trim();
}

// Helper: Escape HTML to prevent XSS
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
