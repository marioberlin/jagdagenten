/**
 * Function-calling schemas for Feed tools.
 * Based on types from packages/types-jagd/src/tools/feed-tools.ts
 */

export const publishPostSchema = {
  name: 'feed.publish_post',
  description:
    'Veroeffentlicht einen Beitrag im Jaeger-Feed (Sichtung, Geschichte, Strecke, Einladung oder Lernbeitrag). Optional mit Zeitverzoegerung fuer Datenschutz.',
  parameters: {
    type: 'object',
    properties: {
      postType: {
        type: 'string',
        enum: ['sighting', 'story', 'strecke', 'invite', 'lesson'],
        description: 'Art des Feed-Beitrags.',
      },
      title: {
        type: 'string',
        description: 'Optionaler Titel des Beitrags.',
      },
      content: {
        type: 'string',
        description: 'Inhalt / Text des Beitrags.',
      },
      photos: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optionale Liste von Foto-URLs oder -Referenzen.',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optionale Tags zur Kategorisierung.',
      },
      timeDelayHours: {
        type: 'number',
        description: 'Optionale Verzoegerung in Stunden vor der Veroeffentlichung (Datenschutz bei Standorten).',
      },
    },
    required: ['postType', 'content'],
  },
} as const;
