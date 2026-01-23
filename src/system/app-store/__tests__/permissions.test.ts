/**
 * Permission Manager Tests
 *
 * Tests the capability-based permission system:
 * auto-grants, explicit grants, revocation, clearing.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PermissionManager, CAPABILITY_DESCRIPTIONS } from '../permissions';
import type { AppCapability } from '../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
  localStorageMock.clear();
  PermissionManager.clearAll();
});

// ============================================================================
// Tests: Auto-Granted Capabilities
// ============================================================================

describe('Auto-Granted Capabilities', () => {
  const autoGranted: AppCapability[] = [
    'storage:local',
    'storage:indexeddb',
    'notification:toast',
    'system:fullscreen',
  ];

  it.each(autoGranted)('should auto-grant %s without explicit permission', (cap) => {
    expect(PermissionManager.hasPermission('any-app', cap)).toBe(true);
  });

  it('should not auto-grant network:http', () => {
    expect(PermissionManager.hasPermission('test-app', 'network:http')).toBe(false);
  });

  it('should not auto-grant ai:llm', () => {
    expect(PermissionManager.hasPermission('test-app', 'ai:llm')).toBe(false);
  });

  it('should not auto-grant media:camera', () => {
    expect(PermissionManager.hasPermission('test-app', 'media:camera')).toBe(false);
  });
});

// ============================================================================
// Tests: Explicit Permission Grants
// ============================================================================

describe('Explicit Permission Grants', () => {
  it('should grant a capability to an app', () => {
    PermissionManager.grant('test-app', 'network:http');
    expect(PermissionManager.hasPermission('test-app', 'network:http')).toBe(true);
  });

  it('should not affect other apps', () => {
    PermissionManager.grant('app-a', 'network:http');
    expect(PermissionManager.hasPermission('app-b', 'network:http')).toBe(false);
  });

  it('should grant multiple capabilities at once', () => {
    PermissionManager.grantAll('test-app', ['network:http', 'ai:llm', 'media:camera']);

    expect(PermissionManager.hasPermission('test-app', 'network:http')).toBe(true);
    expect(PermissionManager.hasPermission('test-app', 'ai:llm')).toBe(true);
    expect(PermissionManager.hasPermission('test-app', 'media:camera')).toBe(true);
  });

  it('should persist grants to localStorage', () => {
    PermissionManager.grant('test-app', 'network:http');
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });
});

// ============================================================================
// Tests: Permission Revocation
// ============================================================================

describe('Permission Revocation', () => {
  it('should revoke a granted capability', () => {
    PermissionManager.grant('test-app', 'network:http');
    expect(PermissionManager.hasPermission('test-app', 'network:http')).toBe(true);

    PermissionManager.revoke('test-app', 'network:http');
    expect(PermissionManager.hasPermission('test-app', 'network:http')).toBe(false);
  });

  it('should not crash when revoking non-existent grant', () => {
    PermissionManager.revoke('nonexistent', 'network:http');
    expect(PermissionManager.hasPermission('nonexistent', 'network:http')).toBe(false);
  });
});

// ============================================================================
// Tests: Required Permissions Check
// ============================================================================

describe('Required Permissions Check', () => {
  it('should return capabilities that need approval', () => {
    const required = PermissionManager.getRequiredPermissions('test-app', [
      'storage:local',  // auto-granted
      'network:http',   // needs approval
      'ai:llm',         // needs approval
    ]);

    expect(required).toEqual(['network:http', 'ai:llm']);
  });

  it('should return empty if all are granted', () => {
    PermissionManager.grantAll('test-app', ['network:http', 'ai:llm']);

    const required = PermissionManager.getRequiredPermissions('test-app', [
      'storage:local',
      'network:http',
      'ai:llm',
    ]);

    expect(required).toEqual([]);
  });

  it('hasAllPermissions should return true when all granted', () => {
    PermissionManager.grantAll('test-app', ['network:http', 'ai:llm']);

    expect(PermissionManager.hasAllPermissions('test-app', [
      'storage:local',
      'network:http',
      'ai:llm',
    ])).toBe(true);
  });

  it('hasAllPermissions should return false when some missing', () => {
    PermissionManager.grant('test-app', 'network:http');

    expect(PermissionManager.hasAllPermissions('test-app', [
      'network:http',
      'ai:llm',
    ])).toBe(false);
  });
});

// ============================================================================
// Tests: App Permission Clearing
// ============================================================================

describe('App Permission Clearing', () => {
  it('should clear all permissions for an app', () => {
    PermissionManager.grantAll('test-app', ['network:http', 'ai:llm', 'media:camera']);
    PermissionManager.clearAppPermissions('test-app');

    expect(PermissionManager.hasPermission('test-app', 'network:http')).toBe(false);
    expect(PermissionManager.hasPermission('test-app', 'ai:llm')).toBe(false);
    expect(PermissionManager.hasPermission('test-app', 'media:camera')).toBe(false);
  });

  it('should not affect other apps when clearing', () => {
    PermissionManager.grant('app-a', 'network:http');
    PermissionManager.grant('app-b', 'network:http');

    PermissionManager.clearAppPermissions('app-a');

    expect(PermissionManager.hasPermission('app-a', 'network:http')).toBe(false);
    expect(PermissionManager.hasPermission('app-b', 'network:http')).toBe(true);
  });
});

// ============================================================================
// Tests: Permission Grants Data
// ============================================================================

describe('Permission Grant Records', () => {
  it('should return grant records for an app', () => {
    PermissionManager.grant('test-app', 'network:http');
    PermissionManager.grant('test-app', 'ai:llm');

    const grants = PermissionManager.getAppGrants('test-app');
    expect(grants).toHaveLength(2);
    expect(grants[0].capability).toBe('network:http');
    expect(grants[0].granted).toBe(true);
    expect(grants[0].grantedAt).toBeDefined();
  });

  it('should return empty array for unknown app', () => {
    const grants = PermissionManager.getAppGrants('unknown');
    expect(grants).toEqual([]);
  });
});

// ============================================================================
// Tests: Capability Descriptions
// ============================================================================

describe('Capability Descriptions', () => {
  it('should have descriptions for all capabilities', () => {
    const allCapabilities: AppCapability[] = [
      'network:http', 'network:websocket',
      'storage:local', 'storage:indexeddb',
      'ai:llm', 'ai:agent', 'a2a:connect',
      'notification:push', 'notification:toast',
      'media:camera', 'media:microphone', 'media:geolocation',
      'system:clipboard', 'system:fullscreen',
    ];

    for (const cap of allCapabilities) {
      expect(CAPABILITY_DESCRIPTIONS[cap]).toBeDefined();
      expect(CAPABILITY_DESCRIPTIONS[cap].label).toBeTruthy();
      expect(CAPABILITY_DESCRIPTIONS[cap].description).toBeTruthy();
      expect(['low', 'medium', 'high']).toContain(CAPABILITY_DESCRIPTIONS[cap].risk);
    }
  });

  it('should classify high-risk capabilities correctly', () => {
    expect(CAPABILITY_DESCRIPTIONS['ai:agent'].risk).toBe('high');
    expect(CAPABILITY_DESCRIPTIONS['a2a:connect'].risk).toBe('high');
    expect(CAPABILITY_DESCRIPTIONS['media:camera'].risk).toBe('high');
    expect(CAPABILITY_DESCRIPTIONS['media:microphone'].risk).toBe('high');
    expect(CAPABILITY_DESCRIPTIONS['media:geolocation'].risk).toBe('high');
  });

  it('should classify low-risk capabilities correctly', () => {
    expect(CAPABILITY_DESCRIPTIONS['storage:local'].risk).toBe('low');
    expect(CAPABILITY_DESCRIPTIONS['storage:indexeddb'].risk).toBe('low');
    expect(CAPABILITY_DESCRIPTIONS['notification:toast'].risk).toBe('low');
    expect(CAPABILITY_DESCRIPTIONS['system:fullscreen'].risk).toBe('low');
  });
});
