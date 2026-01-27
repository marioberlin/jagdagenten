import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Fingerprint, Mail, Loader2, AlertCircle, Shield } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useAuthStore, selectBiometricMethodAvailable, selectGoogleMethodAvailable } from '@/stores/authStore';
import { authenticateBiometric } from '@/services/biometricService';
import { useAutoLogin } from '@/hooks/useAutoLogin';
import { EmailLoginForm } from './EmailLoginForm';

export const LockScreen: React.FC = () => {
  // Auto-login hook (enabled by default in dev & production)
  useAutoLogin();

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  const hasBiometricMethod = useAuthStore(selectBiometricMethodAvailable);
  const hasGoogleMethod = useAuthStore(selectGoogleMethodAvailable) || !!import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const hasEmailMethod = useAuthStore((s) => s.emailEnabled);
  const biometricCredentials = useAuthStore((s) => s.biometricCredentials);
  const googleCredential = useAuthStore((s) => s.googleCredential);
  const unlock = useAuthStore((s) => s.unlock);

  // Focus trap with no escape dismiss
  const containerRef = useFocusTrap(true);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleBiometric = useCallback(async () => {
    setIsAuthenticating(true);
    setError(null);
    try {
      const credentialIds = biometricCredentials.map((c) => c.credentialId);
      const success = await authenticateBiometric(credentialIds);
      if (success) {
        unlock();
      } else {
        setError('Authentication failed. Try again.');
        setShakeKey((k) => k + 1);
      }
    } catch {
      setError('Authentication was cancelled.');
      setShakeKey((k) => k + 1);
    } finally {
      setIsAuthenticating(false);
    }
  }, [biometricCredentials, unlock]);

  const handleGoogle = useCallback(async () => {
    setIsAuthenticating(true);
    setError(null);

    try {
      // Load GIS if not loaded
      if (!window.google?.accounts?.oauth2) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
          document.head.appendChild(script);
        });
      }

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        setError('Google OAuth not configured.');
        setIsAuthenticating(false);
        return;
      }

      // Use token client for authentication
      const tokenClient = window.google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile',
        callback: async (response) => {
          try {
            if (response.error || !response.access_token) {
              setError('Google sign-in failed.');
              setShakeKey((k) => k + 1);
              setIsAuthenticating(false);
              return;
            }

            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${response.access_token}` },
            });
            const userInfo = await userInfoRes.json();

            // If no credential stored (New/Unknown User), CLAIM this session
            if (!googleCredential) {
              // Save this user as the owner of this session
              useAuthStore.getState().setGoogleCredential({
                email: userInfo.email,
                name: userInfo.name,
                avatarUrl: userInfo.picture,
                linkedAt: Date.now()
              });
              useAuthStore.getState().setGoogleEnabled(true);
              unlock();
            } else if (userInfo.email === googleCredential.email) {
              unlock();
            } else {
              setError(`Account mismatch. Expected ${googleCredential.email}.`);
              setShakeKey((k) => k + 1);
            }
          } catch (error) {
            setError('Failed to verify Google account.');
            setShakeKey((k) => k + 1);
          } finally {
            setIsAuthenticating(false);
          }
        },
        error_callback: () => {
          setError('Google sign-in was cancelled.');
          setShakeKey((k) => k + 1);
          setIsAuthenticating(false);
        },
      });

      tokenClient.requestAccessToken({ prompt: '' });
    } catch (error) {
      setError('Failed to initialize Google sign-in.');
      setIsAuthenticating(false);
    }
  }, [googleCredential, unlock]);

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-2xl"
    >
      <motion.div
        ref={containerRef}
        key={shakeKey}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, x: error ? [0, -8, 8, -4, 4, 0] : 0 }}
        transition={{
          scale: { type: 'spring', damping: 25, stiffness: 300 },
          x: { duration: 0.4 },
        }}
        className="w-full max-w-sm mx-4 p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl"
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
            <Shield size={32} className="text-white/80" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-semibold text-white text-center mb-2">
          LiquidOS is Locked
        </h1>
        <p className="text-sm text-white/50 text-center mb-8">
          Authenticate to continue
        </p>

        {/* Auth Buttons */}
        <div className="space-y-3">
          {hasBiometricMethod && (
            <button
              onClick={handleBiometric}
              disabled={isAuthenticating}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAuthenticating ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Fingerprint size={20} />
              )}
              <span className="font-medium">Unlock with Biometric</span>
            </button>
          )}

          {hasGoogleMethod && (
            <button
              onClick={handleGoogle}
              disabled={isAuthenticating}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAuthenticating ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Mail size={20} />
              )}
              <span className="font-medium">Unlock with Google</span>
            </button>
          )}

          {/* Email/Password Form */}
          {hasEmailMethod && (
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-white/30">or continue with email</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <EmailLoginForm />
            </div>
          )}
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/30"
            >
              <AlertCircle size={14} className="text-red-400 shrink-0" />
              <span className="text-xs text-red-300">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );

  return createPortal(content, document.body);
};
