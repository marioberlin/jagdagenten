/**
 * Jagd Feed Routes
 *
 * Endpoints for the Waidmann-Feed (hunting news and community feed)
 * and News Curator Agent functionality.
 */

import { Elysia, t } from 'elysia';
import { randomUUID } from 'crypto';
import { loggerPlugin, dbLogger } from '../plugins/logger';

// ============================================================================
// Types
// ============================================================================

interface FeedItem {
    id: string;
    type: 'news' | 'community' | 'tip' | 'regulation' | 'weather' | 'wildlife';
    title: string;
    summary: string;
    content?: string;
    source: string;
    sourceUrl?: string;
    imageUrl?: string;
    publishedAt: string;
    relevanceScore: number;
    bundesland?: string;
    tags: string[];
    isBookmarked: boolean;
    isRead: boolean;
}

interface FeedSource {
    id: string;
    name: string;
    type: 'rss' | 'api' | 'scrape';
    url: string;
    isActive: boolean;
    lastFetchedAt?: string;
    bundesland?: string;
}

interface FeedPreferences {
    userId: string;
    enabledTypes: FeedItem['type'][];
    bundeslandFilter: string[];
    showReadItems: boolean;
    sortBy: 'date' | 'relevance';
}

// ============================================================================
// Mock Data
// ============================================================================

const mockFeedItems: FeedItem[] = [
    {
        id: '1',
        type: 'regulation',
        title: 'Neue ASP-Kerngebiete in Brandenburg',
        summary: 'Das Landwirtschaftsministerium hat neue Kerngebiete für die Afrikanische Schweinepest ausgewiesen.',
        source: 'Landesjagdverband Brandenburg',
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        relevanceScore: 0.95,
        bundesland: 'Brandenburg',
        tags: ['ASP', 'Schwarzwild', 'Regulation'],
        isBookmarked: false,
        isRead: false,
    },
    {
        id: '2',
        type: 'news',
        title: 'Rekord-Rotwildstrecke in Bayern',
        summary: 'Die Jagdsaison 2025/26 zeigt eine historisch hohe Rotwildstrecke im Bayerischen Wald.',
        source: 'BJV',
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
        relevanceScore: 0.82,
        bundesland: 'Bayern',
        tags: ['Rotwild', 'Statistik', 'Bayern'],
        isBookmarked: true,
        isRead: true,
    },
    {
        id: '3',
        type: 'tip',
        title: 'Tipps für die Rehbock-Saison',
        summary: 'Erfahrene Jäger teilen ihre besten Strategien für den Rehbock-Abschuss im Mai.',
        source: 'Waidwerk Digital',
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        relevanceScore: 0.78,
        tags: ['Rehwild', 'Ansitz', 'Tipps'],
        isBookmarked: false,
        isRead: false,
    },
    {
        id: '4',
        type: 'weather',
        title: 'Ideale Jagdbedingungen am Wochenende',
        summary: 'Leichter Wind aus Westen und bedeckter Himmel — perfekt für den Ansitz.',
        source: 'Jagdwetter Scout',
        publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        relevanceScore: 0.88,
        tags: ['Wetter', 'Ansitz'],
        isBookmarked: false,
        isRead: false,
    },
    {
        id: '5',
        type: 'wildlife',
        title: 'Luchs-Sichtung im Nationalpark Harz',
        summary: 'Erstmals seit 5 Jahren wurde wieder ein Luchs im östlichen Harz dokumentiert.',
        source: 'Naturschutzbund',
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        relevanceScore: 0.72,
        bundesland: 'Niedersachsen',
        tags: ['Luchs', 'Naturschutz', 'Sichtung'],
        isBookmarked: false,
        isRead: false,
    },
];

const mockSources: FeedSource[] = [
    { id: '1', name: 'DJV Newsfeed', type: 'rss', url: 'https://www.jagdverband.de/rss', isActive: true },
    { id: '2', name: 'BJV Bayern', type: 'rss', url: 'https://www.jagd-bayern.de/feed', isActive: true, bundesland: 'Bayern' },
    { id: '3', name: 'Wild und Hund', type: 'rss', url: 'https://www.wildundhund.de/feed', isActive: true },
    { id: '4', name: 'Jagdwetter API', type: 'api', url: 'https://api.jagdwetter.de/v1', isActive: false },
];

// ============================================================================
// Routes
// ============================================================================

