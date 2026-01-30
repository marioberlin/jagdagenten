/**
 * Stories API Routes
 *
 * Endpoints for Strecke stories with lessons learned templates.
 */

import { Elysia, t } from 'elysia';
import { randomUUID } from 'crypto';
import { componentLoggers } from '../logger.js';

const log = componentLoggers.http;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Story {
    id: string;
    userId: string;
    harvestId?: string;
    title?: string;
    content: string;
    photoUrls?: string[];
    videoUrl?: string;
    species?: string;
    weightKg?: number;
    dateWindow?: string;
    coarseArea?: string;
    // Lessons learned
    windConditions?: string;
    approachDirection?: string;
    shotDistanceM?: number;
    afterSearchNotes?: string;
    equipmentNotes?: string;
    // Meta
    isPublished: boolean;
    publishAt?: string;
    createdAt: string;
    viewCount: number;
    likeCount: number;
}

// ---------------------------------------------------------------------------
// In-Memory Store
// ---------------------------------------------------------------------------

const storyStore = new Map<string, Story>();

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export function createStoryRoutes() {
    return new Elysia({ prefix: '/api/v1/jagd/stories' })

        // Create story
        .post(
            '/',
            async ({ body }) => {
                const id = randomUUID();
                const now = new Date();

                const story: Story = {
                    id,
                    userId: body.userId || 'anonymous',
                    harvestId: body.harvestId,
                    title: body.title,
                    content: body.content,
                    photoUrls: body.photoUrls,
                    videoUrl: body.videoUrl,
                    species: body.species,
                    weightKg: body.weightKg,
                    dateWindow: body.dateWindow,
                    coarseArea: body.coarseArea,
                    windConditions: body.windConditions,
                    approachDirection: body.approachDirection,
                    shotDistanceM: body.shotDistanceM,
                    afterSearchNotes: body.afterSearchNotes,
                    equipmentNotes: body.equipmentNotes,
                    isPublished: body.publishNow || false,
                    publishAt: body.publishNow ? now.toISOString() : body.publishAt,
                    createdAt: now.toISOString(),
                    viewCount: 0,
                    likeCount: 0,
                };

                storyStore.set(id, story);
                log.info({ storyId: id }, 'Created story');

                return {
                    success: true,
                    story: {
                        id: story.id,
                        title: story.title,
                        isPublished: story.isPublished,
                    },
                };
            },
            {
                body: t.Object({
                    userId: t.Optional(t.String()),
                    harvestId: t.Optional(t.String()),
                    title: t.Optional(t.String()),
                    content: t.String(),
                    photoUrls: t.Optional(t.Array(t.String())),
                    videoUrl: t.Optional(t.String()),
                    species: t.Optional(t.String()),
                    weightKg: t.Optional(t.Number()),
                    dateWindow: t.Optional(t.String()),
                    coarseArea: t.Optional(t.String()),
                    windConditions: t.Optional(t.String()),
                    approachDirection: t.Optional(t.String()),
                    shotDistanceM: t.Optional(t.Number()),
                    afterSearchNotes: t.Optional(t.String()),
                    equipmentNotes: t.Optional(t.String()),
                    publishNow: t.Optional(t.Boolean()),
                    publishAt: t.Optional(t.String()),
                }),
            }
        )

        // List stories
        .get('/', async ({ query }) => {
            const stories = Array.from(storyStore.values())
                .filter((s) => s.isPublished)
                .filter((s) => {
                    if (query.species && s.species !== query.species) return false;
                    if (query.coarseArea && s.coarseArea !== query.coarseArea) return false;
                    return true;
                })
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, Number(query.limit) || 20)
                .map((s) => ({
                    id: s.id,
                    title: s.title || `${s.species || 'Strecke'} in ${s.coarseArea || 'Deutschland'}`,
                    summary: s.content.substring(0, 150) + (s.content.length > 150 ? '...' : ''),
                    species: s.species,
                    weightKg: s.weightKg,
                    dateWindow: s.dateWindow,
                    coarseArea: s.coarseArea,
                    photoUrls: s.photoUrls,
                    hasLessonsLearned: !!(s.windConditions || s.approachDirection || s.shotDistanceM),
                    viewCount: s.viewCount,
                    likeCount: s.likeCount,
                    createdAt: s.createdAt,
                }));

            return { success: true, stories, count: stories.length };
        })

        // Get single story
        .get('/:id', async ({ params, set }) => {
            const story = storyStore.get(params.id);

            if (!story) {
                set.status = 404;
                return { error: 'Story nicht gefunden' };
            }

            // Increment view count
            story.viewCount++;
            storyStore.set(params.id, story);

            return {
                success: true,
                story: {
                    id: story.id,
                    title: story.title,
                    content: story.content,
                    species: story.species,
                    weightKg: story.weightKg,
                    dateWindow: story.dateWindow,
                    coarseArea: story.coarseArea,
                    photoUrls: story.photoUrls,
                    videoUrl: story.videoUrl,
                    lessonsLearned: {
                        windConditions: story.windConditions,
                        approachDirection: story.approachDirection,
                        shotDistanceM: story.shotDistanceM,
                        afterSearchNotes: story.afterSearchNotes,
                        equipmentNotes: story.equipmentNotes,
                    },
                    viewCount: story.viewCount,
                    likeCount: story.likeCount,
                    createdAt: story.createdAt,
                },
            };
        })

        // Update story
        .put('/:id', async ({ params, body, set }) => {
            const story = storyStore.get(params.id);

            if (!story) {
                set.status = 404;
                return { error: 'Story nicht gefunden' };
            }

            // Check ownership
            if (story.userId !== body.userId) {
                set.status = 403;
                return { error: 'Keine Berechtigung' };
            }

            const updated: Story = {
                ...story,
                ...body,
                id: story.id,
                userId: story.userId,
                createdAt: story.createdAt,
            };

            storyStore.set(params.id, updated);
            log.info({ storyId: params.id }, 'Updated story');

            return { success: true };
        })

        // Delete story
        .delete('/:id', async ({ params, body, set }) => {
            const story = storyStore.get(params.id);

            if (!story) {
                set.status = 404;
                return { error: 'Story nicht gefunden' };
            }

            if (story.userId !== body?.userId) {
                set.status = 403;
                return { error: 'Keine Berechtigung' };
            }

            storyStore.delete(params.id);
            log.info({ storyId: params.id }, 'Deleted story');

            return { success: true };
        })

        // Like story
        .post('/:id/like', async ({ params, set }) => {
            const story = storyStore.get(params.id);

            if (!story) {
                set.status = 404;
                return { error: 'Story nicht gefunden' };
            }

            story.likeCount++;
            storyStore.set(params.id, story);

            return { success: true, likeCount: story.likeCount };
        })

        // Create story from journal entry
        .post('/from-journal/:entryId', async ({ params, body }) => {
            // In production, this would fetch the journal entry and pre-fill the story
            const id = randomUUID();
            const now = new Date();

            const story: Story = {
                id,
                userId: body?.userId || 'anonymous',
                harvestId: params.entryId,
                title: body?.title,
                content: body?.content || '',
                species: body?.species,
                weightKg: body?.weightKg,
                dateWindow: body?.dateWindow,
                coarseArea: body?.coarseArea,
                isPublished: false,
                createdAt: now.toISOString(),
                viewCount: 0,
                likeCount: 0,
            };

            storyStore.set(id, story);

            return {
                success: true,
                story: {
                    id: story.id,
                    message: 'Story aus Tagebucheintrag erstellt. Bearbeite sie, um mehr Details hinzuzufügen.',
                },
            };
        });
}

export default createStoryRoutes;
