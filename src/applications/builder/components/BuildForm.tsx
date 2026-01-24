/**
 * Build Form
 *
 * Form for submitting new app build requests.
 */

import { useState } from 'react';
import { Hammer, Bot, Database, Layers, Search, Eye, Zap } from 'lucide-react';
import { useBuilderStore } from '../store';

export function BuildForm() {
  const { submitBuild, isLoading } = useBuilderStore();
  const [appName, setAppName] = useState('');
  const [description, setDescription] = useState('');
  const [hasAgent, setHasAgent] = useState(false);
  const [hasResources, setHasResources] = useState(false);
  const [hasCustomComponents, setHasCustomComponents] = useState(false);
  const [researchMode, setResearchMode] = useState<'standard' | 'deep'>('standard');
  const [buildMode, setBuildMode] = useState<'automatic' | 'review'>('automatic');
  const [category, setCategory] = useState('productivity');

  const handleSubmit = () => {
    if (!description.trim()) return;
    submitBuild(description, {
      appId: appName.trim() || undefined,
      hasAgent,
      hasResources,
      hasCustomComponents,
      researchMode,
      buildMode,
      category,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-primary flex items-center gap-2">
        <Hammer size={16} className="text-accent" />
        New Build
      </h2>

      {/* App Name */}
      <div>
        <label className="text-xs text-secondary mb-1 block">Name your Application</label>
        <input
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          placeholder="Autogenerate"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-primary placeholder:text-secondary/50 focus:outline-none focus:border-accent/50"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-xs text-secondary mb-1 block">What do you want to build?</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the app you want to create..."
          className="w-full h-28 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-primary placeholder:text-secondary/50 resize-none focus:outline-none focus:border-accent/50"
        />
      </div>

      {/* Category */}
      <div>
        <label className="text-xs text-secondary mb-1 block">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent/50"
        >
          <option value="productivity">Productivity</option>
          <option value="developer">Developer</option>
          <option value="finance">Finance</option>
          <option value="media">Media</option>
          <option value="demo">Demo</option>
        </select>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-secondary">Options</label>

        <ToggleOption
          icon={<Bot size={14} />}
          label="AI Agent"
          description="Create an A2A executor with skills"
          checked={hasAgent}
          onChange={setHasAgent}
        />

        <ToggleOption
          icon={<Database size={14} />}
          label="LiquidMind Resources"
          description="Seed prompts, memory, knowledge"
          checked={hasResources}
          onChange={setHasResources}
        />

        <ToggleOption
          icon={<Layers size={14} />}
          label="Custom Components"
          description="Create new Glass/A2UI/SmartGlass components"
          checked={hasCustomComponents}
          onChange={setHasCustomComponents}
        />

        <ToggleOption
          icon={<Search size={14} />}
          label="Deep Research"
          description="Extensive web research before planning"
          checked={researchMode === 'deep'}
          onChange={(v) => setResearchMode(v ? 'deep' : 'standard')}
        />
      </div>

      {/* Build Mode */}
      <div>
        <label className="text-xs text-secondary mb-1 block">Build Mode</label>
        <div className="flex gap-2">
          <button
            onClick={() => setBuildMode('automatic')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
              buildMode === 'automatic'
                ? 'border-accent/30 bg-accent/10 text-accent'
                : 'border-white/10 bg-white/5 text-secondary hover:text-primary'
            }`}
          >
            <Zap size={14} />
            Fully Automatic
          </button>
          <button
            onClick={() => setBuildMode('review')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
              buildMode === 'review'
                ? 'border-accent/30 bg-accent/10 text-accent'
                : 'border-white/10 bg-white/5 text-secondary hover:text-primary'
            }`}
          >
            <Eye size={14} />
            Review Plan
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!description.trim() || isLoading}
        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-accent/20 hover:bg-accent/30 text-accent font-medium text-sm rounded-lg border border-accent/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Hammer size={16} />
        {isLoading ? 'Creating...' : 'Build App'}
      </button>
    </div>
  );
}

function ToggleOption({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors text-left ${
        checked
          ? 'border-accent/30 bg-accent/10'
          : 'border-white/10 bg-white/5 hover:bg-white/8'
      }`}
    >
      <div className={`${checked ? 'text-accent' : 'text-secondary'}`}>{icon}</div>
      <div className="flex-1">
        <div className="text-xs font-medium text-primary">{label}</div>
        <div className="text-xs text-secondary">{description}</div>
      </div>
      <div className={`w-4 h-4 rounded-full border-2 ${
        checked ? 'border-accent bg-accent' : 'border-white/30'
      }`} />
    </button>
  );
}
