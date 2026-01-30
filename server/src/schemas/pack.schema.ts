/**
 * Function-calling schemas for Pack (Gruppe) tools.
 * Based on types from packages/types-jagd/src/tools/pack-tools.ts
 */

export const createEventSchema = {
  name: 'pack.create_event',
  description:
    'Erstellt ein neues Gruppen-Jagdereignis (Drueckjagd, Ansitz-Gruppe, Arbeitstag, Hundetraining) mit Ort, Zeit und Sicherheitsregeln.',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name des Jagdereignisses.',
      },
      eventType: {
        type: 'string',
        enum: ['drueckjagd', 'ansitz_group', 'work_day', 'dog_training', 'other'],
        description: 'Art des Gruppen-Ereignisses.',
      },
      startTime: {
        type: 'string',
        description: 'Startzeit im ISO-8601-Format.',
      },
      endTime: {
        type: 'string',
        description: 'Optionale Endzeit im ISO-8601-Format.',
      },
      locationName: {
        type: 'string',
        description: 'Optionaler Name des Veranstaltungsortes.',
      },
      geoLat: {
        type: 'number',
        description: 'Optionaler Breitengrad des Veranstaltungsortes.',
      },
      geoLon: {
        type: 'number',
        description: 'Optionaler Laengengrad des Veranstaltungsortes.',
      },
      safetyRules: {
        type: 'object',
        description: 'Optionale Sicherheitsregeln und Verhaltensanweisungen.',
      },
    },
    required: ['name', 'eventType', 'startTime'],
  },
} as const;

export const assignRoleSchema = {
  name: 'pack.assign_role',
  description:
    'Weist einem Teilnehmer eine Rolle (Stand, Treiber, Hundefuehrer, Jagdleiter, Gast) bei einem Gruppen-Jagdereignis zu.',
  parameters: {
    type: 'object',
    properties: {
      eventId: {
        type: 'string',
        description: 'ID des Gruppen-Jagdereignisses.',
      },
      userId: {
        type: 'string',
        description: 'ID des Teilnehmers, dem die Rolle zugewiesen wird.',
      },
      role: {
        type: 'string',
        enum: ['stand', 'treiber', 'hundefuehrer', 'jagdleiter', 'guest'],
        description: 'Zuzuweisende Rolle.',
      },
    },
    required: ['eventId', 'userId', 'role'],
  },
} as const;
