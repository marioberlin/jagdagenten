/**
 * ObservabilityDashboard
 *
 * Admin dashboard for monitoring agent performance, tool calls,
 * guardrail statistics, and trace browsing.
 */

import { useState, useEffect } from 'react';
import {
  Activity,
  Shield,
  Zap,
  AlertTriangle,
  Clock,
  BarChart3,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ToolPerformance {
  toolName: string;
  totalCalls: number;
  avgDurationMs: number;
  p95DurationMs: number;
  successRate: number;
}

interface GuardrailStat {
  guardrailName: string;
  invocations: number;
  blocks: number;
  blockRate: number;
}

interface AgentTrace {
  id: string;
  sessionId: string;
  userId: string;
  rootAgent: string;
  startTime: string;
  endTime?: string;
  totalDurationMs?: number;
  handoffChain: string[];
  toolCallCount: number;
  guardrailTripCount: number;
  status: 'pending' | 'completed' | 'error';
}

interface HandoffAnalysis {
  chainDepth: number;
  traceCount: number;
  avgDurationMs: number;
  avgToolCalls: number;
}

// ============================================================================
// Component
// ============================================================================

const API = '/api/v1/admin/observability';

export function ObservabilityDashboard() {
  const [tools, setTools] = useState<ToolPerformance[]>([]);
  const [guardrails, setGuardrails] = useState<GuardrailStat[]>([]);
  const [traces, setTraces] = useState<AgentTrace[]>([]);
  const [handoffs, setHandoffs] = useState<HandoffAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTrace, setExpandedTrace] = useState<string | null>(null);
  const [tab, setTab] = useState<'tools' | 'guardrails' | 'traces' | 'handoffs'>('tools');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [toolsRes, guardsRes, tracesRes, handoffRes] = await Promise.all([
        fetch(`${API}/tool-performance`),
        fetch(`${API}/guardrails`),
        fetch(`${API}/traces?limit=20`),
        fetch(`${API}/handoffs`),
      ]);

      if (toolsRes.ok) {
        const d = await toolsRes.json();
        setTools(d.performance ?? []);
      }
      if (guardsRes.ok) {
        const d = await guardsRes.json();
        setGuardrails(d.guardrails ?? []);
      }
      if (tracesRes.ok) {
        const d = await tracesRes.json();
        setTraces(d.traces ?? []);
      }
      if (handoffRes.ok) {
        const d = await handoffRes.json();
        setHandoffs(d.analysis ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const totalCalls = tools.reduce((s, t) => s + t.totalCalls, 0);
  const errorTraces = traces.filter((t) => t.status === 'error').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Activity size={22} />
            Agent Observability
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Monitoring: Tool-Aufrufe, Guardrails, Agent-Traces
          </p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg border border-[var(--glass-border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--glass-surface-hover)] flex items-center gap-2"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Aktualisieren
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard icon={<Zap size={18} />} label="Tool-Aufrufe" value={totalCalls} color="blue" />
        <SummaryCard icon={<Shield size={18} />} label="Guardrail-Events" value={guardrails.reduce((s, g) => s + g.invocations, 0)} color="amber" />
        <SummaryCard icon={<BarChart3 size={18} />} label="Agent-Traces" value={traces.length} color="green" />
        <SummaryCard icon={<AlertTriangle size={18} />} label="Fehler" value={errorTraces} color="red" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--glass-border)]">
        {([
          { id: 'tools', label: 'Tool Performance' },
          { id: 'guardrails', label: 'Guardrails' },
          { id: 'traces', label: 'Traces' },
          { id: 'handoffs', label: 'Handoff-Analyse' },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-[var(--glass-accent)] text-[var(--glass-accent)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'tools' && (
        <div className="rounded-xl border border-[var(--glass-border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--glass-surface)] text-[var(--text-secondary)]">
                <th className="text-left px-4 py-2.5 font-medium">Tool</th>
                <th className="text-right px-4 py-2.5 font-medium">Aufrufe</th>
                <th className="text-right px-4 py-2.5 font-medium">Avg (ms)</th>
                <th className="text-right px-4 py-2.5 font-medium">p95 (ms)</th>
                <th className="text-right px-4 py-2.5 font-medium">Erfolgsrate</th>
              </tr>
            </thead>
            <tbody>
              {tools.map((t) => (
                <tr key={t.toolName} className="border-t border-[var(--glass-border)] hover:bg-[var(--glass-surface-hover)]">
                  <td className="px-4 py-2.5 font-mono text-[var(--text-primary)]">{t.toolName}</td>
                  <td className="px-4 py-2.5 text-right text-[var(--text-secondary)]">{t.totalCalls}</td>
                  <td className="px-4 py-2.5 text-right text-[var(--text-secondary)]">{t.avgDurationMs}</td>
                  <td className="px-4 py-2.5 text-right text-[var(--text-secondary)]">{t.p95DurationMs}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      t.successRate >= 0.95 ? 'bg-green-500/20 text-green-400' :
                      t.successRate >= 0.8 ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {(t.successRate * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
              {tools.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--text-tertiary)]">Keine Daten</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'guardrails' && (
        <div className="rounded-xl border border-[var(--glass-border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--glass-surface)] text-[var(--text-secondary)]">
                <th className="text-left px-4 py-2.5 font-medium">Guardrail</th>
                <th className="text-right px-4 py-2.5 font-medium">Aufrufe</th>
                <th className="text-right px-4 py-2.5 font-medium">Blockiert</th>
                <th className="text-right px-4 py-2.5 font-medium">Block-Rate</th>
              </tr>
            </thead>
            <tbody>
              {guardrails.map((g) => (
                <tr key={g.guardrailName} className="border-t border-[var(--glass-border)] hover:bg-[var(--glass-surface-hover)]">
                  <td className="px-4 py-2.5 font-mono text-[var(--text-primary)]">{g.guardrailName}</td>
                  <td className="px-4 py-2.5 text-right text-[var(--text-secondary)]">{g.invocations}</td>
                  <td className="px-4 py-2.5 text-right text-red-400">{g.blocks}</td>
                  <td className="px-4 py-2.5 text-right text-[var(--text-secondary)]">{(g.blockRate * 100).toFixed(1)}%</td>
                </tr>
              ))}
              {guardrails.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-[var(--text-tertiary)]">Keine Guardrail-Events</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'traces' && (
        <div className="space-y-2">
          {traces.map((trace) => (
            <div key={trace.id} className="rounded-xl border border-[var(--glass-border)] overflow-hidden">
              <button
                onClick={() => setExpandedTrace(expandedTrace === trace.id ? null : trace.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--glass-surface-hover)] transition-colors"
              >
                <span className={`w-2 h-2 rounded-full ${
                  trace.status === 'completed' ? 'bg-green-400' :
                  trace.status === 'error' ? 'bg-red-400' :
                  'bg-amber-400'
                }`} />
                <span className="font-mono text-sm text-[var(--text-primary)] flex-1 text-left">{trace.rootAgent}</span>
                <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                  <Zap size={12} /> {trace.toolCallCount} calls
                </span>
                {trace.totalDurationMs && (
                  <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                    <Clock size={12} /> {trace.totalDurationMs}ms
                  </span>
                )}
                {trace.guardrailTripCount > 0 && (
                  <span className="text-xs text-amber-400 flex items-center gap-1">
                    <Shield size={12} /> {trace.guardrailTripCount}
                  </span>
                )}
                {expandedTrace === trace.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {expandedTrace === trace.id && (
                <div className="px-4 pb-3 pt-1 border-t border-[var(--glass-border)] bg-[var(--glass-surface)]">
                  <div className="grid grid-cols-3 gap-4 text-xs text-[var(--text-secondary)]">
                    <div><strong>Session:</strong> {trace.sessionId}</div>
                    <div><strong>Start:</strong> {new Date(trace.startTime).toLocaleString('de-DE')}</div>
                    <div><strong>Status:</strong> <span className={trace.status === 'error' ? 'text-red-400' : 'text-green-400'}>{trace.status}</span></div>
                  </div>
                  {trace.handoffChain.length > 1 && (
                    <div className="mt-2 text-xs text-[var(--text-secondary)]">
                      <strong>Handoff-Kette:</strong> {trace.handoffChain.join(' → ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {traces.length === 0 && (
            <div className="text-center py-8 text-[var(--text-tertiary)]">Keine Traces</div>
          )}
        </div>
      )}

      {tab === 'handoffs' && (
        <div className="rounded-xl border border-[var(--glass-border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--glass-surface)] text-[var(--text-secondary)]">
                <th className="text-left px-4 py-2.5 font-medium">Ketten-Tiefe</th>
                <th className="text-right px-4 py-2.5 font-medium">Traces</th>
                <th className="text-right px-4 py-2.5 font-medium">Avg Dauer (ms)</th>
                <th className="text-right px-4 py-2.5 font-medium">Avg Tool-Calls</th>
              </tr>
            </thead>
            <tbody>
              {handoffs.map((h) => (
                <tr key={h.chainDepth} className="border-t border-[var(--glass-border)] hover:bg-[var(--glass-surface-hover)]">
                  <td className="px-4 py-2.5 text-[var(--text-primary)]">
                    <span className="font-mono">{h.chainDepth}</span>
                    <span className="text-[var(--text-tertiary)] ml-2">
                      {h.chainDepth === 1 ? '(direkt)' : `(${h.chainDepth - 1} Handoffs)`}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-[var(--text-secondary)]">{h.traceCount}</td>
                  <td className="px-4 py-2.5 text-right text-[var(--text-secondary)]">{h.avgDurationMs}</td>
                  <td className="px-4 py-2.5 text-right text-[var(--text-secondary)]">{h.avgToolCalls}</td>
                </tr>
              ))}
              {handoffs.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-[var(--text-tertiary)]">Keine Handoff-Daten</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Summary Card
// ============================================================================

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-400',
    amber: 'text-amber-400',
    green: 'text-green-400',
    red: 'text-red-400',
  };

  return (
    <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface)] p-4">
      <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
        <span className={colorMap[color] ?? 'text-[var(--text-secondary)]'}>{icon}</span>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-[var(--text-primary)]">{value}</div>
    </div>
  );
}
