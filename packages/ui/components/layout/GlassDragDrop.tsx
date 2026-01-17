import React, { createContext, useContext } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/utils/cn';

// --- Context ---
const SortableItemContext = createContext<{
    attributes: Record<string, any>;
    listeners: Record<string, any> | undefined;
} | null>(null);

// --- Types ---

export interface GlassSortableListProps<T> {
    items: T[];
    onReorder: (items: T[]) => void;
    renderItem: (item: T, index: number) => React.ReactNode;
    keyField: keyof T;
    className?: string;
    strategy?: typeof verticalListSortingStrategy;
}

export interface GlassSortableItemProps {
    id: string | number;
    children: React.ReactNode;
    className?: string;
    /**
     * If true, the entire item is draggable. 
     * If false, you MUST use GlassDragHandle inside.
     */
    enableDragOnItem?: boolean;
}

// --- Components ---

/**
 * A wrapper for a sortable list using dnd-kit
 */
export function GlassSortableList<T>({
    items,
    onReorder,
    renderItem,
    keyField,
    className,
    strategy = verticalListSortingStrategy
}: GlassSortableListProps<T>) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((item) => item[keyField] === active.id);
            const newIndex = items.findIndex((item) => item[keyField] === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                onReorder(arrayMove(items, oldIndex, newIndex));
            }
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={items.map((item) => item[keyField] as string | number)}
                strategy={strategy}
            >
                <div className={className}>
                    {items.map((item, index) => (
                        <React.Fragment key={String(item[keyField])}>
                            {renderItem(item, index)}
                        </React.Fragment>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

/**
 * An individual sortable item
 */
export function GlassSortableItem({
    id,
    children,
    className,
    enableDragOnItem = true
}: GlassSortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative' as const,
    };

    return (
        <SortableItemContext.Provider value={{ attributes, listeners }}>
            <div
                ref={setNodeRef}
                style={style}
                className={cn(
                    "touch-none",
                    isDragging && "opacity-50 scale-[1.02] z-50",
                    className
                )}
                {...(enableDragOnItem ? { ...attributes, ...listeners } : {})}
            >
                {children}
            </div>
        </SortableItemContext.Provider>
    );
}

/**
 * A dedicated drag handle
 */
export function GlassDragHandle({ className, children }: { className?: string; children?: React.ReactNode }) {
    const context = useContext(SortableItemContext);

    if (!context) {
        console.warn("GlassDragHandle must be used within GlassSortableItem");
        return null;
    }

    return (
        <div
            className={cn("cursor-grab active:cursor-grabbing touch-none flex items-center justify-center p-1", className)}
            {...context.attributes}
            {...context.listeners}
        >
            {children || <GripVertical size={20} className="text-secondary hover:text-primary transition-colors" />}
        </div>
    );
}
