import React, { useState, useCallback, useRef, useEffect } from 'react';
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

interface DragState {
    cardId: string;
    sourceColId: string;
}

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

    const [dragState, setDragState] = useState<DragState | null>(null);
    const [dropTarget, setDropTarget] = useState<{ colId: string; cardIndex: number } | null>(null);
    const [cardCounter, setCardCounter] = useState(5);
    const [columnCounter, setColumnCounter] = useState(4);
    const [editingCard, setEditingCard] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const editInputRef = useRef<HTMLInputElement>(null);

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

    const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, cardId: string, colId: string) => {
        if (editingCard) return; // Don't drag while editing
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', cardId);
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '0.5';
        }
        setDragState({ cardId, sourceColId: colId });
    }, [editingCard]);

    const handleDragEnd = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '1';
        }
        setDragState(null);
        setDropTarget(null);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, colId: string, cardIndex: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDropTarget({ colId, cardIndex });
    }, []);

    const handleDragLeave = useCallback(() => {
        setTimeout(() => setDropTarget(null), 50);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, destColId: string, destIndex: number) => {
        e.preventDefault();
        if (!dragState) return;

        const { cardId, sourceColId } = dragState;

        setColumns(prevColumns => {
            const newColumns = prevColumns.map(col => ({
                ...col,
                cards: [...col.cards]
            }));

            const sourceCol = newColumns.find(c => c.id === sourceColId);
            const destCol = newColumns.find(c => c.id === destColId);

            if (!sourceCol || !destCol) return prevColumns;

            const cardIndex = sourceCol.cards.findIndex(c => c.id === cardId);
            if (cardIndex === -1) return prevColumns;

            const [movedCard] = sourceCol.cards.splice(cardIndex, 1);

            let adjustedIndex = destIndex;
            if (sourceColId === destColId && cardIndex < destIndex) {
                adjustedIndex = Math.max(0, destIndex - 1);
            }

            destCol.cards.splice(adjustedIndex, 0, movedCard);

            return newColumns;
        });

        setDragState(null);
        setDropTarget(null);
    }, [dragState]);

    const handleColumnDrop = useCallback((e: React.DragEvent<HTMLDivElement>, colId: string) => {
        e.preventDefault();
        if (!dragState) return;

        const destCol = columns.find(c => c.id === colId);
        if (!destCol) return;

        handleDrop(e, colId, destCol.cards.length);
    }, [dragState, columns, handleDrop]);

    return (
        <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide w-full h-[500px]">
            {columns.map(col => (
                <div
                    key={col.id}
                    className="flex-shrink-0 w-80 flex flex-col h-full rounded-2xl bg-black/20 border border-[var(--glass-border)]"
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => handleColumnDrop(e, col.id)}
                >
                    {/* Header */}
                    <div className="p-4 flex items-center justify-between border-b border-[var(--glass-border)]">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-primary">{col.title}</h3>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-glass-surface text-secondary">{col.cards.length}</span>
                        </div>
                        <div className="relative">
                            <GlassButton
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenu(openMenu === col.id ? null : col.id);
                                }}
                            >
                                <MoreHorizontal size={14} />
                            </GlassButton>
                            {/* Dropdown Menu */}
                            {openMenu === col.id && (
                                <div
                                    className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-xl bg-black/80 backdrop-blur-xl border border-white/20 shadow-xl py-1"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        className="w-full px-3 py-2 text-left text-sm text-primary hover:bg-white/10 flex items-center gap-2 transition-colors"
                                        onClick={handleAddColumn}
                                    >
                                        <PlusCircle size={14} />
                                        Add Column
                                    </button>
                                    {columns.length > 1 && (
                                        <button
                                            className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-white/10 flex items-center gap-2 transition-colors"
                                            onClick={() => handleDeleteColumn(col.id)}
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
                        {col.cards.map((card, index) => (
                            <React.Fragment key={card.id}>
                                {dropTarget?.colId === col.id && dropTarget?.cardIndex === index && (
                                    <div className="h-1 bg-blue-500 rounded-full mx-2 animate-pulse" />
                                )}
                                <div
                                    draggable={editingCard !== card.id}
                                    onDragStart={(e) => handleDragStart(e, card.id, col.id)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={(e) => handleDragOver(e, col.id, index)}
                                    onDragLeave={handleDragLeave}
                                    onDoubleClick={() => handleStartEdit(card.id, card.title)}
                                    className={cn(
                                        "group relative p-3 rounded-xl bg-glass-surface border transition-all",
                                        editingCard === card.id
                                            ? "border-blue-500 ring-1 ring-blue-500/50"
                                            : "cursor-grab active:cursor-grabbing select-none",
                                        dragState?.cardId === card.id
                                            ? "opacity-50 border-blue-500/50"
                                            : "border-[var(--glass-border)] hover:border-white/30 hover:bg-glass-surface-hover shadow-sm"
                                    )}
                                >
                                    <div className="flex items-start gap-2">
                                        {editingCard !== card.id && (
                                            <GripVertical size={14} className="text-secondary/50 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            {editingCard === card.id ? (
                                                <input
                                                    ref={editInputRef}
                                                    type="text"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={() => handleSaveEdit(col.id, card.id)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleSaveEdit(col.id, card.id);
                                                        if (e.key === 'Escape') handleCancelEdit();
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
                            </React.Fragment>
                        ))}
                        {dropTarget?.colId === col.id && dropTarget?.cardIndex === col.cards.length && (
                            <div className="h-1 bg-blue-500 rounded-full mx-2 animate-pulse" />
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3">
                        <GlassButton
                            variant="ghost"
                            className="w-full justify-start text-secondary hover:text-primary"
                            onClick={() => handleAddCard(col.id)}
                        >
                            <Plus size={14} className="mr-2" /> Add Item
                        </GlassButton>
                    </div>
                </div>
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
