import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Bell,
    Shield,
    Palette,
    CreditCard,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassCard, GlassButton, GlassInput, GlassSwitch, GlassBadge } from '@/components';
// import { useNavigate } from 'react-router-dom';

export interface SettingsSection {
    id: string;
    title: string;
    icon: React.ElementType;
    items: SettingsItem[];
}

export interface SettingsItem {
    id: string;
    label: string;
    description?: string;
    type: 'toggle' | 'select' | 'input' | 'button' | 'link';
    value?: boolean | string;
    options?: string[];
}

export interface GlassSettingsPanelProps {
    /** Settings sections */
    sections?: SettingsSection[];
    /** Custom className */
    className?: string;
}

/**
 * GlassSettingsPanel - Settings panel for trading dashboard
 */
export const GlassSettingsPanel: React.FC<GlassSettingsPanelProps> = ({
    sections = [
        {
            id: 'appearance',
            title: 'Appearance',
            icon: Palette,
            items: [
                {
                    id: 'theme',
                    label: 'Theme',
                    description: 'Choose your preferred color scheme',
                    type: 'select',
                    value: 'dark',
                    options: ['light', 'dark', 'system'],
                },
                {
                    id: 'animations',
                    label: 'Animations',
                    description: 'Enable smooth animations throughout the app',
                    type: 'toggle',
                    value: true,
                },
                {
                    id: 'compact',
                    label: 'Compact Mode',
                    description: 'Use smaller spacing for more content',
                    type: 'toggle',
                    value: false,
                },
            ],
        },
        {
            id: 'notifications',
            title: 'Notifications',
            icon: Bell,
            items: [
                {
                    id: 'price-alerts',
                    label: 'Price Alerts',
                    description: 'Get notified when prices reach your targets',
                    type: 'toggle',
                    value: true,
                },
                {
                    id: 'order-updates',
                    label: 'Order Updates',
                    description: 'Notifications for order fills and updates',
                    type: 'toggle',
                    value: true,
                },
                {
                    id: 'news',
                    label: 'Market News',
                    description: 'Breaking news and market updates',
                    type: 'toggle',
                    value: false,
                },
                {
                    id: 'email',
                    label: 'Email Notifications',
                    description: 'Receive notifications via email',
                    type: 'toggle',
                    value: false,
                },
            ],
        },
        {
            id: 'security',
            title: 'Security',
            icon: Shield,
            items: [
                {
                    id: 'two-factor',
                    label: 'Two-Factor Authentication',
                    description: 'Add an extra layer of security',
                    type: 'toggle',
                    value: true,
                },
                {
                    id: 'session-timeout',
                    label: 'Session Timeout',
                    description: 'Auto logout after inactivity',
                    type: 'select',
                    value: '30',
                    options: ['15', '30', '60', '120'],
                },
                {
                    id: 'api-keys',
                    label: 'API Keys',
                    description: 'Manage your API keys for trading bots',
                    type: 'link',
                },
            ],
        },
        {
            id: 'trading',
            title: 'Trading',
            icon: CreditCard,
            items: [
                {
                    id: 'default-leverage',
                    label: 'Default Leverage',
                    description: 'Default leverage for new positions',
                    type: 'select',
                    value: '10',
                    options: ['1', '2', '5', '10', '20', '50', '100'],
                },
                {
                    id: 'slippage',
                    label: 'Max Slippage',
                    description: 'Maximum acceptable slippage for market orders',
                    type: 'input',
                    value: '0.5',
                },
                {
                    id: 'confirmations',
                    label: 'Confirmations',
                    description: 'Require confirmation before placing orders',
                    type: 'toggle',
                    value: true,
                },
            ],
        },
    ],
    className,
}) => {
    const [activeSection, setActiveSection] = useState(sections[0].id);
    const [settings, setSettings] = useState<Record<string, any>>(
        sections.reduce((acc, section) => {
            section.items.forEach((item) => {
                acc[`${section.id}-${item.id}`] = item.value;
            });
            return acc;
        }, {} as Record<string, any>)
    );

    const handleSettingChange = (sectionId: string, itemId: string, value: any) => {
        setSettings((prev) => ({
            ...prev,
            [`${sectionId}-${itemId}`]: value,
        }));
    };

    return (
        <div className={cn('flex flex-col lg:flex-row gap-6', className)}>
            {/* Section Navigation */}
            <div className="lg:w-64 flex-shrink-0">
                <GlassCard className="sticky top-24">
                    <div className="p-2">
                        {sections.map((section) => {
                            const Icon = section.icon;
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                                        activeSection === section.id
                                            ? 'bg-[var(--glass-primary)] text-[var(--text-primary)]'
                                            : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--glass-surface-hover)]'
                                    )}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{section.title}</span>
                                </button>
                            );
                        })}
                    </div>
                </GlassCard>
            </div>

            {/* Settings Content */}
            <div className="flex-1">
                {sections.map((section) => {
                    if (section.id !== activeSection) return null;
                    const Icon = section.icon;

                    return (
                        <motion.div
                            key={section.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-[var(--glass-primary)] flex items-center justify-center">
                                    <Icon className="w-5 h-5 text-[var(--glass-accent)]" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold">{section.title}</h2>
                                    <p className="text-sm text-[var(--text-muted)]">
                                        Manage your {section.title.toLowerCase()} preferences
                                    </p>
                                </div>
                            </div>

                            <GlassCard>
                                <div className="divide-y divide-[var(--glass-border)]">
                                    {section.items.map((item) => {
                                        const settingKey = `${section.id}-${item.id}`;
                                        const currentValue = settings[settingKey];

                                        return (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between p-4 hover:bg-[var(--glass-surface-hover)] transition-colors"
                                            >
                                                <div className="flex-1 pr-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{item.label}</span>
                                                        {item.description && (
                                                            <GlassBadge variant="glass" className="text-[10px]">
                                                                {item.description}
                                                            </GlassBadge>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {item.type === 'toggle' && (
                                                        <GlassSwitch
                                                            checked={currentValue as boolean}
                                                            onCheckedChange={(checked) =>
                                                                handleSettingChange(section.id, item.id, checked)
                                                            }
                                                        />
                                                    )}

                                                    {item.type === 'select' && (
                                                        <select
                                                            value={currentValue as string}
                                                            onChange={(e) =>
                                                                handleSettingChange(section.id, item.id, e.target.value)
                                                            }
                                                            className={cn(
                                                                'px-3 py-2 rounded-lg bg-[var(--glass-surface-hover)]',
                                                                'text-sm border-none outline-none cursor-pointer',
                                                                'focus:ring-2 focus:ring-[var(--glass-accent)]'
                                                            )}
                                                        >
                                                            {item.options?.map((opt) => (
                                                                <option key={opt} value={opt}>
                                                                    {opt === 'dark' ? '🌙 Dark' : opt === 'light' ? '☀️ Light' : opt === 'system' ? '💻 System' : opt}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}

                                                    {item.type === 'input' && (
                                                        <GlassInput
                                                            type="number"
                                                            value={currentValue as string}
                                                            onChange={(e) =>
                                                                handleSettingChange(section.id, item.id, e.target.value)
                                                            }
                                                            className="w-24"
                                                            step={item.id === 'slippage' ? '0.1' : '1'}
                                                            min={0}
                                                        />
                                                    )}

                                                    {item.type === 'link' && (
                                                        <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />
                                                    )}

                                                    {item.type === 'button' && (
                                                        <GlassButton variant="outline" size="sm">
                                                            {item.label}
                                                        </GlassButton>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </GlassCard>
                        </motion.div>
                    );
                })}

                {/* Save Button */}
                <div className="mt-6 flex justify-end gap-3">
                    <GlassButton variant="ghost">Cancel</GlassButton>
                    <GlassButton variant="primary">Save Changes</GlassButton>
                </div>
            </div>
        </div>
    );
};

/**
 * GlassAnalyticsPanel - Analytics overview for trading dashboard
 */
export const GlassAnalyticsPanel: React.FC<{ className?: string }> = ({ className }) => {
    const stats = [
        { label: 'Total Trades', value: '1,234', change: '+12%', positive: true },
        { label: 'Win Rate', value: '68.5%', change: '+2.3%', positive: true },
        { label: 'Avg. Profit', value: '$2,450', change: '-5.1%', positive: false },
        { label: 'Best Trade', value: '$12,800', change: '+8.2%', positive: true },
    ];

    const performanceData = [
        { month: 'Jan', profit: 3200 },
        { month: 'Feb', profit: 4100 },
        { month: 'Mar', profit: 2800 },
        { month: 'Apr', profit: 5600 },
        { month: 'May', profit: 4900 },
        { month: 'Jun', profit: 6200 },
    ];

    const maxProfit = Math.max(...performanceData.map((d) => d.profit));

    return (
        <GlassCard className={cn('h-full', className)}>
            <div className="px-4 py-3 border-b border-[var(--glass-border)]">
                <h3 className="font-semibold">Performance Analytics</h3>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="text-center">
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="text-xs text-[var(--text-muted)]">{stat.label}</div>
                        <div
                            className={cn(
                                'text-xs font-medium',
                                stat.positive ? 'text-[var(--glass-success)]' : 'text-[var(--glass-destructive)]'
                            )}
                        >
                            {stat.change}
                        </div>
                    </div>
                ))}
            </div>

            {/* Performance Chart */}
            <div className="p-4 pt-0">
                <div className="h-40 flex items-end gap-2">
                    {performanceData.map((data) => (
                        <div key={data.month} className="flex-1 flex flex-col items-center gap-1">
                            <div
                                className="w-full bg-[var(--glass-accent)] rounded-t transition-all hover:opacity-80"
                                style={{ height: `${(data.profit / maxProfit) * 100}%` }}
                            />
                            <span className="text-xs text-[var(--text-muted)]">{data.month}</span>
                        </div>
                    ))}
                </div>
            </div>
        </GlassCard>
    );
};

export default GlassSettingsPanel;
