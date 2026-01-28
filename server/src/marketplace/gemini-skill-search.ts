/**
 * Gemini Skill Search Service
 * 
 * Uses Gemini File Search API to provide semantic search for skills.
 * Skills are indexed as documents in a Gemini corpus for semantic retrieval.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// ============================================================================
// Types
// ============================================================================

export interface SkillDocument {
    id: string;
    name: string;
    description: string;
    tags: string[];
    category: string;
    author: string;
    version: string;
}

export interface SearchResult {
    skillId: string;
    name: string;
    description: string;
    relevanceScore: number;
}

// ============================================================================
// Gemini Skill Search
// ============================================================================

export class GeminiSkillSearch {
    private genAI: GoogleGenerativeAI;
    private model: any;
    private corpusName = 'liquidos-skills';

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn('[GeminiSearch] GEMINI_API_KEY not set, semantic search disabled');
            return;
        }

        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }

    /**
     * Search skills semantically using Gemini
     */
    async search(query: string, skills: SkillDocument[], limit = 10): Promise<SearchResult[]> {
        if (!this.model) {
            return this.fallbackSearch(query, skills, limit);
        }

        try {
            // Build context from all skills
            const skillContext = skills.map(s =>
                `[${s.id}] ${s.name}: ${s.description} (tags: ${s.tags.join(', ')})`
            ).join('\n');

            // Ask Gemini to rank skills by relevance
            const prompt = `You are a skill search engine. Given the user query and available skills, return the most relevant skill IDs in order of relevance.

User Query: "${query}"

Available Skills:
${skillContext}

Return ONLY a JSON array of skill IDs, ordered by relevance. Example: ["skill-1", "skill-2", "skill-3"]
Return at most ${limit} results. If no skills match, return an empty array [].`;

            const result = await this.model.generateContent(prompt);
            const response = result.response.text();

            // Parse response
            const jsonMatch = response.match(/\[.*\]/s);
            if (!jsonMatch) {
                return this.fallbackSearch(query, skills, limit);
            }

            const rankedIds: string[] = JSON.parse(jsonMatch[0]);

            // Map back to full results
            const results: SearchResult[] = [];
            for (const id of rankedIds.slice(0, limit)) {
                const skill = skills.find(s => s.id === id);
                if (skill) {
                    results.push({
                        skillId: skill.id,
                        name: skill.name,
                        description: skill.description,
                        relevanceScore: 1 - (results.length * 0.1), // Descending score
                    });
                }
            }

            return results;

        } catch (error) {
            console.error('[GeminiSearch] Search failed:', error);
            return this.fallbackSearch(query, skills, limit);
        }
    }

    /**
     * Fallback to text-based search if Gemini fails
     */
    private fallbackSearch(query: string, skills: SkillDocument[], limit: number): SearchResult[] {
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/);

        return skills
            .map(skill => {
                const searchText = `${skill.name} ${skill.description} ${skill.tags.join(' ')}`.toLowerCase();

                // Count matching words
                let score = 0;
                for (const word of queryWords) {
                    if (searchText.includes(word)) {
                        score += 1;
                    }
                }

                // Bonus for exact phrase match
                if (searchText.includes(queryLower)) {
                    score += 2;
                }

                return {
                    skillId: skill.id,
                    name: skill.name,
                    description: skill.description,
                    relevanceScore: score,
                };
            })
            .filter(r => r.relevanceScore > 0)
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, limit);
    }

    /**
     * Check if Gemini search is available
     */
    isAvailable(): boolean {
        return !!this.model;
    }
}

// ============================================================================
// Singleton
// ============================================================================

let instance: GeminiSkillSearch | null = null;

export function getGeminiSkillSearch(): GeminiSkillSearch {
    if (!instance) {
        instance = new GeminiSkillSearch();
    }
    return instance;
}

export default GeminiSkillSearch;
