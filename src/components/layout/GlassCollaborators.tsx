import { cn } from '@/utils/cn';

interface Collaborator {
    /** Unique identifier */
    id: string;
    /** Display name */
    name: string;
    /** Avatar URL (optional) */
    avatar?: string;
    /** Whether the user is currently active/online */
    isActive?: boolean;
    /** Whether the user is currently typing */
    isTyping?: boolean;
    /** User's accent color for the avatar border */
    color?: string;
}

interface GlassCollaboratorsProps {
    /** List of collaborators to display */
    users: Collaborator[];
    /** Maximum number of avatars to show before "+N" indicator */
    maxVisible?: number;
    /** Size of avatars */
    size?: 'sm' | 'default' | 'lg';
    /** Additional class names */
    className?: string;
    /** Callback when a collaborator avatar is clicked */
    onUserClick?: (user: Collaborator) => void;
}

const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    default: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
};

const overlapClasses = {
    sm: '-ml-2',
    default: '-ml-3',
    lg: '-ml-4',
};

/**
 * GlassCollaborators - Avatar stack showing active participants.
 * Per Apple HIG collaboration guidelines, displays who is currently viewing/editing.
 * 
 * @example
 * ```tsx
 * <GlassCollaborators 
 *   users={[
 *     { id: '1', name: 'Alice', avatar: '/avatars/alice.jpg', isActive: true },
 *     { id: '2', name: 'Bob', isActive: true, isTyping: true },
 *     { id: '3', name: 'Charlie', isActive: false },
 *   ]}
 *   maxVisible={3}
 *   onUserClick={(user) => console.log('Clicked:', user.name)}
 * />
 * ```
 */
export const GlassCollaborators = ({
    users,
    maxVisible = 4,
    size = 'default',
    className,
    onUserClick
}: GlassCollaboratorsProps) => {
    const visibleUsers = users.slice(0, maxVisible);
    const overflowCount = users.length - maxVisible;

    // Get initials from name
    const getInitials = (name: string): string => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Generate a consistent color from user id/name
    const getDefaultColor = (id: string): string => {
        const colors = [
            'var(--system-blue)',
            'var(--system-purple)',
            'var(--system-pink)',
            'var(--system-orange)',
            'var(--system-teal)',
            'var(--system-indigo)',
        ];
        const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[index % colors.length];
    };

    return (
        <div className={cn("flex items-center", className)}>
            {visibleUsers.map((user, index) => (
                <div
                    key={user.id}
                    className={cn(
                        "relative rounded-full flex items-center justify-center font-medium cursor-pointer transition-transform hover:scale-110 hover:z-10",
                        sizeClasses[size],
                        index > 0 && overlapClasses[size],
                        "ring-2 ring-[var(--glass-bg-regular)]"
                    )}
                    style={{
                        backgroundColor: user.avatar ? 'transparent' : (user.color || getDefaultColor(user.id)),
                        zIndex: visibleUsers.length - index,
                    }}
                    onClick={() => onUserClick?.(user)}
                    title={user.name + (user.isTyping ? ' (typing...)' : user.isActive ? ' (active)' : '')}
                >
                    {user.avatar ? (
                        <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover"
                        />
                    ) : (
                        <span className="text-white">{getInitials(user.name)}</span>
                    )}

                    {/* Active/Online indicator */}
                    {user.isActive && (
                        <span
                            className={cn(
                                "absolute bottom-0 right-0 rounded-full bg-success ring-2 ring-[var(--glass-bg-regular)]",
                                size === 'sm' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-3 h-3' : 'w-2 h-2'
                            )}
                        />
                    )}

                    {/* Typing indicator */}
                    {user.isTyping && (
                        <span
                            className={cn(
                                "absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 bg-glass-surface rounded-full px-1 py-0.5 ring-1 ring-[var(--glass-border)]",
                            )}
                        >
                            <span className="w-1 h-1 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1 h-1 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1 h-1 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                    )}
                </div>
            ))}

            {/* Overflow indicator */}
            {overflowCount > 0 && (
                <div
                    className={cn(
                        "rounded-full flex items-center justify-center font-medium bg-glass-surface text-secondary border border-[var(--glass-border)]",
                        sizeClasses[size],
                        overlapClasses[size]
                    )}
                    style={{ zIndex: 0 }}
                    title={`+${overflowCount} more`}
                >
                    +{overflowCount}
                </div>
            )}
        </div>
    );
};

GlassCollaborators.displayName = 'GlassCollaborators';
