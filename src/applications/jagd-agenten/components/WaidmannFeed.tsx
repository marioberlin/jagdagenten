/**
 * Waidmann-Feed Component
 *
 * Displays hunting news, tips, regulations, and community content
 * filtered by user preferences and relevance.
 */

import React, { useEffect, useState } from 'react';
import {
    Newspaper,
    BookOpen,
    AlertTriangle,
    Cloud,
    Squirrel,
    Users,
    Bookmark,
    BookmarkCheck,
    Filter,
    RefreshCw,
    ExternalLink,
    Clock,
    MapPin,
} from 'lucide-react';
import { useFeedStore, type FeedItem } from '@/stores/useFeedStore';

// ============================================================================
// Constants
// ============================================================================

const FEED_TYPE_CONFIG: Record<FeedItem['type'], { label: string; color: string; icon: React.ReactNode }> = {
    news: {
        label: 'Nachrichten',
        color: 'text-blue-400 bg-blue-500/10',
        icon: <Newspaper className="w-4 h-4" />,
    },
    community: {
        label: 'Community',
        color: 'text-purple-400 bg-purple-500/10',
        icon: <Users className="w-4 h-4" />,
    },
    tip: {
        label: 'Tipps',
        color: 'text-green-400 bg-green-500/10',
        icon: <BookOpen className="w-4 h-4" />,
    },
    regulation: {
        label: 'Vorschriften',
        color: 'text-red-400 bg-red-500/10',
        icon: <AlertTriangle className="w-4 h-4" />,
    },
    weather: {
        label: 'Wetter',
        color: 'text-cyan-400 bg-cyan-500/10',
        icon: <Cloud className="w-4 h-4" />,
    },
    wildlife: {
        label: 'Wildbeobachtung',
        color: 'text-amber-400 bg-amber-500/10',
        icon: <Squirrel className="w-4 h-4" />,
    },
};

const FILTER_TYPES: Array<FeedItem['type'] | 'all'> = ['all', 'news', 'regulation', 'tip', 'weather', 'wildlife', 'community'];

// ============================================================================
// Feed Item Card
// ============================================================================

interface FeedItemCardProps {
    item: FeedItem;
    onRead: (id: string) => void;
    onBookmark: (id: string) => void;
}

function FeedItemCard({ item, onRead, onBookmark }: FeedItemCardProps) {
    const typeConfig = FEED_TYPE_CONFIG[item.type];

    const handleClick = () => {
        if (!item.isRead) {
            onRead(item.id);
        }
    };

    const timeAgo = getTimeAgo(item.publishedAt);

    return (
        <div
            onClick={handleClick}
            className={`bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4 hover:border-white/20 transition-all cursor-pointer ${item.isRead ? 'opacity-70' : ''
                }`}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${typeConfig.color}`}>
                    {typeConfig.icon}
                    <span>{typeConfig.label}</span>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onBookmark(item.id);
                    }}
                    className={`p-1.5 rounded-lg transition-all ${item.isBookmarked
                            ? 'text-yellow-400 bg-yellow-500/10'
                            : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                        }`}
                >
                    {item.isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </button>
            </div>

            {/* Title */}
            <h3 className={`font-semibold text-white mb-2 ${item.isRead ? '' : 'text-lg'}`}>
                {item.title}
            </h3>

            {/* Summary */}
            <p className="text-sm text-white/70 mb-3 line-clamp-2">{item.summary}</p>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-white/50">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo}
                    </span>
                    {item.bundesland && (
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {item.bundesland}
                        </span>
                    )}
                </div>

                <span className="flex items-center gap-1">
                    {item.source}
                    {item.sourceUrl && <ExternalLink className="w-3 h-3" />}
                </span>
            </div>

            {/* Tags */}
            {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                    {item.tags.slice(0, 4).map((tag) => (
                        <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-white/5 text-white/50 text-xs"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
        return `vor ${diffMins} Min.`;
    } else if (diffHours < 24) {
        return `vor ${diffHours} Std.`;
    } else if (diffDays === 1) {
        return 'gestern';
    } else {
        return `vor ${diffDays} Tagen`;
    }
}

// ============================================================================
// Main Component
// ============================================================================

export function WaidmannFeed() {
    const { feedItems, feedLoading, feedError, fetchFeed, markAsRead, toggleBookmark } = useFeedStore();
    const [activeFilter, setActiveFilter] = useState<FeedItem['type'] | 'all'>('all');

    useEffect(() => {
        fetchFeed();
    }, [fetchFeed]);

    const handleRefresh = () => {
        const filters = activeFilter === 'all' ? undefined : { type: activeFilter };
        fetchFeed(filters);
    };

    const handleFilterChange = (filter: FeedItem['type'] | 'all') => {
        setActiveFilter(filter);
        const filters = filter === 'all' ? undefined : { type: filter };
        fetchFeed(filters);
    };

    const displayedItems = activeFilter === 'all'
        ? feedItems
        : feedItems.filter((item) => item.type === activeFilter);

    const unreadCount = feedItems.filter((i) => !i.isRead).length;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Waidmann-Feed</h1>
                    <p className="text-sm text-white/60">
                        {unreadCount > 0 ? `${unreadCount} ungelesene Beiträge` : 'Alle Beiträge gelesen'}
                    </p>
                </div>

                <button
                    onClick={handleRefresh}
                    disabled={feedLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${feedLoading ? 'animate-spin' : ''}`} />
                    <span>Aktualisieren</span>
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <Filter className="w-4 h-4 text-white/50 flex-shrink-0" />
                {FILTER_TYPES.map((filter) => (
                    <button
                        key={filter}
                        onClick={() => handleFilterChange(filter)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeFilter === filter
                                ? 'bg-green-600 text-white'
                                : 'bg-white/5 text-white/70 hover:bg-white/10'
                            }`}
                    >
                        {filter === 'all' ? 'Alle' : FEED_TYPE_CONFIG[filter].label}
                    </button>
                ))}
            </div>

            {/* Error State */}
            {feedError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200">
                    {feedError}
                </div>
            )}

            {/* Loading State */}
            {feedLoading && feedItems.length === 0 && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
                </div>
            )}

            {/* Empty State */}
            {!feedLoading && displayedItems.length === 0 && (
                <div className="text-center py-12 text-white/50">
                    <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Keine Beiträge gefunden</p>
                    <p className="text-sm mt-1">Versuchen Sie einen anderen Filter.</p>
                </div>
            )}

            {/* Feed Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedItems.map((item) => (
                    <FeedItemCard
                        key={item.id}
                        item={item}
                        onRead={markAsRead}
                        onBookmark={toggleBookmark}
                    />
                ))}
            </div>
        </div>
    );
}
