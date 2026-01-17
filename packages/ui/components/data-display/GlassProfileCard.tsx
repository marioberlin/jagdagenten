'use client';

import React from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassAvatar } from './GlassAvatar';
import { GlassButton } from '../primitives/GlassButton';
import { cn } from '@/utils/cn';

export type ProfileStatus = 'online' | 'offline' | 'away' | 'busy';

export interface GlassProfileCardProps {
    /** Avatar image URL */
    avatar?: string;
    /** User's name */
    name: string;
    /** User's role or title */
    role?: string;
    /** User's status */
    status?: ProfileStatus;
    /** Layout orientation */
    layout?: 'horizontal' | 'vertical';
    /** Show action buttons */
    showActions?: boolean;
    /** Primary action handler */
    onPrimaryAction?: () => void;
    /** Secondary action handler */
    onSecondaryAction?: () => void;
    /** Primary action label */
    primaryLabel?: string;
    /** Secondary action label */
    secondaryLabel?: string;
    /** Additional class names */
    className?: string;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
}

const statusColors: Record<ProfileStatus, string> = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
};

const statusLabels: Record<ProfileStatus, string> = {
    online: 'Online',
    offline: 'Offline',
    away: 'Away',
    busy: 'Busy',
};

export const GlassProfileCard: React.FC<GlassProfileCardProps> = ({
    avatar,
    name,
    role,
    status,
    layout = 'vertical',
    showActions = false,
    onPrimaryAction,
    onSecondaryAction,
    primaryLabel = 'Message',
    secondaryLabel = 'Profile',
    className,
    size = 'md',
}) => {
    const avatarSizes = {
        sm: 'sm' as const,
        md: 'lg' as const,
        lg: 'xl' as const,
    };

    const nameSizes = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-xl',
    };

    const roleSizes = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
    };

    const isHorizontal = layout === 'horizontal';

    return (
        <GlassContainer
            material="regular"
            enableLiquid={false}
            className={cn(
                'p-4 transition-all duration-300',
                isHorizontal ? 'flex items-center gap-4' : 'flex flex-col items-center gap-3 text-center',
                className
            )}
        >
            {/* Avatar with status indicator */}
            <div className="relative shrink-0">
                <GlassAvatar
                    src={avatar}
                    alt={name}
                    fallback={name.charAt(0).toUpperCase()}
                    size={avatarSizes[size]}
                />
                {status && (
                    <span
                        className={cn(
                            'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--glass-bg-regular)]',
                            statusColors[status]
                        )}
                        title={statusLabels[status]}
                    />
                )}
            </div>

            {/* User info */}
            <div className={cn('flex-1 min-w-0', isHorizontal && 'text-left')}>
                <h4 className={cn('font-semibold text-primary truncate', nameSizes[size])}>
                    {name}
                </h4>
                {role && (
                    <p className={cn('text-secondary truncate', roleSizes[size])}>
                        {role}
                    </p>
                )}
                {status && (
                    <p className={cn('text-secondary flex items-center gap-1.5 mt-1', roleSizes[size], isHorizontal ? '' : 'justify-center')}>
                        <span className={cn('w-2 h-2 rounded-full', statusColors[status])} />
                        {statusLabels[status]}
                    </p>
                )}
            </div>

            {/* Action buttons */}
            {showActions && (
                <div className={cn('flex gap-2', isHorizontal ? 'shrink-0' : 'w-full mt-2')}>
                    <GlassButton
                        variant="primary"
                        size="sm"
                        onClick={onPrimaryAction}
                        className={cn(!isHorizontal && 'flex-1')}
                    >
                        {primaryLabel}
                    </GlassButton>
                    <GlassButton
                        variant="secondary"
                        size="sm"
                        onClick={onSecondaryAction}
                        className={cn(!isHorizontal && 'flex-1')}
                    >
                        {secondaryLabel}
                    </GlassButton>
                </div>
            )}
        </GlassContainer>
    );
};

GlassProfileCard.displayName = 'GlassProfileCard';
