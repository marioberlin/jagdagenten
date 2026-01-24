/**
 * Progress Panel
 *
 * Displays real-time build progress with phase stepper and story completion.
 */

import { useEffect, useRef, useState } from 'react';
import { Check, Circle, Loader2, AlertTriangle, Download, PlayCircle, FileCode, Bot, Database, Layers, ListChecks, X, Plus, Pencil, Trash2, Wrench } from 'lucide-react';
import { useBuilderStore, type BuildRecord } from '../store';

const PHASES = [
  'staging', 'deep-research', 'thinking', 'researching',
  'planning', 'awaiting-review', 'scaffolding', 'implementing',
  'components', 'storybook', 'verifying', 'documenting', 'complete',
];

interface ProgressPanelProps {
  build: BuildRecord;
}

export function ProgressPanel({ build }: ProgressPanelProps) {
  const { pollStatus, installBuild, cancelBuild } = useBuilderStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (build.phase !== 'complete' && build.phase !== 'failed' && build.phase !== 'awaiting-review') {
      intervalRef.current = setInterval(() => {
        pollStatus(build.id);
      }, 3000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [build.id, build.phase, pollStatus]);

  const currentPhaseIndex = PHASES.indexOf(build.phase);
  const buildIsComplete = build.phase === 'complete';

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-primary">
        {buildIsComplete ? 'Built' : 'Building'}: {build.appId}
      </h3>

      {/* Phase Stepper */}
      <div className="flex flex-col gap-1">
        {PHASES.map((phase, idx) => {
          const isComplete = idx < currentPhaseIndex || buildIsComplete;
          const isCurrent = idx === currentPhaseIndex && !buildIsComplete;
          const isFailed = build.phase === 'failed' && idx === currentPhaseIndex;

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

      {/* Plan Review — shown when awaiting review */}
      {build.phase === 'awaiting-review' && (
        <PlanReviewSection build={build} onCancel={() => cancelBuild(build.id)} />
      )}

      {/* Install button — shown when build is complete */}
      {build.phase === 'complete' && (
        <button
          onClick={() => installBuild(build.id)}
          className="mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-accent/20 hover:bg-accent/30 border border-accent/40 rounded-xl text-accent text-sm font-medium transition-colors"
        >
          <Download size={16} />
          Install App
        </button>
      )}
    </div>
  );
}

interface EditableStory {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
}

type StoryTab = 'features' | 'implementation';

function PlanReviewSection({ build, onCancel }: { build: BuildRecord; onCancel: () => void }) {
  const { approveBuild } = useBuilderStore();
  const plan = build.plan;
  const [storyTab, setStoryTab] = useState<StoryTab>('features');
  const [featureStories, setFeatureStories] = useState<EditableStory[]>(
    plan?.prd.userStories
      .filter(s => !s.title.startsWith('[internal]'))
      .map(s => ({ id: s.id, title: s.title, description: s.description, acceptanceCriteria: [...s.acceptanceCriteria] })) || []
  );
  const [implStories, setImplStories] = useState<EditableStory[]>(
    plan?.prd.userStories
      .filter(s => s.title.startsWith('[internal]'))
      .map(s => ({ id: s.id, title: s.title.replace('[internal] ', ''), description: s.description.replace('[internal] ', ''), acceptanceCriteria: [...s.acceptanceCriteria] })) || []
  );
  const [editingId, setEditingId] = useState<string | null>(null);

  const activeStories = storyTab === 'features' ? featureStories : implStories;
  const setActiveStories = storyTab === 'features' ? setFeatureStories : setImplStories;

  const updateStory = (id: string, field: keyof EditableStory, value: string | string[]) => {
    setActiveStories(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeStory = (id: string) => {
    setActiveStories(prev => prev.filter(s => s.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const addStory = () => {
    const allStories = [...featureStories, ...implStories];
    const newId = `US-${String(allStories.length + 1).padStart(3, '0')}`;
    const newStory: EditableStory = storyTab === 'features'
      ? { id: newId, title: 'New feature', description: 'Describe what the user can do...', acceptanceCriteria: ['User can...'] }
      : { id: newId, title: 'New implementation step', description: 'Describe what to build...', acceptanceCriteria: ['File exists', 'Typecheck passes'] };
    setActiveStories(prev => [...prev, newStory]);
    setEditingId(newId);
  };

  const handleApprove = () => {
    // Re-tag implementation stories with [internal] prefix for the backend
    const taggedImpl = implStories.map(s => ({
      ...s,
      title: `[internal] ${s.title}`,
      description: `[internal] ${s.description}`,
    }));
    approveBuild(build.id, [...featureStories, ...taggedImpl]);
  };

  return (
    <div className="mt-4 flex flex-col gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
      <div className="text-xs text-accent font-medium uppercase tracking-wider">Review Plan</div>

      {/* Description */}
      <div className="text-sm text-primary">{build.description}</div>

      {!plan ? (
        <div className="text-xs text-secondary">No plan details available.</div>
      ) : (
        <>
          {/* Architecture: Components */}
          {plan.architecture.components.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs text-secondary mb-1.5">
                <FileCode size={12} />
                Components
              </div>
              <div className="flex flex-wrap gap-1.5">
                {plan.architecture.components.map(c => (
                  <span key={c.name} className="px-2 py-0.5 text-xs rounded-md bg-white/5 border border-white/10 text-primary">
                    {c.name} <span className="text-secondary/60">({c.type})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Architecture: Stores */}
          {plan.architecture.stores && plan.architecture.stores.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs text-secondary mb-1.5">
                <Database size={12} />
                Stores
              </div>
              <div className="flex flex-col gap-1">
                {plan.architecture.stores.map(s => (
                  <div key={s.name} className="text-xs text-primary">
                    <span className="font-mono text-accent/80">{s.name}</span>
                    <span className="text-secondary ml-1.5">({s.fields.join(', ')})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Architecture: Agent */}
          {plan.architecture.executor && (
            <div>
              <div className="flex items-center gap-1.5 text-xs text-secondary mb-1.5">
                <Bot size={12} />
                AI Agent Skills
              </div>
              <div className="flex flex-col gap-1">
                {plan.architecture.executor.skills.map(s => (
                  <div key={s.id} className="text-xs text-primary">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-secondary ml-1.5">{s.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Architecture: New Components */}
          {plan.architecture.newComponents && plan.architecture.newComponents.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs text-secondary mb-1.5">
                <Layers size={12} />
                New Components
              </div>
              <div className="flex flex-col gap-1">
                {plan.architecture.newComponents.map(c => (
                  <div key={c.name} className="text-xs text-primary">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-secondary ml-1.5">({c.category}) {c.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Story Tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-white/5 rounded-lg border border-white/10">
            <button
              onClick={() => { setStoryTab('features'); setEditingId(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                storyTab === 'features'
                  ? 'bg-accent/20 text-accent border border-accent/30'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <ListChecks size={12} />
              Features ({featureStories.length})
            </button>
            <button
              onClick={() => { setStoryTab('implementation'); setEditingId(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                storyTab === 'implementation'
                  ? 'bg-white/10 text-primary border border-white/20'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <Wrench size={12} />
              Implementation ({implStories.length})
            </button>
          </div>

          {/* Story List */}
          <div>
            <div className="flex items-center justify-end mb-1.5">
              <button
                onClick={addStory}
                className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
              >
                <Plus size={12} />
                Add {storyTab === 'features' ? 'Feature' : 'Step'}
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {activeStories.map(story => (
                <div key={story.id} className="p-2 rounded-lg bg-white/3 border border-white/5 group relative">
                  {editingId === story.id ? (
                    <StoryEditor
                      story={story}
                      onUpdate={(field, value) => updateStory(story.id, field, value)}
                      onDone={() => setEditingId(null)}
                    />
                  ) : (
                    <>
                      <div className="text-xs text-primary font-medium">{story.id}: {story.title}</div>
                      <div className="text-xs text-secondary mt-0.5">{story.description}</div>
                      {story.acceptanceCriteria.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {story.acceptanceCriteria.map((ac, i) => (
                            <li key={i} className="text-xs text-secondary/70 flex items-start gap-1.5">
                              <Check size={10} className="mt-0.5 text-emerald-400/50 shrink-0" />
                              {ac}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                        <button onClick={() => setEditingId(story.id)} className="p-1 rounded hover:bg-white/10 text-secondary hover:text-accent transition-colors">
                          <Pencil size={10} />
                        </button>
                        <button onClick={() => removeStory(story.id)} className="p-1 rounded hover:bg-white/10 text-secondary hover:text-red-400 transition-colors">
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {activeStories.length === 0 && (
                <div className="text-xs text-secondary/50 text-center py-3">
                  No {storyTab === 'features' ? 'feature stories' : 'implementation steps'} yet.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={handleApprove}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-xl text-emerald-400 text-sm font-medium transition-colors"
        >
          <PlayCircle size={16} />
          Approve & Build
        </button>
        <button
          onClick={onCancel}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-secondary text-sm transition-colors"
        >
          <X size={16} />
          Cancel
        </button>
      </div>
    </div>
  );
}

function StoryEditor({ story, onUpdate, onDone }: {
  story: EditableStory;
  onUpdate: (field: keyof EditableStory, value: string | string[]) => void;
  onDone: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <input
        value={story.title}
        onChange={e => onUpdate('title', e.target.value)}
        className="text-xs font-medium text-primary bg-white/5 border border-white/10 rounded px-2 py-1 outline-none focus:border-accent/40"
        placeholder="Story title"
      />
      <textarea
        value={story.description}
        onChange={e => onUpdate('description', e.target.value)}
        className="text-xs text-primary bg-white/5 border border-white/10 rounded px-2 py-1 outline-none focus:border-accent/40 resize-none"
        rows={2}
        placeholder="Story description"
      />
      <div className="flex flex-col gap-1">
        <div className="text-xs text-secondary">Acceptance Criteria:</div>
        {story.acceptanceCriteria.map((ac, i) => (
          <div key={i} className="flex gap-1">
            <input
              value={ac}
              onChange={e => {
                const updated = [...story.acceptanceCriteria];
                updated[i] = e.target.value;
                onUpdate('acceptanceCriteria', updated);
              }}
              className="flex-1 text-xs text-primary bg-white/5 border border-white/10 rounded px-2 py-0.5 outline-none focus:border-accent/40"
            />
            <button
              onClick={() => onUpdate('acceptanceCriteria', story.acceptanceCriteria.filter((_, idx) => idx !== i))}
              className="text-secondary hover:text-red-400 p-0.5"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        <button
          onClick={() => onUpdate('acceptanceCriteria', [...story.acceptanceCriteria, ''])}
          className="text-xs text-accent hover:text-accent/80 flex items-center gap-1 mt-0.5"
        >
          <Plus size={10} />
          Add criterion
        </button>
      </div>
      <button
        onClick={onDone}
        className="self-end text-xs text-accent hover:text-accent/80 flex items-center gap-1 px-2 py-1 rounded bg-accent/10"
      >
        <Check size={10} />
        Done
      </button>
    </div>
  );
}
