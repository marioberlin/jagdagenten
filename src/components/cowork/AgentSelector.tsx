/**
 * AgentSelector
 *
 * Component for selecting between local and remote A2A agents.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Globe,
    Server,
    Check,
    Plus,
    X,
    Loader2
} from 'lucide-react';

import type { SelectedAgent, AgentCard } from '@/types/cowork';

interface AgentSelectorProps {
    selectedAgent: SelectedAgent | null;
    onSelect: (agent: SelectedAgent | null) => void;
    disabled?: boolean;
}

interface DiscoveredAgent {
    url: string;
    card: AgentCard;
    status: 'available' | 'unavailable' | 'checking';
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
    selectedAgent,
    onSelect,
    disabled
}) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [customUrl, setCustomUrl] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [discoveredAgents, setDiscoveredAgents] = useState<DiscoveredAgent[]>([]);
    const [isDiscovering, setIsDiscovering] = useState(false);

    // Discover local A2A agents
    useEffect(() => {
        discoverAgents();
    }, []);

    const discoverAgents = async () => {
        setIsDiscovering(true);

        const knownAgents = [
            '/.well-known/agent-card.json',
            'http://localhost:8000/.well-known/agent-card.json'
        ];

        const discovered: DiscoveredAgent[] = [];

        for (const url of knownAgents) {
            try {
                const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
                if (response.ok) {
                    const card = await response.json() as AgentCard;
                    discovered.push({
                        url: url.replace('/.well-known/agent-card.json', ''),
                        card,
                        status: 'available'
                    });
                }
            } catch {
                // Agent not available
            }
        }

        setDiscoveredAgents(discovered);
        setIsDiscovering(false);
    };

    const handleSelectLocal = () => {
        onSelect({ type: 'local' });
        setShowDropdown(false);
    };

    const handleSelectRemote = (agent: DiscoveredAgent) => {
        onSelect({
            type: 'remote',
            url: agent.url,
            card: agent.card
        });
        setShowDropdown(false);
    };

    const handleAddCustomAgent = async () => {
        if (!customUrl.trim()) return;

        try {
            const agentUrl = customUrl.endsWith('/')
                ? customUrl.slice(0, -1)
                : customUrl;

            const response = await fetch(`${agentUrl}/.well-known/agent-card.json`);
            if (response.ok) {
                const card = await response.json() as AgentCard;
                onSelect({
                    type: 'remote',
                    url: agentUrl,
                    card
                });
                setCustomUrl('');
                setShowCustomInput(false);
                setShowDropdown(false);
            }
        } catch (error) {
            console.error('Failed to connect to agent:', error);
        }
    };

    const getSelectedLabel = (): string => {
        if (!selectedAgent) return 'Select agent...';
        if (selectedAgent.type === 'local') return 'Local Agent';
        return selectedAgent.card.name || 'Remote Agent';
    };

    return (
        <div className="relative">
            {/* Selector Button */}
            <button
                onClick={() => !disabled && setShowDropdown(!showDropdown)}
                disabled={disabled}
                className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg
                    bg-white/5 hover:bg-white/10 border border-white/10
                    hover:border-white/20 transition-all text-left
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                type="button"
            >
                {selectedAgent?.type === 'remote' ? (
                    <Globe size={14} className="text-indigo-400" />
                ) : (
                    <Server size={14} className="text-white/60" />
                )}
                <span className="text-sm text-white/80">{getSelectedLabel()}</span>
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {showDropdown && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute top-full left-0 mt-2 w-72 rounded-xl
                                   bg-[#1a1a2e]/95 backdrop-blur-xl border border-white/10
                                   shadow-2xl z-50 overflow-hidden"
                    >
                        <div className="p-2">
                            {/* Local Agent */}
                            <button
                                onClick={handleSelectLocal}
                                className="w-full flex items-center gap-3 px-3 py-2.5
                                           rounded-lg hover:bg-white/5 transition-colors"
                                type="button"
                            >
                                <Server size={16} className="text-white/60" />
                                <div className="flex-1 text-left">
                                    <div className="text-sm text-white/90">Local Agent</div>
                                    <div className="text-xs text-white/40">
                                        Run tasks on this machine
                                    </div>
                                </div>
                                {selectedAgent?.type === 'local' && (
                                    <Check size={14} className="text-green-400" />
                                )}
                            </button>

                            {/* Divider */}
                            <div className="h-px bg-white/10 my-2" />

                            {/* Remote Agents Section */}
                            <div className="px-3 py-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-white/40 uppercase tracking-wider">
                                        Remote Agents
                                    </span>
                                    {isDiscovering && (
                                        <Loader2 size={12} className="animate-spin text-white/40" />
                                    )}
                                </div>
                            </div>

                            {/* Discovered Agents */}
                            {discoveredAgents.length > 0 ? (
                                discoveredAgents.map((agent) => (
                                    <button
                                        key={agent.url}
                                        onClick={() => handleSelectRemote(agent)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5
                                                   rounded-lg hover:bg-white/5 transition-colors"
                                        type="button"
                                    >
                                        <Globe size={16} className="text-indigo-400" />
                                        <div className="flex-1 text-left min-w-0">
                                            <div className="text-sm text-white/90 truncate">
                                                {agent.card.name}
                                            </div>
                                            <div className="text-xs text-white/40 truncate">
                                                {agent.url}
                                            </div>
                                        </div>
                                        {selectedAgent?.type === 'remote' &&
                                            selectedAgent.url === agent.url && (
                                                <Check size={14} className="text-green-400" />
                                            )}
                                    </button>
                                ))
                            ) : (
                                <div className="px-3 py-2 text-xs text-white/30">
                                    No agents discovered
                                </div>
                            )}

                            {/* Custom URL Input */}
                            {showCustomInput ? (
                                <div className="p-2 border-t border-white/10">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={customUrl}
                                            onChange={(e) => setCustomUrl(e.target.value)}
                                            placeholder="https://agent.example.com"
                                            className="flex-1 px-3 py-1.5 rounded-lg
                                                       bg-white/5 border border-white/10
                                                       text-sm text-white outline-none
                                                       focus:border-indigo-500/50"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomAgent()}
                                        />
                                        <button
                                            onClick={handleAddCustomAgent}
                                            className="px-3 py-1.5 rounded-lg bg-indigo-500
                                                       text-white text-sm"
                                            type="button"
                                        >
                                            Add
                                        </button>
                                        <button
                                            onClick={() => setShowCustomInput(false)}
                                            className="p-1.5 rounded-lg hover:bg-white/10"
                                            type="button"
                                        >
                                            <X size={14} className="text-white/60" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowCustomInput(true)}
                                    className="w-full flex items-center gap-2 px-3 py-2
                                               text-sm text-indigo-400 hover:bg-white/5
                                               transition-colors"
                                    type="button"
                                >
                                    <Plus size={14} />
                                    Add custom agent
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AgentSelector;
