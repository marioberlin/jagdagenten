/**
 * Function-calling schemas for Moderation tools.
 * Based on types from packages/types-jagd/src/tools/moderation-tools.ts
 */

export const checkPostSchema = {
  name: 'moderation.check_post',
  description:
    'Prueft einen Beitrag, eine Story oder einen Kommentar auf Verstoesse gegen Gemeinschaftsrichtlinien (Geo-Leaks, sensible Inhalte, Waidgerechtigkeit).',
  parameters: {
    type: 'object',
    properties: {
      contentType: {
        type: 'string',
        enum: ['feed_post', 'story', 'comment'],
        description: 'Art des zu pruefenden Inhalts.',
      },
      contentId: {
        type: 'string',
        description: 'ID des zu pruefenden Inhaltsobjekts.',
      },
      text: {
        type: 'string',
        description: 'Textinhalt, der geprueft werden soll.',
      },
      photos: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optionale Liste von Foto-URLs zur Bildpruefung.',
      },
      geoData: {
        type: 'object',
        description: 'Optionale Geodaten zur Pruefung auf unbeabsichtigte Standort-Offenlegung.',
      },
    },
    required: ['contentType', 'contentId', 'text'],
  },
} as const;
