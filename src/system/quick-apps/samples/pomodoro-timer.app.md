---
name: Pomodoro Timer
icon: Timer
category: productivity
tags: [focus, timer, productivity]
window: floating
size: [320, 400]
dock: true
---

# Pomodoro Timer

A minimalist focus timer using the Pomodoro Technique. Work for 25 minutes, then take a 5-minute break.

## UI

```tsx App
import { Play, Pause, RotateCcw } from 'lucide-react';

export default function App() {
  const [seconds, setSeconds] = useStorage('seconds', 25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useStorage('sessions', 0);
  const { notify } = useNotification();

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSeconds((s: number) => {
        if (s <= 1) {
          setIsRunning(false);
          setSessions((n: number) => n + 1);
          notify('Pomodoro complete! Time for a break.');
          return 25 * 60;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const progress = (seconds / (25 * 60)) * 100;

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 p-6 bg-gradient-to-b from-transparent to-black/20">
      {/* Progress Ring */}
      <div className="relative w-48 h-48">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="88"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
          />
          <circle
            cx="96"
            cy="96"
            r="88"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 88}
            strokeDashoffset={2 * Math.PI * 88 * (1 - progress / 100)}
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl font-mono font-bold text-white tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          {isRunning ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
        </button>
        <button
          onClick={() => {
            setSeconds(25 * 60);
            setIsRunning(false);
          }}
          className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {/* Session Counter */}
      <p className="text-sm text-white/50">
        Sessions today: <span className="text-white font-medium">{sessions}</span>
      </p>
    </div>
  );
}
```

## Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Toggle timer |
| `R` | Reset timer |

## Commands

| Command | Description |
|---------|-------------|
| Start Pomodoro | Begin a 25-minute focus session |
| Reset Timer | Reset the current timer |
