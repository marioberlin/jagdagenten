/**
 * AppEditor
 *
 * Edit interface for previously built apps. Allows describing changes
 * in natural language and generates a focused edit PRD.
 */

import { useState, useCallback } from 'react';
import { Pencil, Send, Loader2, Check, X } from 'lucide-react';
import { useBuilderStore } from '../store';

interface EditMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AppEditorProps {
  appId: string;
}

const API_BASE = '/api/builder';

export function AppEditor({ appId }: AppEditorProps) {
  const { setTab } = useBuilderStore();
  const [messages, setMessages] = useState<EditMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editBuildId, setEditBuildId] = useState<string | null>(null);
  const [editPhase, setEditPhase] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isSubmitting) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/apps/${appId}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: userMessage }),
      });
      const data = await res.json();

      if (data.id) {
        setEditBuildId(data.id);
        setEditPhase(data.phase || 'planning');
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Edit build created (${data.id}). Phase: ${data.phase || 'planning'}. ${
            data.plan?.prd?.userStories?.length
              ? `${data.plan.prd.userStories.length} stories planned.`
              : 'Generating plan...'
          }`,
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.error || 'Edit request submitted.',
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : 'Failed to submit edit'}`,
      }]);
    } finally {
      setIsSubmitting(false);
    }
  }, [input, isSubmitting, appId]);

  const handleApprove = async () => {
    if (!editBuildId) return;
    setIsSubmitting(true);
    try {
      await fetch(`${API_BASE}/builds/${editBuildId}/execute`, { method: 'POST' });
      setEditPhase('implementing');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Edit approved. Build executing...',
      }]);
      // Switch to active tab to monitor
      setTab('active');
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Failed to start edit: ${err instanceof Error ? err.message : 'unknown error'}`,
      }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditBuildId(null);
    setEditPhase(null);
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Edit cancelled.',
    }]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <Pencil size={14} className="text-accent" />
        <span className="text-xs font-semibold text-primary">Editing: {appId}</span>
        {editPhase && (
          <span className="text-xs text-accent ml-auto bg-accent/10 px-2 py-0.5 rounded">
            {editPhase}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-xs text-secondary text-center py-8">
            Describe what you want to change in this app.
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-xs p-3 rounded-lg ${
              msg.role === 'user'
                ? 'bg-accent/10 border border-accent/20 text-primary ml-8'
                : 'bg-white/5 border border-white/10 text-primary/80 mr-8'
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>

      {/* Approval buttons */}
      {editBuildId && editPhase === 'planning' && (
        <div className="flex gap-2 px-4 py-2 border-t border-white/10">
          <button
            onClick={handleApprove}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50 transition-colors"
          >
            <Check size={14} />
            Apply Changes
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg bg-white/5 text-secondary hover:text-primary hover:bg-white/10 transition-colors"
          >
            <X size={14} />
            Cancel
          </button>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 p-4 border-t border-white/10">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Describe changes..."
          disabled={isSubmitting}
          className="flex-1 px-3 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-primary placeholder:text-secondary/50 focus:outline-none focus:border-accent/50 disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !input.trim()}
          className="p-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  );
}
