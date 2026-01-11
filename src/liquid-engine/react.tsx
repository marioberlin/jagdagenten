import React, { createContext, useContext, ReactNode } from 'react';
import { LiquidClient } from './client';

// Context
const LiquidContext = createContext<LiquidClient | null>(null);

export const LiquidProvider: React.FC<{ client: LiquidClient; children: ReactNode }> = ({ client, children }) => {
    return (
        <LiquidContext.Provider value={client}>
            {children}
        </LiquidContext.Provider>
    );
};

// Export a safe version
export function useOptionalLiquidClient(): LiquidClient | null {
    return useContext(LiquidContext);
}

export function useLiquidClient(): LiquidClient {
    const client = useContext(LiquidContext);
    if (!client) {
        throw new Error('useLiquidClient must be used within a LiquidProvider');
    }
    return client;
}

// Re-export new hooks and components
export { useLiquidReadable } from './useLiquidReadable';
export { useLiquidAction, type ActionParameter } from './useLiquidAction';
export { useRenderToolCall, type RenderToolConfig } from './useRenderToolCall';
export { LiquidSmartComponent, type LiquidSmartComponentProps } from './LiquidSmartComponent';
export { useFlowState, type FlowStage, type FlowState, type FlowStateOptions } from './useFlowState';
export { type ReadableContext, type ActionDefinition } from './client';
