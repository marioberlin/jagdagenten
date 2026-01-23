import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home, BarChart3, Shield, Bot } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: React.ReactNode;
}

export function TradingBreadcrumb() {
    const location = useLocation();
    const pathname = location.pathname;

    // Build breadcrumb items
    const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/', icon: <Home className="w-4 h-4" /> },
        { label: 'Trading', href: '/trading', icon: <BarChart3 className="w-4 h-4" /> },
    ];

    // Add current page
    if (pathname !== '/trading') {
        // Check for bot edit (dynamic route)
        const botEditMatch = pathname.match(/^\/trading\/bots\/(\d+)$/);

        if (pathname === '/trading/risk-settings') {
            items.push({ label: 'Risk Settings', icon: <Shield className="w-4 h-4" /> });
        } else if (pathname === '/trading/bots') {
            items.push({ label: 'Bot Configuration', icon: <Bot className="w-4 h-4" /> });
        } else if (pathname === '/trading/bots/new') {
            items.push({ label: 'Bot Configuration', href: '/trading/bots', icon: <Bot className="w-4 h-4" /> });
            items.push({ label: 'New Bot' });
        } else if (botEditMatch) {
            items.push({ label: 'Bot Configuration', href: '/trading/bots', icon: <Bot className="w-4 h-4" /> });
            items.push({ label: `Edit Bot #${botEditMatch[1]}` });
        }
    }

    return (
        <nav className="flex items-center gap-1 text-sm mb-6">
            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-1">
                    {index > 0 && (
                        <ChevronRight className="w-4 h-4 text-tertiary" />
                    )}
                    {item.href ? (
                        <Link
                            to={item.href}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors text-secondary hover:text-primary"
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    ) : (
                        <span className="flex items-center gap-1.5 px-2 py-1 text-primary font-medium">
                            {item.icon}
                            <span>{item.label}</span>
                        </span>
                    )}
                </div>
            ))}
        </nav>
    );
}

export default TradingBreadcrumb;
