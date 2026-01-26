---
name: Pomodoro Timer
icon: Timer
category: productivity
tags: [focus, timer, work]
window: floating
size: [320, 420]
dock: true
---

# Pomodoro Timer

A minimalist focus timer using the Pomodoro Technique. Work for 25 minutes, then take a 5-minute break. Track your daily sessions and stay productive.

## UI

```tsx App
import { Play, Pause, RotateCcw, Coffee } from 'lucide-react'

export default function App() {
  const [seconds, setSeconds] = useStorage('seconds', 25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessions, setSessions] = useStorage('sessions', 0)
  const [isBreak, setIsBreak] = useState(false)
  const { notify } = useNotification()

  const WORK_TIME = 25 * 60
  const BREAK_TIME = 5 * 60

  useEffect(() => {
    if (!isRunning) return

    const id = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          setIsRunning(false)

          if (isBreak) {
            notify('Break over! Ready for another session?')
            setIsBreak(false)
            return WORK_TIME
          } else {
            setSessions(n => n + 1)
            notify('Great work! Take a 5-minute break.')
            setIsBreak(true)
            return BREAK_TIME
          }
        }
        return s - 1
      })
    }, 1000)

    return () => clearInterval(id)
  }, [isRunning, isBreak])

  const progress = isBreak
    ? (BREAK_TIME - seconds) / BREAK_TIME
    : (WORK_TIME - seconds) / WORK_TIME

  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60

  const reset = () => {
    setIsRunning(false)
    setIsBreak(false)
    setSeconds(WORK_TIME)
  }

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 p-6 bg-gradient-to-b from-transparent to-white/5">
      {/* Status */}
      <div className={cn(
        "px-4 py-1.5 rounded-full text-sm font-medium",
        isBreak ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"
      )}>
        {isBreak ? (
          <span className="flex items-center gap-2">
            <Coffee size={14} /> Break Time
          </span>
        ) : (
          <span>Focus Session</span>
        )}
      </div>

      {/* Timer Display */}
      <div className="relative">
        {/* Progress Ring */}
        <svg className="w-48 h-48 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-white/10"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={283}
            strokeDashoffset={283 * (1 - progress)}
            strokeLinecap="round"
            className={cn(
              "transition-all duration-1000",
              isBreak ? "text-green-400" : "text-blue-400"
            )}
          />
        </svg>

        {/* Time */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl font-mono font-light text-white tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center transition-all",
            isRunning
              ? "bg-white/10 hover:bg-white/20"
              : "bg-blue-500 hover:bg-blue-600"
          )}
        >
          {isRunning ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
        </button>
        <button
          onClick={reset}
          className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {/* Session Count */}
      <div className="text-center">
        <div className="text-3xl font-bold text-white">{sessions}</div>
        <div className="text-sm text-white/50">sessions today</div>
      </div>
    </div>
  )
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
