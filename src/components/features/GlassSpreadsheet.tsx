import { useState } from 'react';
import { cn } from '@/utils/cn';

interface Row {
    id: number;
    task: string;
    complete: number;
    priority: string;
    assignee: string;
}

interface GlassSpreadsheetProps {
    className?: string;
}

export function GlassSpreadsheet({ className }: GlassSpreadsheetProps) {
    const [rows, setRows] = useState<Row[]>([
        { id: 1, task: 'Research AI Models', complete: 80, priority: 'Critical', assignee: 'Sarah' },
        { id: 2, task: 'Design Glass Interface', complete: 45, priority: 'High', assignee: 'Mario' },
        { id: 3, task: 'Implement Physics Engine', complete: 10, priority: 'Medium', assignee: 'Alex' },
        { id: 4, task: 'User Testing', complete: 0, priority: 'Low', assignee: 'Sarah' },
        { id: 5, task: 'Optimization', complete: 100, priority: 'Critical', assignee: 'Team' },
        { id: 6, task: 'Marketing Campaign', complete: 25, priority: 'Medium', assignee: 'Jessica' },
        { id: 7, task: 'Server Migration', complete: 60, priority: 'High', assignee: 'David' },
    ]);

    const [activeCell, setActiveCell] = useState<{ row: number, col: keyof Row } | null>(null);

    const handleCellChange = (id: number, field: keyof Row, value: string | number) => {
        setRows(prev => prev.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        ));
    };

    const headers: { key: keyof Row, label: string, width?: string }[] = [
        { key: 'id', label: 'ID', width: 'w-16' },
        { key: 'task', label: 'Task', width: 'w-full' },
        { key: 'priority', label: 'Priority', width: 'w-32' },
        { key: 'complete', label: '% Complete', width: 'w-32' },
        { key: 'assignee', label: 'Assignee', width: 'w-32' },
    ];

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    return (
        <div className={cn("glass-panel rounded-xl overflow-hidden flex flex-col h-full select-none", className)}>
            {/* Spreadsheet Toolbar (Fake) */}
            <div className="flex items-center gap-2 px-2 py-1 border-b border-white/5 bg-white/5">
                <div className="text-xs font-mono text-white/40">Fx</div>
                <div className="h-4 w-[1px] bg-white/10 mx-1" />
                <div className="text-xs text-white/80 font-mono flex-1">
                    {activeCell ? `${alphabet[Object.keys(rows[0]).indexOf(activeCell.col)]}${activeCell.row + 2}` : ''}
                </div>
            </div>

            {/* Spreadsheet Header (Letters) */}
            <div className="flex border-b border-white/10 bg-white/5 text-xs text-white/50 font-medium">
                <div className="w-10 border-r border-white/10 flex items-center justify-center bg-white/5 text-[10px]">#</div>
                {headers.map((h, i) => (
                    <div key={h.key} className={cn("px-4 py-1.5 border-r border-white/10 flex items-center justify-center uppercase tracking-wider", h.width === 'w-full' ? 'flex-1' : h.width)}>
                        {alphabet[i]} ({h.label})
                    </div>
                ))}
            </div>

            <div className="overflow-auto flex-1">
                {rows.map((row, index) => (
                    <div key={row.id} className="flex border-b border-white/5 hover:bg-white/5 transition-colors group">
                        {/* Row Number */}
                        <div className="w-10 border-r border-white/10 flex items-center justify-center text-xs text-white/30 bg-white/5 font-mono">
                            {index + 1}
                        </div>

                        {/* Cells */}
                        {headers.map((h) => (
                            <div
                                key={h.key}
                                className={cn(
                                    "border-r border-white/5 text-sm p-0 relative",
                                    h.width === 'w-full' ? 'flex-1' : h.width,
                                    activeCell?.row === index && activeCell?.col === h.key ? 'ring-1 ring-accent-primary z-10' : ''
                                )}
                                onClick={() => setActiveCell({ row: index, col: h.key })}
                            >
                                {h.key === 'complete' ? (
                                    <div className="w-full h-full px-4 flex items-center gap-2">
                                        <div className="h-1.5 flex-1 glass-panel rounded-full overflow-hidden bg-white/5">
                                            <div className="h-full bg-accent-primary/80" style={{ width: `${row.complete}%` }} />
                                        </div>
                                        <span className="text-xs text-white/60 w-8">{row.complete}%</span>
                                    </div>
                                ) : h.key === 'priority' ? (
                                    <div className={cn("px-4 py-2 w-full h-full flex items-center",
                                        row.priority === 'Critical' ? 'text-red-400' :
                                            row.priority === 'High' ? 'text-orange-400' :
                                                row.priority === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                                    )}>
                                        {row.priority}
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        className="w-full h-full bg-transparent border-none outline-none px-4 py-2 text-white/80 placeholder-white/20 focus:bg-accent-primary/5 transition-all text-sm"
                                        value={row[h.key]}
                                        onChange={(e) => handleCellChange(row.id, h.key, e.target.value)}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                ))}

                {/* Empty rows to fill space */}
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={`empty-${i}`} className="flex border-b border-white/5 text-xs text-white/20">
                        <div className="w-10 border-r border-white/10 flex items-center justify-center bg-white/5 font-mono">{rows.length + i + 1}</div>
                        {headers.map((h) => (
                            <div key={h.key} className={cn("border-r border-white/5", h.width === 'w-full' ? 'flex-1' : h.width)} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
