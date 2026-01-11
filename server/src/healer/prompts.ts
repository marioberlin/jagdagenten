/**
 * AI Prompts for Self-Healing System
 *
 * @see docs/IMPLEMENTATION_PLAN.md - Item 4.2 Self-Healing Production Loop
 */

import type { ErrorReport, AnalysisContext } from './types.js';

/**
 * System prompt for error analysis
 */
export const HEALER_SYSTEM_PROMPT = `You are an expert software engineer specialized in debugging and fixing production errors.
Your task is to analyze error reports and generate actionable fix plans in JSON format.

Key responsibilities:
1. Identify the root cause of errors from stack traces and context
2. Determine which files are likely affected
3. Propose minimal, targeted fixes
4. Consider edge cases and potential side effects

Response format must be valid JSON with this structure:
{
  "rootCause": "Brief explanation of why this error occurs",
  "affectedFiles": ["path/to/file1.ts", "path/to/file2.tsx"],
  "complexity": 1-5,
  "stories": [
    {
      "title": "Short action item",
      "description": "Detailed explanation of what needs to be done",
      "acceptanceCriteria": ["Criterion 1", "Criterion 2"]
    }
  ],
  "testingStrategy": "How to verify the fix works"
}

Guidelines:
- Keep fixes minimal and focused
- Don't over-engineer solutions
- Prefer fixing the immediate issue over refactoring
- Consider backward compatibility
- Include relevant error handling`;

/**
 * Build analysis prompt from error context
 */
export function buildAnalysisPrompt(context: AnalysisContext): string {
    const { error, similarErrors, codeContext, projectStructure } = context;

    let prompt = `Analyze this production error and generate a fix plan:

## Error Report
- **Type**: ${error.type}
- **Message**: ${error.message}
- **Component**: ${error.context.componentName || 'Unknown'}
- **URL**: ${error.context.url || 'Unknown'}
- **Timestamp**: ${error.timestamp}
`;

    if (error.stack) {
        prompt += `
## Stack Trace
\`\`\`
${error.stack}
\`\`\`
`;
    }

    if (error.context.errorCount && error.context.errorCount > 1) {
        prompt += `
## Frequency
This error has occurred ${error.context.errorCount} times.
`;
    }

    if (similarErrors && similarErrors.length > 0) {
        prompt += `
## Similar Recent Errors
${similarErrors.map((e, i) => `${i + 1}. ${e.message} (${e.context.componentName || 'Unknown'})`).join('\n')}
`;
    }

    if (codeContext && codeContext.length > 0) {
        prompt += `
## Relevant Code Context
`;
        for (const ctx of codeContext) {
            prompt += `
### ${ctx.file} (lines ${ctx.lineNumbers[0]}-${ctx.lineNumbers[1]})
\`\`\`typescript
${ctx.content}
\`\`\`
`;
        }
    }

    if (projectStructure && projectStructure.length > 0) {
        prompt += `
## Project Structure Hints
${projectStructure.map(p => `- ${p}`).join('\n')}
`;
    }

    prompt += `
## Instructions
Based on the error above, provide a JSON response with:
1. Root cause analysis
2. Affected files
3. Complexity rating (1-5)
4. Stories (actionable fix items)
5. Testing strategy

Remember: Keep fixes minimal and focused on the immediate issue.`;

    return prompt;
}

/**
 * Build verification prompt for testing fixes
 */
export function buildVerificationPrompt(
    originalError: ErrorReport,
    fixDescription: string,
    modifiedFiles: string[]
): string {
    return `Verify this fix for a production error:

## Original Error
- **Message**: ${originalError.message}
- **Component**: ${originalError.context.componentName || 'Unknown'}

## Applied Fix
${fixDescription}

## Modified Files
${modifiedFiles.map(f => `- ${f}`).join('\n')}

## Verification Checklist
Please confirm:
1. Does the fix address the root cause?
2. Are there any potential regressions?
3. Is error handling properly implemented?
4. Are there edge cases not covered?

Respond with JSON:
{
  "verified": true/false,
  "concerns": ["any concerns"],
  "additionalRecommendations": ["any recommendations"]
}`;
}

/**
 * Build prompt to extract code context from error
 */
export function buildCodeContextPrompt(error: ErrorReport): string {
    return `Based on this error, identify which source files should be examined:

**Error Message**: ${error.message}
**Stack Trace**:
${error.stack || 'Not available'}

List the most likely source files to examine (relative paths).
Respond with JSON array: ["path/to/file1.ts", "path/to/file2.tsx"]`;
}

/**
 * Prompt for generating commit message
 */
export function buildCommitMessagePrompt(
    error: ErrorReport,
    modifiedFiles: string[]
): string {
    return `Generate a commit message for fixing this error:

**Error**: ${error.message}
**Component**: ${error.context.componentName || 'Unknown'}
**Modified Files**:
${modifiedFiles.map(f => `- ${f}`).join('\n')}

Follow conventional commits format.
Respond with just the commit message text (no JSON).`;
}

/**
 * Prompt for generating PR description
 */
export function buildPRDescriptionPrompt(
    error: ErrorReport,
    rootCause: string,
    modifiedFiles: string[]
): string {
    return `Generate a pull request description for this automated fix:

## Error Fixed
- **Message**: ${error.message}
- **Component**: ${error.context.componentName || 'Unknown'}
- **Error Count**: ${error.context.errorCount || 1}

## Root Cause
${rootCause}

## Modified Files
${modifiedFiles.map(f => `- ${f}`).join('\n')}

Generate a PR description with:
1. Summary section (bullet points)
2. Test plan section
3. Note that this is an automated fix

Format as markdown.`;
}
