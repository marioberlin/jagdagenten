/**
 * Knowledge Ingestion Pipeline (PTI)
 *
 * Parse → Transform → Index pipeline for knowledge resources.
 * Ingests files and URLs, enhances with LLM, indexes for retrieval.
 */

import type {
  AIResource,
  KnowledgeMetadata,
  TransformedKnowledge,
  OwnerTarget,
  ResourceStore,
} from './types.js';

// ============================================================================
// Knowledge Pipeline
// ============================================================================

export class KnowledgePipeline {
  private store: ResourceStore;
  private geminiApiKey: string;

  constructor(store: ResourceStore) {
    this.store = store;
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
  }

  // --------------------------------------------------------------------------
  // Full Pipeline
  // --------------------------------------------------------------------------

  /** Ingest a file: parse → transform → index → store */
  async ingest(
    file: Buffer,
    mimeType: string,
    fileName: string,
    target: OwnerTarget
  ): Promise<AIResource> {
    // 1. Parse: extract text from the file
    const text = await this.parse(file, mimeType);

    // 2. Transform: LLM-powered enhancement
    let transformed: TransformedKnowledge | null = null;
    if (this.geminiApiKey && text.length > 50) {
      try {
        transformed = await this.transform(text);
      } catch (err) {
        console.error('[KnowledgePipeline] Transform error:', err);
      }
    }

    // 3. Create resource with enhanced metadata
    const metadata: KnowledgeMetadata = {
      type: 'knowledge',
      sourceType: 'file',
      mimeType,
      fileSize: file.length,
      parsedAt: new Date().toISOString(),
      transformedAt: transformed ? new Date().toISOString() : undefined,
      summary: transformed?.summary,
      entities: transformed?.entities,
      qaSnippets: transformed?.qaSnippets,
      topics: transformed?.topics,
    };

    const resource = await this.store.create({
      resourceType: 'knowledge',
      ownerType: target.ownerType,
      ownerId: target.ownerId,
      name: fileName,
      description: transformed?.summary || `Imported from ${fileName}`,
      content: text,
      parts: [],
      typeMetadata: metadata,
      version: 1,
      isActive: true,
      isPinned: false,
      tags: transformed?.topics || [],
      provenance: 'imported',
      usageFrequency: 0,
      syncToFile: true, // Knowledge files sync to .ai/ markdown
    });

    return resource;
  }

  /** Ingest from a URL */
  async ingestFromUrl(url: string, target: OwnerTarget): Promise<AIResource> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);

    const contentType = response.headers.get('content-type') || 'text/plain';
    const buffer = Buffer.from(await response.arrayBuffer());
    const fileName = url.split('/').pop() || 'url-import';

    return this.ingest(buffer, contentType, fileName, target);
  }

  // --------------------------------------------------------------------------
  // Parse: Extract text from various formats
  // --------------------------------------------------------------------------

  async parse(file: Buffer, mimeType: string): Promise<string> {
    // For now, handle text-based formats directly
    // PDF/DOCX would require additional libraries (pdf-parse, mammoth)
    if (mimeType.startsWith('text/') || mimeType === 'application/json') {
      return file.toString('utf-8');
    }

    if (mimeType === 'application/pdf') {
      // Simplified: extract what we can as text
      // In production, use pdf-parse or similar
      const text = file.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
      return text.trim() || '[PDF content - requires parser]';
    }

    if (mimeType.includes('markdown') || mimeType.includes('md')) {
      return file.toString('utf-8');
    }

    // Default: try as text
    return file.toString('utf-8');
  }

  // --------------------------------------------------------------------------
  // Transform: LLM-powered enhancement
  // --------------------------------------------------------------------------

  async transform(text: string): Promise<TransformedKnowledge> {
    if (!this.geminiApiKey) {
      return this.fallbackTransform(text);
    }

    const prompt = `Analyze this document and provide a JSON response with:
1. "summary": A 2-3 sentence summary
2. "entities": Array of {name, type} for important entities (people, companies, concepts)
3. "qaSnippets": Array of {question, answer} - 3-5 Q&A pairs for retrieval
4. "topics": Array of topic strings (3-5 topics)

Document:
${text.slice(0, 4000)}

Respond with valid JSON only.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (!response.ok) {
        console.error('[KnowledgePipeline] Gemini API error:', response.status);
        return this.fallbackTransform(text);
      }

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) return this.fallbackTransform(text);

      const parsed = JSON.parse(responseText);
      return {
        summary: parsed.summary || '',
        entities: parsed.entities || [],
        qaSnippets: parsed.qaSnippets || [],
        topics: parsed.topics || [],
      };
    } catch (err) {
      console.error('[KnowledgePipeline] Transform API error:', err);
      return this.fallbackTransform(text);
    }
  }

  // --------------------------------------------------------------------------
  // Index: Write to search indices
  // --------------------------------------------------------------------------

  async index(resource: AIResource, ragStoreName?: string): Promise<void> {
    // PostgreSQL full-text search is handled automatically by the search_vector column
    // For RAG, we'd upload to the Gemini FileSearch store
    if (ragStoreName && resource.content) {
      try {
        // Update metadata with RAG store reference
        const metadata = resource.typeMetadata as KnowledgeMetadata;
        metadata.ragStoreId = ragStoreName;
        metadata.indexedAt = new Date().toISOString();
        await this.store.update(resource.id, { typeMetadata: metadata });
      } catch (err) {
        console.error('[KnowledgePipeline] Index error:', err);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Fallback transform (no LLM)
  // --------------------------------------------------------------------------

  private fallbackTransform(text: string): TransformedKnowledge {
    // Simple extractive summary (first 200 chars)
    const summary = text.slice(0, 200).replace(/\n/g, ' ').trim() + '...';

    // Extract potential entities (capitalized words)
    const entityCandidates = text.match(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/g) || [];
    const entities = [...new Set(entityCandidates)]
      .slice(0, 10)
      .map(name => ({ name, type: 'unknown' }));

    // Extract topics from headers
    const headers = text.match(/^#+\s+(.+)$/gm) || [];
    const topics = headers.slice(0, 5).map(h => h.replace(/^#+\s+/, ''));

    return {
      summary,
      entities,
      qaSnippets: [],
      topics,
    };
  }
}
