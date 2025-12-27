import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { GlassButton } from '../primitives/GlassButton';
import { VibrantText } from '../data-display/VibrantText';
import { cn } from '@/utils/cn';

interface DemoLayoutProps {
    /** Page title displayed in the header */
    title: string;
    /** Optional subtitle/description */
    subtitle?: string;
    /** Path to navigate back to (defaults to "/") */
    backTo?: string;
    /** Label for the back button (defaults to "Back to Home") */
    backLabel?: string;
    /** Main content */
    children: ReactNode;
    /** Additional className for the wrapper */
    className?: string;
    /** Whether to show page padding (defaults to true) */
    padded?: boolean;
}

export const DemoLayout = ({
    title,
    subtitle,
    backTo = '/',
    backLabel = 'Back to Home',
    children,
    className,
    padded = true,
}: DemoLayoutProps) => {
    return (
        <div className={cn(
            "min-h-screen text-primary relative z-10",
            padded && "p-8 pt-24",
            className
        )}>
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-8">
                <div className="flex items-center gap-4">
                    <Link to={backTo}>
                        <GlassButton
                            variant="ghost"
                            className="rounded-full w-12 h-12 !p-0"
                            aria-label={backLabel}
                        >
                            <ArrowLeft size={24} />
                        </GlassButton>
                    </Link>
                    <div>
                        <VibrantText intensity="high" className="text-3xl font-bold tracking-tight">
                            {title}
                        </VibrantText>
                        {subtitle && (
                            <p className="text-secondary text-sm">{subtitle}</p>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto" id="main-content">
                {children}
            </main>
        </div>
    );
};

DemoLayout.displayName = 'DemoLayout';
