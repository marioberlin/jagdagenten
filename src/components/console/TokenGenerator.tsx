import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, AlertTriangle, X } from 'lucide-react';
import { GlassContainer } from '@/components/primitives/GlassContainer';
import { GlassButton } from '@/components/primitives/GlassButton';
import { cn } from '@/utils/cn';

type ExpiryOption = 'never' | '7d' | '30d' | '90d';
type ScopeOption = 'read' | 'write' | 'admin';

interface TokenGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (config: {
        name: string;
        expiry: ExpiryOption;
        scopes: ScopeOption[];
    }) => Promise<string>; // Returns the generated token
}

const EXPIRY_OPTIONS: Array<{ value: ExpiryOption; label: string }> = [
    { value: 'never', label: 'Never' },
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '90 days' },
];

const SCOPE_OPTIONS: Array<{ value: ScopeOption; label: string; description: string }> = [
    { value: 'read', label: 'Read', description: 'View tasks and contexts' },
    { value: 'write', label: 'Write', description: 'Create and modify tasks' },
    { value: 'admin', label: 'Admin', description: 'Full access including token management' },
];

/**
 * TokenGenerator
 * 
 * Modal for creating new API tokens with:
 * - Name input
 * - Expiry selection
 * - Scope selection (multi-select)
 * - Generated token display with copy button
 */
export function TokenGenerator({ isOpen, onClose, onGenerate }: TokenGeneratorProps) {
    const [name, setName] = useState('');
    const [expiry, setExpiry] = useState<ExpiryOption>('never');
    const [scopes, setScopes] = useState<ScopeOption[]>(['read']);
    const [generatedToken, setGeneratedToken] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!name.trim()) return;

        setIsGenerating(true);
        try {
            const token = await onGenerate({ name, expiry, scopes });
            setGeneratedToken(token);
        } catch (error) {
            console.error('[TokenGenerator] Failed to generate token:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = async () => {
        if (!generatedToken) return;
        await navigator.clipboard.writeText(generatedToken);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClose = () => {
        // Reset state
        setName('');
        setExpiry('never');
        setScopes(['read']);
        setGeneratedToken(null);
        setCopied(false);
        onClose();
    };

    const toggleScope = (scope: ScopeOption) => {
        setScopes(prev =>
            prev.includes(scope)
                ? prev.filter(s => s !== scope)
                : [...prev, scope]
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <GlassContainer className="w-[500px] p-6" border>
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">
                                    {generatedToken ? 'Token Generated' : 'Generate API Token'}
                                </h3>
                                <button
                                    onClick={handleClose}
                                    className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {generatedToken ? (
                                /* Token Display */
                                <div className="space-y-4">
                                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                                        <div className="flex items-start gap-2 mb-3">
                                            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-white/80">
                                                Copy this token now. You won't be able to see it again!
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 bg-black/30 px-3 py-2 rounded text-sm text-white font-mono break-all select-all">
                                                {generatedToken}
                                            </code>
                                            <button
                                                onClick={handleCopy}
                                                className="p-2 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                            >
                                                {copied ? (
                                                    <Check size={18} className="text-green-400" />
                                                ) : (
                                                    <Copy size={18} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <GlassButton className="w-full" onClick={handleClose}>
                                        Done
                                    </GlassButton>
                                </div>
                            ) : (
                                /* Token Form */
                                <div className="space-y-4">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm text-white/60 mb-2">
                                            Token Name
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Production Key"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50"
                                        />
                                    </div>

                                    {/* Expiry */}
                                    <div>
                                        <label className="block text-sm text-white/60 mb-2">
                                            Expiration
                                        </label>
                                        <div className="flex gap-2">
                                            {EXPIRY_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => setExpiry(opt.value)}
                                                    className={cn(
                                                        'px-4 py-2 rounded-lg text-sm transition-colors',
                                                        expiry === opt.value
                                                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                                                    )}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Scopes */}
                                    <div>
                                        <label className="block text-sm text-white/60 mb-2">
                                            Permissions
                                        </label>
                                        <div className="space-y-2">
                                            {SCOPE_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => toggleScope(opt.value)}
                                                    className={cn(
                                                        'w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors',
                                                        scopes.includes(opt.value)
                                                            ? 'bg-cyan-500/20 border border-cyan-500/30'
                                                            : 'bg-white/5 hover:bg-white/10'
                                                    )}
                                                >
                                                    <div>
                                                        <p className={cn(
                                                            'text-sm font-medium',
                                                            scopes.includes(opt.value) ? 'text-cyan-400' : 'text-white'
                                                        )}>
                                                            {opt.label}
                                                        </p>
                                                        <p className="text-xs text-white/50">{opt.description}</p>
                                                    </div>
                                                    <div className={cn(
                                                        'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                                                        scopes.includes(opt.value)
                                                            ? 'border-cyan-400 bg-cyan-400'
                                                            : 'border-white/30'
                                                    )}>
                                                        {scopes.includes(opt.value) && (
                                                            <Check size={12} className="text-black" />
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-4">
                                        <GlassButton
                                            variant="ghost"
                                            className="flex-1"
                                            onClick={handleClose}
                                        >
                                            Cancel
                                        </GlassButton>
                                        <GlassButton
                                            className="flex-1"
                                            disabled={!name.trim() || scopes.length === 0 || isGenerating}
                                            onClick={handleGenerate}
                                        >
                                            {isGenerating ? 'Generating...' : 'Generate'}
                                        </GlassButton>
                                    </div>
                                </div>
                            )}
                        </GlassContainer>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
