/**
 * Quick App Installer
 *
 * A modal UI for installing Quick Apps via:
 * - Drag and drop APP.md files
 * - Paste APP.md content
 * - Enter a URL to an APP.md file
 */

import React, { useState, useCallback, useRef } from 'react';
import { Upload, Link, FileCode, AlertCircle, CheckCircle, Loader2, X, Eye } from 'lucide-react';
import { GlassButton, GlassContainer, GlassInput, GlassModal, GlassCard, GlassBadge, GlassTextarea } from '@/components';
import { useQuickAppStore } from './quickAppStore';
import { parseQuickApp, QuickAppParseError, validateParsedApp } from './parser';
import type { ParsedQuickApp } from './types';
import { resolveIconComponent } from '../app-store/iconResolver';

// ============================================================
// Types
// ============================================================

interface QuickAppInstallerProps {
  isOpen: boolean;
  onClose: () => void;
  onInstalled?: (appId: string) => void;
}

type InstallMode = 'drop' | 'paste' | 'url';

interface PreviewState {
  parsed: ParsedQuickApp | null;
  warnings: string[];
  source: 'file' | 'url' | 'paste';
  sourceLocation?: string;
}

// ============================================================
// Component
// ============================================================

export function QuickAppInstaller({ isOpen, onClose, onInstalled }: QuickAppInstallerProps) {
  const [mode, setMode] = useState<InstallMode>('drop');
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pasteContent, setPasteContent] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { installFromMarkdown, installFromUrl, isCompiling } = useQuickAppStore();

  // ── File Handling ────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setIsLoading(true);

    try {
      const content = await file.text();
      const parsed = parseQuickApp(content, file.name);
      const warnings = validateParsedApp(parsed);

      setPreview({
        parsed,
        warnings,
        source: 'file',
        sourceLocation: file.name,
      });
    } catch (err) {
      if (err instanceof QuickAppParseError) {
        setError(err.message);
      } else {
        setError('Failed to parse APP.md file');
      }
      setPreview(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Drag and Drop ────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const mdFile = files.find(f => f.name.endsWith('.md') || f.name.endsWith('.app.md'));

    if (mdFile) {
      handleFile(mdFile);
    } else {
      setError('Please drop an APP.md file');
    }
  }, [handleFile]);

  // ── Paste Handling ───────────────────────────────────────
  const handlePaste = useCallback(() => {
    setError(null);
    setIsLoading(true);

    try {
      const parsed = parseQuickApp(pasteContent);
      const warnings = validateParsedApp(parsed);

      setPreview({
        parsed,
        warnings,
        source: 'paste',
      });
    } catch (err) {
      if (err instanceof QuickAppParseError) {
        setError(err.message);
      } else {
        setError('Failed to parse pasted content');
      }
      setPreview(null);
    } finally {
      setIsLoading(false);
    }
  }, [pasteContent]);

  // ── URL Handling ─────────────────────────────────────────
  const handleFetchUrl = useCallback(async () => {
    if (!urlInput.trim()) return;

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(urlInput);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const content = await response.text();
      const parsed = parseQuickApp(content, urlInput);
      const warnings = validateParsedApp(parsed);

      setPreview({
        parsed,
        warnings,
        source: 'url',
        sourceLocation: urlInput,
      });
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      setPreview(null);
    } finally {
      setIsLoading(false);
    }
  }, [urlInput]);

  // ── Installation ─────────────────────────────────────────
  const handleInstall = useCallback(async () => {
    if (!preview?.parsed) return;

    try {
      let compiled;

      if (preview.source === 'url' && preview.sourceLocation) {
        compiled = await installFromUrl(preview.sourceLocation);
      } else {
        compiled = await installFromMarkdown(
          preview.parsed.rawMarkdown,
          preview.source,
          preview.sourceLocation
        );
      }

      onInstalled?.(compiled.manifest.id);
      onClose();

      // Reset state
      setPreview(null);
      setPasteContent('');
      setUrlInput('');
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    }
  }, [preview, installFromMarkdown, installFromUrl, onInstalled, onClose]);

  // ── Reset ────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setPreview(null);
    setError(null);
    setPasteContent('');
    setUrlInput('');
  }, []);

  // ── Render ───────────────────────────────────────────────
  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Install Quick App"
    >
      <div className="space-y-4">
        {/* Mode Tabs */}
        {!preview && (
          <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
            <ModeTab
              active={mode === 'drop'}
              onClick={() => setMode('drop')}
              icon={<Upload size={16} />}
              label="Drop File"
            />
            <ModeTab
              active={mode === 'paste'}
              onClick={() => setMode('paste')}
              icon={<FileCode size={16} />}
              label="Paste"
            />
            <ModeTab
              active={mode === 'url'}
              onClick={() => setMode('url')}
              icon={<Link size={16} />}
              label="URL"
            />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/20 text-red-400 rounded-lg">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Preview Mode */}
        {preview?.parsed ? (
          <QuickAppPreview
            parsed={preview.parsed}
            warnings={preview.warnings}
            onInstall={handleInstall}
            onCancel={handleReset}
            isInstalling={isCompiling}
          />
        ) : (
          <>
            {/* Drop Zone */}
            {mode === 'drop' && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  flex flex-col items-center justify-center gap-3 p-8
                  border-2 border-dashed rounded-xl cursor-pointer
                  transition-all duration-200
                  ${isDragging
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                  }
                `}
              >
                <Upload size={40} className={isDragging ? 'text-blue-400' : 'text-white/40'} />
                <div className="text-center">
                  <p className="text-white/80">Drop your APP.md file here</p>
                  <p className="text-sm text-white/40">or click to browse</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />
              </div>
            )}

            {/* Paste Mode */}
            {mode === 'paste' && (
              <div className="space-y-3">
                <GlassTextarea
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder="Paste your APP.md content here..."
                  rows={12}
                  className="font-mono text-sm"
                />
                <GlassButton
                  onClick={handlePaste}
                  disabled={!pasteContent.trim() || isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin mr-2" size={16} />
                  ) : (
                    <Eye className="mr-2" size={16} />
                  )}
                  Preview App
                </GlassButton>
              </div>
            )}

            {/* URL Mode */}
            {mode === 'url' && (
              <div className="space-y-3">
                <GlassInput
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/my-app.app.md"
                  onKeyDown={(e) => e.key === 'Enter' && handleFetchUrl()}
                />
                <p className="text-xs text-white/40">
                  Enter a direct URL to an APP.md file (GitHub raw URLs work great)
                </p>
                <GlassButton
                  onClick={handleFetchUrl}
                  disabled={!urlInput.trim() || isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin mr-2" size={16} />
                  ) : (
                    <Eye className="mr-2" size={16} />
                  )}
                  Preview App
                </GlassButton>
              </div>
            )}
          </>
        )}
      </div>
    </GlassModal>
  );
}

// ============================================================
// Sub-components
// ============================================================

function ModeTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md
        transition-all duration-200
        ${active
          ? 'bg-white/10 text-white'
          : 'text-white/50 hover:text-white/80 hover:bg-white/5'
        }
      `}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}

function QuickAppPreview({
  parsed,
  warnings,
  onInstall,
  onCancel,
  isInstalling,
}: {
  parsed: ParsedQuickApp;
  warnings: string[];
  onInstall: () => void;
  onCancel: () => void;
  isInstalling: boolean;
}) {
  const IconComponent = resolveIconComponent(parsed.frontmatter.icon);

  return (
    <div className="space-y-4">
      {/* App Card */}
      <GlassCard className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            {IconComponent && <IconComponent size={32} className="text-white/80" />}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white">{parsed.frontmatter.name}</h3>
            <p className="text-sm text-white/60 line-clamp-2">{parsed.description}</p>

            <div className="flex flex-wrap gap-2 mt-2">
              <GlassBadge variant="default" size="sm">
                {parsed.frontmatter.category || 'utilities'}
              </GlassBadge>
              {parsed.frontmatter.tags?.slice(0, 3).map((tag) => (
                <GlassBadge key={tag} variant="outline" size="sm">
                  {tag}
                </GlassBadge>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Capabilities */}
      {parsed.inferredCapabilities.length > 0 && (
        <GlassContainer className="p-4">
          <h4 className="text-sm font-medium text-white/80 mb-2">This app will:</h4>
          <ul className="space-y-1">
            {parsed.inferredCapabilities.map((cap) => (
              <li key={cap} className="flex items-center gap-2 text-sm text-white/60">
                <CheckCircle size={14} className="text-green-400" />
                {formatCapability(cap)}
              </li>
            ))}
          </ul>
        </GlassContainer>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-400 mb-1">Warnings</h4>
          <ul className="text-xs text-yellow-400/80 space-y-1">
            {warnings.map((w, i) => (
              <li key={i}>• {w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Code Preview */}
      <details className="group">
        <summary className="cursor-pointer text-sm text-white/50 hover:text-white/80">
          View source ({parsed.appCode.split('\n').length} lines)
        </summary>
        <pre className="mt-2 p-3 bg-black/40 rounded-lg text-xs text-white/60 overflow-auto max-h-48">
          {parsed.appCode}
        </pre>
      </details>

      {/* Actions */}
      <div className="flex gap-3">
        <GlassButton variant="ghost" onClick={onCancel} className="flex-1">
          Cancel
        </GlassButton>
        <GlassButton onClick={onInstall} disabled={isInstalling} className="flex-1">
          {isInstalling ? (
            <Loader2 className="animate-spin mr-2" size={16} />
          ) : (
            <CheckCircle className="mr-2" size={16} />
          )}
          Install
        </GlassButton>
      </div>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================

function formatCapability(cap: string): string {
  const map: Record<string, string> = {
    'storage:local': 'Store data locally',
    'storage:indexeddb': 'Use IndexedDB storage',
    'network:http': 'Make network requests',
    'network:websocket': 'Use WebSocket connections',
    'notification:toast': 'Show notifications',
    'notification:push': 'Send push notifications',
    'ai:llm': 'Use AI language models',
    'ai:agent': 'Connect to AI agents',
    'a2a:connect': 'Connect to other apps',
    'media:camera': 'Access your camera',
    'media:microphone': 'Access your microphone',
    'media:geolocation': 'Access your location',
    'system:clipboard': 'Access clipboard',
    'system:fullscreen': 'Enter fullscreen mode',
  };
  return map[cap] || cap;
}
