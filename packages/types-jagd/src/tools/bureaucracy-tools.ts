import type { ExportPackType } from '../domain/documents.js';

export interface GenerateExportPackArgs {
  packType: ExportPackType;
  bundesland: string;
  dateRange: { from: string; to: string };
  sessionIds?: string[];
}

export interface CreateGuestPermitArgs {
  guestName: string;
  validFrom: string;
  validUntil: string;
  revier?: string;
  conditions?: Record<string, unknown>;
}
