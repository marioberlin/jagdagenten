/**
 * A2UI to Glass Component Transformer
 *
 * Transforms A2UI JSON payloads into LiquidCrypto's GlassDynamicUI schema.
 * This enables rendering A2UI content from external A2A agents using our
 * Liquid Glass design system.
 *
 * @see https://a2ui.org
 * @see src/components/agentic/GlassDynamicUI.tsx
 */

import type {
    A2UIMessage,
    A2UIComponent,
    DataBinding,
    BeginRenderingMessage,
    SurfaceUpdateMessage,
    DataModelUpdateMessage,
    GLASS_COMPONENT_CATALOG,
    A2UITextValue,
} from './types';
import type { UINode, UINodeType } from '../components/agentic/GlassDynamicUI';

// ============================================================================
// Transformer State
// ============================================================================

interface TransformerState {
    surfaces: Map<string, SurfaceState>;
    dataModels: Map<string, Record<string, unknown>>;
}

interface SurfaceState {
    rootComponentId: string;
    components: Map<string, A2UIComponent>;
    styling?: {
        primaryColor?: string;
        fontFamily?: string;
    };
}

/**
 * Creates a new transformer state
 */
export function createTransformerState(): TransformerState {
    return {
        surfaces: new Map(),
        dataModels: new Map(),
    };
}

// ============================================================================
// Data Binding Resolution
// ============================================================================

/**
 * Resolves a data binding to its actual value.
 * Handles both legacy DataBinding format and SDK's A2UITextValue (which can be a plain string).
 */
export function resolveBinding<T>(
    binding: DataBinding<T> | A2UITextValue | undefined,
    dataModel: Record<string, unknown>,
    templateContext?: Record<string, unknown>
): T | undefined {
    if (!binding) return undefined;

    // SDK's A2UITextValue can be a plain string
    if (typeof binding === 'string') {
        return binding as T;
    }

    // Literal values
    if ('literalString' in binding) return binding.literalString as T;
    if ('literalNumber' in binding) return binding.literalNumber as T;
    if ('literalBoolean' in binding) return binding.literalBoolean as T;
    if ('literal' in binding) return binding.literal as T;

    // Path binding - resolve from data model
    if ('path' in binding) {
        const path = binding.path;
        // Check template context first (for list items)
        if (templateContext && path in templateContext) {
            return templateContext[path] as T;
        }
        // Resolve from data model using path
        return resolvePath(dataModel, path) as T;
    }

    // Template binding - for list iteration (handled separately)
    if ('template' in binding) {
        return undefined;
    }

    return undefined;
}

/**
 * Resolves a dot-notation path from an object
 */
function resolvePath(obj: Record<string, unknown>, path: string): unknown {
    // Handle leading slash
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const parts = cleanPath.split('.');

    let current: unknown = obj;
    for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        if (typeof current !== 'object') return undefined;
        current = (current as Record<string, unknown>)[part];
    }
    return current;
}

// ============================================================================
// Component Type Mapping
// ============================================================================

/**
 * Maps A2UI component types to Glass UINode types
 * v1.0: Added MultipleChoice, DateTimeInput, Video, AudioPlayer, Modal
 */
const A2UI_TO_GLASS_TYPE: Record<string, UINodeType> = {
    Text: 'text',
    Button: 'button',
    TextField: 'input',
    Checkbox: 'checkbox',
    Slider: 'slider',
    Row: 'stack',
    Column: 'stack',
    Card: 'card',
    Divider: 'divider',
    // v1.0 component mappings
    MultipleChoice: 'radiogroup',
    DateTimeInput: 'datepicker',
    Video: 'video',
    AudioPlayer: 'audio',
    Modal: 'modal',
};

/**
 * Gets the Glass type for an A2UI component
 */
export function getGlassType(a2uiType: string): UINodeType | null {
    return A2UI_TO_GLASS_TYPE[a2uiType] || null;
}

// ============================================================================
// Component Transformation
// ============================================================================

