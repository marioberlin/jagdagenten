/**
 * Data Vault Types
 * 
 * Schema.org-aligned TypeScript interfaces for the Data Vault module.
 * Provides structured entity context for AI Agents and CoWork mode.
 */

// ============================================================================
// Address Types
// ============================================================================

export type AddressPurpose = 'registered' | 'billing' | 'operational' | 'shipping';

export interface VaultAddress {
    id: string;
    purpose: AddressPurpose;
    streetAddress: string;
    addressLocality: string;
    postalCode: string;
    addressRegion?: string;
    addressCountry: string;
    isDefault?: boolean;
}

// ============================================================================
// Contact Types
// ============================================================================

export type ContactType = 'billing' | 'legal' | 'support' | 'procurement' | 'general';

export interface VaultContact {
    id: string;
    contactType: ContactType;
    name?: string;
    email?: string;
    telephone?: string;
    isDefault?: boolean;
}

// ============================================================================
// Identifier Types
// ============================================================================

export interface VaultIdentifier {
    id: string;
    propertyID: string; // e.g., 'HRB', 'VAT', 'CNPJ', 'UEN'
    value: string;
    name?: string; // Human-readable label
}

// ============================================================================
// Role Types
// ============================================================================

export type AuthorityFlag = 'banking' | 'contracts' | 'vendor-onboarding' | 'strategic';

export interface VaultRole {
    id: string;
    entityId: string;
    roleName: string; // e.g., 'Managing Director', 'CFO', 'Billing Contact'
    authorityFlags: AuthorityFlag[];
}

// ============================================================================
// Banking (Locked Compartment)
// ============================================================================

export interface VaultBankAccount {
    id: string;
    accountHolder: string;
    iban: string;
    bic?: string;
    bankName?: string;
    isDefault?: boolean;
}

// ============================================================================
// Person Types
// ============================================================================

export interface VaultPerson {
    '@type': 'Person';
    id: string;
    name: string;
    email?: string;
    telephone?: string;
    jobTitle?: string;
    taxID?: string;
    address?: VaultAddress;
    worksFor?: string; // Reference to organization ID
}

// ============================================================================
// Organization Types
// ============================================================================

export type EntityType = 'headquarters' | 'subsidiary' | 'branch';
export type Region = 'DACH' | 'Nordics' | 'LATAM' | 'Asia' | 'UK' | 'USA' | 'Europe';

export interface VaultOrganization {
    '@type': 'Organization';
    id: string;
    legalName: string;
    name: string; // Short/display name
    alternateName?: string; // Former name
    url?: string;
    vatID?: string;
    taxID?: string;
    entityType: EntityType;
    region?: Region;

    // Ownership
    parentOrganizationId?: string;
    ownershipPercentage?: number;
    acquisitionDate?: string; // ISO date

    // Collections
    addresses: VaultAddress[];
    contacts: VaultContact[];
    identifiers: VaultIdentifier[];
    bankAccounts?: VaultBankAccount[];

    // Computed
    completeness?: number; // 0-100
    accentColor?: string; // HSL hue for context
}

// ============================================================================
// Unified Entity Type
// ============================================================================

export type VaultEntity = VaultPerson | VaultOrganization;

// ============================================================================
// Sensitivity Tiers
// ============================================================================

export type SensitivityTier = 1 | 2 | 3 | 4;

export interface TierPolicy {
    tier: SensitivityTier;
    label: string;
    description: string;
    fields: string[];
    requiresConfirmation: boolean;
}

export const DEFAULT_TIER_POLICIES: TierPolicy[] = [
    {
        tier: 1,
        label: 'Basic info',
        description: 'Auto-fill without confirmation',
        fields: ['name', 'legalName', 'streetAddress', 'addressLocality', 'postalCode', 'addressCountry'],
        requiresConfirmation: false,
    },
    {
        tier: 2,
        label: 'Standard',
        description: 'Auto-fill with indicator',
        fields: ['email', 'telephone', 'vatID'],
        requiresConfirmation: false,
    },
    {
        tier: 3,
        label: 'Sensitive',
        description: 'Requires confirmation before fill',
        fields: ['taxID', 'identifiers'],
        requiresConfirmation: true,
    },
    {
        tier: 4,
        label: 'Locked',
        description: 'Requires explicit unlock and confirmation',
        fields: ['iban', 'bic', 'bankAccounts'],
        requiresConfirmation: true,
    },
];

// ============================================================================
// Audit Log
// ============================================================================

export type AuditEventType = 'fill' | 'unlock' | 'add' | 'update' | 'delete' | 'revoke' | 'import';

export interface AuditEntry {
    id: string;
    timestamp: number;
    eventType: AuditEventType;
    entityId?: string;
    entityLabel?: string;
    domain?: string;
    tiersShared?: SensitivityTier[];
    dataTypes?: string[];
    details?: string;
}

// ============================================================================
// Domain Defaults
// ============================================================================

export interface DomainDefault {
    domain: string;
    entityId: string;
    addressPurpose?: AddressPurpose;
    rememberedAt: number;
}

// ============================================================================
// Vault State
// ============================================================================

export interface VaultState {
    // Data
    personal: VaultPerson | null;
    entities: VaultOrganization[];
    roles: VaultRole[];

    // Context
    activeEntityId: string | null;
    pinnedEntityIds: string[];

    // Security
    lockedCompartments: {
        banking: boolean;
        documents: boolean;
    };
    unlockExpiresAt: number | null;
    tierPolicies: TierPolicy[];

    // Domain Memory
    domainDefaults: DomainDefault[];

    // Audit
    auditLog: AuditEntry[];
}

// ============================================================================
// Store Actions
// ============================================================================

export interface VaultActions {
    // Personal
    setPersonal: (person: VaultPerson) => void;
    updatePersonal: (updates: Partial<VaultPerson>) => void;

    // Entities
    addEntity: (entity: VaultOrganization) => void;
    updateEntity: (id: string, updates: Partial<VaultOrganization>) => void;
    deleteEntity: (id: string) => void;

    // Addresses
    addAddress: (entityId: string, address: VaultAddress) => void;
    updateAddress: (entityId: string, addressId: string, updates: Partial<VaultAddress>) => void;
    deleteAddress: (entityId: string, addressId: string) => void;

    // Contacts
    addContact: (entityId: string, contact: VaultContact) => void;
    updateContact: (entityId: string, contactId: string, updates: Partial<VaultContact>) => void;
    deleteContact: (entityId: string, contactId: string) => void;

    // Context
    switchContext: (entityId: string | null) => void;
    togglePin: (entityId: string) => void;

    // Security
    unlockCompartment: (compartment: 'banking' | 'documents', durationMs?: number) => void;
    lockCompartment: (compartment: 'banking' | 'documents') => void;
    checkUnlockExpiry: () => void;

    // Domain Defaults
    setDomainDefault: (domain: string, entityId: string, addressPurpose?: AddressPurpose) => void;
    revokeDomainDefault: (domain: string) => void;
    getDomainDefault: (domain: string) => DomainDefault | undefined;

    // Audit
    logAuditEvent: (event: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
    clearAuditLog: () => void;

    // Roles
    addRole: (role: VaultRole) => void;
    updateRole: (id: string, updates: Partial<VaultRole>) => void;
    deleteRole: (id: string) => void;
    getRolesForEntity: (entityId: string) => VaultRole[];

    // Import/Export
    importFromJsonLd: (jsonLd: unknown) => void;
    exportToJsonLd: () => unknown;

    // Reset
    reset: () => void;
}

export type VaultStore = VaultState & VaultActions;
