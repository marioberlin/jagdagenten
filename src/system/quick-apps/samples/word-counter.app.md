---
name: Word Counter
icon: FileText
category: utilities
tags: [text, counter, writing]
window: floating
size: [400, 300]
---

# Word Counter

A simple utility to count words, characters, and sentences in your text.

## UI

```tsx App
import { Type, Hash, AlignLeft } from 'lucide-react';

export default function App() {
  const [text, setText] = useState('');

  const stats = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) {
      return { words: 0, chars: 0, charsNoSpaces: 0, sentences: 0, paragraphs: 0 };
    }

    const words = trimmed.split(/\s+/).filter(Boolean).length;
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    const sentences = (trimmed.match(/[.!?]+/g) || []).length || (trimmed.length > 0 ? 1 : 0);
    const paragraphs = trimmed.split(/\n\n+/).filter(Boolean).length;

    return { words, chars, charsNoSpaces, sentences, paragraphs };
  }, [text]);

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Type} label="Words" value={stats.words} />
        <StatCard icon={Hash} label="Characters" value={stats.chars} />
        <StatCard icon={AlignLeft} label="Sentences" value={stats.sentences} />
      </div>

      {/* Text Input */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste or type your text here..."
        className="flex-1 w-full p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white placeholder:text-white/30 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      />

      {/* Extra Stats */}
      <div className="flex justify-between text-xs text-white/40">
        <span>Characters (no spaces): {stats.charsNoSpaces}</span>
        <span>Paragraphs: {stats.paragraphs}</span>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-3 text-center">
      <Icon size={16} className="mx-auto text-blue-400 mb-1" />
      <div className="text-2xl font-bold text-white">{value.toLocaleString()}</div>
      <div className="text-xs text-white/50">{label}</div>
    </div>
  );
}
```
