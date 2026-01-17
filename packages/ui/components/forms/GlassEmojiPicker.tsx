
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { GlassPopover } from '../overlays/GlassPopover';
import { GlassButton } from '../primitives/GlassButton';
import { Smile } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface GlassEmojiPickerProps {
    /**
     * Callback when emoji is clicked
     */
    onEmojiClick: (emojiData: EmojiClickData) => void;

    /**
     * Trigger button content (default: Smile icon)
     */
    trigger?: React.ReactNode;

    /**
     * Class name for container
     */
    className?: string;
}

export function GlassEmojiPicker({
    onEmojiClick,
    trigger,
    className
}: GlassEmojiPickerProps) {
    // const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={cn("relative inline-block", className)}>
            <style>{`
                .glass-emoji-picker .EmojiPickerReact {
                    --epr-bg-color: rgba(20, 20, 20, 0.8) !important;
                    --epr-category-label-bg-color: transparent !important;
                    --epr-text-color: rgba(255, 255, 255, 0.9) !important;
                    --epr-search-input-bg-color: rgba(255, 255, 255, 0.05) !important;
                    --epr-search-input-text-color: white !important;
                    --epr-hover-bg-color: rgba(255, 255, 255, 0.1) !important;
                    --epr-focus-bg-color: rgba(255, 255, 255, 0.1) !important;
                    --epr-picker-border-color: rgba(255, 255, 255, 0.1) !important;
                    backdrop-filter: blur(12px) !important;
                    -webkit-backdrop-filter: blur(12px) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
                    border-radius: 16px !important;
                }
                .glass-emoji-picker .EmojiPickerReact input.epr-search {
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                }
                .glass-emoji-picker .EmojiPickerReact li.epr-emoji-category > .epr-emoji-category-label {
                     font-size: 16px !important; 
                }
                .glass-emoji-picker .EmojiPickerReact button.epr-emoji {
                    width: 36px !important;
                    height: 36px !important;
                }
                .glass-emoji-picker .EmojiPickerReact img.epr-emoji-img {
                    width: 24px !important;
                    height: 24px !important;
                }
            `}</style>

            <GlassPopover
                trigger={
                    trigger || (
                        <GlassButton
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-glass-surface"
                        >
                            <Smile size={20} className="text-secondary hover:text-primary transition-colors" />
                        </GlassButton>
                    )
                }
                content={
                    <div className="glass-emoji-picker">
                        <EmojiPicker
                            onEmojiClick={(data) => {
                                onEmojiClick(data);
                                // Optional: setIsOpen(false) if we want to close on select
                            }}
                            theme={Theme.DARK}
                            searchDisabled={false}
                            skinTonesDisabled
                            width={350}
                            height={450}
                        />
                    </div>
                }
            />
        </div>
    );
}

GlassEmojiPicker.displayName = 'GlassEmojiPicker';
