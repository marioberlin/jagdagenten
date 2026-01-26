/**
 * Quick App Installer View
 *
 * Allows users to install Quick Apps via:
 * - Drag & drop APP.md files
 * - File picker
 * - URL input
 * - Paste APP.md content
 */

import { useState, useCallback, useRef, type DragEvent, type ChangeEvent } from 'react';
import { useQuickAppStore } from '@/system/quick-apps/quickAppStore';
import { parseQuickApp, validateParsedApp } from '@/system/quick-apps/parser';
import type { ParsedQuickApp } from '@/system/quick-apps/types';
import { resolveIconComponent } from './iconResolver';
import {
  Zap, Upload, Link, FileText, CheckCircle, AlertTriangle,
  X, Play, Loader2, Code, Shield
} from 'lucide-react';
import { CAPABILITY_DESCRIPTIONS } from '@/system/app-store/permissions';
import type { AppCapability } from '@/system/app-store/types';

type InstallMethod = 'drop' | 'file' | 'url' | 'paste';

interface PreviewState {
  parsed: ParsedQuickApp;
  warnings: string[];
  method: InstallMethod;
  source?: string;
}

export function QuickAppInstallerView() {
  const { installFromMarkdown, installFromUrl, isCompiling, lastError, clearError } = useQuickAppStore();

  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [pasteInput, setPasteInput] = useState('');
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [installSuccess, setInstallSuccess] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear all states
  const resetState = useCallback(() => {
    setPreview(null);
    setInstallSuccess(null);
    setParseError(null);
    clearError();
  }, [clearError]);

  // Parse and preview the APP.md content
  const previewMarkdown = useCallback((content: string, method: InstallMethod, source?: string) => {
    resetState();
    try {
      const parsed = parseQuickApp(content, source);
      const warnings = validateParsedApp(parsed);
      setPreview({ parsed, warnings, method, source });
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Failed to parse APP.md');
    }
  }, [resetState]);

  // Handle drag events
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!file.name.endsWith('.md') && file.type !== 'text/markdown') {
      setParseError('Please drop an APP.md file (Markdown format)');
      return;
    }

    const content = await file.text();
    previewMarkdown(content, 'drop', file.name);
  }, [previewMarkdown]);

  // Handle file picker
  const handleFileSelect = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const content = await file.text();
    previewMarkdown(content, 'file', file.name);

    // Reset the input so the same file can be selected again
    e.target.value = '';
  }, [previewMarkdown]);

  // Handle URL fetch
  const handleUrlFetch = useCallback(async () => {
    if (!urlInput.trim()) return;
    resetState();

    try {
      const response = await fetch(urlInput.trim());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const content = await response.text();
      previewMarkdown(content, 'url', urlInput.trim());
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Failed to fetch URL');
    }
  }, [urlInput, previewMarkdown, resetState]);

  // Handle paste preview
  const handlePastePreview = useCallback(() => {
    if (!pasteInput.trim()) return;
    previewMarkdown(pasteInput.trim(), 'paste');
  }, [pasteInput, previewMarkdown]);

  // Install the previewed app
  const handleInstall = useCallback(async () => {
    if (!preview) return;

    try {
      if (preview.method === 'url' && preview.source) {
        await installFromUrl(preview.source);
      } else {
        await installFromMarkdown(
          preview.parsed.rawMarkdown,
          preview.method === 'drop' || preview.method === 'file' ? 'file' : 'paste',
          preview.source
        );
      }
      setInstallSuccess(preview.parsed.frontmatter.name);
      setPreview(null);
      setPasteInput('');
      setUrlInput('');
    } catch {
      // Error is handled by the store
    }
  }, [preview, installFromMarkdown, installFromUrl]);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/20 flex items-center justify-center">
          <Zap size={20} className="text-yellow-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-label-glass-primary">Quick Apps</h2>
          <p className="text-xs text-label-glass-tertiary">Install apps from a single APP.md file — zero tooling required</p>
        </div>
      </div>

      {/* Success Banner */}
      {installSuccess && (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-300">
              "{installSuccess}" installed successfully!
            </p>
            <p className="text-xs text-green-400/70 mt-0.5">
              The app is now available in your dock and app launcher.
            </p>
          </div>
          <button
            onClick={() => setInstallSuccess(null)}
            className="text-green-400/50 hover:text-green-400"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Error Banner */}
      {(parseError || lastError) && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-300">Installation Failed</p>
            <p className="text-xs text-red-400/70 mt-0.5">{parseError || lastError}</p>
          </div>
          <button
            onClick={resetState}
            className="text-red-400/50 hover:text-red-400"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Preview Card */}
      {preview && !isCompiling && (
        <QuickAppPreview
          preview={preview}
          onInstall={handleInstall}
          onCancel={resetState}
        />
      )}

      {/* Compiling State */}
      {isCompiling && (
        <div className="flex items-center justify-center gap-3 py-12 text-label-glass-secondary">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Compiling Quick App...</span>
        </div>
      )}

      {/* Input Methods (only show when not previewing) */}
      {!preview && !isCompiling && (
        <>
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-8 transition-all ${
              isDragging
                ? 'border-yellow-400 bg-yellow-500/5'
                : 'border-[var(--glass-border)] hover:border-yellow-400/50 hover:bg-glass-surface/30'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isDragging ? 'bg-yellow-500/20' : 'bg-glass-surface'
              }`}>
                <Upload size={24} className={isDragging ? 'text-yellow-400' : 'text-label-glass-tertiary'} />
              </div>
              <div>
                <p className="text-sm font-medium text-label-glass-primary">
                  Drop APP.md file here
                </p>
                <p className="text-xs text-label-glass-tertiary mt-1">
                  or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-yellow-400 hover:underline"
                  >
                    browse files
                  </button>
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,text/markdown"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Alternative Methods */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* URL Input */}
            <div className="bg-glass-surface/50 rounded-xl border border-[var(--glass-border)] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-label-glass-primary mb-3">
                <Link size={14} className="text-blue-400" />
                Install from URL
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/app.md"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-glass-surface border border-[var(--glass-border)] rounded-lg text-label-glass-primary placeholder:text-label-glass-tertiary focus:outline-none focus:ring-1 focus:ring-yellow-500/50"
                />
                <button
                  onClick={handleUrlFetch}
                  disabled={!urlInput.trim()}
                  className="px-4 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Fetch
                </button>
              </div>
            </div>

            {/* Paste Input */}
            <div className="bg-glass-surface/50 rounded-xl border border-[var(--glass-border)] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-label-glass-primary mb-3">
                <FileText size={14} className="text-purple-400" />
                Paste APP.md content
              </div>
              <div className="flex gap-2">
                <textarea
                  placeholder="---&#10;name: My App&#10;icon: Star&#10;---&#10;..."
                  value={pasteInput}
                  onChange={(e) => setPasteInput(e.target.value)}
                  rows={1}
                  className="flex-1 px-3 py-2 text-sm bg-glass-surface border border-[var(--glass-border)] rounded-lg text-label-glass-primary placeholder:text-label-glass-tertiary focus:outline-none focus:ring-1 focus:ring-yellow-500/50 resize-none"
                />
                <button
                  onClick={handlePastePreview}
                  disabled={!pasteInput.trim()}
                  className="px-4 py-2 text-sm font-medium bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Preview
                </button>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-glass-surface/30 rounded-xl border border-[var(--glass-border)] p-5">
            <h3 className="text-sm font-semibold text-label-glass-primary mb-3">
              What's a Quick App?
            </h3>
            <p className="text-xs text-label-glass-secondary leading-relaxed mb-4">
              Quick Apps are single-file applications written in a special APP.md format.
              They combine YAML configuration with React/TypeScript code in one Markdown file.
              No build tools, no manifest.json, no compilation step required — just upload and run.
            </p>
            <div className="bg-glass-surface rounded-lg p-3 font-mono text-xs text-label-glass-tertiary overflow-x-auto">
              <pre>{`---
name: Pomodoro Timer
icon: Timer
category: productivity
---

# Pomodoro Timer

A simple focus timer for productivity.

## UI

\`\`\`tsx App
export default function App() {
  const [time, setTime] = useStorage('time', 25 * 60);
  return <div>{time}</div>;
}
\`\`\``}</pre>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// Preview Component
// ============================================================

interface QuickAppPreviewProps {
  preview: PreviewState;
  onInstall: () => void;
  onCancel: () => void;
}

function QuickAppPreview({ preview, onInstall, onCancel }: QuickAppPreviewProps) {
  const { parsed, warnings } = preview;
  const { frontmatter, description, inferredCapabilities } = parsed;

  const IconComponent = resolveIconComponent(frontmatter.icon);

  return (
    <div className="bg-glass-surface/50 rounded-2xl border border-[var(--glass-border)] overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-[var(--glass-border)]">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
            {IconComponent ? (
              <IconComponent size={32} className="text-yellow-400" />
            ) : (
              <Zap size={32} className="text-yellow-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-label-glass-primary truncate">
              {frontmatter.name}
            </h3>
            <p className="text-xs text-label-glass-tertiary mt-0.5">
              {frontmatter.category || 'utilities'} • v{frontmatter.version || '0.1.0'} • by {frontmatter.author || 'Quick App User'}
            </p>
            <p className="text-sm text-label-glass-secondary mt-2 line-clamp-2">
              {description || 'No description provided'}
            </p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-5 space-y-4">
        {/* Code Preview */}
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-label-glass-primary mb-2">
            <Code size={12} />
            App Code ({parsed.appCode.split('\n').length} lines)
          </div>
          <div className="bg-glass-surface rounded-lg p-3 max-h-32 overflow-y-auto">
            <pre className="text-xs text-label-glass-tertiary font-mono whitespace-pre-wrap">
              {parsed.appCode.slice(0, 500)}{parsed.appCode.length > 500 ? '...' : ''}
            </pre>
          </div>
        </div>

        {/* Inferred Capabilities */}
        {inferredCapabilities.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-label-glass-primary mb-2">
              <Shield size={12} />
              Inferred Capabilities
            </div>
            <div className="flex flex-wrap gap-2">
              {inferredCapabilities.map((cap: AppCapability) => {
                const info = CAPABILITY_DESCRIPTIONS[cap];
                return (
                  <span
                    key={cap}
                    className={`px-2 py-1 text-xs rounded-md border ${
                      info?.risk === 'high'
                        ? 'bg-red-500/10 border-red-500/20 text-red-300'
                        : info?.risk === 'medium'
                        ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300'
                        : 'bg-green-500/10 border-green-500/20 text-green-300'
                    }`}
                  >
                    {info?.label || cap}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-yellow-300 mb-2">
              <AlertTriangle size={12} />
              Warnings
            </div>
            <ul className="space-y-1">
              {warnings.map((warning, i) => (
                <li key={i} className="text-xs text-yellow-400/70 flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-yellow-400 mt-1.5 flex-shrink-0" />
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 py-4 bg-glass-surface/30 border-t border-[var(--glass-border)] flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-label-glass-secondary hover:bg-glass-surface-hover rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onInstall}
          className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 rounded-lg transition-colors flex items-center gap-2"
        >
          <Play size={14} />
          Install Quick App
        </button>
      </div>
    </div>
  );
}
