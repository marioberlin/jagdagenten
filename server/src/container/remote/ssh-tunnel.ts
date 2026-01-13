/**
 * SSH Tunnel for Remote Docker
 *
 * Creates SSH tunnels to reach Docker daemons on remote hosts.
 * This allows connecting to Docker over SSH without exposing the Docker socket.
 *
 * @see docs/LIQUID_CONTAINER_ARCHITECTURE.md - Section 6.2
 */

import { Client, type ConnectConfig } from 'ssh2';
import { createServer, type Server, type Socket } from 'net';
import Dockerode from 'dockerode';
import { componentLoggers } from '../../logger.js';

const log = componentLoggers.http.child({ component: 'ssh-tunnel' });

// ============================================================================
// Types
// ============================================================================

export interface SSHTunnelConfig {
    /** Remote host */
    host: string;
    /** SSH port (default: 22) */
    port?: number;
    /** SSH username */
    username: string;
    /** Private key content */
    privateKey: string;
    /** Passphrase for private key (if encrypted) */
    passphrase?: string;
    /** Remote Docker socket path (default: /var/run/docker.sock) */
    remoteSocket?: string;
    /** Connection timeout in ms (default: 10000) */
    timeout?: number;
    /** Keep-alive interval in ms (default: 10000) */
    keepaliveInterval?: number;
}

export interface TunnelConnection {
    /** Docker client connected via tunnel */
    client: Dockerode;
    /** Close the tunnel */
    close: () => Promise<void>;
    /** Check if tunnel is connected */
    isConnected: () => boolean;
    /** Tunnel statistics */
    stats: () => TunnelStats;
}

interface TunnelStats {
    /** When tunnel was created */
    createdAt: number;
    /** Total bytes forwarded */
    bytesForwarded: number;
    /** Active connections through tunnel */
    activeConnections: number;
    /** Total connections made */
    totalConnections: number;
}

// ============================================================================
// SSH Tunnel
// ============================================================================

export class SSHTunnel {
    private ssh: Client | null = null;
    private server: Server | null = null;
    private localPort: number = 0;
    private config: Required<Omit<SSHTunnelConfig, 'passphrase'>> & Pick<SSHTunnelConfig, 'passphrase'>;
    private connected = false;
    private stats: TunnelStats = {
        createdAt: 0,
        bytesForwarded: 0,
        activeConnections: 0,
        totalConnections: 0,
    };

    constructor(config: SSHTunnelConfig) {
        this.config = {
            port: 22,
            remoteSocket: '/var/run/docker.sock',
            timeout: 10000,
            keepaliveInterval: 10000,
            ...config,
        };
    }

    /**
     * Establish SSH tunnel and return Docker client
     */
    async connect(): Promise<TunnelConnection> {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`SSH connection timeout after ${this.config.timeout}ms`));
                this.close();
            }, this.config.timeout);

            this.ssh = new Client();

            this.ssh.on('ready', () => {
                clearTimeout(timeoutId);
                log.info({ host: this.config.host }, 'SSH connection established');

                this.setupLocalServer()
                    .then(() => {
                        this.connected = true;
                        this.stats.createdAt = Date.now();

                        const docker = new Dockerode({
                            host: '127.0.0.1',
                            port: this.localPort,
                        });

                        resolve({
                            client: docker,
                            close: () => this.close(),
                            isConnected: () => this.connected,
                            stats: () => ({ ...this.stats }),
                        });
                    })
                    .catch(reject);
            });

            this.ssh.on('error', (err) => {
                clearTimeout(timeoutId);
                log.error({ host: this.config.host, error: err.message }, 'SSH connection error');
                reject(err);
            });

            this.ssh.on('end', () => {
                log.info({ host: this.config.host }, 'SSH connection ended');
                this.connected = false;
            });

            this.ssh.on('close', () => {
                log.debug({ host: this.config.host }, 'SSH connection closed');
                this.connected = false;
            });

            const connectConfig: ConnectConfig = {
                host: this.config.host,
                port: this.config.port,
                username: this.config.username,
                privateKey: this.config.privateKey,
                passphrase: this.config.passphrase,
                keepaliveInterval: this.config.keepaliveInterval,
                readyTimeout: this.config.timeout,
            };

            log.debug({
                host: this.config.host,
                username: this.config.username,
            }, 'Connecting to SSH');

            this.ssh.connect(connectConfig);
        });
    }

    /**
     * Setup local TCP server that forwards to remote Unix socket
     */
    private async setupLocalServer(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.server = createServer((socket: Socket) => {
                this.handleConnection(socket);
            });

            this.server.on('error', (err) => {
                log.error({ error: err.message }, 'Local server error');
                reject(err);
            });

            // Listen on random available port
            this.server.listen(0, '127.0.0.1', () => {
                const address = this.server!.address();
                if (typeof address === 'object' && address) {
                    this.localPort = address.port;
                    log.info({ port: this.localPort }, 'Local tunnel server listening');
                    resolve();
                } else {
                    reject(new Error('Failed to get local server address'));
                }
            });
        });
    }

    /**
     * Handle incoming connection and forward to remote Docker socket
     */
    private handleConnection(localSocket: Socket): void {
        if (!this.ssh) {
            localSocket.destroy();
            return;
        }

        this.stats.totalConnections++;
        this.stats.activeConnections++;

        // Use openssh_forwardOutStreamLocal for Unix socket forwarding
        this.ssh.openssh_forwardOutStreamLocal(
            this.config.remoteSocket,
            (err, remoteStream) => {
                if (err) {
                    log.error({ error: err.message }, 'Failed to forward to remote socket');
                    localSocket.destroy();
                    this.stats.activeConnections--;
                    return;
                }

                // Track bytes forwarded
                localSocket.on('data', (chunk) => {
                    this.stats.bytesForwarded += chunk.length;
                });

                remoteStream.on('data', (chunk: Buffer) => {
                    this.stats.bytesForwarded += chunk.length;
                });

                // Pipe bidirectionally
                localSocket.pipe(remoteStream);
                remoteStream.pipe(localSocket);

                // Handle connection end
                localSocket.on('end', () => {
                    remoteStream.end();
                    this.stats.activeConnections--;
                });

                remoteStream.on('end', () => {
                    localSocket.end();
                    this.stats.activeConnections--;
                });

                // Handle errors
                localSocket.on('error', (err) => {
                    log.debug({ error: err.message }, 'Local socket error');
                    remoteStream.destroy();
                    this.stats.activeConnections--;
                });

                remoteStream.on('error', (err: Error) => {
                    log.debug({ error: err.message }, 'Remote stream error');
                    localSocket.destroy();
                    this.stats.activeConnections--;
                });
            }
        );
    }

    /**
     * Close the tunnel
     */
    async close(): Promise<void> {
        this.connected = false;

        if (this.server) {
            await new Promise<void>((resolve) => {
                this.server!.close(() => resolve());
            });
            this.server = null;
        }

        if (this.ssh) {
            this.ssh.end();
            this.ssh = null;
        }

        log.info({ host: this.config.host }, 'SSH tunnel closed');
    }

    /**
     * Get current connection status
     */
    isConnected(): boolean {
        return this.connected;
    }

    /**
     * Get tunnel statistics
     */
    getStats(): TunnelStats {
        return { ...this.stats };
    }
}

