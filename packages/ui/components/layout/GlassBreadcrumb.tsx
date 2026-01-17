import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { GlassContainer } from '../primitives/GlassContainer';

interface GlassBreadcrumbItem {
    label: string;
    href?: string;
    isActive?: boolean;
    icon?: React.ReactNode;
}

interface GlassBreadcrumbProps {
    items: GlassBreadcrumbItem[];
    className?: string;
    showHomeIcon?: boolean;
}

export const GlassBreadcrumb = ({ items, className, showHomeIcon = true }: GlassBreadcrumbProps) => {
    return (
        <nav aria-label="Breadcrumb" className={cn("flex", className)}>
            <GlassContainer material="thin" className="inline-flex items-center px-4 py-2 rounded-full">
                <ol className="flex items-center space-x-2">
                    {items.map((item, index) => {
                        const isFirst = index === 0;

                        return (
                            <li key={index} className="flex items-center">
                                {index > 0 && (
                                    <ChevronRight size={14} className="mx-2 text-secondary/50" aria-hidden="true" />
                                )}
                                {item.href && !item.isActive ? (
                                    <Link
                                        to={item.href}
                                        className="flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-primary transition-colors hover:underline underline-offset-4"
                                    >
                                        {isFirst && showHomeIcon ? (
                                            <Home size={14} className="flex-shrink-0" aria-hidden="true" />
                                        ) : item.icon ? (
                                            <span className="flex-shrink-0">{item.icon}</span>
                                        ) : null}
                                        <span>{item.label}</span>
                                    </Link>
                                ) : (
                                    <span
                                        className={cn(
                                            "flex items-center gap-1.5 text-sm font-medium",
                                            item.isActive ? "text-primary font-bold" : "text-secondary"
                                        )}
                                        aria-current={item.isActive ? "page" : undefined}
                                    >
                                        {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                                        {item.label}
                                    </span>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </GlassContainer>
        </nav>
    );
};

GlassBreadcrumb.displayName = 'GlassBreadcrumb';
