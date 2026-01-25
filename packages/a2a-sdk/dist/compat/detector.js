/**
 * A2A Protocol Version Detector
 *
 * Automatically detects whether a request is v0.x or v1.0 format
 * based on headers, method names, and body structure.
 */
import { A2A_HEADERS, A2A_PROTOCOL_VERSION } from '../types/v1.js';
/**
 * Detect the A2A protocol version from request headers and body
 *
 * Detection priority:
 * 1. A2A-Protocol-Version header
 * 2. Method name casing (PascalCase = v1.0, lowercase/slashed = v0.x)
 * 3. Body field names (camelCase = v1.0, snake_case = v0.x)
 * 4. Part discriminator (member presence = v1.0, 'kind' field = v0.x)
 *
 * @param headers Request headers
 * @param body Request body
 * @returns Detected protocol version
 */
export function detectRequestVersion(headers, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
body) {
    // 1. Check header first (most reliable)
    if (headers) {
        const versionHeader = headers[A2A_HEADERS.PROTOCOL_VERSION] ||
            headers[A2A_HEADERS.PROTOCOL_VERSION.toLowerCase()] ||
            headers['a2a-protocol-version'];
        if (versionHeader === '1.0' || versionHeader === A2A_PROTOCOL_VERSION) {
            return '1.0';
        }
        if (versionHeader && versionHeader.startsWith('0.')) {
            return '0.x';
        }
    }
    // No body to analyze
    if (!body || typeof body !== 'object') {
        return '1.0'; // Default to v1.0
    }
    // 2. Check method name format
    if (body.method && typeof body.method === 'string') {
        // PascalCase method (e.g., "SendMessage") = v1.0
        if (/^[A-Z][a-zA-Z]+$/.test(body.method)) {
            return '1.0';
        }
        // Slashed method (e.g., "message/send") = v0.x
        if (body.method.includes('/')) {
            return '0.x';
        }
    }
    // 3. Check params structure
    if (body.params && typeof body.params === 'object') {
        const params = body.params;
        // Check message structure
        if (params.message) {
            const message = params.message;
            // v0.x uses 'kind' field on messages
            if (message.kind === 'message') {
                return '0.x';
            }
            // v0.x uses message_id, v1.0 uses messageId
            if ('message_id' in message) {
                return '0.x';
            }
            if ('messageId' in message) {
                return '1.0';
            }
            // v0.x uses context_id, v1.0 uses contextId
            if ('context_id' in message) {
                return '0.x';
            }
            if ('contextId' in message) {
                return '1.0';
            }
            // Check part format
            if (Array.isArray(message.parts) && message.parts.length > 0) {
                return detectPartVersion(message.parts[0]);
            }
        }
        // Check task ID param naming
        if ('task_id' in params) {
            return '0.x';
        }
        if ('taskId' in params || 'id' in params) {
            // 'id' is ambiguous but more v1.0-like
            // Check for other snake_case fields
            if ('history_length' in params || 'push_notification_config' in params) {
                return '0.x';
            }
            return '1.0';
        }
        // Check configuration structure
        if (params.configuration) {
            const config = params.configuration;
            if ('accepted_output_modes' in config || 'history_length' in config) {
                return '0.x';
            }
            if ('acceptedOutputModes' in config || 'historyLength' in config) {
                return '1.0';
            }
        }
    }
    // 4. Check result structure (for responses)
    if (body.result && typeof body.result === 'object') {
        const result = body.result;
        // Task response
        if ('context_id' in result) {
            return '0.x';
        }
        if ('contextId' in result) {
            return '1.0';
        }
        // Message response
        if ('message_id' in result) {
            return '0.x';
        }
        if ('messageId' in result) {
            return '1.0';
        }
        // AgentCard response
        if ('protocol_version' in result) {
            return '0.x';
        }
        if ('protocolVersions' in result) {
            return '1.0';
        }
    }
    // Default to v1.0 for unknown/ambiguous cases
    return '1.0';
}
/**
 * Detect protocol version from a Part object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function detectPartVersion(part) {
    if (!part || typeof part !== 'object') {
        return '1.0';
    }
    // v0.x uses 'kind' field for discrimination
    if ('kind' in part) {
        return '0.x';
    }
    // v1.0 uses member presence (text, file, data)
    if ('text' in part || 'file' in part || 'data' in part) {
        return '1.0';
    }
    return '1.0';
}
/**
 * Check if a request is v1.0 format
 */
export function isV1Request(headers, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
body) {
    return detectRequestVersion(headers, body) === '1.0';
}
/**
 * Check if a request is v0.x format
 */
export function isV0Request(headers, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
body) {
    return detectRequestVersion(headers, body) === '0.x';
}
/**
 * Get the protocol version header value to include in responses
 */
export function getProtocolVersionHeader(version) {
    return version === '1.0' ? A2A_PROTOCOL_VERSION : '0.9';
}
