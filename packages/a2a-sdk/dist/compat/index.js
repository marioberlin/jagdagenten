/**
 * A2A Protocol Compatibility Layer
 *
 * Provides bidirectional conversion between v0.x and v1.0 formats,
 * allowing the SDK to interoperate with agents using different protocol versions.
 */
// Version detection
export { detectRequestVersion, isV0Request, isV1Request, getProtocolVersionHeader, } from './detector.js';
// Part normalization
export { normalizePartToV0, normalizePartToV1, } from './normalizer.js';
// Message normalization
export { normalizeMessageToV0, normalizeMessageToV1, } from './normalizer.js';
// Artifact normalization
export { normalizeArtifactToV0, normalizeArtifactToV1, } from './normalizer.js';
// Task normalization
export { normalizeTaskToV0, normalizeTaskToV1, normalizeStatusToV0, normalizeStatusToV1, } from './normalizer.js';
// Event normalization
export { normalizeEventToV0, normalizeEventToV1, } from './normalizer.js';
// Agent Card normalization
export { normalizeAgentCardToV0, normalizeAgentCardToV1, } from './normalizer.js';
// Method name normalization
export { normalizeMethodNameToV0, normalizeMethodNameToV1, } from './normalizer.js';
// Full request/response normalization
export { normalizeRequestToV1, normalizeResponseToV0, } from './normalizer.js';
