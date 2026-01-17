import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
    UniqueIdentifier,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GlassButton } from '../primitives/GlassButton';
import { Plus, MoreHorizontal, GripVertical, Trash2, PlusCircle, Edit2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface KanbanCard {
    id: string;
    title: string;
    tag?: string;
    tagColor?: 'blue' | 'green' | 'purple' | 'orange';
}

interface KanbanColumn {
    id: string;
    title: string;
    cards: KanbanCard[];
}

// Sortable Card Component
interface SortableCardProps {
    card: KanbanCard;
    columnId: string;
    isEditing: boolean;
    editValue: string;
    onStartEdit: (cardId: string, title: string) => void;
    onSaveEdit: (colId: string, cardId: string) => void;
    onCancelEdit: () => void;
    onEditChange: (value: string) => void;
    editInputRef: React.RefObject<HTMLInputElement>;
}

const SortableCard = ({
    card,
    columnId,
    isEditing,
    editValue,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onEditChange,
    editInputRef
}: SortableCardProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: card.id,
        data: { type: 'card', card, columnId }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative p-3 rounded-xl bg-glass-surface border transition-all",
                isEditing
                    ? "border-blue-500 ring-1 ring-blue-500/50"
                    : "cursor-grab active:cursor-grabbing select-none",
                isDragging
                    ? "opacity-50 border-blue-500/50 shadow-xl"
                    : "border-[var(--glass-border)] hover:border-white/30 hover:bg-glass-surface-hover shadow-sm"
            )}
            onDoubleClick={() => !isEditing && onStartEdit(card.id, card.title)}
        >
            <div className="flex items-start gap-2">
                {!isEditing && (
                    <div
                        {...attributes}
                        {...listeners}
                        className="touch-none"
                    >
                        <GripVertical
                            size={14}
                            className="text-secondary/50 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
                        />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <input
                            ref={editInputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => onEditChange(e.target.value)}
                            onBlur={() => onSaveEdit(columnId, card.id)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onSaveEdit(columnId, card.id);
                                if (e.key === 'Escape') onCancelEdit();
                            }}
                            className="w-full text-sm font-medium text-primary bg-transparent border-none outline-none"
                        />
                    ) : (
                        <>
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-medium text-primary mb-2 flex-1">{card.title}</h4>
                                <Edit2 size={12} className="text-secondary/30 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </div>
                            {card.tag && (
                                <span className={cn(
                                    "text-[10px] uppercase tracking-wide font-bold px-2 py-1 rounded shadow-sm",
                                    getTagColor(card.tagColor)
                                )}>
                                    {card.tag}
                                </span>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// Drag Overlay Card (ghost preview)
const DragOverlayCard = ({ card }: { card: KanbanCard }) => (
    <div className="p-3 rounded-xl bg-glass-surface/90 backdrop-blur-xl border border-accent/50 shadow-2xl shadow-accent/20 cursor-grabbing">
        <div className="flex items-start gap-2">
            <GripVertical size={14} className="text-secondary/50 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-primary mb-2">{card.title}</h4>
                {card.tag && (
                    <span className={cn(
                        "text-[10px] uppercase tracking-wide font-bold px-2 py-1 rounded shadow-sm",
                        getTagColor(card.tagColor)
                    )}>
                        {card.tag}
                    </span>
                )}
            </div>
        </div>
    </div>
);

// Droppable Column Component
interface DroppableColumnProps {
    column: KanbanColumn;
    children: React.ReactNode;
    onAddCard: (colId: string) => void;
    onAddColumn: () => void;
    onDeleteColumn: (colId: string) => void;
    openMenu: string | null;
    setOpenMenu: (id: string | null) => void;
    columnsCount: number;
}

const DroppableColumn = ({
    column,
    children,
    onAddCard,
    onAddColumn,
    onDeleteColumn,
    openMenu,
    setOpenMenu,
    columnsCount
}: DroppableColumnProps) => {
    return (
        <div className="flex-shrink-0 w-80 flex flex-col h-full rounded-2xl bg-black/20 border border-[var(--glass-border)]">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-[var(--glass-border)]">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-primary">{column.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-glass-surface text-secondary">
                        {column.cards.length}
                    </span>
                </div>
                <div className="relative">
                    <GlassButton
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(openMenu === column.id ? null : column.id);
                        }}
                    >
                        <MoreHorizontal size={14} />
                    </GlassButton>
                    {openMenu === column.id && (
                        <div
                            className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-xl bg-black/80 backdrop-blur-xl border border-white/20 shadow-xl py-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="w-full px-3 py-2 text-left text-sm text-primary hover:bg-white/10 flex items-center gap-2 transition-colors"
                                onClick={onAddColumn}
                            >
                                <PlusCircle size={14} />
                                Add Column
                            </button>
                            {columnsCount > 1 && (
                                <button
                                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-white/10 flex items-center gap-2 transition-colors"
                                    onClick={() => onDeleteColumn(column.id)}
                                >
                                    <Trash2 size={14} />
                                    Delete Column
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Cards Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                <SortableContext items={column.cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {children}
                </SortableContext>
            </div>

            {/* Footer */}
            <div className="p-3">
                <GlassButton
                    variant="ghost"
                    className="w-full justify-start text-secondary hover:text-primary"
                    onClick={() => onAddCard(column.id)}
                >
                    <Plus size={14} className="mr-2" /> Add Item
                </GlassButton>
            </div>
        </div>
    );
};

export const GlassKanban = () => {
    const [columns, setColumns] = useState<KanbanColumn[]>([
        {
            id: 'todo',
            title: 'To Do',
            cards: [
                { id: 'c1', title: 'Research AI Patterns', tag: 'Research', tagColor: 'blue' },
                { id: 'c2', title: 'Draft Implementation', tag: 'Docs', tagColor: 'purple' }
            ]
        },
        {
            id: 'progress',
            title: 'In Progress',
            cards: [
                { id: 'c3', title: 'Build GlassVoice', tag: 'Dev', tagColor: 'green' }
            ]
        },
        {
            id: 'done',
            title: 'Done',
            cards: [
                { id: 'c4', title: 'Phase 1 Planning', tag: 'Planning', tagColor: 'orange' }
            ]
        }
    ]);

    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
    const [cardCounter, setCardCounter] = useState(5);
    const [columnCounter, setColumnCounter] = useState(4);
    const [editingCard, setEditingCard] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const editInputRef = useRef<HTMLInputElement>(null);

    // Configure sensors for both pointer and keyboard
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Prevent accidental drags
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setOpenMenu(null);
        if (openMenu) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [openMenu]);

    // Focus input when editing
    useEffect(() => {
        if (editingCard && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingCard]);

    // Find the active card for drag overlay
    const activeCard = activeId
        ? columns.flatMap(col => col.cards).find(card => card.id === activeId)
        : null;

    const handleDragStart = useCallback((event: DragStartEvent) => {
        if (editingCard) return;
        setActiveId(event.active.id);
    }, [editingCard]);

    const handleDragOver = useCallback((event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        if (!activeData || activeData.type !== 'card') return;

        const activeColumnId = activeData.columnId;
        const activeCardId = active.id;

        // Determine the target column
        let overColumnId: string;
        if (overData?.type === 'card') {
            overColumnId = overData.columnId;
        } else {
            // Dropped on column directly
            overColumnId = over.id as string;
        }

        if (activeColumnId === overColumnId) return;

        // Move card between columns
        setColumns(prev => {
            const sourceCol = prev.find(col => col.id === activeColumnId);
            const destCol = prev.find(col => col.id === overColumnId);
            if (!sourceCol || !destCol) return prev;

            const activeIndex = sourceCol.cards.findIndex(c => c.id === activeCardId);
            if (activeIndex === -1) return prev;

            const [movedCard] = sourceCol.cards.splice(activeIndex, 1);

            // Find insertion index
            let overIndex = destCol.cards.length;
            if (overData?.type === 'card') {
                overIndex = destCol.cards.findIndex(c => c.id === over.id);
                if (overIndex === -1) overIndex = destCol.cards.length;
            }

            destCol.cards.splice(overIndex, 0, movedCard);

            return prev.map(col => {
                if (col.id === activeColumnId) return { ...col, cards: [...sourceCol.cards] };
                if (col.id === overColumnId) return { ...col, cards: [...destCol.cards] };
                return col;
            });
        });
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        if (!activeData || activeData.type !== 'card') return;

        const columnId = activeData.columnId;

        // Reorder within same column
        if (overData?.type === 'card' && overData.columnId === columnId) {
            setColumns(prev => {
                return prev.map(col => {
                    if (col.id !== columnId) return col;

                    const oldIndex = col.cards.findIndex(c => c.id === active.id);
                    const newIndex = col.cards.findIndex(c => c.id === over.id);

                    if (oldIndex === -1 || newIndex === -1) return col;

                    return {
                        ...col,
                        cards: arrayMove(col.cards, oldIndex, newIndex)
                    };
                });
            });
        }
    }, []);

    const handleAddCard = useCallback((colId: string) => {
        const newCard: KanbanCard = {
            id: `c${cardCounter}`,
            title: `New Task ${cardCounter - 4}`,
            tag: 'New',
            tagColor: 'blue'
        };
        setCardCounter(prev => prev + 1);
        setColumns(prevColumns =>
            prevColumns.map(col =>
                col.id === colId
                    ? { ...col, cards: [...col.cards, newCard] }
                    : col
            )
        );
    }, [cardCounter]);

    const handleAddColumn = useCallback(() => {
        const newColumn: KanbanColumn = {
            id: `col${columnCounter}`,
            title: `New Column`,
            cards: []
        };
        setColumnCounter(prev => prev + 1);
        setColumns(prev => [...prev, newColumn]);
        setOpenMenu(null);
    }, [columnCounter]);

    const handleDeleteColumn = useCallback((colId: string) => {
        setColumns(prev => prev.filter(col => col.id !== colId));
        setOpenMenu(null);
    }, []);

    const handleStartEdit = useCallback((cardId: string, currentTitle: string) => {
        setEditingCard(cardId);
        setEditValue(currentTitle);
    }, []);

    const handleSaveEdit = useCallback((colId: string, cardId: string) => {
        if (editValue.trim()) {
            setColumns(prevColumns =>
                prevColumns.map(col =>
                    col.id === colId
                        ? {
                            ...col,
                            cards: col.cards.map(card =>
                                card.id === cardId ? { ...card, title: editValue.trim() } : card
                            )
                        }
                        : col
                )
            );
        }
        setEditingCard(null);
        setEditValue('');
    }, [editValue]);

    const handleCancelEdit = useCallback(() => {
        setEditingCard(null);
        setEditValue('');
    }, []);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide w-full h-[500px]">
                {columns.map(col => (
                    <DroppableColumn
                        key={col.id}
                        column={col}
                        onAddCard={handleAddCard}
                        onAddColumn={handleAddColumn}
                        onDeleteColumn={handleDeleteColumn}
                        openMenu={openMenu}
                        setOpenMenu={setOpenMenu}
                        columnsCount={columns.length}
                    >
                        {col.cards.map(card => (
                            <SortableCard
                                key={card.id}
                                card={card}
                                columnId={col.id}
                                isEditing={editingCard === card.id}
                                editValue={editValue}
                                onStartEdit={handleStartEdit}
                                onSaveEdit={handleSaveEdit}
                                onCancelEdit={handleCancelEdit}
                                onEditChange={setEditValue}
                                editInputRef={editInputRef as any}
                            />
                        ))}
                    </DroppableColumn>
                ))}

                {/* Add Column Button */}
                <div
                    className="flex-shrink-0 w-80 h-full rounded-2xl border-2 border-dashed border-white/20 hover:border-white/40 flex items-center justify-center cursor-pointer transition-colors group"
                    onClick={handleAddColumn}
                >
                    <div className="flex flex-col items-center gap-2 text-secondary group-hover:text-primary transition-colors">
                        <Plus size={24} />
                        <span className="text-sm font-medium">Add Column</span>
                    </div>
                </div>
            </div>

            {/* Drag Overlay - Semi-transparent ghost card */}
            <DragOverlay>
                {activeCard ? <DragOverlayCard card={activeCard} /> : null}
            </DragOverlay>
        </DndContext>
    );
};

function getTagColor(color?: string) {
    switch (color) {
        case 'blue': return 'bg-blue-500/20 text-blue-300';
        case 'green': return 'bg-emerald-500/20 text-emerald-300';
        case 'purple': return 'bg-purple-500/20 text-purple-300';
        case 'orange': return 'bg-orange-500/20 text-orange-300';
        default: return 'bg-glass-surface text-secondary';
    }
}

GlassKanban.displayName = 'GlassKanban';
