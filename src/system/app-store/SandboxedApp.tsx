/**
 * Sandboxed App
 *
 * Renders an untrusted remote app inside an iframe sandbox.
 * Provides a postMessage bridge for limited API access.
 */

import React from 'react';

/**
 * Creates a React component that renders a sandboxed app in an iframe.
 * The iframe has restricted permissions for security.
 */
export function createSandboxedApp(
  appId: string,
  blobUrl: string
): React.ComponentType {
  return function SandboxedAppComponent() {
    return (
      <div className="w-full h-full relative">
        <iframe
          title={`app-${appId}`}
          src={blobUrl}
          sandbox="allow-scripts"
          className="w-full h-full border-0"
          style={{ colorScheme: 'normal' }}
        />
      </div>
    );
  };
}
