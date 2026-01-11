/**
 * GlassSmartTabs
 * 
 * A generative tabs component for navigation and section organization.
 * Listens for the 'generate_tabs' tool.
 */

import { LiquidSmartComponent } from '../../liquid-engine/react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

interface TabItem {
    id: string;
    label: string;
    icon?: string;
    disabled?: boolean;
    badge?: string | number;
}

export function GlassSmartTabs() {
    return (
        <LiquidSmartComponent
            name="generate_tabs"
            render={({ status, args }) => {
                const isLoading = status === 'running';
                const tabs: TabItem[] = args.tabs || args.items || [
                    { id: 'tab1', label: 'Tab 1' },
                    { id: 'tab2', label: 'Tab 2' },
                    { id: 'tab3', label: 'Tab 3' },
                ];
                const activeTab = args.activeTab || args.active || tabs[0]?.id;
                const variant = args.variant || 'pills'; // 'pills' | 'underline' | 'enclosed'
                const orientation = args.orientation || 'horizontal'; // 'horizontal' | 'vertical'
                const size = args.size || 'md'; // 'sm' | 'md' | 'lg'

                const sizeStyles = {
                    sm: 'text-xs px-2 py-1 gap-1',
                    md: 'text-sm px-3 py-2 gap-1.5',
                    lg: 'text-base px-4 py-2.5 gap-2',
                };

                const tabBaseStyles = cn(
                    'flex items-center font-medium transition-all duration-200 rounded-lg',
                    'hover:bg-white/5',
                    sizeStyles[size as keyof typeof sizeStyles],
                    orientation === 'vertical' && 'justify-start w-full'
                );

                const activeTabStyles = {
                    pills: 'bg-primary/20 text-primary',
                    underline: 'text-primary border-b-2 border-primary bg-transparent',
                    enclosed: 'bg-glass-surface text-primary border border-primary/30',
                };

                const inactiveTabStyles = {
                    pills: 'text-secondary hover:text-white',
                    underline: 'text-secondary hover:text-white border-b-2 border-transparent',
                    enclosed: 'text-secondary hover:text-white border border-transparent',
                };

                return (
                    <GlassContainer className="w-full">
                        {args.title && (
                            <h3 className={cn(
                                'font-semibold mb-3',
                                isLoading && !args.title ? 'animate-pulse bg-white/10 w-24 h-5 rounded' : 'text-white'
                            )}>
                                {args.title}
                            </h3>
                        )}

                        {/* Tab List */}
                        <div className={cn(
                            'flex',
                            orientation === 'vertical' ? 'flex-col gap-1 border-r border-glass-border pr-3' : 'gap-1 border-b border-glass-border pb-px'
                        )}>
                            {isLoading && tabs.length === 0 ? (
                                // Loading skeleton
                                <div className={cn(
                                    'flex gap-2',
                                    orientation === 'vertical' ? 'flex-col' : 'flex-row'
                                )}>
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                'rounded-lg bg-white/5 animate-pulse',
                                                sizeStyles[size as keyof typeof sizeStyles],
                                                orientation === 'vertical' ? 'w-full' : 'w-20'
                                            )}
                                        />
                                    ))}
                                </div>
                            ) : (
                                tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        disabled={tab.disabled}
                                        className={cn(
                                            tabBaseStyles,
                                            activeTab === tab.id
                                                ? activeTabStyles[variant as keyof typeof activeTabStyles]
                                                : inactiveTabStyles[variant as keyof typeof inactiveTabStyles],
                                            tab.disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
                                        )}
                                        onClick={() => {
                                            // Emit event for tab change (handled by LiquidSmartComponent)
                                        }}
                                    >
                                        {tab.icon && (
                                            <span className="flex-shrink-0">{tab.icon}</span>
                                        )}
                                        <span className="truncate">{tab.label}</span>
                                        {tab.badge !== undefined && (
                                            <span className={cn(
                                                'ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                                                activeTab === tab.id
                                                    ? 'bg-primary text-white'
                                                    : 'bg-white/10 text-secondary'
                                            )}>
                                                {tab.badge}
                                            </span>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Tab Content Area */}
                        <div className={cn(
                            'mt-4 min-h-[100px]',
                            isLoading && !args.content && 'animate-pulse bg-white/5 rounded-lg'
                        )}>
                            {args.content || args.renderContent ? (
                                <div className="text-sm text-secondary">
                                    {args.content}
                                </div>
                            ) : isLoading ? (
                                <div className="flex items-center justify-center text-secondary/50">
                                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                    Loading content...
                                </div>
                            ) : (
                                <div className="text-sm text-secondary">
                                    {/* Content rendered by AI tool */}
                                </div>
                            )}
                        </div>
                    </GlassContainer>
                );
            }}
        />
    );
}
