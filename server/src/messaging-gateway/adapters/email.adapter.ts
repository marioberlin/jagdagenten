/**
 * Email Adapter
 * 
 * Uses nodemailer for sending and IMAP for receiving emails.
 * Supports Gmail, Outlook, and custom SMTP/IMAP servers.
 */

import { EventEmitter } from 'events';
import { BaseChannelAdapter, registerAdapter } from './base.adapter';
import type { ChannelConfig, NormalizedMessage, NormalizedResponse, GatewayEvent } from '../types';

// ============================================================================
// Email Adapter
// ============================================================================

export class EmailAdapter extends BaseChannelAdapter {
    readonly channelType = 'email' as const;
    readonly displayName = 'Email';

    private transporter: any = null;
    private imapClient: any = null;
    private pollInterval: ReturnType<typeof setInterval> | null = null;
    private processedUids = new Set<number>();

    constructor(config: ChannelConfig) {
        super(config);
    }

    async start(): Promise<void> {
        if (!this.config.enabled) return;

        const smtp = this.config.smtp;
        const imap = this.config.imap;

        if (!smtp?.host || !smtp?.user || !smtp?.pass) {
            throw new Error('Email SMTP configuration required (host, user, pass)');
        }

        try {
            // Set up SMTP transporter
            const nodemailer = await import('nodemailer');

            this.transporter = nodemailer.createTransport({
                host: smtp.host,
                port: smtp.port ?? 587,
                secure: smtp.secure ?? false,
                auth: {
                    user: smtp.user,
                    pass: smtp.pass,
                },
            });

            // Verify connection
            await this.transporter.verify();
            console.info('[Email] SMTP connected');

            // Set up IMAP if configured
            if (imap?.host && imap?.user && imap?.pass) {
                await this.startImapListener(imap);
            }

            this.emit('event', {
                type: 'connection',
                channelType: this.channelType,
                data: { status: 'connected' },
            } as GatewayEvent);

        } catch (error) {
            console.error('[Email] Failed to start:', error);
            throw error;
        }
    }

    async stop(): Promise<void> {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        if (this.imapClient) {
            this.imapClient.end();
            this.imapClient = null;
        }
        this.transporter = null;
    }

    async send(channelId: string, response: NormalizedResponse): Promise<string> {
        if (!this.transporter) throw new Error('Email not connected');

        const fromAddress = this.config.smtp?.user || 'noreply@example.com';
        const fromName = this.config.fromName || 'LiquidOS';

        const mailOptions: any = {
            from: `"${fromName}" <${fromAddress}>`,
            to: channelId,
            subject: response.subject || 'Message from LiquidOS',
            text: response.text || '',
            html: response.html,
        };

        // Add attachments
        if (response.media?.length) {
            mailOptions.attachments = response.media.map(m => ({
                filename: m.filename || 'attachment',
                path: m.url,
                contentType: m.type,
            }));
        }

        const info = await this.transporter.sendMail(mailOptions);
        return info.messageId;
    }

    async reply(message: NormalizedMessage, response: NormalizedResponse): Promise<string> {
        // Set reply headers
        const replyResponse = {
            ...response,
            subject: response.subject || `Re: ${(message.raw as any)?.subject || 'Your message'}`,
        };

        return this.send(message.from.id, replyResponse);
    }

    async sendTyping(channelId: string): Promise<void> {
        // Email doesn't support typing indicators
    }

    async handleWebhook(request: Request): Promise<Response> {
        // Handle email webhooks (e.g., SendGrid inbound parse)
        try {
            const contentType = request.headers.get('content-type') || '';

            if (contentType.includes('multipart/form-data')) {
                // Parse SendGrid-style webhook
                const formData = await request.formData();

                const from = formData.get('from') as string;
                const to = formData.get('to') as string;
                const subject = formData.get('subject') as string;
                const text = formData.get('text') as string;
                const html = formData.get('html') as string;

                if (from && text) {
                    const normalized = this.normalizeWebhookEmail({
                        from,
                        to,
                        subject,
                        text,
                        html,
                    });

                    this.handleIncomingMessage(normalized);
                }

                return new Response('OK', { status: 200 });
            }

            return new Response('Unsupported content type', { status: 400 });
        } catch (error) {
            console.error('[Email] Webhook error:', error);
            return new Response('Error', { status: 500 });
        }
    }

    getWebhookPath(): string {
        return '/webhooks/email';
    }

