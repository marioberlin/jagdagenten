/**
 * A2A Protocol Version Detector
 *
 * Automatically detects whether a request is v0.x or v1.0 format
 * based on headers, method names, and body structure.
 */
export type ProtocolVersion = '0.x' | '1.0';
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
export declare function detectRequestVersion(headers?: Record<string, string | undefined>, body?: any): ProtocolVersion;
/**
 * Check if a request is v1.0 format
 */
export declare function isV1Request(headers?: Record<string, string | undefined>, body?: any): boolean;
/**
 * Check if a request is v0.x format
 */
export declare function isV0Request(headers?: Record<string, string | undefined>, body?: any): boolean;
/**
 * Get the protocol version header value to include in responses
 */
export declare function getProtocolVersionHeader(version: ProtocolVersion): string;
