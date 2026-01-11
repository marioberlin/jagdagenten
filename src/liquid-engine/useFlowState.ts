import { useState, useCallback, useMemo } from 'react';

export interface FlowStage {
    id: string;
    name: string;
    description?: string;
    /**
     * Stages that can be transitioned to from this one
     */
    next?: string[];
}

export interface FlowStateOptions<TData = any> {
    /**
     * All possible stages in the flow
     */
    stages: FlowStage[];
    /**
     * Initial stage ID
     */
    initialStage: string;
    /**
     * Initial data state
     */
    initialData?: TData;
}

export interface FlowState<TData = any> {
    /**
     * Current stage ID
     */
    currentStage: string;
    /**
     * Current stage object
     */
    stage: FlowStage;
    /**
     * Flow data accumulated across stages
     */
    data: TData;
    /**
     * History of visited stages
     */
    history: string[];
    /**
     * Whether we can go to a specific stage
     */
    canGoTo: (stageId: string) => boolean;
    /**
     * Transition to a new stage
     */
    goTo: (stageId: string) => void;
    /**
     * Go back to previous stage
     */
    goBack: () => void;
    /**
     * Update flow data
     */
    updateData: (updates: Partial<TData>) => void;
    /**
     * Reset flow to initial state
     */
    reset: () => void;
    /**
     * Check if flow is complete (no more next stages)
     */
    isComplete: boolean;
    /**
     * Get available next stages
     */
    nextStages: FlowStage[];
}

/**
 * useFlowState Hook
 * 
 * Manages multi-step conversational flows with stage transitions.
 * Useful for wizards, onboarding, and complex AI-guided workflows.
 * 
 * @example
 * ```tsx
 * const flow = useFlowState({
 *   stages: [
 *     { id: 'intro', name: 'Introduction', next: ['details'] },
 *     { id: 'details', name: 'Details', next: ['confirm'] },
 *     { id: 'confirm', name: 'Confirmation', next: [] }
 *   ],
 *   initialStage: 'intro',
 *   initialData: { name: '', email: '' }
 * });
 * 
 * // In AI action handler:
 * flow.updateData({ name: 'Mario' });
 * flow.goTo('details');
 * ```
 */
export function useFlowState<TData = any>(
    options: FlowStateOptions<TData>
): FlowState<TData> {
    const { stages, initialStage, initialData } = options;

    const [currentStageId, setCurrentStageId] = useState(initialStage);
    const [data, setData] = useState<TData>(initialData ?? {} as TData);
    const [history, setHistory] = useState<string[]>([initialStage]);

    // Stage lookup map
    const stageMap = useMemo(() =>
        new Map(stages.map(s => [s.id, s])),
        [stages]
    );

    // Current stage object
    const stage = stageMap.get(currentStageId) ?? stages[0];

    // Check if can transition to a stage
    const canGoTo = useCallback((stageId: string): boolean => {
        if (!stageMap.has(stageId)) return false;
        const currentStage = stageMap.get(currentStageId);
        if (!currentStage?.next) return false;
        return currentStage.next.includes(stageId);
    }, [currentStageId, stageMap]);

    // Transition to new stage
    const goTo = useCallback((stageId: string): void => {
        if (!stageMap.has(stageId)) {
            console.warn(`Stage "${stageId}" does not exist`);
            return;
        }
        setCurrentStageId(stageId);
        setHistory(prev => [...prev, stageId]);
    }, [stageMap]);

    // Go back to previous stage
    const goBack = useCallback((): void => {
        if (history.length <= 1) return;
        const newHistory = history.slice(0, -1);
        setHistory(newHistory);
        setCurrentStageId(newHistory[newHistory.length - 1]);
    }, [history]);

    // Update data
    const updateData = useCallback((updates: Partial<TData>): void => {
        setData(prev => ({ ...prev, ...updates }));
    }, []);

    // Reset
    const reset = useCallback((): void => {
        setCurrentStageId(initialStage);
        setData(initialData ?? {} as TData);
        setHistory([initialStage]);
    }, [initialStage, initialData]);

    // Check if complete
    const isComplete = !stage.next || stage.next.length === 0;

    // Get next stages
    const nextStages = useMemo(() =>
        (stage.next ?? []).map(id => stageMap.get(id)).filter(Boolean) as FlowStage[],
        [stage.next, stageMap]
    );

    return {
        currentStage: currentStageId,
        stage,
        data,
        history,
        canGoTo,
        goTo,
        goBack,
        updateData,
        reset,
        isComplete,
        nextStages
    };
}
