/**
 * AppDetail
 *
 * Displays the current state of a previously built app:
 * file tree, executor skills, LiquidMind resources.
 */

import { FolderTree, Cpu, Database, FileCode, Layout } from 'lucide-react';

interface AppFile {
  path: string;
  type: 'component' | 'store' | 'executor' | 'manifest' | 'other';
}

interface AppSkill {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface AppResource {
  name: string;
  type: string;
}

interface AppDetailProps {
  appId: string;
  files: AppFile[];
  skills: AppSkill[];
  resources: AppResource[];
  lastBuilt?: string;
}

function getFileTypeIcon(type: AppFile['type']) {
  switch (type) {
    case 'component': return <Layout size={12} className="text-accent" />;
    case 'store': return <Database size={12} className="text-violet-400" />;
    case 'executor': return <Cpu size={12} className="text-emerald-400" />;
    case 'manifest': return <FileCode size={12} className="text-cyan-400" />;
    default: return <FileCode size={12} className="text-secondary" />;
  }
}

export function AppDetail({ appId, files, skills, resources, lastBuilt }: AppDetailProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FolderTree size={16} className="text-accent" />
        <span className="text-sm font-semibold text-primary">{appId}</span>
        {lastBuilt && (
          <span className="text-xs text-secondary ml-auto">
            Built: {new Date(lastBuilt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* File Tree */}
      <div className="space-y-1">
        <div className="text-xs font-medium text-secondary uppercase tracking-wide mb-2">
          Files ({files.length})
        </div>
        <div className="max-h-48 overflow-y-auto space-y-0.5">
          {files.map(file => (
            <div key={file.path} className="flex items-center gap-2 px-2 py-1 rounded text-xs">
              {getFileTypeIcon(file.type)}
              <span className="text-primary/80 truncate font-mono">{file.path}</span>
            </div>
          ))}
          {files.length === 0 && (
            <div className="text-xs text-secondary/60 px-2">No files found</div>
          )}
        </div>
      </div>

      {/* Executor Skills */}
      {skills.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-secondary uppercase tracking-wide mb-2">
            Executor Skills ({skills.length})
          </div>
          {skills.map(skill => (
            <div key={skill.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
              <Cpu size={12} className="text-emerald-400" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-primary">{skill.name}</div>
                <div className="text-xs text-secondary/80 truncate">{skill.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LiquidMind Resources */}
      {resources.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-secondary uppercase tracking-wide mb-2">
            Resources ({resources.length})
          </div>
          {resources.map(resource => (
            <div key={resource.name} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
              <Database size={12} className="text-violet-400" />
              <span className="text-xs text-primary">{resource.name}</span>
              <span className="text-xs text-secondary/60 ml-auto">{resource.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