export function createJagdFeedRoutes() {
    return new Elysia({ prefix: '/api/v1/jagd' })
        .use(loggerPlugin)

        // =========================================================================
        // Feed Items
        // =========================================================================

        .get('/feed', async ({ query }) => {
            try {
                const type = query?.type as FeedItem['type'] | undefined;
                const bundesland = query?.bundesland as string | undefined;
                const unreadOnly = query?.unreadOnly === 'true';

                let items = [...mockFeedItems];

                // Filter by type
                if (type) {
                    items = items.filter((i) => i.type === type);
                }

                // Filter by bundesland
                if (bundesland) {
                    items = items.filter((i) => !i.bundesland || i.bundesland === bundesland);
                }

                // Filter unread only
                if (unreadOnly) {
                    items = items.filter((i) => !i.isRead);
                }

                // Sort by date (newest first)
                items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

                return { feed: items, total: items.length };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to fetch feed');
                return { feed: [], total: 0, error: 'Failed to fetch feed' };
            }
        })

        .get('/feed/:id', async ({ params }) => {
            try {
                const item = mockFeedItems.find((i) => i.id === params.id);
                if (!item) {
                    return { error: 'Feed item not found' };
                }
                return { item };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to get feed item');
                return { error: 'Failed to get feed item' };
            }
        })

        .post('/feed/:id/read', async ({ params }) => {
            try {
                const item = mockFeedItems.find((i) => i.id === params.id);
                if (item) {
                    item.isRead = true;
                }
                return { success: true };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to mark as read');
                return { success: false };
            }
        })

        .post('/feed/:id/bookmark', async ({ params, body }) => {
            try {
                const item = mockFeedItems.find((i) => i.id === params.id);
                if (item) {
                    item.isBookmarked = (body as { bookmarked?: boolean })?.bookmarked ?? !item.isBookmarked;
                }
                return { success: true, bookmarked: item?.isBookmarked };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to toggle bookmark');
                return { success: false };
            }
        })

        // =========================================================================
        // Feed Sources Management
        // =========================================================================

        .get('/feed/sources', async () => {
            try {
                return { sources: mockSources };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to fetch feed sources');
                return { sources: [] };
            }
        })

        .post('/feed/sources', async ({ body }) => {
            try {
                const input = body as Partial<FeedSource>;
                const newSource: FeedSource = {
                    id: randomUUID(),
                    name: input.name || 'New Source',
                    type: input.type || 'rss',
                    url: input.url || '',
                    isActive: input.isActive ?? true,
                    bundesland: input.bundesland,
                };
                mockSources.push(newSource);
                return { source: newSource };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to add feed source');
                return { error: 'Failed to add feed source' };
            }
        })

        .delete('/feed/sources/:id', async ({ params }) => {
            try {
                const idx = mockSources.findIndex((s) => s.id === params.id);
                if (idx >= 0) {
                    mockSources.splice(idx, 1);
                }
                return { success: true };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to delete feed source');
                return { success: false };
            }
        })

        // =========================================================================
        // Feed Preferences
        // =========================================================================

        .get('/feed/preferences', async () => {
            try {
                const prefs: FeedPreferences = {
                    userId: 'current-user',
                    enabledTypes: ['news', 'regulation', 'tip', 'weather', 'wildlife'],
                    bundeslandFilter: [],
                    showReadItems: true,
                    sortBy: 'date',
                };
                return { preferences: prefs };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to fetch preferences');
                return { error: 'Failed to fetch preferences' };
            }
        })

        .put('/feed/preferences', async ({ body }) => {
            try {
                // Store preferences (mock)
                return { success: true, preferences: body };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to update preferences');
                return { success: false };
            }
        })

        // =========================================================================
        // Weekly Explore / Dashboard
        // =========================================================================

        .get('/explore/weekly', async () => {
            try {
                const weeklyData = {
                    weekOf: new Date().toISOString().split('T')[0],
                    summary: {
                        totalHunts: 3,
                        totalHours: 12.5,
                        harvestCount: 2,
                        topSpecies: 'Rehwild',
                        bestConditions: 'Dienstag, 06:15',
                    },
                    huntabilityForecast: [
                        { day: 'Montag', score: 72, conditions: 'Leichter Regen' },
                        { day: 'Dienstag', score: 88, conditions: 'Ideal — bedeckt, leichter Wind' },
                        { day: 'Mittwoch', score: 65, conditions: 'Starker Wind' },
                        { day: 'Donnerstag', score: 78, conditions: 'Bewölkt' },
                        { day: 'Freitag', score: 82, conditions: 'Gut — Nebel morgens' },
                        { day: 'Samstag', score: 90, conditions: 'Hervorragend' },
                        { day: 'Sonntag', score: 85, conditions: 'Sehr gut' },
                    ],
                    topNews: mockFeedItems.slice(0, 3),
                    upcomingEvents: [
                        { id: '1', title: 'Drückjagd Revier Süd', date: '2026-02-15', type: 'group_hunt' },
                        { id: '2', title: 'Hegering Versammlung', date: '2026-02-18', type: 'meeting' },
                    ],
                    regulationAlerts: [
                        { id: '1', title: 'Schonzeit Rehböcke beginnt', effectiveDate: '2026-02-01' },
                    ],
                };
                return { weekly: weeklyData };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to fetch weekly explore');
                return { error: 'Failed to fetch weekly data' };
            }
        })

        .get('/explore/stats', async ({ query }) => {
            try {
                const period = (query?.period as string) || 'month';
                const stats = {
                    period,
                    totalSessions: period === 'month' ? 12 : 52,
                    totalHours: period === 'month' ? 48.5 : 210.3,
                    totalHarvest: period === 'month' ? 5 : 23,
                    speciesBreakdown: [
                        { species: 'Rehwild', count: period === 'month' ? 3 : 14 },
                        { species: 'Schwarzwild', count: period === 'month' ? 1 : 6 },
                        { species: 'Fuchs', count: period === 'month' ? 1 : 3 },
                    ],
                    avgHuntabilityScore: 76,
                    mostActiveTime: '06:00 - 08:00',
                    favoriteStand: 'Hochsitz Waldrand',
                };
                return { stats };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to fetch stats');
                return { error: 'Failed to fetch stats' };
            }
        });
}
