---
name: Simple Counter
icon: Hash
category: utilities
tags: [counter, simple, demo]
window: floating
size: [280, 200]
---

# Simple Counter

A minimal counter app to demonstrate Quick Apps. Click to increment, persists across sessions.

## UI

```tsx App
import { Plus, Minus, RotateCcw } from 'lucide-react'

export default function App() {
  const [count, setCount] = useStorage('count', 0)

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 p-6">
      {/* Count Display */}
      <div className="text-7xl font-bold text-white tabular-nums">
        {count}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => setCount(c => c - 1)}
          className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all active:scale-95"
        >
          <Minus size={20} />
        </button>
        <button
          onClick={() => setCount(0)}
          className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all active:scale-95"
        >
          <RotateCcw size={18} />
        </button>
        <button
          onClick={() => setCount(c => c + 1)}
          className="w-12 h-12 rounded-xl bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-all active:scale-95"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  )
}
```
