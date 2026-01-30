/**
 * OfficialNewsCard Component
 *
 * Card for displaying official news from authorities (DBBW, DJV, etc.)
 */

import { ExternalLink, Calendar, Shield, AlertCircle } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OfficialNewsItem {
    id: string;
    sourceId: string;
    sourceName: string;
    sourceCategory: 'official' | 'association' | 'news' | 'research';
    title: string;
    summary: string;
    url: string;
    publishedAt: string;
    bundesland?: string;
    tags: string[];
    isUrgent?: boolean;
}

interface OfficialNewsCardProps {
    item: OfficialNewsItem;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SOURCE_COLORS: Record<string, string> = {
    official: '#3b82f6',
    association: '#10b981',
    news: '#8b5cf6',
    research: '#f59e0b',
};

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OfficialNewsCard({ item }: OfficialNewsCardProps) {
    const borderColor = SOURCE_COLORS[item.sourceCategory] || '#666';

    return (
        <article
            className="official-news-card"
            style={{ borderLeftColor: borderColor }}
        >
            {/* Header */}
            <div className="card-header">
                <div className="source-badge" style={{ background: `${borderColor}20`, color: borderColor }}>
                    <Shield className="w-3 h-3" />
                    <span>{item.sourceName}</span>
                </div>

                {item.isUrgent && (
                    <span className="urgent-badge">
                        <AlertCircle className="w-3 h-3" />
                        Wichtig
                    </span>
                )}
            </div>

            {/* Title */}
            <h4 className="card-title">{item.title}</h4>

            {/* Summary */}
            <p className="card-summary">{item.summary}</p>

            {/* Tags */}
            {item.tags.length > 0 && (
                <div className="card-tags">
                    {item.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="tag">{tag}</span>
                    ))}
                </div>
            )}

            {/* Footer */}
            <div className="card-footer">
                <div className="meta">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(item.publishedAt)}</span>
                    {item.bundesland && (
                        <>
                            <span className="divider">•</span>
                            <span>{item.bundesland}</span>
                        </>
                    )}
                </div>

                <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="read-more"
                >
                    <span>Lesen</span>
                    <ExternalLink className="w-3 h-3" />
                </a>
            </div>

            <style>{`
                .official-news-card {
                    background: var(--bg-tertiary, #2a2a4a);
                    border-radius: 10px;
                    border-left: 3px solid;
                    padding: 14px;
                }

                .card-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 10px;
                }

                .source-badge {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-size: 0.7rem;
                    font-weight: 500;
                }

                .urgent-badge {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 3px 8px;
                    background: rgba(239, 68, 68, 0.15);
                    border-radius: 4px;
                    font-size: 0.7rem;
                    color: #ef4444;
                    font-weight: 500;
                }

                .card-title {
                    margin: 0 0 8px;
                    font-size: 0.95rem;
                    color: var(--text-primary, #fff);
                    line-height: 1.3;
                }

                .card-summary {
                    margin: 0 0 10px;
                    font-size: 0.8rem;
                    color: var(--text-secondary, #aaa);
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .card-tags {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                    margin-bottom: 10px;
                }

                .tag {
                    padding: 2px 8px;
                    background: rgba(255, 255, 255, 0.08);
                    border-radius: 4px;
                    font-size: 0.7rem;
                    color: var(--text-tertiary, #888);
                }

                .card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .meta {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 0.7rem;
                    color: var(--text-tertiary, #666);
                }

                .divider {
                    opacity: 0.5;
                }

                .read-more {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 10px;
                    background: rgba(59, 130, 246, 0.1);
                    border-radius: 4px;
                    color: #3b82f6;
                    font-size: 0.75rem;
                    text-decoration: none;
                    transition: background 0.2s;
                }

                .read-more:hover {
                    background: rgba(59, 130, 246, 0.2);
                }
            `}</style>
        </article>
    );
}

export type { OfficialNewsItem };
