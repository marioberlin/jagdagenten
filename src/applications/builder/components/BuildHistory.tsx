/**
 * Build History
 *
 * Table view of past builds with status and timestamps.
 */

import { Check, X, Clock, Loader2, Pencil } from 'lucide-react';
import { useBuilderStore } from '../store';

export function BuildHistory() {
  const { builds, editApp } = useBuilderStore();

  if (builds.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-secondary text-sm">
        No build history yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-primary mb-2">Build History</h3>
      <div className="flex flex-col gap-1">
        {builds.map(build => (
          <div
            key={build.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 group"
          >
            <PhaseIcon phase={build.phase} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-primary truncate">{build.appId}</div>
              <div className="text-xs text-secondary truncate">{build.description}</div>
            </div>
            <div className="text-xs text-secondary whitespace-nowrap">
              {new Date(build.createdAt).toLocaleDateString()}
            </div>
            <div className={`text-xs px-2 py-0.5 rounded-full ${
              build.phase === 'complete' ? 'bg-emerald-500/20 text-emerald-400' :
              build.phase === 'failed' ? 'bg-red-500/20 text-red-400' :
              'bg-accent/20 text-accent'
            }`}>
              {build.phase}
            </div>
            {build.phase === 'complete' && (
              <button
                onClick={() => editApp(build.appId)}
                className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2 py-1 rounded-md text-xs text-accent hover:bg-accent/10"
                title="Edit this app"
              >
                <Pencil size={12} />
                Edit
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PhaseIcon({ phase }: { phase: string }) {
  switch (phase) {
    case 'complete':
      return <Check size={16} className="text-emerald-400" />;
    case 'failed':
      return <X size={16} className="text-red-400" />;
    case 'staging':
      return <Clock size={16} className="text-secondary" />;
    default:
      return <Loader2 size={16} className="text-accent animate-spin" />;
  }
}
