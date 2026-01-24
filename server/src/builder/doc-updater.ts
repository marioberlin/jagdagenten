/**
 * Documentation Updater
 *
 * Applies approved documentation update suggestions to project files.
 * Works with doc-generator.ts which produces the suggestions.
 */

import fs from 'fs';
import type { DocUpdateSuggestion } from './types.js';

export interface ApplyResult {
  applied: number;
  failed: number;
  results: { filePath: string; success: boolean; error?: string }[];
}

/**
 * Apply a set of approved documentation update suggestions.
 * Each suggestion targets a specific file and section.
 */
export async function applyDocUpdates(suggestions: DocUpdateSuggestion[]): Promise<ApplyResult> {
  const results: ApplyResult['results'] = [];

  for (const suggestion of suggestions) {
    try {
      applyUpdate(suggestion);
      results.push({ filePath: suggestion.filePath, success: true });
    } catch (error) {
      results.push({
        filePath: suggestion.filePath,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    applied: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results,
  };
}

/**
 * Apply a single documentation update to a file.
 * If section is specified, inserts after the section header.
 * Otherwise appends to the end of the file.
 */
function applyUpdate(suggestion: DocUpdateSuggestion): void {
  if (!fs.existsSync(suggestion.filePath)) {
    // Create new file with the proposed content
    const dir = suggestion.filePath.substring(0, suggestion.filePath.lastIndexOf('/'));
    if (dir) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(suggestion.filePath, suggestion.proposedChange + '\n');
    return;
  }

  const content = fs.readFileSync(suggestion.filePath, 'utf8');

  if (suggestion.section) {
    // Find the section and insert after it
    const updated = insertAfterSection(content, suggestion.section, suggestion.proposedChange);
    fs.writeFileSync(suggestion.filePath, updated);
  } else {
    // Append to end of file
    const updated = content.trimEnd() + '\n\n' + suggestion.proposedChange + '\n';
    fs.writeFileSync(suggestion.filePath, updated);
  }
}

/**
 * Insert content after a markdown section header.
 * Finds the last line of content in that section (before the next section header)
 * and inserts the new content there.
 */
function insertAfterSection(content: string, sectionTitle: string, newContent: string): string {
  const lines = content.split('\n');
  const sectionPattern = new RegExp(`^#{1,4}\\s+${escapeRegex(sectionTitle)}`, 'i');

  let sectionStart = -1;
  let insertAt = -1;

  for (let i = 0; i < lines.length; i++) {
    if (sectionPattern.test(lines[i])) {
      sectionStart = i;
      continue;
    }

    if (sectionStart >= 0) {
      // Found the section; look for next section header or end of file
      if (/^#{1,4}\s/.test(lines[i]) && i > sectionStart) {
        // Insert before this next section
        insertAt = i;
        break;
      }
    }
  }

  if (sectionStart < 0) {
    // Section not found; append to end
    return content.trimEnd() + '\n\n' + newContent + '\n';
  }

  if (insertAt < 0) {
    // Section found but no next section; append to end
    return content.trimEnd() + '\n' + newContent + '\n';
  }

  // Insert before the next section, with blank line separation
  lines.splice(insertAt, 0, newContent, '');
  return lines.join('\n');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
