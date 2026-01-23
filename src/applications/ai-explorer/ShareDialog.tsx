import React, { useState, useEffect } from 'react';
import { X, Share2, Shield, Eye, Pencil, Copy, Trash2, Plus } from 'lucide-react';
import { useResourceStore, type AIResource } from '@/stores/resourceStore';
import { useAppStoreStore } from '@/system/app-store/appStoreStore';

interface ShareDialogProps {
  resource: AIResource;
  onClose: () => void;
}

type Permission = 'read' | 'write' | 'copy';

interface ShareTarget {
  id: string;
  name: string;
  type: 'app' | 'agent';
  icon?: string;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({ resource, onClose }) => {
  const { shareResource } = useResourceStore();
  const installedApps = useAppStoreStore((s) => s.installedApps);
  const [targets, setTargets] = useState<ShareTarget[]>([]);
  const [existingShares, setExistingShares] = useState<Array<{ targetType: string; targetId: string; permission: Permission }>>([]);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [selectedPermission, setSelectedPermission] = useState<Permission>('read');
  const [isSharing, setIsSharing] = useState(false);

  // Build share targets from installed apps
  useEffect(() => {
    const appTargets: ShareTarget[] = Object.values(installedApps).map(app => ({
      id: app.manifest.id,
      name: app.manifest.name,
      type: (app.manifest.category === 'agent' || app.manifest.id.startsWith('agent-')) ? 'agent' as const : 'app' as const,
      icon: app.manifest.icon,
    }));
    setTargets(appTargets);
  }, [installedApps]);

  // Fetch existing shares
  useEffect(() => {
    const fetchShares = async () => {
      try {
        const response = await fetch(`/api/resources/${resource.id}`);
        if (response.ok) {
          const data = await response.json();
          setExistingShares(data.shares || []);
        }
      } catch (err) {
        console.error('[ShareDialog] Error fetching shares:', err);
      }
    };
    fetchShares();
  }, [resource.id]);

  const handleShare = async () => {
    if (!selectedTarget) return;
    setIsSharing(true);
    try {
      const target = targets.find(t => t.id === selectedTarget);
      if (target) {
        await shareResource(resource.id, target.type, target.id, selectedPermission);
        setExistingShares(prev => [...prev, {
          targetType: target.type,
          targetId: target.id,
          permission: selectedPermission,
        }]);
        setSelectedTarget('');
      }
    } catch (err) {
      console.error('[ShareDialog] Error sharing:', err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemoveShare = async (targetType: string, targetId: string) => {
    try {
      await fetch(`/api/resources/${resource.id}/share/${targetType}/${targetId}`, {
        method: 'DELETE',
      });
      setExistingShares(prev => prev.filter(s => !(s.targetType === targetType && s.targetId === targetId)));
    } catch (err) {
      console.error('[ShareDialog] Error removing share:', err);
    }
  };

  const getPermissionIcon = (perm: Permission) => {
    switch (perm) {
      case 'read': return Eye;
      case 'write': return Pencil;
      case 'copy': return Copy;
    }
  };

  const getTargetName = (targetId: string) => {
    return targets.find(t => t.id === targetId)?.name || targetId;
  };

  // Filter out already-shared targets
  const availableTargets = targets.filter(t =>
    !existingShares.some(s => s.targetId === t.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[380px] max-h-[500px] flex flex-col bg-[#1a1a2e]/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Share2 size={14} className="text-blue-400" />
            <h3 className="text-sm font-medium text-white/90">Share Resource</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Resource Info */}
        <div className="px-4 py-2.5 bg-white/[0.02] border-b border-white/5">
          <p className="text-[11px] text-white/50 truncate">{resource.name}</p>
          <p className="text-[9px] text-white/30 mt-0.5">{resource.resourceType} &middot; v{resource.version}</p>
        </div>

        {/* Add Share */}
        <div className="px-4 py-3 border-b border-white/10">
          <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-2 block">
            Share with
          </label>
          <div className="flex gap-1.5">
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="flex-1 bg-white/[0.03] border border-white/10 rounded px-2 py-1.5 text-[11px] text-white/70 outline-none appearance-none cursor-pointer"
            >
              <option value="">Select target...</option>
              {availableTargets.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.type})
                </option>
              ))}
            </select>
            <select
              value={selectedPermission}
              onChange={(e) => setSelectedPermission(e.target.value as Permission)}
              className="w-20 bg-white/[0.03] border border-white/10 rounded px-2 py-1.5 text-[11px] text-white/70 outline-none appearance-none cursor-pointer"
            >
              <option value="read">Read</option>
              <option value="write">Write</option>
              <option value="copy">Copy</option>
            </select>
            <button
              onClick={handleShare}
              disabled={!selectedTarget || isSharing}
              className="px-2 py-1.5 rounded bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/20 text-blue-400 disabled:opacity-30 transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        {/* Existing Shares */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-2 block">
            Current Shares ({existingShares.length})
          </label>
          {existingShares.length === 0 ? (
            <p className="text-[11px] text-white/20 text-center py-4">Not shared with anyone</p>
          ) : (
            <div className="space-y-1.5">
              {existingShares.map((share) => {
                const PermIcon = getPermissionIcon(share.permission);
                return (
                  <div
                    key={`${share.targetType}-${share.targetId}`}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.02] border border-white/5"
                  >
                    <Shield size={10} className="text-white/30" />
                    <span className="flex-1 text-[11px] text-white/60 truncate">
                      {getTargetName(share.targetId)}
                    </span>
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-white/40">
                      <PermIcon size={8} />
                      {share.permission}
                    </span>
                    <button
                      onClick={() => handleRemoveShare(share.targetType, share.targetId)}
                      className="p-0.5 rounded text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-white/10 bg-white/[0.02]">
          <p className="text-[9px] text-white/25 text-center">
            Shared resources appear in the target's context compilation
          </p>
        </div>
      </div>
    </div>
  );
};
