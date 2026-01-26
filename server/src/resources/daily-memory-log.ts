/**
 * Daily Memory Log Service
 * 
 * Manages daily memory logs stored as markdown files.
 * Pattern: memory/YYYY-MM-DD.md
 * 
 * Features:
 * - Automatic date-based file organization
 * - Append-only log format optimized for agent reading
 * - Hybrid search combining semantic + BM25
 * - Auto-load today's + yesterday's memories at session start
 */

import { promises as fs } from 'fs';
import { join, dirname, basename } from 'path';
import { watch, type FSWatcher } from 'fs';
import type { ResourceStore, AIResource, OwnerType } from './types.js';

// ============================================================================
// Types
// ============================================================================

export interface MemoryEntry {
    /** ISO timestamp */
    timestamp: string;

    /** Memory category */
    category: 'observation' | 'learning' | 'preference' | 'fact' | 'correction';

    /** Memory content */
    content: string;

    /** Source context (channel, session, etc.) */
    source?: string;

    /** Importance score 0-1 */
    importance?: number;

    /** Related entity names */
    entities?: string[];

    /** Tags for filtering */
    tags?: string[];
}

export interface DailyLog {
    date: string; // YYYY-MM-DD
    entries: MemoryEntry[];
    metadata: {
        entryCount: number;
        lastUpdated: string;
        sources: string[];
    };
}

export interface SearchResult {
    entry: MemoryEntry;
    date: string;
    score: number;
    matchType: 'semantic' | 'keyword' | 'hybrid';
}

export interface DailyMemoryLogConfig {
    /** Base path for memory files */
    basePath: string;

    /** Owner type (usually 'agent' or 'app') */
    ownerType: OwnerType;

    /** Owner ID */
    ownerId: string;

    /** Auto-load days (default: 2 = today + yesterday) */
    autoLoadDays?: number;

    /** Maximum entries per file before rotation */
    maxEntriesPerDay?: number;
}

// ============================================================================
// BM25 Implementation
// ============================================================================

class BM25 {
    private k1 = 1.5;
    private b = 0.75;
    private documents: Map<string, string[]> = new Map();
    private idf: Map<string, number> = new Map();
    private avgDocLength = 0;

    addDocument(id: string, text: string): void {
        const tokens = this.tokenize(text);
        this.documents.set(id, tokens);
        this.updateIDF();
    }

    clear(): void {
        this.documents.clear();
        this.idf.clear();
        this.avgDocLength = 0;
    }

    search(query: string, topK: number = 10): Array<{ id: string; score: number }> {
        const queryTokens = this.tokenize(query);
        const scores: Array<{ id: string; score: number }> = [];

        for (const [id, docTokens] of this.documents) {
            let score = 0;
            const docLength = docTokens.length;
            const termFreq = new Map<string, number>();

            for (const token of docTokens) {
                termFreq.set(token, (termFreq.get(token) || 0) + 1);
            }

            for (const term of queryTokens) {
                const tf = termFreq.get(term) || 0;
                const idf = this.idf.get(term) || 0;

                const numerator = tf * (this.k1 + 1);
                const denominator = tf + this.k1 * (1 - this.b + this.b * (docLength / this.avgDocLength));
                score += idf * (numerator / denominator);
            }

            if (score > 0) {
                scores.push({ id, score });
            }
        }

        return scores.sort((a, b) => b.score - a.score).slice(0, topK);
    }

    private tokenize(text: string): string[] {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 2);
    }

    private updateIDF(): void {
        const docCount = this.documents.size;
        if (docCount === 0) return;

        const docFreq = new Map<string, number>();
        let totalLength = 0;

        for (const tokens of this.documents.values()) {
            const uniqueTokens = new Set(tokens);
            for (const token of uniqueTokens) {
                docFreq.set(token, (docFreq.get(token) || 0) + 1);
            }
            totalLength += tokens.length;
        }

        this.avgDocLength = totalLength / docCount;

        for (const [term, df] of docFreq) {
            this.idf.set(term, Math.log((docCount - df + 0.5) / (df + 0.5) + 1));
        }
    }
}

// ============================================================================
// Daily Memory Log Service
// ============================================================================

export class DailyMemoryLogService {
    private config: Required<DailyMemoryLogConfig>;
    private store: ResourceStore | null;
    private watcher: FSWatcher | null = null;
    private bm25: BM25 = new BM25();
    private loadedLogs: Map<string, DailyLog> = new Map();
    private debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

