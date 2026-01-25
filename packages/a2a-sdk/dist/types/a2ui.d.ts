/**
 * A2UI (Agent-to-UI) Types
 *
 * Type definitions for A2UI protocol extension enabling agents to render
 * rich interactive UI components.
 *
 * Based on Google's A2UI specification with LiquidCrypto extensions.
 */
import type { JSONValue } from './v1.js';
/**
 * Literal string value
 */
export interface A2UILiteralString {
    literalString: string;
}
/**
 * Path reference to data model
 */
export interface A2UIPathReference {
    path: string;
}
/**
 * A2UI text value - can be literal or path reference
 */
export type A2UITextValue = string | A2UILiteralString | A2UIPathReference;
/**
 * Resolve a text value to actual string
 */
export declare function resolveTextValue(value: A2UITextValue, model?: Record<string, JSONValue>, itemContext?: Record<string, JSONValue>): string;
/**
 * Resolve a path to its value in the model
 */
export declare function resolvePathValue(path: string, model?: Record<string, JSONValue>, itemContext?: Record<string, JSONValue>): string;
/**
 * Text component semantic types
 */
export type A2UITextSemantic = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'label' | 'title' | 'subtitle' | 'code' | 'error' | 'success' | 'warning';
/**
 * Button variants
 */
export type A2UIButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
/**
 * Input types
 */
export type A2UIInputType = 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search';
export interface A2UITextProps {
    Text: {
        text: A2UITextValue;
        semantic?: A2UITextSemantic;
    };
}
export interface A2UIButtonProps {
    Button: {
        label: A2UITextValue;
        actionId: string;
        variant?: A2UIButtonVariant;
        disabled?: boolean;
        icon?: string;
    };
}
export interface A2UITextFieldProps {
    TextField: {
        id: string;
        label?: A2UITextValue;
        placeholder?: A2UITextValue;
        type?: A2UIInputType;
        required?: boolean;
        disabled?: boolean;
        defaultValue?: A2UITextValue;
    };
}
export interface A2UISliderProps {
    Slider: {
        id: string;
        label?: A2UITextValue;
        min?: number;
        max?: number;
        step?: number;
        defaultValue?: number;
    };
}
export interface A2UICheckboxProps {
    Checkbox: {
        id: string;
        label: A2UITextValue;
        defaultChecked?: boolean;
        disabled?: boolean;
    };
}
export interface A2UISelectProps {
    Select: {
        id: string;
        label?: A2UITextValue;
        options: Array<{
            value: string;
            label: A2UITextValue;
        }>;
        defaultValue?: string;
        placeholder?: A2UITextValue;
    };
}
export interface A2UIImageProps {
    Image: {
        src: A2UITextValue;
        alt?: A2UITextValue;
        width?: number;
        height?: number;
        aspectRatio?: string;
    };
}
export interface A2UIDividerProps {
    Divider: {
        orientation?: 'horizontal' | 'vertical';
        spacing?: number;
    };
}
export interface A2UIRowProps {
    Row: {
        children: string[];
        gap?: number;
        align?: 'start' | 'center' | 'end' | 'stretch';
        justify?: 'start' | 'center' | 'end' | 'between' | 'around';
    };
}
export interface A2UIColumnProps {
    Column: {
        children: string[];
        gap?: number;
        align?: 'start' | 'center' | 'end' | 'stretch';
    };
}
export interface A2UICardProps {
    Card: {
        children: string[];
        title?: A2UITextValue;
        subtitle?: A2UITextValue;
        padding?: number;
        elevated?: boolean;
    };
}
export interface A2UIListProps {
    List: {
        items: A2UIPathReference;
        template: string[];
        emptyMessage?: A2UITextValue;
        dividers?: boolean;
    };
}
export interface A2UITabsProps {
    Tabs: {
        tabs: Array<{
            id: string;
            label: A2UITextValue;
            children: string[];
        }>;
        defaultTab?: string;
    };
}
export interface A2UIChartProps {
    Chart: {
        type: 'line' | 'bar' | 'pie' | 'area' | 'candlestick';
        data: A2UIPathReference;
        xKey?: string;
        yKey?: string;
        title?: A2UITextValue;
        height?: number;
    };
}
export interface A2UITableProps {
    Table: {
        columns: Array<{
            key: string;
            header: A2UITextValue;
            width?: number;
            align?: 'left' | 'center' | 'right';
        }>;
        data: A2UIPathReference;
        striped?: boolean;
        hoverable?: boolean;
    };
}
export interface A2UIMetricProps {
    Metric: {
        value: A2UITextValue;
        label: A2UITextValue;
        change?: A2UITextValue;
        changeType?: 'positive' | 'negative' | 'neutral';
        icon?: string;
    };
}
export interface A2UIProgressProps {
    Progress: {
        value: number;
        max?: number;
        label?: A2UITextValue;
        showValue?: boolean;
    };
}
export interface A2UIBadgeProps {
    Badge: {
        text: A2UITextValue;
        variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
    };
}
export interface A2UIAvatarProps {
    Avatar: {
        src?: A2UITextValue;
        name?: A2UITextValue;
        size?: 'sm' | 'md' | 'lg' | 'xl';
    };
}
export interface A2UISpacerProps {
    Spacer: {
        size?: number;
    };
}
/**
 * Union of all component props
 */
