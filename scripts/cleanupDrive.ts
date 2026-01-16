#!/usr/bin/env bun
/**
 * Cleanup script for Google Drive Service Account
 * 
 * This script lists and deletes files from the service account's Drive
 * to free up storage quota. It only deletes files created by the service account.
 * 
 * Usage:
 *   bun run scripts/cleanupDrive.ts --list          # List all files
 *   bun run scripts/cleanupDrive.ts --delete-all    # Delete all files
 *   bun run scripts/cleanupDrive.ts --delete-old 24 # Delete files older than 24 hours
 */

import { google } from 'googleapis';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Load environment variables from server/.env manually
const envPath = resolve(import.meta.dir, '../server/.env');
const envContent = readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
        let value = match[2].trim();
        // Handle quoted values
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        envVars[match[1].trim()] = value;
    }
});

const clientEmail = envVars.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = envVars.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!clientEmail || !privateKey) {
    console.error('❌ Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY');
    console.error('Make sure server/.env has the correct credentials');
    process.exit(1);
}

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: clientEmail,
        private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

interface DriveFile {
    id: string;
    name: string;
    createdTime: string;
    size?: string;
    mimeType: string;
}

async function listFiles(): Promise<DriveFile[]> {
    const files: DriveFile[] = [];
    let pageToken: string | undefined;

    do {
        const response = await drive.files.list({
            pageSize: 100,
            pageToken,
            fields: 'nextPageToken, files(id, name, createdTime, size, mimeType)',
            q: "trashed = false",
        });

        if (response.data.files) {
            files.push(...response.data.files.map(f => ({
                id: f.id!,
                name: f.name!,
                createdTime: f.createdTime!,
                size: f.size,
                mimeType: f.mimeType!,
            })));
        }

        pageToken = response.data.nextPageToken ?? undefined;
    } while (pageToken);

    return files;
}

async function deleteFile(fileId: string): Promise<void> {
    await drive.files.delete({ fileId });
}

async function getStorageQuota(): Promise<{ used: number; limit: number }> {
    const about = await drive.about.get({
        fields: 'storageQuota',
    });

    return {
        used: parseInt(about.data.storageQuota?.usage || '0', 10),
        limit: parseInt(about.data.storageQuota?.limit || '0', 10),
    };
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    console.log('🔍 Google Drive Service Account Cleanup Tool');
    console.log(`📧 Account: ${clientEmail}\n`);

    // Get storage quota
    try {
        const quota = await getStorageQuota();
        console.log(`📊 Storage: ${formatBytes(quota.used)} / ${formatBytes(quota.limit)} (${((quota.used / quota.limit) * 100).toFixed(1)}% used)\n`);
    } catch (e) {
        console.log('⚠️  Could not fetch storage quota\n');
    }

    // List files
    const files = await listFiles();
    console.log(`📁 Found ${files.length} files\n`);

    if (command === '--list' || !command) {
        if (files.length === 0) {
            console.log('No files found in Drive.');
            return;
        }

        console.log('Files in Drive:');
        console.log('─'.repeat(80));
        files.forEach(f => {
            const date = new Date(f.createdTime).toLocaleString();
            const size = f.size ? formatBytes(parseInt(f.size, 10)) : 'N/A';
            console.log(`  ${f.name}`);
            console.log(`    ID: ${f.id} | Created: ${date} | Size: ${size}`);
        });
        console.log('─'.repeat(80));
        console.log(`\nTo delete all files: bun run scripts/cleanupDrive.ts --delete-all`);
        console.log(`To delete old files: bun run scripts/cleanupDrive.ts --delete-old 24`);
    }

    if (command === '--delete-all') {
        console.log('🗑️  Deleting all files...\n');
        let deleted = 0;
        let failed = 0;

        for (const file of files) {
            try {
                await deleteFile(file.id);
                console.log(`  ✅ Deleted: ${file.name}`);
                deleted++;
            } catch (e: any) {
                console.log(`  ❌ Failed: ${file.name} - ${e.message}`);
                failed++;
            }
        }

        console.log(`\n🎉 Deleted ${deleted} files, ${failed} failed`);
    }

    if (command === '--delete-old') {
        const hoursOld = parseInt(args[1] || '24', 10);
        const cutoff = Date.now() - hoursOld * 60 * 60 * 1000;
        const oldFiles = files.filter(f => new Date(f.createdTime).getTime() < cutoff);

        console.log(`🗑️  Deleting files older than ${hoursOld} hours (${oldFiles.length} files)...\n`);
        let deleted = 0;

        for (const file of oldFiles) {
            try {
                await deleteFile(file.id);
                console.log(`  ✅ Deleted: ${file.name}`);
                deleted++;
            } catch (e: any) {
                console.log(`  ❌ Failed: ${file.name} - ${e.message}`);
            }
        }

        console.log(`\n🎉 Deleted ${deleted} files`);
    }
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
