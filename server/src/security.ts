/**
 * Security Middleware for LiquidCrypto Server
 * 
 * Features:
 * - Helmet-style security headers
 * - Input validation & sanitization
 * - Rate limiting (already in main server)
 * - Request size limits
 * - CORS configuration
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const HEALING_QUEUE_PATH = path.resolve(process.cwd(), 'healing_queue.json');

// ============ CSP NONCES ============
export function generateCSPNonce(): string {
    return crypto.randomBytes(16).toString('base64');
}

export function getCSPHeader(nonce: string): string {
    return [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' https://apis.google.com`,
        `style-src 'self' 'nonce-${nonce}' 'unsafe-inline'`,
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' wss: https: https://api.anthropic.com https://generativelanguage.googleapis.com",
        "frame-ancestors 'none'"
    ].join('; ');
}

// ============ SECURITY HEADERS ============
export function securityHeaders(nonce?: string): Record<string, string> {
    const csp = nonce ? getCSPHeader(nonce) : [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://api.anthropic.com https://generativelanguage.googleapis.com",
        "frame-ancestors 'none'"
    ].join('; ');

    return {
        // Prevent XSS attacks
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',

        // Content Security Policy
        'Content-Security-Policy': csp,

        // Referrer policy
        'Referrer-Policy': 'strict-origin-when-cross-origin',

        // Permissions policy
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',

        // HSTS (for HTTPS)
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    };
}

// ============ INPUT VALIDATION ============
const MAX_BODY_SIZE = 10 * 1024; // 10KB
const DANGEROUS_PATTERNS = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /eval\(/gi,
    /expression\(/gi
];

interface ValidationResult {
    valid: boolean;
    errors: string[];
}

export function validateRequest(body: unknown, maxSize = MAX_BODY_SIZE): ValidationResult {
    const errors: string[] = [];

    // Check if body is object
    if (body === null || body === undefined) {
        return { valid: true, errors: [] };
    }

    if (typeof body !== 'object') {
        return { valid: true, errors: [] };
    }

    const str = JSON.stringify(body);

    // Check size
    if (str.length > maxSize) {
        errors.push(`Request body exceeds ${maxSize} bytes`);
    }

    // Check for dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(str)) {
            errors.push('Request contains potentially dangerous content');
            break;
        }
    }

    return { valid: errors.length === 0, errors };
}

// Sanitize string input
export function sanitizeString(input: string): string {
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/['"`;]/g, '') // Remove quotes and semicolons
        .slice(0, 10000); // Limit length
}

// Validate API key format
export function validateApiKey(key: string): boolean {
    if (!key) return false;
    if (key.length < 20) return false;
    if (!/^[a-zA-Z0-9_-]+$/.test(key)) return false;
    return true;
}

// ============ RATE LIMITING UTILS ============
interface RateLimitEntry {
    count: number;
    resetTime: number;
}

export function createRateLimiter(
    maxRequests: number,
    windowMs: number
): (ip: string) => Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const store = new Map<string, RateLimitEntry>();

    return async (ip: string) => {
        const now = Date.now();
        const entry = store.get(ip);

        if (!entry || entry.resetTime < now) {
            store.set(ip, { count: 1, resetTime: now + windowMs });
            return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
        }

        if (entry.count >= maxRequests) {
            return { allowed: false, remaining: 0, resetTime: entry.resetTime };
        }

        entry.count++;
        return { allowed: true, remaining: maxRequests - entry.count, resetTime: entry.resetTime };
    };
}

// ============ CORS CONFIGURATION ============
interface CorsConfig {
    allowedOrigins: string[];
    allowCredentials: boolean;
}

export function getCorsHeaders(config?: Partial<CorsConfig>): Record<string, string> {
    const origins = config?.allowedOrigins || ['http://localhost:5173'];
    const origin = origins[0] || '*';

    const headers: Record<string, string> = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    };

    if (config?.allowCredentials) {
        headers['Access-Control-Allow-Credentials'] = 'true';
    }

    return headers;
}

// ============ REQUEST LOGGING ============
export function logRequest(
    method: string,
    path: string,
    ip: string,
    status: number,
    duration: number
): void {
    const log = {
        timestamp: new Date().toISOString(),
        method,
        path,
        ip: maskIp(ip),
        status,
        duration: `${duration}ms`
    };

    // In production, use proper logger
    if (status >= 400) {
        console.error('[Security] Failed request:', JSON.stringify(log));
    } else if (process.env.NODE_ENV === 'development') {
        console.log('[Security] Request:', JSON.stringify(log));
    }
}

function maskIp(ip: string): string {
    // Mask last octet for privacy
    return ip.replace(/\.\d+$/, '.xxx');
}

// ============ API KEY GENERATION ============
export function generateApiKey(): string {
    const prefix = 'lc_';
    const random = crypto.randomBytes(24).toString('hex');
    return prefix + random;
}

// ============ HEALING SYSTEM ============
export interface HealingTask {
    id: string;
    type: 'client_error' | 'server_error' | 'security_breach';
    message: string;
    stack?: string;
    context: Record<string, unknown>;
    timestamp: string;
    priority: 'high' | 'medium' | 'low';
}

export function appendToHealingQueue(task: Omit<HealingTask, 'id' | 'priority'>): void {
    const queue: HealingTask[] = fs.existsSync(HEALING_QUEUE_PATH)
        ? JSON.parse(fs.readFileSync(HEALING_QUEUE_PATH, 'utf8'))
        : [];

    const priority = task.type === 'security_breach' ? 'high' : 'medium';
    const healingTask: HealingTask = {
        ...task,
        id: crypto.randomBytes(8).toString('hex'),
        priority
    };

    queue.push(healingTask);
    fs.writeFileSync(HEALING_QUEUE_PATH, JSON.stringify(queue, null, 2));
    console.log(`[Healer] New task added to queue: ${healingTask.id} (${healingTask.type})`);
}

// ============ SECURITY AUDIT ============
export async function runSecurityAudit(report?: any): Promise<{
    score: number;
    issues: Array<{ severity: 'high' | 'medium' | 'low'; message: string }>;
    recommendations: string[];
}> {
    const issues: Array<{ severity: 'high' | 'medium' | 'low'; message: string }> = [];
    const recommendations: string[] = [];
    let score = 100;

    // Handle incoming client/manual report
    if (report && report.type === 'client_error') {
        issues.push({ severity: 'medium', message: `Client Error: ${report.message}` });
        score -= 5;

        // Trigger self-healing if it's a critical component
        if (report.context?.level === 'page' || report.context?.errorCount > 3) {
            appendToHealingQueue({
                type: 'client_error',
                message: report.message,
                stack: report.stack,
                context: report.context,
                timestamp: report.timestamp || new Date().toISOString()
            });
            recommendations.push(`Self-healing task triggered for ${report.context?.componentName || 'unknown'}`);
        }
    }

    // Check 1: API keys in environment
    if (!process.env.ANTHROPIC_API_KEY && !process.env.GEMINI_API_KEY) {
        issues.push({ severity: 'medium', message: 'No AI API keys configured' });
        score -= 10;
        recommendations.push('Add ANTHROPIC_API_KEY or GEMINI_API_KEY');
    }

    // Check 2: Redis connection
    if (!process.env.REDIS_URL) {
        issues.push({ severity: 'low', message: 'Redis not configured - using memory fallback' });
        recommendations.push('Configure REDIS_URL for better performance');
    }

    // Check 3: CORS origins
    if (process.env.ALLOWED_ORIGINS?.includes('*')) {
        issues.push({ severity: 'high', message: 'CORS allows all origins' });
        score -= 20;
        recommendations.push('Restrict ALLOWED_ORIGINS to specific domains');
    }

    // Check 4: Request size limit
    recommendations.push('Consider adding a request size limit middleware');

    // Check 5: HTTPS in production
    if (process.env.NODE_ENV === 'production') {
        recommendations.push('Ensure HTTPS is enforced in production');
    }

    return {
        score: Math.max(0, score),
        issues,
        recommendations
    };
}

// ============ EXPORTS ============
export type { ValidationResult };
// ============ EXPORTS ============
