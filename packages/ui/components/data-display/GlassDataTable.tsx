import React, { useState, useMemo } from 'react';
import { SurfaceContainer } from '../primitives/SurfaceContainer';
import { GlassInput } from '../forms/GlassInput';
import { GlassButton } from '../primitives/GlassButton';
import { cn } from '@/utils/cn';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';

type SortDirection = 'asc' | 'desc' | null;

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    sortable?: boolean;
    filterable?: boolean;
    className?: string;
    /** Width class like 'w-[200px]' or 'w-1/3' */
    width?: string;
}

interface GlassDataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyField: keyof T;
    className?: string;
    onRowClick?: (item: T) => void;
    /** Enable search input */
    searchable?: boolean;
    /** Placeholder for search input */
    searchPlaceholder?: string;
    /** Keys to search in */
    searchKeys?: (keyof T)[];
    /** Items per page (0 = no pagination) */
    pageSize?: number;
    /** Empty state content */
    emptyState?: React.ReactNode;
    /** Enable responsive card view on small screens */
    responsive?: boolean;
}

export const GlassDataTable = <T,>({
    data,
    columns,
    keyField,
    className,
    onRowClick,
    searchable = false,
    searchPlaceholder = 'Search...',
    searchKeys,
    pageSize = 0,
    emptyState,
    responsive = false,
}: GlassDataTableProps<T>) => {
    const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Determine which keys to search
    const effectiveSearchKeys = searchKeys || columns
        .filter(col => typeof col.accessor !== 'function')
        .map(col => col.accessor as keyof T);

    // Filter data based on search
    const filteredData = useMemo(() => {
        if (!searchQuery.trim()) return data;

        const query = searchQuery.toLowerCase();
        return data.filter(item =>
            effectiveSearchKeys.some(key => {
                const value = item[key];
                return String(value).toLowerCase().includes(query);
            })
        );
    }, [data, searchQuery, effectiveSearchKeys]);

    // Sort data
    const sortedData = useMemo(() => {
        if (!sortColumn || !sortDirection) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aVal = a[sortColumn];
            const bVal = b[sortColumn];

            // Handle different types
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }

            const aStr = String(aVal).toLowerCase();
            const bStr = String(bVal).toLowerCase();

            if (sortDirection === 'asc') {
                return aStr.localeCompare(bStr);
            }
            return bStr.localeCompare(aStr);
        });
    }, [filteredData, sortColumn, sortDirection]);

    // Paginate data
    const paginatedData = useMemo(() => {
        if (pageSize <= 0) return sortedData;

        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage, pageSize]);

    const totalPages = pageSize > 0 ? Math.ceil(sortedData.length / pageSize) : 1;

    // Handle sort toggle
    const handleSort = (accessor: keyof T | ((item: T) => React.ReactNode)) => {
        if (typeof accessor === 'function') return;

        if (sortColumn === accessor) {
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else if (sortDirection === 'desc') {
                setSortColumn(null);
                setSortDirection(null);
            }
        } else {
            setSortColumn(accessor);
            setSortDirection('asc');
        }
    };

    // Get sort icon
    const getSortIcon = (accessor: keyof T | ((item: T) => React.ReactNode)) => {
        if (typeof accessor === 'function') return null;

        if (sortColumn !== accessor) {
            return <ChevronsUpDown size={14} className="text-secondary/40" />;
        }
        if (sortDirection === 'asc') {
            return <ChevronUp size={14} className="text-primary" />;
        }
        return <ChevronDown size={14} className="text-primary" />;
    };

    // Get cell value
    const getCellValue = (item: T, accessor: keyof T | ((item: T) => React.ReactNode)) => {
        if (typeof accessor === 'function') {
            return accessor(item);
        }
        return item[accessor] as React.ReactNode;
    };

    // Reset to first page when search changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    return (
        <SurfaceContainer material="flat" className={cn("w-full overflow-hidden", className)}>
            {/* Search Bar */}
            {searchable && (
                <div className="p-4 border-b border-[var(--glass-border)]">
                    <GlassInput
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={searchPlaceholder}
                        icon={<Search size={16} />}
                        className="max-w-sm"
                    />
                </div>
            )}

            {/* Table - Desktop */}
            <div className={cn("w-full overflow-auto", responsive && "hidden md:block")}>
                <table className="w-full caption-bottom text-sm text-left">
                    <thead className="[&_tr]:border-b [&_tr]:border-[var(--glass-border)]">
                        <tr className="border-b transition-colors hover:bg-glass-surface">
                            {columns.map((col, i) => {
                                const isSortable = col.sortable !== false && typeof col.accessor !== 'function';

                                return (
                                    <th
                                        key={i}
                                        className={cn(
                                            "h-12 px-4 align-middle font-medium text-secondary uppercase tracking-wider text-xs",
                                            isSortable && "cursor-pointer hover:text-primary transition-colors",
                                            col.className,
                                            col.width
                                        )}
                                        onClick={() => isSortable && handleSort(col.accessor)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>{col.header}</span>
                                            {isSortable && getSortIcon(col.accessor)}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="p-8 text-center text-secondary">
                                    {emptyState || 'No data available'}
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((item) => (
                                <tr
                                    key={String(item[keyField])}
                                    className={cn(
                                        "border-b border-[var(--glass-border)] transition-colors hover:bg-glass-surface",
                                        onRowClick && "cursor-pointer active:bg-glass-surface-hover"
                                    )}
                                    onClick={() => onRowClick?.(item)}
                                >
                                    {columns.map((col, i) => (
                                        <td
                                            key={i}
                                            className={cn("p-4 align-middle text-primary/80", col.className, col.width)}
                                        >
                                            {getCellValue(item, col.accessor)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Card View - Mobile (Responsive) */}
            {responsive && (
                <div className="md:hidden space-y-3 p-4">
                    {paginatedData.length === 0 ? (
                        <div className="p-8 text-center text-secondary">
                            {emptyState || 'No data available'}
                        </div>
                    ) : (
                        paginatedData.map((item) => (
                            <SurfaceContainer
                                key={String(item[keyField])}
                                material="elevated"
                                border
                                interactive={!!onRowClick}
                                className="p-4 space-y-2"
                                onClick={() => onRowClick?.(item)}
                            >
                                {columns.map((col, i) => (
                                    <div key={i} className="flex justify-between items-start gap-2">
                                        <span className="text-xs text-secondary uppercase tracking-wider">
                                            {col.header}
                                        </span>
                                        <span className="text-sm text-primary/80 text-right">
                                            {getCellValue(item, col.accessor)}
                                        </span>
                                    </div>
                                ))}
                            </SurfaceContainer>
                        ))
                    )}
                </div>
            )}

            {/* Pagination */}
            {pageSize > 0 && totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-[var(--glass-border)]">
                    <span className="text-sm text-secondary">
                        Showing {(currentPage - 1) * pageSize + 1} to{' '}
                        {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
                    </span>
                    <div className="flex items-center gap-2">
                        <GlassButton
                            variant="ghost"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        >
                            <ChevronLeft size={16} />
                        </GlassButton>
                        <span className="text-sm text-primary">
                            Page {currentPage} of {totalPages}
                        </span>
                        <GlassButton
                            variant="ghost"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        >
                            <ChevronRight size={16} />
                        </GlassButton>
                    </div>
                </div>
            )}
        </SurfaceContainer>
    );
};

GlassDataTable.displayName = 'GlassDataTable';
