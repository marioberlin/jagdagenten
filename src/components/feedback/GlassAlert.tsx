import React from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface GlassAlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'destructive' | 'success' | 'warning';
    title?: string;
    icon?: React.ReactNode;
}

export const GlassAlert = React.forwardRef<HTMLDivElement, GlassAlertProps>(
    ({ className, variant = 'default', title, children, icon, ...props }, ref) => {
        const variantStyles = {
            default: 'bg-white/5 border-white/10 text-primary',
            destructive: 'bg-red-500/10 border-red-500/20 text-red-500',
            success: 'bg-green-500/10 border-green-500/20 text-green-500',
            warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
        };

        const DefaultIcons = {
            default: <Info className="h-4 w-4" />,
            destructive: <AlertCircle className="h-4 w-4" />,
            success: <CheckCircle className="h-4 w-4" />,
            warning: <AlertTriangle className="h-4 w-4" />,
        };

        return (
            <GlassContainer
                ref={ref}
                material="thin"
                className={cn(
                    "relative w-full rounded-2xl p-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground border",
                    variantStyles[variant],
                    className
                )}
                {...props}
            >
                <div className="flex gap-4">
                    <div className="mt-1 shrink-0">
                        {icon || DefaultIcons[variant]}
                    </div>
                    <div className="flex flex-col gap-1">
                        {title && <h5 className="font-medium leading-none tracking-tight">{title}</h5>}
                        <div className="text-sm opacity-90 [&_p]:leading-relaxed">
                            {children}
                        </div>
                    </div>
                </div>
            </GlassContainer>
        );
    }
);

GlassAlert.displayName = "GlassAlert";