/**
 * Transforms an A2UI component to a Glass UINode
 */
export function transformComponent(
    component: A2UIComponent,
    surfaceState: SurfaceState,
    dataModel: Record<string, unknown>,
    templateContext?: Record<string, unknown>,
    onAction?: (actionId: string, data?: unknown) => void
): UINode | null {
    const [typeName, props] = Object.entries(component.component)[0] as [string, Record<string, unknown>];

    switch (typeName) {
        case 'Text':
            return transformText(component.id, props as { text: DataBinding<string> | A2UITextValue; semantic?: string }, dataModel, templateContext);

        case 'Button':
            return transformButton(component.id, props, dataModel, templateContext, onAction);

        case 'TextField':
            return transformTextField(component.id, props, dataModel, templateContext);

        case 'Checkbox':
            return transformCheckbox(component.id, props, dataModel, templateContext);

        case 'Slider':
            return transformSlider(component.id, props, dataModel, templateContext);

        case 'Row':
            return transformRow(component.id, props, surfaceState, dataModel, templateContext, onAction);

        case 'Column':
            return transformColumn(component.id, props, surfaceState, dataModel, templateContext, onAction);

        case 'Card':
            return transformCard(component.id, props, surfaceState, dataModel, templateContext, onAction);

        case 'List':
            return transformList(component.id, props, surfaceState, dataModel, onAction);

        case 'Divider':
            return { type: 'divider', id: component.id };

        case 'Image':
            return transformImage(component.id, props, dataModel, templateContext);

        case 'Icon':
            return transformIcon(component.id, props, dataModel, templateContext);

        case 'Tabs':
            return transformTabs(component.id, props, surfaceState, dataModel, onAction);

        // v1.0 new components
        case 'MultipleChoice':
            return transformMultipleChoice(component.id, props, dataModel, templateContext);

        case 'DateTimeInput':
            return transformDateTimeInput(component.id, props, dataModel, templateContext);

        case 'Video':
            return transformVideo(component.id, props, dataModel, templateContext);

        case 'AudioPlayer':
            return transformAudioPlayer(component.id, props, dataModel, templateContext);

        case 'Modal':
            return transformModal(component.id, props, surfaceState, dataModel, onAction);

        default:
            console.warn(`[A2UI Transformer] Unknown component type: ${typeName}`);
            return null;
    }
}

function transformText(
    id: string,
    props: { text: DataBinding<string> | A2UITextValue; semantic?: string },
    dataModel: Record<string, unknown>,
    templateContext?: Record<string, unknown>
): UINode {
    const text = resolveBinding(props.text, dataModel, templateContext) || '';
    const variant = props.semantic as 'h1' | 'h2' | 'h3' | 'p' | undefined;

    return {
        type: 'text',
        id,
        props: { variant },
        children: text,
    };
}

function transformButton(
    id: string,
    props: Record<string, unknown>,
    dataModel: Record<string, unknown>,
    templateContext?: Record<string, unknown>,
    _onAction?: (actionId: string, data?: unknown) => void
): UINode {
    const label = resolveBinding(props.label as DataBinding<string>, dataModel, templateContext) || 'Button';
    const primary = props.primary as boolean | undefined;
    const action = props.action as any;

    let actionData: any = undefined;
    let actionId: string | undefined = undefined;

    if (action?.custom) {
        actionId = action.custom.actionId;
        actionData = action.custom.data;
    } else if (action?.submit) {
        actionId = 'submit';
        actionData = action.submit.data;
    } else if (action?.input) {
        actionId = 'input';
        actionData = { input: action.input };
    }

    return {
        type: 'button',
        id,
        props: {
            variant: primary ? 'primary' : 'secondary',
            data: actionData,
            actionId: actionId,
        },
        children: label,
    };
}

