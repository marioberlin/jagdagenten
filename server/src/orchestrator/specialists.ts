/**
 * Specialist Agent Definitions
 *
 * Defines the specialist agents available for orchestration.
 *
 * @see docs/IMPLEMENTATION_PLAN.md - Item 4.3 Multi-Agent Orchestration
 */

import type { SpecialistAgent } from './types.js';

/**
 * UI Specialist - Handles frontend components, styling, UX
 */
export const uiSpecialist: SpecialistAgent = {
    id: 'ui-specialist',
    name: 'UI Specialist',
    domain: 'ui',
    systemPrompt: `You are a frontend UI specialist focused on React components and styling.

Your expertise:
- React component design and implementation
- CSS, Tailwind, and styled-components
- Accessibility (a11y) best practices
- Responsive design
- User experience patterns
- Animation and transitions
- State management in components

When working on UI tasks:
1. Follow existing component patterns in the codebase
2. Ensure accessibility compliance
3. Keep components reusable and composable
4. Use the project's design system tokens
5. Write component tests where appropriate

File patterns you work on: src/components/**, src/styles/**, src/hooks/use*UI*`,
    filePatterns: [
        'src/components/**/*.tsx',
        'src/components/**/*.css',
        'src/styles/**/*',
        'src/hooks/use*UI*.ts'
    ],
    priority: 1
};

/**
 * API Specialist - Handles backend routes, services, data
 */
export const apiSpecialist: SpecialistAgent = {
    id: 'api-specialist',
    name: 'API Specialist',
    domain: 'api',
    systemPrompt: `You are a backend API specialist focused on server-side development.

Your expertise:
- REST API design and implementation
- GraphQL schemas and resolvers
- Database interactions
- Caching strategies
- Rate limiting
- Authentication and authorization
- Error handling
- Performance optimization

When working on API tasks:
1. Follow RESTful conventions
2. Implement proper error handling
3. Add appropriate logging
4. Consider caching opportunities
5. Write API tests

File patterns you work on: server/src/**, src/api/**, src/services/**`,
    filePatterns: [
        'server/src/**/*.ts',
        'src/api/**/*.ts',
        'src/services/**/*.ts'
    ],
    priority: 1
};

/**
 * Security Specialist - Handles security, auth, validation
 */
export const securitySpecialist: SpecialistAgent = {
    id: 'security-specialist',
    name: 'Security Specialist',
    domain: 'security',
    systemPrompt: `You are a security specialist focused on application security.

Your expertise:
- Authentication and authorization
- Input validation and sanitization
- OWASP top 10 vulnerabilities
- Secure coding practices
- Encryption and hashing
- Security headers
- Rate limiting and abuse prevention
- Audit logging

When working on security tasks:
1. Never trust user input
2. Use parameterized queries
3. Implement proper authentication checks
4. Follow principle of least privilege
5. Add security-related tests

File patterns you work on: **/auth/**, **/security/**, **/validation/**`,
    filePatterns: [
        '**/auth/**/*.ts',
        '**/security/**/*.ts',
        '**/validation/**/*.ts',
        'server/src/middleware/**/*.ts'
    ],
    priority: 2
};

/**
 * Test Specialist - Handles testing, QA, verification
 */
export const testSpecialist: SpecialistAgent = {
    id: 'test-specialist',
    name: 'Test Specialist',
    domain: 'test',
    systemPrompt: `You are a test specialist focused on software quality assurance.

Your expertise:
- Unit testing with Vitest
- Integration testing
- End-to-end testing with Playwright
- Test-driven development
- Mock and stub creation
- Code coverage analysis
- Performance testing

When working on test tasks:
1. Write tests that verify behavior, not implementation
2. Use meaningful test descriptions
3. Keep tests isolated and independent
4. Mock external dependencies appropriately
5. Aim for high coverage of critical paths

File patterns you work on: tests/**, **/*.test.ts, **/*.spec.ts`,
    filePatterns: [
        'tests/**/*.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        'e2e/**/*.ts'
    ],
    priority: 1
};

/**
 * All available specialists
 */
export const specialists: SpecialistAgent[] = [
    uiSpecialist,
    apiSpecialist,
    securitySpecialist,
    testSpecialist
];

/**
 * Get specialist by ID
 */
export function getSpecialist(id: string): SpecialistAgent | undefined {
    return specialists.find(s => s.id === id);
}

/**
 * Get specialist by domain
 */
export function getSpecialistByDomain(domain: string): SpecialistAgent | undefined {
    return specialists.find(s => s.domain === domain);
}

/**
 * Match file to specialist
 */
export function matchFileToSpecialist(filePath: string): SpecialistAgent | undefined {
    // Check each specialist's file patterns
    for (const specialist of specialists.sort((a, b) => b.priority - a.priority)) {
        for (const pattern of specialist.filePatterns) {
            if (matchesGlobPattern(filePath, pattern)) {
                return specialist;
            }
        }
    }
    return undefined;
}

/**
 * Simple glob pattern matching
 */
function matchesGlobPattern(path: string, pattern: string): boolean {
    // Convert glob to regex
    const regexPattern = pattern
        .replace(/\*\*/g, '{{DOUBLESTAR}}')
        .replace(/\*/g, '[^/]*')
        .replace(/{{DOUBLESTAR}}/g, '.*')
        .replace(/\//g, '\\/');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
}

/**
 * Determine best specialist for a story
 */
export function determineSpecialist(story: {
    domain?: string;
    affectedFiles: string[];
}): SpecialistAgent | undefined {
    // If domain is specified, use that
    if (story.domain) {
        const byDomain = getSpecialistByDomain(story.domain);
        if (byDomain) return byDomain;
    }

    // Otherwise, determine by affected files
    const fileMatches = new Map<string, number>();

    for (const file of story.affectedFiles) {
        const specialist = matchFileToSpecialist(file);
        if (specialist) {
            const count = fileMatches.get(specialist.id) || 0;
            fileMatches.set(specialist.id, count + 1);
        }
    }

    // Return specialist with most file matches
    let bestSpecialist: SpecialistAgent | undefined;
    let maxMatches = 0;

    for (const [specialistId, count] of fileMatches) {
        if (count > maxMatches) {
            maxMatches = count;
            bestSpecialist = getSpecialist(specialistId);
        }
    }

    return bestSpecialist;
}

export default {
    specialists,
    getSpecialist,
    getSpecialistByDomain,
    matchFileToSpecialist,
    determineSpecialist
};
