import React from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string;
}

interface GlassTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyField: keyof T;
    className?: string;
    onRowClick?: (item: T) => void;
}

export const GlassTable = <T,>({ data, columns, keyField, className, onRowClick }: GlassTableProps<T>) => {
    return (
        <GlassContainer material="thin" className={cn("w-full overflow-hidden", className)}>
            <div className="w-full overflow-auto">
                <table className="w-full caption-bottom text-sm text-left">
                    <thead className="[&_tr]:border-b [&_tr]:border-[var(--glass-border)]">
                        <tr className="border-b transition-colors hover:bg-glass-surface data-[state=selected]:bg-glass-surface-hover">
                            {columns.map((col, i) => (
                                <th
                                    key={i}
                                    className={cn(
                                        "h-12 px-4 align-middle font-medium text-secondary uppercase tracking-wider text-xs",
                                        col.className
                                    )}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {data.map((item) => (
                            <tr
                                key={String(item[keyField])}
                                className={cn(
                                    "border-b border-[var(--glass-border)] transition-colors hover:bg-glass-surface data-[state=selected]:bg-glass-surface-hover",
                                    onRowClick && "cursor-pointer active:bg-glass-surface-active"
                                )}
                                onClick={() => onRowClick?.(item)}
                            >
                                {columns.map((col, i) => (
                                    <td key={i} className="p-4 align-middle text-primary/80">
                                        {typeof col.accessor === 'function'
                                            ? col.accessor(item)
                                            : (item[col.accessor] as React.ReactNode)
                                        }
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </GlassContainer>
    );
};

GlassTable.displayName = 'GlassTable';
