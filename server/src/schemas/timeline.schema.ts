/**
 * Function-calling schemas for Timeline tools.
 * Based on types from packages/types-jagd/src/tools/timeline-tools.ts
 */

export const startSessionSchema = {
  name: 'timeline.start_session',
  description:
    'Startet eine neue Jagdsitzung (Ansitz, Pirsch, Druckjagd etc.) und erzeugt eine Session-ID zur weiteren Protokollierung.',
  parameters: {
    type: 'object',
    properties: {
      sessionType: {
        type: 'string',
        enum: ['ansitz', 'pirsch', 'drueckjagd', 'other'],
        description: 'Art der Jagdsitzung.',
      },
      geo: {
        type: 'object',
        description: 'Optionale Geoposition der Sitzung.',
        properties: {
          mode: {
            type: 'string',
            enum: ['none', 'coarse_grid', 'precise'],
            description: 'Genauigkeitsmodus der Geoposition.',
          },
          gridId: {
            type: 'string',
            description: 'Raster-ID bei coarse_grid-Modus.',
          },
          lat: {
            type: 'number',
            description: 'Breitengrad.',
          },
          lon: {
            type: 'number',
            description: 'Laengengrad.',
          },
          blurMeters: {
            type: 'number',
            description: 'Unschaerfe-Radius in Metern.',
          },
        },
        required: ['mode'],
      },
      participants: {
        type: 'array',
        items: { type: 'string' },
        description: 'Liste der Teilnehmer-IDs.',
      },
      privacyMode: {
        type: 'string',
        enum: ['private', 'team_event_only', 'public_blurred'],
        description: 'Sichtbarkeits-/Datenschutzmodus der Sitzung.',
      },
    },
    required: ['sessionType'],
  },
} as const;

export const logEventSchema = {
  name: 'timeline.log_event',
  description:
    'Protokolliert ein Ereignis (Sichtung, Schuss, Erlegung, Notiz etc.) innerhalb einer laufenden Jagdsitzung.',
  parameters: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: 'ID der laufenden Jagdsitzung.',
      },
      eventType: {
        type: 'string',
        enum: ['sighting', 'shot', 'harvest', 'note', 'processing', 'handover'],
        description: 'Art des Timeline-Ereignisses.',
      },
      data: {
        type: 'object',
        description: 'Zusaetzliche Daten zum Ereignis (z.B. Wildart, Kaliber).',
      },
      geo: {
        type: 'object',
        description: 'Optionale Geoposition des Ereignisses.',
        properties: {
          mode: {
            type: 'string',
            enum: ['none', 'coarse_grid', 'precise'],
            description: 'Genauigkeitsmodus der Geoposition.',
          },
          gridId: {
            type: 'string',
            description: 'Raster-ID bei coarse_grid-Modus.',
          },
          lat: {
            type: 'number',
            description: 'Breitengrad.',
          },
          lon: {
            type: 'number',
            description: 'Laengengrad.',
          },
          blurMeters: {
            type: 'number',
            description: 'Unschaerfe-Radius in Metern.',
          },
        },
        required: ['mode'],
      },
      photos: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optionale Liste von Foto-URLs oder -Referenzen.',
      },
    },
    required: ['sessionId', 'eventType', 'data'],
  },
} as const;

export const endSessionSchema = {
  name: 'timeline.end_session',
  description:
    'Beendet eine laufende Jagdsitzung und erstellt optional eine automatische Zusammenfassung.',
  parameters: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: 'ID der zu beendenden Jagdsitzung.',
      },
      notes: {
        type: 'string',
        description: 'Optionale Abschlussnotizen des Jaegers.',
      },
      autoRecap: {
        type: 'boolean',
        description: 'Wenn true, wird eine KI-generierte Zusammenfassung erstellt.',
      },
    },
    required: ['sessionId'],
  },
} as const;
