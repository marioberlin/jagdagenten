import React, { forwardRef, useCallback } from 'react';
import { Share2, Link2, Check } from 'lucide-react';
import { GlassButton } from './GlassButton';
import { cn } from '@/utils/cn';

interface ShareData {
    /** Title of the content to share */
    title?: string;
    /** Description/text of the content */
    text?: string;
    /** URL to share */
    url?: string;
}

interface GlassShareButtonProps {
    /** Data to share when the button is clicked */
    shareData?: ShareData;
    /** Callback when share is triggered (called with shareData) */
    onShare?: (data: ShareData) => void;
    /** Fallback callback when Web Share API is not supported (e.g., copy to clipboard) */
    onFallback?: (data: ShareData) => void;
    /** Additional class names */
    className?: string;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg' | 'icon';
    /** Button variant */
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
    /** Custom label (default: "Share") */
    label?: string;
    /** Whether to show only the icon */
    iconOnly?: boolean;
}

/**
 * GlassShareButton - Standard share button per Apple HIG collaboration guidelines.
 * Uses Web Share API when available with fallback to copy-to-clipboard.
 * 
 * @example
 * ```tsx
 * <GlassShareButton 
 *   shareData={{
 *     title: 'My Document',
 *     text: 'Check out this document',
 *     url: window.location.href
 *   }}
 *   onShare={(data) => console.log('Shared:', data)}
 * />
 * ```
 */
export const GlassShareButton = forwardRef<HTMLButtonElement, GlassShareButtonProps>(
    ({
        shareData = { url: typeof window !== 'undefined' ? window.location.href : '' },
        onShare,
        onFallback,
        className,
        size = 'md',
        variant = 'primary',
        label = 'Share',
        iconOnly = false
    }, ref) => {
        const [copied, setCopied] = React.useState(false);

        // Check if Web Share API is supported
        const isWebShareSupported = typeof navigator !== 'undefined' &&
            typeof navigator.share === 'function' &&
            typeof navigator.canShare === 'function';

        const handleShare = useCallback(async () => {
            const data: ShareData = {
                title: shareData.title,
                text: shareData.text,
                url: shareData.url || window.location.href
            };

            // Try Web Share API first
            if (isWebShareSupported) {
                try {
                    // Check if we can share this data
                    if (navigator.canShare(data)) {
                        await navigator.share(data);
                        onShare?.(data);
                        return;
                    }
                } catch (error) {
                    // User cancelled or error occurred
                    if ((error as Error).name !== 'AbortError') {
                        console.error('Share failed:', error);
                    }
                }
            }

            // Fallback: Copy URL to clipboard
            if (data.url) {
                try {
                    await navigator.clipboard.writeText(data.url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    onFallback?.(data);
                } catch (error) {
                    console.error('Failed to copy to clipboard:', error);
                }
            }
        }, [shareData, isWebShareSupported, onShare, onFallback]);

        return (
            <GlassButton
                ref={ref}
                size={iconOnly ? 'icon' : size}
                variant={variant}
                onClick={handleShare}
                className={cn("gap-2", className)}
                aria-label={copied ? 'Link copied!' : label}
                title={copied ? 'Link copied!' : label}
            >
                {copied ? (
                    <>
                        <Check size={size === 'lg' ? 20 : size === 'sm' ? 12 : 16} className="text-success" />
                        {!iconOnly && <span>Copied!</span>}
                    </>
                ) : (
                    <>
                        {isWebShareSupported ? (
                            <Share2 size={size === 'lg' ? 20 : size === 'sm' ? 12 : 16} />
                        ) : (
                            <Link2 size={size === 'lg' ? 20 : size === 'sm' ? 12 : 16} />
                        )}
                        {!iconOnly && <span>{label}</span>}
                    </>
                )}
            </GlassButton>
        );
    }
);

GlassShareButton.displayName = 'GlassShareButton';
