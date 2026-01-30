/**
 * Story of the Week Dashboard
 *
 * - Editorial pick (curated)
 * - Community top story
 * - "What we learned" summary
 * - Previous weeks archive
 */

import { useState, useEffect } from 'react';
import {
    BookOpen,
    Star,
    Award,
    Users,
    Calendar,
    Heart,
    MessageCircle,
    ChevronRight,
    Lightbulb,
    RefreshCw,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Story {
    id: string;
    title: string;
    author: string;
    excerpt: string;
    date: string;
    photoUrl?: string;
    species?: string;
    likes: number;
    comments: number;
    isFeatured: boolean;
}

interface WeeklyLesson {
    id: string;
    title: string;
    insight: string;
    source: string;
}

interface StoryOfWeekData {
    featuredStory: Story;
    topCommunityStory: Story;
    lessonsLearned: WeeklyLesson[];
    weekOf: string;
    previousWeeks: { weekOf: string; storyTitle: string }[];
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

function getMockData(): StoryOfWeekData {
    return {
        featuredStory: {
            id: '1',
            title: 'Der perfekte Ansitz: Wie Geduld zum kapitalen Keiler führte',
            author: 'JägerHans67',
            excerpt: 'Nach drei Wochen des Ansitzens ohne Anblick änderte ich meine Strategie. Statt den Hauptwechsel zu beobachten, wählte ich einen unscheinbaren Nebeneinstand...',
            date: '2026-01-28',
            photoUrl: undefined,
            species: 'Schwarzwild',
            likes: 247,
            comments: 34,
            isFeatured: true,
        },
        topCommunityStory: {
            id: '2',
            title: 'Erste Drückjagd als Hundeführer',
            author: 'WaldWanderer',
            excerpt: 'Mit gemischten Gefühlen trat ich meine erste Drückjagd als Hundeführer an. Mein Teckel Bello war gut ausgebildet, aber die Praxis ist immer anders als die Theorie...',
            date: '2026-01-26',
            photoUrl: undefined,
            species: 'Schwarzwild',
            likes: 189,
            comments: 52,
            isFeatured: false,
        },
        lessonsLearned: [
            {
                id: '1',
                title: 'Windrichtung unterschätzt',
                insight: 'Erfahrene Jäger berichten diese Woche: Thermik ändert sich schneller als gedacht. Mehrfache Windchecks während des Ansitzes lohnen sich.',
                source: 'Aus 12 Stories dieser Woche',
            },
            {
                id: '2',
                title: 'Anschuss-Markierung spart Zeit',
                insight: 'GPS-Markierung des Anschusses direkt nach dem Schuss erleichtert die Nachsuche erheblich, besonders bei schwieriger Vegetation.',
                source: 'Aus 8 Stories dieser Woche',
            },
        ],
        weekOf: '2026-01-27',
        previousWeeks: [
            { weekOf: '2026-01-20', storyTitle: 'Winterjagd in den Alpen' },
            { weekOf: '2026-01-13', storyTitle: 'Rehwild im Januar' },
            { weekOf: '2026-01-06', storyTitle: 'Neujahrsansitz mit Überraschung' },
        ],
    };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FeaturedStoryCard({ story }: { story: Story }) {
    return (
        <div className="featured-story">
            <div className="featured-badge">
                <Star className="w-4 h-4" />
                Redaktions-Pick
            </div>

            <h3 className="story-title">{story.title}</h3>

            <div className="story-meta">
                <span className="author">{story.author}</span>
                <span className="separator">·</span>
                <span className="date">
                    {new Date(story.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })}
                </span>
                {story.species && (
                    <>
                        <span className="separator">·</span>
                        <span className="species">{story.species}</span>
                    </>
                )}
            </div>

            <p className="story-excerpt">{story.excerpt}</p>

            <div className="story-actions">
                <button className="action-btn">
                    <Heart className="w-4 h-4" />
                    {story.likes}
                </button>
                <button className="action-btn">
                    <MessageCircle className="w-4 h-4" />
                    {story.comments}
                </button>
                <button className="read-more">
                    Weiterlesen
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <style>{`
                .featured-story {
                    padding: 20px;
                    background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.02));
                    border: 1px solid rgba(245, 158, 11, 0.3);
                    border-radius: 14px;
                }
                .featured-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 10px;
                    background: rgba(245, 158, 11, 0.2);
                    color: #f59e0b;
                    border-radius: 12px;
                    font-size: 0.7rem;
                    font-weight: 500;
                    margin-bottom: 12px;
                }
                .story-title {
                    font-size: 1.15rem;
                    font-weight: 600;
                    color: var(--text-primary, #fff);
                    margin: 0 0 10px;
                    line-height: 1.3;
                }
                .story-meta {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.75rem;
                    color: var(--text-tertiary, #666);
                    margin-bottom: 12px;
                }
                .author {
                    color: #f59e0b;
                }
                .story-excerpt {
                    font-size: 0.9rem;
                    color: var(--text-secondary, #aaa);
                    line-height: 1.5;
                    margin: 0 0 16px;
                }
                .story-actions {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .action-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 10px;
                    background: var(--bg-secondary, #1a1a2e);
                    border: 1px solid var(--border-color, #333);
                    border-radius: 8px;
                    color: var(--text-secondary, #aaa);
                    font-size: 0.8rem;
                    cursor: pointer;
                }
                .read-more {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    margin-left: auto;
                    padding: 8px 14px;
                    background: #f59e0b;
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: 0.85rem;
                    font-weight: 500;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
}

function CommunityStoryCard({ story }: { story: Story }) {
    return (
        <div className="community-story">
            <div className="community-badge">
                <Users className="w-4 h-4" />
                Community-Favorit
            </div>

            <h4 className="story-title">{story.title}</h4>

            <div className="story-meta">
                <span>{story.author}</span>
                <span className="separator">·</span>
                <Heart className="w-3 h-3" style={{ color: '#ef4444' }} />
                <span>{story.likes}</span>
            </div>

            <p className="story-excerpt">{story.excerpt}</p>

            <style>{`
                .community-story {
                    padding: 14px;
                    background: var(--bg-secondary, #1a1a2e);
                    border: 1px solid var(--border-color, #333);
                    border-radius: 12px;
                }
                .community-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 3px 8px;
                    background: rgba(59, 130, 246, 0.15);
                    color: #3b82f6;
                    border-radius: 10px;
                    font-size: 0.65rem;
                    font-weight: 500;
                    margin-bottom: 10px;
                }
                .community-story .story-title {
                    font-size: 1rem;
                    margin-bottom: 8px;
                }
                .community-story .story-excerpt {
                    font-size: 0.85rem;
                    margin-bottom: 0;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
}

function LessonCard({ lesson }: { lesson: WeeklyLesson }) {
    return (
        <div className="lesson-card">
            <Lightbulb className="w-5 h-5" />
            <div>
                <h5 className="lesson-title">{lesson.title}</h5>
                <p className="lesson-insight">{lesson.insight}</p>
                <span className="lesson-source">{lesson.source}</span>
            </div>

            <style>{`
                .lesson-card {
                    display: flex;
                    gap: 14px;
                    padding: 14px;
                    background: rgba(16, 185, 129, 0.05);
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    border-radius: 12px;
                    color: #10b981;
                }
                .lesson-title {
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: var(--text-primary, #fff);
                    margin: 0 0 6px;
                }
                .lesson-insight {
                    font-size: 0.85rem;
                    color: var(--text-secondary, #aaa);
                    line-height: 1.4;
                    margin: 0 0 8px;
                }
                .lesson-source {
                    font-size: 0.7rem;
                    color: var(--text-tertiary, #666);
                }
            `}</style>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function StoryOfWeek() {
    const [data, setData] = useState<StoryOfWeekData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setData(getMockData());
            setLoading(false);
        }, 400);
    }, []);

    if (loading || !data) {
        return (
            <div className="story-loading">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span>Lade Story der Woche...</span>
            </div>
        );
    }

    return (
        <div className="story-of-week">
            {/* Header */}
            <div className="story-header">
                <div className="header-title">
                    <BookOpen className="w-5 h-5" />
                    <h2>Story der Woche</h2>
                </div>
                <span className="week-label">
                    <Calendar className="w-4 h-4" />
                    KW {Math.ceil((new Date(data.weekOf).getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 604800000)}
                </span>
            </div>

            {/* Featured Story */}
            <FeaturedStoryCard story={data.featuredStory} />

            {/* Community Top */}
            <section className="section">
                <CommunityStoryCard story={data.topCommunityStory} />
            </section>

            {/* What We Learned */}
            <section className="section">
                <h3 className="section-title">
                    <Lightbulb className="w-4 h-4" />
                    Was wir gelernt haben
                </h3>
                <div className="lessons-list">
                    {data.lessonsLearned.map(l => (
                        <LessonCard key={l.id} lesson={l} />
                    ))}
                </div>
            </section>

            {/* Archive */}
            <section className="section">
                <h3 className="section-title">
                    <Award className="w-4 h-4" />
                    Vorherige Wochen
                </h3>
                <div className="archive-list">
                    {data.previousWeeks.map((w, i) => (
                        <button key={i} className="archive-item">
                            <span className="archive-date">
                                {new Date(w.weekOf).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className="archive-title">{w.storyTitle}</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    ))}
                </div>
            </section>

            <style>{`
                .story-of-week {
                    padding: 16px;
                }
                .story-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 60px;
                    color: var(--text-secondary, #aaa);
                }
                .story-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 16px;
                }
                .header-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .header-title h2 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--text-primary, #fff);
                    margin: 0;
                }
                .week-label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.8rem;
                    color: var(--text-tertiary, #666);
                }
                .section {
                    margin-top: 20px;
                }
                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: var(--text-primary, #fff);
                    margin: 0 0 12px;
                }
                .lessons-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .archive-list {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .archive-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 12px;
                    background: var(--bg-secondary, #1a1a2e);
                    border: 1px solid var(--border-color, #333);
                    border-radius: 8px;
                    color: var(--text-primary, #fff);
                    text-align: left;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .archive-item:hover {
                    border-color: #f59e0b;
                }
                .archive-date {
                    font-size: 0.75rem;
                    color: var(--text-tertiary, #666);
                    min-width: 60px;
                }
                .archive-title {
                    flex: 1;
                    font-size: 0.85rem;
                }
                .archive-item svg {
                    color: var(--text-tertiary, #666);
                }
            `}</style>
        </div>
    );
}
