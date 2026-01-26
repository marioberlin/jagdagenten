/**
 * Glass Channel Settings
 * 
 * UI component for configuring messaging channel adapters.
 * Supports WhatsApp, iMessage, Email, Webhook, and other channels.
 */

import React, { useState, useEffect } from 'react';
import './GlassChannelSettings.css';

// ============================================================================
// Types
// ============================================================================

type ChannelType =
    | 'telegram' | 'slack' | 'discord' | 'whatsapp' | 'imessage'
    | 'email' | 'webhook' | 'matrix' | 'signal' | 'teams';

interface ChannelConfig {
    type: ChannelType;
    enabled: boolean;
    name: string;
    config: Record<string, any>;
}

interface ChannelField {
    key: string;
    label: string;
    type: 'text' | 'password' | 'number' | 'boolean' | 'select';
    placeholder?: string;
    required?: boolean;
    options?: Array<{ value: string; label: string }>;
    description?: string;
}

// ============================================================================
// Channel Schema Definitions
// ============================================================================

const CHANNEL_SCHEMAS: Record<ChannelType, {
    name: string;
    icon: string;
    description: string;
    fields: ChannelField[];
}> = {
    telegram: {
        name: 'Telegram',
        icon: '📱',
        description: 'Connect via Telegram Bot API',
        fields: [
            { key: 'botToken', label: 'Bot Token', type: 'password', required: true, placeholder: '123456:ABC-DEF...' },
            { key: 'webhookUrl', label: 'Webhook URL', type: 'text', placeholder: 'https://your-domain.com/webhooks/telegram' },
        ],
    },
    slack: {
        name: 'Slack',
        icon: '💼',
        description: 'Connect via Slack Bolt app',
        fields: [
            { key: 'botToken', label: 'Bot Token', type: 'password', required: true, placeholder: 'xoxb-...' },
            { key: 'signingSecret', label: 'Signing Secret', type: 'password', required: true },
            { key: 'appToken', label: 'App Token (Socket Mode)', type: 'password', placeholder: 'xapp-...' },
        ],
    },
    discord: {
        name: 'Discord',
        icon: '🎮',
        description: 'Connect via Discord.js bot',
        fields: [
            { key: 'botToken', label: 'Bot Token', type: 'password', required: true },
            { key: 'applicationId', label: 'Application ID', type: 'text', required: true },
        ],
    },
    whatsapp: {
        name: 'WhatsApp',
        icon: '💬',
        description: 'Connect via WhatsApp Web (Baileys)',
        fields: [
            { key: 'authDir', label: 'Auth Directory', type: 'text', placeholder: './whatsapp-auth', description: 'Directory to store session data' },
            { key: 'phoneNumber', label: 'Phone Number', type: 'text', placeholder: '+1234567890', description: 'Optional: Pre-link a phone number' },
        ],
    },
    imessage: {
        name: 'iMessage',
        icon: '🍎',
        description: 'Connect via macOS Messages app (requires Full Disk Access)',
        fields: [
            { key: 'pollIntervalMs', label: 'Poll Interval (ms)', type: 'number', placeholder: '2000', description: 'How often to check for new messages' },
        ],
    },
    email: {
        name: 'Email',
        icon: '📧',
        description: 'Connect via SMTP/IMAP',
        fields: [
            // SMTP Settings
            { key: 'smtp.host', label: 'SMTP Host', type: 'text', required: true, placeholder: 'smtp.gmail.com' },
            { key: 'smtp.port', label: 'SMTP Port', type: 'number', placeholder: '587' },
            { key: 'smtp.user', label: 'SMTP Username', type: 'text', required: true, placeholder: 'your-email@gmail.com' },
            { key: 'smtp.pass', label: 'SMTP Password', type: 'password', required: true, description: 'Use app-specific password for Gmail' },
            { key: 'smtp.secure', label: 'Use SSL/TLS', type: 'boolean' },
            // IMAP Settings
            { key: 'imap.host', label: 'IMAP Host', type: 'text', placeholder: 'imap.gmail.com' },
            { key: 'imap.port', label: 'IMAP Port', type: 'number', placeholder: '993' },
            { key: 'imap.user', label: 'IMAP Username', type: 'text', placeholder: 'your-email@gmail.com' },
            { key: 'imap.pass', label: 'IMAP Password', type: 'password' },
            { key: 'imap.tls', label: 'Use TLS', type: 'boolean' },
            { key: 'fromName', label: 'From Name', type: 'text', placeholder: 'LiquidOS' },
        ],
    },
    webhook: {
        name: 'Webhook',
        icon: '🔗',
        description: 'Generic webhook for custom integrations',
        fields: [
            { key: 'outboundUrl', label: 'Outbound URL', type: 'text', required: true, placeholder: 'https://your-app.com/api/receive', description: 'URL to POST messages to' },
            { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', description: 'Secret for verifying incoming webhooks' },
            { key: 'inboundMapping.text', label: 'Text Field Path', type: 'text', placeholder: 'message.text', description: 'JSON path to message text in webhook payload' },
            { key: 'inboundMapping.from', label: 'From Field Path', type: 'text', placeholder: 'user.id' },
            { key: 'inboundMapping.channelId', label: 'Channel ID Path', type: 'text', placeholder: 'chat.id' },
        ],
    },
    matrix: {
        name: 'Matrix',
        icon: '🔷',
        description: 'Connect via Matrix/Element',
        fields: [
            { key: 'homeserver', label: 'Homeserver URL', type: 'text', required: true, placeholder: 'https://matrix.org' },
            { key: 'userId', label: 'User ID', type: 'text', required: true, placeholder: '@bot:matrix.org' },
            { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
        ],
    },
    signal: {
        name: 'Signal',
        icon: '🔐',
        description: 'Connect via signal-cli',
        fields: [
            { key: 'phoneNumber', label: 'Phone Number', type: 'text', required: true, placeholder: '+1234567890' },
            { key: 'signalCliPath', label: 'signal-cli Path', type: 'text', placeholder: '/usr/local/bin/signal-cli' },
        ],
    },
    teams: {
        name: 'Microsoft Teams',
        icon: '👥',
        description: 'Connect via Bot Framework',
        fields: [
            { key: 'appId', label: 'App ID', type: 'text', required: true },
            { key: 'appPassword', label: 'App Password', type: 'password', required: true },
        ],
    },
};

// ============================================================================
// Component
// ============================================================================

interface GlassChannelSettingsProps {
    onSave?: (channels: ChannelConfig[]) => void;
    initialChannels?: ChannelConfig[];
}

export const GlassChannelSettings: React.FC<GlassChannelSettingsProps> = ({
    onSave,
    initialChannels = [],
}) => {
    const [channels, setChannels] = useState<ChannelConfig[]>(initialChannels);
    const [selectedChannel, setSelectedChannel] = useState<ChannelType | null>(null);
    const [editingConfig, setEditingConfig] = useState<Record<string, any>>({});
    const [showAddModal, setShowAddModal] = useState(false);

    // Load channels from API on mount
    useEffect(() => {
        loadChannels();
    }, []);

    const loadChannels = async () => {
        try {
            const res = await fetch('/api/v1/gateway/channels');
            if (res.ok) {
                const data = await res.json();
                setChannels(data.channels || []);
            }
        } catch (error) {
            console.error('Failed to load channels:', error);
        }
    };

    const handleToggleChannel = async (index: number) => {
        const updated = [...channels];
        updated[index].enabled = !updated[index].enabled;
        setChannels(updated);
        await saveChannel(updated[index]);
    };

    const handleEditChannel = (channel: ChannelConfig) => {
        setSelectedChannel(channel.type);
        setEditingConfig(channel.config);
        setShowAddModal(true);
    };

    const handleAddChannel = (type: ChannelType) => {
        setSelectedChannel(type);
        setEditingConfig({});
        setShowAddModal(true);
    };

    const handleSaveChannel = async () => {
        if (!selectedChannel) return;

        const existing = channels.findIndex(c => c.type === selectedChannel);
        const channel: ChannelConfig = {
            type: selectedChannel,
            enabled: true,
            name: CHANNEL_SCHEMAS[selectedChannel].name,
            config: editingConfig,
        };

        let updated: ChannelConfig[];
        if (existing >= 0) {
            updated = [...channels];
            updated[existing] = channel;
        } else {
            updated = [...channels, channel];
        }

        setChannels(updated);
        await saveChannel(channel);
        setShowAddModal(false);
        setSelectedChannel(null);
        setEditingConfig({});
        onSave?.(updated);
    };

    const handleDeleteChannel = async (index: number) => {
        const channel = channels[index];
        const updated = channels.filter((_, i) => i !== index);
        setChannels(updated);

        try {
            await fetch(`/api/v1/gateway/channels/${channel.type}`, {
                method: 'DELETE',
            });
        } catch (error) {
            console.error('Failed to delete channel:', error);
        }
    };

    const saveChannel = async (channel: ChannelConfig) => {
        try {
            await fetch('/api/v1/gateway/channels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(channel),
            });
        } catch (error) {
            console.error('Failed to save channel:', error);
        }
    };

    const setNestedValue = (obj: Record<string, any>, path: string, value: any) => {
        const keys = path.split('.');
        const result = { ...obj };
        let current: any = result;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;

        return result;
    };

    const getNestedValue = (obj: Record<string, any>, path: string): any => {
        const keys = path.split('.');
        let current = obj;
        for (const key of keys) {
            if (!current) return undefined;
            current = current[key];
        }
        return current;
    };

    // Available channels that haven't been added yet
    const availableChannels = (Object.keys(CHANNEL_SCHEMAS) as ChannelType[]).filter(
        type => !channels.some(c => c.type === type)
    );

    return (
        <div className="glass-channel-settings">
            <div className="glass-channel-header">
                <h2>📡 Messaging Channels</h2>
                <p>Configure integrations for different messaging platforms</p>
            </div>

            {/* Active Channels */}
            <div className="glass-channel-list">
                {channels.map((channel, index) => {
                    const schema = CHANNEL_SCHEMAS[channel.type];
                    return (
                        <div
                            key={channel.type}
                            className={`glass-channel-card ${channel.enabled ? 'enabled' : 'disabled'}`}
                        >
                            <div className="channel-icon">{schema?.icon}</div>
                            <div className="channel-info">
                                <h3>{schema?.name || channel.type}</h3>
                                <p>{schema?.description}</p>
                            </div>
                            <div className="channel-actions">
                                <button
                                    className={`toggle-btn ${channel.enabled ? 'on' : 'off'}`}
                                    onClick={() => handleToggleChannel(index)}
                                >
                                    {channel.enabled ? 'ON' : 'OFF'}
                                </button>
                                <button
                                    className="edit-btn"
                                    onClick={() => handleEditChannel(channel)}
                                >
                                    ⚙️
                                </button>
                                <button
                                    className="delete-btn"
                                    onClick={() => handleDeleteChannel(index)}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add Channel Button */}
            {availableChannels.length > 0 && (
                <div className="glass-add-channel">
                    <h3>Add Channel</h3>
                    <div className="available-channels">
                        {availableChannels.map(type => {
                            const schema = CHANNEL_SCHEMAS[type];
                            return (
                                <button
                                    key={type}
                                    className="add-channel-btn"
                                    onClick={() => handleAddChannel(type)}
                                >
                                    <span className="channel-icon">{schema.icon}</span>
                                    <span className="channel-name">{schema.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Config Modal */}
            {showAddModal && selectedChannel && (
                <div className="glass-modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="glass-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                {CHANNEL_SCHEMAS[selectedChannel].icon} Configure {CHANNEL_SCHEMAS[selectedChannel].name}
                            </h2>
                            <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
                        </div>

                        <div className="modal-body">
                            {CHANNEL_SCHEMAS[selectedChannel].fields.map(field => (
                                <div key={field.key} className="form-field">
                                    <label>
                                        {field.label}
                                        {field.required && <span className="required">*</span>}
                                    </label>

                                    {field.type === 'boolean' ? (
                                        <label className="toggle-label">
                                            <input
                                                type="checkbox"
                                                checked={getNestedValue(editingConfig, field.key) ?? false}
                                                onChange={e => setEditingConfig(
                                                    setNestedValue(editingConfig, field.key, e.target.checked)
                                                )}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    ) : field.type === 'select' ? (
                                        <select
                                            value={getNestedValue(editingConfig, field.key) || ''}
                                            onChange={e => setEditingConfig(
                                                setNestedValue(editingConfig, field.key, e.target.value)
                                            )}
                                        >
                                            <option value="">Select...</option>
                                            {field.options?.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type={field.type}
                                            placeholder={field.placeholder}
                                            value={getNestedValue(editingConfig, field.key) || ''}
                                            onChange={e => setEditingConfig(
                                                setNestedValue(editingConfig, field.key,
                                                    field.type === 'number' ? Number(e.target.value) : e.target.value
                                                )
                                            )}
                                        />
                                    )}

                                    {field.description && (
                                        <span className="field-description">{field.description}</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setShowAddModal(false)}>
                                Cancel
                            </button>
                            <button className="save-btn" onClick={handleSaveChannel}>
                                Save Channel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlassChannelSettings;
