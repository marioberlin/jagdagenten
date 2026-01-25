import { useNavigate } from 'react-router-dom';
import { useState, useCallback, useMemo } from 'react';
import { GlassContainer } from '@/components';
import { GlassButton } from '../../components/primitives/GlassButton';
import { AgSidebar } from '../../components/generative/AgSidebar';
import { LiquidClient } from '../../liquid-engine/client';
import { LiquidProvider, useLiquidReadable, useLiquidAction } from '../../liquid-engine/react';
import { LayoutDashboard, Plus, TrendingUp, TrendingDown, Users, DollarSign, ShoppingCart, Activity, Trash2, Book } from 'lucide-react';
import { DashboardAgentService } from "../../services/a2a/DashboardAgentService";
import { cn } from '@/utils/cn';
import { GlassBreadcrumb } from '../../components/layout/GlassBreadcrumb';

// Initialize the engine client
const liquidClient = new LiquidClient();

// Widget types
type WidgetType = 'metric' | 'chart' | 'list';

interface DashboardWidget {
    id: string;
    type: WidgetType;
    title: string;
    value?: string | number;
    change?: number;
    icon?: string;
    color?: string;
    data?: any;
}

const ICON_MAP: Record<string, any> = {
    users: Users,
    dollar: DollarSign,
    cart: ShoppingCart,
    activity: Activity,
    trending: TrendingUp
};

