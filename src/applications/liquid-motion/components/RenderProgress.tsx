/**
 * Render Progress Component
 *
 * Overlay showing video render progress with live updates.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  Pause,
  Play,
  Download,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { RenderProgress as RenderProgressType, RenderStatus } from '../types';

interface RenderProgressProps {
  progress: RenderProgressType;
  onCancel?: () => void;
  onClose?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onRetry?: () => void;
  onDownload?: () => void;
}

export const RenderProgress: React.FC<RenderProgressProps> = ({
  progress,
  onCancel,
  onClose,
  onPause,
  onResume,
  onRetry,
  onDownload,
}) => {
  const { status, progress: progressPercent, currentFrame, totalFrames, eta, error } = progress;

  const isActive = status === 'rendering' || status === 'queued' || status === 'encoding' || status === 'paused';
  const isComplete = status === 'completed';
  const isFailed = status === 'failed' || status === 'cancelled';
  const isPaused = status === 'paused';

  return (
    <AnimatePresence>
      {(isActive || isComplete || isFailed) && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md bg-slate-900 border border-white/10 rounded-lg shadow-2xl overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <StatusIcon status={status} />
                <h2 className="text-white font-medium">
                  {getStatusTitle(status)}
                </h2>
              </div>
              {(isComplete || isFailed) && onClose && (
                <button
                  onClick={onClose}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Progress Bar */}
              {isActive && (
                <div className="space-y-2">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className={cn(
                        'h-full rounded-full',
                        status === 'queued'
                          ? 'bg-yellow-500'
                          : status === 'encoding'
                          ? 'bg-purple-500'
                          : 'bg-blue-500'
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span>
                      Frame {currentFrame} / {totalFrames}
                    </span>
                    <span>{(progressPercent * 100).toFixed(1)}%</span>
                  </div>
                </div>
              )}

              {/* ETA */}
              {isActive && eta !== undefined && eta > 0 && (
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-xs text-white/50">Estimated time remaining</span>
                  <span className="text-sm text-white font-mono">
                    {formatDuration(eta)}
                  </span>
                </div>
              )}

              {/* Queued Message */}
              {status === 'queued' && (
                <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <div className="text-sm text-yellow-200">
                    Your render is queued and will start shortly...
                  </div>
                </div>
              )}

              {/* Encoding Message */}
              {status === 'encoding' && (
                <div className="flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                  <div className="text-sm text-purple-200">
                    Encoding video...
                  </div>
                </div>
              )}

              {/* Success Message */}
              {isComplete && (
                <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="text-sm text-green-200">
                      Render completed successfully!
                    </div>
                    {progress.previewFrame && (
                      <div className="text-xs text-green-300/70 mt-1 truncate">
                        Output ready for download
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {isFailed && (
                <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm text-red-200">
                      {status === 'cancelled' ? 'Render was cancelled' : 'Render failed'}
                    </div>
                    {error && <div className="text-xs text-red-300/70 mt-1">{error}</div>}
                  </div>
                </div>
              )}

              {/* Render Stats */}
              {isComplete && (
                <div className="grid grid-cols-3 gap-2">
                  <StatBox
                    label="Frames"
                    value={totalFrames.toString()}
                  />
                  <StatBox
                    label="Duration"
                    value={formatDuration(totalFrames / 30)}
                  />
                  <StatBox
                    label="Status"
                    value="Ready"
                  />
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-white/10">
              {/* Cancel button for active renders */}
              {isActive && onCancel && (
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                >
                  Cancel
                </button>
              )}

              {/* Pause/Resume for active renders */}
              {status === 'rendering' && (
                <>
                  {onPause && (
                    <button
                      onClick={onPause}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
                    >
                      <Pause className="w-4 h-4" />
                      Pause
                    </button>
                  )}
                </>
              )}

              {isPaused && onResume && (
                <button
                  onClick={onResume}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Resume
                </button>
              )}

              {/* Retry button for failed renders */}
              {isFailed && onRetry && (
                <button
                  onClick={onRetry}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              )}

              {/* Download button for completed renders */}
              {isComplete && onDownload && (
                <button
                  onClick={onDownload}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              )}

              {/* Dismiss button */}
              {(isComplete || isFailed) && onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Status Icon Component
const StatusIcon: React.FC<{ status: RenderStatus }> = ({ status }) => {
  switch (status) {
    case 'queued':
      return <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />;
    case 'rendering':
      return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
    case 'encoding':
      return <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />;
    case 'completed':
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    case 'failed':
      return <XCircle className="w-5 h-5 text-red-400" />;
    case 'cancelled':
      return <XCircle className="w-5 h-5 text-orange-400" />;
    case 'paused':
      return <Pause className="w-5 h-5 text-yellow-400" />;
    default:
      return null;
  }
};

// Get status title
function getStatusTitle(status: RenderStatus): string {
  switch (status) {
    case 'idle':
      return 'Ready';
    case 'queued':
      return 'Queued';
    case 'rendering':
      return 'Rendering...';
    case 'encoding':
      return 'Encoding...';
    case 'completed':
      return 'Render Complete';
    case 'failed':
      return 'Render Failed';
    case 'cancelled':
      return 'Render Cancelled';
    case 'paused':
      return 'Paused';
    default:
      return 'Unknown';
  }
}

// Stat Box Component
const StatBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-3 bg-white/5 rounded-lg text-center">
    <div className="text-xs text-white/50 mb-1">{label}</div>
    <div className="text-sm text-white font-mono">{value}</div>
  </div>
);

// Format duration in seconds to human readable
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}
