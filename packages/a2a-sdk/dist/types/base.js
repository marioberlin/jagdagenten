/**
 * Base class-like interface for A2A models with common methods.
 */
export class BaseA2AModel {
    /**
     * Convert the model to a JSON object.
     */
    toJSON(options) {
        const result = {};
        for (const key in this) {
            if (Object.prototype.hasOwnProperty.call(this, key)) {
                const value = this[key];
                if (value !== undefined || !options?.excludeUndefined) {
                    result[key] = this.serializeValue(value);
                }
            }
        }
        return result;
    }
    /**
     * Convert the model to a JSON string.
     */
    toJSONString(options) {
        return JSON.stringify(this.toJSON(options));
    }
    /**
     * Serialize a value for JSON output.
     */
    serializeValue(value) {
        if (value === null || value === undefined) {
            return value;
        }
        if (Array.isArray(value)) {
            return value.map(v => this.serializeValue(v));
        }
        if (typeof value === 'object' && typeof value.toJSON === 'function') {
            return value.toJSON();
        }
        if (typeof value === 'object' && typeof value === 'object') {
            const result = {};
            for (const key in value) {
                if (Object.prototype.hasOwnProperty.call(value, key)) {
                    result[key] = this.serializeValue(value[key]);
                }
            }
            return result;
        }
        return value;
    }
    /**
     * Create a model instance from a JSON object.
     */
    static fromJSON(json) {
        // This should be implemented by each concrete class
        throw new Error('Not implemented');
    }
}
