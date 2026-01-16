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
            // 1. Copy the file (this creates it in service account's Drive temporarily)
            const copyResponse = await this.drive.files.copy({
                fileId: templateId,
                requestBody: {
                    name: title || `LiquidCrypto Smart Sheet - ${new Date().toLocaleDateString()}`,
                },
                // Explicitly set the destination - if user has a folder shared with service account,
                // we could use parents: [folderId] to copy directly there
            });

            const newFileId = copyResponse.data.id;
            if (!newFileId) {
                throw new Error('Failed to create file copy');
            }

            // 2. Transfer ownership to the user
            // This moves the file from service account's Drive to user's Drive
            // and frees up the service account's storage quota
            try {
                await this.drive.permissions.create({
                    fileId: newFileId,
                    requestBody: {
                        role: 'owner',
                        type: 'user',
                        emailAddress: userEmail,
                    },
                    transferOwnership: true, // This is required for owner role
                    sendNotificationEmail: true, // User gets email about ownership transfer
                });
                logger.info({ newFileId, userEmail }, 'Smart Sheet ownership transferred to user');
            } catch (ownershipError: any) {
                // If ownership transfer fails (e.g., different domain), fall back to writer access
                logger.warn({ error: ownershipError.message }, 'Could not transfer ownership, granting writer access instead');
                await this.drive.permissions.create({
                    fileId: newFileId,
                    requestBody: {
                        role: 'writer',
                        type: 'user',
                        emailAddress: userEmail,
                    },
                    sendNotificationEmail: false,
                });
            }

            logger.info({ newFileId, userEmail }, 'Smart Sheet created and shared');

            return {
                id: newFileId,
                url: `https://docs.google.com/spreadsheets/d/${newFileId}/edit`,
                name: copyResponse.data.name
            };

        } catch (error: any) {
            // Check if it's a quota error and provide helpful message
            if (error.code === 403 && error.message?.includes('quota')) {
                logger.error({ error }, 'Service account storage quota exceeded. Consider cleaning up old files or transferring ownership of existing sheets.');
                throw new Error('Storage quota exceeded. The service account cannot create more files. Please contact support.');
            }
            logger.error({ error }, 'Failed to create Smart Sheet');
            throw error;
        }
    }

    /**
     * Shares the Master Template with the user (Reader access)
     * so they can copy it using their own credentials/quota.
     */
    async shareMasterTemplate(userEmail: string) {
        const templateId = process.env.GOOGLE_MASTER_TEMPLATE_ID;
        if (!templateId) {
            throw new Error('GOOGLE_MASTER_TEMPLATE_ID is not configured');
        }

        try {
            await this.drive.permissions.create({
                fileId: templateId,
                requestBody: {
                    role: 'reader',
                    type: 'user',
                    emailAddress: userEmail,
                },
                sendNotificationEmail: false,
            });
            logger.info({ userEmail, templateId }, 'Shared Master Template with user');
            return { success: true, templateId };
        } catch (error: any) {
            logger.error({ error }, 'Failed to share Master Template');
            // If already shared or public, this might fail, but we can usually ignore it or handle specific codes
            throw error;
        }
    }
}

export const templateService = new TemplateService();
