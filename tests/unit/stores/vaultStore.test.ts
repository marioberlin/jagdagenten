import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useVaultStore } from '@/stores/vaultStore';
import { VaultPerson, VaultOrganization, VaultRole } from '@/types/vaultTypes';

// Mock localStorage for persist middleware
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

describe('vaultStore', () => {
    beforeEach(() => {
        // Reset store before each test
        const { reset } = useVaultStore.getState();
        reset();
        localStorageMock.clear();
    });

    it('should initialize with default values', () => {
        const state = useVaultStore.getState();
        expect(state.entities).toEqual([]);
        expect(state.personal).toBeNull();
        expect(state.roles).toEqual([]);
        expect(state.activeEntityId).toBeNull();
        expect(state.pinnedEntityIds).toEqual([]);
    });

    describe('Access & Context', () => {
        it('should allow switching context', () => {
            const { switchContext } = useVaultStore.getState();
            switchContext('entity-123');
            expect(useVaultStore.getState().activeEntityId).toBe('entity-123');

            switchContext(null);
            expect(useVaultStore.getState().activeEntityId).toBeNull();
        });

        it('should toggle pinned entities', () => {
            const { togglePin } = useVaultStore.getState();

            togglePin('entity-123');
            expect(useVaultStore.getState().pinnedEntityIds).toContain('entity-123');

            togglePin('entity-123');
            expect(useVaultStore.getState().pinnedEntityIds).not.toContain('entity-123');
        });
    });

    describe('Entity Management', () => {
        const testEntity: VaultOrganization = {
            '@type': 'Organization',
            id: 'org-1',
            name: 'Test Corp',
            addresses: [],
            contacts: [],
            identifiers: [],
            subsidiaries: [],
            branches: [],
            roles: [],
            entityType: 'headquarters',
            completeness: 50
        };

        it('should add an entity', () => {
            const { addEntity } = useVaultStore.getState();
            addEntity(testEntity);

            const state = useVaultStore.getState();
            expect(state.entities).toHaveLength(1);
            expect(state.entities[0].id).toBe(testEntity.id);
            expect(state.entities[0].name).toBe(testEntity.name);
        });

        it('should update an entity', () => {
            const { addEntity, updateEntity } = useVaultStore.getState();
            addEntity(testEntity);

            updateEntity('org-1', { name: 'Updated Corp' });

            const state = useVaultStore.getState();
            expect(state.entities[0].name).toBe('Updated Corp');
        });

        it('should remove an entity', () => {
            const { addEntity, deleteEntity } = useVaultStore.getState();
            addEntity(testEntity);

            deleteEntity('org-1');

            const state = useVaultStore.getState();
            expect(state.entities).toHaveLength(0);
        });

        it('should switch context to null if active entity is removed', () => {
            const { addEntity, switchContext, deleteEntity } = useVaultStore.getState();
            addEntity(testEntity);
            switchContext('org-1');

            deleteEntity('org-1');

            expect(useVaultStore.getState().activeEntityId).toBeNull();
        });
    });

    describe('Personal Profile', () => {
        const testPerson: VaultPerson = {
            '@type': 'Person',
            id: 'person-1',
            name: 'John Doe',
            email: 'john@example.com'
        };

        it('should update personal profile', () => {
            const { setPersonal, updatePersonal } = useVaultStore.getState();
            // setPersonal must be called first
            setPersonal(testPerson);

            updatePersonal({ jobTitle: 'Developer' });

            expect(useVaultStore.getState().personal).toMatchObject({
                ...testPerson,
                jobTitle: 'Developer'
            });
        });
    });

    describe('Security Compartments', () => {
        it('should handle compartment unlocking', () => {
            const { unlockCompartment, lockCompartment } = useVaultStore.getState();

            // Initially locked
            expect(useVaultStore.getState().lockedCompartments.banking).toBe(true);

            // Unlock
            unlockCompartment('banking', 1000);
            expect(useVaultStore.getState().lockedCompartments.banking).toBe(false);

            // Lock
            lockCompartment('banking');
            expect(useVaultStore.getState().lockedCompartments.banking).toBe(true);
        });
    });

    describe('Domain Defaults', () => {
        it('should set and revoke domain defaults', () => {
            const { setDomainDefault, revokeDomainDefault } = useVaultStore.getState();

            setDomainDefault('example.com', 'org-1', 'billing');

            const state = useVaultStore.getState();
            expect(state.domainDefaults).toHaveLength(1);
            expect(state.domainDefaults[0]).toEqual({
                domain: 'example.com',
                entityId: 'org-1',
                addressPurpose: 'billing',
                rememberedAt: expect.any(Number)
            });

            // Revoke
            revokeDomainDefault('example.com');
            expect(useVaultStore.getState().domainDefaults).toHaveLength(0);
        });
    });

    describe('JSON-LD Export', () => {
        const testEntity: VaultOrganization = {
            '@type': 'Organization',
            id: 'org-1',
            name: 'Test Corp',
            addresses: [],
            contacts: [],
            identifiers: [],
            subsidiaries: [],
            branches: [],
            roles: [],
            entityType: 'headquarters',
            completeness: 50
        };
        const testPerson: VaultPerson = {
            '@type': 'Person',
            id: 'person-1',
            name: 'John Doe',
        };

        it('should export data correctly', () => {
            const { addEntity, setPersonal, exportToJsonLd } = useVaultStore.getState();
            addEntity(testEntity);
            setPersonal(testPerson);

            const exportData = exportToJsonLd();
            expect(exportData['@graph']).toBeDefined();
            expect(exportData['@graph'].some((node: any) => node['@type'] === 'Organization')).toBe(true);
            expect(exportData['@graph'].some((node: any) => node['@type'] === 'Person')).toBe(true);
        });
    });
});
