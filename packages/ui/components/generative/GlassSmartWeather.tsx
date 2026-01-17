import { LiquidSmartComponent } from '../../liquid-engine/react';
import { GlassContainer } from '../primitives/GlassContainer';
import { Cloud, Sun, CloudRain, Wind } from 'lucide-react';

// Note: Ensure lucide-react is installed or use substitute icons if not available
// Assuming lucide-react is standard in this project based on context

export function GlassSmartWeather() {
    return (
        <LiquidSmartComponent
            name="get_weather"
            render={({ status, args }) => {
                const isLoading = status === 'running';

                // Map condition to icon
                const getIcon = (cond: string) => {
                    switch (cond) {
                        case 'sunny': return <Sun className="w-12 h-12 text-yellow-400" />;
                        case 'rainy': return <CloudRain className="w-12 h-12 text-blue-400" />;
                        case 'windy': return <Wind className="w-12 h-12 text-gray-300" />;
                        case 'cloudy': default: return <Cloud className="w-12 h-12 text-gray-400" />;
                    }
                };

                return (
                    <GlassContainer className="w-full max-w-sm p-6 overflow-hidden relative group">
                        {/* Background blob for effect */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all duration-500" />

                        <div className="relative z-10 flex flex-col items-center text-center">
                            {/* Location */}
                            <h2 className={`text-2xl font-bold text-white mb-2 ${isLoading && !args.location ? 'animate-pulse bg-white/10 w-24 h-8 rounded' : ''}`}>
                                {args.location || "Searching..."}
                            </h2>

                            {/* Icon & Temp */}
                            <div className="flex items-center space-x-4 my-6">
                                <div className={`transition-all duration-500 ${isLoading ? 'opacity-50 scale-90' : 'opacity-100 scale-100'}`}>
                                    {getIcon(args.condition)}
                                </div>
                                <div className="text-5xl font-thin text-white">
                                    {args.temperature !== undefined ? `${args.temperature}°` : '--°'}
                                </div>
                            </div>

                            {/* Status/Forecast */}
                            <div className="w-full text-sm text-gray-400 mt-2">
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                                        Updating forecast...
                                    </span>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-glass-border/30">
                                        {/* Mock forecast if not provided */}
                                        {(args.forecast || ['Mon', 'Tue', 'Wed']).map((day: string, i: number) => (
                                            <div key={i} className="flex flex-col items-center">
                                                <span className="opacity-70">{day}</span>
                                                <Cloud className="w-4 h-4 mt-1 opacity-50" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </GlassContainer>
                );
            }}
        />
    );
}
