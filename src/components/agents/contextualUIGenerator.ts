/**
 * Contextual UI Generator
 *
 * Analyzes agent message content and generates smart RESPONSE OPTIONS
 * that a user might want to reply with. These are NOT summaries of the
 * message content, but intelligent suggestions for what the user could say next.
 *
 * Key principle: Extract SPECIFIC content from the message to generate
 * contextually relevant buttons, not generic responses.
 */

export interface GeneratedUIElement {
    type: 'button' | 'checkbox' | 'radio' | 'select';
    label: string;
    value: string;
    description?: string;
    options?: { label: string; value: string }[]; // For select/radio
}

export interface GeneratedUI {
    elements: GeneratedUIElement[];
    layout: 'horizontal' | 'vertical' | 'grid';
}

/**
 * Strip markdown formatting from text
 */
function stripMarkdown(text: string): string {
    return text
        .replace(/\*\*([^*]+)\*\*/g, '$1')  // Bold **text**
        .replace(/__([^_]+)__/g, '$1')       // Bold __text__
        .replace(/\*([^*]+)\*/g, '$1')       // Italic *text*
        .replace(/_([^_]+)_/g, '$1')         // Italic _text_
        .replace(/`([^`]+)`/g, '$1')         // Code `text`
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Links [text](url)
        .trim();
}

/**
 * Extract numbered or bulleted list items from text
 */
function extractListItems(text: string): string[] {
    const items: string[] = [];

    // Match numbered lists: "1. item" or "1) item"
    const numberedMatches = text.match(/(?:^|\n)\s*\d+[.)]\s*([^\n]+)/g);
    if (numberedMatches) {
        for (const match of numberedMatches) {
            const item = stripMarkdown(match.replace(/^\s*\d+[.)]\s*/, '').trim());
            if (item.length > 3 && item.length < 100) {
                items.push(item);
            }
        }
    }

    // Match bulleted lists: "- item" or "* item" or "• item"
    const bulletMatches = text.match(/(?:^|\n)\s*[-*•]\s+([^\n]+)/g);
    if (bulletMatches) {
        for (const match of bulletMatches) {
            const item = stripMarkdown(match.replace(/^\s*[-*•]\s+/, '').trim());
            if (item.length > 3 && item.length < 100) {
                items.push(item);
            }
        }
    }

    return items;
}

/**
 * Extract questions from the message
 */
function extractQuestions(text: string): string[] {
    const questions: string[] = [];
    const sentences = text.split(/(?<=[.!?])\s+/);

    for (const sentence of sentences) {
        if (sentence.includes('?')) {
            const cleaned = sentence.trim();
            if (cleaned.length > 10 && cleaned.length < 150) {
                questions.push(cleaned);
            }
        }
    }

    return questions;
}

/**
 * Extract key topics/entities mentioned (bold text, quoted text, code terms)
 * Returns the plain text without markdown formatting
 */
function extractKeyTopics(text: string): string[] {
    const topics: string[] = [];

    // Bold text: **topic** or __topic__ - extract the inner text
    const boldMatches = text.match(/\*\*([^*]+)\*\*/g);
    if (boldMatches) {
        for (const match of boldMatches) {
            const topic = match.replace(/\*\*/g, '').trim();
            if (topic.length > 2 && topic.length < 40) {
                topics.push(topic);
            }
        }
    }

    // Quoted text: "topic" - extract the inner text
    const quotedMatches = text.match(/"([^"]{3,40})"/g);
    if (quotedMatches) {
        for (const match of quotedMatches) {
            const topic = match.replace(/"/g, '').trim();
            if (topic.length > 2) {
                topics.push(topic);
            }
        }
    }

    // Code/technical terms: `term` - extract the inner text
    const codeMatches = text.match(/`([^`]{2,30})`/g);
    if (codeMatches) {
        for (const match of codeMatches) {
            const topic = match.replace(/`/g, '').trim();
            if (topic.length > 2) {
                topics.push(topic);
            }
        }
    }

    return [...new Set(topics)].slice(0, 3); // Remove duplicates, limit to 3
}

/**
 * Detect the primary intent of the agent's message
 */
function detectMessageIntent(text: string): 'question' | 'offer' | 'explanation' | 'options' | 'confirmation' | 'greeting' {
    const lowerText = text.toLowerCase();
    const lastSentence = text.split(/[.!?]/).filter(Boolean).pop()?.trim().toLowerCase() || '';

    // Greeting/welcome messages
    if (lowerText.includes('hello') || lowerText.includes('hi!') || lowerText.includes('welcome') ||
        lowerText.includes('how can i help') || lowerText.includes('nice to meet')) {
        return 'greeting';
    }

    // Confirmation requests (usually at the end)
    if (lastSentence.includes('proceed') || lastSentence.includes('go ahead') ||
        lastSentence.includes('shall i') || lastSentence.includes('should i') ||
        lastSentence.includes('ready to') || lastSentence.includes('confirm')) {
        return 'confirmation';
    }

    // Offering choices/options (has list items)
    const listItems = extractListItems(text);
    if (listItems.length >= 2) {
        return 'options';
    }

    // Direct questions
    const questions = extractQuestions(text);
    if (questions.length > 0 && questions[questions.length - 1].includes('?')) {
        return 'question';
    }

    // Offers to help more
    if (lowerText.includes('would you like') || lowerText.includes('let me know') ||
        lowerText.includes('feel free') || lowerText.includes('anything else') ||
        lowerText.includes('more information') || lowerText.includes('happy to help')) {
        return 'offer';
    }

    return 'explanation';
}

/**
 * Generate responses for greeting messages
 */
function generateGreetingResponses(): GeneratedUIElement[] {
    return [
        { type: 'button', label: 'I need help with...', value: 'I need help with something specific.' },
        { type: 'button', label: 'Quick question', value: 'I have a quick question for you.' },
        { type: 'button', label: 'Show me what you can do', value: 'What are your main capabilities? Show me what you can help with.' },
    ];
}

/**
 * Generate responses when agent presents options/list items
 */
function generateOptionResponses(listItems: string[]): GeneratedUIElement[] {
    const responses: GeneratedUIElement[] = [];

    // Only show up to 3 list items as buttons
    const itemsToShow = listItems.slice(0, 3);
    for (const item of itemsToShow) {
        // Truncate long items for label, make it action-oriented
        const label = item.length > 25 ? item.substring(0, 22) + '...' : item;
        responses.push({
            type: 'button',
            label: label,
            value: `Tell me more about: ${item}`,
        });
    }

    return responses;
}

/**
 * Generate responses for direct questions
 */
function generateQuestionResponses(questions: string[]): GeneratedUIElement[] {
    const lastQuestion = questions[questions.length - 1] || '';
    const lowerQuestion = lastQuestion.toLowerCase();

    // Yes/No questions
    if (lowerQuestion.match(/\b(do you|would you|should i|can i|is it|are you|have you|will you|could you|did you)\b/)) {
        return [
            { type: 'button', label: 'Yes', value: 'Yes' },
            { type: 'button', label: 'No', value: 'No' },
            { type: 'button', label: 'Need more context', value: 'I need more context before I can answer that.' },
        ];
    }

    // Which/What choice questions
    if (lowerQuestion.match(/\b(which|what|where|when|how)\b.*\?/)) {
        return [
            { type: 'button', label: 'Let me think...', value: 'Give me a moment to think about that.' },
            { type: 'button', label: 'Can you clarify?', value: 'Can you clarify what you mean?' },
            { type: 'button', label: 'Here\'s my answer', value: 'Here\'s what I think:' },
        ];
    }

    // Default question response
    return [
        { type: 'button', label: 'Yes, exactly', value: 'Yes, that\'s exactly right.' },
        { type: 'button', label: 'Not quite', value: 'Not quite what I meant. Let me explain...' },
        { type: 'button', label: 'More details please', value: 'Can you provide more details?' },
    ];
}

/**
 * Generate responses for confirmation requests
 */
function generateConfirmationResponses(): GeneratedUIElement[] {
    return [
        { type: 'button', label: 'Yes, proceed', value: 'Yes, please proceed.' },
        { type: 'button', label: 'Wait, let me reconsider', value: 'Hold on, I want to reconsider.' },
        { type: 'button', label: 'What are the alternatives?', value: 'What alternatives do I have?' },
    ];
}

/**
 * Generate responses when agent offers more help
 */
function generateOfferResponses(): GeneratedUIElement[] {
    return [
        { type: 'button', label: 'Yes, tell me more', value: 'Yes, please tell me more.' },
        { type: 'button', label: 'That\'s enough, thanks', value: 'That\'s enough for now, thank you.' },
        { type: 'button', label: 'I have another question', value: 'Actually, I have a different question.' },
    ];
}

/**
 * Generate responses for explanatory content
 */
function generateExplanationResponses(text: string): GeneratedUIElement[] {
    const topics = extractKeyTopics(text);

    // If we found specific topics, offer to explore them
    if (topics.length >= 2) {
        const responses: GeneratedUIElement[] = [];
        const topicsToShow = topics.slice(0, 3);

        for (const topic of topicsToShow) {
            const label = topic.length > 25 ? topic.substring(0, 22) + '...' : topic;
            responses.push({
                type: 'button',
                label: `More on "${label}"`,
                value: `Tell me more about ${topic}`,
            });
        }

        return responses;
    }

    // Generic responses for explanations
    return [
        { type: 'button', label: 'Got it, next step?', value: 'Got it. What\'s the next step?' },
        { type: 'button', label: 'Can you give an example?', value: 'Can you give me a concrete example?' },
        { type: 'button', label: 'I have a follow-up', value: 'I have a follow-up question about this.' },
    ];
}

/**
 * Main function: Analyze message content and generate appropriate UI
 *
 * IMPORTANT: This generates RESPONSE OPTIONS (what the user might say next),
 * NOT summaries or repeats of the message content.
 */
export function generateContextualUI(content: string): GeneratedUI | null {
    if (!content || content.length < 20) {
        return null;
    }

    // Detect the primary intent of the message
    const intent = detectMessageIntent(content);
    let elements: GeneratedUIElement[] = [];

    switch (intent) {
        case 'greeting':
            elements = generateGreetingResponses();
            break;

        case 'options': {
            const listItems = extractListItems(content);
            elements = generateOptionResponses(listItems);
            break;
        }

        case 'question': {
            const questions = extractQuestions(content);
            elements = generateQuestionResponses(questions);
            break;
        }

        case 'confirmation':
            elements = generateConfirmationResponses();
            break;

        case 'offer':
            elements = generateOfferResponses();
            break;

        case 'explanation':
        default:
            elements = generateExplanationResponses(content);
            break;
    }

    if (elements.length === 0) {
        return null;
    }

    // Determine layout based on element count and label lengths
    let layout: 'horizontal' | 'vertical' | 'grid' = 'horizontal';
    if (elements.length > 3) {
        layout = 'grid';
    }

    return { elements, layout };
}

/**
 * Format markdown content for better display
 * Fixes bullet alignment and other formatting issues
 */
export function formatMessageContent(content: string): string {
    // This is a helper for when we need to pre-process content
    // The actual rendering will be handled by the component
    return content;
}
