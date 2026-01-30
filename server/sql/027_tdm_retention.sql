-- ============================================================================
-- TDM Retention Cleanup Schema
-- ============================================================================
-- Extends news_articles for retention tracking and adds cleanup audit log
-- ============================================================================

-- Add retention columns to news_articles (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'news_articles' AND column_name = 'content_deleted_at') THEN
        ALTER TABLE news_articles ADD COLUMN content_deleted_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'news_articles' AND column_name = 'deletion_reason') THEN
        ALTER TABLE news_articles ADD COLUMN deletion_reason TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'news_articles' AND column_name = 'embeddings') THEN
        ALTER TABLE news_articles ADD COLUMN embeddings JSONB;
    END IF;
END $$;

-- Add TDM opt-out columns to news_sources (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'news_sources' AND column_name = 'tdm_opt_out') THEN
        ALTER TABLE news_sources ADD COLUMN tdm_opt_out BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'news_sources' AND column_name = 'opt_out_detected_at') THEN
        ALTER TABLE news_sources ADD COLUMN opt_out_detected_at TIMESTAMPTZ;
    END IF;
END $$;

-- TDM Cleanup Audit Log
CREATE TABLE IF NOT EXISTS tdm_cleanup_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_at TIMESTAMPTZ NOT NULL,
    content_deleted INTEGER NOT NULL DEFAULT 0,
    embeddings_deleted INTEGER NOT NULL DEFAULT 0,
    metadata_deleted INTEGER NOT NULL DEFAULT 0,
    opt_outs_processed INTEGER NOT NULL DEFAULT 0,
    errors JSONB DEFAULT '[]'::jsonb,
    policy_snapshot JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_news_articles_content_retention ON news_articles (created_at)
WHERE
    raw_content IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_news_articles_embedding_retention ON news_articles (created_at)
WHERE
    embeddings IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_news_sources_opt_out ON news_sources (tdm_opt_out)
WHERE
    tdm_opt_out = true;

CREATE INDEX IF NOT EXISTS idx_tdm_cleanup_log_run_at ON tdm_cleanup_log (run_at DESC);