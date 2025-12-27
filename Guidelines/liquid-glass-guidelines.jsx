import React, { useState, useMemo } from 'react';
import { Search, Book, ChevronRight, ExternalLink, X, Sun, Moon, Sparkles } from 'lucide-react';

const guidelinesData = {
  "liquid_glass_design_guidelines": [
    {
      "title": "Accessibility",
      "citation": "https://developer.apple.com/design/human-interface-guidelines/accessibility",
      "summary": "Ensuring glass effects remain usable for everyone, including people with visual impairments.",
      "keyPoints": [
        "Ensure sufficient contrast ratio (4.5:1 minimum) between text and glass backgrounds",
        "Test glass effects with reduced transparency settings enabled",
        "Don't rely solely on color or transparency to convey information",
        "Provide solid background fallbacks for users who prefer reduced motion/transparency",
        "Use ARIA labels and semantic HTML for interactive glass elements",
        "Test with screen readers to ensure glass UI is navigable",
        "Consider users with vestibular disorders—limit parallax and blur animations"
      ]
    },
    {
      "title": "Color",
      "citation": "https://developer.apple.com/design/human-interface-guidelines/color",
      "summary": "Using color effectively with translucent glass surfaces and vibrancy effects.",
      "keyPoints": [
        "Use colors that maintain readability on translucent backgrounds",
        "Account for background content bleeding through glass layers",
        "Test color combinations against various background images/colors",
        "Don't rely on color alone—use icons, labels, or borders as reinforcement",
        "Consider how vibrancy affects perceived color on glass surfaces",
        "Use semantic color tokens that adapt to light/dark modes"
      ],
      "glassColors": [
        { "name": "Frosted White", "value": "rgba(255, 255, 255, 0.72)" },
        { "name": "Frosted Dark", "value": "rgba(0, 0, 0, 0.45)" },
        { "name": "Tinted Blue", "value": "rgba(59, 130, 246, 0.25)" },
        { "name": "Tinted Purple", "value": "rgba(139, 92, 246, 0.25)" }
      ]
    },
    {
      "title": "Dark Mode",
      "citation": "https://developer.apple.com/design/human-interface-guidelines/dark-mode",
      "summary": "Adapting glass effects for comfortable viewing in dark environments.",
      "keyPoints": [
        "Glass surfaces should use darker tints with higher blur in dark mode",
        "Reduce glass opacity in dark mode to prevent excessive brightness",
        "Use subtle light borders (1px) to define glass edges in dark mode",
        "Test glass legibility against both light and dark background content",
        "Consider using inverted vibrancy for text on dark glass",
        "Ensure glass cards maintain visual hierarchy in both modes"
      ],
      "modeSpecs": {
        "light": { "blur": "16px", "opacity": "0.72", "border": "rgba(255,255,255,0.5)" },
        "dark": { "blur": "20px", "opacity": "0.45", "border": "rgba(255,255,255,0.1)" }
      }
    },
    {
      "title": "Materials",
      "citation": "https://developer.apple.com/design/human-interface-guidelines/materials",
      "summary": "Creating depth and hierarchy with translucent glass materials and blur effects.",
      "keyPoints": [
        "Use backdrop-filter: blur() as the foundation for glass effects",
        "Layer materials: ultra-thin (4px), thin (8px), regular (16px), thick (24px)",
        "Combine blur with background color opacity for depth",
        "Add subtle noise texture (2-5%) for realistic frosted glass appearance",
        "Use box-shadow with spread for soft glass elevation",
        "Glass surfaces should hint at content behind without full reveal",
        "Limit glass layers to 2-3 to maintain performance"
      ],
      "cssExample": "backdrop-filter: blur(16px) saturate(180%);\nbackground: rgba(255, 255, 255, 0.72);\nborder: 1px solid rgba(255, 255, 255, 0.5);\nborder-radius: 16px;\nbox-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);"
    },
    {
      "title": "Motion",
      "citation": "https://developer.apple.com/design/human-interface-guidelines/motion",
      "summary": "Animating glass elements naturally with physics-based transitions.",
      "keyPoints": [
        "Use spring animations for glass panel open/close (tension: 300, friction: 20)",
        "Animate blur radius on hover for interactive glass feedback",
        "Keep glass transitions under 300ms for responsive feel",
        "Respect prefers-reduced-motion: disable blur animations, use opacity only",
        "Subtle parallax on glass layers creates depth (limit to 5-10px movement)",
        "Fade glass opacity during scroll for performance",
        "Avoid animating backdrop-filter on mobile—use opacity transitions instead"
      ],
      "timing": {
        "fast": "150ms",
        "normal": "250ms", 
        "slow": "350ms",
        "easing": "cubic-bezier(0.4, 0, 0.2, 1)"
      }
    },
    {
      "title": "Typography",
      "citation": "https://developer.apple.com/design/human-interface-guidelines/typography",
      "summary": "Ensuring text remains legible on translucent glass surfaces.",
      "keyPoints": [
        "Use medium or semibold font weights on glass—regular weight loses definition",
        "Add subtle text-shadow for improved legibility on variable backgrounds",
        "Minimum 14px font size for body text on glass surfaces",
        "Consider -webkit-backdrop-filter fallback text styles (solid background)",
        "Use SF Pro, Inter, or system-ui for optimal glass rendering",
        "High contrast text colors: pure white or near-black for maximum legibility",
        "Letter-spacing of 0.01-0.02em improves glass text clarity"
      ],
      "textStyles": {
        "heading": { "size": "24px", "weight": "600", "shadow": "0 1px 2px rgba(0,0,0,0.1)" },
        "body": { "size": "16px", "weight": "500", "shadow": "0 1px 1px rgba(0,0,0,0.05)" },
        "caption": { "size": "12px", "weight": "500", "shadow": "none" }
      }
    },
    {
      "title": "Writing",
      "citation": "https://developer.apple.com/design/human-interface-guidelines/writing",
      "summary": "Crafting concise content that works within glass UI constraints.",
      "keyPoints": [
        "Keep text short—glass surfaces have limited contrast tolerance",
        "Use clear, action-oriented labels for glass buttons",
        "Avoid long paragraphs on glass—break into digestible chunks",
        "Error messages need solid backgrounds, not glass, for urgency",
        "Placeholder text should be darker than usual on glass inputs",
        "Tooltips and popovers benefit from glass effects with clear hierarchy"
      ]
    }
  ]
};

