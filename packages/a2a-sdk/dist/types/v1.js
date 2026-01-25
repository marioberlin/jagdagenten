/**
 * A2A Protocol v1.0 Types
 *
 * This module contains TypeScript interfaces compliant with A2A Protocol v1.0 specification.
 * Key differences from v0.x:
 * - camelCase naming convention for JSON fields
 * - Part discriminator uses member presence instead of 'kind' field
 * - Method names use PascalCase
 * - New fields: protocolVersions, supportedInterfaces, AgentCardSignature
 */
// ============================================================================
// Enums (unchanged from v0.x)
// ============================================================================
export var Role;
(function (Role) {
    Role["USER"] = "user";
    Role["AGENT"] = "agent";
})(Role || (Role = {}));
export var TaskState;
(function (TaskState) {
    TaskState["SUBMITTED"] = "submitted";
    TaskState["WORKING"] = "working";
    TaskState["INPUT_REQUIRED"] = "input-required";
    TaskState["COMPLETED"] = "completed";
    TaskState["CANCELED"] = "canceled";
    TaskState["FAILED"] = "failed";
    TaskState["REJECTED"] = "rejected";
    TaskState["AUTH_REQUIRED"] = "auth-required";
    TaskState["UNKNOWN"] = "unknown";
})(TaskState || (TaskState = {}));
// Type guards for Part discrimination
export function isTextPart(part) {
    return 'text' in part && typeof part.text === 'string';
}
export function isFilePart(part) {
    return 'file' in part && typeof part.file === 'object';
}
export function isDataPart(part) {
    return 'data' in part && !('text' in part) && !('file' in part);
}
// Type guards for events
export function isStatusUpdateEvent(event) {
    return 'status' in event;
}
export function isArtifactUpdateEvent(event) {
    return 'artifact' in event;
}
// v1.0 Method Names (PascalCase)
export const V1_METHODS = {
    SEND_MESSAGE: 'SendMessage',
    GET_TASK: 'GetTask',
    CANCEL_TASK: 'CancelTask',
    LIST_TASKS: 'ListTasks',
    SET_TASK_PUSH_NOTIFICATION_CONFIG: 'SetTaskPushNotificationConfig',
    GET_TASK_PUSH_NOTIFICATION_CONFIG: 'GetTaskPushNotificationConfig',
    DELETE_TASK_PUSH_NOTIFICATION_CONFIG: 'DeleteTaskPushNotificationConfig',
    RESUBSCRIBE: 'Resubscribe',
    GET_AUTHENTICATED_EXTENDED_CARD: 'GetAuthenticatedExtendedCard',
};
// ============================================================================
// Error Types (v1.0 - same error codes)
// ============================================================================
export const A2A_ERROR_CODES = {
    PARSE_ERROR: -32700,
    INVALID_REQUEST: -32600,
    METHOD_NOT_FOUND: -32601,
    INVALID_PARAMS: -32602,
    INTERNAL_ERROR: -32603,
    TASK_NOT_FOUND: -32001,
    TASK_NOT_CANCELABLE: -32002,
    PUSH_NOTIFICATION_NOT_SUPPORTED: -32003,
    UNSUPPORTED_OPERATION: -32004,
    CONTENT_TYPE_NOT_SUPPORTED: -32005,
    INVALID_AGENT_RESPONSE: -32006,
    AUTHENTICATED_EXTENDED_CARD_NOT_CONFIGURED: -32007,
};
export function createA2AError(code, message, data) {
    return { code, message, data };
}
// ============================================================================
// Protocol Version
// ============================================================================
export const A2A_PROTOCOL_VERSION = '1.0';
export const A2A_HEADERS = {
    PROTOCOL_VERSION: 'A2A-Protocol-Version',
    REQUEST_ID: 'A2A-Request-Id',
};
