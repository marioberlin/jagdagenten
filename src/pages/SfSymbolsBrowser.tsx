
import { useState, useMemo } from 'react';
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

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg font-bold">
                SF
              </div>
              <div>
                <h1 className="text-xl font-semibold">SF Symbols Browser</h1>
                <p className="text-xs text-white/50">{uniqueSymbols.length.toLocaleString()} symbols • from andrewtavis/sf-symbols-online</p>
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
            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10 h-[42px] items-center">
              <button
                onClick={() => setImageFormat('svg')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${imageFormat === 'svg' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white/80'
                  }`}
              >
                SVG
              </button>
              <button
                onClick={() => setImageFormat('png')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${imageFormat === 'png' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white/80'
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
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
              />
            </div>

            {/* Size Control */}
            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
              <span className="text-xs text-white/50">Size</span>
              <input
                type="range"
                min="24"
                max="80"
                value={iconSize}
                onChange={(e) => setIconSize(Number(e.target.value))}
                className="w-20 accent-blue-500"
              />
              <span className="text-xs text-white/70 w-6">{iconSize}</span>
            </div>

            {/* View Mode */}
            <div className="flex bg-white/5 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/70'}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/70'}`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Results Count */}
      <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-white/50">
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
                  : 'bg-white/5 hover:bg-white/10'
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
                    style={{ filter: 'invert(1)', width: iconSize, height: iconSize }}
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="flex items-center justify-center bg-white/10 rounded"
                    style={{ width: iconSize, height: iconSize }}
                  >
                    <span className="text-white/30 text-xs">?</span>
                  </div>
                )}
                <span className="mt-2 text-[9px] text-white/40 group-hover:text-white/70 transition-colors text-center leading-tight truncate w-full">
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
                  : 'bg-white/5 hover:bg-white/10'
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
                    style={{ filter: 'invert(1)' }}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded">
                    <span className="text-white/30 text-[10px]">?</span>
                  </div>
                )}
                <span className="text-sm text-white/70 font-mono">{symbol}</span>
                {copiedSymbol === symbol && (
                  <span className="ml-auto text-green-500 text-xs font-medium">Copied!</span>
                )}
              </button>
            ))}
          </div>
        )}

        {filteredSymbols.length === 0 && (
          <div className="py-20 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
              <span className="text-2xl opacity-50">?</span>
            </div>
            <h3 className="text-lg font-medium text-white mb-1">No symbols found</h3>
            <p className="text-white/50">Try searching for something else or change the category.</p>
          </div>
        )}
      </main>
    </div>
  );
}
