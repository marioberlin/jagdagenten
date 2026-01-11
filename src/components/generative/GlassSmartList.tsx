import { LiquidSmartComponent } from '../../liquid-engine/react';
import { GlassContainer } from '../primitives/GlassContainer';
import { Check, Loader2 } from 'lucide-react';

export function GlassSmartList() {
    return (
        <LiquidSmartComponent
            name="generate_list"
            render={({ status, args }) => {
                const isLoading = status === 'running';
                const items = args.items || [];

                return (
                    <GlassContainer className="w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                                {args.title || 'Generating List...'}
                            </h3>
                            {isLoading && <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />}
                        </div>

                        <div className="space-y-3">
                            {items.map((item: string, idx: number) => (
                                <div
                                    key={idx}
                                    className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300"
                                >
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                                        <Check className="w-3 h-3 text-green-400" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-200">{item}</span>
                                </div>
                            ))}

                            {/* Ghost item for loading state */}
                            {isLoading && (
                                <div className="flex items-center space-x-3 p-3 opacity-50">
                                    <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-600 animate-spin" />
                                    <span className="text-sm text-gray-500 animate-pulse">Thinking...</span>
                                </div>
                            )}
                        </div>
                    </GlassContainer>
                );
            }}
        />
    );
}
