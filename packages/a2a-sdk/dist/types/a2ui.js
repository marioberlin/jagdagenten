/**
 * A2UI (Agent-to-UI) Types
 *
 * Type definitions for A2UI protocol extension enabling agents to render
 * rich interactive UI components.
 *
 * Based on Google's A2UI specification with LiquidCrypto extensions.
 */
/**
 * Resolve a text value to actual string
 */
export function resolveTextValue(value, model, itemContext) {
    if (typeof value === 'string') {
        return value;
    }
    if ('literalString' in value) {
        return value.literalString;
    }
    if ('path' in value) {
        return resolvePathValue(value.path, model, itemContext);
    }
    return '';
}
/**
 * Resolve a path to its value in the model
 */
export function resolvePathValue(path, model, itemContext) {
    // Item context paths don't start with /
    if (!path.startsWith('/') && itemContext) {
        const value = itemContext[path];
        return formatValue(value);
    }
    // Model paths start with /
    if (!model)
        return '';
    const parts = path.split('/').filter(Boolean);
    let current = model;
    for (const part of parts) {
        if (typeof current !== 'object' || current === null) {
            return '';
        }
        current = current[part];
    }
    return formatValue(current);
}
function formatValue(value) {
    if (value === null || value === undefined)
        return '';
    if (typeof value === 'string')
        return value;
    if (typeof value === 'number') {
        // Format numbers nicely
        if (Number.isInteger(value) && value >= 1000) {
            return value.toLocaleString();
        }
        return value.toString();
    }
    if (typeof value === 'boolean')
        return value.toString();
    return JSON.stringify(value);
}
// ============================================================================
// Type Guards
// ============================================================================
export function isBeginRenderingMessage(msg) {
    return msg.type === 'beginRendering';
}
export function isSurfaceUpdateMessage(msg) {
    return msg.type === 'surfaceUpdate';
}
export function isSetModelMessage(msg) {
    return msg.type === 'setModel';
}
export function isActionResponseMessage(msg) {
    return msg.type === 'actionResponse';
}
export function isEndRenderingMessage(msg) {
    return msg.type === 'endRendering';
}
// ============================================================================
// Component Type Detection
// ============================================================================
export function getComponentType(component) {
    return Object.keys(component)[0];
}
export function isTextComponent(component) {
    return 'Text' in component;
}
export function isButtonComponent(component) {
    return 'Button' in component;
}
export function isLayoutComponent(component) {
    return 'Row' in component || 'Column' in component || 'Card' in component;
}
export function isInputComponent(component) {
    return 'TextField' in component || 'Slider' in component || 'Checkbox' in component || 'Select' in component;
}
export function isListComponent(component) {
    return 'List' in component;
}
/**
 * Extract A2UI messages from an artifact
 * Supports both legacy format (type: 'a2ui', a2ui: [...]) and DataPart format (data: { type: 'a2ui', a2ui: [...] })
 */
export function extractA2UIMessages(artifact) {
    const messages = [];
    for (const part of artifact.parts) {
        // New DataPart format: { data: { type: 'a2ui', a2ui: [...] } }
        if ('data' in part && part.data.type === 'a2ui') {
            const a2ui = part.data.a2ui;
            if (Array.isArray(a2ui)) {
                messages.push(...a2ui);
            }
        }
        // Legacy format: { type: 'a2ui', a2ui: [...] }
        else if ('type' in part && part.type === 'a2ui' && 'a2ui' in part) {
            const a2ui = part.a2ui;
            if (Array.isArray(a2ui)) {
                messages.push(...a2ui);
            }
        }
    }
    return messages;
}
/**
 * Check if an artifact contains A2UI content
 * Supports both legacy format (type: 'a2ui') and DataPart format (data: { type: 'a2ui' })
 */
export function isA2UIArtifact(artifact) {
    return artifact.parts.some(part =>
        // New DataPart format
        ('data' in part && part.data.type === 'a2ui') ||
        // Legacy format
        ('type' in part && part.type === 'a2ui' && 'a2ui' in part)
    );
}
/**
 * Create an A2UI data part
 */
export function createA2UIPart(messages) {
    return {
        data: {
            type: 'a2ui',
            a2ui: messages,
        },
    };
}
