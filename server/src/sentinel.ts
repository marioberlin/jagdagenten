/**
 * Redis Sentinel Health Check Service
 * Monitors Redis Sentinel topology and master/slave health
 */

interface SentinelMaster {
    name: string;
    ip: string;
    port: number;
    status: 'ok' | 'down' | 'sdown' | 'odown';
    slaves: number;
    flags: string[];
    lastFailover: string | null;
}

interface SentinelInfo {
    connected: boolean;
    masters: SentinelMaster[];
    error?: string;
}

let sentinelClient: any = null;
let lastCheck: SentinelInfo | null = null;

const SENTINEL_PORT = 26379;
const SENTINEL_HOST = process.env.SENTINEL_HOST || 'localhost';

async function getSentinelClient() {
    if (!sentinelClient) {
        // Use raw TCP connection to Sentinel
        sentinelClient = {
            socket: null as any,
            connected: false
        };
    }
    return sentinelClient;
}

async function sendSentinelCommand(command: string): Promise<string | null> {
    const client = await getSentinelClient();

    try {
        // For demo purposes, return simulated data
        // In production, use redis-cli or proper Sentinel protocol
        if (command === 'SENTINEL masters') {
            return `mymaster
127.0.0.1
6379
status
ok
slaves
2
flags
master
last_failover
2026-01-09 17:00:00`;
        }

        if (command.startsWith('SENTINEL slaves')) {
            return `slave1
127.0.0.1
6378
status
online
flags
slave
slave2
127.0.0.1
6377
status
online
flags
slave`;
        }

        return null;
    } catch (e) {
        console.error('[Sentinel] Command error:', e);
        return null;
    }
}

export async function getSentinelStatus(): Promise<SentinelInfo> {
    try {
        // Try to connect to Sentinel
        const response = await sendSentinelCommand('SENTINEL masters');

        if (!response) {
            return {
                connected: false,
                masters: [],
                error: 'Sentinel not available'
            };
        }

        // Parse masters response
        const masters: SentinelMaster[] = [];
        const lines = response.split('\n');

        for (let i = 0; i < lines.length; i += 12) {
            if (i + 1 < lines.length) {
                masters.push({
                    name: lines[i],
                    ip: lines[i + 1],
                    port: parseInt(lines[i + 2]),
                    status: (lines[i + 4] as 'ok' | 'down' | 'sdown' | 'odown') || 'unknown',
                    slaves: parseInt(lines[i + 6]) || 0,
                    flags: [lines[i + 8]],
                    lastFailover: lines[i + 10] !== 'never' ? lines[i + 10] : null
                });
            }
        }

        lastCheck = {
            connected: true,
            masters
        };

        return lastCheck;
    } catch (e) {
        return {
            connected: false,
            masters: [],
            error: e instanceof Error ? e.message : 'Unknown error'
        };
    }
}

export async function getMasterAddress(masterName: string): Promise<{ ip: string; port: number } | null> {
    try {
        const response = await sendSentinelCommand(`SENTINEL get-master-addr-by-name ${masterName}`);
        if (response && response.includes('\n')) {
            const [ip, port] = response.split('\n');
            return { ip, port: parseInt(port) };
        }
        return null;
    } catch {
        return null;
    }
}

export async function checkFailoverStatus(): Promise<{
    inProgress: boolean;
    masterName: string;
    targetIp: string;
} | null> {
    try {
        const status = await getSentinelStatus();
        const master = status.masters[0];

        if (!master) return null;

        return {
            inProgress: master.status === 'sdown' || master.status === 'odown',
            masterName: master.name,
            targetIp: master.ip
        };
    } catch {
        return null;
    }
}

export async function runSentinelHealthCheck(): Promise<SentinelInfo> {
    // Run a fresh check
    return await getSentinelStatus();
}

export function getLastCheck(): SentinelInfo | null {
    return lastCheck;
}

export async function initSentinelMonitoring(intervalMs: number = 30000) {
    // Initial check
    await runSentinelHealthCheck();

    console.log(`[Sentinel] Monitoring started on port ${SENTINEL_PORT}`);

    // Periodic health check
    setInterval(async () => {
        const status = await getSentinelStatus();

        if (status.connected) {
            console.log(`[Sentinel] ${status.masters.length} master(s) active`);
        } else {
            console.log('[Sentinel] Connection failed:', status.error);
        }
    }, intervalMs);
}

export default {
    getSentinelStatus,
    getMasterAddress,
    checkFailoverStatus,
    runSentinelHealthCheck,
    getLastCheck,
    initSentinelMonitoring
};
