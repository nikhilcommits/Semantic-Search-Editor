/// <reference lib="webworker" />

import * as use from '@tensorflow-models/universal-sentence-encoder';
import * as tf from '@tensorflow/tfjs';

let model: use.UniversalSentenceEncoder | null = null;

interface EmbedRequest {
  type: 'init' | 'embed' | 'embedBatch';
  texts?: string[];
  batchSize?: number;
}

interface ProgressMessage {
  type: 'progress';
  current: number;
  total: number;
  percentage: number;
}

interface ResultMessage {
  type: 'result' | 'batchResult';
  embeddings: number[][] | number[];
}

interface ErrorMessage {
  type: 'error';
  error: string;
}

interface ReadyMessage {
  type: 'ready';
}

type WorkerMessage = ProgressMessage | ResultMessage | ErrorMessage | ReadyMessage;

// Initialize TensorFlow.js and load model
async function initModel(): Promise<void> {
  if (model) return;

  try {
    await tf.ready();
    await tf.setBackend('webgl');
    model = await use.load();

    const readyMsg: ReadyMessage = { type: 'ready' };
    self.postMessage(readyMsg);
  } catch (error) {
    const errorMsg: ErrorMessage = {
      type: 'error',
      error: error instanceof Error ? error.message : 'Failed to load model'
    };
    self.postMessage(errorMsg);
  }
}

// Embed a single text
async function embedSingle(text: string): Promise<number[]> {
  if (!model) throw new Error('Model not initialized');

  const embedding = await model.embed([text]);
  const embeddingArray = await embedding.array();
  embedding.dispose();

  return embeddingArray[0];
}

// Embed batch of texts with progress updates
async function embedBatch(texts: string[], batchSize: number = 50): Promise<number[][]> {
  if (!model) throw new Error('Model not initialized');

  const results: number[][] = [];
  const total = texts.length;

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, Math.min(i + batchSize, texts.length));

    // Process batch
    const batchEmbeddings = await model.embed(batch);
    const batchArray = await batchEmbeddings.array();
    batchEmbeddings.dispose();

    results.push(...batchArray);

    // Send progress update
    const current = Math.min(i + batchSize, texts.length);
    const percentage = Math.round((current / total) * 100);

    const progressMsg: ProgressMessage = {
      type: 'progress',
      current,
      total,
      percentage
    };
    self.postMessage(progressMsg);
  }

  return results;
}

// Handle messages from main thread
self.onmessage = async (event: MessageEvent<EmbedRequest>) => {
  const { type, texts, batchSize } = event.data;

  try {
    switch (type) {
      case 'init':
        await initModel();
        break;

      case 'embed':
        if (!texts || texts.length !== 1) {
          throw new Error('Single text required for embed');
        }
        const singleEmbedding = await embedSingle(texts[0]);
        const singleResult: ResultMessage = {
          type: 'result',
          embeddings: singleEmbedding
        };
        self.postMessage(singleResult);
        break;

      case 'embedBatch':
        if (!texts) {
          throw new Error('Texts array required for embedBatch');
        }
        const batchEmbeddings = await embedBatch(texts, batchSize);
        const batchResult: ResultMessage = {
          type: 'batchResult',
          embeddings: batchEmbeddings
        };
        self.postMessage(batchResult);
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    const errorMsg: ErrorMessage = {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    self.postMessage(errorMsg);
  }
};

// Export empty object to satisfy TypeScript module requirements
export {};
