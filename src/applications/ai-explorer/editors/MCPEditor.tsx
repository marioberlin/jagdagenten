import React, { useState } from 'react';
import { Save, Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { AIResource } from '@/stores/resourceStore';

interface MCPEditorProps {
  resource: AIResource;
  onSave: (updates: Partial<AIResource>) => Promise<void>;
}

type TransportType = 'stdio' | 'sse' | 'http' | 'websocket';

export const MCPEditor: React.FC<MCPEditorProps> = ({ resource, onSave }) => {
  const meta = resource.typeMetadata as any;
  const [serverUrl, setServerUrl] = useState(meta?.serverUrl || '');
  const [transport, setTransport] = useState<TransportType>(meta?.transport || 'stdio');
  const [command, setCommand] = useState(meta?.command || '');
  const [args, setArgs] = useState(meta?.args?.join(' ') || '');
  const [description, setDescription] = useState(resource.description || '');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('');
    try {
      const response = await fetch('/api/mcp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverUrl,
          transport,
          command,
          args: args.split(' ').filter(Boolean),
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setTestStatus('success');
        setTestMessage(`Connected. ${data.capabilities?.length || 0} capabilities available.`);
      } else {
        setTestStatus('error');
        const err = await response.text();
        setTestMessage(err || 'Connection failed');
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(err.message || 'Connection failed');
    }
  };

  const handleSave = () => {
    onSave({
      description,
      typeMetadata: {
        ...meta,
        type: 'mcp',
        serverUrl,
        transport,
        command: transport === 'stdio' ? command : undefined,
        args: transport === 'stdio' ? args.split(' ').filter(Boolean) : undefined,
      },
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Description */}
      <div>
        <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
          Description
        </label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this MCP server provide?"
          className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 placeholder-white/25 outline-none focus:border-purple-500/30"
        />
      </div>

      {/* Transport Type */}
      <div>
        <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
          Transport
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {(['stdio', 'sse', 'http', 'websocket'] as TransportType[]).map(t => (
            <button
              key={t}
              onClick={() => setTransport(t)}
              className={`px-2 py-1.5 rounded text-[10px] font-medium border transition-colors ${
                transport === t
                  ? 'bg-purple-500/20 border-purple-500/30 text-purple-400'
                  : 'bg-white/[0.03] border-white/10 text-white/40 hover:text-white/60'
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Server URL (for non-stdio) */}
      {transport !== 'stdio' && (
        <div>
          <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
            Server URL
          </label>
          <input
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder={transport === 'sse' ? 'http://localhost:3001/sse' : 'http://localhost:3001'}
            className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 placeholder-white/25 outline-none focus:border-purple-500/30 font-mono"
          />
        </div>
      )}

      {/* Command + Args (for stdio) */}
      {transport === 'stdio' && (
        <>
          <div>
            <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
              Command
            </label>
            <input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="npx, node, python..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 placeholder-white/25 outline-none focus:border-purple-500/30 font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
              Arguments
            </label>
            <input
              value={args}
              onChange={(e) => setArgs(e.target.value)}
              placeholder="-y @modelcontextprotocol/server-filesystem /path"
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 placeholder-white/25 outline-none focus:border-purple-500/30 font-mono"
            />
          </div>
        </>
      )}

      {/* Test Connection */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleTestConnection}
          disabled={testStatus === 'testing'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/60 hover:text-white/80 transition-colors disabled:opacity-50"
        >
          {testStatus === 'testing' ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Play size={12} />
          )}
          Test Connection
        </button>
        {testStatus === 'success' && (
          <span className="flex items-center gap-1 text-[10px] text-green-400">
            <CheckCircle size={10} />
            {testMessage}
          </span>
        )}
        {testStatus === 'error' && (
          <span className="flex items-center gap-1 text-[10px] text-red-400">
            <XCircle size={10} />
            {testMessage}
          </span>
        )}
      </div>

      {/* Capabilities Display */}
      {meta?.capabilities && meta.capabilities.length > 0 && (
        <div>
          <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
            Capabilities
          </label>
          <div className="flex flex-wrap gap-1.5">
            {meta.capabilities.map((cap: string) => (
              <span key={cap} className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-400 font-mono">
                {cap}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/20 text-xs text-purple-400 transition-colors"
      >
        <Save size={12} />
        Save MCP Server
      </button>
    </div>
  );
};
