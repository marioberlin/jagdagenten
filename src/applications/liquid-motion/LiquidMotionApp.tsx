/**
 * Liquid Motion App
 *
 * AI-powered video editor with Remotion-compatible rendering.
 * Features timeline editing, real-time preview, and professional video export.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Square,
  Download,
  Plus,
  Maximize,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassButton } from '@/components';
import { useMenuBar } from '@/context/MenuBarContext';

// Components
import { Timeline } from './components/Timeline';
import { Preview } from './components/Preview';
import { CompositionTree } from './components/CompositionTree';
import { Inspector } from './components/Inspector';
import { EffectsPanel } from './components/EffectsPanel';
import { ExportModal } from './components/ExportModal';
import { IntentInput } from './components/IntentInput';
import { RenderProgress } from './components/RenderProgress';
import { ConnectionStatus } from './components/ConnectionStatus';

// Hooks and stores
import { useCompositionStore } from './stores/compositionStore';
import { useVideoRender } from './hooks/useVideoRender';

// API
import { VideoRenderClient } from './api/videoRenderClient';

// Panel tabs
type PanelTab = 'composition' | 'effects' | 'assets';

interface LiquidMotionAppProps {
  onClose?: () => void;
}

export const LiquidMotionApp: React.FC<LiquidMotionAppProps> = () => {
  // State
  const [activePanel, setActivePanel] = useState<PanelTab>('composition');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showRenderProgress, setShowRenderProgress] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Store and hooks
  const {
    composition,
    selectedElement,
    tracks,
    createComposition,
    updateComposition,
    loadComposition,
    addTrack,
    selectElement,
    setCurrentFrame: storeSetFrame,
  } = useCompositionStore();

  const {
    render,
    parseIntent,
    isRendering,
    isProcessing,
    progress,
    error,
    cancelRender,
    isConnected,
    checkConnection,
  } = useVideoRender();

  // Menu bar integration
  const { setAppIdentity, registerMenu, unregisterMenu } = useMenuBar();

  useEffect(() => {
    setAppIdentity('Liquid Motion', Film);

    // File menu
    registerMenu({
      id: 'file',
      label: 'File',
      items: [
        {
          id: 'new-composition',
          label: 'New Composition',
          icon: Plus,
          shortcut: '⌘N',
          action: () => handleNewComposition(),
        },
        {
          id: 'export',
          label: 'Export Video',
          icon: Download,
          shortcut: '⌘E',
          action: () => setShowExportModal(true),
        },
      ],
    });

    // Edit menu
    registerMenu({
      id: 'edit',
      label: 'Edit',
      items: [
        {
          id: 'undo',
          label: 'Undo',
          shortcut: '⌘Z',
          action: () => console.log('Undo'),
        },
        {
          id: 'redo',
          label: 'Redo',
          shortcut: '⇧⌘Z',
          action: () => console.log('Redo'),
        },
      ],
    });

    return () => {
      unregisterMenu('file');
      unregisterMenu('edit');
    };
  }, [setAppIdentity, registerMenu, unregisterMenu]);

  // Playback controls
  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setCurrentFrame(0);
    storeSetFrame(0);
  }, [storeSetFrame]);

  const handleFrameChange = useCallback((frame: number) => {
    setCurrentFrame(frame);
    storeSetFrame(frame);
  }, [storeSetFrame]);

  const handleSkipBack = useCallback(() => {
    handleFrameChange(Math.max(0, currentFrame - 30));
  }, [currentFrame, handleFrameChange]);

  const handleSkipForward = useCallback(() => {
    if (composition) {
      handleFrameChange(Math.min(composition.durationInFrames - 1, currentFrame + 30));
    }
  }, [composition, currentFrame, handleFrameChange]);

  // Composition actions
  const handleNewComposition = useCallback(() => {
    createComposition({
      name: 'New Composition',
      width: 1920,
      height: 1080,
      fps: 30,
      durationInFrames: 300, // 10 seconds
    });
  }, [createComposition]);

  const handleRender = useCallback(async () => {
    if (!composition) return;

    setShowExportModal(false);
    setShowRenderProgress(true);

    try {
      await render(composition, {
        format: 'mp4',
        codec: 'h264',
        quality: 'high',
      });
    } catch (err) {
      console.error('Render failed:', err);
    }
  }, [composition, render]);

  const handleIntentSubmit = useCallback(async (intent: string) => {
    try {
      const result = await parseIntent(intent);

      // If we got a composition from the intent, load it
      if (result.composition) {
        const frontendComposition = VideoRenderClient.fromServerComposition(result.composition);
        loadComposition(frontendComposition, []);
      }

      // Show the explanation
      console.log('Intent result:', result.explanation);
    } catch (err) {
      console.error('Failed to parse intent:', err);
    }
  }, [parseIntent, loadComposition]);

  // Playback timer
  useEffect(() => {
    if (!isPlaying || !composition) return;

    const interval = setInterval(() => {
      setCurrentFrame((prev) => {
        const next = prev + 1;
        if (next >= composition.durationInFrames) {
          setIsPlaying(false);
          return 0;
        }
        return next;
      });
    }, 1000 / composition.fps);

    return () => clearInterval(interval);
  }, [isPlaying, composition]);

  // Create default composition if none exists
  useEffect(() => {
    if (!composition) {
      handleNewComposition();
    }
  }, [composition, handleNewComposition]);

  return (
    <div className="flex flex-col h-full bg-slate-950/90 backdrop-blur-xl overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Film className="w-5 h-5 text-blue-400" />
          <span className="text-white font-medium">
            {composition?.name || 'Untitled'}
          </span>
          {composition && (
            <span className="text-white/50 text-sm">
              {composition.width}×{composition.height} @ {composition.fps}fps
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ConnectionStatus
            isConnected={isConnected}
            error={error}
            onRetry={checkConnection}
          />
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => setShowExportModal(true)}
            className="gap-2"
            disabled={!isConnected}
          >
            <Download className="w-4 h-4" />
            Export
          </GlassButton>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Composition Tree */}
        <div className="w-64 border-r border-white/10 flex flex-col">
          {/* Panel Tabs */}
          <div className="flex border-b border-white/10">
            {(['composition', 'effects', 'assets'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActivePanel(tab)}
                className={cn(
                  'flex-1 px-3 py-2 text-sm transition-colors',
                  activePanel === tab
                    ? 'text-white bg-white/10'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-2">
            <AnimatePresence mode="wait">
              {activePanel === 'composition' && (
                <motion.div
                  key="composition"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <CompositionTree
                    composition={composition}
                    selectedElement={selectedElement}
                    onSelectElement={selectElement}
                    onAddTrack={addTrack}
                  />
                </motion.div>
              )}
              {activePanel === 'effects' && (
                <motion.div
                  key="effects"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <EffectsPanel
                    onApplyEffect={(effect) => console.log('Apply effect:', effect)}
                  />
                </motion.div>
              )}
              {activePanel === 'assets' && (
                <motion.div
                  key="assets"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-white/50 text-sm text-center py-8"
                >
                  Drag and drop assets here
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Center - Preview and Timeline */}
        <div className="flex-1 flex flex-col">
          {/* Preview Area */}
          <div className="flex-1 flex items-center justify-center bg-black/50 relative">
            <Preview
              composition={composition}
              currentFrame={currentFrame}
              isPlaying={isPlaying}
            />

            {/* Preview Controls Overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-lg bg-black/50 backdrop-blur">
              <button
                onClick={handleSkipBack}
                className="p-2 rounded hover:bg-white/10 transition-colors"
              >
                <SkipBack className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={handlePlayPause}
                className="p-2 rounded hover:bg-white/10 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white" />
                )}
              </button>
              <button
                onClick={handleStop}
                className="p-2 rounded hover:bg-white/10 transition-colors"
              >
                <Square className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={handleSkipForward}
                className="p-2 rounded hover:bg-white/10 transition-colors"
              >
                <SkipForward className="w-4 h-4 text-white" />
              </button>

              <div className="w-px h-4 bg-white/20 mx-2" />

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded hover:bg-white/10 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-white/50" />
                ) : (
                  <Volume2 className="w-4 h-4 text-white" />
                )}
              </button>
              <button className="p-2 rounded hover:bg-white/10 transition-colors">
                <Maximize className="w-4 h-4 text-white" />
              </button>

              <div className="w-px h-4 bg-white/20 mx-2" />

              <span className="text-white text-sm font-mono min-w-[80px]">
                {formatTimecode(currentFrame, composition?.fps || 30)}
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div className="h-48 border-t border-white/10">
            <Timeline
              composition={composition}
              tracks={tracks}
              currentFrame={currentFrame}
              onFrameChange={handleFrameChange}
              onSelectElement={selectElement}
              selectedElement={selectedElement}
            />
          </div>
        </div>

        {/* Right Panel - Inspector */}
        <div className="w-72 border-l border-white/10 overflow-y-auto">
          <Inspector
            selectedElement={selectedElement}
            composition={composition}
            onUpdateElement={(id, updates) => console.log('Update:', id, updates)}
            onUpdateComposition={updateComposition}
          />
        </div>
      </div>

      {/* Bottom - Intent Input */}
      <div className="border-t border-white/10 p-3">
        <IntentInput
          onSubmit={handleIntentSubmit}
          isProcessing={isProcessing}
        />
      </div>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <ExportModal
            composition={composition}
            onExport={handleRender}
            onClose={() => setShowExportModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Render Progress */}
      <AnimatePresence>
        {showRenderProgress && isRendering && progress && (
          <RenderProgress
            progress={progress}
            onCancel={cancelRender}
            onClose={() => setShowRenderProgress(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper function
function formatTimecode(frame: number, fps: number): string {
  const totalSeconds = frame / fps;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const frames = frame % fps;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
}
