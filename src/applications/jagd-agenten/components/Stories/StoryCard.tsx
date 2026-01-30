/**
 * StoryCard Component
 *
 * Displays a harvest story with lessons learned preview.
 */

import { Heart, Eye, MapPin, Calendar, Lightbulb } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Story {
    id: string;
    title: string;
    summary: string;
    species?: string;
    weightKg?: number;
    dateWindow?: string;
    coarseArea?: string;
    photoUrls?: string[];
    hasLessonsLearned: boolean;
    viewCount: number;
    likeCount: number;
    createdAt: string;
}

interface StoryCardProps {
    story: Story;
    onClick?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SPECIES_ICONS: Record<string, string> = {
    schwarzwild: '🐗',
    rotwild: '🦌',
    rehwild: '🦌',
    damwild: '🦌',
    muffelwild: '🐏',
    fuchs: '🦊',
};

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Heute';
    if (diffDays === 1) return 'Gestern';
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    if (diffDays < 30) return `vor ${Math.floor(diffDays / 7)} Woche${Math.floor(diffDays / 7) > 1 ? 'n' : ''}`;
    return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StoryCard({ story, onClick }: StoryCardProps) {
    const speciesIcon = story.species ? SPECIES_ICONS[story.species] || '🎯' : '📖';

    return (
        <div className="story-card" onClick={onClick}>
            {/* Photo */}
            {story.photoUrls && story.photoUrls.length > 0 && (
                <div className="photo-container">
                    <img src={story.photoUrls[0]} alt={story.title} />
                    {story.photoUrls.length > 1 && (
                        <span className="photo-count">+{story.photoUrls.length - 1}</span>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="card-content">
                {/* Header */}
                <div className="card-header">
                    <span className="species-icon">{speciesIcon}</span>
                    <h4 className="title">{story.title}</h4>
                </div>

                {/* Meta */}
                <div className="card-meta">
                    {story.weightKg && (
                        <span className="meta-item">
                            ⚖️ {story.weightKg} kg
                        </span>
                    )}
                    {story.coarseArea && (
                        <span className="meta-item">
                            <MapPin className="w-3 h-3" />
                            {story.coarseArea}
                        </span>
                    )}
                    {story.dateWindow && (
                        <span className="meta-item">
                            <Calendar className="w-3 h-3" />
                            {story.dateWindow}
                        </span>
                    )}
                </div>

                {/* Summary */}
                <p className="summary">{story.summary}</p>

                {/* Lessons badge */}
                {story.hasLessonsLearned && (
                    <div className="lessons-badge">
                        <Lightbulb className="w-3 h-3" />
                        <span>Lessons Learned</span>
                    </div>
                )}

                {/* Footer */}
                <div className="card-footer">
                    <div className="stats">
                        <span className="stat">
                            <Eye className="w-3 h-3" />
                            {story.viewCount}
                        </span>
                        <span className="stat">
                            <Heart className="w-3 h-3" />
                            {story.likeCount}
                        </span>
                    </div>
                    <span className="timestamp">{formatTimeAgo(story.createdAt)}</span>
                </div>
            </div>

            <style>{`
                .story-card {
                    background: var(--bg-tertiary, #2a2a4a);
                    border-radius: 12px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .story-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                }

                .photo-container {
                    position: relative;
                    height: 140px;
                    overflow: hidden;
                }

                .photo-container img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .photo-count {
                    position: absolute;
                    bottom: 8px;
                    right: 8px;
                    padding: 2px 8px;
                    background: rgba(0, 0, 0, 0.7);
                    border-radius: 4px;
                    font-size: 0.75rem;
                    color: white;
                }

                .card-content {
                    padding: 14px;
                }

                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                }

                .species-icon {
                    font-size: 1.25rem;
                }

                .title {
                    margin: 0;
                    font-size: 1rem;
                    color: var(--text-primary, #fff);
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .card-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-bottom: 8px;
                }

                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.75rem;
                    color: var(--text-secondary, #aaa);
                }

                .summary {
                    margin: 0 0 10px;
                    font-size: 0.875rem;
                    color: var(--text-secondary, #aaa);
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .lessons-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 8px;
                    background: rgba(245, 158, 11, 0.2);
                    border-radius: 4px;
                    font-size: 0.7rem;
                    color: #f59e0b;
                    margin-bottom: 10px;
                }

                .card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .stats {
                    display: flex;
                    gap: 12px;
                }

                .stat {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.75rem;
                    color: var(--text-tertiary, #666);
                }

                .timestamp {
                    font-size: 0.7rem;
                    color: var(--text-tertiary, #666);
                }
            `}</style>
        </div>
    );
}
