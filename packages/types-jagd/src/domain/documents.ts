export type DocumentType = 'jagdschein' | 'wbk' | 'insurance' | 'permit' | 'other';
export type ExportPackType = 'streckenliste' | 'abschussmeldung' | 'jagdstatistik' | 'wildnachweisung' | 'other';

export interface DocumentVaultEntry {
  id: string;
  userId: string;
  docType: DocumentType;
  name: string;
  expiresAt?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface GuestPermit {
  id: string;
  userId: string;
  guestName: string;
  validFrom: string;
  validUntil: string;
  revier?: string;
  conditions: Record<string, unknown>;
  pdfUrl?: string;
  createdAt: string;
}

export interface ExportPack {
  id: string;
  userId: string;
  packType: ExportPackType;
  bundesland?: string;
  data: Record<string, unknown>;
  pdfUrl?: string;
  csvUrl?: string;
  status: 'draft' | 'generated' | 'submitted';
  createdAt: string;
}
