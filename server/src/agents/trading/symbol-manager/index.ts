/**
 * SymbolManagerAgent
 * 
 * A2A Agent for managing trading symbols, watchlists, and blacklists.
 * Organize your tracked assets and filter unwanted symbols.
 * 
 * Endpoints:
 * - A2A: POST /agents/symbol-manager/a2a
 */

import type { AgentCard, A2UIMessage, SendMessageParams } from '../../../a2a/types.js';
import { randomUUID } from 'crypto';
import { fetchTickers, getSymbolName } from '../shared/binance-client.js';

// ============================================================================
// Types
// ============================================================================

interface Watchlist {
    id: string;
    name: string;
    symbols: string[];
    createdAt: string;
    updatedAt: string;
}

interface SymbolInfo {
    symbol: string;
    name: string;
    category: 'major' | 'defi' | 'meme' | 'l2' | 'stable' | 'other';
    blacklisted: boolean;
    favorite: boolean;
    notes?: string;
}

// ============================================================================
// In-Memory Stores (Mock)
// ============================================================================

const watchlists: Map<string, Watchlist> = new Map();
const blacklist: Set<string> = new Set();
const favorites: Set<string> = new Set();
const symbolNotes: Map<string, string> = new Map();

// Default watchlist
const defaultWatchlist: Watchlist = {
    id: 'default',
    name: 'Default Watchlist',
    symbols: ['BTC', 'ETH', 'SOL', 'XRP', 'ADA'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};
watchlists.set('default', defaultWatchlist);

// Symbol categories
const symbolCategories: Record<string, 'major' | 'defi' | 'meme' | 'l2' | 'stable' | 'other'> = {
    BTC: 'major', ETH: 'major', BNB: 'major', XRP: 'major', SOL: 'major', ADA: 'major', DOT: 'major', LINK: 'major', LTC: 'major',
    UNI: 'defi', AAVE: 'defi', COMP: 'defi', MKR: 'defi', SNX: 'defi', SUSHI: 'defi', YFI: 'defi', CRV: 'defi',
    DOGE: 'meme', SHIB: 'meme', PEPE: 'meme', FLOKI: 'meme', BONK: 'meme',
    MATIC: 'l2', ARB: 'l2', OP: 'l2', IMX: 'l2', STRK: 'l2',
    USDT: 'stable', USDC: 'stable', BUSD: 'stable', DAI: 'stable', TUSD: 'stable',
};

// ============================================================================
// Symbol Management Functions
// ============================================================================

function addToWatchlist(watchlistId: string, symbols: string[]): Watchlist | null {
    const watchlist = watchlists.get(watchlistId);
    if (!watchlist) return null;

    const symbolsUpper = symbols.map(s => s.toUpperCase());
    const newSymbols = symbolsUpper.filter(s => !watchlist.symbols.includes(s));

    watchlist.symbols.push(...newSymbols);
    watchlist.updatedAt = new Date().toISOString();

    return watchlist;
}

function removeFromWatchlist(watchlistId: string, symbols: string[]): Watchlist | null {
    const watchlist = watchlists.get(watchlistId);
    if (!watchlist) return null;

    const symbolsUpper = symbols.map(s => s.toUpperCase());
    watchlist.symbols = watchlist.symbols.filter(s => !symbolsUpper.includes(s));
    watchlist.updatedAt = new Date().toISOString();

    return watchlist;
}

function createWatchlist(name: string, symbols: string[] = []): Watchlist {
    const watchlist: Watchlist = {
        id: randomUUID(),
        name,
        symbols: symbols.map(s => s.toUpperCase()),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    watchlists.set(watchlist.id, watchlist);
    return watchlist;
}

function addToBlacklist(symbols: string[]): void {
    symbols.forEach(s => blacklist.add(s.toUpperCase()));
}

function removeFromBlacklist(symbols: string[]): void {
    symbols.forEach(s => blacklist.delete(s.toUpperCase()));
}

function isBlacklisted(symbol: string): boolean {
    return blacklist.has(symbol.toUpperCase());
}

function toggleFavorite(symbol: string): boolean {
    const symbolUpper = symbol.toUpperCase();
    if (favorites.has(symbolUpper)) {
        favorites.delete(symbolUpper);
        return false;
    } else {
        favorites.add(symbolUpper);
        return true;
    }
}

function getSymbolInfo(symbol: string): SymbolInfo {
    const symbolUpper = symbol.toUpperCase();
    return {
        symbol: symbolUpper,
        name: getSymbolName(symbolUpper),
        category: symbolCategories[symbolUpper] || 'other',
        blacklisted: blacklist.has(symbolUpper),
        favorite: favorites.has(symbolUpper),
        notes: symbolNotes.get(symbolUpper),
    };
}

// ============================================================================
// Agent Card
// ============================================================================

export const getSymbolManagerAgentCard = (baseUrl: string): AgentCard => ({
    protocolVersions: ['1.0'],
    name: 'Symbol Manager',
    description: 'Organize your crypto watchlists, mark favorites, and manage blacklisted tokens. Keep your trading view clean and focused.',
    version: '1.0.0',
    supportedInterfaces: [
        { url: `${baseUrl}/agents/symbol-manager`, protocolBinding: 'JSONRPC' },
    ],
    capabilities: { streaming: false, pushNotifications: false },
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain', 'application/json'],
    skills: [
        {
            id: 'watchlist',
            name: 'Manage Watchlist',
            description: 'Add/remove symbols from watchlist',
            tags: ['watchlist', 'add', 'remove', 'track'],
            examples: ['add SOL to watchlist', 'remove DOGE from watchlist', 'show watchlist'],
        },
        {
            id: 'blacklist',
            name: 'Manage Blacklist',
            description: 'Block symbols from analysis',
            tags: ['blacklist', 'block', 'hide'],
            examples: ['blacklist SHIB', 'unblock DOGE', 'show blacklist'],
        },
        {
            id: 'favorite',
            name: 'Toggle Favorite',
            description: 'Mark symbol as favorite',
            tags: ['favorite', 'star', 'like'],
            examples: ['favorite BTC', 'unfavorite ETH', 'show favorites'],
        },
        {
            id: 'info',
            name: 'Symbol Info',
            description: 'Get info about a symbol',
            tags: ['info', 'details', 'about'],
            examples: ['info BTC', 'tell me about ETH', 'symbol details SOL'],
        },
        {
            id: 'categories',
            name: 'Browse Categories',
            description: 'View symbols by category',
            tags: ['category', 'major', 'defi', 'meme', 'l2'],
            examples: ['show defi coins', 'list meme coins', 'major cryptos'],
        },
    ],
    provider: { organization: 'LiquidCrypto Labs' },
    extensions: {
        a2ui: {
            version: '0.8',
            supportedComponents: ['Card', 'List', 'Button', 'Text', 'Row', 'Column']
        },
    },
});

// ============================================================================
// Intent Detection
// ============================================================================

interface SymbolIntent {
    action: 'add-watchlist' | 'remove-watchlist' | 'show-watchlist' | 'blacklist' | 'unblacklist' | 'show-blacklist' | 'favorite' | 'show-favorites' | 'info' | 'category' | 'help';
    symbols: string[];
    category?: string;
}

function parseSymbolIntent(text: string): SymbolIntent {
    const lower = text.toLowerCase().trim();

    // Extract all symbols
    const symbolMatches = lower.match(/\b(btc|eth|bnb|sol|xrp|ada|doge|dot|matic|shib|avax|link|ltc|uni|atom|near|apt|arb|op|pepe|aave|comp|mkr)\b/gi);
    const symbols = symbolMatches ? [...new Set(symbolMatches.map(s => s.toUpperCase()))] : [];

    // Extract category
    let category: string | undefined;
    if (lower.includes('major')) category = 'major';
    else if (lower.includes('defi')) category = 'defi';
    else if (lower.includes('meme')) category = 'meme';
    else if (lower.includes('l2') || lower.includes('layer 2')) category = 'l2';
    else if (lower.includes('stable')) category = 'stable';

    // Determine action
    if (lower.includes('blacklist') && (lower.includes('show') || lower.includes('list'))) {
        return { action: 'show-blacklist', symbols: [] };
    }
    if (lower.includes('blacklist') || lower.includes('block')) {
        return { action: 'blacklist', symbols };
    }
    if (lower.includes('unblock') || lower.includes('whitelist') || lower.includes('un-blacklist')) {
        return { action: 'unblacklist', symbols };
    }
    if (lower.includes('favorite') && (lower.includes('show') || lower.includes('list') || lower.includes('my'))) {
        return { action: 'show-favorites', symbols: [] };
    }
    if (lower.includes('favorite') || lower.includes('star')) {
        return { action: 'favorite', symbols };
    }
    if (lower.includes('info') || lower.includes('about') || lower.includes('detail')) {
        return { action: 'info', symbols };
    }
    if (category || lower.includes('categor')) {
        return { action: 'category', symbols: [], category };
    }
    if (lower.includes('add') && (lower.includes('watch') || lower.includes('list') || lower.includes('track'))) {
        return { action: 'add-watchlist', symbols };
    }
    if (lower.includes('remove') && (lower.includes('watch') || lower.includes('list'))) {
        return { action: 'remove-watchlist', symbols };
    }
    if (lower.includes('watchlist') || lower.includes('watch list') || lower.includes('my list')) {
        return { action: 'show-watchlist', symbols: [] };
    }

    return { action: 'help', symbols: [] };
}

// ============================================================================
// Formatting Helpers
// ============================================================================

function categoryEmoji(category: string): string {
    switch (category) {
        case 'major': return '💎';
        case 'defi': return '🏦';
        case 'meme': return '🐕';
        case 'l2': return '⚡';
        case 'stable': return '💵';
        default: return '🪙';
    }
}

// ============================================================================
// A2UI Generation
// ============================================================================

function generateWatchlistCard(watchlist: Watchlist): A2UIMessage[] {
    const symbolComponents: Array<{ id: string; component: object }> = [];
    const symbolIds: string[] = [];

    watchlist.symbols.forEach((symbol, idx) => {
        const id = `sym-${idx}`;
        symbolIds.push(id);

        const info = getSymbolInfo(symbol);
        symbolComponents.push({
            id,
            component: {
                Row: {
                    children: [`${id}-cat`, `${id}-name`, `${id}-fav`, `${id}-action`]
                }
            },
        });
        symbolComponents.push({
            id: `${id}-cat`,
            component: { Text: { text: { literalString: categoryEmoji(info.category) } } },
        });
        symbolComponents.push({
            id: `${id}-name`,
            component: { Text: { text: { literalString: `${symbol} (${info.name})` } } },
        });
        symbolComponents.push({
            id: `${id}-fav`,
            component: { Text: { text: { literalString: info.favorite ? '⭐' : '' } } },
        });
        symbolComponents.push({
            id: `${id}-action`,
            component: {
                Button: {
                    label: { literalString: 'Remove' },
                    action: { input: { text: `remove ${symbol} from watchlist` } },
                },
            },
        });
    });

    return [
        {
            type: 'beginRendering',
            surfaceId: 'watchlist',
            rootComponentId: 'root',
            styling: { primaryColor: '#6366F1' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'watchlist',
            components: [
                {
                    id: 'root',
                    component: { Column: { children: ['header', 'count', ...symbolIds] } },
                },
                {
                    id: 'header',
                    component: { Text: { text: { literalString: `📋 ${watchlist.name}` }, semantic: 'h2' } },
                },
                {
                    id: 'count',
                    component: { Text: { text: { literalString: `${watchlist.symbols.length} symbols tracked` }, variant: 'secondary' } },
                },
                ...symbolComponents,
            ],
        },
    ];
}

// ============================================================================
// Request Handler
// ============================================================================

export async function handleSymbolManagerRequest(params: SendMessageParams): Promise<any> {
    const taskId = randomUUID();
    const contextId = params.message.contextId || randomUUID();

    const textPart = params.message.parts.find((p: any) => 'text' in p || p.kind === 'text');
    const userText = textPart?.text || '';

    console.log(`[SymbolManager] Processing: "${userText}"`);

    const intent = parseSymbolIntent(userText);
    console.log(`[SymbolManager] Intent:`, intent);

    try {
        let responseText = '';
        let a2uiMessages: A2UIMessage[] = [];

        switch (intent.action) {
            case 'add-watchlist': {
                if (intent.symbols.length === 0) {
                    responseText = 'Please specify symbols to add. Example: "add BTC ETH to watchlist"';
                    break;
                }
                const watchlist = addToWatchlist('default', intent.symbols);
                responseText = `✅ Added to watchlist: ${intent.symbols.join(', ')}\nWatchlist now has ${watchlist?.symbols.length} symbols.`;
                break;
            }

            case 'remove-watchlist': {
                if (intent.symbols.length === 0) {
                    responseText = 'Please specify symbols to remove. Example: "remove DOGE from watchlist"';
                    break;
                }
                const watchlist = removeFromWatchlist('default', intent.symbols);
                responseText = `✅ Removed from watchlist: ${intent.symbols.join(', ')}\nWatchlist now has ${watchlist?.symbols.length} symbols.`;
                break;
            }

            case 'show-watchlist': {
                const watchlist = watchlists.get('default')!;
                responseText = `📋 ${watchlist.name} (${watchlist.symbols.length} symbols):\n` +
                    watchlist.symbols.map(s => {
                        const info = getSymbolInfo(s);
                        return `${categoryEmoji(info.category)} ${s}${info.favorite ? ' ⭐' : ''}`;
                    }).join('\n');
                a2uiMessages = generateWatchlistCard(watchlist);
                break;
            }

            case 'blacklist': {
                if (intent.symbols.length === 0) {
                    responseText = 'Please specify symbols to blacklist. Example: "blacklist SHIB"';
                    break;
                }
                addToBlacklist(intent.symbols);
                responseText = `🚫 Blacklisted: ${intent.symbols.join(', ')}\nThese symbols will be excluded from analysis.`;
                break;
            }

            case 'unblacklist': {
                if (intent.symbols.length === 0) {
                    responseText = 'Please specify symbols to unblock. Example: "unblock DOGE"';
                    break;
                }
                removeFromBlacklist(intent.symbols);
                responseText = `✅ Unblocked: ${intent.symbols.join(', ')}`;
                break;
            }

            case 'show-blacklist': {
                const blocked = Array.from(blacklist);
                if (blocked.length === 0) {
                    responseText = 'No blacklisted symbols. Use "blacklist SYMBOL" to block symbols from analysis.';
                } else {
                    responseText = `🚫 Blacklisted Symbols:\n${blocked.map(s => `• ${s}`).join('\n')}`;
                }
                break;
            }

            case 'favorite': {
                if (intent.symbols.length === 0) {
                    responseText = 'Please specify a symbol. Example: "favorite BTC"';
                    break;
                }
                const results = intent.symbols.map(s => {
                    const isFav = toggleFavorite(s);
                    return `${s}: ${isFav ? '⭐ Favorited' : 'Unfavorited'}`;
                });
                responseText = results.join('\n');
                break;
            }

            case 'show-favorites': {
                const favs = Array.from(favorites);
                if (favs.length === 0) {
                    responseText = 'No favorites yet. Use "favorite BTC" to add favorites.';
                } else {
                    responseText = `⭐ Favorite Symbols:\n${favs.map(s => `• ${s} (${getSymbolName(s)})`).join('\n')}`;
                }
                break;
            }

            case 'info': {
                if (intent.symbols.length === 0) {
                    responseText = 'Please specify a symbol. Example: "info BTC"';
                    break;
                }
                const infos = intent.symbols.map(s => {
                    const info = getSymbolInfo(s);
                    return `${categoryEmoji(info.category)} **${s}** (${info.name})\n` +
                        `Category: ${info.category}\n` +
                        `Favorite: ${info.favorite ? '⭐ Yes' : 'No'}\n` +
                        `Blacklisted: ${info.blacklisted ? '🚫 Yes' : 'No'}`;
                });
                responseText = infos.join('\n\n');
                break;
            }

            case 'category': {
                const cat = intent.category || 'major';
                const symbolsInCat = Object.entries(symbolCategories)
                    .filter(([_, c]) => c === cat)
                    .map(([s]) => s);

                responseText = `${categoryEmoji(cat)} ${cat.toUpperCase()} Coins:\n` +
                    symbolsInCat.map(s => `• ${s} (${getSymbolName(s)})`).join('\n');
                break;
            }

            default:
                responseText = `📋 Symbol Manager\n\nCommands:\n• "show watchlist" - View your watchlist\n• "add BTC ETH to watchlist" - Add symbols\n• "remove DOGE from watchlist" - Remove symbols\n• "favorite BTC" - Toggle favorite\n• "blacklist SHIB" - Block from analysis\n• "info ETH" - Symbol details\n• "show defi coins" - Browse by category`;
        }

        return {
            id: taskId,
            contextId,
            status: { state: 'completed' },
            artifacts: a2uiMessages.length > 0 ? [{
                artifactId: randomUUID(),
                name: 'symbol-manager-result',
                parts: a2uiMessages.map(msg => ({ type: 'a2ui', ...msg })),
            }] : undefined,
            history: [
                params.message,
                { role: 'agent', parts: [{ text: responseText }] },
            ],
        };
    } catch (error) {
        console.error('[SymbolManager] Error:', error);
        return {
            id: taskId,
            contextId,
            status: { state: 'failed' },
            history: [
                params.message,
                { role: 'agent', parts: [{ text: `Error: ${(error as Error).message}` }] },
            ],
        };
    }
}
