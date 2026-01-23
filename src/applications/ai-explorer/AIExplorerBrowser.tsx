import React, { useState, useCallback, useEffect } from 'react';
import { AIExplorerSidebar } from './AIExplorerSidebar';
import { AIExplorerTargetList } from './AIExplorerTargetList';
import { AIExplorerEditor } from './AIExplorerEditor';
import { seedMiscResources, isMiscSeeded, markMiscSeeded } from './seedMiscResources';
import type { ResourceType, AITarget } from './types';

export const AIExplorerBrowser: React.FC = () => {
  const [activeResource, setActiveResource] = useState<ResourceType>('prompts');
  const [selectedTarget, setSelectedTarget] = useState<AITarget | null>(null);

  // One-time seed of misc resources from source files
  useEffect(() => {
    if (!isMiscSeeded()) {
      seedMiscResources();
      markMiscSeeded();
    }
  }, []);

  const handleSelectResource = useCallback((resource: ResourceType) => {
    setActiveResource(resource);
    setSelectedTarget(null);
  }, []);

  const handleSelectTarget = useCallback((target: AITarget) => {
    setSelectedTarget(target);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedTarget(null);
  }, []);

  return (
    <div className="flex flex-col h-full bg-black/40 text-white">
      {/* Main content area */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <AIExplorerSidebar
          activeResource={activeResource}
          onSelectResource={handleSelectResource}
        />

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedTarget ? (
            <AIExplorerEditor
              target={selectedTarget}
              resource={activeResource}
              onBack={handleBack}
            />
          ) : (
            <AIExplorerTargetList
              activeResource={activeResource}
              onSelectTarget={handleSelectTarget}
            />
          )}
        </div>
      </div>
    </div>
  );
};
