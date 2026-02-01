/**
 * FeedSortOptions Component
 *
 * Sorting controls for Waidmann Feed items.
 */

import { ArrowUpDown, Clock, TrendingUp, MapPin, Shield } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortOption = 'newest' | 'nearest' | 'trending' | 'verified';

interface FeedSortOptionsProps {
    activeSort: SortOption;
    onChange: (sort: SortOption) => void;
    showNearby?: boolean;
}

// ---------------------------------------------------------------------------
// Sort Config
// ---------------------------------------------------------------------------

const SORT_OPTIONS: { id: SortOption; label: string; icon: React.ReactNode; requiresLocation?: boolean }[] = [
    { id: 'newest', label: 'Neueste', icon: <Clock className="w-4 h-4" /> },
    { id: 'trending', label: 'Trend', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'nearest', label: 'Nähe', icon: <MapPin className="w-4 h-4" />, requiresLocation: true },
    { id: 'verified', label: 'Verifiziert', icon: <Shield className="w-4 h-4" /> },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FeedSortOptions({
    activeSort,
    onChange,
    showNearby = true,
}: FeedSortOptionsProps) {
    const visibleOptions = showNearby
        ? SORT_OPTIONS
        : SORT_OPTIONS.filter(o => !o.requiresLocation);

    return (
        <div className="feed-sort-options">
            <ArrowUpDown className="w-4 h-4 sort-icon" />

            <div className="sort-buttons">
                {visibleOptions.map((opt) => (
                    <button
                        key={opt.id}
                        className={`sort-btn ${activeSort === opt.id ? 'active' : ''}`}
                        onClick={() => onChange(opt.id)}
                    >
                        {opt.icon}
                        <span>{opt.label}</span>
                    </button>
                ))}
            </div>

            <style>{`
                .feed-sort-options {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .sort-icon {
                    color: var(--text-tertiary);
                }

                .sort-buttons {
                    display: flex;
                    gap: 6px;
                }

                .sort-btn {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 6px 10px;
                    background: var(--glass-surface);
                    border: 1px solid transparent;
                    border-radius: 6px;
                    color: var(--text-secondary);
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .sort-btn:hover {
                    border-color: var(--glass-border);
                }

                .sort-btn.active {
                    background: rgba(16, 185, 129, 0.15);
                    border-color: var(--glass-accent, #10b981);
                    color: var(--glass-accent, #10b981);
                }

                @media (max-width: 500px) {
                    .sort-btn span {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
}

export type { SortOption };