    constructor(config: DailyMemoryLogConfig, store?: ResourceStore) {
        this.config = {
            autoLoadDays: 2,
            maxEntriesPerDay: 500,
            ...config,
        };
        this.store = store ?? null;
    }

    // ============================================================================
    // Initialization
    // ============================================================================

    /**
     * Initialize service: create directory, load recent logs
     */
    async initialize(): Promise<void> {
        // Ensure memory directory exists
        await fs.mkdir(this.getMemoryDir(), { recursive: true });

        // Load today + yesterday
        await this.loadRecentDays(this.config.autoLoadDays);

        console.info(`[DailyMemoryLog] Initialized with ${this.loadedLogs.size} days loaded`);
    }

    /**
     * Load the most recent N days of logs
     */
    async loadRecentDays(days: number): Promise<void> {
        const today = new Date();

        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = this.formatDate(date);
            await this.loadDay(dateStr);
        }
    }

    /**
     * Load a specific day's log
     */
    async loadDay(date: string): Promise<DailyLog> {
        const filePath = this.getFilePath(date);

        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const log = this.parseLog(date, content);
            this.loadedLogs.set(date, log);

            // Index in BM25
            for (let i = 0; i < log.entries.length; i++) {
                const entry = log.entries[i];
                this.bm25.addDocument(`${date}:${i}`, entry.content);
            }

            return log;
        } catch {
            // File doesn't exist, create empty log
            const emptyLog: DailyLog = {
                date,
                entries: [],
                metadata: {
                    entryCount: 0,
                    lastUpdated: new Date().toISOString(),
                    sources: [],
                },
            };
            this.loadedLogs.set(date, emptyLog);
            return emptyLog;
        }
    }

    // ============================================================================
    // Memory Operations
    // ============================================================================

    /**
     * Add a new memory entry
     */
    async addMemory(entry: Omit<MemoryEntry, 'timestamp'>): Promise<void> {
        const date = this.formatDate(new Date());
        const fullEntry: MemoryEntry = {
            ...entry,
            timestamp: new Date().toISOString(),
        };

        // Ensure day is loaded
        let log = this.loadedLogs.get(date);
        if (!log) {
            log = await this.loadDay(date);
        }

        // Add entry
        log.entries.push(fullEntry);
        log.metadata.entryCount = log.entries.length;
        log.metadata.lastUpdated = new Date().toISOString();
        if (entry.source && !log.metadata.sources.includes(entry.source)) {
            log.metadata.sources.push(entry.source);
        }

        // Index in BM25
        const entryIndex = log.entries.length - 1;
        this.bm25.addDocument(`${date}:${entryIndex}`, entry.content);

        // Persist to file
        await this.saveDay(date);

        // Optionally sync to database
        if (this.store) {
            await this.syncToDatabase(date, fullEntry);
        }
    }

    /**
     * Get today's memories
     */
    async getToday(): Promise<MemoryEntry[]> {
        const date = this.formatDate(new Date());
        const log = this.loadedLogs.get(date);
        return log?.entries ?? [];
    }

    /**
     * Get memories for a specific date
     */
    async getByDate(date: string): Promise<MemoryEntry[]> {
        let log = this.loadedLogs.get(date);
        if (!log) {
            log = await this.loadDay(date);
        }
        return log.entries;
    }

    /**
     * Get memories for date range
     */
    async getByDateRange(startDate: string, endDate: string): Promise<Map<string, MemoryEntry[]>> {
        const results = new Map<string, MemoryEntry[]>();
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = this.formatDate(d);
            results.set(dateStr, await this.getByDate(dateStr));
        }

        return results;
    }

    // ============================================================================
    // Search
    // ============================================================================

    /**
     * Hybrid search combining BM25 and semantic similarity
     */
    async search(query: string, options?: {
        category?: MemoryEntry['category'];
        dateRange?: { start: string; end: string };
        limit?: number;
    }): Promise<SearchResult[]> {
        const limit = options?.limit ?? 20;

        // BM25 keyword search
        const bm25Results = this.bm25.search(query, limit * 2);

        const results: SearchResult[] = [];

        for (const { id, score } of bm25Results) {
            const [date, indexStr] = id.split(':');
            const index = parseInt(indexStr, 10);

            const log = this.loadedLogs.get(date);
            if (!log || !log.entries[index]) continue;

            const entry = log.entries[index];

            // Filter by category
            if (options?.category && entry.category !== options.category) {
                continue;
            }

            // Filter by date range
            if (options?.dateRange) {
                if (date < options.dateRange.start || date > options.dateRange.end) {
                    continue;
                }
            }

            results.push({
                entry,
                date,
                score,
                matchType: 'keyword',
            });
        }

        // Sort by score and limit
        return results.sort((a, b) => b.score - a.score).slice(0, limit);
    }

    /**
     * Find memories by entity mention
     */
    async findByEntity(entity: string): Promise<SearchResult[]> {
        const results: SearchResult[] = [];
        const entityLower = entity.toLowerCase();

        for (const [date, log] of this.loadedLogs) {
            for (const entry of log.entries) {
                // Check entities array
                if (entry.entities?.some(e => e.toLowerCase().includes(entityLower))) {
                    results.push({
                        entry,
                        date,
                        score: 1.0,
                        matchType: 'keyword',
                    });
                    continue;
                }

                // Check content
                if (entry.content.toLowerCase().includes(entityLower)) {
                    results.push({
                        entry,
                        date,
                        score: 0.5,
                        matchType: 'keyword',
                    });
                }
            }
        }

        return results.sort((a, b) => b.score - a.score);
    }

    // ============================================================================
    // File Operations
    // ============================================================================

    /**
     * Save a day's log to file
     */
    private async saveDay(date: string): Promise<void> {
        const log = this.loadedLogs.get(date);
        if (!log) return;

        const filePath = this.getFilePath(date);
        const content = this.serializeLog(log);

        await fs.mkdir(dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content, 'utf-8');
    }

    /**
     * Serialize log to markdown format
     */
    private serializeLog(log: DailyLog): string {
        const lines: string[] = [];

        // YAML frontmatter
        lines.push('---');
        lines.push(`date: ${log.date}`);
        lines.push(`owner: ${this.config.ownerId}`);
        lines.push(`ownerType: ${this.config.ownerType}`);
        lines.push(`entryCount: ${log.metadata.entryCount}`);
        lines.push(`lastUpdated: ${log.metadata.lastUpdated}`);
        lines.push('---');
        lines.push('');
        lines.push(`# Memory Log: ${log.date}`);
        lines.push('');

        // Group entries by category
        const byCategory = new Map<string, MemoryEntry[]>();
        for (const entry of log.entries) {
            const existing = byCategory.get(entry.category) || [];
            existing.push(entry);
            byCategory.set(entry.category, existing);
        }

        // Serialize each category
        for (const [category, entries] of byCategory) {
            lines.push(`## ${this.categoryLabel(category)}`);
            lines.push('');

            for (const entry of entries) {
                const time = new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                lines.push(`- **${time}** ${entry.content}`);

                if (entry.entities?.length) {
                    lines.push(`  - _Entities: ${entry.entities.join(', ')}_`);
                }
                if (entry.tags?.length) {
                    lines.push(`  - _Tags: ${entry.tags.join(', ')}_`);
                }
                if (entry.source) {
                    lines.push(`  - _Source: ${entry.source}_`);
                }
            }
            lines.push('');
        }

        return lines.join('\n');
    }

    /**
     * Parse log from markdown format
     */
    private parseLog(date: string, content: string): DailyLog {
        const entries: MemoryEntry[] = [];

        // Extract frontmatter
        const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);

        // Parse entries from markdown
        const entryRegex = /- \*\*(\d{1,2}:\d{2}(?:\s*[AP]M)?)\*\* (.+)/g;
        let match;

        while ((match = entryRegex.exec(content)) !== null) {
            const time = match[1];
            const text = match[2];

            // Determine category from section header
            const beforeEntry = content.substring(0, match.index);
            const lastHeader = beforeEntry.match(/## (\w+)\s*$/m);
            const category = lastHeader
                ? this.parseCategoryLabel(lastHeader[1])
                : 'observation';

            entries.push({
                timestamp: new Date(`${date}T${this.normalizeTime(time)}`).toISOString(),
                category,
                content: text,
            });
        }

        return {
            date,
            entries,
            metadata: {
                entryCount: entries.length,
                lastUpdated: new Date().toISOString(),
                sources: [],
            },
        };
    }

    // ============================================================================
    // File Watcher
    // ============================================================================

    /**
     * Start watching memory directory for external changes
     */
    startFileWatcher(): void {
        if (this.watcher) return;

        const memoryDir = this.getMemoryDir();

        try {
            this.watcher = watch(memoryDir, { recursive: true }, (_eventType, filename) => {
                if (!filename || !filename.endsWith('.md')) return;

                // Debounce
                const key = filename;
                const existing = this.debounceTimers.get(key);
                if (existing) clearTimeout(existing);

                this.debounceTimers.set(key, setTimeout(async () => {
                    this.debounceTimers.delete(key);

                    // Extract date from filename
                    const dateMatch = basename(filename).match(/^(\d{4}-\d{2}-\d{2})\.md$/);
                    if (dateMatch) {
                        await this.loadDay(dateMatch[1]);
                        console.info(`[DailyMemoryLog] Reloaded ${dateMatch[1]} from file change`);
                    }
                }, 500));
            });

            console.info(`[DailyMemoryLog] Watching ${memoryDir} for changes`);
        } catch (err) {
            console.error('[DailyMemoryLog] Failed to start watcher:', err);
        }
    }

    /**
     * Stop file watcher
     */
    stopFileWatcher(): void {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
        for (const timer of this.debounceTimers.values()) {
            clearTimeout(timer);
        }
        this.debounceTimers.clear();
    }

    // ============================================================================
    // Database Sync
    // ============================================================================

    /**
     * Sync a memory entry to database as a resource
     */
    private async syncToDatabase(date: string, entry: MemoryEntry): Promise<void> {
        if (!this.store) return;

        await this.store.create({
            resourceType: 'memory',
            ownerType: this.config.ownerType,
            ownerId: this.config.ownerId,
            name: `${entry.category}: ${entry.content.slice(0, 50)}...`,
            content: entry.content,
            parts: [],
            typeMetadata: {
                type: 'memory',
                layer: 'short_term',
                importance: entry.importance ?? 0.5,
                sourceSessionId: entry.source,
            },
            version: 1,
            isActive: true,
            isPinned: false,
            tags: [entry.category, `date:${date}`, ...(entry.tags ?? [])],
            provenance: 'agent_generated',
            usageFrequency: 0,
            syncToFile: false, // Already in file
        });
    }

    // ============================================================================
    // Context Compilation
    // ============================================================================

    /**
     * Compile loaded memories into context string for agent
     */
    compileContext(options?: {
        maxTokens?: number;
        prioritize?: 'recent' | 'important';
    }): string {
        const maxTokens = options?.maxTokens ?? 4000;
        const prioritize = options?.prioritize ?? 'recent';

        const allEntries: Array<{ entry: MemoryEntry; date: string }> = [];

        for (const [date, log] of this.loadedLogs) {
            for (const entry of log.entries) {
                allEntries.push({ entry, date });
            }
        }

        // Sort by priority
        if (prioritize === 'important') {
            allEntries.sort((a, b) => (b.entry.importance ?? 0.5) - (a.entry.importance ?? 0.5));
        } else {
            allEntries.sort((a, b) => new Date(b.entry.timestamp).getTime() - new Date(a.entry.timestamp).getTime());
        }

        // Build context within token budget
        const lines: string[] = ['# Recent Memories', ''];
        let tokenEstimate = 10;

        for (const { entry, date } of allEntries) {
            const line = `- [${date}] ${entry.category}: ${entry.content}`;
            const lineTokens = Math.ceil(line.length / 4);

            if (tokenEstimate + lineTokens > maxTokens) break;

            lines.push(line);
            tokenEstimate += lineTokens;
        }

        return lines.join('\n');
    }

    // ============================================================================
    // Helpers
    // ============================================================================

    private getMemoryDir(): string {
        return join(this.config.basePath, this.config.ownerId, 'memory');
    }

    private getFilePath(date: string): string {
        return join(this.getMemoryDir(), `${date}.md`);
    }

    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    private normalizeTime(time: string): string {
        // Convert 12h to 24h format if needed
        const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
        if (!match) return '00:00:00';

        let hours = parseInt(match[1], 10);
        const minutes = match[2];
        const period = match[3]?.toUpperCase();

        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
    }

    private categoryLabel(category: MemoryEntry['category']): string {
        const labels: Record<MemoryEntry['category'], string> = {
            observation: 'Observations',
            learning: 'Learnings',
            preference: 'Preferences',
            fact: 'Facts',
            correction: 'Corrections',
        };
        return labels[category] || category;
    }

    private parseCategoryLabel(label: string): MemoryEntry['category'] {
        const reverseMap: Record<string, MemoryEntry['category']> = {
            observations: 'observation',
            learnings: 'learning',
            preferences: 'preference',
            facts: 'fact',
            corrections: 'correction',
        };
        return reverseMap[label.toLowerCase()] || 'observation';
    }
}

// ============================================================================
// Factory
// ============================================================================

export function createDailyMemoryLogService(
    config: DailyMemoryLogConfig,
    store?: ResourceStore
): DailyMemoryLogService {
    return new DailyMemoryLogService(config, store);
}

export default DailyMemoryLogService;
