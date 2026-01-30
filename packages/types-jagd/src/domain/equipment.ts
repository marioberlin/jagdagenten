export interface WeaponRecord {
  id: string;
  name: string;
  type: 'rifle' | 'shotgun' | 'combination' | 'other';
  caliber: string;
  serialEncrypted?: string;
  optic?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
}

export interface AmmoInventory {
  caliber: string;
  brand?: string;
  type?: string;
  currentStock: number;
  minimumStock: number;
  lastUpdated: string;
}

export interface GearItem {
  id: string;
  name: string;
  category: 'weapon' | 'optic' | 'ammo' | 'clothing' | 'accessory' | 'other';
  status: 'ready' | 'maintenance_due' | 'in_repair' | 'retired';
  notes?: string;
}

export interface MaintenanceCadence {
  equipmentId: string;
  intervalDays: number;
  lastPerformed?: string;
  nextDue?: string;
  description: string;
}
