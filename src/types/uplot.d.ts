// Type declarations for uPlot
declare module 'uplot' {
    export interface Options {
        width: number;
        height: number;
        title?: string;
        mode?: number;
        scales?: Record<string, unknown>;
        series?: Series[];
        axes?: Axis[];
        hooks?: Record<string, Array<(u: uPlot) => void>>;
    }

    export interface Series {
        show?: boolean;
        label?: string;
        stroke?: string | null;
        width?: number;
        fill?: string | ((self: uPlot, seriesIdx: number) => string) | null;
        points?: { show?: boolean };
        value?: (u: uPlot, val: number) => string;
    }

    export interface Axis {
        show?: boolean;
        grid?: { show?: boolean; stroke?: string; width?: number };
        ticks?: { stroke?: string; width?: number };
        value?: (u: uPlot, val: number) => string;
    }

    export class uPlot {
        constructor(options: Options, data: unknown[], root: HTMLElement);
        destroy(): void;
        setData(data: unknown[]): void;
    }
}
