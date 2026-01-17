/**
 * GraphQL Query Validation
 * 
 * Provides depth and complexity limiting to prevent DoS attacks
 * via deeply nested or expensive queries.
 * 
 * @see docs/IMPLEMENTATION_PLAN.md - GraphQL Security
 */

export const MAX_QUERY_DEPTH = 5;
export const MAX_QUERY_COMPLEXITY = 100;

// Field cost for complexity calculation
const FIELD_COSTS: Record<string, number> = {
    // List fields are more expensive
    'positions': 5,
    'marketData': 5,
    'priceHistory': 10,
    'errorReports': 5,
    'healingPRDs': 5,
    'orchestrationSessions': 5,
    'plugins': 3,
    // Subscriptions are costly
    'priceUpdates': 15,
    'chatStream': 20,
    // Mutations with side effects
    'createTrade': 10,
    'executeOrchestrationSession': 25,
    'executeSandboxCommand': 30
};

const DEFAULT_FIELD_COST = 1;

/**
 * Calculate the depth of a GraphQL query string.
 * Uses simple brace counting - not a full parser but sufficient for validation.
 */
export function calculateQueryDepth(query: string): number {
    let maxDepth = 0;
    let currentDepth = 0;

    for (const char of query) {
        if (char === '{') {
            currentDepth++;
            maxDepth = Math.max(maxDepth, currentDepth);
        } else if (char === '}') {
            currentDepth--;
        }
    }

    return maxDepth;
}

/**
 * Extract field names from a GraphQL query for complexity calculation.
 */
function extractFields(query: string): string[] {
    // Remove comments
    const cleaned = query.replace(/#.*$/gm, '');

    // Match field names (word characters followed by optional arguments)
    const fieldPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\(|{|:|\s)/g;
    const fields: string[] = [];
    let match;

    while ((match = fieldPattern.exec(cleaned)) !== null) {
        const field = match[1];
        // Skip GraphQL keywords
        if (!['query', 'mutation', 'subscription', 'fragment', 'on', 'true', 'false', 'null'].includes(field)) {
            fields.push(field);
        }
    }

    return fields;
}

/**
 * Calculate query complexity based on field costs.
 */
export function calculateQueryComplexity(query: string): number {
    const fields = extractFields(query);
    let complexity = 0;

    for (const field of fields) {
        complexity += FIELD_COSTS[field] || DEFAULT_FIELD_COST;
    }

    // Depth adds multiplicative cost
    const depth = calculateQueryDepth(query);
    if (depth > 3) {
        complexity *= 1 + (depth - 3) * 0.2;
    }

    return Math.round(complexity);
}

/**
 * Validate a GraphQL query against depth and complexity limits.
 * Returns null if valid, or an error message if invalid.
 */
export function validateQuery(query: string): string | null {
    const depth = calculateQueryDepth(query);
    if (depth > MAX_QUERY_DEPTH) {
        return `Query depth ${depth} exceeds maximum allowed depth of ${MAX_QUERY_DEPTH}`;
    }

    const complexity = calculateQueryComplexity(query);
    if (complexity > MAX_QUERY_COMPLEXITY) {
        return `Query complexity ${complexity} exceeds maximum allowed complexity of ${MAX_QUERY_COMPLEXITY}`;
    }

    return null;
}

/**
 * Validation result type for middleware use.
 */
export interface ValidationResult {
    valid: boolean;
    error?: string;
    depth?: number;
    complexity?: number;
}

/**
 * Full validation with metrics - use this in middleware.
 */
export function validateQueryWithMetrics(query: string): ValidationResult {
    const depth = calculateQueryDepth(query);
    const complexity = calculateQueryComplexity(query);

    if (depth > MAX_QUERY_DEPTH) {
        return {
            valid: false,
            error: `Query depth ${depth} exceeds maximum of ${MAX_QUERY_DEPTH}`,
            depth,
            complexity
        };
    }

    if (complexity > MAX_QUERY_COMPLEXITY) {
        return {
            valid: false,
            error: `Query complexity ${complexity} exceeds maximum of ${MAX_QUERY_COMPLEXITY}`,
            depth,
            complexity
        };
    }

    return { valid: true, depth, complexity };
}
