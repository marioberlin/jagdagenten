import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassContainer } from '../primitives/GlassContainer';
import { X, ArrowRight, Zap, Activity, BarChart2 } from 'lucide-react';


interface CardData {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

const CARDS: CardData[] = [
    {
        id: '1',
        title: 'Lightning Execution',
        description: 'Zero-latency trade execution across distributed nodes.',
        icon: <Zap size={24} />,
        color: 'text-amber-400',
    },
    {
        id: '2',
        title: 'Real-time Analytics',
        description: 'Live market data processing with sub-ms updates.',
        icon: <Activity size={24} />,
        color: 'text-emerald-400',
    },
    {
        id: '3',
        title: 'Deep Liquidity',
        description: 'Aggregated order books from top tier exchanges.',
        icon: <BarChart2 size={24} />,
        color: 'text-blue-400',
    },
];

export const GlassMorphCard = () => {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    return (
        <div className="relative w-full h-[500px] flex items-center justify-center p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
                {CARDS.map((card) => (
                    <motion.div
                        key={card.id}
                        layoutId={`card-container-${card.id}`}
                        onClick={() => setSelectedId(card.id)}
                        className="cursor-pointer"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <GlassContainer
                            interactive
                            className="h-full p-6 flex flex-col relative overflow-hidden"
                            style={{ borderRadius: '1.5rem' }} // Explicit radius for morphing
                        >
                            {/* Icon Background Blob */}
                            <motion.div
                                layoutId={`card-blob-${card.id}`}
                                className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-20 blur-2xl ${card.color.replace('text-', 'bg-')}`}
                            />

                            <div className="flex items-start gap-4">
                                <motion.div
                                    layoutId={`card-icon-${card.id}`}
                                    className={`p-3 rounded-xl bg-glass-surface ${card.color} shrink-0`}
                                >
                                    {card.icon}
                                </motion.div>

                                <div>
                                    <motion.h3
                                        layoutId={`card-title-${card.id}`}
                                        className="text-lg font-semibold text-primary mb-2"
                                    >
                                        {card.title}
                                    </motion.h3>
                                    <motion.p
                                        layoutId={`card-desc-${card.id}`}
                                        className="text-sm text-secondary"
                                    >
                                        {card.description}
                                    </motion.p>
                                </div>
                            </div>

                            <motion.div
                                layoutId={`card-button-${card.id}`}
                                className="mt-auto pt-4 flex items-center text-xs font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                View Details <ArrowRight size={14} className="ml-1" />
                            </motion.div>
                        </GlassContainer>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {selectedId && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm"
                            onClick={() => setSelectedId(null)}
                        />

                        {/* Expanded Card */}
                        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                            {CARDS.filter(c => c.id === selectedId).map(card => (
                                <motion.div
                                    layoutId={`card-container-${card.id}`}
                                    key={card.id}
                                    className="w-full max-w-2xl h-[400px] pointer-events-auto"
                                    style={{ borderRadius: '1.5rem' }}
                                >
                                    <GlassContainer
                                        material="thick" // Thicker material for modal
                                        className="w-full h-full p-8 flex flex-col relative overflow-hidden"
                                    >
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedId(null); }}
                                            className="absolute top-6 right-6 p-2 rounded-full hover:bg-glass-surface-hover transition-colors z-20"
                                        >
                                            <X size={20} className="text-secondary" />
                                        </button>

                                        <div className="flex items-start gap-6">
                                            <motion.div
                                                layoutId={`card-icon-${card.id}`}
                                                className={`p-4 rounded-2xl bg-glass-surface ${card.color}`}
                                            >
                                                {React.cloneElement(card.icon as React.ReactElement<{ size?: number }>, { size: 32 })}
                                            </motion.div>

                                            <div className="flex-1 pt-1">
                                                <motion.h3
                                                    layoutId={`card-title-${card.id}`}
                                                    className="text-3xl font-bold text-primary mb-2"
                                                >
                                                    {card.title}
                                                </motion.h3>
                                                <motion.div
                                                    layoutId={`card-blob-${card.id}`}
                                                    className={`absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl ${card.color.replace('text-', 'bg-')}`}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-8 space-y-4">
                                            <motion.p
                                                layoutId={`card-desc-${card.id}`}
                                                className="text-lg text-secondary"
                                            >
                                                {card.description}
                                            </motion.p>

                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 }}
                                                className="p-4 rounded-xl bg-glass-surface/50 border border-white/5"
                                            >
                                                <h4 className="text-sm font-medium text-primary mb-2">Technical Specs</h4>
                                                <div className="grid grid-cols-2 gap-4 text-xs text-secondary">
                                                    <div>Latency: &lt;50ms</div>
                                                    <div>Throughput: 10k TPS</div>
                                                    <div>Uptime: 99.99%</div>
                                                    <div>Encryption: AES-256</div>
                                                </div>
                                            </motion.div>
                                        </div>

                                        <motion.div
                                            layoutId={`card-button-${card.id}`}
                                            className="mt-auto pt-6 border-t border-white/10 flex justify-end"
                                        >
                                            <button
                                                className="px-6 py-2 rounded-lg bg-accent text-white font-medium hover:brightness-110 transition-all"
                                                onClick={() => setSelectedId(null)}
                                            >
                                                Action
                                            </button>
                                        </motion.div>
                                    </GlassContainer>
                                </motion.div>
                            ))}
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
