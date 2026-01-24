/**
 * Research Panel
 *
 * Displays deep research progress and findings during the research phase.
 */

import { Search, Check, Loader2, BookOpen } from 'lucide-react';

interface ResearchFinding {
  category: string;
  summary: string;
  source?: string;
}

interface ResearchPanelProps {
  findings: ResearchFinding[];
  progress: { completed: number; total: number };
  isActive: boolean;
}

export function ResearchPanel({ findings, progress, isActive }: ResearchPanelProps) {
  const percentage = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {isActive ? (
          <Loader2 size={16} className="text-accent animate-spin" />
        ) : (
          <Search size={16} className="text-accent" />
        )}
        <h3 className="text-sm font-semibold text-primary">Deep Research</h3>
      </div>

      {/* Progress */}
      {progress.total > 0 && (
        <div>
          <div className="flex justify-between text-xs text-secondary mb-1">
            <span>Queries: {progress.completed}/{progress.total}</span>
            <span>{percentage}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent/80 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Findings */}
      {findings.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-2">
          <div className="text-xs text-secondary font-medium">Key Findings</div>
          {findings.map((finding, idx) => (
            <div key={idx} className="flex items-start gap-2 p-2 bg-white/5 rounded-lg">
              <BookOpen size={12} className="text-accent mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-primary">{finding.summary}</div>
                <div className="text-xs text-secondary/60 mt-0.5">
                  {finding.category}
                  {finding.source && ` | ${finding.source}`}
                </div>
              </div>
              <Check size={12} className="text-emerald-400 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {findings.length === 0 && !isActive && (
        <div className="text-xs text-secondary py-2">
          No research findings yet. Enable Deep Research in the build form.
        </div>
      )}
    </div>
  );
}