// ============================================================================
// Tunnel Manager
// ============================================================================

/**
 * Manages multiple SSH tunnels for remote Docker connections
 */
export class TunnelManager {
    private tunnels: Map<string, SSHTunnel> = new Map();
    private connections: Map<string, TunnelConnection> = new Map();

    /**
     * Get or create a tunnel for an endpoint
     */
    async getTunnel(endpointId: string, config: SSHTunnelConfig): Promise<TunnelConnection> {
        // Check for existing connection
        const existing = this.connections.get(endpointId);
        if (existing && existing.isConnected()) {
            return existing;
        }

        // Close any stale connection
        if (existing) {
            await existing.close();
            this.connections.delete(endpointId);
            this.tunnels.delete(endpointId);
        }

        // Create new tunnel
        const tunnel = new SSHTunnel(config);
        this.tunnels.set(endpointId, tunnel);

        const connection = await tunnel.connect();
        this.connections.set(endpointId, connection);

        return connection;
    }

    /**
     * Close a specific tunnel
     */
    async closeTunnel(endpointId: string): Promise<void> {
        const connection = this.connections.get(endpointId);
        if (connection) {
            await connection.close();
            this.connections.delete(endpointId);
            this.tunnels.delete(endpointId);
        }
    }

    /**
     * Close all tunnels
     */
    async closeAll(): Promise<void> {
        const closePromises = Array.from(this.connections.values()).map(c => c.close());
        await Promise.allSettled(closePromises);
        this.connections.clear();
        this.tunnels.clear();
    }

    /**
     * Get status of all tunnels
     */
    getStatus(): Map<string, { connected: boolean; stats: TunnelStats }> {
        const status = new Map<string, { connected: boolean; stats: TunnelStats }>();

        for (const [id, connection] of this.connections) {
            status.set(id, {
                connected: connection.isConnected(),
                stats: connection.stats(),
            });
        }

        return status;
    }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create an SSH tunnel connection to a remote Docker host
 */
export async function createSSHTunnel(config: SSHTunnelConfig): Promise<TunnelConnection> {
    const tunnel = new SSHTunnel(config);
    return tunnel.connect();
}

/**
 * Parse SSH URL and create tunnel config
 * Format: ssh://user@host:port or ssh://user@host
 */
export function parseSSHUrl(url: string, privateKey: string): SSHTunnelConfig {
    const parsed = new URL(url);

    if (parsed.protocol !== 'ssh:') {
        throw new Error(`Invalid SSH URL protocol: ${parsed.protocol}`);
    }

    return {
        host: parsed.hostname,
        port: parsed.port ? parseInt(parsed.port) : 22,
        username: parsed.username || 'deploy',
        privateKey,
    };
}
