-- ============================================================================
-- Agent Observability Schema
-- ============================================================================
-- Tracing tables for tool calls and handoff observability
-- ============================================================================

-- Tool Call Audit Log
CREATE TABLE IF NOT EXISTS tool_call_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_name TEXT NOT NULL,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    tier INTEGER NOT NULL CHECK (tier >= 0 AND tier <= 3),
    params JSONB NOT NULL DEFAULT '{}'::jsonb,
    result_status TEXT NOT NULL,
    duration_ms INTEGER,
    guardrails_applied JSONB DEFAULT '[]'::jsonb,
    redactions JSONB DEFAULT '[]'::jsonb,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Traces (full conversation trace)
CREATE TABLE IF NOT EXISTS agent_traces (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    root_agent TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    total_duration_ms INTEGER,
    handoff_chain JSONB DEFAULT '[]'::jsonb,
    tool_call_count INTEGER DEFAULT 0,
    guardrail_trip_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    spans_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_tool_call_log_user ON tool_call_log (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_call_log_session ON tool_call_log (session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_call_log_tool ON tool_call_log (tool_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_call_log_tier ON tool_call_log (tier)
WHERE
    tier >= 2;

CREATE INDEX IF NOT EXISTS idx_agent_traces_session ON agent_traces (session_id, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_agent_traces_user ON agent_traces (user_id, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_agent_traces_status ON agent_traces (status)
WHERE
    status = 'error';

-- Guardrail Statistics View
CREATE OR REPLACE VIEW guardrail_stats AS
SELECT
    jsonb_array_elements_text (guardrails_applied) as guardrail_name,
    COUNT(*) as invocations,
    SUM(
        CASE
            WHEN result_status = 'blocked' THEN 1
            ELSE 0
        END
    ) as blocks,
    AVG(duration_ms) as avg_duration_ms,
    DATE_TRUNC ('day', created_at) as day
FROM tool_call_log
WHERE
    jsonb_array_length (guardrails_applied) > 0
GROUP BY
    guardrail_name,
    day;

-- Tool Performance View
CREATE OR REPLACE VIEW tool_performance AS
SELECT
    tool_name,
    tier,
    COUNT(*) as total_calls,
    AVG(duration_ms) as avg_duration_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration_ms,
    SUM(CASE WHEN result_status = 'ok' THEN 1 ELSE 0 END)::float / COUNT(*) as success_rate,
    DATE_TRUNC('hour', created_at) as hour
FROM tool_call_log
GROUP BY tool_name, tier, hour;

-- Handoff Chain Analysis View
CREATE OR REPLACE VIEW handoff_analysis AS
SELECT
    root_agent,
    jsonb_array_length(handoff_chain::jsonb) as chain_length,
    COUNT(*) as trace_count,
    AVG(total_duration_ms) as avg_duration_ms,
    AVG(tool_call_count) as avg_tool_calls,
    DATE_TRUNC('day', start_time) as day
FROM agent_traces
WHERE status = 'completed'
GROUP BY root_agent, chain_length, day;