export type A2UIComponentProps = A2UITextProps | A2UIButtonProps | A2UITextFieldProps | A2UISliderProps | A2UICheckboxProps | A2UISelectProps | A2UIImageProps | A2UIDividerProps | A2UIRowProps | A2UIColumnProps | A2UICardProps | A2UIListProps | A2UITabsProps | A2UIChartProps | A2UITableProps | A2UIMetricProps | A2UIProgressProps | A2UIBadgeProps | A2UIAvatarProps | A2UISpacerProps;
/**
 * A2UI component with ID
 */
export interface A2UIComponent {
    id: string;
    component: A2UIComponentProps;
}
export interface A2UISurfaceStyling {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
    borderRadius?: number;
    spacing?: number;
    theme?: 'light' | 'dark' | 'auto';
    [key: string]: JSONValue | undefined;
}
/**
 * Begin rendering message - initiates a new UI surface
 */
export interface A2UIBeginRenderingMessage {
    type: 'beginRendering';
    surfaceId: string;
    rootComponentId: string;
    styling?: A2UISurfaceStyling;
}
/**
 * Surface update message - updates components in a surface
 */
export interface A2UISurfaceUpdateMessage {
    type: 'surfaceUpdate';
    surfaceId: string;
    components: A2UIComponent[];
}
/**
 * Set model message - updates the data model for a surface
 */
export interface A2UISetModelMessage {
    type: 'setModel';
    surfaceId: string;
    model: Record<string, JSONValue>;
}
/**
 * Action response message - response from UI action
 */
export interface A2UIActionResponseMessage {
    type: 'actionResponse';
    surfaceId: string;
    actionId: string;
    response?: JSONValue;
}
/**
 * End rendering message - signals rendering is complete
 */
export interface A2UIEndRenderingMessage {
    type: 'endRendering';
    surfaceId: string;
}
/**
 * Union of all A2UI message types
 */
export type A2UIMessage = A2UIBeginRenderingMessage | A2UISurfaceUpdateMessage | A2UISetModelMessage | A2UIActionResponseMessage | A2UIEndRenderingMessage;
export declare function isBeginRenderingMessage(msg: A2UIMessage): msg is A2UIBeginRenderingMessage;
export declare function isSurfaceUpdateMessage(msg: A2UIMessage): msg is A2UISurfaceUpdateMessage;
export declare function isSetModelMessage(msg: A2UIMessage): msg is A2UISetModelMessage;
export declare function isActionResponseMessage(msg: A2UIMessage): msg is A2UIActionResponseMessage;
export declare function isEndRenderingMessage(msg: A2UIMessage): msg is A2UIEndRenderingMessage;
export declare function getComponentType(component: A2UIComponentProps): string;
export declare function isTextComponent(component: A2UIComponentProps): component is A2UITextProps;
export declare function isButtonComponent(component: A2UIComponentProps): component is A2UIButtonProps;
export declare function isLayoutComponent(component: A2UIComponentProps): component is A2UIRowProps | A2UIColumnProps | A2UICardProps;
export declare function isInputComponent(component: A2UIComponentProps): component is A2UITextFieldProps | A2UISliderProps | A2UICheckboxProps | A2UISelectProps;
export declare function isListComponent(component: A2UIComponentProps): component is A2UIListProps;
/**
 * Action triggered by user interaction
 */
export interface A2UIAction {
    actionId: string;
    surfaceId: string;
    data?: Record<string, JSONValue>;
    timestamp: string;
}
/**
 * Form submission action
 */
export interface A2UIFormSubmission extends A2UIAction {
    formData: Record<string, JSONValue>;
}
/**
 * Action handler function type
 */
export type A2UIActionHandler = (action: A2UIAction) => void | Promise<void>;
import type { DataPart, Artifact } from './v1.js';
/**
 * Extract A2UI messages from an artifact
 */
export declare function extractA2UIMessages(artifact: Artifact): A2UIMessage[];
/**
 * Check if an artifact contains A2UI content
 */
export declare function isA2UIArtifact(artifact: Artifact): boolean;
/**
 * Create an A2UI data part
 */
export declare function createA2UIPart(messages: A2UIMessage[]): DataPart;
