/**
 * Core A2A Protocol Types
 *
 * This module contains TypeScript interfaces for the Agent2Agent (A2A) Protocol.
 * These types are generated from the A2A JSON Schema specification.
 */
// Enums
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
export var TransportProtocol;
(function (TransportProtocol) {
    TransportProtocol["JSONRPC"] = "JSONRPC";
    TransportProtocol["GRPC"] = "GRPC";
    TransportProtocol["HTTP_JSON"] = "HTTP+JSON";
})(TransportProtocol || (TransportProtocol = {}));
export var In;
(function (In) {
    In["COOKIE"] = "cookie";
    In["HEADER"] = "header";
    In["QUERY"] = "query";
})(In || (In = {}));
