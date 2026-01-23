/**
 * App Publish View
 *
 * Form for developers to submit apps to the LiquidOS App Store registry.
 * Validates manifest fields and uploads the app bundle.
 */

import { useState } from 'react';
import type { AppCategory, AppCapability } from '@/system/app-store/types';
import { Upload, CheckCircle, AlertTriangle, Package } from 'lucide-react';

const CATEGORIES: { value: AppCategory; label: string }[] = [
  { value: 'productivity', label: 'Productivity' },
  { value: 'communication', label: 'Communication' },
  { value: 'finance', label: 'Finance' },
  { value: 'weather', label: 'Weather' },
  { value: 'travel', label: 'Travel' },
  { value: 'developer', label: 'Developer' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'system', label: 'System' },
];

const CAPABILITIES: { value: AppCapability; label: string }[] = [
  { value: 'network:http', label: 'Network (HTTP)' },
  { value: 'network:websocket', label: 'WebSocket' },
  { value: 'storage:local', label: 'Local Storage' },
  { value: 'storage:indexeddb', label: 'IndexedDB' },
  { value: 'ai:llm', label: 'AI Language Model' },
  { value: 'ai:agent', label: 'AI Agent' },
  { value: 'a2a:connect', label: 'Agent-to-Agent' },
  { value: 'notification:push', label: 'Push Notifications' },
  { value: 'notification:toast', label: 'Toast Notifications' },
  { value: 'media:camera', label: 'Camera' },
  { value: 'media:microphone', label: 'Microphone' },
  { value: 'media:geolocation', label: 'Geolocation' },
  { value: 'system:clipboard', label: 'Clipboard' },
  { value: 'system:fullscreen', label: 'Fullscreen' },
];

const WINDOW_MODES = [
  { value: 'floating', label: 'Floating Window' },
  { value: 'panel', label: 'Panel (Full Height)' },
  { value: 'fullscreen', label: 'Fullscreen' },
];

interface PublishForm {
  id: string;
  name: string;
  version: string;
  description: string;
  longDescription: string;
  author: string;
  category: AppCategory;
  keywords: string;
  icon: string;
  windowMode: string;
  windowTitle: string;
  width: string;
  height: string;
  resizable: boolean;
  dockEnabled: boolean;
  capabilities: AppCapability[];
}

const INITIAL_FORM: PublishForm = {
  id: '',
  name: '',
  version: '1.0.0',
  description: '',
  longDescription: '',
  author: '',
  category: 'utilities',
  keywords: '',
  icon: 'Package',
  windowMode: 'floating',
  windowTitle: '',
  width: '800',
  height: '600',
  resizable: true,
  dockEnabled: true,
  capabilities: [],
};

