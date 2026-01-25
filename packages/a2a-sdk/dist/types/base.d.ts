/**
 * Base interface for all A2A models.
 * Provides common functionality for serialization and validation.
 */
export interface A2ABaseModel {
    [key: string]: any;
}
/**
 * Type alias for any JSON-serializable value.
 */
export type JSONValue = string | number | boolean | null | JSONValue[] | {
    [key: string]: JSONValue;
};
/**
 * Options for model serialization.
 */
export interface SerializationOptions {
    byAlias?: boolean;
    excludeUndefined?: boolean;
}
/**
 * Base class-like interface for A2A models with common methods.
 */
export declare abstract class BaseA2AModel {
    /**
     * Convert the model to a JSON object.
     */
    toJSON(options?: SerializationOptions): Record<string, any>;
    /**
     * Convert the model to a JSON string.
     */
    toJSONString(options?: SerializationOptions): string;
    /**
     * Serialize a value for JSON output.
     */
    private serializeValue;
    /**
     * Create a model instance from a JSON object.
     */
    static fromJSON<T extends BaseA2AModel>(json: Record<string, any>): T;
}
