/**
 * Ralph Bridge
 *
 * Manages the Builder-to-Ralph integration. Creates session state files,
 * initializes progress tracking, and monitors Ralph loop execution status.
 */

import fs from 'fs';
import path from 'path';
import type { BuildRecord, RalphPRD } from './types.js';

const SESSION_FILE = '.claude/builder-session.local.md';

interface RalphStatus {
  branch: string;
  total: number;
  completed: number;
  pending: number;
  isComplete: boolean;
  nextStory?: { id: string; title: string };
}

/**
 * Create the builder session state file.
 * This file signals to the PostToolUse hook that a build is active.
 */
export function createSessionFile(record: BuildRecord): void {
  const dir = path.dirname(SESSION_FILE);
  fs.mkdirSync(dir, { recursive: true });

  const content = [
    '---',
    `active: true`,
    `build_id: "${record.id}"`,
    `app_id: "${record.appId}"`,
    `rag_store: "${record.ragStoreName || ''}"`,
    `phase: "${record.phase}"`,
    `started_at: "${record.createdAt}"`,
    '---',
    '',
    record.request.description,
    '',
  ].join('\n');

  fs.writeFileSync(SESSION_FILE, content);
}

/**
 * Update the session file phase.
 */
export function updateSessionPhase(phase: string): void {
  if (!fs.existsSync(SESSION_FILE)) return;

  const content = fs.readFileSync(SESSION_FILE, 'utf8');
  const updated = content.replace(/^phase: ".*"$/m, `phase: "${phase}"`);
  fs.writeFileSync(SESSION_FILE, updated);
}

/**
 * Remove the session state file (build complete or cancelled).
 */
export function removeSessionFile(): void {
  if (fs.existsSync(SESSION_FILE)) {
    fs.unlinkSync(SESSION_FILE);
  }
}

/**
 * Initialize the Ralph PRD file and progress tracking.
 */
export function initializeRalph(prd: RalphPRD): void {
  // Write prd.json
  const prdPath = path.resolve('prd.json');
  fs.writeFileSync(prdPath, JSON.stringify({
    projectName: prd.project,
    branchName: prd.branchName,
    userStories: prd.userStories,
  }, null, 2));

  // Initialize progress.txt if needed
  const progressPath = path.resolve('progress.txt');
  if (!fs.existsSync(progressPath) || fs.readFileSync(progressPath, 'utf8').trim() === '') {
    const header = [
      '## Codebase Patterns',
      '- (New project: No patterns identified yet)',
      '',
      '---',
      '',
      '# Ralph Progress Log',
      `Started: ${new Date().toLocaleString()}`,
      '---',
      '',
    ].join('\n');
    fs.writeFileSync(progressPath, header);
  }
}

/**
 * Read the current Ralph status from prd.json.
 */
export function getRalphStatus(): RalphStatus | null {
  const prdPath = path.resolve('prd.json');
  if (!fs.existsSync(prdPath)) return null;

  try {
    const prd = JSON.parse(fs.readFileSync(prdPath, 'utf8'));
    const stories = prd.userStories || prd.stories || [];
    const completed = stories.filter((s: { passes: boolean }) => s.passes);
    const pending = stories.filter((s: { passes: boolean }) => !s.passes);

    const nextStory = pending.length > 0 ? pending[0] : undefined;

    return {
      branch: prd.branchName || '',
      total: stories.length,
      completed: completed.length,
      pending: pending.length,
      isComplete: pending.length === 0,
      nextStory: nextStory ? { id: nextStory.id, title: nextStory.title } : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Poll Ralph status and update the build record.
 * Returns true if all stories pass, false if still in progress.
 */
export async function pollRalphUntilComplete(
  record: BuildRecord,
  maxPolls = 120,
  intervalMs = 5000
): Promise<boolean> {
  for (let i = 0; i < maxPolls; i++) {
    const status = getRalphStatus();
    if (!status) return false;

    // Update progress on the record
    record.progress.completed = status.completed;
    record.progress.total = status.total;
    record.progress.currentStory = status.nextStory?.title;

    if (status.isComplete) {
      return true;
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  // Timed out
  return false;
}
