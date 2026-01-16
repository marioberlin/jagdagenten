/**
 * Vault Service - Agent Context Provision API
 * 
 * Provides services for AI agents to access vault entity data,
 * parse pasted business documents, and build autofill packs.
 */

import {
    VaultPerson,
    VaultOrganization,
    VaultAddress,
    VaultRole,
    SensitivityTier,
} from '@/types/vaultTypes';
import { useVaultStore } from '@/stores/vaultStore';

// ============================================
// Types for Agent API
// ============================================

export interface VaultFillPack {
    /** Target entity ID */
    entityId: string;
    /** Entity display name */
    entityName: string;
    /** Fields available for autofill, respecting sensitivity tiers */
    fields: Record<string, VaultFieldValue>;
    /** Timestamp when this pack was generated */
    timestamp: number;
}

export interface VaultFieldValue {
    value: string;
    sensitivity: SensitivityTier;
    masked: boolean;
    label: string;
}

export interface ParsedDocument {
    /** Inferred entity type */
    type: 'person' | 'organization' | 'address' | 'contact' | 'identifier' | 'mixed';
    /** Confidence score 0-1 */
    confidence: number;
    /** Extracted fields */
    fields: Record<string, string>;
    /** Suggestions for which entity this might belong to */
    suggestedEntities: Array<{ id: string; name: string; matchScore: number }>;
}

export interface FormField {
    name: string;
    type: string;
    label?: string;
    autocomplete?: string;
    placeholder?: string;
}

export interface FormSuggestion {
    fieldName: string;
    suggestedValue: string;
    source: 'personal' | 'entity' | 'address' | 'contact';
    sourceId: string;
    confidence: number;
}

// ============================================
// Vault Service Class
// ============================================

class VaultServiceImpl {
    /**
     * Get vault context for an AI agent, respecting sensitivity tiers
     * @param domain Optional domain to apply domain-specific defaults
     * @param maxTier Maximum sensitivity tier the agent can access
     */
    getContextForAgent(domain?: string, maxTier: SensitivityTier = 3): VaultFillPack[] {
        const state = useVaultStore.getState();
        const packs: VaultFillPack[] = [];

        // Build pack for personal profile
        if (state.personal) {
            const fields = this.extractPersonFields(state.personal, maxTier);
            packs.push({
                entityId: state.personal.id,
                entityName: state.personal.name,
                fields,
                timestamp: Date.now(),
            });
        }

        // Build packs for active/pinned entities
        const activeEntities = state.activeEntityId
            ? [state.entities.find(e => e.id === state.activeEntityId)]
            : state.entities.filter(e => state.pinnedEntityIds.includes(e.id));

        for (const entity of activeEntities) {
            if (!entity) continue;
            const fields = this.extractOrganizationFields(entity, maxTier, state, domain);
            packs.push({
                entityId: entity.id,
                entityName: entity.legalName || entity.name,
                fields,
                timestamp: Date.now(),
            });
        }

        return packs;
    }

    /**
     * Extract fields from a person profile with sensitivity filtering
     */
    private extractPersonFields(person: VaultPerson, maxTier: SensitivityTier): Record<string, VaultFieldValue> {
        const fields: Record<string, VaultFieldValue> = {};

        // Tier 1 fields (always accessible)
        // Parse name into parts (simple heuristic)
        const nameParts = person.name.split(' ');
        const givenName = nameParts[0] || '';
        const familyName = nameParts.slice(1).join(' ') || '';

        fields['name'] = { value: person.name, sensitivity: 1, masked: false, label: 'Full Name' };
        fields['givenName'] = { value: givenName, sensitivity: 1, masked: false, label: 'First Name' };
        fields['familyName'] = { value: familyName, sensitivity: 1, masked: false, label: 'Last Name' };

        // Tier 2 fields (contact info)
        if (maxTier >= 2) {
            if (person.email) {
                fields['email'] = { value: person.email, sensitivity: 2, masked: false, label: 'Email' };
            }
            if (person.telephone) {
                fields['telephone'] = { value: person.telephone, sensitivity: 2, masked: false, label: 'Phone' };
            }
            if (person.jobTitle) {
                fields['jobTitle'] = { value: person.jobTitle, sensitivity: 2, masked: false, label: 'Job Title' };
            }
        } else {
            if (person.email) {
                fields['email'] = { value: this.maskValue(person.email, 'email'), sensitivity: 2, masked: true, label: 'Email' };
            }
        }

        // Tier 3 fields (government IDs)
        if (maxTier >= 3) {
            if (person.taxID) {
                fields['taxID'] = { value: person.taxID, sensitivity: 3, masked: false, label: 'Tax ID' };
            }
        }

        // Include address if available
        if (person.address) {
            const addressFields = this.extractAddressFields(person.address, 'address');
            Object.assign(fields, addressFields);
        }

        return fields;
    }

