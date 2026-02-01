/**
 * WaidmannFeed Component
 *
 * Main container for the privacy-first community feed.
 * Integrates all feed sections: Sightings, Stories, Invites, Official News.
 */

import { useState, useEffect } from 'react';
import { RefreshCw, Plus, Shield, AlertTriangle } from 'lucide-react';
import { FeedFilterTabs, FeedSortOptions, OfficialNewsCard, TrendCard } from '../Feed';
import type { FeedTab, SortOption, OfficialNewsItem, TrendData } from '../Feed';
import { SightingRadar } from '../SightingRadar';
import { StoryCard, StoryEditor } from '../Stories';
import { InviteCard, InviteEditor } from '../Invites';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WaidmannFeedProps {
    userId?: string;
    defaultTab?: FeedTab;
    bundesland?: string;
}

interface FeedCounts {
    sichtungen: number;
    strecke: number;
    einladungen: number;
    offiziell: number;
    news: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WaidmannFeed({
    userId,
    defaultTab = 'sichtungen',
    bundesland,
}: WaidmannFeedProps) {
    const [activeTab, setActiveTab] = useState<FeedTab>(defaultTab);
    const [sortOption, setSortOption] = useState<SortOption>('newest');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data states
    const [counts, setCounts] = useState<FeedCounts>({
        sichtungen: 0,
        strecke: 0,
        einladungen: 0,
        offiziell: 0,
        news: 0,
    });
    const [stories, setStories] = useState<Record<string, unknown>[]>([]);
    const [invites, setInvites] = useState<Record<string, unknown>[]>([]);
    const [news, setNews] = useState<OfficialNewsItem[]>([]);
    const [trends, setTrends] = useState<TrendData[]>([]);

    // Editor states
    const [showStoryEditor, setShowStoryEditor] = useState(false);
    const [showInviteEditor, setShowInviteEditor] = useState(false);

    // Fetch data based on active tab
    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            switch (activeTab) {
                case 'strecke': {
                    const res = await fetch(`/api/v1/jagd/stories?sort=${sortOption}`);
                    const data = await res.json();
                    if (data.success) setStories(data.stories);
                    break;
                }
                case 'einladungen': {
                    const params = new URLSearchParams({ sort: sortOption });
                    if (bundesland) params.set('bundesland', bundesland);
                    const res = await fetch(`/api/v1/jagd/invites?${params}`);
                    const data = await res.json();
                    if (data.success) setInvites(data.invites);
                    break;
                }
                case 'offiziell':
                case 'news': {
                    const res = await fetch('/api/v1/jagd/news');
                    const data = await res.json();
                    if (data.success) setNews(data.items);
                    break;
                }
            }

            // Fetch counts
            const countsRes = await fetch('/api/v1/jagd/feed/counts');
            const countsData = await countsRes.json();
            if (countsData.success) setCounts(countsData.counts);

            // Fetch trends for trend tab or sidebar
            const trendsRes = await fetch('/api/v1/jagd/sightings/aggregates');
            const trendsData = await trendsRes.json();
            if (trendsData.success) {
                setTrends(trendsData.aggregates.map((agg: Record<string, unknown>) => ({
                    id: `trend-${agg.gridCell}-${agg.species}`,
                    type: 'species',
                    label: agg.speciesLabel || agg.species,
                    currentCount: agg.count || 0,
                    changePercent: agg.trendPercentage || 0,
                    direction: (agg.trendPercentage as number) > 0 ? 'up' : (agg.trendPercentage as number) < 0 ? 'down' : 'stable',
                    confidence: 0.7,
                    timeWindow: '7d',
                    bundesland: agg.bundesland as string | undefined,
                })));
            }
        } catch (_err) {
            setError('Fehler beim Laden');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab !== 'sichtungen') {
            fetchData();
        }
    }, [activeTab, sortOption, bundesland]);

    // Handle new content creation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleCreateStory = async (data: any) => {
        const res = await fetch('/api/v1/jagd/stories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, userId }),
        });
        if (res.ok) {
            setShowStoryEditor(false);
            fetchData();
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleCreateInvite = async (data: any) => {
        const res = await fetch('/api/v1/jagd/invites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, hostId: userId }),
        });
        if (res.ok) {
            setShowInviteEditor(false);
            fetchData();
        }
    };

    // ---------------------------------------------------------------------------
    // Render Content
    // ---------------------------------------------------------------------------

    const renderContent = () => {
        if (loading) {
            return (
                <div className="loading-state">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span>Laden...</span>
                </div>
            );
        }

        if (error) {
            return (
                <div className="error-state">
                    <AlertTriangle className="w-6 h-6" />
                    <span>{error}</span>
                    <button onClick={fetchData} className="retry-btn">Erneut versuchen</button>
                </div>
            );
        }

        switch (activeTab) {
            case 'sichtungen':
                return <SightingRadar userId={userId} bundesland={bundesland} showCreateButton />;

            case 'strecke':
                return (
                    <div className="stories-list">
                        {stories.length === 0 ? (
                            <div className="empty-state">
                                <p>Noch keine Stories</p>
                                <button onClick={() => setShowStoryEditor(true)} className="cta-btn">
                                    Erste Story teilen
                                </button>
                            </div>
                        ) : (
                            stories.map((story: any) => (
                                <StoryCard key={story.id} story={story} />
                            ))
                        )}
                    </div>
                );

            case 'einladungen':
                return (
                    <div className="invites-list">
                        {invites.length === 0 ? (
                            <div className="empty-state">
                                <p>Keine Einladungen in deiner Region</p>
                                <button onClick={() => setShowInviteEditor(true)} className="cta-btn">
                                    Einladung erstellen
                                </button>
                            </div>
                        ) : (
                            invites.map((invite: any) => (
                                <InviteCard key={invite.id} invite={invite} />
                            ))
                        )}
                    </div>
                );

            case 'offiziell':
            case 'news':
                return (
                    <div className="news-list">
                        {news.length === 0 ? (
                            <div className="empty-state">
                                <p>Keine aktuellen Nachrichten</p>
                            </div>
                        ) : (
                            news.map(item => (
                                <OfficialNewsCard key={item.id} item={item} />
                            ))
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    // ---------------------------------------------------------------------------
    // Main Render
    // ---------------------------------------------------------------------------

    return (
        <div className="waidmann-feed">
            {/* Header */}
            <div className="feed-header">
                <h2>Waidmann-Feed</h2>
                <div className="header-actions">
                    <button onClick={fetchData} className="refresh-btn" title="Aktualisieren">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    {(activeTab === 'strecke' || activeTab === 'einladungen') && (
                        <button
                            onClick={() => activeTab === 'strecke' ? setShowStoryEditor(true) : setShowInviteEditor(true)}
                            className="create-btn"
                        >
                            <Plus className="w-4 h-4" />
                            <span>{activeTab === 'strecke' ? 'Story' : 'Einladung'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Privacy notice */}
            <div className="privacy-notice">
                <Shield className="w-4 h-4" />
                <span>Alle Standorte auf 5km gerundet • 24-72h Verzögerung • k-Anonymisiert</span>
            </div>

            {/* Tabs */}
            <FeedFilterTabs activeTab={activeTab} onChange={setActiveTab} counts={counts} />

            {/* Sort options */}
            <div className="sort-row">
                <FeedSortOptions activeSort={sortOption} onChange={setSortOption} />
            </div>

            {/* Content */}
            <div className="feed-content">
                {renderContent()}
            </div>

            {/* Trends sidebar (desktop) */}
            {trends.length > 0 && (
                <div className="trends-sidebar">
                    <h3>Aktuelle Trends</h3>
                    {trends.slice(0, 3).map(trend => (
                        <TrendCard key={trend.id} trend={trend} />
                    ))}
                </div>
            )}

            {/* Editors */}
            {showStoryEditor && (
                <StoryEditor
                    onSave={handleCreateStory}
                    onCancel={() => setShowStoryEditor(false)}
                />
            )}
            {showInviteEditor && (
                <InviteEditor
                    onSave={handleCreateInvite}
                    onCancel={() => setShowInviteEditor(false)}
                />
            )}

            <style>{`
                .waidmann-feed {
                    background: var(--glass-bg-regular);
                    border-radius: 16px;
                    padding: 20px;
                    position: relative;
                }

                .feed-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .feed-header h2 {
                    margin: 0;
                    font-size: 1.5rem;
                    color: var(--text-primary);
                }

                .header-actions {
                    display: flex;
                    gap: 8px;
                }

                .refresh-btn, .create-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 12px;
                    border-radius: 8px;
                    border: none;
                    cursor: pointer;
                    font-size: 0.85rem;
                }

                .refresh-btn {
                    background: var(--glass-surface);
                    color: var(--text-secondary);
                }

                .create-btn {
                    background: var(--glass-accent, #10b981);
                    color: white;
                }

                .privacy-notice {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 14px;
                    background: rgba(16, 185, 129, 0.1);
                    border-radius: 8px;
                    font-size: 0.75rem;
                    color: var(--glass-accent, #10b981);
                    margin-bottom: 16px;
                }

                .sort-row {
                    margin: 12px 0;
                }

                .feed-content {
                    min-height: 300px;
                }

                .stories-list, .invites-list, .news-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .loading-state, .error-state, .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    padding: 40px;
                    color: var(--text-secondary);
                }

                .cta-btn, .retry-btn {
                    margin-top: 8px;
                    padding: 10px 18px;
                    background: var(--glass-accent, #10b981);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                }

                .trends-sidebar {
                    margin-top: 24px;
                    padding-top: 20px;
                    border-top: 1px solid var(--glass-border);
                }

                .trends-sidebar h3 {
                    margin: 0 0 12px;
                    font-size: 1rem;
                    color: var(--text-primary);
                }

                .trends-sidebar > div {
                    margin-bottom: 10px;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .animate-spin {
                    animation: spin 1s linear infinite;
                }

                @media (min-width: 1024px) {
                    .waidmann-feed {
                        display: grid;
                        grid-template-columns: 1fr 280px;
                        gap: 20px;
                    }

                    .feed-header, .privacy-notice, .sort-row, .feed-content {
                        grid-column: 1;
                    }

                    .trends-sidebar {
                        grid-column: 2;
                        grid-row: 1 / -1;
                        margin-top: 0;
                        padding-top: 0;
                        border-top: none;
                        border-left: 1px solid var(--glass-border);
                        padding-left: 20px;
                    }
                }
            `}</style>
        </div>
    );
}
