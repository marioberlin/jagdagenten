export interface GenerateChecklistArgs {
  sessionType: string;
  conditions?: Record<string, unknown>;
  includeWeapons?: boolean;
}

export interface ChecklistItem {
  id: string;
  category: string;
  name: string;
  required: boolean;
  checked: boolean;
  notes?: string;
}