    /**
     * Extract fields from an organization with sensitivity filtering
     */
    private extractOrganizationFields(
        org: VaultOrganization,
        maxTier: SensitivityTier,
        state: ReturnType<typeof useVaultStore.getState>,
        domain?: string
    ): Record<string, VaultFieldValue> {
        const fields: Record<string, VaultFieldValue> = {};

        // Tier 1 fields
        fields['legalName'] = { value: org.legalName || org.name, sensitivity: 1, masked: false, label: 'Legal Name' };
        fields['name'] = { value: org.name, sensitivity: 1, masked: false, label: 'Company Name' };

        // Tier 2 fields (registration info)
        if (maxTier >= 2) {
            if (org.vatID) {
                fields['vatID'] = { value: org.vatID, sensitivity: 2, masked: false, label: 'VAT ID' };
            }
            if (org.taxID) {
                fields['taxID'] = { value: org.taxID, sensitivity: 2, masked: false, label: 'Tax ID' };
            }
            // Identifiers
            for (const id of org.identifiers) {
                fields[`id_${id.propertyID}`] = {
                    value: id.value,
                    sensitivity: 2,
                    masked: false,
                    label: id.name || id.propertyID
                };
            }
        }

        // Get default address for this org based on domain or first default
        const defaultAddress = this.getDefaultAddress(org, state, domain);
        if (defaultAddress) {
            const addressFields = this.extractAddressFields(defaultAddress, 'address');
            Object.assign(fields, addressFields);
        }

        // Get default contact
        const defaultContact = org.contacts.find(c => c.isDefault) || org.contacts[0];
        if (defaultContact && maxTier >= 2) {
            if (defaultContact.email) {
                fields['companyEmail'] = { value: defaultContact.email, sensitivity: 2, masked: false, label: 'Company Email' };
            }
            if (defaultContact.telephone) {
                fields['companyPhone'] = { value: defaultContact.telephone, sensitivity: 2, masked: false, label: 'Company Phone' };
            }
        }

        return fields;
    }

    /**
     * Extract address fields with a prefix
     */
    private extractAddressFields(address: VaultAddress, prefix: string): Record<string, VaultFieldValue> {
        const fields: Record<string, VaultFieldValue> = {};

        fields[`${prefix}_streetAddress`] = { value: address.streetAddress, sensitivity: 1, masked: false, label: 'Street Address' };
        fields[`${prefix}_postalCode`] = { value: address.postalCode, sensitivity: 1, masked: false, label: 'Postal Code' };
        fields[`${prefix}_city`] = { value: address.addressLocality, sensitivity: 1, masked: false, label: 'City' };
        if (address.addressRegion) {
            fields[`${prefix}_region`] = { value: address.addressRegion, sensitivity: 1, masked: false, label: 'State/Region' };
        }
        fields[`${prefix}_country`] = { value: address.addressCountry, sensitivity: 1, masked: false, label: 'Country' };

        return fields;
    }

    /**
     * Get the default address for an organization, considering domain preferences
     */
    private getDefaultAddress(
        org: VaultOrganization,
        state: ReturnType<typeof useVaultStore.getState>,
        domain?: string
    ): VaultAddress | null {
        // Check for domain-specific defaults first
        if (domain) {
            const domainDefault = state.domainDefaults.find(d => d.domain === domain);
            if (domainDefault?.addressPurpose) {
                const addr = org.addresses.find(a => a.purpose === domainDefault.addressPurpose);
                if (addr) return addr;
            }
        }

        // Fall back to default address
        const defaultAddr = org.addresses.find(a => a.isDefault);
        if (defaultAddr) return defaultAddr;

        // Fall back to registered address
        const registeredAddr = org.addresses.find(a => a.purpose === 'registered');
        if (registeredAddr) return registeredAddr;

        return org.addresses[0] || null;
    }

