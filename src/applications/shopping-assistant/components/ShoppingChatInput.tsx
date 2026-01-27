/**
 * Shopping Chat Input
 * Chat input with search autocomplete and voice support
 */
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, Search, Mic, Loader2, Clock, TrendingUp, X } from 'lucide-react';
import { Product } from '@/services/a2a/CommerceService';

// Storage key for search history
const SEARCH_HISTORY_KEY = 'cymbal-search-history';
const MAX_HISTORY_ITEMS = 10;

interface ShoppingChatInputProps {
  onSend: (message: string) => void;
  onSearch: (query: string) => void;
  products?: Product[];
  isLoading?: boolean;
  placeholder?: string;
}

// Popular/trending search terms
const TRENDING_SEARCHES = [
  'running shoes',
  'wireless earbuds',
  'backpack',
  'water bottle',
  'yoga mat',
  'smartwatch',
];

export const ShoppingChatInput: React.FC<ShoppingChatInputProps> = ({
  onSend,
  onSearch,
  products = [],
  isLoading = false,
  placeholder = "Ask about products, search, or manage your cart..."
}) => {
  const [input, setInput] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Save search to history
  const saveToHistory = useCallback((query: string) => {
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== query.toLowerCase());
      const updated = [query, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save search history:', e);
      }
      return updated;
    });
  }, []);

  // Clear a single history item
  const removeFromHistory = useCallback((query: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchHistory(prev => {
      const updated = prev.filter(item => item !== query);
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to update search history:', e);
      }
      return updated;
    });
  }, []);

  // Generate autocomplete suggestions
  const suggestions = useMemo(() => {
    if (!isSearchMode || !input.trim()) {
      // Show history and trending when input is empty
      const historyItems = searchHistory.slice(0, 4).map(term => ({
        type: 'history' as const,
        text: term,
      }));
      const trendingItems = TRENDING_SEARCHES
        .filter(term => !searchHistory.includes(term))
        .slice(0, 4 - historyItems.length)
        .map(term => ({
          type: 'trending' as const,
          text: term,
        }));
      return [...historyItems, ...trendingItems];
    }

    const query = input.toLowerCase();
    const results: Array<{ type: 'history' | 'trending' | 'product' | 'category' | 'brand'; text: string; product?: Product }> = [];

    // Match from history
    const matchedHistory = searchHistory
      .filter(term => term.toLowerCase().includes(query))
      .slice(0, 2)
      .map(term => ({ type: 'history' as const, text: term }));
    results.push(...matchedHistory);

    // Match from products
    const matchedProducts = products
      .filter(p => p.name.toLowerCase().includes(query))
      .slice(0, 3)
      .map(p => ({ type: 'product' as const, text: p.name, product: p }));
    results.push(...matchedProducts);

    // Match categories
    const categories = [...new Set(products.map(p => p.category))];
    const matchedCategories = categories
      .filter(cat => cat.toLowerCase().includes(query))
      .slice(0, 2)
      .map(cat => ({ type: 'category' as const, text: cat }));
    results.push(...matchedCategories);

    // Match brands
    const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
    const matchedBrands = brands
      .filter(brand => brand!.toLowerCase().includes(query))
      .slice(0, 2)
      .map(brand => ({ type: 'brand' as const, text: brand! }));
    results.push(...matchedBrands);

    // Match trending
    const matchedTrending = TRENDING_SEARCHES
      .filter(term => term.toLowerCase().includes(query) && !results.some(r => r.text === term))
      .slice(0, 2)
      .map(term => ({ type: 'trending' as const, text: term }));
    results.push(...matchedTrending);

    return results.slice(0, 8);
  }, [input, isSearchMode, searchHistory, products]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      if (isSearchMode) {
        saveToHistory(input.trim());
        onSearch(input.trim());
      } else {
        onSend(input.trim());
      }
      setInput('');
      setShowAutocomplete(false);
    }
  };

  const handleSelectSuggestion = (suggestion: typeof suggestions[0]) => {
    if (suggestion.type === 'product' && suggestion.product) {
      // Search for the specific product
      onSearch(suggestion.text);
    } else {
      onSearch(suggestion.text);
    }
    saveToHistory(suggestion.text);
    setInput('');
    setShowAutocomplete(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Toggle search mode with /
    if (e.key === '/' && input === '') {
      e.preventDefault();
      setIsSearchMode(!isSearchMode);
      return;
    }

    // Navigate autocomplete with arrow keys
    if (showAutocomplete && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else if (e.key === 'Escape') {
        setShowAutocomplete(false);
        setSelectedIndex(-1);
      }
    }
  };

  // Show autocomplete when in search mode and input is focused
  const handleFocus = () => {
    if (isSearchMode) {
      setShowAutocomplete(true);
    }
  };

  // Hide autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  return (
    <div className="border-t border-white/5 bg-glass-elevated/50 backdrop-blur-xl">
      <form onSubmit={handleSubmit} className="p-3">
        <div className="flex items-center gap-2">
          {/* Search mode toggle */}
          <button
            type="button"
            onClick={() => {
              setIsSearchMode(!isSearchMode);
              setShowAutocomplete(!isSearchMode);
            }}
            className={`p-2 rounded-lg transition-all ${
              isSearchMode
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'bg-white/5 text-white/50 hover:text-white/80'
            }`}
            title="Toggle search mode (press /)"
          >
            <Search size={18} />
          </button>

          {/* Input field with autocomplete */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (isSearchMode) {
                  setShowAutocomplete(true);
                }
              }}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              placeholder={isSearchMode ? "Search products..." : placeholder}
              disabled={isLoading}
              autoComplete="off"
              className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border transition-all text-white placeholder-white/40 focus:outline-none ${
                isSearchMode
                  ? 'border-indigo-500/30 focus:border-indigo-500/50'
                  : 'border-white/10 focus:border-white/20'
              }`}
            />
            {isSearchMode && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-indigo-400/60">
                Search
              </span>
            )}

            {/* Autocomplete dropdown */}
            {showAutocomplete && isSearchMode && suggestions.length > 0 && (
              <div
                ref={autocompleteRef}
                className="absolute bottom-full left-0 right-0 mb-2 bg-glass-elevated rounded-xl border border-white/10 shadow-xl overflow-hidden z-50"
              >
                <div className="py-2">
                  {!input.trim() && (
                    <div className="px-3 py-1.5 text-xs text-white/40 uppercase tracking-wide">
                      {searchHistory.length > 0 ? 'Recent & Trending' : 'Trending Searches'}
                    </div>
                  )}
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={`${suggestion.type}-${suggestion.text}`}
                      type="button"
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-all ${
                        idx === selectedIndex
                          ? 'bg-indigo-500/20 text-white'
                          : 'text-white/80 hover:bg-white/5'
                      }`}
                    >
                      {suggestion.type === 'history' && (
                        <Clock size={14} className="text-white/40 flex-shrink-0" />
                      )}
                      {suggestion.type === 'trending' && (
                        <TrendingUp size={14} className="text-green-400 flex-shrink-0" />
                      )}
                      {suggestion.type === 'product' && suggestion.product && (
                        <div className="w-8 h-8 rounded bg-white/5 overflow-hidden flex-shrink-0">
                          {suggestion.product.images[0] ? (
                            <img
                              src={suggestion.product.images[0]}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : null}
                        </div>
                      )}
                      {suggestion.type === 'category' && (
                        <span className="w-5 h-5 rounded bg-purple-500/20 text-purple-400 text-xs flex items-center justify-center flex-shrink-0">
                          C
                        </span>
                      )}
                      {suggestion.type === 'brand' && (
                        <span className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center flex-shrink-0">
                          B
                        </span>
                      )}
                      <span className="flex-1 truncate text-sm">{suggestion.text}</span>
                      {suggestion.type === 'history' && (
                        <button
                          type="button"
                          onClick={(e) => removeFromHistory(suggestion.text, e)}
                          className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Voice input (placeholder) */}
          <button
            type="button"
            className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white/80 transition-all"
            title="Voice input (coming soon)"
          >
            <Mic size={18} />
          </button>

          {/* Send button */}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>

        {/* Quick suggestions */}
        <div className="flex items-center gap-2 mt-2 overflow-x-auto custom-scrollbar pb-1">
          <QuickSuggestion onClick={() => onSend("What's in my cart?")} label="View cart" />
          <QuickSuggestion onClick={() => onSearch("running shoes")} label="Running shoes" />
          <QuickSuggestion onClick={() => onSearch("electronics")} label="Electronics" />
          <QuickSuggestion onClick={() => onSend("Apply code WELCOME10")} label="Apply discount" />
        </div>
      </form>
    </div>
  );
};

const QuickSuggestion: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
  <button
    onClick={onClick}
    className="flex-shrink-0 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-xs text-white/60 hover:text-white/80 transition-all"
  >
    {label}
  </button>
);
