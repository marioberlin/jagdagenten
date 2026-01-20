/**
 * Data Vault Store
 * 
 * Zustand store with persist middleware for managing vault state.
 * Provides entity context for AI Agents and CoWork mode.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    VaultStore,
    VaultState,
    VaultPerson,
    VaultOrganization,
    VaultAddress,
    VaultRole,
    VaultIdentifier,
    VaultBankAccount,
    AuditEntry,
    DomainDefault,
    AddressPurpose,
    DEFAULT_TIER_POLICIES,
    EntityType,
    Region,
} from '@/types/vaultTypes';

// ============================================================================
// Initial State
// ============================================================================

const initialState: VaultState = {
    personal: null,
    entities: [],
    roles: [],
    activeEntityId: null,
    pinnedEntityIds: [],
    lockedCompartments: {
        banking: true,
        documents: true,
    },
    unlockExpiresAt: null,
    tierPolicies: DEFAULT_TIER_POLICIES,
    domainDefaults: [],
    auditLog: [],
};

// ============================================================================
// Utility Functions
// ============================================================================

const generateId = () => crypto.randomUUID();

const calculateCompleteness = (entity: VaultOrganization): number => {
    const requiredFields = [
        entity.legalName,
        entity.vatID,
        entity.addresses.length > 0,
        entity.contacts.length > 0,
    ];
    const optionalFields = [
        entity.taxID,
        entity.url,
        entity.identifiers.length > 0,
        entity.addresses.some(a => a.purpose === 'billing'),
        entity.addresses.some(a => a.purpose === 'registered'),
        entity.contacts.some(c => c.contactType === 'billing'),
    ];

    const requiredScore = requiredFields.filter(Boolean).length / requiredFields.length;
    const optionalScore = optionalFields.filter(Boolean).length / optionalFields.length;

    return Math.round((requiredScore * 0.7 + optionalScore * 0.3) * 100);
};

// ============================================================================
// JSON-LD Parser
// ============================================================================

interface JsonLdNode {
    '@type'?: string;
    '@id'?: string;
    [key: string]: unknown;
}

interface JsonLdGraph {
    '@context'?: string;
    '@graph'?: JsonLdNode[];
}

const parseJsonLdAddress = (addr: JsonLdNode): VaultAddress | null => {
    if (addr['@type'] !== 'PostalAddress') return null;

    const additionalProperty = addr.additionalProperty as JsonLdNode | undefined;
    let purpose: AddressPurpose = 'registered';
    if (additionalProperty?.value) {
        purpose = additionalProperty.value as AddressPurpose;
    }

    return {
        id: generateId(),
        purpose,
        streetAddress: (addr.streetAddress as string) || '',
        addressLocality: (addr.addressLocality as string) || '',
        postalCode: (addr.postalCode as string) || '',
        addressRegion: addr.addressRegion as string | undefined,
        addressCountry: (addr.addressCountry as string) || '',
    };
};

const parseJsonLdIdentifiers = (identifiers: unknown[]): VaultIdentifier[] => {
    if (!Array.isArray(identifiers)) return [];

    return identifiers
        .filter((id): id is JsonLdNode => typeof id === 'object' && id !== null)
        .filter(id => id['@type'] === 'PropertyValue')
        .map(id => ({
            id: generateId(),
            propertyID: (id.propertyID as string) || 'unknown',
            value: (id.value as string) || '',
            name: id.name as string | undefined,
        }));
};

const parseJsonLdBankAccounts = (accounts: unknown[]): VaultBankAccount[] => {
    if (!Array.isArray(accounts)) return [];

    return accounts
        .filter((acc): acc is JsonLdNode => typeof acc === 'object' && acc !== null)
        .filter(acc => acc['@type'] === 'BankAccount')
        .map(acc => ({
            id: generateId(),
            accountHolder: (acc.accountHolder as string) || '',
            iban: (acc.iban as string) || '',
            bic: acc.bic as string | undefined,
            bankName: acc.bankName as string | undefined,
        }));
};

const parseJsonLdOrganization = (org: JsonLdNode): VaultOrganization | null => {
    if (org['@type'] !== 'Organization') return null;

    // Parse addresses
    const addresses: VaultAddress[] = [];
    if (org.address) {
        const addr = parseJsonLdAddress(org.address as JsonLdNode);
        if (addr) addresses.push(addr);
    }

    // Parse identifiers
    const identifiers = parseJsonLdIdentifiers((org.identifier as unknown[]) || []);

    // Parse bank accounts
    const bankAccounts = parseJsonLdBankAccounts((org.bankAccount as unknown[]) || []);

    // Parse additional properties for metadata
    const additionalProps = (org.additionalProperty as JsonLdNode[]) || [];
    let entityType: EntityType = 'subsidiary';
    let region: Region | undefined;
    let ownershipPercentage: number | undefined;
    let acquisitionDate: string | undefined;

    for (const prop of additionalProps) {
        if (prop.propertyID === 'entityType') entityType = prop.value as EntityType;
        if (prop.propertyID === 'region') region = prop.value as Region;
        if (prop.propertyID === 'ownershipPercentage') ownershipPercentage = Number(prop.value);
        if (prop.propertyID === 'acquisitionDate') acquisitionDate = prop.value as string;
    }

    // Extract parent org ID
    const parentRef = org.parentOrganization as JsonLdNode | undefined;
    const parentOrganizationId = parentRef?.['@id']?.replace('#', '');

    const entity: VaultOrganization = {
        '@type': 'Organization',
        id: (org['@id'] as string)?.replace('#', '') || generateId(),
        legalName: (org.legalName as string) || '',
        name: (org.name as string) || (org.legalName as string) || '',
        alternateName: org.alternateName as string | undefined,
        url: org.url as string | undefined,
        vatID: org.vatID as string | undefined,
        taxID: org.taxID as string | undefined,
        entityType,
        region,
        parentOrganizationId,
        ownershipPercentage,
        acquisitionDate,
        addresses,
        contacts: [],
        identifiers,
        bankAccounts,
    };

    entity.completeness = calculateCompleteness(entity);

    return entity;
};

const parseJsonLdPerson = (person: JsonLdNode): VaultPerson | null => {
    if (person['@type'] !== 'Person') return null;

    let address: VaultAddress | undefined;
    if (person.address) {
        const parsed = parseJsonLdAddress(person.address as JsonLdNode);
        if (parsed) address = parsed;
    }

    const worksForRef = person.worksFor as JsonLdNode | undefined;

    return {
        '@type': 'Person',
        id: (person['@id'] as string)?.replace('#', '') || generateId(),
        name: (person.name as string) || '',
        email: person.email as string | undefined,
        telephone: person.telephone as string | undefined,
        jobTitle: person.jobTitle as string | undefined,
        taxID: person.taxID as string | undefined,
        address,
        worksFor: worksForRef?.['@id']?.replace('#', ''),
    };
};

const parseJsonLdRole = (role: JsonLdNode): Partial<VaultRole> | null => {
    if (role['@type'] !== 'Role') return null;

    const memberOfRef = role.memberOf as JsonLdNode | undefined;
    const additionalProps = (role.additionalProperty as JsonLdNode[]) || [];

    const authorityFlags: string[] = [];
    for (const prop of additionalProps) {
        if (prop.propertyID === 'canApprove' && typeof prop.value === 'string') {
            authorityFlags.push(...prop.value.split(','));
        }
    }

    return {
        id: (role['@id'] as string)?.replace('#', '') || generateId(),
        entityId: memberOfRef?.['@id']?.replace('#', '') || '',
        roleName: (role.roleName as string) || '',
        authorityFlags: authorityFlags as VaultRole['authorityFlags'],
    };
};

// ============================================================================
// Store
// ============================================================================

export const useVaultStore = create<VaultStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            // ========================================
            // Personal
            // ========================================

            setPersonal: (person) => {
                set({ personal: person });
                get().logAuditEvent({
                    eventType: 'add',
                    entityLabel: person.name,
                    details: 'Personal profile set',
                });
            },

            updatePersonal: (updates) => {
                set((state) => ({
                    personal: state.personal ? { ...state.personal, ...updates } : null,
                }));
            },

            // ========================================
            // Entities
            // ========================================

            addEntity: (entity) => {
                const entityWithCompleteness = {
                    ...entity,
                    completeness: calculateCompleteness(entity),
                };
                set((state) => ({
                    entities: [...state.entities, entityWithCompleteness],
                }));
                get().logAuditEvent({
                    eventType: 'add',
                    entityId: entity.id,
                    entityLabel: entity.name,
                    details: 'Entity added',
                });
            },

            updateEntity: (id, updates) => {
                set((state) => ({
                    entities: state.entities.map((e) => {
                        if (e.id !== id) return e;
                        const updated = { ...e, ...updates };
                        updated.completeness = calculateCompleteness(updated);
                        return updated;
                    }),
                }));
            },

            deleteEntity: (id) => {
                const entity = get().entities.find(e => e.id === id);
                set((state) => ({
                    entities: state.entities.filter((e) => e.id !== id),
                    pinnedEntityIds: state.pinnedEntityIds.filter((pid) => pid !== id),
                    activeEntityId: state.activeEntityId === id ? null : state.activeEntityId,
                }));
                if (entity) {
                    get().logAuditEvent({
                        eventType: 'delete',
                        entityId: id,
                        entityLabel: entity.name,
                        details: 'Entity deleted',
                    });
                }
            },

            // ========================================
            // Addresses
            // ========================================

            addAddress: (entityId, address) => {
                set((state) => ({
                    entities: state.entities.map((e) => {
                        if (e.id !== entityId) return e;
                        const updated = { ...e, addresses: [...e.addresses, address] };
                        updated.completeness = calculateCompleteness(updated);
                        return updated;
                    }),
                }));
            },

            updateAddress: (entityId, addressId, updates) => {
                set((state) => ({
                    entities: state.entities.map((e) => {
                        if (e.id !== entityId) return e;
                        return {
                            ...e,
                            addresses: e.addresses.map((a) =>
                                a.id === addressId ? { ...a, ...updates } : a
                            ),
                        };
                    }),
                }));
            },

            deleteAddress: (entityId, addressId) => {
                set((state) => ({
                    entities: state.entities.map((e) => {
                        if (e.id !== entityId) return e;
                        const updated = {
                            ...e,
                            addresses: e.addresses.filter((a) => a.id !== addressId),
                        };
                        updated.completeness = calculateCompleteness(updated);
                        return updated;
                    }),
                }));
            },

            // ========================================
            // Contacts
            // ========================================

            addContact: (entityId, contact) => {
                set((state) => ({
                    entities: state.entities.map((e) => {
                        if (e.id !== entityId) return e;
                        const updated = { ...e, contacts: [...e.contacts, contact] };
                        updated.completeness = calculateCompleteness(updated);
                        return updated;
                    }),
                }));
            },

            updateContact: (entityId, contactId, updates) => {
                set((state) => ({
                    entities: state.entities.map((e) => {
                        if (e.id !== entityId) return e;
                        return {
                            ...e,
                            contacts: e.contacts.map((c) =>
                                c.id === contactId ? { ...c, ...updates } : c
                            ),
                        };
                    }),
                }));
            },

            deleteContact: (entityId, contactId) => {
                set((state) => ({
                    entities: state.entities.map((e) => {
                        if (e.id !== entityId) return e;
                        const updated = {
                            ...e,
                            contacts: e.contacts.filter((c) => c.id !== contactId),
                        };
                        updated.completeness = calculateCompleteness(updated);
                        return updated;
                    }),
                }));
            },

            // ========================================
            // Context
            // ========================================

            switchContext: (entityId) => {
                set({ activeEntityId: entityId });
            },

            togglePin: (entityId) => {
                set((state) => ({
                    pinnedEntityIds: state.pinnedEntityIds.includes(entityId)
                        ? state.pinnedEntityIds.filter((id) => id !== entityId)
                        : [...state.pinnedEntityIds, entityId],
                }));
            },

            // ========================================
            // Security
            // ========================================

            unlockCompartment: (compartment, durationMs = 5 * 60 * 1000) => {
                const expiresAt = Date.now() + durationMs;
                set((state) => ({
                    lockedCompartments: {
                        ...state.lockedCompartments,
                        [compartment]: false,
                    },
                    unlockExpiresAt: expiresAt,
                }));
                get().logAuditEvent({
                    eventType: 'unlock',
                    details: `${compartment} compartment unlocked`,
                });
            },

            lockCompartment: (compartment) => {
                set((state) => ({
                    lockedCompartments: {
                        ...state.lockedCompartments,
                        [compartment]: true,
                    },
                }));
            },

            checkUnlockExpiry: () => {
                const { unlockExpiresAt } = get();
                if (unlockExpiresAt && Date.now() > unlockExpiresAt) {
                    set({
                        lockedCompartments: {
                            banking: true,
                            documents: true,
                        },
                        unlockExpiresAt: null,
                    });
                }
            },

            // ========================================
            // Domain Defaults
            // ========================================

            setDomainDefault: (domain, entityId, addressPurpose) => {
                set((state) => {
                    const existing = state.domainDefaults.findIndex((d) => d.domain === domain);
                    const newDefault: DomainDefault = {
                        domain,
                        entityId,
                        addressPurpose,
                        rememberedAt: Date.now(),
                    };

                    if (existing >= 0) {
                        const updated = [...state.domainDefaults];
                        updated[existing] = newDefault;
                        return { domainDefaults: updated };
                    }

                    return { domainDefaults: [...state.domainDefaults, newDefault] };
                });
            },

            revokeDomainDefault: (domain) => {
                set((state) => ({
                    domainDefaults: state.domainDefaults.filter((d) => d.domain !== domain),
                }));
                get().logAuditEvent({
                    eventType: 'revoke',
                    domain,
                    details: 'Domain default revoked',
                });
            },

            getDomainDefault: (domain) => {
                return get().domainDefaults.find((d) => d.domain === domain);
            },

            // ========================================
            // Audit
            // ========================================

            logAuditEvent: (event) => {
                const entry: AuditEntry = {
                    ...event,
                    id: generateId(),
                    timestamp: Date.now(),
                };
                set((state) => ({
                    auditLog: [entry, ...state.auditLog].slice(0, 1000), // Keep last 1000 entries
                }));
            },

            clearAuditLog: () => {
                set({ auditLog: [] });
            },

            // ========================================
            // Roles
            // ========================================

            addRole: (role) => {
                set((state) => ({
                    roles: [...state.roles, role],
                }));
            },

            updateRole: (id, updates) => {
                set((state) => ({
                    roles: state.roles.map((r) =>
                        r.id === id ? { ...r, ...updates } : r
                    ),
                }));
            },

            deleteRole: (id) => {
                set((state) => ({
                    roles: state.roles.filter((r) => r.id !== id),
                }));
            },

            getRolesForEntity: (entityId) => {
                return get().roles.filter((r) => r.entityId === entityId);
            },

            // ========================================
            // Import/Export
            // ========================================

            importFromJsonLd: (jsonLd) => {
                const data = jsonLd as JsonLdGraph;
                const graph = data['@graph'] || [];

                const entities: VaultOrganization[] = [];
                let personal: VaultPerson | null = null;
                const roles: VaultRole[] = [];

                for (const node of graph) {
                    if (node['@type'] === 'Organization') {
                        const org = parseJsonLdOrganization(node);
                        if (org) entities.push(org);
                    } else if (node['@type'] === 'Person') {
                        const person = parseJsonLdPerson(node);
                        if (person) personal = person;
                    } else if (node['@type'] === 'Role') {
                        const role = parseJsonLdRole(node);
                        if (role && role.entityId) {
                            roles.push(role as VaultRole);
                        }
                    }
                }

                set({ entities, personal, roles });

                get().logAuditEvent({
                    eventType: 'import',
                    details: `Imported ${entities.length} entities, ${roles.length} roles`,
                });
            },

            exportToJsonLd: () => {
                const { entities, personal, roles } = get();

                const graph: unknown[] = [];

                // Add personal
                if (personal) {
                    graph.push({
                        '@type': 'Person',
                        '@id': `#${personal.id}`,
                        name: personal.name,
                        email: personal.email,
                        telephone: personal.telephone,
                        jobTitle: personal.jobTitle,
                        taxID: personal.taxID,
                        address: personal.address ? {
                            '@type': 'PostalAddress',
                            streetAddress: personal.address.streetAddress,
                            addressLocality: personal.address.addressLocality,
                            postalCode: personal.address.postalCode,
                            addressCountry: personal.address.addressCountry,
                        } : undefined,
                        worksFor: personal.worksFor ? { '@id': `#${personal.worksFor}` } : undefined,
                    });
                }

                // Add entities
                for (const entity of entities) {
                    graph.push({
                        '@type': 'Organization',
                        '@id': `#${entity.id}`,
                        legalName: entity.legalName,
                        name: entity.name,
                        alternateName: entity.alternateName,
                        url: entity.url,
                        vatID: entity.vatID,
                        taxID: entity.taxID,
                        parentOrganization: entity.parentOrganizationId
                            ? { '@id': `#${entity.parentOrganizationId}` }
                            : undefined,
                        address: entity.addresses[0] ? {
                            '@type': 'PostalAddress',
                            streetAddress: entity.addresses[0].streetAddress,
                            addressLocality: entity.addresses[0].addressLocality,
                            postalCode: entity.addresses[0].postalCode,
                            addressCountry: entity.addresses[0].addressCountry,
                            additionalProperty: {
                                '@type': 'PropertyValue',
                                propertyID: 'purpose',
                                value: entity.addresses[0].purpose,
                            },
                        } : undefined,
                        identifier: entity.identifiers.map((id) => ({
                            '@type': 'PropertyValue',
                            propertyID: id.propertyID,
                            value: id.value,
                        })),
                        bankAccount: entity.bankAccounts?.map((acc) => ({
                            '@type': 'BankAccount',
                            accountHolder: acc.accountHolder,
                            iban: acc.iban,
                            bic: acc.bic,
                            bankName: acc.bankName,
                        })),
                        additionalProperty: [
                            { '@type': 'PropertyValue', propertyID: 'entityType', value: entity.entityType },
                            entity.region && { '@type': 'PropertyValue', propertyID: 'region', value: entity.region },
                            entity.ownershipPercentage && { '@type': 'PropertyValue', propertyID: 'ownershipPercentage', value: entity.ownershipPercentage },
                            entity.acquisitionDate && { '@type': 'PropertyValue', propertyID: 'acquisitionDate', value: entity.acquisitionDate },
                        ].filter(Boolean),
                    });
                }

                // Add roles
                for (const role of roles) {
                    graph.push({
                        '@type': 'Role',
                        '@id': `#${role.id}`,
                        roleName: role.roleName,
                        memberOf: { '@id': `#${role.entityId}` },
                        additionalProperty: role.authorityFlags.length > 0 ? [
                            {
                                '@type': 'PropertyValue',
                                propertyID: 'canApprove',
                                value: role.authorityFlags.join(','),
                            },
                        ] : undefined,
                    });
                }

                return {
                    '@context': 'https://schema.org',
                    '@graph': graph,
                };
            },

            // ========================================
            // Reset
            // ========================================

            reset: () => {
                set(initialState);
            },
        }),
        {
            name: 'liquid-vault-storage',
            version: 1,
        }
    )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectActiveEntity = (state: VaultState) =>
    state.entities.find((e) => e.id === state.activeEntityId);

export const selectPinnedEntities = (state: VaultState) =>
    state.entities.filter((e) => state.pinnedEntityIds.includes(e.id));

export const selectEntitiesByRegion = (state: VaultState, region: Region) =>
    state.entities.filter((e) => e.region === region);

export const selectHeadquarters = (state: VaultState) =>
    state.entities.find((e) => e.entityType === 'headquarters');

export const selectSubsidiaries = (state: VaultState) =>
    state.entities.filter((e) => e.entityType === 'subsidiary');

export const selectBranches = (state: VaultState) =>
    state.entities.filter((e) => e.entityType === 'branch');