const GlassCard = ({ children, className = "", intensity = "regular" }) => {
  const blurMap = { thin: "8px", regular: "16px", thick: "24px" };
  return (
    <div 
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        backdropFilter: `blur(${blurMap[intensity]}) saturate(180%)`,
        WebkitBackdropFilter: `blur(${blurMap[intensity]}) saturate(180%)`,
        background: 'rgba(255, 255, 255, 0.72)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
      }}
    >
      {children}
    </div>
  );
};

const DarkGlassCard = ({ children, className = "" }) => (
  <div 
    className={`relative overflow-hidden rounded-2xl ${className}`}
    style={{
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      background: 'rgba(30, 30, 35, 0.75)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    }}
  >
    {children}
  </div>
);

const GuidelineCard = ({ guideline, isSelected, onClick, darkMode }) => {
  const Card = darkMode ? DarkGlassCard : GlassCard;
  return (
    <button onClick={onClick} className="w-full text-left group">
      <Card className={`p-4 transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500' : 'hover:scale-[1.01]'}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {guideline.title}
          </h3>
          <ChevronRight className={`w-5 h-5 transition-transform ${isSelected ? 'rotate-90 text-blue-500' : darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        </div>
        <p className={`text-sm line-clamp-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {guideline.summary}
        </p>
      </Card>
    </button>
  );
};

const DetailPanel = ({ guideline, onClose, darkMode }) => {
  if (!guideline) return null;
  
  const Card = darkMode ? DarkGlassCard : GlassCard;
  const textColor = darkMode ? 'text-white' : 'text-gray-900';
  const subtextColor = darkMode ? 'text-gray-300' : 'text-gray-600';
  
  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500/90 to-purple-500/90 p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium text-blue-100">Liquid Glass</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">{guideline.title}</h2>
            <p className="text-blue-100">{guideline.summary}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className={`font-semibold ${textColor} mb-4`}>Key Guidelines</h3>
        <ul className="space-y-3">
          {guideline.keyPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <span className={subtextColor}>{point}</span>
            </li>
          ))}
        </ul>
        
        {guideline.glassColors && (
          <div className="mt-6">
            <h3 className={`font-semibold ${textColor} mb-3`}>Glass Color Tokens</h3>
            <div className="grid grid-cols-2 gap-3">
              {guideline.glassColors.map(color => (
                <div key={color.name} className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-600"
                    style={{ background: color.value, backdropFilter: 'blur(8px)' }}
                  />
                  <div>
                    <p className={`text-sm font-medium ${textColor}`}>{color.name}</p>
                    <p className="text-xs text-gray-500 font-mono">{color.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {guideline.cssExample && (
          <div className="mt-6">
            <h3 className={`font-semibold ${textColor} mb-3`}>CSS Reference</h3>
            <pre className={`text-sm p-4 rounded-xl overflow-x-auto ${darkMode ? 'bg-black/30' : 'bg-gray-100'}`}>
              <code className={darkMode ? 'text-green-300' : 'text-gray-800'}>
                {guideline.cssExample}
              </code>
            </pre>
          </div>
        )}
        
        {guideline.timing && (
          <div className="mt-6">
            <h3 className={`font-semibold ${textColor} mb-3`}>Animation Timing</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(guideline.timing).map(([key, value]) => (
                <div key={key} className={`p-3 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{key}</p>
                  <p className={`font-mono text-sm ${textColor}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {guideline.textStyles && (
          <div className="mt-6">
            <h3 className={`font-semibold ${textColor} mb-3`}>Text Style Specs</h3>
            <div className="space-y-2">
              {Object.entries(guideline.textStyles).map(([name, styles]) => (
                <div key={name} className={`flex justify-between items-center p-3 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <span className={`capitalize font-medium ${textColor}`}>{name}</span>
                  <span className="text-xs text-gray-500 font-mono">
                    {styles.size} / {styles.weight}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <a 
          href={guideline.citation} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
            darkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <ExternalLink className="w-4 h-4" />
          Apple HIG Reference
        </a>
      </div>
    </Card>
  );
};

export default function LiquidGlassGuidelines() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuideline, setSelectedGuideline] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  
  const guidelines = guidelinesData.liquid_glass_design_guidelines;
  
  const filteredGuidelines = useMemo(() => {
    return guidelines.filter(g => {
      return searchQuery === '' || 
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.keyPoints.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
    });
  }, [searchQuery, guidelines]);

  const bgGradient = darkMode 
    ? 'bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900'
    : 'bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100';

  return (
    <div className={`min-h-screen transition-colors ${bgGradient}`}>
      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${darkMode ? 'bg-purple-900/30' : 'bg-purple-300/40'}`} />
        <div className={`absolute top-1/2 -left-40 w-80 h-80 rounded-full blur-3xl ${darkMode ? 'bg-blue-900/30' : 'bg-blue-300/40'}`} />
        <div className={`absolute -bottom-40 right-1/3 w-72 h-72 rounded-full blur-3xl ${darkMode ? 'bg-pink-900/20' : 'bg-pink-300/30'}`} />
      </div>
      
      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 px-4 py-4">
          {darkMode ? (
            <DarkGlassCard className="px-4 py-3">
              <HeaderContent darkMode={darkMode} setDarkMode={setDarkMode} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            </DarkGlassCard>
          ) : (
            <GlassCard className="px-4 py-3">
              <HeaderContent darkMode={darkMode} setDarkMode={setDarkMode} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            </GlassCard>
          )}
        </header>
        
        {/* Main Content */}
        <main className="p-4">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Guidelines List */}
            <div className={`lg:w-1/2 space-y-3 ${selectedGuideline ? 'hidden lg:block' : ''}`}>
              <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {filteredGuidelines.length} guidelines for web glass UI
              </p>
              {filteredGuidelines.map((g, i) => (
                <GuidelineCard
                  key={i}
                  guideline={g}
                  isSelected={selectedGuideline?.title === g.title}
                  onClick={() => setSelectedGuideline(g)}
                  darkMode={darkMode}
                />
              ))}
              {filteredGuidelines.length === 0 && (
                <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No guidelines match your search.</p>
                </div>
              )}
            </div>
            
            {/* Detail Panel */}
            <div className={`lg:w-1/2 lg:sticky lg:top-24 lg:self-start ${!selectedGuideline ? 'hidden lg:block' : ''}`}>
              {selectedGuideline ? (
                <DetailPanel 
                  guideline={selectedGuideline} 
                  onClose={() => setSelectedGuideline(null)}
                  darkMode={darkMode}
                />
              ) : (
                darkMode ? (
                  <DarkGlassCard className="hidden lg:flex flex-col items-center justify-center h-80 text-gray-400">
                    <Sparkles className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium">Select a guideline</p>
                    <p className="text-sm">Click any topic to explore</p>
                  </DarkGlassCard>
                ) : (
                  <GlassCard className="hidden lg:flex flex-col items-center justify-center h-80 text-gray-500">
                    <Sparkles className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium">Select a guideline</p>
                    <p className="text-sm">Click any topic to explore</p>
                  </GlassCard>
                )
              )}
            </div>
          </div>
        </main>
        
        {/* Footer */}
        <footer className={`p-4 text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          Liquid Glass Design System • Based on Apple HIG
        </footer>
      </div>
    </div>
  );
}

function HeaderContent({ darkMode, setDarkMode, searchQuery, setSearchQuery }) {
  const textColor = darkMode ? 'text-white' : 'text-gray-900';
  const subtextColor = darkMode ? 'text-gray-400' : 'text-gray-500';
  
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="hidden sm:block">
          <h1 className={`font-bold ${textColor}`}>Liquid Glass</h1>
          <p className={`text-xs ${subtextColor}`}>Web Design System</p>
        </div>
      </div>
      
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search guidelines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
              darkMode 
                ? 'bg-white/10 text-white placeholder-gray-400' 
                : 'bg-black/5 text-gray-900 placeholder-gray-500'
            }`}
          />
        </div>
      </div>
      
      <button
        onClick={() => setDarkMode(!darkMode)}
        className={`p-2 rounded-lg transition-colors ${
          darkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'
        }`}
      >
        {darkMode ? <Sun className="w-5 h-5 text-gray-300" /> : <Moon className="w-5 h-5 text-gray-600" />}
      </button>
    </div>
  );
}
