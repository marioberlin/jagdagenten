/**
 * Function-calling schemas for Scout tools.
 * Based on types from packages/types-jagd/src/tools/scout-tools.ts
 */

export const getConditionsSnapshotSchema = {
  name: 'scout.get_conditions_snapshot',
  description:
    'Ruft einen aktuellen Wetter- und Umgebungssnapshot (Wind, Daemmerung, Mond, Temperatur etc.) fuer eine bestimmte Position ab.',
  parameters: {
    type: 'object',
    properties: {
      lat: {
        type: 'number',
        description: 'Breitengrad der Abfrageposition.',
      },
      lon: {
        type: 'number',
        description: 'Laengengrad der Abfrageposition.',
      },
      standId: {
        type: 'string',
        description: 'Optionale Ansitz-/Stand-ID fuer reviergebundene Abfragen.',
      },
    },
    required: ['lat', 'lon'],
  },
} as const;

export const recommendPlanSchema = {
  name: 'scout.recommend_plan',
  description:
    'Erstellt einen KI-gestuetzten Jagdplan mit empfohlenem Stand, optimalem Zeitfenster, Jagdbarkeits-Score und Windwarnung.',
  parameters: {
    type: 'object',
    properties: {
      lat: {
        type: 'number',
        description: 'Breitengrad des Revierzentrums.',
      },
      lon: {
        type: 'number',
        description: 'Laengengrad des Revierzentrums.',
      },
      sessionType: {
        type: 'string',
        description: 'Art der geplanten Jagd (z.B. ansitz, pirsch).',
      },
      standIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Liste verfuegbarer Stand-IDs zur Auswahl.',
      },
      preferences: {
        type: 'object',
        description: 'Optionale Praeferenzen des Jaegers (z.B. bevorzugte Wildarten, Tageszeit).',
      },
    },
    required: ['lat', 'lon'],
  },
} as const;
