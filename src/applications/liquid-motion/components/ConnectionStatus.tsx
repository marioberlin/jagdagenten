/**
 * Connection Status Component
 *
 * Shows video render server connection status.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { WifiOff, RefreshCw, Server } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ConnectionStatusProps {
  isConnected: boolean;
  error: string | null;
  onRetry: () => void;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  error,
  onRetry,
  className,
}) => {
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    await onRetry();
    setIsRetrying(false);
  };

  if (isConnected) {
    return (
      <motion.div
        className={cn(
          'flex items-center gap-2 px-2 py-1 rounded text-xs',
          'bg-green-500/10 text-green-400 border border-green-500/20',
          className
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="relative">
          <Server className="w-3 h-3" />
          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full" />
        </div>
        <span>Connected</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn(
        'flex items-center gap-2 px-2 py-1 rounded text-xs',
        'bg-red-500/10 text-red-400 border border-red-500/20',
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <WifiOff className="w-3 h-3" />
      <span className="truncate max-w-32" title={error || 'Disconnected'}>
        {error || 'Disconnected'}
      </span>
      <button
        onClick={handleRetry}
        disabled={isRetrying}
        className={cn(
          'p-1 rounded hover:bg-white/10 transition-colors',
          isRetrying && 'animate-spin'
        )}
        title="Retry connection"
      >
        <RefreshCw className="w-3 h-3" />
      </button>
    </motion.div>
  );
};
