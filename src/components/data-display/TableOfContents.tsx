import { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';

export interface TOCItem {
    id: string;
    label: string;
    level?: 1 | 2 | 3;
}

interface TableOfContentsProps {
    /** List of items to display */
    items: TOCItem[];
    /** Title for the TOC */
    title?: string;
    /** Additional className */
    className?: string;
}

export const TableOfContents = ({
    items,
    title = 'On This Page',
    className,
}: TableOfContentsProps) => {
    const [activeId, setActiveId] = useState<string>('');

    // Track scroll position to highlight active section
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            {
                rootMargin: '-20% 0% -35% 0%',
                threshold: 0,
            }
        );

        items.forEach((item) => {
            const element = document.getElementById(item.id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [items]);

    const handleClick = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (items.length === 0) return null;

    return (
        <nav className={cn("space-y-3", className)}>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-tertiary">
                {title}
            </h4>
            <ul className="space-y-1">
                {items.map((item) => (
                    <li key={item.id}>
                        <button
                            onClick={() => handleClick(item.id)}
                            className={cn(
                                "block w-full text-left text-sm py-1 transition-colors duration-200",
                                "hover:text-primary",
                                item.level === 2 && "pl-3",
                                item.level === 3 && "pl-6",
                                activeId === item.id
                                    ? "text-accent font-medium"
                                    : "text-accent/70"
                            )}
                        >
                            {item.label}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

TableOfContents.displayName = 'TableOfContents';
