/**
 * Agent Badge Component
 *
 * Displays the current agent role with an icon and German name.
 * Shows which specialist is handling the current message.
 */

import { Compass, FileText, Crosshair, BookOpen, Users, MessageCircle, Newspaper, Shield, Eye, Zap } from 'lucide-react';

export type AgentRole =
    | 'router'
    | 'scout'
    | 'bureaucracy'
    | 'quartermaster'
    | 'journal'
    | 'pack'
    | 'feed'
    | 'news'
    | 'moderation'
    | 'privacy';

interface AgentBadgeProps {
    role: AgentRole;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

const AGENT_CONFIG: Record<AgentRole, { label: string; icon: typeof Compass; color: string }> = {
    router: { label: 'Router', icon: Zap, color: '#8B5CF6' },
    scout: { label: 'Scout', icon: Compass, color: '#059669' },
    bureaucracy: { label: 'Behörde', icon: FileText, color: '#2563EB' },
    quartermaster: { label: 'Quartiermeister', icon: Crosshair, color: '#DC2626' },
    journal: { label: 'Journal', icon: BookOpen, color: '#7C3AED' },
    pack: { label: 'Rudel', icon: Users, color: '#EA580C' },
    feed: { label: 'Feed', icon: MessageCircle, color: '#0891B2' },
    news: { label: 'Nachrichten', icon: Newspaper, color: '#4F46E5' },
    moderation: { label: 'Moderation', icon: Shield, color: '#BE185D' },
    privacy: { label: 'Datenschutz', icon: Eye, color: '#0D9488' },
};

export function AgentBadge({ role, size = 'md', showLabel = true }: AgentBadgeProps) {
    const config = AGENT_CONFIG[role] || AGENT_CONFIG.router;
    const Icon = config.icon;

    const sizeClasses = {
        sm: 'text-xs gap-1',
        md: 'text-sm gap-1.5',
        lg: 'text-base gap-2',
    };

    const iconSizes = {
        sm: 12,
        md: 14,
        lg: 16,
    };

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${sizeClasses[size]}`}
            style={{
                backgroundColor: `${config.color}20`,
                color: config.color,
            }}
        >
            <Icon size={iconSizes[size]} />
            {showLabel && <span>{config.label}</span>}
        </span>
    );
}

export default AgentBadge;