// Inner component with hooks
function DashboardContent({ widgets, setWidgets }: { widgets: DashboardWidget[], setWidgets: React.Dispatch<React.SetStateAction<DashboardWidget[]>> }) {


    // Make dashboard state readable to AI
    useLiquidReadable({
        description: "SaaS Dashboard Widgets - Current dashboard configuration and metrics",
        value: { widgets, widgetCount: widgets.length }
    });

    // Create widget action
    useLiquidAction({
        name: "create_widget",
        description: "Create a new dashboard widget with specified properties",
        parameters: [
            { name: "type", type: "string", description: "Widget type: metric, chart, or list", required: true },
            { name: "title", type: "string", description: "Widget title", required: true },
            { name: "value", type: "string", description: "Display value (for metric type)", required: false },
            { name: "change", type: "number", description: "Percentage change (positive or negative)", required: false },
            { name: "icon", type: "string", description: "Icon name: users, dollar, cart, activity, trending", required: false },
            { name: "color", type: "string", description: "Color: green, blue, purple, orange, red, cyan", required: false }
        ],
        handler: (args: Partial<DashboardWidget> & { type: WidgetType; title: string }) => {
            const newWidget: DashboardWidget = {
                id: Date.now().toString(),
                type: args.type,
                title: args.title,
                value: args.value,
                change: args.change,
                icon: args.icon || 'activity',
                color: args.color || 'blue'
            };
            setWidgets(prev => [...prev, newWidget]);
            return { success: true, widgetId: newWidget.id };
        }
    });

    // Update widget action
    useLiquidAction({
        name: "update_widget",
        description: "Update an existing dashboard widget",
        parameters: [
            { name: "widgetId", type: "string", description: "ID of the widget to update", required: true },
            { name: "title", type: "string", description: "New title", required: false },
            { name: "value", type: "string", description: "New value", required: false },
            { name: "change", type: "number", description: "New change percentage", required: false }
        ],
        handler: (args: { widgetId: string; title?: string; value?: string; change?: number }) => {
            setWidgets(prev => prev.map(w =>
                w.id === args.widgetId
                    ? { ...w, ...args, id: w.id }
                    : w
            ));
            return { success: true };
        }
    });

    // Delete widget action
    useLiquidAction({
        name: "delete_widget",
        description: "Remove a widget from the dashboard",
        parameters: [
            { name: "widgetId", type: "string", description: "ID of the widget to delete", required: true }
        ],
        handler: (args: { widgetId: string }) => {
            setWidgets(prev => prev.filter(w => w.id !== args.widgetId));
            return { success: true };
        }
    });

    const handleDeleteWidget = useCallback((id: string) => {
        setWidgets(prev => prev.filter(w => w.id !== id));
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {widgets.map(widget => {
                const IconComponent = ICON_MAP[widget.icon || 'activity'] || Activity;
                const isPositive = (widget.change || 0) >= 0;

                const colorClasses: Record<string, string> = {
                    green: 'bg-green-500/10 text-green-400',
                    blue: 'bg-blue-500/10 text-blue-400',
                    purple: 'bg-purple-500/10 text-purple-400',
                    orange: 'bg-orange-500/10 text-orange-400',
                    red: 'bg-red-500/10 text-red-400',
                    cyan: 'bg-cyan-500/10 text-cyan-400'
                };

                return (
                    <GlassContainer
                        key={widget.id}
                        className="p-5 group relative"
                        border
                        material="thin"
                    >
                        {/* Delete button */}
                        <button
                            onClick={() => handleDeleteWidget(widget.id)}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                        >
                            <Trash2 size={14} />
                        </button>

                        <div className="flex items-start justify-between mb-3">
                            <div className={cn("p-2 rounded-lg", colorClasses[widget.color || 'blue'])}>
                                <IconComponent size={20} />
                            </div>
                            {widget.change !== undefined && (
                                <div className={cn(
                                    "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                                    isPositive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                                )}>
                                    {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    {Math.abs(widget.change)}%
                                </div>
                            )}
                        </div>

                        <div className="text-2xl font-bold text-white mb-1">
                            {widget.value}
                        </div>
                        <div className="text-sm text-secondary">
                            {widget.title}
                        </div>
                        <div className="text-[10px] text-white/30 mt-2">
                            ID: {widget.id}
                        </div>
                    </GlassContainer>
                );
            })}

            {/* Add Widget Placeholder */}
            <GlassContainer
                className="p-5 flex flex-col items-center justify-center min-h-[140px] border-dashed cursor-pointer hover:bg-white/5 transition-colors"
                border
                material="thin"
            >
                <div className="p-3 rounded-full bg-white/5 mb-2">
                    <Plus size={24} className="text-secondary" />
                </div>
                <span className="text-sm text-secondary">Ask Copilot to add a widget</span>
            </GlassContainer>
        </div>
    );
}

export default function DynamicDashboardDemo() {
    const navigate = useNavigate();
    const [widgets, setWidgets] = useState<DashboardWidget[]>([
        { id: '1', type: 'metric', title: 'Total Revenue', value: '$124,500', change: 12.5, icon: 'dollar', color: 'green' },
        { id: '2', type: 'metric', title: 'Active Users', value: '8,420', change: -2.3, icon: 'users', color: 'blue' },
        { id: '3', type: 'metric', title: 'Orders', value: '1,247', change: 8.1, icon: 'cart', color: 'purple' },
        { id: '4', type: 'metric', title: 'Conversion Rate', value: '3.24%', change: 0.5, icon: 'activity', color: 'orange' }
    ]);
    return (
        <LiquidProvider client={liquidClient}>
            <div className="h-screen bg-glass-base flex overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

                    {/* Header */}
                    <header className="p-6 pb-4 z-10">
                        <GlassBreadcrumb
                            className="mb-4"
                            items={[
                                { label: 'Home', href: '/' },
                                { label: 'AG-UI Demos', href: '/showcase#agui' },
                                { label: 'Dashboard', isActive: true }
                            ]}
                        />
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                            <LayoutDashboard size={24} />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-white">
                                Dynamic Dashboard
                            </h1>
                            <p className="text-sm text-white/50">
                                Ask Copilot to add, update, or remove dashboard widgets.
                            </p>
                        </div>
                        <GlassButton
                            size="sm"
                            variant="secondary"
                            onClick={() => navigate('/docs/dynamic-dashboard')}
                        >
                            <Book size={16} className="mr-2" />
                            Documentation
                        </GlassButton>
                    </header>

                    {/* Dashboard Area */}
                    <main className="flex-1 p-6 pt-0 overflow-auto">
                        <DashboardContent widgets={widgets} setWidgets={setWidgets} />
                    </main>
                </div>

                {/* Sidebar */}
                <AgSidebar initialService={useMemo(() => new DashboardAgentService('', (data) => {
                    if (Array.isArray(data)) {
                        setWidgets(data);
                    }
                }), [])} />
            </div>
        </LiquidProvider>
    );
}
