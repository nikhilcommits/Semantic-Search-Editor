import { useState, useEffect, useCallback, useRef } from 'react';
// @ts-ignore - Vite handles worker imports
import EmbeddingWorker from '../workers/embedding.worker?worker';

export interface EmbeddingProgress {
  current: number;
  total: number;
  percentage: number;
}

interface UseEmbeddingReturn {
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  embedText: (text: string) => Promise<number[]>;
  embedBatch: (
    texts: string[],
    onProgress?: (progress: EmbeddingProgress) => void
  ) => Promise<number[][]>;
}

interface WorkerMessage {
  type: 'ready' | 'progress' | 'result' | 'batchResult' | 'error';
  current?: number;
  total?: number;
  percentage?: number;
  embeddings?: number[][] | number[];
  error?: string;
}

/**
 * Custom hook to manage embedding model lifecycle and operations using Web Worker
 * Uses TensorFlow.js Universal Sentence Encoder running in a background thread
 * This prevents UI freezing when processing large documents
 */
export function useEmbedding(): UseEmbeddingReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const pendingRequestsRef = useRef<Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    onProgress?: (progress: EmbeddingProgress) => void;
  }>>(new Map());

  useEffect(() => {
    // Initialize Web Worker
    const worker = new EmbeddingWorker();
    workerRef.current = worker;

    // Handle messages from worker
    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const message = event.data;

      switch (message.type) {
        case 'ready':
          console.log('Embedding worker ready!');
          setIsReady(true);
          setIsLoading(false);
          break;

        case 'progress':
          // Find the pending batch request and call its progress callback
          pendingRequestsRef.current.forEach(({ onProgress }) => {
            if (onProgress && message.current !== undefined && message.total !== undefined) {
              onProgress({
                current: message.current,
                total: message.total,
                percentage: message.percentage || 0
              });
            }
          });
          break;

        case 'result':
          // Handle single embedding result
          const singleRequest = pendingRequestsRef.current.get('single');
          if (singleRequest && message.embeddings) {
            singleRequest.resolve(message.embeddings);
            pendingRequestsRef.current.delete('single');
          }
          break;

        case 'batchResult':
          // Handle batch embedding result
          const batchRequest = pendingRequestsRef.current.get('batch');
          if (batchRequest && message.embeddings) {
            batchRequest.resolve(message.embeddings);
            pendingRequestsRef.current.delete('batch');
          }
          break;

        case 'error':
          console.error('Worker error:', message.error);
          const errorMessage = message.error || 'Unknown worker error';

          // Reject all pending requests
          pendingRequestsRef.current.forEach(({ reject }) => {
            reject(new Error(errorMessage));
          });
          pendingRequestsRef.current.clear();

          setError(errorMessage);
          setIsLoading(false);
          break;
      }
    };

    worker.onerror = (error) => {
      console.error('Worker error:', error);
      setError('Worker initialization failed');
      setIsLoading(false);
    };

    // Initialize the worker
    worker.postMessage({ type: 'init' });

    // Cleanup on unmount
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const embedText = useCallback(
    async (text: string): Promise<number[]> => {
      if (!workerRef.current || !isReady) {
        throw new Error('Worker not ready');
      }

      if (!text.trim()) {
        throw new Error('Text cannot be empty');
      }

      return new Promise((resolve, reject) => {
        pendingRequestsRef.current.set('single', { resolve, reject });
        workerRef.current!.postMessage({
          type: 'embed',
          texts: [text]
        });
      });
    },
    [isReady]
  );

  const embedBatch = useCallback(
    async (
      texts: string[],
      onProgress?: (progress: EmbeddingProgress) => void
    ): Promise<number[][]> => {
      if (!workerRef.current || !isReady) {
        throw new Error('Worker not ready');
      }

      if (texts.length === 0) {
        return [];
      }

      return new Promise((resolve, reject) => {
        pendingRequestsRef.current.set('batch', { resolve, reject, onProgress });
        workerRef.current!.postMessage({
          type: 'embedBatch',
          texts,
          batchSize: 50 // Process 50 lines at a time
        });
      });
    },
    [isReady]
  );

  return {
    isLoading,
    isReady,
    error,
    embedText,
    embedBatch,
  };
}
