export interface IngestSourcesArgs {
  sources: string[];
  maxItems?: number;
}

export interface SummarizeArgs {
  newsIds: string[];
  format?: 'brief' | 'detailed';
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  sourceUrl: string;
  summary?: string;
  publishedAt?: string;
  tags: string[];
  confidence?: number;
  ingestedAt: string;
}
