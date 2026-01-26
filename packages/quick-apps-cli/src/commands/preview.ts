/**
 * Preview Command
 *
 * Starts a preview server to see the Quick App in action.
 */

import { readFile } from 'fs/promises';
import { createServer } from 'http';
import chalk from 'chalk';

interface PreviewOptions {
  file: string;
  port: string;
}

export async function previewApp(options: PreviewOptions) {
  const { file, port } = options;
  const portNum = parseInt(port, 10);

  // Read the Quick App file
  const readAppFile = async () => {
    try {
      const content = await readFile(file, 'utf-8');
      return content;
    } catch (err) {
      console.error(chalk.red(`Error reading ${file}:`), err);
      return null;
    }
  };

  // Parse frontmatter for display
  const content = await readAppFile();
  if (!content) {
    console.error(chalk.red(`Could not read ${file}`));
    process.exit(1);
  }

  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const nameMatch = frontmatterMatch?.[1].match(/name:\s*(.+)/);
  const appName = nameMatch?.[1] || 'Quick App';

  // Create HTTP server
  const server = createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${portNum}`);

    if (url.pathname === '/' || url.pathname === '/preview') {
      const appContent = await readAppFile();
      if (appContent) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(generatePreviewHTML(appName, appContent));
      } else {
        res.writeHead(500);
        res.end('Error loading app');
      }
      return;
    }

    if (url.pathname === '/app.md') {
      const appContent = await readAppFile();
      if (appContent) {
        res.writeHead(200, {
          'Content-Type': 'text/markdown',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(appContent);
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(portNum, () => {
    console.log(chalk.green(`\n✅ Preview server running!`));
    console.log('');
    console.log(chalk.gray('   App:     '), chalk.cyan(appName));
    console.log(chalk.gray('   File:    '), chalk.cyan(file));
    console.log(chalk.gray('   Preview: '), chalk.cyan(`http://localhost:${portNum}`));
    console.log('');
    console.log(chalk.yellow('   Press Ctrl+C to stop'));
    console.log('');
  });

  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n   Shutting down...'));
    server.close();
    process.exit(0);
  });
}

function generatePreviewHTML(appName: string, content: string): string {
  // Extract code blocks
  const appCodeMatch = content.match(/```tsx App\n([\s\S]*?)\n```/);
  const appCode = appCodeMatch?.[1] || '// No app code found';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName} - Quick App Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      min-height: 100vh;
    }
    .glass {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    #app-container {
      color: white;
    }
  </style>
</head>
<body class="p-8">
  <div class="max-w-md mx-auto">
    <div class="glass rounded-2xl overflow-hidden">
      <!-- Title Bar -->
      <div class="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <div class="flex gap-1.5">
          <div class="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div class="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div class="w-3 h-3 rounded-full bg-green-500/80"></div>
        </div>
        <span class="flex-1 text-center text-sm text-white/60">${appName}</span>
      </div>

      <!-- App Content -->
      <div id="app-container" class="min-h-[300px]">
        <div class="flex items-center justify-center h-[300px] text-white/30">
          Loading...
        </div>
      </div>
    </div>

    <div class="mt-4 text-center text-xs text-white/30">
      Quick App Preview • Drag APP.md into LiquidOS to install
    </div>
  </div>

  <script type="text/babel">
    // Shims for Quick App runtime
    const useState = React.useState;
    const useEffect = React.useEffect;
    const useMemo = React.useMemo;
    const useCallback = React.useCallback;
    const useRef = React.useRef;

    // useStorage shim (localStorage-based)
    function useStorage(key, defaultValue) {
      const [value, setValue] = useState(() => {
        try {
          const stored = localStorage.getItem('qa_' + key);
          return stored ? JSON.parse(stored) : defaultValue;
        } catch {
          return defaultValue;
        }
      });

      const setStoredValue = (newValue) => {
        setValue(newValue);
        localStorage.setItem('qa_' + key, JSON.stringify(newValue));
      };

      return [value, setStoredValue];
    }

    // useNotification shim
    function useNotification() {
      return {
        notify: (message) => {
          if (Notification.permission === 'granted') {
            new Notification('${appName}', { body: message });
          } else {
            alert(message);
          }
        },
      };
    }

    // useTheme shim
    function useTheme() {
      return { theme: 'dark', setTheme: () => {} };
    }

    // useClipboard shim
    function useClipboard() {
      return {
        copy: async (text) => {
          await navigator.clipboard.writeText(text);
          return true;
        },
        paste: async () => navigator.clipboard.readText(),
      };
    }

    // App code
    ${appCode}

    // Render
    const container = document.getElementById('app-container');
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(App));
  </script>
</body>
</html>`;
}