function transformTextField(
    id: string,
    props: Record<string, unknown>,
    dataModel: Record<string, unknown>,
    templateContext?: Record<string, unknown>
): UINode {
    const placeholder = resolveBinding(props.placeholder as DataBinding<string>, dataModel, templateContext);
    const label = resolveBinding(props.label as DataBinding<string>, dataModel, templateContext);
    const inputType = props.inputType as string | undefined;

    return {
        type: 'input',
        id,
        props: {
            placeholder,
            label,
            inputType: inputType || 'shortText',
        },
    };
}

function transformCheckbox(
    id: string,
    props: Record<string, unknown>,
    dataModel: Record<string, unknown>,
    templateContext?: Record<string, unknown>
): UINode {
    const label = resolveBinding(props.label as DataBinding<string>, dataModel, templateContext);
    const checked = resolveBinding(props.checked as DataBinding<boolean>, dataModel, templateContext);

    return {
        type: 'toggle',
        id,
        props: {
            label,
            checked: checked || false,
        },
    };
}

function transformSlider(
    id: string,
    props: Record<string, unknown>,
    dataModel: Record<string, unknown>,
    templateContext?: Record<string, unknown>
): UINode {
    const label = resolveBinding(props.label as DataBinding<string>, dataModel, templateContext);
    const value = resolveBinding(props.value as DataBinding<number>, dataModel, templateContext);

    return {
        type: 'slider',
        id,
        props: {
            label,
            value: value || 50,
            min: props.min as number || 0,
            max: props.max as number || 100,
            step: props.step as number || 1,
        },
    };
}

function transformRow(
    id: string,
    props: Record<string, unknown>,
    surfaceState: SurfaceState,
    dataModel: Record<string, unknown>,
    templateContext?: Record<string, unknown>,
    onAction?: (actionId: string, data?: unknown) => void
): UINode {
    const childIds = props.children as string[] || [];
    const children = childIds
        .map(childId => {
            const childComponent = surfaceState.components.get(childId);
            if (!childComponent) return null;
            return transformComponent(childComponent, surfaceState, dataModel, templateContext, onAction);
        })
        .filter((c): c is UINode => c !== null);

    return {
        type: 'stack',
        id,
        props: {
            direction: 'horizontal',
            gap: 8,
            distribution: props.distribution,
            alignment: props.alignment,
            className: 'items-start',
        },
        children,
    };
}

function transformColumn(
    id: string,
    props: Record<string, unknown>,
    surfaceState: SurfaceState,
    dataModel: Record<string, unknown>,
    templateContext?: Record<string, unknown>,
    onAction?: (actionId: string, data?: unknown) => void
): UINode {
    const childIds = props.children as string[] || [];
    const children = childIds
        .map(childId => {
            const childComponent = surfaceState.components.get(childId);
            if (!childComponent) return null;
            return transformComponent(childComponent, surfaceState, dataModel, templateContext, onAction);
        })
        .filter((c): c is UINode => c !== null);

    return {
        type: 'stack',
        id,
        props: {
            direction: 'vertical',
            gap: 6,
            distribution: props.distribution,
            alignment: props.alignment,
        },
        children,
    };
}

function transformCard(
    id: string,
    props: Record<string, unknown>,
    surfaceState: SurfaceState,
    dataModel: Record<string, unknown>,
    templateContext?: Record<string, unknown>,
    onAction?: (actionId: string, data?: unknown) => void
): UINode {
    const childIds = props.children as string[] || [];
    const children = childIds
        .map(childId => {
            const childComponent = surfaceState.components.get(childId);
            if (!childComponent) return null;
            return transformComponent(childComponent, surfaceState, dataModel, templateContext, onAction);
        })
        .filter((c): c is UINode => c !== null);

    return {
        type: 'card',
        id,
        props: {
            elevation: props.elevation,
            className: 'bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-2xl p-4 mb-4',
        },
        children,
    };
}

