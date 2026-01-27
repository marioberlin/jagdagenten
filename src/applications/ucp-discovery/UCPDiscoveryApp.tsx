/**
 * UCP Discovery App
 *
 * Dashboard for managing the UCP Merchant Discovery Crawler.
 * Features:
 * - Merchant registry with filtering
 * - Crawler controls (full/incremental crawl)
 * - Statistics and health monitoring
 * - Manual domain addition
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Globe, Search, RefreshCw, Play, Plus, Trash2,
  CheckCircle, XCircle, Activity,
  BarChart3, Shield, Zap, ExternalLink, Database,
  Download, Upload, Bell, Timer, StopCircle, Loader2,
} from 'lucide-react';

// Types
interface Merchant {
  id: string;
  domain: string;
  region: 'EU' | 'US' | 'CA' | 'OTHER';
  score: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CrawlState {
  merchantId: string;
  nextCheckAt: string;
  consecutiveFailures: number;
  lastSuccessAt?: string;
  lastErrorAt?: string;
  healthTier: 'A' | 'B' | 'C';
}

interface CrawlerStatus {
  isRunning: boolean;
  lastRunAt?: string;
  lastRunDuration?: number;
  merchantsProcessed?: number;
  currentPhase?: string;
  config: {
    concurrency: number;
    perDomainConcurrency: number;
    connectTimeout: number;
    requestTimeout: number;
    maxRedirects: number;
    userAgent: string;
    selectedRegion: string;
  };
}

interface Stats {
  totalMerchants: number;
  activeMerchants: number;
  byRegion: Record<string, number>;
  byHealthTier: Record<string, number>;
  validPercentage: number;
  withA2A: number;
  lastCrawlAt?: string;
  lastCrawlDuration?: number;
}

interface SchedulerStatus {
  running: boolean;
}

interface Notification {
  id: string;
  type: 'tier_change' | 'new_a2a' | 'crawl_errors' | 'crawl_complete';
  severity: 'info' | 'warn' | 'error';
  title: string;
  message: string;
  merchantId?: string;
  domain?: string;
  timestamp: string;
}

interface CrawlerProgress {
  type: 'started' | 'progress' | 'completed' | 'error' | 'connected';
  phase?: string;
  current?: number;
  total?: number;
  domain?: string;
  message?: string;
  stats?: { newMerchants: number; updatedMerchants: number; errors: number };
}

interface MerchantDetails {
  merchant: Merchant;
  sources: Array<{ sourceType: string; sourceUrl: string; discoveredAt: string }>;
  profile?: {
    ucpVersion: string;
    hasA2A: boolean;
    a2aAgentCardUrl?: string;
    capabilities: Array<{ name: string; version: string }>;
  };
  agentCard?: {
    name: string;
    description?: string;
    skills: Array<{ id: string; name: string }>;
  };
  validationResults: Array<{ severity: string; code: string; message: string }>;
  crawlState: CrawlState;
  latestFetch?: {
    fetchedAt: string;
    statusCode: number;
    latencyMs: number;
    error?: string;
  };
}

const API_BASE = '/api/ucp-discovery';

export const UCPDiscoveryApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'registry' | 'crawler' | 'stats'>('registry');
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [crawlerStatus, setCrawlerStatus] = useState<CrawlerStatus | null>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantDetails | null>(null);
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [crawlerProgress, setCrawlerProgress] = useState<CrawlerProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Filters
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [healthFilter, setHealthFilter] = useState<string>('');
  const [hasA2AFilter, setHasA2AFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Add domain modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [newRegion, setNewRegion] = useState<string>('');

  // Fetch merchants
  const fetchMerchants = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (regionFilter) params.set('region', regionFilter);
      if (healthFilter) params.set('healthTier', healthFilter);
      if (hasA2AFilter) params.set('hasA2A', 'true');
      params.set('pageSize', '100');

      const res = await fetch(`${API_BASE}/merchants?${params}`);
      const data = await res.json();
      setMerchants(data.merchants || []);
    } catch (err) {
      setError('Failed to fetch merchants');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [regionFilter, healthFilter, hasA2AFilter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  // Fetch crawler status
  const fetchCrawlerStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/crawl/status`);
      const data = await res.json();
      setCrawlerStatus(data);
    } catch (err) {
      console.error('Failed to fetch crawler status:', err);
    }
  }, []);

  // Fetch scheduler status
  const fetchSchedulerStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/scheduler/status`);
      const data = await res.json();
      setSchedulerStatus(data);
    } catch (err) {
      console.error('Failed to fetch scheduler status:', err);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications?limit=10`);
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, []);

  // Fetch merchant details
  const fetchMerchantDetails = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/merchants/${id}`);
      const data = await res.json();
      setSelectedMerchant(data);
    } catch (err) {
      console.error('Failed to fetch merchant details:', err);
    }
  }, []);

  // Run full crawl
  const runFullCrawl = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/crawl/full`, { method: 'POST' });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        await fetchCrawlerStatus();
        await fetchStats();
        await fetchMerchants();
      }
    } catch (err) {
      setError('Failed to start crawl');
    } finally {
      setIsLoading(false);
    }
  };

  // Run incremental crawl
  const runIncrementalCrawl = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/crawl/incremental`, { method: 'POST' });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        await fetchCrawlerStatus();
        await fetchStats();
        await fetchMerchants();
      }
    } catch (err) {
      setError('Failed to start incremental crawl');
    } finally {
      setIsLoading(false);
    }
  };

  // Add domain
  const addDomain = async () => {
    if (!newDomain.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/merchants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain, region: newRegion || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewDomain('');
        setNewRegion('');
        await fetchMerchants();
        await fetchStats();
      } else {
        setError(data.error || 'Failed to add domain');
      }
    } catch (err) {
      setError('Failed to add domain');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove merchant
  const removeMerchant = async (domain: string) => {
    if (!confirm(`Remove ${domain} from the registry?`)) return;
    try {
      await fetch(`${API_BASE}/merchants/${encodeURIComponent(domain)}`, { method: 'DELETE' });
      await fetchMerchants();
      await fetchStats();
      setSelectedMerchant(null);
    } catch (err) {
      setError('Failed to remove merchant');
    }
  };

  // Toggle scheduler
  const toggleScheduler = async () => {
    try {
      const endpoint = schedulerStatus?.running ? 'stop' : 'start';
      const res = await fetch(`${API_BASE}/scheduler/${endpoint}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchSchedulerStatus();
      } else {
        setError(data.error || `Failed to ${endpoint} scheduler`);
      }
    } catch (err) {
      setError('Failed to toggle scheduler');
    }
  };

  // Export registry
  const exportRegistry = async () => {
    try {
      const res = await fetch(`${API_BASE}/export`);
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ucp-registry-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export registry');
    }
  };

  // Import registry
  const importRegistry = async (file: File) => {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch(`${API_BASE}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: json.data, merge: true }),
      });
      const result = await res.json();
      if (result.success) {
        await fetchMerchants();
        await fetchStats();
        setError(null);
      } else {
        setError(result.error || 'Import failed');
      }
    } catch (err) {
      setError('Invalid import file format');
    }
  };

  // WebSocket connection for crawler progress
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ucp-discovery/crawl/progress`;

    const connect = () => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as CrawlerProgress;
          setCrawlerProgress(data);

          // When crawl completes, refresh data
          if (data.type === 'completed') {
            fetchMerchants();
            fetchStats();
            fetchCrawlerStatus();
            // Clear progress after showing completion for a moment
            setTimeout(() => setCrawlerProgress(null), 3000);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        // Attempt to reconnect after 5 seconds
        setTimeout(connect, 5000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
      };
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Initial load
  useEffect(() => {
    fetchMerchants();
    fetchStats();
    fetchCrawlerStatus();
    fetchSchedulerStatus();
    fetchNotifications();
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    fetchMerchants();
  }, [regionFilter, healthFilter, hasA2AFilter]);

  // Filter merchants by search
  const filteredMerchants = merchants.filter(m =>
    m.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-glass-base rounded-b-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
            <Globe size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">UCP Discovery</h1>
            <p className="text-xs text-white/50">Merchant Registry Crawler</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Export Button */}
          <button
            onClick={exportRegistry}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm transition-all"
            title="Export Registry"
          >
            <Download size={14} />
            <span>Export</span>
          </button>

          {/* Import Button */}
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm transition-all cursor-pointer">
            <Upload size={14} />
            <span>Import</span>
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importRegistry(file);
                e.target.value = '';
              }}
              className="hidden"
            />
          </label>

          {/* Notifications indicator */}
          {notifications.length > 0 && (
            <button
              onClick={fetchNotifications}
              className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-sm transition-all"
            >
              <Bell size={14} />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-500 text-xs text-black font-bold flex items-center justify-center">
                {notifications.length}
              </span>
            </button>
          )}

          <button
            onClick={() => { fetchMerchants(); fetchStats(); fetchCrawlerStatus(); fetchSchedulerStatus(); fetchNotifications(); }}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <XCircle size={16} className="text-red-400" />
          <span className="text-sm text-red-400">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
            <XCircle size={14} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 border-b border-white/5">
        <TabButton
          icon={<Database size={16} />}
          label="Registry"
          isActive={activeTab === 'registry'}
          onClick={() => setActiveTab('registry')}
          badge={stats?.totalMerchants}
        />
        <TabButton
          icon={<Activity size={16} />}
          label="Crawler"
          isActive={activeTab === 'crawler'}
          onClick={() => setActiveTab('crawler')}
        />
        <TabButton
          icon={<BarChart3 size={16} />}
          label="Statistics"
          isActive={activeTab === 'stats'}
          onClick={() => setActiveTab('stats')}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'registry' && (
          <RegistryTab
            merchants={filteredMerchants}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            regionFilter={regionFilter}
            setRegionFilter={setRegionFilter}
            healthFilter={healthFilter}
            setHealthFilter={setHealthFilter}
            hasA2AFilter={hasA2AFilter}
            setHasA2AFilter={setHasA2AFilter}
            selectedMerchant={selectedMerchant}
            onSelectMerchant={fetchMerchantDetails}
            onRemoveMerchant={removeMerchant}
            onAddDomain={() => setShowAddModal(true)}
            isLoading={isLoading}
          />
        )}
        {activeTab === 'crawler' && (
          <CrawlerTab
            status={crawlerStatus}
            schedulerStatus={schedulerStatus}
            notifications={notifications}
            crawlerProgress={crawlerProgress}
            onRunFull={runFullCrawl}
            onRunIncremental={runIncrementalCrawl}
            onToggleScheduler={toggleScheduler}
            isLoading={isLoading}
          />
        )}
        {activeTab === 'stats' && (
          <StatsTab stats={stats} />
        )}
      </div>

      {/* Add Domain Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-glass-elevated rounded-xl border border-white/10 p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Add Domain</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Domain</label>
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="example.com"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Region (optional)</label>
                <select
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="">Auto-detect</option>
                  <option value="EU">EU</option>
                  <option value="US">US</option>
                  <option value="CA">CA</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={addDomain}
                  disabled={!newDomain.trim() || isLoading}
                  className="px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm disabled:opacity-50"
                >
                  Add Domain
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Tab Button Component
const TabButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}> = ({ icon, label, isActive, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
      isActive
        ? 'border-blue-500 text-blue-400'
        : 'border-transparent text-white/50 hover:text-white/70'
    }`}
  >
    {icon}
    <span className="text-sm">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs">
        {badge}
      </span>
    )}
  </button>
);

// Registry Tab
const RegistryTab: React.FC<{
  merchants: Merchant[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  regionFilter: string;
  setRegionFilter: (r: string) => void;
  healthFilter: string;
  setHealthFilter: (h: string) => void;
  hasA2AFilter: boolean;
  setHasA2AFilter: (v: boolean) => void;
  selectedMerchant: MerchantDetails | null;
  onSelectMerchant: (id: string) => void;
  onRemoveMerchant: (domain: string) => void;
  onAddDomain: () => void;
  isLoading: boolean;
}> = ({
  merchants,
  searchQuery,
  setSearchQuery,
  regionFilter,
  setRegionFilter,
  healthFilter,
  setHealthFilter,
  hasA2AFilter,
  setHasA2AFilter,
  selectedMerchant,
  onSelectMerchant,
  onRemoveMerchant,
  onAddDomain,
  isLoading,
}) => (
  <div className="flex h-full">
    {/* Merchant List */}
    <div className="w-1/2 border-r border-white/5 flex flex-col">
      {/* Search & Filters */}
      <div className="p-4 space-y-3 border-b border-white/5">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search domains..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm"
          >
            <option value="">All Regions</option>
            <option value="EU">EU</option>
            <option value="US">US</option>
            <option value="CA">CA</option>
            <option value="OTHER">Other</option>
          </select>
          <select
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm"
          >
            <option value="">All Health</option>
            <option value="A">Tier A (Healthy)</option>
            <option value="B">Tier B (Degraded)</option>
            <option value="C">Tier C (Failing)</option>
          </select>
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={hasA2AFilter}
              onChange={(e) => setHasA2AFilter(e.target.checked)}
              className="rounded"
            />
            Has A2A
          </label>
          <button
            onClick={onAddDomain}
            className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm"
          >
            <Plus size={14} />
            Add Domain
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && merchants.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw size={24} className="text-white/30 animate-spin" />
          </div>
        ) : merchants.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-white/30">
            <Globe size={32} className="mb-2" />
            <p>No merchants found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {merchants.map((merchant) => (
              <MerchantRow
                key={merchant.id}
                merchant={merchant}
                isSelected={selectedMerchant?.merchant.id === merchant.id}
                onClick={() => onSelectMerchant(merchant.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Detail Panel */}
    <div className="w-1/2 overflow-y-auto">
      {selectedMerchant ? (
        <MerchantDetailPanel
          details={selectedMerchant}
          onRemove={() => onRemoveMerchant(selectedMerchant.merchant.domain)}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-white/30">
          <Search size={32} className="mb-2" />
          <p>Select a merchant to view details</p>
        </div>
      )}
    </div>
  </div>
);

// Merchant Row
const MerchantRow: React.FC<{
  merchant: Merchant;
  isSelected: boolean;
  onClick: () => void;
}> = ({ merchant, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full p-4 text-left hover:bg-white/5 transition-all ${
      isSelected ? 'bg-blue-500/10 border-l-2 border-blue-500' : ''
    }`}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${
          merchant.isActive ? 'bg-green-400' : 'bg-red-400'
        }`} />
        <span className="text-white font-medium">{merchant.domain}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded text-xs ${
          merchant.region === 'EU' ? 'bg-blue-500/20 text-blue-400' :
          merchant.region === 'US' ? 'bg-green-500/20 text-green-400' :
          merchant.region === 'CA' ? 'bg-red-500/20 text-red-400' :
          'bg-gray-500/20 text-gray-400'
        }`}>
          {merchant.region}
        </span>
        <ScoreBadge score={merchant.score} />
      </div>
    </div>
    <div className="mt-1 text-xs text-white/40">
      Updated {new Date(merchant.updatedAt).toLocaleDateString()}
    </div>
  </button>
);

// Score Badge
const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const color = score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400';
  return (
    <span className={`text-sm font-medium ${color}`}>
      {score}
    </span>
  );
};

// Merchant Detail Panel
const MerchantDetailPanel: React.FC<{
  details: MerchantDetails;
  onRemove: () => void;
}> = ({ details, onRemove }) => (
  <div className="p-4 space-y-4">
    {/* Header */}
    <div className="flex items-start justify-between">
      <div>
        <h2 className="text-xl font-semibold text-white">{details.merchant.domain}</h2>
        <div className="flex items-center gap-2 mt-1">
          <span className={`px-2 py-0.5 rounded text-xs ${
            details.merchant.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {details.merchant.isActive ? 'Active' : 'Inactive'}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs ${
            details.crawlState.healthTier === 'A' ? 'bg-green-500/20 text-green-400' :
            details.crawlState.healthTier === 'B' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            Tier {details.crawlState.healthTier}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={`https://${details.merchant.domain}/.well-known/ucp`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60"
        >
          <ExternalLink size={16} />
        </a>
        <button
          onClick={onRemove}
          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>

    {/* Score */}
    <div className="p-4 rounded-xl bg-white/5">
      <div className="flex items-center justify-between">
        <span className="text-white/60">Score</span>
        <span className="text-2xl font-bold text-white">{details.merchant.score}/100</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full transition-all ${
            details.merchant.score >= 70 ? 'bg-green-500' :
            details.merchant.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${details.merchant.score}%` }}
        />
      </div>
    </div>

    {/* Profile Info */}
    {details.profile && (
      <div className="p-4 rounded-xl bg-white/5 space-y-3">
        <h3 className="text-sm font-medium text-white/60">UCP Profile</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-xs text-white/40">Version</span>
            <p className="text-white">{details.profile.ucpVersion}</p>
          </div>
          <div>
            <span className="text-xs text-white/40">A2A Support</span>
            <p className="text-white flex items-center gap-1">
              {details.profile.hasA2A ? (
                <><CheckCircle size={14} className="text-green-400" /> Yes</>
              ) : (
                <><XCircle size={14} className="text-red-400" /> No</>
              )}
            </p>
          </div>
        </div>
        {details.profile.capabilities.length > 0 && (
          <div>
            <span className="text-xs text-white/40">Capabilities</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {details.profile.capabilities.map((cap, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs">
                  {cap.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    )}

    {/* Agent Card */}
    {details.agentCard && (
      <div className="p-4 rounded-xl bg-white/5 space-y-3">
        <h3 className="text-sm font-medium text-white/60">Agent Card</h3>
        <p className="text-white font-medium">{details.agentCard.name}</p>
        {details.agentCard.description && (
          <p className="text-sm text-white/60">{details.agentCard.description}</p>
        )}
        {details.agentCard.skills.length > 0 && (
          <div>
            <span className="text-xs text-white/40">Skills ({details.agentCard.skills.length})</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {details.agentCard.skills.slice(0, 5).map((skill) => (
                <span key={skill.id} className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-xs">
                  {skill.name}
                </span>
              ))}
              {details.agentCard.skills.length > 5 && (
                <span className="px-2 py-0.5 rounded bg-white/10 text-white/40 text-xs">
                  +{details.agentCard.skills.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    )}

    {/* Validation Results */}
    {details.validationResults.length > 0 && (
      <div className="p-4 rounded-xl bg-white/5 space-y-2">
        <h3 className="text-sm font-medium text-white/60">Validation Results</h3>
        {details.validationResults.map((result, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg text-xs ${
              result.severity === 'error' ? 'bg-red-500/10 text-red-400' :
              result.severity === 'warn' ? 'bg-yellow-500/10 text-yellow-400' :
              'bg-blue-500/10 text-blue-400'
            }`}
          >
            <span className="font-mono">{result.code}</span>: {result.message}
          </div>
        ))}
      </div>
    )}

    {/* Latest Fetch */}
    {details.latestFetch && (
      <div className="p-4 rounded-xl bg-white/5 space-y-2">
        <h3 className="text-sm font-medium text-white/60">Latest Fetch</h3>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <span className="text-xs text-white/40">Status</span>
            <p className={details.latestFetch.statusCode === 200 ? 'text-green-400' : 'text-red-400'}>
              {details.latestFetch.statusCode}
            </p>
          </div>
          <div>
            <span className="text-xs text-white/40">Latency</span>
            <p className="text-white">{details.latestFetch.latencyMs}ms</p>
          </div>
          <div>
            <span className="text-xs text-white/40">Time</span>
            <p className="text-white">{new Date(details.latestFetch.fetchedAt).toLocaleString()}</p>
          </div>
        </div>
        {details.latestFetch.error && (
          <p className="text-xs text-red-400">{details.latestFetch.error}</p>
        )}
      </div>
    )}

    {/* Sources */}
    {details.sources.length > 0 && (
      <div className="p-4 rounded-xl bg-white/5 space-y-2">
        <h3 className="text-sm font-medium text-white/60">Discovery Sources</h3>
        {details.sources.map((source, i) => (
          <div key={i} className="text-xs text-white/60">
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 mr-2">
              {source.sourceType}
            </span>
            {source.sourceUrl}
          </div>
        ))}
      </div>
    )}
  </div>
);

// Crawler Tab
const CrawlerTab: React.FC<{
  status: CrawlerStatus | null;
  schedulerStatus: SchedulerStatus | null;
  notifications: Notification[];
  crawlerProgress: CrawlerProgress | null;
  onRunFull: () => void;
  onRunIncremental: () => void;
  onToggleScheduler: () => void;
  isLoading: boolean;
}> = ({ status, schedulerStatus, notifications, crawlerProgress, onRunFull, onRunIncremental, onToggleScheduler, isLoading }) => (
  <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
    {/* Live Progress */}
    {crawlerProgress && crawlerProgress.type !== 'connected' && (
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-center gap-3 mb-2">
          <Loader2 size={18} className="text-blue-400 animate-spin" />
          <h3 className="text-lg font-semibold text-blue-400">
            {crawlerProgress.type === 'started' ? 'Starting Crawl...' :
             crawlerProgress.type === 'progress' ? `Crawling: ${crawlerProgress.phase || 'Processing'}` :
             crawlerProgress.type === 'completed' ? 'Crawl Complete!' :
             crawlerProgress.type === 'error' ? 'Error' : 'Processing'}
          </h3>
        </div>
        {crawlerProgress.domain && (
          <p className="text-sm text-blue-300/70 mb-2">Current: {crawlerProgress.domain}</p>
        )}
        {crawlerProgress.current !== undefined && crawlerProgress.total !== undefined && (
          <>
            <div className="h-2 rounded-full bg-blue-500/20 overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${Math.round((crawlerProgress.current / crawlerProgress.total) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-blue-300/50 mt-1">
              {crawlerProgress.current} / {crawlerProgress.total} ({Math.round((crawlerProgress.current / crawlerProgress.total) * 100)}%)
            </p>
          </>
        )}
        {crawlerProgress.stats && (
          <div className="flex gap-4 mt-2 text-xs">
            <span className="text-green-400">+{crawlerProgress.stats.newMerchants} new</span>
            <span className="text-blue-400">{crawlerProgress.stats.updatedMerchants} updated</span>
            {crawlerProgress.stats.errors > 0 && (
              <span className="text-red-400">{crawlerProgress.stats.errors} errors</span>
            )}
          </div>
        )}
        {crawlerProgress.message && (
          <p className="text-sm text-white/60 mt-2">{crawlerProgress.message}</p>
        )}
      </div>
    )}

    {/* Status Card */}
    <div className="p-4 rounded-xl bg-white/5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Crawler Status</h3>
        <span className={`px-3 py-1 rounded-full text-sm ${
          status?.isRunning ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/60'
        }`}>
          {status?.isRunning ? 'Running' : 'Idle'}
        </span>
      </div>

      {status?.lastRunAt && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <span className="text-xs text-white/40">Last Run</span>
            <p className="text-white">{new Date(status.lastRunAt).toLocaleString()}</p>
          </div>
          {status.lastRunDuration && (
            <div>
              <span className="text-xs text-white/40">Duration</span>
              <p className="text-white">{(status.lastRunDuration / 1000).toFixed(1)}s</p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onRunFull}
          disabled={status?.isRunning || isLoading}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 disabled:opacity-50"
        >
          <Play size={16} />
          Full Crawl
        </button>
        <button
          onClick={onRunIncremental}
          disabled={status?.isRunning || isLoading}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Incremental
        </button>
      </div>
    </div>

    {/* Scheduler Control */}
    <div className="p-4 rounded-xl bg-white/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Timer size={18} className="text-white/60" />
          <h3 className="text-lg font-semibold text-white">Background Scheduler</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${
          schedulerStatus?.running ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/60'
        }`}>
          {schedulerStatus?.running ? 'Active' : 'Stopped'}
        </span>
      </div>
      <p className="text-sm text-white/50 mb-4">
        When active, the scheduler automatically runs incremental crawls every hour to keep the registry up to date.
      </p>
      <button
        onClick={onToggleScheduler}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg transition-colors ${
          schedulerStatus?.running
            ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
            : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400'
        }`}
      >
        {schedulerStatus?.running ? (
          <>
            <StopCircle size={16} />
            Stop Scheduler
          </>
        ) : (
          <>
            <Timer size={16} />
            Start Scheduler
          </>
        )}
      </button>
    </div>

    {/* Notifications */}
    {notifications.length > 0 && (
      <div className="p-4 rounded-xl bg-white/5">
        <div className="flex items-center gap-2 mb-3">
          <Bell size={18} className="text-white/60" />
          <h3 className="text-lg font-semibold text-white">Recent Notifications</h3>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3 rounded-lg text-sm ${
                notif.severity === 'error' ? 'bg-red-500/10 border-l-2 border-red-500' :
                notif.severity === 'warn' ? 'bg-yellow-500/10 border-l-2 border-yellow-500' :
                'bg-blue-500/10 border-l-2 border-blue-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-medium ${
                  notif.severity === 'error' ? 'text-red-400' :
                  notif.severity === 'warn' ? 'text-yellow-400' :
                  'text-blue-400'
                }`}>
                  {notif.title}
                </span>
                <span className="text-xs text-white/40">
                  {new Date(notif.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-white/60 text-xs mt-1">{notif.message}</p>
              {notif.domain && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded bg-white/10 text-white/50 text-xs">
                  {notif.domain}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Configuration */}
    {status?.config && (
      <div className="p-4 rounded-xl bg-white/5">
        <h3 className="text-sm font-medium text-white/60 mb-3">Configuration</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <ConfigItem label="Concurrency" value={status.config.concurrency} />
          <ConfigItem label="Per-Domain Concurrency" value={status.config.perDomainConcurrency} />
          <ConfigItem label="Connect Timeout" value={`${status.config.connectTimeout}ms`} />
          <ConfigItem label="Request Timeout" value={`${status.config.requestTimeout}ms`} />
          <ConfigItem label="Max Redirects" value={status.config.maxRedirects} />
          <ConfigItem label="Selected Region" value={status.config.selectedRegion} />
        </div>
        <div className="mt-3">
          <span className="text-xs text-white/40">User Agent</span>
          <p className="text-xs text-white/60 font-mono truncate">{status.config.userAgent}</p>
        </div>
      </div>
    )}
  </div>
);

const ConfigItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div>
    <span className="text-xs text-white/40">{label}</span>
    <p className="text-white">{value}</p>
  </div>
);

// Stats Tab
const StatsTab: React.FC<{ stats: Stats | null }> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full text-white/30">
        <RefreshCw size={24} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<Globe size={20} />}
          label="Total Merchants"
          value={stats.totalMerchants}
          color="blue"
        />
        <StatCard
          icon={<CheckCircle size={20} />}
          label="Active"
          value={stats.activeMerchants}
          color="green"
        />
        <StatCard
          icon={<Shield size={20} />}
          label="Valid Profile"
          value={`${stats.validPercentage.toFixed(0)}%`}
          color="purple"
        />
        <StatCard
          icon={<Zap size={20} />}
          label="With A2A"
          value={stats.withA2A}
          color="yellow"
        />
      </div>

      {/* By Region */}
      <div className="p-4 rounded-xl bg-white/5">
        <h3 className="text-sm font-medium text-white/60 mb-3">By Region</h3>
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(stats.byRegion).map(([region, count]) => (
            <div key={region} className="text-center">
              <p className="text-2xl font-bold text-white">{count}</p>
              <p className="text-xs text-white/40">{region}</p>
            </div>
          ))}
        </div>
      </div>

      {/* By Health Tier */}
      <div className="p-4 rounded-xl bg-white/5">
        <h3 className="text-sm font-medium text-white/60 mb-3">By Health Tier</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-green-500/10 text-center">
            <p className="text-2xl font-bold text-green-400">{stats.byHealthTier.A || 0}</p>
            <p className="text-xs text-green-400/60">Tier A (Healthy)</p>
          </div>
          <div className="p-3 rounded-lg bg-yellow-500/10 text-center">
            <p className="text-2xl font-bold text-yellow-400">{stats.byHealthTier.B || 0}</p>
            <p className="text-xs text-yellow-400/60">Tier B (Degraded)</p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 text-center">
            <p className="text-2xl font-bold text-red-400">{stats.byHealthTier.C || 0}</p>
            <p className="text-xs text-red-400/60">Tier C (Failing)</p>
          </div>
        </div>
      </div>

      {/* Last Crawl Info */}
      {stats.lastCrawlAt && (
        <div className="p-4 rounded-xl bg-white/5">
          <h3 className="text-sm font-medium text-white/60 mb-3">Last Crawl</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-white/40">Time</span>
              <p className="text-white">{new Date(stats.lastCrawlAt).toLocaleString()}</p>
            </div>
            {stats.lastCrawlDuration && (
              <div>
                <span className="text-xs text-white/40">Duration</span>
                <p className="text-white">{(stats.lastCrawlDuration / 1000).toFixed(1)} seconds</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}> = ({ icon, label, value, color }) => {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-400',
    purple: 'bg-purple-500/10 text-purple-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
  };

  return (
    <div className={`p-4 rounded-xl ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs opacity-60">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

export default UCPDiscoveryApp;
