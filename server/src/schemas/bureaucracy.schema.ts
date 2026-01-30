/**
 * Function-calling schemas for Bureaucracy tools.
 * Based on types from packages/types-jagd/src/tools/bureaucracy-tools.ts
 */

export const generateExportPackSchema = {
  name: 'bureaucracy.generate_export_pack',
  description:
    'Erzeugt ein behoerdliches Export-Paket (Streckenliste, Abschussmeldung, Jagdstatistik, Wildnachweisung) als PDF/CSV fuer ein bestimmtes Bundesland und einen Zeitraum.',
  parameters: {
    type: 'object',
    properties: {
      packType: {
        type: 'string',
        enum: ['streckenliste', 'abschussmeldung', 'jagdstatistik', 'wildnachweisung', 'other'],
        description: 'Art des Export-Pakets.',
      },
      bundesland: {
        type: 'string',
        description: 'Bundesland, fuer das der Export erstellt wird (z.B. "Bayern", "Niedersachsen").',
      },
      dateRange: {
        type: 'object',
        description: 'Zeitraum des Exports.',
        properties: {
          from: {
            type: 'string',
            description: 'Startdatum im ISO-8601-Format.',
          },
          to: {
            type: 'string',
            description: 'Enddatum im ISO-8601-Format.',
          },
        },
        required: ['from', 'to'],
      },
      sessionIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optionale Liste von Sitzungs-IDs, die in den Export einfliessen sollen.',
      },
    },
    required: ['packType', 'bundesland', 'dateRange'],
  },
} as const;

export const createGuestPermitPdfSchema = {
  name: 'bureaucracy.create_guest_permit_pdf',
  description:
    'Erstellt einen Gastjagdschein als PDF mit Gastname, Gueltigkeitszeitraum und optionalen Auflagen.',
  parameters: {
    type: 'object',
    properties: {
      guestName: {
        type: 'string',
        description: 'Vollstaendiger Name des Gastjaegers.',
      },
      validFrom: {
        type: 'string',
        description: 'Beginn der Gueltigkeit im ISO-8601-Format.',
      },
      validUntil: {
        type: 'string',
        description: 'Ende der Gueltigkeit im ISO-8601-Format.',
      },
      revier: {
        type: 'string',
        description: 'Optionaler Name oder ID des Jagdreviers.',
      },
      conditions: {
        type: 'object',
        description: 'Optionale Auflagen und Bedingungen fuer den Gastjagdschein.',
      },
    },
    required: ['guestName', 'validFrom', 'validUntil'],
  },
} as const;
