import React, { useEffect } from 'react';
import { useAuthStore, selectRequiresAuth } from '@/stores/authStore';
import { LockScreen } from './LockScreen';

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const requiresAuth = useAuthStore(selectRequiresAuth);
  const checkSessionTimeout = useAuthStore((s) => s.checkSessionTimeout);
  const authEnabled = useAuthStore((s) => s.authEnabled);

  const isHydrated = useAuthStore((s) => s._hydrated);
  // Also check if we should block rendering until we know the auth state
  // If not hydrated, we don't know if we need to lock or not.

  // Check session timeout every 30 seconds
  useEffect(() => {
    if (!authEnabled) return;
    const interval = setInterval(() => {
      checkSessionTimeout();
    }, 30000);
    return () => clearInterval(interval);
  }, [authEnabled, checkSessionTimeout]);

  // Prevent flash of unauthenticated content
  if (!isHydrated) {
    return null; // or a loading spinner matching the background
  }

  return (
    <>
      {children}
      {requiresAuth && <LockScreen />}
    </>
  );
};
