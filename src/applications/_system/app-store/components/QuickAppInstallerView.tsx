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
import { exportToZip } from '@/system/quick-apps/exporter';
import type { ParsedQuickApp, QuickAppInstallation } from '@/system/quick-apps/types';
import { resolveIconComponent } from './iconResolver';
import {
  Zap, Upload, Link, FileText, CheckCircle, AlertTriangle,
  X, Play, Loader2, Code, Shield, Share2, Copy, Download, Edit3, Trash2, Package
} from 'lucide-react';
import { CAPABILITY_DESCRIPTIONS } from '@/system/app-store/permissions';
import type { AppCapability } from '@/system/app-store/types';

type InstallMethod = 'drop' | 'file' | 'url' | 'paste';
type ViewTab = 'install' | 'manage';

interface PreviewState {
  parsed: ParsedQuickApp;
  warnings: string[];
  method: InstallMethod;
  source?: string;
}

export function QuickAppInstallerView() {
  const { installations, installFromMarkdown, installFromUrl, uninstall, isCompiling, lastError, clearError } = useQuickAppStore();

  const [activeTab, setActiveTab] = useState<ViewTab>('install');
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [pasteInput, setPasteInput] = useState('');
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [installSuccess, setInstallSuccess] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [shareModal, setShareModal] = useState<QuickAppInstallation | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedState, setCopiedState] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickApps = Object.values(installations);

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

  // Copy to clipboard helper
  const copyToClipboard = useCallback(async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedState(key);
    setTimeout(() => setCopiedState(null), 2000);
  }, []);

  // Export Quick App as markdown file
  const exportAsFile = useCallback((installation: QuickAppInstallation) => {
    const blob = new Blob([installation.compiled.parsed.rawMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${installation.id}.app.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Open remix (re-load into editor for modification)
  const openRemix = useCallback((installation: QuickAppInstallation) => {
    setPasteInput(installation.compiled.parsed.rawMarkdown);
    setActiveTab('install');
    // Trigger preview after a short delay
    setTimeout(() => {
      previewMarkdown(installation.compiled.parsed.rawMarkdown, 'paste');
    }, 100);
  }, [previewMarkdown]);

  // Export Quick App to Full App (ZIP file)
  const exportToFullApp = useCallback(async (installation: QuickAppInstallation) => {
    setIsExporting(true);
    try {
      const blob = await exportToZip(installation.compiled);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${installation.id}-full-app.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/20 flex items-center justify-center">
            <Zap size={20} className="text-yellow-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-label-glass-primary">Quick Apps</h2>
            <p className="text-xs text-label-glass-tertiary">Install apps from a single APP.md file — zero tooling required</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-glass-surface/30 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('install')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'install'
              ? 'bg-yellow-500 text-black'
              : 'text-label-glass-secondary hover:text-label-glass-primary hover:bg-glass-surface'
          }`}
        >
          <Upload size={14} className="inline mr-1.5 -mt-0.5" />
          Install
        </button>
        <button
          onClick={() => setActiveTab('manage')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'manage'
              ? 'bg-yellow-500 text-black'
              : 'text-label-glass-secondary hover:text-label-glass-primary hover:bg-glass-surface'
          }`}
        >
          <Share2 size={14} className="inline mr-1.5 -mt-0.5" />
          My Apps ({quickApps.length})
        </button>
      </div>

      {/* Share Modal */}
      {shareModal && (
        <QuickAppShareModal
          installation={shareModal}
          onClose={() => setShareModal(null)}
          onCopy={copyToClipboard}
          copiedState={copiedState}
          onExport={exportAsFile}
        />
      )}

      {/* Install Tab */}
      {activeTab === 'install' && (
        <>
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
        </>
      )}

      {/* Manage Tab */}
      {activeTab === 'manage' && (
        <>
          {quickApps.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-glass-surface/50 border border-[var(--glass-border)] flex items-center justify-center">
                <Zap size={28} className="text-label-glass-tertiary" />
              </div>
              <p className="text-sm text-label-glass-secondary mb-2">No Quick Apps installed yet</p>
              <p className="text-xs text-label-glass-tertiary mb-4">
                Install your first Quick App to see it here
              </p>
              <button
                onClick={() => setActiveTab('install')}
                className="px-4 py-2 text-sm font-medium bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg transition-colors"
              >
                Install Quick App
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {isExporting && (
                <div className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                  <Loader2 size={16} className="animate-spin text-orange-400" />
                  <span className="text-sm text-orange-300">Exporting to Full App...</span>
                </div>
              )}
              {quickApps.map((installation) => (
                <QuickAppManageCard
                  key={installation.id}
                  installation={installation}
                  onShare={() => setShareModal(installation)}
                  onRemix={() => openRemix(installation)}
                  onExport={() => exportAsFile(installation)}
                  onExportFullApp={() => exportToFullApp(installation)}
                  onUninstall={() => uninstall(installation.id)}
                />
              ))}
            </div>
          )}
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

// ============================================================
// Manage Card Component
// ============================================================

interface QuickAppManageCardProps {
  installation: QuickAppInstallation;
  onShare: () => void;
  onRemix: () => void;
  onExport: () => void;
  onExportFullApp: () => void;
  onUninstall: () => void;
}

function QuickAppManageCard({ installation, onShare, onRemix, onExport, onExportFullApp, onUninstall }: QuickAppManageCardProps) {
  const { compiled } = installation;
  const { manifest } = compiled;
  const IconComponent = resolveIconComponent(manifest.icon);

  return (
    <div className="bg-glass-surface/50 rounded-xl border border-[var(--glass-border)] p-4">
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
          {IconComponent ? (
            <IconComponent size={22} className="text-yellow-400" />
          ) : (
            <Zap size={22} className="text-yellow-400" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-label-glass-primary truncate">
            {manifest.name}
          </h4>
          <p className="text-xs text-label-glass-tertiary">
            v{manifest.version} • Installed {new Date(installation.installedAt).toLocaleDateString()}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onShare}
            title="Share"
            className="p-2 rounded-lg text-label-glass-tertiary hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
          >
            <Share2 size={16} />
          </button>
          <button
            onClick={onRemix}
            title="Remix / Edit"
            className="p-2 rounded-lg text-label-glass-tertiary hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={onExport}
            title="Export as APP.md"
            className="p-2 rounded-lg text-label-glass-tertiary hover:text-green-400 hover:bg-green-500/10 transition-colors"
          >
            <Download size={16} />
          </button>
          <button
            onClick={onExportFullApp}
            title="Export as Full App (ZIP)"
            className="p-2 rounded-lg text-label-glass-tertiary hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
          >
            <Package size={16} />
          </button>
          <button
            onClick={onUninstall}
            title="Uninstall"
            className="p-2 rounded-lg text-label-glass-tertiary hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Share Modal Component
// ============================================================

interface QuickAppShareModalProps {
  installation: QuickAppInstallation;
  onClose: () => void;
  onCopy: (text: string, key: string) => void;
  copiedState: string | null;
  onExport: (installation: QuickAppInstallation) => void;
}

function QuickAppShareModal({ installation, onClose, onCopy, copiedState, onExport }: QuickAppShareModalProps) {
  const { compiled } = installation;
  const { manifest } = compiled;
  const markdown = compiled.parsed.rawMarkdown;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-glass-surface border border-[var(--glass-border)] rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Share2 size={20} className="text-blue-400" />
            <h3 className="text-lg font-bold text-label-glass-primary">
              Share "{manifest.name}"
            </h3>
          </div>
          <button onClick={onClose} className="text-label-glass-tertiary hover:text-label-glass-primary">
            <X size={20} />
          </button>
        </div>

        {/* Share Options */}
        <div className="space-y-4">
          {/* Copy Markdown */}
          <div>
            <label className="block text-xs font-medium text-label-glass-secondary mb-2">
              Copy APP.md content
            </label>
            <div className="flex gap-2">
              <div className="flex-1 p-3 bg-glass-surface rounded-lg border border-[var(--glass-border)] text-xs text-label-glass-tertiary font-mono truncate">
                {markdown.slice(0, 100)}...
              </div>
              <button
                onClick={() => onCopy(markdown, 'markdown')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                  copiedState === 'markdown'
                    ? 'bg-green-500 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {copiedState === 'markdown' ? (
                  <>
                    <CheckCircle size={14} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Download File */}
          <div>
            <label className="block text-xs font-medium text-label-glass-secondary mb-2">
              Download as file
            </label>
            <button
              onClick={() => onExport(installation)}
              className="w-full p-3 text-sm font-medium text-label-glass-primary bg-glass-surface hover:bg-glass-surface-hover border border-[var(--glass-border)] rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Download {installation.id}.app.md
            </button>
          </div>

          {/* Share URL hint */}
          {installation.sourceLocation && installation.source === 'url' && (
            <div>
              <label className="block text-xs font-medium text-label-glass-secondary mb-2">
                Original URL
              </label>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-glass-surface rounded-lg border border-[var(--glass-border)] text-xs text-blue-400 truncate">
                  {installation.sourceLocation}
                </div>
                <button
                  onClick={() => onCopy(installation.sourceLocation!, 'url')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    copiedState === 'url'
                      ? 'bg-green-500 text-white'
                      : 'bg-glass-surface hover:bg-glass-surface-hover border border-[var(--glass-border)] text-label-glass-primary'
                  }`}
                >
                  {copiedState === 'url' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-label-glass-secondary hover:bg-glass-surface-hover rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
