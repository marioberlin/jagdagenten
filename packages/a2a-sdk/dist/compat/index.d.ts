/**
 * A2A Protocol Compatibility Layer
 *
 * Provides bidirectional conversion between v0.x and v1.0 formats,
 * allowing the SDK to interoperate with agents using different protocol versions.
 */
export { detectRequestVersion, isV0Request, isV1Request, getProtocolVersionHeader, type ProtocolVersion, } from './detector.js';
export { normalizePartToV0, normalizePartToV1, } from './normalizer.js';
export { normalizeMessageToV0, normalizeMessageToV1, } from './normalizer.js';
export { normalizeArtifactToV0, normalizeArtifactToV1, } from './normalizer.js';
export { normalizeTaskToV0, normalizeTaskToV1, normalizeStatusToV0, normalizeStatusToV1, } from './normalizer.js';
export { normalizeEventToV0, normalizeEventToV1, } from './normalizer.js';
export { normalizeAgentCardToV0, normalizeAgentCardToV1, } from './normalizer.js';
export { normalizeMethodNameToV0, normalizeMethodNameToV1, } from './normalizer.js';
export { normalizeRequestToV1, normalizeResponseToV0, } from './normalizer.js';
