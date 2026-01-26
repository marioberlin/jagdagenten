/**
 * Intent Input Component
 *
 * Natural language input for describing video animations.
 * Parses intent and generates timeline events.
 */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Loader2, History, X, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

interface IntentSuggestion {
  text: string;
  category: 'animation' | 'chart' | 'effect' | 'template';
}

interface IntentHistoryItem {
  id: string;
  text: string;
  timestamp: Date;
  success: boolean;
}

interface IntentInputProps {
  onSubmit: (intent: string) => Promise<void>;
  isProcessing?: boolean;
  placeholder?: string;
  className?: string;
}

const SUGGESTIONS: IntentSuggestion[] = [
  { text: 'Create a line chart showing price over time', category: 'chart' },
  { text: 'Animate the logo with a bounce effect', category: 'animation' },
  { text: 'Add a fade transition between scenes', category: 'effect' },
  { text: 'Generate a trading dashboard with live data', category: 'template' },
  { text: 'Make the text fly in from the left', category: 'animation' },
  { text: 'Create a pie chart of portfolio allocation', category: 'chart' },
  { text: 'Add particle effects to the background', category: 'effect' },
  { text: 'Build a crypto price ticker animation', category: 'template' },
];

const CATEGORY_COLORS: Record<string, string> = {
  animation: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  chart: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  effect: 'bg-green-500/20 text-green-400 border-green-500/30',
  template: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

export const IntentInput: React.FC<IntentInputProps> = ({
  onSubmit,
  isProcessing = false,
  placeholder = 'Describe what you want to create...',
  className,
}) => {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [history, setHistory] = useState<IntentHistoryItem[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('liquid-motion-intent-history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed.map((item: IntentHistoryItem) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        })));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = (text: string, success: boolean) => {
    const newItem: IntentHistoryItem = {
      id: Date.now().toString(),
      text,
      timestamp: new Date(),
      success,
    };
    const updated = [newItem, ...history].slice(0, 20);
    setHistory(updated);
    localStorage.setItem('liquid-motion-intent-history', JSON.stringify(updated));
  };

  const handleSubmit = async () => {
    if (!value.trim() || isProcessing) return;

    const intent = value.trim();
    setValue('');

    try {
      await onSubmit(intent);
      saveToHistory(intent, true);
    } catch {
      saveToHistory(intent, false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: IntentSuggestion) => {
    setValue(suggestion.text);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleHistoryClick = (item: IntentHistoryItem) => {
    setValue(item.text);
    setShowHistory(false);
    inputRef.current?.focus();
  };

  const filteredSuggestions = value.trim()
    ? SUGGESTIONS.filter((s) =>
        s.text.toLowerCase().includes(value.toLowerCase())
      )
    : SUGGESTIONS;

  return (
    <div className={cn('relative', className)}>
      {/* Main Input */}
      <div
        className={cn(
          'relative flex items-end gap-2 p-3 bg-white/5 border rounded-lg transition-colors',
          isFocused ? 'border-blue-500/50 bg-white/10' : 'border-white/10'
        )}
      >
        <Sparkles className="w-5 h-5 text-blue-400 mb-1 flex-shrink-0" />

        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            setShowSuggestions(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            // Delay hiding to allow click events
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          placeholder={placeholder}
          disabled={isProcessing}
          rows={1}
          className={cn(
            'flex-1 bg-transparent text-white placeholder-white/40 resize-none',
            'focus:outline-none text-sm leading-relaxed',
            'min-h-[24px] max-h-[120px]'
          )}
          style={{
            height: 'auto',
            overflow: 'hidden',
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
          }}
        />

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={cn(
              'p-1.5 rounded transition-colors',
              showHistory
                ? 'bg-white/20 text-white'
                : 'text-white/50 hover:text-white hover:bg-white/10'
            )}
            title="Intent history"
          >
            <History className="w-4 h-4" />
          </button>

          <button
            onClick={handleSubmit}
            disabled={!value.trim() || isProcessing}
            className={cn(
              'p-1.5 rounded transition-colors',
              value.trim() && !isProcessing
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            )}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && filteredSuggestions.length > 0 && !showHistory && (
          <motion.div
            className="absolute left-0 right-0 top-full mt-2 bg-slate-800 border border-white/10 rounded-lg shadow-xl overflow-hidden z-50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="p-2 border-b border-white/10">
              <span className="text-xs text-white/50">Suggestions</span>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredSuggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/5 transition-colors"
                >
                  <span
                    className={cn(
                      'px-2 py-0.5 text-[10px] font-medium rounded border',
                      CATEGORY_COLORS[suggestion.category]
                    )}
                  >
                    {suggestion.category}
                  </span>
                  <span className="text-sm text-white/80 flex-1">
                    {suggestion.text}
                  </span>
                  <ChevronRight className="w-4 h-4 text-white/30" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Dropdown */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            className="absolute left-0 right-0 top-full mt-2 bg-slate-800 border border-white/10 rounded-lg shadow-xl overflow-hidden z-50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-center justify-between p-2 border-b border-white/10">
              <span className="text-xs text-white/50">Recent Intents</span>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                <X className="w-3 h-3 text-white/50" />
              </button>
            </div>
            {history.length === 0 ? (
              <div className="p-4 text-center text-sm text-white/40">
                No history yet
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleHistoryClick(item)}
                    className="w-full flex items-start gap-3 px-3 py-2 text-left hover:bg-white/5 transition-colors"
                  >
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                        item.success ? 'bg-green-500' : 'bg-red-500'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white/80 truncate">
                        {item.text}
                      </div>
                      <div className="text-xs text-white/40">
                        {formatTimeAgo(item.timestamp)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Indicator */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            className="absolute left-0 right-0 -bottom-8 flex items-center gap-2 text-xs text-blue-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Processing intent...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