    /**
     * Parse pasted text to extract business entity information
     */
    parseDocument(text: string): ParsedDocument {
        const fields: Record<string, string> = {};
        let type: ParsedDocument['type'] = 'mixed';
        let confidence = 0.5;

        // Email detection
        const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
        if (emailMatch) {
            fields['email'] = emailMatch[0];
            confidence += 0.1;
        }

        // Phone detection (various formats)
        const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,8}/);
        if (phoneMatch) {
            fields['telephone'] = phoneMatch[0];
            confidence += 0.1;
        }

        // VAT ID patterns (European)
        const vatMatch = text.match(/(?:VAT|USt-?ID|TVA)[:\s]*((?:DE|AT|FR|IT|ES|NL|BE|PL|UK|GB|CH)\d{8,12})/i);
        if (vatMatch) {
            fields['vatID'] = vatMatch[1];
            type = 'organization';
            confidence += 0.2;
        }

        // German Handelsregister
        const hrbMatch = text.match(/(?:HRB|HRA)[:\s]*(\d{4,10}\s*[A-Z]?)/i);
        if (hrbMatch) {
            fields['registrationNumber'] = hrbMatch[0];
            type = 'organization';
            confidence += 0.2;
        }

        // Address patterns (simplified)
        const postalMatch = text.match(/\b(\d{4,6})\s+([A-Za-zäöüß]+(?:\s+[A-Za-zäöüß]+)?)\b/);
        if (postalMatch) {
            fields['postalCode'] = postalMatch[1];
            fields['city'] = postalMatch[2];
            type = type === 'organization' ? 'organization' : 'address';
            confidence += 0.15;
        }

        // Company name patterns (GmbH, AG, SE, etc.)
        const companyMatch = text.match(/([A-Za-zäöüß0-9\s&.-]+)\s+(GmbH|AG|SE|KG|UG|Ltd\.?|Inc\.?|Corp\.?)/i);
        if (companyMatch) {
            fields['legalName'] = companyMatch[0];
            type = 'organization';
            confidence += 0.25;
        }

        // Person name patterns (simple heuristic)
        if (!companyMatch) {
            const nameMatch = text.match(/^([A-ZÄÖÜ][a-zäöüß]+)\s+([A-ZÄÖÜ][a-zäöüß]+)$/m);
            if (nameMatch) {
                fields['givenName'] = nameMatch[1];
                fields['familyName'] = nameMatch[2];
                type = 'person';
                confidence += 0.2;
            }
        }

        // Find matching entities in the vault
        const suggestedEntities = this.findMatchingEntities(fields);

        return {
            type,
            confidence: Math.min(confidence, 1),
            fields,
            suggestedEntities,
        };
    }

    /**
     * Find entities in the vault that match extracted fields
     */
    private findMatchingEntities(fields: Record<string, string>): Array<{ id: string; name: string; matchScore: number }> {
        const state = useVaultStore.getState();
        const matches: Array<{ id: string; name: string; matchScore: number }> = [];

        for (const entity of state.entities) {
            let score = 0;
            const name = entity.legalName || entity.name;

            // Match by VAT ID
            if (fields.vatID && entity.vatID === fields.vatID) {
                score += 1;
            }

            // Match by registration number (check identifiers)
            if (fields.registrationNumber) {
                const hasMatch = entity.identifiers.some(
                    id => id.value.includes(fields.registrationNumber) || fields.registrationNumber.includes(id.value)
                );
                if (hasMatch) score += 1;
            }

            // Partial name match
            if (fields.legalName) {
                const nameLower = name.toLowerCase();
                const searchLower = fields.legalName.toLowerCase();
                if (nameLower.includes(searchLower) || searchLower.includes(nameLower)) {
                    score += 0.5;
                }
            }

            // Match by city
            if (fields.city) {
                const cityMatches = entity.addresses.some(
                    a => a.addressLocality.toLowerCase().includes(fields.city.toLowerCase())
                );
                if (cityMatches) score += 0.25;
            }

            if (score > 0) {
                matches.push({ id: entity.id, name, matchScore: score });
            }
        }

        return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
    }

    /**
     * Generate form suggestions based on detected form fields
     */
    getSuggestionsForForm(formFields: FormField[], entityId?: string): FormSuggestion[] {
        const state = useVaultStore.getState();
        const suggestions: FormSuggestion[] = [];

        // Determine target entity
        const entity = entityId
            ? state.entities.find(e => e.id === entityId)
            : state.entities.find(e => e.id === state.activeEntityId) ||
            state.entities.find(e => state.pinnedEntityIds.includes(e.id));

        const person = state.personal;

        for (const field of formFields) {
            const autocomplete = field.autocomplete?.toLowerCase() || '';
            const name = field.name.toLowerCase();
            const label = field.label?.toLowerCase() || '';

            // Personal fields
            if (person) {
                const nameParts = person.name.split(' ');
                const givenName = nameParts[0] || '';
                const familyName = nameParts.slice(1).join(' ') || '';

                if (autocomplete.includes('given-name') || name.includes('firstname') || label.includes('first name')) {
                    suggestions.push({
                        fieldName: field.name,
                        suggestedValue: givenName,
                        source: 'personal',
                        sourceId: person.id,
                        confidence: 0.95,
                    });
                    continue;
                }
                if (autocomplete.includes('family-name') || name.includes('lastname') || label.includes('last name')) {
                    suggestions.push({
                        fieldName: field.name,
                        suggestedValue: familyName,
                        source: 'personal',
                        sourceId: person.id,
                        confidence: 0.95,
                    });
                    continue;
                }
                if (autocomplete.includes('email') || name.includes('email')) {
                    if (person.email) {
                        suggestions.push({
                            fieldName: field.name,
                            suggestedValue: person.email,
                            source: 'personal',
                            sourceId: person.id,
                            confidence: 0.9,
                        });
                        continue;
                    }
                }
            }

            // Entity/organization fields
            if (entity) {
                if (name.includes('company') || name.includes('organization') || label.includes('company')) {
                    suggestions.push({
                        fieldName: field.name,
                        suggestedValue: entity.legalName || entity.name,
                        source: 'entity',
                        sourceId: entity.id,
                        confidence: 0.9,
                    });
                    continue;
                }
                if (name.includes('vat') || label.includes('vat')) {
                    if (entity.vatID) {
                        suggestions.push({
                            fieldName: field.name,
                            suggestedValue: entity.vatID,
                            source: 'entity',
                            sourceId: entity.id,
                            confidence: 0.95,
                        });
                        continue;
                    }
                }

                // Address fields
                const defaultAddress = entity.addresses.find(a => a.isDefault) || entity.addresses[0];
                if (defaultAddress) {
                    if (autocomplete.includes('street-address') || name.includes('street') || name.includes('address1')) {
                        suggestions.push({
                            fieldName: field.name,
                            suggestedValue: defaultAddress.streetAddress,
                            source: 'address',
                            sourceId: defaultAddress.id,
                            confidence: 0.85,
                        });
                        continue;
                    }
                    if (name.includes('city') || autocomplete.includes('locality')) {
                        suggestions.push({
                            fieldName: field.name,
                            suggestedValue: defaultAddress.addressLocality,
                            source: 'address',
                            sourceId: defaultAddress.id,
                            confidence: 0.85,
                        });
                        continue;
                    }
                    if (name.includes('zip') || name.includes('postal') || autocomplete.includes('postal-code')) {
                        suggestions.push({
                            fieldName: field.name,
                            suggestedValue: defaultAddress.postalCode,
                            source: 'address',
                            sourceId: defaultAddress.id,
                            confidence: 0.85,
                        });
                        continue;
                    }
                    if (name.includes('country') || autocomplete.includes('country')) {
                        suggestions.push({
                            fieldName: field.name,
                            suggestedValue: defaultAddress.addressCountry,
                            source: 'address',
                            sourceId: defaultAddress.id,
                            confidence: 0.85,
                        });
                        continue;
                    }
                }
            }
        }

        return suggestions;
    }

    /**
     * Get roles for the current user across all entities
     */
    getUserRoles(): VaultRole[] {
        const state = useVaultStore.getState();
        return state.roles;
    }

    /**
     * Get roles for a specific entity
     */
    getRolesForEntity(entityId: string): VaultRole[] {
        const state = useVaultStore.getState();
        return state.roles.filter(r => r.entityId === entityId);
    }

    /**
     * Check if user has specific authority for an entity
     */
    hasAuthority(entityId: string, authority: VaultRole['authorityFlags'][number]): boolean {
        const roles = this.getRolesForEntity(entityId);
        return roles.some(r => r.authorityFlags.includes(authority));
    }

    /**
     * Request unlock for a locked compartment (banking, documents)
     * Returns true if unlock was successful
     */
    async requestUnlock(compartment: 'banking' | 'documents', _reason?: string): Promise<boolean> {
        const state = useVaultStore.getState();

        // Log the unlock request
        state.logAuditEvent({
            eventType: 'unlock',
            entityId: state.activeEntityId || undefined,
            details: `Unlock requested for ${compartment}`,
        });

        // In production, this would trigger biometric/PIN verification
        // For now, we simulate with a simple unlock
        state.unlockCompartment(compartment, 900000); // 15 minutes

        return true;
    }

    /**
     * Check if a compartment is currently unlocked
     */
    isCompartmentUnlocked(compartment: 'banking' | 'documents'): boolean {
        const state = useVaultStore.getState();
        return !state.lockedCompartments[compartment];
    }

    /**
     * Mask a value for display
     */
    private maskValue(value: string, type: 'email' | 'phone' | 'generic'): string {
        if (type === 'email') {
            const [local, domain] = value.split('@');
            if (!domain) return '***';
            return `${local[0]}***@${domain}`;
        }
        if (type === 'phone') {
            return value.slice(0, 3) + '****' + value.slice(-2);
        }
        return '****';
    }
}

// Export singleton instance
export const vaultService = new VaultServiceImpl();
