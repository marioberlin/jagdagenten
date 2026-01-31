/**
 * Structured Logging with Pino
 *
 * Provides JSON-formatted logs in production and pretty-printed logs in development.
 * Supports request-scoped child loggers for correlation.
 *
 * @see docs/IMPLEMENTATION_PLAN.md - Item 3.1 Structured Logging
 */

import pino, { Logger, LoggerOptions } from 'pino';

// Determine environment
const isDevelopment = process.env.NODE_ENV === 'development';
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

// Logger configuration
const options: LoggerOptions = {
    level: logLevel,
    base: {
        service: 'liquid-glass-server',
        version: process.env.npm_package_version || '0.1.0',
        env: process.env.NODE_ENV || 'development'
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
        level: (label) => ({ level: label })
    }
};

// Use pino-pretty transport in development for readable output
if (isDevelopment) {
    options.transport = {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname,service,version,env',
            messageFormat: '{msg}',
            singleLine: false
        }
    };
}

// Create the base logger
export const logger: Logger = pino(options);

/**
 * Create a child logger with request context
 * Use this for per-request logging to correlate logs
 */
export function createRequestLogger(
    requestId: string,
    userId?: string,
    additionalContext?: Record<string, unknown>
): Logger {
    return logger.child({
        requestId,
        ...(userId && { userId }),
        ...additionalContext
    });
}

/**
 * Pre-configured component loggers for different parts of the system
 */
export const componentLoggers = {
    redis: logger.child({ component: 'redis' }),
    cache: logger.child({ component: 'cache' }),
    ai: logger.child({ component: 'ai' }),
    websocket: logger.child({ component: 'websocket' }),
    security: logger.child({ component: 'security' }),
    http: logger.child({ component: 'http' }),
    graphql: logger.child({ component: 'graphql' }),
    db: logger.child({ component: 'db' }),
    agents: logger.child({ component: 'agents' }),
    nats: logger.child({ component: 'nats' })
};

/**
 * Log AI request with performance metrics
 */
export function logAIRequest(
    requestLogger: Logger,
    provider: 'gemini' | 'claude',
    params: {
        duration: number;
        cached: boolean;
        promptLength: number;
        responseLength?: number;
        error?: Error;
    }
): void {
    const { duration, cached, promptLength, responseLength, error } = params;

    if (error) {
        requestLogger.error({
            provider,
            duration,
            cached,
            promptLength,
            error: {
                message: error.message,
                name: error.name
            }
        }, 'AI request failed');
    } else {
        requestLogger.info({
            provider,
            duration,
            cached,
            promptLength,
            responseLength
        }, 'AI request completed');
    }
}

/**
 * Log cache operation with metrics
 */
export function logCacheOperation(
    operation: 'get' | 'set' | 'del' | 'hit' | 'miss',
    params: {
        key: string;
        ttl?: number;
        duration?: number;
        layer?: 'memory' | 'redis';
    }
): void {
    const { key, ttl, duration, layer } = params;
    const cacheLog = componentLoggers.cache;

    // Mask sensitive parts of keys
    const safeKey = key.replace(/ai:(gemini|claude):([a-f0-9]+)/g, 'ai:$1:*****');

    const logData = {
        operation,
        key: safeKey,
        ...(ttl !== undefined && { ttl }),
        ...(duration !== undefined && { duration }),
        ...(layer && { layer })
    };

    if (operation === 'miss') {
        cacheLog.debug(logData, 'Cache miss');
    } else if (operation === 'hit') {
        cacheLog.debug(logData, 'Cache hit');
    } else {
        cacheLog.trace(logData, `Cache ${operation}`);
    }
}

/**
 * Log WebSocket event
 */
export function logWebSocketEvent(
    event: 'connect' | 'disconnect' | 'message' | 'subscribe' | 'broadcast' | 'error',
    params: {
        clientId: string;
        userId?: string;
        symbol?: string;
        channel?: string;
        error?: Error;
    }
): void {
    const wsLog = componentLoggers.websocket;
    const { clientId, userId, symbol, channel, error } = params;

    const logData = {
        event,
        clientId,
        ...(userId && { userId }),
        ...(symbol && { symbol }),
        ...(channel && { channel })
    };

    if (error) {
        wsLog.error({ ...logData, error: { message: error.message } }, `WebSocket ${event} error`);
    } else if (event === 'error') {
        wsLog.warn(logData, `WebSocket ${event}`);
    } else {
        wsLog.info(logData, `WebSocket ${event}`);
    }
}

/**
 * Log security event
 */
export function logSecurityEvent(
    event: 'rate_limit' | 'auth_failure' | 'suspicious' | 'blocked',
    params: {
        ip: string;
        path?: string;
        method?: string;
        reason?: string;
        userId?: string;
    }
): void {
    const secLog = componentLoggers.security;
    const { ip, path, method, reason, userId } = params;

    const logData = {
        event,
        ip,
        ...(path && { path }),
        ...(method && { method }),
        ...(reason && { reason }),
        ...(userId && { userId })
    };

    if (event === 'blocked' || event === 'suspicious') {
        secLog.warn(logData, `Security: ${event}`);
    } else {
        secLog.info(logData, `Security: ${event}`);
    }
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
    return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

export default logger;
