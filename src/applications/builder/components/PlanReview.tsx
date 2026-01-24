/**
 * Plan Review
 *
 * Displays the generated build plan for user approval.
 */

import { FileCode, Bot, Database, Layers, Check } from 'lucide-react';
import { useBuilderStore } from '../store';

interface PlanReviewProps {
  buildId: string;
}

export function PlanReview({ buildId }: PlanReviewProps) {
  const { builds, approveBuild, cancelBuild } = useBuilderStore();
  const build = builds.find(b => b.id === buildId);

  if (!build) {
    return (
      <div className="text-sm text-secondary">Build not found.</div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-primary">Build Plan</h3>

      {/* App Info */}
      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
        <div className="text-xs text-secondary mb-1">App ID</div>
        <div className="text-sm text-primary font-mono">{build.appId}</div>
        <div className="text-xs text-secondary mt-2 mb-1">Description</div>
        <div className="text-sm text-primary">{build.description}</div>
      </div>

      {/* Features */}
      <div className="flex flex-col gap-1">
        <div className="text-xs text-secondary mb-1">Features</div>
        <FeatureRow icon={<FileCode size={14} />} label="App scaffold" enabled />
        <FeatureRow icon={<Bot size={14} />} label="AI Agent (A2A Executor)" enabled={build.phase !== 'staging'} />
        <FeatureRow icon={<Database size={14} />} label="LiquidMind Resources" enabled={build.phase !== 'staging'} />
        <FeatureRow icon={<Layers size={14} />} label="Custom Components" enabled={build.phase !== 'staging'} />
      </div>

      {/* Phase */}
      <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
        <div className="text-xs text-accent font-medium">Current Phase: {build.phase}</div>
        <div className="text-xs text-secondary mt-1">
          {build.phase === 'staging'
            ? 'Ready to start building. Approve to begin.'
            : `Build is in phase: ${build.phase}`}
        </div>
      </div>

      {/* Actions */}
      {build.phase === 'staging' && (
        <div className="flex gap-2">
          <button
            onClick={() => approveBuild(buildId)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent/20 hover:bg-accent/30 text-accent font-medium text-sm rounded-lg border border-accent/30 transition-colors"
          >
            <Check size={16} />
            Approve & Build
          </button>
          <button
            onClick={() => cancelBuild(buildId)}
            className="px-4 py-2 text-secondary hover:text-primary text-sm rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function FeatureRow({ icon, label, enabled }: { icon: React.ReactNode; label: string; enabled: boolean }) {
  return (
    <div className={`flex items-center gap-2 py-1 ${enabled ? 'text-primary' : 'text-secondary/40'}`}>
      <div className={enabled ? 'text-accent' : 'text-secondary/30'}>{icon}</div>
      <span className="text-xs">{label}</span>
    </div>
  );
}
