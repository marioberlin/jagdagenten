/**
 * Partial JSON Parser
 * 
 * Attempts to parse incomplete JSON strings into valid JavaScript objects.
 * This is crucial for Generative UI, where we want to render the UI
 * *while* the LLM is still typing the arguments.
 */

export function parsePartialJson(jsonString: string): any {
    if (!jsonString) return {};

    // 1. Try standard parse first (best case)
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        // Continue to partial recovery
    }

    // 2. Fix unclosed strings
    // If the string ends with a " but not an escaped \", it might be an open string value.
    // However, the complexity of full JSON grammar recovery is high.
    // We will use a simplified repair strategy for the most common cases.

    let fixed = jsonString.trim();

    // Close open braces/brackets based on stack depth
    const stack: string[] = [];
    let inString = false;
    let escaped = false;

    // We only need to walk the string to track context to know what to close
    for (let i = 0; i < fixed.length; i++) {
        const char = fixed[i];

        if (escaped) {
            escaped = false;
            continue;
        }

        if (char === '\\') {
            escaped = true;
            continue;
        }

        if (char === '"') {
            inString = !inString;
        }

        if (!inString) {
            if (char === '{') stack.push('}');
            else if (char === '[') stack.push(']');
            else if (char === '}') stack.pop();
            else if (char === ']') stack.pop();
        }
    }

    // If we are still in a string, we must close it first
    if (inString) {
        fixed += '"';
    }

    // Unwind the stack to close brackets/braces
    while (stack.length > 0) {
        fixed += stack.pop();
    }

    // 3. Try parsing the repaired string
    try {
        return JSON.parse(fixed);
    } catch (e) {
        // If repair fails, return null or empty object?
        // For GenUI, returning an empty object for total failure is safer
        // so the UI doesn't crash.
        // Or we could return 'null' to signal invalidity.
        // Let's return {} so destructured props don't throw.
        // console.warn('Liquid Parser: Failed to recover JSON', e);
        return {};
    }
}