    private async startImapListener(imap: any): Promise<void> {
        const Imap = (await import('imap')).default;

        this.imapClient = new Imap({
            user: imap.user,
            password: imap.pass,
            host: imap.host,
            port: imap.port ?? 993,
            tls: imap.tls ?? true,
            tlsOptions: { rejectUnauthorized: false },
        });

        this.imapClient.on('ready', () => {
            console.info('[Email] IMAP connected');

            // Start polling for new emails
            this.pollInterval = setInterval(async () => {
                await this.pollInbox();
            }, this.config.imapPollInterval ?? 30000);

            // Initial poll
            this.pollInbox();
        });

        this.imapClient.on('error', (err: any) => {
            console.error('[Email] IMAP error:', err);
        });

        this.imapClient.connect();
    }

    private async pollInbox(): Promise<void> {
        if (!this.imapClient) return;

        return new Promise((resolve) => {
            this.imapClient.openBox('INBOX', false, (err: any, box: any) => {
                if (err) {
                    console.error('[Email] Failed to open INBOX:', err);
                    return resolve();
                }

                // Search for unseen messages
                this.imapClient.search(['UNSEEN'], (err: any, uids: number[]) => {
                    if (err || !uids.length) return resolve();

                    const newUids = uids.filter(uid => !this.processedUids.has(uid));
                    if (!newUids.length) return resolve();

                    const fetch = this.imapClient.fetch(newUids, {
                        bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
                        struct: true,
                    });

                    fetch.on('message', (msg: any, seqno: number) => {
                        let headers: any = {};
                        let body = '';

                        msg.on('body', (stream: any, info: any) => {
                            let buffer = '';
                            stream.on('data', (chunk: Buffer) => {
                                buffer += chunk.toString('utf8');
                            });
                            stream.on('end', () => {
                                if (info.which === 'TEXT') {
                                    body = buffer;
                                } else {
                                    headers = this.parseImapHeaders(buffer);
                                }
                            });
                        });

                        msg.on('attributes', (attrs: any) => {
                            this.processedUids.add(attrs.uid);

                            // Keep set manageable
                            if (this.processedUids.size > 1000) {
                                const arr = Array.from(this.processedUids);
                                this.processedUids = new Set(arr.slice(-500));
                            }
                        });

                        msg.on('end', () => {
                            if (headers.from) {
                                const normalized = this.normalizeImapEmail(headers, body);
                                this.handleIncomingMessage(normalized);
                            }
                        });
                    });

                    fetch.on('end', () => resolve());
                    fetch.on('error', () => resolve());
                });
            });
        });
    }

    private parseImapHeaders(headerText: string): Record<string, string> {
        const headers: Record<string, string> = {};
        const lines = headerText.split('\n');

        for (const line of lines) {
            const match = line.match(/^(\w+(?:-\w+)?): (.*)$/i);
            if (match) {
                headers[match[1].toLowerCase()] = match[2].trim();
            }
        }

        return headers;
    }

    private normalizeImapEmail(headers: any, body: string): NormalizedMessage {
        const fromMatch = headers.from?.match(/(?:"?([^"]*)"?\s)?<?(\S+@\S+)>?/);
        const fromName = fromMatch?.[1] || fromMatch?.[2] || headers.from;
        const fromEmail = fromMatch?.[2] || headers.from;

        return {
            id: `email-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            channelType: 'email',
            channelId: fromEmail,
            threadId: headers.subject,
            from: {
                id: fromEmail,
                displayName: fromName,
            },
            text: body.trim(),
            media: [],
            timestamp: headers.date ? new Date(headers.date) : new Date(),
            isGroup: false,
            isMention: true, // All emails are direct
            raw: { headers, body },
        };
    }

    private normalizeWebhookEmail(data: any): NormalizedMessage {
        const fromMatch = data.from?.match(/(?:"?([^"]*)"?\s)?<?(\S+@\S+)>?/);
        const fromName = fromMatch?.[1] || fromMatch?.[2] || data.from;
        const fromEmail = fromMatch?.[2] || data.from;

        return {
            id: `email-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            channelType: 'email',
            channelId: fromEmail,
            threadId: data.subject,
            from: {
                id: fromEmail,
                displayName: fromName,
            },
            text: data.text || '',
            html: data.html,
            media: [],
            timestamp: new Date(),
            isGroup: false,
            isMention: true,
            raw: data,
        };
    }
}

// Register adapter
registerAdapter('email', (config) => new EmailAdapter(config));

export default EmailAdapter;