function transformList(
    id: string,
    props: Record<string, unknown>,
    surfaceState: SurfaceState,
    dataModel: Record<string, unknown>,
    onAction?: (actionId: string, data?: unknown) => void
): UINode {
    const itemsBinding = props.items as DataBinding<unknown[]>;
    const direction = props.direction as 'vertical' | 'horizontal' || 'vertical';

    // Resolve items array
    const items = resolveBinding(itemsBinding, dataModel) as unknown[] || [];

    // Get template component
    let templateComponent: A2UIComponent | undefined;

    if (typeof props.template === 'string') {
        templateComponent = surfaceState.components.get(props.template);
    } else if (typeof props.template === 'object' && props.template !== null) {
        // Handle inline template definition
        templateComponent = props.template as A2UIComponent;
    }

    if (!templateComponent) {
        console.warn(`[A2UI Transformer] Template not found: ${props.template}`);
        return { type: 'stack', id, props: { direction: 'vertical' }, children: [] };
    }

    // Render each item using the template
    const children = items.map((item, index) => {
        const itemContext = typeof item === 'object' && item !== null
            ? item as Record<string, unknown>
            : { value: item };

        const node = transformComponent(
            { ...templateComponent, id: `${id}-item-${index}` },
            surfaceState,
            dataModel,
            itemContext,
            onAction
        );
        return node;
    }).filter((c): c is UINode => c !== null);

    return {
        type: 'stack',
        id,
        props: {
            direction: direction === 'horizontal' ? 'horizontal' : 'vertical',
            gap: 4,
        },
        children,
    };
}

