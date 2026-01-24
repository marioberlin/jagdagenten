/**
 * Path Utilities
 *
 * Resolves the project root directory. The server runs from the `server/`
 * subdirectory, but scaffolded files belong in the project root's `src/`.
 */

import path from 'path';

/**
 * Get the project root directory (parent of server/).
 * Works whether the process is started from `server/` or the project root.
 */
export function getProjectRoot(): string {
  const cwd = process.cwd();
  // If we're in the server/ directory, go up one level
  if (cwd.endsWith('/server') || cwd.endsWith('\\server')) {
    return path.dirname(cwd);
  }
  // If cwd contains /server/src or similar, find the server dir
  const serverIdx = cwd.lastIndexOf('/server');
  if (serverIdx !== -1) {
    return cwd.slice(0, serverIdx);
  }
  return cwd;
}
