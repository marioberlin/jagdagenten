/**
 * ICloudApp - Main iCloud GlassApp Component
 * 
 * The primary entry point for the iCloud integration in LiquidOS.
 * Handles auth flow, service navigation, and displays service panels.
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Cloud,
    User,
    Calendar,
    Mail,
    HardDrive,
    StickyNote,
    Clock,
    Image,
    MapPin,
    LogOut,
    Sparkles,
    Lock,
    ChevronRight
} from 'lucide-react';
import { GlassContainer } from '@/components/primitives/GlassContainer';
import { GlassButton } from '@/components/primitives/GlassButton';
import { GlassInput } from '@/components/forms/GlassInput';
import { GlassCard } from '@/components/data-display/GlassCard';
import { useICloudAuth } from '@/hooks/useICloudAuth';
import { useICloudService } from '@/hooks/useICloudService';
import { useICloudStore, type ICloudServiceType } from '@/stores/icloudStore';

// Service icon mapping
const serviceIcons: Record<ICloudServiceType, React.ElementType> = {
    contacts: User,
    calendar: Calendar,
    mail: Mail,
    drive: HardDrive,
    notes: StickyNote,
    reminders: Clock,
    photos: Image,
    findmy: MapPin,
};

const serviceLabels: Record<ICloudServiceType, string> = {
    contacts: 'Contacts',
    calendar: 'Calendar',
    mail: 'Mail',
    drive: 'iCloud Drive',
    notes: 'Notes',
    reminders: 'Reminders',
    photos: 'Photos',
    findmy: 'Find My',
};

export function ICloudApp() {
    const {
        isAuthenticated,
        isConnecting,
        requires2FA,
        account,
        isDemoMode,
    } = useICloudAuth();

    if (!isAuthenticated && !isConnecting && !requires2FA) {
        return <ICloudLoginView />;
    }

    if (requires2FA) {
        return <ICloud2FAView />;
    }

    if (isConnecting) {
        return <ICloudConnectingView />;
    }

    return <ICloudMainView account={account} isDemoMode={isDemoMode} />;
}

// ============================================================================
// Login View
// ============================================================================

function ICloudLoginView() {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const { login, enterDemoMode, error, isConnecting } = useICloudAuth();

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await login({ username, password });
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm"
            >
                <GlassContainer className="p-6">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mb-4 shadow-lg">
                            <Cloud className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-xl font-semibold text-[var(--glass-text-primary)]">
                            Sign in to iCloud
                        </h2>
                        <p className="text-sm text-[var(--glass-text-secondary)] text-center mt-1">
                            Access your Apple services
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <GlassInput
                            type="email"
                            placeholder="Apple ID"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoComplete="email"
                        />
                        <GlassInput
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />

                        {error && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-sm text-red-400 text-center"
                            >
                                {error}
                            </motion.p>
                        )}

                        <GlassButton
                            type="submit"
                            className="w-full"
                            disabled={isConnecting || !username || !password}
                        >
                            {isConnecting ? 'Signing in...' : 'Sign In'}
                        </GlassButton>
                    </form>

                    <div className="mt-6 pt-4 border-t border-[var(--glass-border)]">
                        <GlassButton
                            variant="ghost"
                            className="w-full"
                            onClick={enterDemoMode}
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Try Demo Mode
                        </GlassButton>
                    </div>
                </GlassContainer>
            </motion.div>
        </div>
    );
}

// ============================================================================
// 2FA View
// ============================================================================

function ICloud2FAView() {
    const [code, setCode] = React.useState('');
    const { verify2FA, error, isConnecting, logout } = useICloudAuth();

    const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await verify2FA(code);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm"
            >
                <GlassContainer className="p-6">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-4 shadow-lg">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-xl font-semibold text-[var(--glass-text-primary)]">
                            Two-Factor Authentication
                        </h2>
                        <p className="text-sm text-[var(--glass-text-secondary)] text-center mt-1">
                            Enter the code sent to your trusted devices
                        </p>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-4">
                        <GlassInput
                            type="text"
                            placeholder="000000"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="text-center text-2xl tracking-[0.5em] font-mono"
                            maxLength={6}
                            required
                        />

                        {error && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-sm text-red-400 text-center"
                            >
                                {error}
                            </motion.p>
                        )}

                        <GlassButton
                            type="submit"
                            className="w-full"
                            disabled={isConnecting || code.length !== 6}
                        >
                            {isConnecting ? 'Verifying...' : 'Verify'}
                        </GlassButton>
                    </form>

                    <div className="mt-4">
                        <GlassButton
                            variant="ghost"
                            className="w-full"
                            onClick={logout}
                        >
                            Cancel
                        </GlassButton>
                    </div>
                </GlassContainer>
            </motion.div>
        </div>
    );
}

// ============================================================================
// Connecting View
// ============================================================================

function ICloudConnectingView() {
    return (
        <div className="flex flex-col items-center justify-center h-full p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center"
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mb-4 shadow-lg"
                >
                    <Cloud className="w-8 h-8 text-white" />
                </motion.div>
                <p className="text-[var(--glass-text-secondary)]">Connecting to iCloud...</p>
            </motion.div>
        </div>
    );
}

// ============================================================================
// Main View (Authenticated)
// ============================================================================

function ICloudMainView({
    account,
    isDemoMode
}: {
    account: { username?: string; firstName?: string; lastName?: string } | null;
    isDemoMode: boolean;
}) {
    const { logout } = useICloudAuth();
    const { activeService, setActiveService } = useICloudStore();

    const services: ICloudServiceType[] = [
        'contacts', 'calendar', 'mail', 'drive', 'notes', 'reminders', 'photos', 'findmy'
    ];

    return (
        <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-64 border-r border-[var(--glass-border)] flex flex-col">
                {/* Account Header */}
                <div className="p-4 border-b border-[var(--glass-border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-[var(--glass-text-primary)] truncate">
                                {account?.firstName || 'iCloud User'}
                            </p>
                            <p className="text-xs text-[var(--glass-text-tertiary)] truncate">
                                {isDemoMode ? 'Demo Mode' : account?.username}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Service Navigation */}
                <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                    {services.map((service) => {
                        const Icon = serviceIcons[service];
                        const isActive = activeService === service;

                        return (
                            <button
                                key={service}
                                onClick={() => setActiveService(isActive ? null : service)}
                                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-150
                  ${isActive
                                        ? 'bg-[var(--glass-bg-highlight)] text-[var(--glass-text-primary)]'
                                        : 'text-[var(--glass-text-secondary)] hover:bg-[var(--glass-bg-subtle)] hover:text-[var(--glass-text-primary)]'
                                    }
                `}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="flex-1 text-left text-sm">{serviceLabels[service]}</span>
                                <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                            </button>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="p-3 border-t border-[var(--glass-border)]">
                    <GlassButton
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={logout}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        {isDemoMode ? 'Exit Demo' : 'Sign Out'}
                    </GlassButton>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                    {activeService ? (
                        <motion.div
                            key={activeService}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full"
                        >
                            <ICloudServicePanel service={activeService} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full"
                        >
                            <ICloudDashboard services={services} onSelectService={setActiveService} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ============================================================================
// Dashboard (No service selected)
// ============================================================================

function ICloudDashboard({
    services,
    onSelectService
}: {
    services: ICloudServiceType[];
    onSelectService: (service: ICloudServiceType) => void;
}) {
    return (
        <div className="h-full p-6 overflow-y-auto">
            <h1 className="text-2xl font-semibold text-[var(--glass-text-primary)] mb-6">
                iCloud Services
            </h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {services.map((service) => {
                    const Icon = serviceIcons[service];

                    return (
                        <GlassCard
                            key={service}
                            className="p-4 cursor-pointer hover:scale-[1.02] transition-transform"
                            onClick={() => onSelectService(service)}
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-3">
                                    <Icon className="w-6 h-6 text-blue-400" />
                                </div>
                                <span className="text-sm font-medium text-[var(--glass-text-primary)]">
                                    {serviceLabels[service]}
                                </span>
                            </div>
                        </GlassCard>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================================
// Service Panel (Placeholder - will be expanded)
// ============================================================================

function ICloudServicePanel({ service }: { service: ICloudServiceType }) {
    const Icon = serviceIcons[service];
    const {
        fetchContacts,
        fetchEvents,
        fetchMessages,
        fetchDriveItems,
        fetchNotes,
        fetchReminders,
        fetchPhotos,
        fetchDevices,
    } = useICloudService();
    const store = useICloudStore();

    // Fetch data on mount
    useEffect(() => {
        switch (service) {
            case 'contacts': fetchContacts(); break;
            case 'calendar': fetchEvents(); break;
            case 'mail': fetchMessages(); break;
            case 'drive': fetchDriveItems(); break;
            case 'notes': fetchNotes(); break;
            case 'reminders': fetchReminders(); break;
            case 'photos': fetchPhotos(); break;
            case 'findmy': fetchDevices(); break;
        }
    }, [service, fetchContacts, fetchEvents, fetchMessages, fetchDriveItems, fetchNotes, fetchReminders, fetchPhotos, fetchDevices]);

    const isLoading = store.loading[service];

    // Get data for current service
    const getData = () => {
        switch (service) {
            case 'contacts': return store.contacts;
            case 'calendar': return store.events;
            case 'mail': return store.messages;
            case 'drive': return store.driveItems;
            case 'notes': return store.notes;
            case 'reminders': return store.reminders;
            case 'photos': return store.photos;
            case 'findmy': return store.devices;
            default: return [];
        }
    };

    const data = getData();

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-[var(--glass-border)]">
                <Icon className="w-6 h-6 text-blue-400" />
                <h2 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                    {serviceLabels[service]}
                </h2>
                {isLoading && (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"
                    />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {data.length === 0 && !isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-[var(--glass-text-tertiary)]">
                        <Icon className="w-12 h-12 mb-3 opacity-50" />
                        <p>No items found</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {data.map((item: any) => (
                            <GlassCard key={item.id} className="p-3">
                                <p className="text-[var(--glass-text-primary)]">
                                    {item.name || item.title || item.subject || item.firstName || item.filename || item.deviceDisplayName || 'Untitled'}
                                </p>
                                {item.lastName && (
                                    <span className="text-[var(--glass-text-primary)]"> {item.lastName}</span>
                                )}
                            </GlassCard>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ICloudApp;
