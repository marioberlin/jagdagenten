import React, { useEffect } from 'react';
import { useAuthStore, selectRequiresAuth } from '@/stores/authStore';
import { LockScreen } from './LockScreen';

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const requiresAuth = useAuthStore(selectRequiresAuth);
  const checkSessionTimeout = useAuthStore((s) => s.checkSessionTimeout);
  const authEnabled = useAuthStore((s) => s.authEnabled);

  // Check session timeout every 30 seconds
  useEffect(() => {
    if (!authEnabled) return;
    const interval = setInterval(() => {
      checkSessionTimeout();
    }, 30000);
    return () => clearInterval(interval);
  }, [authEnabled, checkSessionTimeout]);

  return (
    <>
      {children}
      {requiresAuth && <LockScreen />}
    </>
  );
};
