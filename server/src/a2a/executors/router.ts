/**
 * Router Executor
 *
 * Multi-executor router that delegates incoming A2A messages to the appropriate
 * registered executor based on skill/intent matching or explicit targeting.
 */

import { v1 } from '@liquidcrypto/a2a-sdk';
import type { AgentExecutor, AgentExecutionContext, AgentExecutionResult } from '../adapter/index.js';

interface RegisteredExecutor {
  executor: AgentExecutor;
  card: v1.AgentCard;
  skills: v1.AgentSkill[];
  keywords: string[];
}

/**
 * Routes A2A messages to the appropriate executor based on:
 * 1. Explicit targetAgent in metadata
 * 2. Skill keyword/tag matching from message text
 * 3. Fallback to default executor
 */
export class RouterExecutor implements AgentExecutor {
  private executors: Map<string, RegisteredExecutor> = new Map();
  private defaultExecutorId: string | null = null;

  /**
   * Register an executor with its agent card.
   * The first registered executor becomes the default fallback.
   */
  register(id: string, executor: AgentExecutor, card: v1.AgentCard): void {
    const skills = card.skills || [];
    const keywords = this.extractKeywords(skills);

    this.executors.set(id, { executor, card, skills, keywords });

    if (!this.defaultExecutorId) {
      this.defaultExecutorId = id;
    }
  }

  /**
   * Set which executor is used when no match is found.
   */
  setDefault(id: string): void {
    if (!this.executors.has(id)) {
      throw new Error(`RouterExecutor: Cannot set default to unknown executor "${id}"`);
    }
    this.defaultExecutorId = id;
  }

  /**
   * Route and execute a message.
   */
  async execute(
    message: v1.Message,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const targetId = this.resolveTarget(message, context);
    const registered = this.executors.get(targetId);

    // Debug logging
    console.log('[RouterExecutor] Routing request:', {
      targetId,
      contextId: context.contextId,
      metadataTargetAgent: context.metadata?.targetAgent,
      messageText: message.parts?.map(p => 'text' in p ? (p as v1.TextPart).text.substring(0, 50) : '[non-text]'),
      registeredExecutors: Array.from(this.executors.keys()),
    });

    if (!registered) {
      return {
        status: 'failed' as v1.TaskState,
        error: {
          code: -32603,
          message: `No executor found for target "${targetId}"`,
        },
      };
    }

    return registered.executor.execute(message, context);
  }

  /**
   * Get a merged agent card that combines skills from all registered executors.
   */
  getMergedAgentCard(baseUrl: string): v1.AgentCard {
    const allSkills: v1.AgentSkill[] = [];
    let primaryCard: v1.AgentCard | null = null;

    for (const [, registered] of this.executors) {
      allSkills.push(...registered.skills);
      if (!primaryCard) {
        primaryCard = registered.card;
      }
    }

    if (!primaryCard) {
      throw new Error('RouterExecutor: No executors registered');
    }

    return {
      ...primaryCard,
      name: 'LiquidOS AI',
      description: 'Multi-agent system with trading, orchestration, and app building capabilities',
      supportedInterfaces: [
        { url: `${baseUrl}/a2a`, protocolBinding: 'JSONRPC' },
      ],
      skills: allSkills,
    };
  }

  /**
   * List all registered executor IDs.
   */
  listExecutors(): string[] {
    return Array.from(this.executors.keys());
  }

  /**
   * Resolve which executor should handle a message.
   */
  private resolveTarget(message: v1.Message, context: AgentExecutionContext): string {
    // 1. Explicit routing via metadata
    const targetAgent = context.metadata?.targetAgent as string | undefined;
    if (targetAgent && this.executors.has(targetAgent)) {
      return targetAgent;
    }

    // 2. Extract text from message parts for intent matching
    const text = this.extractText(message);
    if (text) {
      const matched = this.matchByIntent(text);
      if (matched) {
        return matched;
      }
    }

    // 3. Fallback to default
    return this.defaultExecutorId || Array.from(this.executors.keys())[0];
  }

  /**
   * Match message text against executor skill keywords, tags, and examples.
   */
  private matchByIntent(text: string): string | null {
    const lowerText = text.toLowerCase();
    let bestMatch: { id: string; score: number } | null = null;

    for (const [id, registered] of this.executors) {
      let score = 0;

      // Check skill tags and keywords
      for (const keyword of registered.keywords) {
        if (lowerText.includes(keyword)) {
          score += 2;
        }
      }

      // Check skill examples for similarity
      for (const skill of registered.skills) {
        if (skill.examples) {
          for (const example of skill.examples) {
            const exampleWords = example.toLowerCase().split(/\s+/);
            const matchedWords = exampleWords.filter((w: string) => lowerText.includes(w));
            score += matchedWords.length * 0.5;
          }
        }
      }

      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { id, score };
      }
    }

    return bestMatch?.id || null;
  }

  /**
   * Extract plain text content from a message's parts.
   */
  private extractText(message: v1.Message): string {
    if (!message.parts) return '';

    return message.parts
      .filter((part: v1.Part): part is v1.TextPart => v1.isTextPart(part))
      .map((part: v1.TextPart) => part.text)
      .join(' ');
  }

  /**
   * Extract searchable keywords from skills (tags + key words from descriptions).
   */
  private extractKeywords(skills: v1.AgentSkill[]): string[] {
    const keywords: Set<string> = new Set();

    for (const skill of skills) {
      // Add tags directly
      if (skill.tags) {
        for (const tag of skill.tags) {
          keywords.add(tag.toLowerCase());
        }
      }

      // Extract key words from skill name and description
      const nameWords = skill.name.toLowerCase().split(/\s+/);
      for (const word of nameWords) {
        if (word.length > 3) {
          keywords.add(word);
        }
      }
    }

    return Array.from(keywords);
  }
}
