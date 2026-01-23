import React from 'react';
import { ExternalLink, Package } from 'lucide-react';
import type { AIResource } from '@/stores/resourceStore';

interface ArtifactEditorProps {
  resource: AIResource;
  onSave: (updates: Partial<AIResource>) => Promise<void>;
}

export const ArtifactEditor: React.FC<ArtifactEditorProps> = ({ resource }) => {
  const meta = resource.typeMetadata as any;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Artifact Reference Info */}
      <div className="flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-white/[0.02]">
        <div className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
          <Package size={18} className="text-pink-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white/80 truncate">{resource.name}</h3>
          <p className="text-[10px] text-white/35">
            {meta?.category || 'custom'} artifact &middot; v{resource.version}
          </p>
        </div>
        {meta?.artifactId && (
          <a
            href={`#artifact-${meta.artifactId}`}
            className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-white/50 hover:text-white/80 transition-all"
          >
            <ExternalLink size={9} />
            View
          </a>
        )}
      </div>

      {/* Metadata */}
      <div className="space-y-2">
        {meta?.taskId && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/40">Task ID</span>
            <span className="text-white/60 font-mono text-[10px]">{meta.taskId}</span>
          </div>
        )}
        {meta?.contextId && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/40">Context ID</span>
            <span className="text-white/60 font-mono text-[10px]">{meta.contextId}</span>
          </div>
        )}
        {meta?.extensions?.length > 0 && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/40">Extensions</span>
            <div className="flex gap-1">
              {meta.extensions.map((ext: string) => (
                <span key={ext} className="px-1.5 py-0.5 rounded bg-pink-500/10 text-[9px] text-pink-400/60">
                  {ext}
                </span>
              ))}
            </div>
          </div>
        )}
        {meta?.isStreaming !== undefined && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/40">Status</span>
            <span className={`text-[10px] ${meta.isComplete ? 'text-green-400' : meta.isStreaming ? 'text-amber-400' : 'text-white/50'}`}>
              {meta.isComplete ? 'Complete' : meta.isStreaming ? 'Streaming...' : 'Pending'}
            </span>
          </div>
        )}
      </div>

      {/* Content Preview */}
      {resource.content && (
        <div>
          <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
            Content Preview
          </label>
          <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 text-xs text-white/50 max-h-[200px] overflow-y-auto whitespace-pre-wrap">
            {resource.content.slice(0, 500)}
            {resource.content.length > 500 && '...'}
          </div>
        </div>
      )}

      <p className="text-[10px] text-white/20 text-center">
        Artifacts are managed via the Artifact system. This is a read-only reference.
      </p>
    </div>
  );
};
