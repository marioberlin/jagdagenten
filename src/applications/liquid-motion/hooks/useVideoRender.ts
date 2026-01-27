/**
 * Video Render Hook
 *
 * React hook for A2A video rendering integration.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  getVideoRenderClient,
  VideoRenderClient,
  type ServerComposition,
  type IntentResult,
} from '../api/videoRenderClient';
import type {
  Composition,
  RenderOptions,
  RenderProgress,
  RenderResult,
} from '../types';

// ============================================================================
// Types
// ============================================================================

interface UseVideoRenderReturn {
  // Render operations
  render: (composition: Composition, options: RenderOptions) => Promise<RenderResult>;
  previewFrame: (composition: Composition, frame: number) => Promise<string>;
  cancelRender: () => void;

  // Intent parsing
  parseIntent: (intent: string) => Promise<IntentResult>;

  // Composition management (synced with server)
  saveComposition: (composition: Composition) => Promise<ServerComposition>;
  loadComposition: (id: string) => Promise<Composition | null>;
  listCompositions: () => Promise<Composition[]>;
  deleteComposition: (id: string) => Promise<boolean>;

  // State
  isRendering: boolean;
  isProcessing: boolean;
  progress: RenderProgress | null;
  error: string | null;
  isConnected: boolean;

  // Health check
  checkConnection: () => Promise<boolean>;
}

// ============================================================================
// Hook
// ============================================================================

export function useVideoRender(): UseVideoRenderReturn {
  const [isRendering, setIsRendering] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<RenderProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const currentJobIdRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Get client instance
  const client = getVideoRenderClient();

  // Check connection on mount
  useEffect(() => {
    checkConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // ==========================================================================
  // Health Check
  // ==========================================================================

  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      await client.health();
      setIsConnected(true);
      setError(null);
      return true;
    } catch {
      setIsConnected(false);
      setError('Video render server not available');
      return false;
    }
  }, [client]);

  // ==========================================================================
  // Render Operations
  // ==========================================================================

  const render = useCallback(
    async (composition: Composition, options: RenderOptions): Promise<RenderResult> => {
      setIsRendering(true);
      setError(null);
      setProgress({
        jobId: '',
        status: 'queued',
        progress: 0,
        currentFrame: 0,
        totalFrames: composition.durationInFrames,
      });

      try {
        // First, ensure composition is saved to server
        let serverComposition: ServerComposition;
        const existing = await client.getComposition(composition.id);

        if (existing) {
          serverComposition = await client.updateComposition(
            composition.id,
            VideoRenderClient.toServerComposition(composition)
          );
        } else {
          serverComposition = await client.createComposition(
            VideoRenderClient.toServerComposition(composition)
          );
        }

        // Start render
        const job = await client.render(serverComposition.id, options);
        currentJobIdRef.current = job.jobId;

        setProgress({
          jobId: job.jobId,
          status: job.status as RenderProgress['status'],
          progress: job.progress,
          currentFrame: job.currentFrame || 0,
          totalFrames: job.totalFrames || composition.durationInFrames,
        });

        // Subscribe to progress updates
        unsubscribeRef.current = await client.pollProgress(
          job.jobId,
          (progressUpdate) => {
            setProgress(progressUpdate);

            // Check for completion
            if (progressUpdate.status === 'completed') {
              setIsRendering(false);
              currentJobIdRef.current = null;
            } else if (progressUpdate.status === 'failed') {
              setIsRendering(false);
              setError(progressUpdate.error || 'Render failed');
              currentJobIdRef.current = null;
            } else if (progressUpdate.status === 'cancelled') {
              setIsRendering(false);
              currentJobIdRef.current = null;
            }
          }
        );

        // Wait for completion by polling
        let finalJob = job;
        while (!['completed', 'failed', 'cancelled'].includes(finalJob.status)) {
          await delay(500);
          if (currentJobIdRef.current !== job.jobId) {
            // Cancelled
            throw new Error('Render cancelled');
          }
          finalJob = await client.getRenderStatus(job.jobId);
        }

        if (finalJob.status === 'completed') {
          return {
            jobId: finalJob.jobId,
            success: true,
            outputUri: finalJob.outputUri,
            duration: composition.durationInFrames / composition.fps,
          };
        } else {
          throw new Error(finalJob.error || 'Render failed');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        setProgress((prev) => (prev ? { ...prev, status: 'failed', error: message } : null));

        return {
          jobId: currentJobIdRef.current || '',
          success: false,
          error: message,
        };
      } finally {
        setIsRendering(false);
        currentJobIdRef.current = null;
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      }
    },
    [client]
  );

  const previewFrame = useCallback(
    async (composition: Composition, frame: number): Promise<string> => {
      try {
        // Ensure composition exists on server
        let serverComposition = await client.getComposition(composition.id);
        if (!serverComposition) {
          serverComposition = await client.createComposition(
            VideoRenderClient.toServerComposition(composition)
          );
        }

        const imageData = await client.previewFrame(serverComposition.id, frame);
        return imageData;
      } catch (err) {
        // Return placeholder on error
        console.error('Preview frame error:', err);
        return '';
      }
    },
    [client]
  );

  const cancelRender = useCallback(() => {
    const jobId = currentJobIdRef.current;
    if (jobId) {
      client.cancelRender(jobId).catch(console.error);
      currentJobIdRef.current = null;
      setIsRendering(false);
      setProgress((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
    }
  }, [client]);

  // ==========================================================================
  // Intent Parsing
  // ==========================================================================

  const parseIntent = useCallback(
    async (intent: string): Promise<IntentResult> => {
      setIsProcessing(true);
      setError(null);

      try {
        const result = await client.parseIntent(intent);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to parse intent';
        setError(message);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [client]
  );

  // ==========================================================================
  // Composition Management
  // ==========================================================================

  const saveComposition = useCallback(
    async (composition: Composition): Promise<ServerComposition> => {
      setIsProcessing(true);
      setError(null);

      try {
        const existing = await client.getComposition(composition.id);
        if (existing) {
          return client.updateComposition(
            composition.id,
            VideoRenderClient.toServerComposition(composition)
          );
        } else {
          return client.createComposition(VideoRenderClient.toServerComposition(composition));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save composition';
        setError(message);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [client]
  );

  const loadComposition = useCallback(
    async (id: string): Promise<Composition | null> => {
      setIsProcessing(true);
      setError(null);

      try {
        const serverComp = await client.getComposition(id);
        if (serverComp) {
          return VideoRenderClient.fromServerComposition(serverComp);
        }
        return null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load composition';
        setError(message);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [client]
  );

  const listCompositions = useCallback(async (): Promise<Composition[]> => {
    setIsProcessing(true);
    setError(null);

    try {
      const serverComps = await client.listCompositions();
      return serverComps.map(VideoRenderClient.fromServerComposition);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to list compositions';
      setError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [client]);

  const deleteComposition = useCallback(
    async (id: string): Promise<boolean> => {
      setIsProcessing(true);
      setError(null);

      try {
        return client.deleteComposition(id);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete composition';
        setError(message);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [client]
  );

  return {
    render,
    previewFrame,
    cancelRender,
    parseIntent,
    saveComposition,
    loadComposition,
    listCompositions,
    deleteComposition,
    isRendering,
    isProcessing,
    progress,
    error,
    isConnected,
    checkConnection,
  };
}

// Helper
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
