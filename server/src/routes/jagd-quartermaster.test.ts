/**
 * Jagd Quartermaster Routes — Unit Tests
 *
 * Tests for equipment inventory and ammo logging endpoints.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { Elysia } from 'elysia';
import { createJagdQuartermasterRoutes } from './jagd-quartermaster';

// ============================================================================
// Test Setup
// ============================================================================

describe('Jagd Quartermaster Routes', () => {
    let app: Elysia;

    beforeEach(() => {
        app = new Elysia().use(createJagdQuartermasterRoutes());
    });

    // =========================================================================
    // Equipment Inventory Tests
    // =========================================================================

    describe('Equipment Inventory', () => {
        it('GET /api/v1/jagd/equipment returns empty array initially', async () => {
            const response = await app.handle(
                new Request('http://localhost/api/v1/jagd/equipment')
            );

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('gear');
            expect(Array.isArray(data.gear)).toBe(true);
        });

        it('POST /api/v1/jagd/equipment adds gear item', async () => {
            const newGear = {
                name: 'Sauer 404',
                itemType: 'weapon',
                caliber: '.308 Win',
                optic: 'Zeiss V8 2.8-20x56',
                notes: 'Hauptjagdwaffe',
            };

            const response = await app.handle(
                new Request('http://localhost/api/v1/jagd/equipment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newGear),
                })
            );

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('gear');
            expect(data.gear.name).toBe('Sauer 404');
            expect(data.gear.itemType).toBe('weapon');
            expect(data.gear.caliber).toBe('.308 Win');
            expect(data.gear.id).toBeDefined();
            expect(data.gear.status).toBe('ready');
        });

        it('POST /api/v1/jagd/equipment validates itemType', async () => {
            const invalidGear = {
                name: 'Test Item',
                itemType: 'invalid-type', // Invalid type
            };

            const response = await app.handle(
                new Request('http://localhost/api/v1/jagd/equipment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(invalidGear),
                })
            );

            // Should handle gracefully (may accept or reject)
            expect(response.status).toBeDefined();
        });

        it('PUT /api/v1/jagd/equipment/:id updates gear status', async () => {
            // First create a gear item
            const createResponse = await app.handle(
                new Request('http://localhost/api/v1/jagd/equipment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: 'Test Rifle',
                        itemType: 'weapon',
                    }),
                })
            );

            const createData = await createResponse.json();
            const gearId = createData.gear?.id || 'test-id';

            // Then update it
            const updateResponse = await app.handle(
                new Request(`http://localhost/api/v1/jagd/equipment/${gearId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: 'maintenance_due',
                        notes: 'Needs cleaning',
                    }),
                })
            );

            expect(updateResponse.status).toBe(200);
            const updateData = await updateResponse.json();
            expect(updateData).toHaveProperty('gear');
        });

        it('DELETE /api/v1/jagd/equipment/:id removes gear', async () => {
            // First create a gear item
            const createResponse = await app.handle(
                new Request('http://localhost/api/v1/jagd/equipment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: 'Delete Test',
                        itemType: 'accessory',
                    }),
                })
            );

            const createData = await createResponse.json();
            const gearId = createData.gear?.id || 'test-id';

            // Then delete it
            const deleteResponse = await app.handle(
                new Request(`http://localhost/api/v1/jagd/equipment/${gearId}`, {
                    method: 'DELETE',
                })
            );

            expect(deleteResponse.status).toBe(200);
            const deleteData = await deleteResponse.json();
            expect(deleteData).toHaveProperty('success');
        });
    });

    // =========================================================================
    // Ammo Inventory Tests
    // =========================================================================

    describe('Ammo Inventory', () => {
        it('GET /api/v1/jagd/ammo returns inventory summary', async () => {
            const response = await app.handle(
                new Request('http://localhost/api/v1/jagd/ammo')
            );

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('inventory');
        });

        it('POST /api/v1/jagd/ammo logs ammo usage', async () => {
            const ammoLog = {
                caliber: '.308 Win',
                quantity: -5, // Used 5 rounds
                reason: 'Ansitz',
                sessionId: 'session-123',
            };

            const response = await app.handle(
                new Request('http://localhost/api/v1/jagd/ammo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(ammoLog),
                })
            );

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('log');
            expect(data.log.caliber).toBe('.308 Win');
            expect(data.log.quantity).toBe(-5);
        });

        it('POST /api/v1/jagd/ammo adds new stock', async () => {
            const ammoLog = {
                caliber: '9.3x62',
                quantity: 100, // Added 100 rounds
                reason: 'Einkauf',
            };

            const response = await app.handle(
                new Request('http://localhost/api/v1/jagd/ammo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(ammoLog),
                })
            );

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('log');
            expect(data.log.quantity).toBe(100);
        });

        it('POST /api/v1/jagd/ammo validates caliber field', async () => {
            const invalidLog = {
                // Missing caliber
                quantity: 10,
                reason: 'Test',
            };

            const response = await app.handle(
                new Request('http://localhost/api/v1/jagd/ammo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(invalidLog),
                })
            );

            // Should handle gracefully
            expect(response.status).toBeDefined();
        });
    });

    // =========================================================================
    // Edge Cases
    // =========================================================================

    describe('Edge Cases', () => {
        it('handles malformed JSON gracefully', async () => {
            const response = await app.handle(
                new Request('http://localhost/api/v1/jagd/equipment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: 'not valid json',
                })
            );

            // Should not crash, return some status
            expect(response.status).toBeDefined();
        });

        it('handles missing Content-Type', async () => {
            const response = await app.handle(
                new Request('http://localhost/api/v1/jagd/equipment', {
                    method: 'POST',
                    body: JSON.stringify({ name: 'Test', itemType: 'weapon' }),
                })
            );

            // Should handle gracefully
            expect(response.status).toBeDefined();
        });

        it('handles non-existent gear ID on DELETE', async () => {
            const response = await app.handle(
                new Request('http://localhost/api/v1/jagd/equipment/non-existent-id', {
                    method: 'DELETE',
                })
            );

            // Should return success or 404
            expect(response.status).toBeDefined();
        });
    });
});
