/**
 * Sandbox Module
 *
 * Isolated staging system for safe agent execution.
 * Provides full audit trails, conflict detection, and granular merge controls.
 */

import { Pool } from 'pg';

// Types
export * from './types';

// Services
export { SandboxManager, sandboxManager, setDbPool as setSandboxDbPool } from './SandboxManager';
export { FileHasher, fileHasher } from './FileHasher';
export { AuditLogger, auditLogger, setDbPool as setAuditDbPool } from './AuditLogger';
export { BackupManager, backupManager, setDbPool as setBackupDbPool } from './BackupManager';
export { ConflictDetector, conflictDetector, setDbPool as setConflictDbPool } from './ConflictDetector';

// Routes
export { sandboxRoutes } from './routes';

// Import setDbPool functions for initialization
import { setDbPool as setSandboxPool } from './SandboxManager';
import { setDbPool as setAuditPool } from './AuditLogger';
import { setDbPool as setBackupPool } from './BackupManager';
import { setDbPool as setConflictPool } from './ConflictDetector';

/**
 * Initialize all sandbox services with a database pool
 */
export function initializeSandboxServices(pool: Pool): void {
    setSandboxPool(pool);
    setAuditPool(pool);
    setBackupPool(pool);
    setConflictPool(pool);
}