export function AppPublishView() {
  const [form, setForm] = useState<PublishForm>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const updateField = <K extends keyof PublishForm>(key: K, value: PublishForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setResult(null);
  };

  const toggleCapability = (cap: AppCapability) => {
    setForm(prev => ({
      ...prev,
      capabilities: prev.capabilities.includes(cap)
        ? prev.capabilities.filter(c => c !== cap)
        : [...prev.capabilities, cap],
    }));
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!form.id.trim()) errs.push('App ID is required');
    else if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(form.id)) errs.push('App ID must be lowercase kebab-case (e.g., my-app)');
    if (!form.name.trim()) errs.push('Name is required');
    if (!form.version.trim()) errs.push('Version is required');
    else if (!/^\d+\.\d+\.\d+/.test(form.version)) errs.push('Version must be semver (e.g., 1.0.0)');
    if (!form.description.trim()) errs.push('Description is required');
    if (!form.author.trim()) errs.push('Author is required');
    if (!form.icon.trim()) errs.push('Icon name is required');
    return errs;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    setIsSubmitting(true);
    setResult(null);

    const manifest = {
      id: form.id.trim(),
      name: form.name.trim(),
      version: form.version.trim(),
      description: form.description.trim(),
      longDescription: form.longDescription.trim() || undefined,
      author: form.author.trim(),
      category: form.category,
      keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
      icon: form.icon.trim(),
      window: {
        mode: form.windowMode,
        title: form.windowTitle.trim() || form.name.trim(),
        defaultSize: { width: parseInt(form.width) || 800, height: parseInt(form.height) || 600 },
        resizable: form.resizable,
      },
      integrations: {
        dock: { enabled: form.dockEnabled },
      },
      capabilities: form.capabilities,
    };

    try {
      const response = await fetch('/api/v1/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manifest }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Server error' }));
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setResult({ success: true, message: `"${form.name}" published successfully!` });
      setForm(INITIAL_FORM);
    } catch (err) {
      setResult({ success: false, message: err instanceof Error ? err.message : 'Publish failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20 flex items-center justify-center">
          <Upload size={20} className="text-green-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-label-glass-primary">Publish an App</h2>
          <p className="text-xs text-label-glass-tertiary">Submit your app to the LiquidOS marketplace</p>
        </div>
      </div>

      {/* Result Banner */}
      {result && (
        <div className={`flex items-start gap-2.5 rounded-xl p-3 border ${
          result.success
            ? 'bg-green-500/5 border-green-500/20'
            : 'bg-red-500/5 border-red-500/20'
        }`}>
          {result.success
            ? <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
            : <AlertTriangle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
          }
          <p className={`text-sm ${result.success ? 'text-green-300' : 'text-red-300'}`}>
            {result.message}
          </p>
        </div>
      )}

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 space-y-1">
          {errors.map((err, i) => (
            <p key={i} className="text-xs text-red-300 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-red-400" />
              {err}
            </p>
          ))}
        </div>
      )}

      {/* Form Sections */}
      <FormSection title="Identity">
        <FormRow label="App ID" hint="Lowercase kebab-case identifier">
          <input
            value={form.id}
            onChange={e => updateField('id', e.target.value)}
            placeholder="my-awesome-app"
            className="w-full px-3 py-2 text-sm bg-glass-surface border border-[var(--glass-border)] rounded-lg text-label-glass-primary placeholder:text-label-glass-tertiary focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          />
        </FormRow>
        <FormRow label="Name">
          <input
            value={form.name}
            onChange={e => updateField('name', e.target.value)}
            placeholder="My Awesome App"
            className="w-full px-3 py-2 text-sm bg-glass-surface border border-[var(--glass-border)] rounded-lg text-label-glass-primary placeholder:text-label-glass-tertiary focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          />
        </FormRow>
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Version">
            <input
              value={form.version}
              onChange={e => updateField('version', e.target.value)}
              placeholder="1.0.0"
              className="w-full px-3 py-2 text-sm bg-glass-surface border border-[var(--glass-border)] rounded-lg text-label-glass-primary placeholder:text-label-glass-tertiary focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </FormRow>
          <FormRow label="Author">
            <input
              value={form.author}
              onChange={e => updateField('author', e.target.value)}
              placeholder="Your Name"
              className="w-full px-3 py-2 text-sm bg-glass-surface border border-[var(--glass-border)] rounded-lg text-label-glass-primary placeholder:text-label-glass-tertiary focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </FormRow>
        </div>
      </FormSection>

      <FormSection title="Description">
        <FormRow label="Short Description">
          <input
            value={form.description}
            onChange={e => updateField('description', e.target.value)}
            placeholder="Brief description of your app"
            className="w-full px-3 py-2 text-sm bg-glass-surface border border-[var(--glass-border)] rounded-lg text-label-glass-primary placeholder:text-label-glass-tertiary focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          />
        </FormRow>
        <FormRow label="Long Description" hint="Optional detailed description">
          <textarea
            value={form.longDescription}
            onChange={e => updateField('longDescription', e.target.value)}
            placeholder="Detailed description with features, usage instructions..."
            rows={3}
            className="w-full px-3 py-2 text-sm bg-glass-surface border border-[var(--glass-border)] rounded-lg text-label-glass-primary placeholder:text-label-glass-tertiary focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
          />
        </FormRow>
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Category">
            <select
              value={form.category}
              onChange={e => updateField('category', e.target.value as AppCategory)}
              className="w-full px-3 py-2 text-sm bg-glass-surface border border-[var(--glass-border)] rounded-lg text-label-glass-primary placeholder:text-label-glass-tertiary focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </FormRow>
          <FormRow label="Icon" hint="Lucide icon name">
            <input
              value={form.icon}
              onChange={e => updateField('icon', e.target.value)}
              placeholder="Package"
              className="w-full px-3 py-2 text-sm bg-glass-surface border border-[var(--glass-border)] rounded-lg text-label-glass-primary placeholder:text-label-glass-tertiary focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </FormRow>
        </div>
        <FormRow label="Keywords" hint="Comma-separated">
          <input
            value={form.keywords}
            onChange={e => updateField('keywords', e.target.value)}
            placeholder="tool, productivity, utility"
            className="w-full px-3 py-2 text-sm bg-glass-surface border border-[var(--glass-border)] rounded-lg text-label-glass-primary placeholder:text-label-glass-tertiary focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          />
        </FormRow>
      </FormSection>

      <FormSection title="Window Configuration">
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Window Mode">
            <select
              value={form.windowMode}
              onChange={e => updateField('windowMode', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-glass-surface border border-[var(--glass-border)] rounded-lg text-label-glass-primary placeholder:text-label-glass-tertiary focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            >
              {WINDOW_MODES.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </FormRow>
          <FormRow label="Window Title" hint="Optional, defaults to name">
            <input
              value={form.windowTitle}
              onChange={e => updateField('windowTitle', e.target.value)}
              placeholder={form.name || 'App Name'}
              className="w-full px-3 py-2 text-sm bg-glass-surface border border-[var(--glass-border)] rounded-lg text-label-glass-primary placeholder:text-label-glass-tertiary focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </FormRow>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <FormRow label="Width (px)">
            <input
              type="number"
              value={form.width}
              onChange={e => updateField('width', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-glass-surface border border-[var(--glass-border)] rounded-lg text-label-glass-primary placeholder:text-label-glass-tertiary focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </FormRow>
          <FormRow label="Height (px)">
            <input
              type="number"
              value={form.height}
              onChange={e => updateField('height', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-glass-surface border border-[var(--glass-border)] rounded-lg text-label-glass-primary placeholder:text-label-glass-tertiary focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </FormRow>
          <FormRow label="Options">
            <div className="flex flex-col gap-1.5 pt-1">
              <label className="flex items-center gap-2 text-xs text-label-glass-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.resizable}
                  onChange={e => updateField('resizable', e.target.checked)}
                  className="rounded border-[var(--glass-border)]"
                />
                Resizable
              </label>
              <label className="flex items-center gap-2 text-xs text-label-glass-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.dockEnabled}
                  onChange={e => updateField('dockEnabled', e.target.checked)}
                  className="rounded border-[var(--glass-border)]"
                />
                Show in Dock
              </label>
            </div>
          </FormRow>
        </div>
      </FormSection>

      <FormSection title="Capabilities">
        <p className="text-xs text-label-glass-tertiary mb-3">
          Select the permissions your app requires. Users will be prompted to approve sensitive capabilities during installation.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {CAPABILITIES.map(cap => (
            <label
              key={cap.value}
              className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                form.capabilities.includes(cap.value)
                  ? 'border-blue-500/30 bg-blue-500/10 text-blue-300'
                  : 'border-[var(--glass-border)] bg-glass-surface/30 text-label-glass-tertiary hover:bg-glass-surface-hover'
              }`}
            >
              <input
                type="checkbox"
                checked={form.capabilities.includes(cap.value)}
                onChange={() => toggleCapability(cap.value)}
                className="sr-only"
              />
              {cap.label}
            </label>
          ))}
        </div>
      </FormSection>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-5 py-2.5 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <Package size={16} />
              Publish App
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-glass-surface/50 rounded-xl border border-[var(--glass-border)] p-5 space-y-3">
      <h3 className="text-sm font-semibold text-label-glass-primary">{title}</h3>
      {children}
    </div>
  );
}

function FormRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-label-glass-secondary mb-1">
        {label}
        {hint && <span className="ml-1 font-normal text-label-glass-tertiary">({hint})</span>}
      </label>
      {children}
    </div>
  );
}
