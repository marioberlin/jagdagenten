/**
 * Builder RAG Manager
 *
 * Manages per-app Gemini File Search RAG corpora for build history.
 * Documents ingested: requirements, architecture, iterations, errors, completion.
 */

import fs from 'fs';
import {
  createStore,
  uploadDocument,
  queryWithRAG,
  listDocuments,
  deleteDocument,
  deleteStore,
} from '../services/fileSearchService.js';
import type { PruneOptions, PruneResult } from './types.js';

interface FileSearchDocument {
  name: string;
  displayName?: string;
  createTime?: string;
  updateTime?: string;
}

interface RAGQueryResult {
  text: string;
  citations?: {
    uri?: string;
    title?: string;
    startIndex?: number;
    endIndex?: number;
  }[];
  groundingMetadata?: unknown;
}

export class BuilderRAGManager {
  /**
   * Create a new RAG corpus for an app build.
   */
  async createAppCorpus(appId: string): Promise<string> {
    const store = await createStore(`builder-${appId}`);
    return store.name;
  }

  /**
   * Ingest a document into an app's RAG corpus.
   */
  async ingestDocument(storeName: string, content: string, displayName: string): Promise<void> {
    const tmpPath = `/tmp/builder-${Date.now()}-${Math.random().toString(36).slice(2)}.md`;
    try {
      fs.writeFileSync(tmpPath, content);
      await uploadDocument(storeName, tmpPath, displayName);
    } finally {
      if (fs.existsSync(tmpPath)) {
        fs.unlinkSync(tmpPath);
      }
    }
  }

  /**
   * Query an app's RAG corpus.
   */
  async queryAppHistory(storeName: string, query: string): Promise<RAGQueryResult> {
    return queryWithRAG(
      storeName,
      query,
      'gemini-2.5-pro',
      'You are a build history assistant. Answer questions about past builds, decisions, and errors.'
    );
  }

  /**
   * List all documents in an app's RAG corpus.
   */
  async listDocuments(storeName: string): Promise<FileSearchDocument[]> {
    return listDocuments(storeName);
  }

  /**
   * Delete a specific document from the corpus.
   */
  async deleteDocumentByName(documentName: string): Promise<boolean> {
    return deleteDocument(documentName);
  }

  /**
   * Prune old documents from a corpus based on options.
   */
  async pruneCorpus(storeName: string, options: PruneOptions): Promise<PruneResult> {
    const docs = await listDocuments(storeName);
    const deletedNames: string[] = [];

    const pinnedPatterns = ['requirements', 'architecture', 'completion', 'prd'];
    const errorPatterns = ['error'];

    for (const doc of docs) {
      const name = (doc.displayName || doc.name).toLowerCase();

      // Keep pinned documents
      if (options.keepPinned && pinnedPatterns.some(p => name.includes(p))) {
        continue;
      }

      // Keep error documents
      if (options.keepErrors && errorPatterns.some(p => name.includes(p))) {
        continue;
      }

      // Check iteration count (keep only recent N)
      if (options.maxIterations && name.includes('iteration')) {
        const iterDocs = docs
          .filter(d => (d.displayName || d.name).toLowerCase().includes('iteration'))
          .sort((a, b) => (b.createTime || '').localeCompare(a.createTime || ''));

        const iterIndex = iterDocs.findIndex(d => d.name === doc.name);
        if (iterIndex >= options.maxIterations) {
          const success = await deleteDocument(doc.name);
          if (success) deletedNames.push(doc.displayName || doc.name);
        }
        continue;
      }

      // Check age
      if (options.maxAge && doc.createTime) {
        const ageMs = Date.now() - new Date(doc.createTime).getTime();
        const maxAgeMs = parseAge(options.maxAge);
        if (ageMs > maxAgeMs) {
          const success = await deleteDocument(doc.name);
          if (success) deletedNames.push(doc.displayName || doc.name);
        }
      }
    }

    return {
      deleted: deletedNames.length,
      kept: docs.length - deletedNames.length,
      deletedNames,
    };
  }

  /**
   * Delete an entire app's RAG corpus.
   */
  async deleteCorpus(storeName: string): Promise<boolean> {
    return deleteStore(storeName, true);
  }
}

function parseAge(age: string): number {
  const match = age.match(/^(\d+)([dhm])$/);
  if (!match) return Infinity;

  const value = parseInt(match[1], 10);
  switch (match[2]) {
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'm': return value * 60 * 1000;
    default: return Infinity;
  }
}
