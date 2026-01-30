/**
 * FeedFilterTabs Component
 *
 * Tab navigation for the Waidmann Feed sections.
 */

import { Eye, Target, Calendar, Shield, Newspaper } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FeedTab = 'sichtungen' | 'strecke' | 'einladungen' | 'offiziell' | 'news';

interface FeedFilterTabsProps {
    activeTab: FeedTab;
    onChange: (tab: FeedTab) => void;
    counts?: Partial<Record<FeedTab, number>>;
}

// ---------------------------------------------------------------------------
// Tab Config
// ---------------------------------------------------------------------------

const TAB_CONFIG: { id: FeedTab; label: string; icon: React.ReactNode }[] = [
    { id: 'sichtungen', label: 'Sichtungen', icon: <Eye className="w-4 h-4" /> },
    { id: 'strecke', label: 'Strecke', icon: <Target className="w-4 h-4" /> },
    { id: 'einladungen', label: 'Einladungen', icon: <Calendar className="w-4 h-4" /> },
    { id: 'offiziell', label: 'Offiziell', icon: <Shield className="w-4 h-4" /> },
    { id: 'news', label: 'News', icon: <Newspaper className="w-4 h-4" /> },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FeedFilterTabs({ activeTab, onChange, counts }: FeedFilterTabsProps) {
    return (
        <div className="feed-filter-tabs">
            {TAB_CONFIG.map((tab) => (
                <button
                    key={tab.id}
                    className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => onChange(tab.id)}
                >
                    {tab.icon}
                    <span className="tab-label">{tab.label}</span>
                    {counts?.[tab.id] !== undefined && counts[tab.id]! > 0 && (
                        <span className="tab-count">{counts[tab.id]}</span>
                    )}
                </button>
            ))}

            <style>{`
                .feed-filter-tabs {
                    display: flex;
                    gap: 4px;
                    padding: 4px;
                    background: var(--bg-tertiary, #2a2a4a);
                    border-radius: 12px;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }

                .tab-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 14px;
                    border: none;
                    background: transparent;
                    border-radius: 8px;
                    color: var(--text-secondary, #aaa);
                    font-size: 0.85rem;
                    white-space: nowrap;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .tab-btn:hover {
                    background: rgba(255, 255, 255, 0.05);
                }

                .tab-btn.active {
                    background: var(--color-primary, #10b981);
                    color: white;
                }

                .tab-label {
                    font-weight: 500;
                }

                .tab-count {
                    padding: 2px 6px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 10px;
                    font-size: 0.7rem;
                    font-weight: 600;
                }

                .tab-btn.active .tab-count {
                    background: rgba(0, 0, 0, 0.2);
                }

                @media (max-width: 600px) {
                    .tab-label {
                        display: none;
                    }
                    .tab-btn {
                        padding: 10px;
                    }
                }
            `}</style>
        </div>
    );
}

export type { FeedTab };