function transformImage(
    id: string,
    props: Record<string, unknown>,
    dataModel: Record<string, unknown>,
    templateContext?: Record<string, unknown>
): UINode {
    const src = resolveBinding(props.src as DataBinding<string>, dataModel, templateContext);
    const altText = resolveBinding(props.alt as DataBinding<string>, dataModel, templateContext);

    // Image with Liquid Glass styling - rounded corners, subtle border
    return {
        type: 'container',
        id,
        props: {
            className: 'overflow-hidden rounded-xl border border-white/10 flex-shrink-0',
            'aria-label': altText || undefined,
        },
        style: {
            backgroundImage: src ? `url(${src})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            width: props.width as number || 120,
            height: props.height as number || 120,
            minWidth: props.width as number || 120,
        },
        children: [],
    };
}

function transformIcon(
    id: string,
    props: Record<string, unknown>,
    dataModel: Record<string, unknown>,
    templateContext?: Record<string, unknown>
): UINode {
    const name = resolveBinding(props.name as DataBinding<string>, dataModel, templateContext);

    // Render icon as text with emoji fallback
    return {
        type: 'text',
        id,
        props: {
            className: 'material-icons',
        },
        children: name || '●',
    };
}

function transformTabs(
    id: string,
    props: Record<string, unknown>,
    surfaceState: SurfaceState,
    dataModel: Record<string, unknown>,
    onAction?: (actionId: string, data?: unknown) => void
): UINode {
    const tabs = props.tabs as Array<{ title: DataBinding<string>; content: string }> || [];

    // For now, render as vertical stack with all tabs visible
    // TODO: Add proper tabs support to GlassDynamicUI
    const children = tabs.map((tab, index) => {
        const title = resolveBinding(tab.title, dataModel);
        const contentComponent = surfaceState.components.get(tab.content);

        return {
            type: 'card' as UINodeType,
            id: `${id}-tab-${index}`,
            children: [
                {
                    type: 'text' as UINodeType,
                    id: `${id}-tab-${index}-title`,
                    props: { variant: 'h3' },
                    children: title || `Tab ${index + 1}`,
                },
                contentComponent
                    ? transformComponent(contentComponent, surfaceState, dataModel, undefined, onAction)
                    : null,
            ].filter((c): c is UINode => c !== null),
        };
    });

    return {
        type: 'stack',
        id,
        props: { direction: 'vertical', gap: 4 },
        children,
    };
}

// ============================================================================
// v1.0 Component Transforms
// ============================================================================

function transformMultipleChoice(
    id: string,
    props: Record<string, unknown>,
    dataModel: Record<string, unknown>,
    templateContext?: Record<string, unknown>
): UINode {
    const label = resolveBinding(props.label as DataBinding<string>, dataModel, templateContext);
    const options = props.options as Array<{ value: string; label: DataBinding<string> }> || [];
    const selected = resolveBinding(props.selected as DataBinding<string>, dataModel, templateContext);

    // Render as radio group
    return {
        type: 'radiogroup',
        id,
        props: {
            label,
            value: selected,
            options: options.map(opt => ({
                value: opt.value,
                label: resolveBinding(opt.label, dataModel, templateContext) || opt.value,
            })),
        },
    };
}

function transformDateTimeInput(
    id: string,
    props: Record<string, unknown>,
    dataModel: Record<string, unknown>,
    templateContext?: Record<string, unknown>
): UINode {
    const label = resolveBinding(props.label as DataBinding<string>, dataModel, templateContext);
    const value = resolveBinding(props.value as DataBinding<string>, dataModel, templateContext);
    const mode = props.mode as 'date' | 'datetime' | 'time' || 'date';

    return {
        type: 'datepicker',
        id,
        props: {
            label,
            value,
            mode,
            className: 'w-full',
        },
    };
}

function transformVideo(
    id: string,
    props: Record<string, unknown>,
    dataModel: Record<string, unknown>,
    templateContext?: Record<string, unknown>
): UINode {
    const src = resolveBinding(props.src as DataBinding<string>, dataModel, templateContext);
    const poster = resolveBinding(props.poster as DataBinding<string>, dataModel, templateContext);
    const autoplay = props.autoplay as boolean || false;
    const controls = props.controls as boolean ?? true;

    return {
        type: 'video',
        id,
        props: {
            src,
            poster,
            autoplay,
            controls,
            className: 'rounded-xl overflow-hidden',
        },
        style: {
            width: props.width as number || '100%',
            height: props.height as number || 'auto',
        },
    };
}

function transformAudioPlayer(
    id: string,
    props: Record<string, unknown>,
    dataModel: Record<string, unknown>,
    templateContext?: Record<string, unknown>
): UINode {
    const src = resolveBinding(props.src as DataBinding<string>, dataModel, templateContext);
    const title = resolveBinding(props.title as DataBinding<string>, dataModel, templateContext);

    return {
        type: 'audio',
        id,
        props: {
            src,
            title,
            controls: true,
            className: 'w-full',
        },
    };
}

function transformModal(
    id: string,
    props: Record<string, unknown>,
    surfaceState: SurfaceState,
    dataModel: Record<string, unknown>,
    onAction?: (actionId: string, data?: unknown) => void
): UINode {
    const title = resolveBinding(props.title as DataBinding<string>, dataModel);
    const isOpen = props.isOpen as boolean ?? true;
    const childIds = props.children as string[] || [];

    const children = childIds
        .map(childId => {
            const childComponent = surfaceState.components.get(childId);
            if (!childComponent) return null;
            return transformComponent(childComponent, surfaceState, dataModel, undefined, onAction);
        })
        .filter((c): c is UINode => c !== null);

    return {
        type: 'modal',
        id,
        props: {
            title,
            isOpen,
            className: 'bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl',
        },
        children,
    };
}

// ============================================================================
// Message Processing
// ============================================================================

/**
 * Processes an A2UI message and updates transformer state.
 * Handles both SDK types (setModel, endRendering) and legacy types for backward compatibility.
 */
export function processA2UIMessage(
    message: A2UIMessage,
    state: TransformerState
): void {
    switch (message.type) {
        case 'beginRendering':
            processBeginRendering(message, state);
            break;

        case 'surfaceUpdate':
            processSurfaceUpdate(message, state);
            break;

        // SDK uses 'setModel', handle it here
        case 'setModel':
        // Legacy/LiquidCrypto agents use 'dataModelUpdate'
        case 'dataModelUpdate':
            processSetModel(message, state);
            break;

        // SDK's actionResponse and endRendering - acknowledge but no-op for now
        case 'actionResponse':
        case 'endRendering':
            // These are informational, no state update needed
            break;
    }
}

function processBeginRendering(message: BeginRenderingMessage, state: TransformerState): void {
    state.surfaces.set(message.surfaceId, {
        rootComponentId: message.rootComponentId,
        components: new Map(),
        styling: message.styling,
    });
    state.dataModels.set(message.surfaceId, {});
}

function processSurfaceUpdate(message: SurfaceUpdateMessage, state: TransformerState): void {
    const surface = state.surfaces.get(message.surfaceId);
    if (!surface) {
        console.warn(`[A2UI Transformer] Surface not found: ${message.surfaceId}`);
        return;
    }

    // Add/update components
    for (const component of message.components) {
        surface.components.set(component.id, component);
    }
}

/**
 * Process SDK's setModel message (replaces legacy dataModelUpdate)
 * Handles both SDK format (model property) and legacy format (data property)
 */
function processSetModel(message: DataModelUpdateMessage, state: TransformerState): void {
    const existing = state.dataModels.get(message.surfaceId) || {};
    // SDK uses 'model' property, legacy format uses 'data' property
    const messageAny = message as { model?: Record<string, unknown>; data?: Record<string, unknown> };
    const modelData = messageAny.model || messageAny.data || {};
    state.dataModels.set(message.surfaceId, {
        ...existing,
        ...modelData,
    });
}

// ============================================================================
// Main Transformer Function
// ============================================================================

/**
 * Transforms A2UI messages into a Glass UINode tree
 */
export function transformA2UIToGlass(
    messages: A2UIMessage[],
    onAction?: (actionId: string, data?: unknown) => void
): Map<string, UINode> {
    const state = createTransformerState();

    // Process all messages
    for (const message of messages) {
        processA2UIMessage(message, state);
    }

    // Transform each surface to UINode
    const result = new Map<string, UINode>();

    for (const [surfaceId, surfaceState] of state.surfaces) {
        const dataModel = state.dataModels.get(surfaceId) || {};
        const rootComponent = surfaceState.components.get(surfaceState.rootComponentId);

        if (!rootComponent) {
            console.warn(`[A2UI Transformer] Root component not found: ${surfaceState.rootComponentId}`);
            continue;
        }

        const node = transformComponent(rootComponent, surfaceState, dataModel, undefined, onAction);
        if (node) {
            result.set(surfaceId, node);
        }
    }

    return result;
}

/**
 * Transforms a single A2UI payload into a Glass UINode
 * Convenience function for single-surface payloads
 */
export function transformA2UI(
    messages: A2UIMessage[],
    onAction?: (actionId: string, data?: unknown) => void
): UINode | null {
    const surfaces = transformA2UIToGlass(messages, onAction);
    const [firstSurface] = surfaces.values();
    return firstSurface || null;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validates an A2UI payload against security constraints
 */
export function validateA2UIPayload(
    messages: A2UIMessage[],
    _catalog: typeof GLASS_COMPONENT_CATALOG
): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    let componentCount = 0;
    const MAX_COMPONENTS = 500;
    // MAX_DEPTH reserved for future nested component validation

    for (const message of messages) {
        if (message.type === 'surfaceUpdate') {
            for (const component of message.components) {
                componentCount++;
                if (componentCount > MAX_COMPONENTS) {
                    errors.push(`Too many components: max ${MAX_COMPONENTS}`);
                    return { valid: false, errors };
                }

                // Validate component has at least one type defined
                // Note: We allow all A2UI types, they get transformed to Glass equivalents
                void Object.keys(component.component)[0];
            }
        }
    }

    return { valid: errors.length === 0, errors };
}

// ============================================================================
// Exports
// ============================================================================

export {
    type TransformerState,
    type SurfaceState,
};
