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
export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

/**
 * Type alias for record with string keys and any values.
 */
export type Record<string, any> = Record<string, any>;

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
export abstract class BaseA2AModel {
  /**
   * Convert the model to a JSON object.
   */
  toJSON(options?: SerializationOptions): Record<string, any> {
    const result: Record<string, any> = {};

    for (const key in this) {
      if (Object.prototype.hasOwnProperty.call(this, key)) {
        const value = (this as any)[key];

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
  toJSONString(options?: SerializationOptions): string {
    return JSON.stringify(this.toJSON(options));
  }

  /**
   * Serialize a value for JSON output.
   */
  private serializeValue(value: any): any {
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
      const result: Record<string, any> = {};
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
  static fromJSON<T extends BaseA2AModel>(json: Record<string, any>): T {
    // This should be implemented by each concrete class
    throw new Error('Not implemented');
  }
}
