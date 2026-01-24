/**
 * Progress Panel
 *
 * Displays real-time build progress with phase stepper and story completion.
 */

import { useEffect, useRef } from 'react';
import { Check, Circle, Loader2, AlertTriangle } from 'lucide-react';
import { useBuilderStore, type BuildRecord } from '../store';

const PHASES = [
  'staging', 'deep-research', 'thinking', 'researching',
  'planning', 'scaffolding', 'implementing', 'components',
  'storybook', 'verifying', 'documenting', 'complete',
];

interface ProgressPanelProps {
  build: BuildRecord;
}

export function ProgressPanel({ build }: ProgressPanelProps) {
  const { pollStatus } = useBuilderStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (build.phase !== 'complete' && build.phase !== 'failed') {
      intervalRef.current = setInterval(() => {
        pollStatus(build.id);
      }, 3000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [build.id, build.phase, pollStatus]);

  const currentPhaseIndex = PHASES.indexOf(build.phase);

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-primary">
        Building: {build.appId}
      </h3>

      {/* Phase Stepper */}
      <div className="flex flex-col gap-1">
        {PHASES.map((phase, idx) => {
          const isComplete = idx < currentPhaseIndex;
          const isCurrent = idx === currentPhaseIndex;
          const isFailed = build.phase === 'failed' && isCurrent;

          return (
            <div key={phase} className="flex items-center gap-2 py-1">
              {isFailed ? (
                <AlertTriangle size={14} className="text-red-400" />
              ) : isComplete ? (
                <Check size={14} className="text-emerald-400" />
              ) : isCurrent ? (
                <Loader2 size={14} className="text-accent animate-spin" />
              ) : (
                <Circle size={14} className="text-secondary/30" />
              )}
              <span className={`text-xs ${
                isCurrent ? 'text-accent font-medium' :
                isComplete ? 'text-primary' :
                'text-secondary/50'
              }`}>
                {phase.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      {build.progress.total > 0 && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-secondary mb-1">
            <span>Stories: {build.progress.completed}/{build.progress.total}</span>
            <span>{Math.round((build.progress.completed / build.progress.total) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent/80 rounded-full transition-all duration-500"
              style={{ width: `${(build.progress.completed / build.progress.total) * 100}%` }}
            />
          </div>
          {build.progress.currentStory && (
            <div className="text-xs text-secondary mt-1">
              Current: {build.progress.currentStory}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {build.error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-red-400 text-xs">
            <AlertTriangle size={14} />
            <span>{build.error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
