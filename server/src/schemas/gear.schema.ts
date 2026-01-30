/**
 * Function-calling schemas for Gear tools.
 * Based on types from packages/types-jagd/src/tools/gear-tools.ts
 */

export const generateChecklistSchema = {
  name: 'gear.generate_checklist',
  description:
    'Generiert eine Ausruestungs-Checkliste basierend auf der Jagdart und aktuellen Bedingungen. Optional mit Waffen und Munition.',
  parameters: {
    type: 'object',
    properties: {
      sessionType: {
        type: 'string',
        description: 'Art der geplanten Jagd (z.B. ansitz, pirsch, drueckjagd).',
      },
      conditions: {
        type: 'object',
        description: 'Optionale aktuelle Wetter-/Umgebungsbedingungen fuer angepasste Empfehlungen.',
      },
      includeWeapons: {
        type: 'boolean',
        description: 'Wenn true, werden Waffen und Munition in die Checkliste aufgenommen.',
      },
    },
    required: ['sessionType'],
  },
} as const;
