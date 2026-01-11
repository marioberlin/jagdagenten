
import { useState, useMemo, useEffect } from 'react';
import { categoricalSymbols, uniqueSymbols } from '../data/sfSymbols';
import { GlassSelect } from '../components/forms/GlassSelect';

// Local Asset URL
const getImageUrl = (symbolName: string, format: 'svg' | 'png' = 'svg') => {
  if (format === 'png') {
    const safeName = symbolName.replace(/\./g, '_');
    return `/symbols_png/${safeName}.png`;
  }
  return `/symbols/${symbolName}/regular.svg`;
};

export default function SFSymbolsViewer() {
  // Detect dark mode from html class (Tailwind pattern)
  const [isDarkMode, setIsDarkMode] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [imageFormat, setImageFormat] = useState<'svg' | 'png'>('svg');
  const [copiedSymbol, setCopiedSymbol] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [iconSize, setIconSize] = useState(40);

  const categoryOptions = useMemo(() => [
    { label: "All", value: "All" },
    ...Object.keys(categoricalSymbols).map(cat => ({ label: cat, value: cat }))
  ], []);

  const filteredSymbols = useMemo(() => {
    let symbols = selectedCategory === 'All'
      ? uniqueSymbols
      : categoricalSymbols[selectedCategory] || [];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      symbols = symbols.filter(s => s.toLowerCase().includes(term));
    }
    return symbols;
  }, [searchTerm, selectedCategory]);

  const copyToClipboard = (symbol: string) => {
    navigator.clipboard.writeText(symbol);
    setCopiedSymbol(symbol);
    setTimeout(() => setCopiedSymbol(null), 1500);
  };

  const handleImageError = (symbol: string) => {
    setImageErrors(prev => new Set(prev).add(symbol));
  };

  // Icon filter: invert in dark mode (icons are black by default)
  const iconFilter = isDarkMode ? 'invert(1)' : 'none';

  return (
    <div className="min-h-screen bg-primary text-primary transition-colors" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--bg-primary)]/80 border-b border-[var(--glass-border)]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white">
                SF
              </div>
              <div>
                <h1 className="text-xl font-semibold text-primary">SF Symbols Browser</h1>
                <p className="text-xs text-secondary">{uniqueSymbols.length.toLocaleString()} symbols • from andrewtavis/sf-symbols-online</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Category Select */}
            <div className="w-[200px]">
              <GlassSelect
                options={categoryOptions}
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                placeholder="Select Category"
              />
            </div>

            {/* Format Toggle */}
            <div className="flex bg-glass-surface rounded-lg p-1 border border-[var(--glass-border)] h-[42px] items-center">
              <button
                onClick={() => setImageFormat('svg')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${imageFormat === 'svg' ? 'bg-accent text-white' : 'text-secondary hover:text-primary'
                  }`}
              >
                SVG
              </button>
              <button
                onClick={() => setImageFormat('png')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${imageFormat === 'png' ? 'bg-accent text-white' : 'text-secondary hover:text-primary'
                  }`}
              >
                PNG
              </button>
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search symbols..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-glass-surface border border-[var(--glass-border)] text-primary placeholder:text-tertiary text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
              />
            </div>

            {/* Size Control */}
            <div className="flex items-center gap-2 bg-glass-surface rounded-xl px-3 py-2 border border-[var(--glass-border)]">
              <span className="text-xs text-tertiary">Size</span>
              <input
                type="range"
                min="24"
                max="80"
                value={iconSize}
                onChange={(e) => setIconSize(Number(e.target.value))}
                className="w-20 accent-[var(--accent)]"
              />
              <span className="text-xs text-secondary w-6">{iconSize}</span>
            </div>

            {/* View Mode */}
            <div className="flex bg-glass-surface rounded-xl p-1 border border-[var(--glass-border)]">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${viewMode === 'grid' ? 'bg-accent text-white' : 'text-secondary hover:text-primary'}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${viewMode === 'list' ? 'bg-accent text-white' : 'text-secondary hover:text-primary'}`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Results Count */}
      <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-secondary">
        Showing {filteredSymbols.length} symbol{filteredSymbols.length !== 1 ? 's' : ''}
        {selectedCategory !== 'All' && ` in ${selectedCategory}`}
        {searchTerm && ` for "${searchTerm}"`}
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 pb-8">
        {viewMode === 'grid' ? (
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${iconSize + 40}px, 1fr))` }}
          >
            {filteredSymbols.map((symbol) => (
              <button
                key={symbol}
                onClick={() => copyToClipboard(symbol)}
                aria-label={`Copy ${symbol} to clipboard`}
                className={`group relative flex flex-col items-center justify-center p-3 rounded-xl transition-all ${copiedSymbol === symbol
                  ? 'bg-green-500/20 ring-1 ring-green-500/50'
                  : 'bg-glass-surface hover:bg-glass-surface-hover border border-transparent hover:border-[var(--glass-border)]'
                  }`}
                title={symbol}
              >
                {!imageErrors.has(symbol) ? (
                  <img
                    src={getImageUrl(symbol, imageFormat)}
                    alt=""
                    aria-hidden="true"
                    width={iconSize}
                    height={iconSize}
                    onError={() => handleImageError(symbol)}
                    className="object-contain"
                    style={{ filter: iconFilter, width: iconSize, height: iconSize }}
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="flex items-center justify-center bg-glass-surface rounded"
                    style={{ width: iconSize, height: iconSize }}
                  >
                    <span className="text-tertiary text-xs">?</span>
                  </div>
                )}
                <span className="mt-2 text-[9px] text-tertiary group-hover:text-secondary transition-colors text-center leading-tight truncate w-full">
                  {symbol}
                </span>
                {copiedSymbol === symbol && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500/90 rounded-xl">
                    <span className="text-white text-xs font-medium">Copied!</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredSymbols.map((symbol) => (
              <button
                key={symbol}
                onClick={() => copyToClipboard(symbol)}
                aria-label={`Copy ${symbol} to clipboard`}
                className={`group flex items-center gap-4 p-3 rounded-xl transition-all ${copiedSymbol === symbol
                  ? 'bg-green-500/20 ring-1 ring-green-500/50'
                  : 'bg-glass-surface hover:bg-glass-surface-hover border border-transparent hover:border-[var(--glass-border)]'
                  }`}
              >
                {!imageErrors.has(symbol) ? (
                  <img
                    src={getImageUrl(symbol, imageFormat)}
                    alt=""
                    aria-hidden="true"
                    width={32}
                    height={32}
                    onError={() => handleImageError(symbol)}
                    className="object-contain"
                    style={{ filter: iconFilter }}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-8 h-8 flex items-center justify-center bg-glass-surface rounded">
                    <span className="text-tertiary text-[10px]">?</span>
                  </div>
                )}
                <span className="text-sm text-secondary font-mono">{symbol}</span>
                {copiedSymbol === symbol && (
                  <span className="ml-auto text-green-500 text-xs font-medium">Copied!</span>
                )}
              </button>
            ))}
          </div>
        )}

        {filteredSymbols.length === 0 && (
          <div className="py-20 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-glass-surface mb-4">
              <span className="text-2xl opacity-50">?</span>
            </div>
            <h3 className="text-lg font-medium text-primary mb-1">No symbols found</h3>
            <p className="text-secondary">Try searching for something else or change the category.</p>
          </div>
        )}
      </main>
    </div>
  );
}
