import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Fingerprint, Lock, Trash2, Plus, Clock,
  AlertTriangle, Mail, Check, X, User,
} from 'lucide-react';
import {
  useAuthStore,
  selectHasAnyCredentials,
  selectBiometricMethodAvailable,
  selectGoogleMethodAvailable,
} from '@/stores/authStore';
import {
  isBiometricSupported,
  isPlatformAuthenticatorAvailable,
  registerBiometric,
} from '@/services/biometricService';
import { WakeWordTraining } from './WakeWordTraining';
import { useWakeWordStore } from '@/stores/wakeWordStore';

export const SecurityPanel: React.FC = () => {
  const authEnabled = useAuthStore((s) => s.authEnabled);
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled);
  const googleEnabled = useAuthStore((s) => s.googleEnabled);
  const emailEnabled = useAuthStore((s) => s.emailEnabled);
  const autoLoginEnabled = useAuthStore((s) => s.autoLoginEnabled);
  const biometricCredentials = useAuthStore((s) => s.biometricCredentials);
  const googleCredential = useAuthStore((s) => s.googleCredential);
  const emailCredential = useAuthStore((s) => s.emailCredential);
  const sessionTimeoutMinutes = useAuthStore((s) => s.sessionTimeoutMinutes);
  const setupCompleted = useAuthStore((s) => s.setupCompleted);
  const hasCredentials = useAuthStore(selectHasAnyCredentials);
  const hasBiometricMethod = useAuthStore(selectBiometricMethodAvailable);
  const hasGoogleMethod = useAuthStore(selectGoogleMethodAvailable);
  const hasWakeWordTrained = useWakeWordStore((s) => s.isTrained && s.enabled);

  const setAuthEnabled = useAuthStore((s) => s.setAuthEnabled);
  const setBiometricEnabled = useAuthStore((s) => s.setBiometricEnabled);
  const setGoogleEnabled = useAuthStore((s) => s.setGoogleEnabled);
  const setEmailEnabled = useAuthStore((s) => s.setEmailEnabled);
  const setAutoLoginEnabled = useAuthStore((s) => s.setAutoLoginEnabled);
  const addBiometricCredential = useAuthStore((s) => s.addBiometricCredential);
  const removeBiometricCredential = useAuthStore((s) => s.removeBiometricCredential);
  const setGoogleCredential = useAuthStore((s) => s.setGoogleCredential);
  const setSessionTimeout = useAuthStore((s) => s.setSessionTimeout);
  const completeSetup = useAuthStore((s) => s.completeSetup);
  const lock = useAuthStore((s) => s.lock);

  const [biometricSupported, setBiometricSupported] = useState(true);
  const [platformAvailable, setPlatformAvailable] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Check biometric support on mount
  useEffect(() => {
    setBiometricSupported(isBiometricSupported());
    isPlatformAuthenticatorAvailable().then(setPlatformAvailable);
  }, []);

  // Handle registering a new biometric credential
  const handleRegisterBiometric = useCallback(async () => {
    setIsRegistering(true);
    setRegisterError(null);
    try {
      const result = await registerBiometric();
      addBiometricCredential({
        credentialId: result.credentialId,
        publicKey: result.publicKey,
        createdAt: Date.now(),
        label: `Passkey ${biometricCredentials.length + 1}`,
      });
      if (!biometricEnabled) setBiometricEnabled(true);
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsRegistering(false);
    }
  }, [addBiometricCredential, biometricCredentials.length, biometricEnabled, setBiometricEnabled]);

  // Handle linking Google account
  const handleLinkGoogle = useCallback(async () => {
    setIsLinkingGoogle(true);
    setGoogleError(null);

    try {
      // Load GIS if needed
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
        setGoogleError('VITE_GOOGLE_CLIENT_ID not configured');
        setIsLinkingGoogle(false);
        return;
      }

      const tokenClient = window.google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile',
        callback: async (response) => {
          if (response.error || !response.access_token) {
            setGoogleError('Google sign-in failed');
            setIsLinkingGoogle(false);
            return;
          }

          try {
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${response.access_token}` },
            });
            const userInfo = await userInfoRes.json();

            setGoogleCredential({
              email: userInfo.email,
              name: userInfo.name,
              avatarUrl: userInfo.picture,
              linkedAt: Date.now(),
            });
            if (!googleEnabled) setGoogleEnabled(true);
          } catch {
            setGoogleError('Failed to get account info');
          }
          setIsLinkingGoogle(false);
        },
        error_callback: () => {
          setGoogleError('Google sign-in was cancelled');
          setIsLinkingGoogle(false);
        },
      });

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch {
      setGoogleError('Failed to initialize Google sign-in');
      setIsLinkingGoogle(false);
    }
  }, [googleEnabled, setGoogleCredential, setGoogleEnabled]);

  // Handle auth enable toggle
  const handleAuthToggle = useCallback((enabled: boolean) => {
    if (enabled && !hasCredentials) {
      // Enable auth but require setup
      setAuthEnabled(true);
    } else {
      setAuthEnabled(enabled);
    }
  }, [hasCredentials, setAuthEnabled]);

  // Handle completing initial setup
  const handleCompleteSetup = useCallback(() => {
    completeSetup();
    lock();
  }, [completeSetup, lock]);

  const hasAnyMethod = hasCredentials || hasWakeWordTrained;
  const showSetupPrompt = authEnabled && !setupCompleted && !hasAnyMethod;
  const canCompleteSetup = authEnabled && !setupCompleted && hasAnyMethod;

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
          <Shield size={20} className="text-white/80" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Security</h2>
          <p className="text-sm text-white/50">Authentication & lock screen</p>
        </div>
      </div>

      {/* Master Toggle */}
      <Section title="Require Login" icon={Lock}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/70">Lock LiquidOS and require authentication</p>
            <p className="text-xs text-white/40 mt-1">
              {authEnabled ? 'Authentication is required' : 'Anyone can access LiquidOS'}
            </p>
          </div>
          <Toggle checked={authEnabled} onChange={handleAuthToggle} />
        </div>
      </Section>

      {/* Setup Prompt */}
      <AnimatePresence>
        {showSetupPrompt && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-yellow-400" />
                <span className="text-sm font-medium text-yellow-300">Setup Required</span>
              </div>
              <p className="text-xs text-yellow-300/70">
                Register at least one authentication method below to activate protection.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Complete Setup Button */}
      <AnimatePresence>
        {canCompleteSetup && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <button
              onClick={handleCompleteSetup}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 transition-colors"
            >
              <Check size={16} />
              <span className="text-sm font-medium">Activate Protection & Lock Now</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Biometric Section */}
      <Section title="Biometric" icon={Fingerprint}>
        {!biometricSupported ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle size={14} className="text-red-400" />
            <span className="text-xs text-red-300">WebAuthn is not supported in this browser</span>
          </div>
        ) : !platformAvailable ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <AlertTriangle size={14} className="text-yellow-400" />
            <span className="text-xs text-yellow-300">No biometric hardware detected (Touch ID / Face ID)</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/70">Use Touch ID or Face ID to unlock</p>
              <Toggle
                checked={biometricEnabled}
                onChange={setBiometricEnabled}
                disabled={biometricCredentials.length === 0}
              />
            </div>

            {/* Credential List */}
            {biometricCredentials.length > 0 && (
              <div className="space-y-2 mb-3">
                {biometricCredentials.map((cred) => (
                  <div
                    key={cred.credentialId}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center gap-2">
                      <Fingerprint size={14} className="text-white/50" />
                      <span className="text-sm text-white/80">{cred.label}</span>
                      <span className="text-xs text-white/30">
                        {new Date(cred.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={() => removeBiometricCredential(cred.credentialId)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Register Button */}
            <button
              onClick={handleRegisterBiometric}
              disabled={isRegistering}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white/80 text-sm transition-colors disabled:opacity-50"
            >
              <Plus size={14} />
              <span>{isRegistering ? 'Registering...' : 'Register New Passkey'}</span>
            </button>

            {registerError && (
              <p className="mt-2 text-xs text-red-400">{registerError}</p>
            )}
          </>
        )}
      </Section>

      {/* Google OAuth Section */}
      <Section title="Google Account" icon={Mail}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-white/70">Use Google to unlock</p>
          <Toggle
            checked={googleEnabled}
            onChange={setGoogleEnabled}
            disabled={!googleCredential}
          />
        </div>

        {googleCredential ? (
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              {googleCredential.avatarUrl ? (
                <img
                  src={googleCredential.avatarUrl}
                  alt=""
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <User size={14} className="text-white/50" />
                </div>
              )}
              <div>
                {googleCredential.name && (
                  <p className="text-sm text-white/80">{googleCredential.name}</p>
                )}
                <p className="text-xs text-white/50">{googleCredential.email}</p>
              </div>
            </div>
            <button
              onClick={() => setGoogleCredential(null)}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLinkGoogle}
            disabled={isLinkingGoogle}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white/80 text-sm transition-colors disabled:opacity-50"
          >
            <Mail size={14} />
            <span>{isLinkingGoogle ? 'Linking...' : 'Link Google Account'}</span>
          </button>
        )}

        {googleError && (
          <p className="mt-2 text-xs text-red-400">{googleError}</p>
        )}
      </Section>

      {/* Email/Password Section */}
      <Section title="Email/Password" icon={Mail}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-white/70">Use email and password to unlock</p>
          <Toggle checked={emailEnabled} onChange={setEmailEnabled} />
        </div>

        {emailCredential && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <User size={14} className="text-white/50" />
              </div>
              <div>
                {emailCredential.name && (
                  <p className="text-sm text-white/80">{emailCredential.name}</p>
                )}
                <p className="text-xs text-white/50">{emailCredential.email}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">Auto-login (Dev & Production)</p>
              <p className="text-xs text-white/40 mt-0.5">
                {autoLoginEnabled ? 'Automatically log in on page load' : 'Manual login required'}
              </p>
            </div>
            <Toggle checked={autoLoginEnabled} onChange={setAutoLoginEnabled} disabled={!emailEnabled} />
          </div>
        </div>
      </Section>

      {/* Session Timeout */}
      <Section title="Session Timeout" icon={Clock}>
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/70">Auto-lock after inactivity</p>
          <select
            value={sessionTimeoutMinutes}
            onChange={(e) => setSessionTimeout(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-sm text-white/80 outline-none"
          >
            <option value={0}>Never</option>
            <option value={5}>5 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
          </select>
        </div>
      </Section>

      {/* Wake Word Training */}
      <Section title="Wake Word" icon={Shield}>
        <WakeWordTraining />
      </Section>

      {/* Lock Now */}
      {authEnabled && setupCompleted && (hasBiometricMethod || hasGoogleMethod || hasWakeWordTrained) && (
        <button
          onClick={lock}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white/80 transition-colors"
        >
          <Lock size={16} />
          <span className="text-sm font-medium">Lock Now</span>
        </button>
      )}
    </div>
  );
};

// ============================================================================
// Sub-components
// ============================================================================

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.FC<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className="text-white/60" />
        <h3 className="text-sm font-medium text-white/80">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`
        relative w-10 h-6 rounded-full transition-colors duration-200
        ${checked ? 'bg-blue-500' : 'bg-white/20'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div
        className={`
          absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
          ${checked ? 'translate-x-5' : 'translate-x-1'}
        `}
      />
    </button>
  );
}
