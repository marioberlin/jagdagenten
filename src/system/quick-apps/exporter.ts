/**
 * Quick App Exporter
 *
 * Converts a Quick App into a full application structure
 * with proper files (manifest.json, App.tsx, etc.)
 */

import type { CompiledQuickApp, ParsedQuickApp } from './types';
import type { AppManifest } from '../app-store/types';
import JSZip from 'jszip';

// ============================================================
// Types
// ============================================================

export interface ExportedFile {
  path: string;
  content: string;
}

export interface ExportResult {
  files: ExportedFile[];
  manifest: AppManifest;
  readme: string;
}

// ============================================================
// Export Functions
// ============================================================

/**
 * Export a Quick App to a full application structure.
 * Returns an array of files that make up the full app.
 */
export function exportQuickAppToFull(compiled: CompiledQuickApp): ExportResult {
  const { parsed, manifest } = compiled;
  const files: ExportedFile[] = [];

  // 1. Generate manifest.json
  const manifestJson = generateManifest(manifest);
  files.push({
    path: 'manifest.json',
    content: JSON.stringify(manifestJson, null, 2),
  });

  // 2. Generate App.tsx (main component)
  const appTsx = generateAppTsx(parsed);
  files.push({
    path: 'src/App.tsx',
    content: appTsx,
  });

  // 3. Generate helpers.ts (if present)
  if (parsed.helpersCode) {
    files.push({
      path: 'src/helpers.ts',
      content: generateHelpersTs(parsed.helpersCode),
    });
  }

  // 4. Generate store.ts (if present)
  if (parsed.storeCode) {
    files.push({
      path: 'src/store.ts',
      content: generateStoreTs(parsed.storeCode),
    });
  }

  // 5. Generate Settings.tsx (if present)
  if (parsed.settingsCode) {
    files.push({
      path: 'src/Settings.tsx',
      content: generateSettingsTsx(parsed.settingsCode),
    });
  }

  // 6. Generate styles.css (if present)
  if (parsed.stylesCode) {
    files.push({
      path: 'src/styles.css',
      content: parsed.stylesCode,
    });
  }

  // 7. Generate index.ts (entry point)
  files.push({
    path: 'src/index.ts',
    content: generateIndexTs(parsed),
  });

  // 8. Generate README.md
  const readme = generateReadme(parsed, manifest);
  files.push({
    path: 'README.md',
    content: readme,
  });

  // 9. Generate package.json
  files.push({
    path: 'package.json',
    content: generatePackageJson(manifest),
  });

  // 10. Generate tsconfig.json
  files.push({
    path: 'tsconfig.json',
    content: generateTsConfig(),
  });

  return { files, manifest, readme };
}

/**
 * Export to a downloadable ZIP file.
 */
export async function exportToZip(compiled: CompiledQuickApp): Promise<Blob> {
  const result = exportQuickAppToFull(compiled);
  const zip = new JSZip();

  // Add all files to the zip
  for (const file of result.files) {
    zip.file(file.path, file.content);
  }

  // Generate the zip file
  return zip.generateAsync({ type: 'blob' });
}

// ============================================================
// File Generators
// ============================================================

function generateManifest(manifest: AppManifest): AppManifest {
  return {
    ...manifest,
    // Ensure entry point is properly set for full apps
    entry: 'src/index.ts',
  };
}

function generateAppTsx(parsed: ParsedQuickApp): string {
  const imports: string[] = [
    "import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';",
  ];

  // Add imports for hooks used in the code
  if (parsed.appCode.includes('useStorage')) {
    imports.push("import { useStorage } from '@/hooks/useStorage';");
  }
  if (parsed.appCode.includes('useNotification')) {
    imports.push("import { useNotification } from '@/hooks/useNotification';");
  }
  if (parsed.appCode.includes('useTheme')) {
    imports.push("import { useTheme } from '@/hooks/useTheme';");
  }
  if (parsed.appCode.includes('useClipboard')) {
    imports.push("import { useClipboard } from '@/hooks/useClipboard';");
  }

  // Add lucide-react imports if icons are used
  const iconMatches = parsed.appCode.match(/import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/);
  if (iconMatches) {
    imports.push(`import { ${iconMatches[1]} } from 'lucide-react';`);
  }

  // Add helpers import if present
  if (parsed.helpersCode) {
    imports.push("import * as helpers from './helpers';");
  }

  // Add store import if present
  if (parsed.storeCode) {
    imports.push("import { useStore } from './store';");
  }

  // Add styles import if present
  if (parsed.stylesCode) {
    imports.push("import './styles.css';");
  }

  // Clean the app code (remove any import statements as we handle them above)
  const cleanedAppCode = parsed.appCode
    .replace(/import\s+{[^}]+}\s+from\s+['"]lucide-react['"];?\n?/g, '')
    .trim();

  return `/**
 * ${parsed.frontmatter.name}
 *
 * ${parsed.description || 'No description provided.'}
 *
 * Exported from Quick App format.
 */

${imports.join('\n')}

${cleanedAppCode}
`;
}

function generateHelpersTs(code: string): string {
  return `/**
 * Helper functions for the application.
 *
 * Exported from Quick App format.
 */

${code}
`;
}

function generateStoreTs(code: string): string {
  return `/**
 * Zustand store for the application.
 *
 * Exported from Quick App format.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

${code}
`;
}

function generateSettingsTsx(code: string): string {
  return `/**
 * Settings component for the application.
 *
 * Exported from Quick App format.
 */

import React from 'react';

${code}
`;
}

function generateIndexTs(parsed: ParsedQuickApp): string {
  const exports = ['App'];

  if (parsed.settingsCode) {
    exports.push('Settings');
  }
  if (parsed.storeCode) {
    exports.push('useStore');
  }

  return `/**
 * ${parsed.frontmatter.name}
 *
 * Entry point for the application.
 */

export { default as App } from './App';
${parsed.settingsCode ? "export { default as Settings } from './Settings';" : ''}
${parsed.storeCode ? "export { useStore } from './store';" : ''}
`;
}

function generateReadme(parsed: ParsedQuickApp, manifest: AppManifest): string {
  return `# ${manifest.name}

${parsed.description || 'No description provided.'}

## Installation

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

## About

- **Category:** ${manifest.category}
- **Version:** ${manifest.version}
- **Author:** ${manifest.author || 'Unknown'}

## License

${parsed.frontmatter.license || 'MIT'}

---

*Originally created as a Quick App and exported to full application format.*
`;
}

function generatePackageJson(manifest: AppManifest): string {
  const pkg = {
    name: manifest.id,
    version: manifest.version,
    description: manifest.description,
    main: 'src/index.ts',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build',
      preview: 'vite preview',
    },
    dependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      'lucide-react': '^0.263.1',
      zustand: '^4.4.0',
    },
    devDependencies: {
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      typescript: '^5.0.0',
      vite: '^5.0.0',
      '@vitejs/plugin-react': '^4.0.0',
    },
  };

  return JSON.stringify(pkg, null, 2);
}

function generateTsConfig(): string {
  const config = {
    compilerOptions: {
      target: 'ES2020',
      useDefineForClassFields: true,
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      skipLibCheck: true,
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx',
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true,
      paths: {
        '@/*': ['./src/*'],
      },
    },
    include: ['src'],
    references: [{ path: './tsconfig.node.json' }],
  };

  return JSON.stringify(config, null, 2);
}
