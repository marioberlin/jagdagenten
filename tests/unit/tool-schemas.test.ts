/**
 * Tool Schema Registry Tests
 */

import { describe, it, expect } from 'vitest';
import {
    TOOL_SCHEMAS,
    getToolSchema,
    getAllToolDeclarations,
    getToolsForAgent,
    resolveSchema,
    GEO_SCOPE_SCHEMA,
} from '../../server/src/agents/jagd/schemas/tool-schemas';

describe('TOOL_SCHEMAS', () => {
    it('has 22 total tools', () => {
        expect(Object.keys(TOOL_SCHEMAS).length).toBe(22);
    });

    describe('Timeline tools', () => {
        it('has start_session', () => {
            expect(TOOL_SCHEMAS['timeline.start_session']).toBeDefined();
            expect(TOOL_SCHEMAS['timeline.start_session'].name).toBe('timeline.start_session');
        });

        it('has log_event', () => {
            expect(TOOL_SCHEMAS['timeline.log_event']).toBeDefined();
        });

        it('has end_session', () => {
            expect(TOOL_SCHEMAS['timeline.end_session']).toBeDefined();
        });
    });

    describe('Hege & Pflege tools', () => {
        it('has create_project', () => {
            expect(TOOL_SCHEMAS['hege.create_project']).toBeDefined();
            expect(TOOL_SCHEMAS['hege.create_project'].parameters.properties.project_type.enum).toContain('kitzrettung');
        });

        it('has log_activity', () => {
            expect(TOOL_SCHEMAS['hege.log_activity']).toBeDefined();
        });

        it('has create_mowing_notice', () => {
            expect(TOOL_SCHEMAS['hege.create_mowing_notice']).toBeDefined();
        });
    });

    describe('Wildunfall tools', () => {
        it('has start_incident', () => {
            expect(TOOL_SCHEMAS['wildunfall.start_incident']).toBeDefined();
        });

        it('has dispatch_on_call', () => {
            expect(TOOL_SCHEMAS['wildunfall.dispatch_on_call']).toBeDefined();
            expect(TOOL_SCHEMAS['wildunfall.dispatch_on_call'].parameters.properties.notify_mode.enum).toContain('sms');
        });

        it('has update_incident', () => {
            expect(TOOL_SCHEMAS['wildunfall.update_incident']).toBeDefined();
        });
    });

    describe('Nachsuche tools', () => {
        it('has start_case', () => {
            expect(TOOL_SCHEMAS['nachsuche.start_case']).toBeDefined();
            expect(TOOL_SCHEMAS['nachsuche.start_case'].parameters.properties.shot_confidence.maximum).toBe(100);
        });

        it('has assign_team', () => {
            expect(TOOL_SCHEMAS['nachsuche.assign_team']).toBeDefined();
            const roles = TOOL_SCHEMAS['nachsuche.assign_team'].parameters.properties.roles.items.properties.role.enum;
            expect(roles).toContain('handler');
            expect(roles).toContain('dog');
        });

        it('has update_case', () => {
            expect(TOOL_SCHEMAS['nachsuche.update_case']).toBeDefined();
            expect(TOOL_SCHEMAS['nachsuche.update_case'].parameters.properties.status.enum).toContain('recovered');
        });
    });
});

describe('getToolSchema', () => {
    it('returns schema by name', () => {
        const schema = getToolSchema('scout.get_conditions_snapshot');
        expect(schema.name).toBe('scout.get_conditions_snapshot');
    });

    it('throws for unknown tool', () => {
        expect(() => getToolSchema('unknown.tool' as any)).toThrow('Unknown tool');
    });
});

describe('getAllToolDeclarations', () => {
    it('returns all tool declarations', () => {
        const declarations = getAllToolDeclarations();
        expect(declarations.length).toBe(22);
        expect(declarations[0]).toHaveProperty('name');
        expect(declarations[0]).toHaveProperty('description');
        expect(declarations[0]).toHaveProperty('parameters');
    });
});

describe('getToolsForAgent', () => {
    it('returns scout tools', () => {
        const tools = getToolsForAgent('scout');
        expect(tools.length).toBe(2);
        expect(tools.map(t => t.name)).toContain('scout.get_conditions_snapshot');
    });

    it('returns hege tools', () => {
        const tools = getToolsForAgent('hege');
        expect(tools.length).toBe(3);
        expect(tools.map(t => t.name)).toContain('hege.create_project');
    });

    it('returns wildunfall tools', () => {
        const tools = getToolsForAgent('wildunfall');
        expect(tools.length).toBe(3);
    });

    it('returns nachsuche tools', () => {
        const tools = getToolsForAgent('nachsuche');
        expect(tools.length).toBe(3);
    });

    it('returns empty array for unknown agent', () => {
        const tools = getToolsForAgent('unknown');
        expect(tools.length).toBe(0);
    });
});

describe('resolveSchema', () => {
    it('resolves $ref pointers', () => {
        const schemaWithRef = {
            type: 'object',
            properties: {
                geo: { $ref: '#/$defs/GeoScope' },
            },
        };

        const resolved = resolveSchema(schemaWithRef);
        expect(resolved.properties.geo).toEqual(GEO_SCOPE_SCHEMA);
    });

    it('handles nested objects', () => {
        const nested = {
            outer: {
                inner: { $ref: '#/$defs/GeoScope' },
            },
        };

        const resolved = resolveSchema(nested);
        expect(resolved.outer.inner).toEqual(GEO_SCOPE_SCHEMA);
    });

    it('handles arrays', () => {
        const withArray = {
            items: [{ $ref: '#/$defs/GeoScope' }],
        };

        const resolved = resolveSchema(withArray);
        expect(resolved.items[0]).toEqual(GEO_SCOPE_SCHEMA);
    });

    it('returns primitives unchanged', () => {
        expect(resolveSchema('string')).toBe('string');
        expect(resolveSchema(42)).toBe(42);
        expect(resolveSchema(null)).toBe(null);
    });
});
