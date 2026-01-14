import { google } from 'googleapis';
import { componentLoggers } from '../../logger.js';

const logger = componentLoggers.http; // Reuse HTTP logger for now, or create a new one

export class TemplateService {
    private auth;
    private drive;
    private sheets;

    constructor() {
        const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (!clientEmail || !privateKey) {
            logger.warn('Google Service Account credentials missing. TemplateService will fail.');
        }

        this.auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
            scopes: [
                'https://www.googleapis.com/auth/drive',
                'https://www.googleapis.com/auth/spreadsheets'
            ],
        });

        this.drive = google.drive({ version: 'v3', auth: this.auth });
        this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    }

    /**
     * Clones the Master Template sheet and shares it with the target user.
     * @returns The new file ID and URL.
     */
    async createSmartSheet(userEmail: string, title?: string) {
        const templateId = process.env.GOOGLE_MASTER_TEMPLATE_ID;
        if (!templateId) {
            throw new Error('GOOGLE_MASTER_TEMPLATE_ID is not configured');
        }

        logger.info({ userEmail, templateId }, 'Cloning Smart Sheet template');

        try {
            // 1. Copy the file
            const copyResponse = await this.drive.files.copy({
                fileId: templateId,
                requestBody: {
                    name: title || `LiquidCrypto Smart Sheet - ${new Date().toLocaleDateString()}`,
                },
            });

            const newFileId = copyResponse.data.id;
            if (!newFileId) {
                throw new Error('Failed to create file copy');
            }

            // 2. Share with the user
            await this.drive.permissions.create({
                fileId: newFileId,
                requestBody: {
                    role: 'writer', // 'writer' = Editor
                    type: 'user',
                    emailAddress: userEmail,
                },
                // We don't need to send a notification email if the app opens it immediately, 
                // but usually good for discovery. Default is true.
                sendNotificationEmail: false
            });

            logger.info({ newFileId, userEmail }, 'Smart Sheet created and shared');

            return {
                id: newFileId,
                url: `https://docs.google.com/spreadsheets/d/${newFileId}/edit`,
                name: copyResponse.data.name
            };

        } catch (error) {
            logger.error({ error }, 'Failed to create Smart Sheet');
            throw error;
        }
    }
}

export const templateService = new TemplateService();
