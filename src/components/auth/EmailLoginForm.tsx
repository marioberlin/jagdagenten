/**
 * Email Login Form Component
 * 
 * Provides email/password login UI for LockScreen
 */

import React, { useState, FormEvent } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';

export const EmailLoginForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loginWithEmail = useAuthStore((s) => s.loginWithEmail);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const success = await loginWithEmail(email, password);

            if (!success) {
                setError('Invalid email or password');
            }
        } catch (err) {
            setError('Failed to login. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email Input */}
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                    <Mail size={18} />
                </div>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors disabled:opacity-50"
                    required
                />
            </div>

            {/* Password Input */}
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                    <Lock size={18} />
                </div>
                <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    disabled={isLoading}
                    className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors disabled:opacity-50"
                    required
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                    disabled={isLoading}
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading && <Loader2 size={18} className="animate-spin" />}
                <span>{isLoading ? 'Signing in...' : 'Sign in'}</span>
            </button>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/30"
                    >
                        <AlertCircle size={14} className="text-red-400 shrink-0" />
                        <span className="text-xs text-red-300">{error}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </form>
    );
};
