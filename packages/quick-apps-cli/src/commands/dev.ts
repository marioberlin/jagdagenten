/**
 * Dev Command
 *
 * Starts a development server with hot reload for Quick App development.
 */

import { readFile, watch } from 'fs/promises';
import { createServer } from 'http';
import chalk from 'chalk';
import chokidar from 'chokidar';

interface DevOptions {
  port: string;
  file: string;
}

export async function devServer(options: DevOptions) {
  const { port, file } = options;
  const portNum = parseInt(port, 10);

  // Track connected clients for hot reload
  const clients: Set<{ response: any }> = new Set();

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

  // Create HTTP server
  const server = createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${portNum}`);

    // SSE endpoint for hot reload
    if (url.pathname === '/__quick-app-hmr') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      const client = { response: res };
      clients.add(client);

      req.on('close', () => {
        clients.delete(client);
      });

      return;
    }

    // Serve Quick App content
    if (url.pathname === '/app.md' || url.pathname === '/') {
      const content = await readAppFile();
      if (content) {
        res.writeHead(200, {
          'Content-Type': 'text/markdown',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(content);
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
      return;
    }

    // API to get app info
    if (url.pathname === '/info') {
      const content = await readAppFile();
      if (content) {
        // Parse frontmatter
        const match = content.match(/^---\n([\s\S]*?)\n---/);
        if (match) {
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          });
          res.end(JSON.stringify({
            file,
            frontmatter: match[1],
            size: content.length,
          }));
          return;
        }
      }
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    // Preview HTML page
    if (url.pathname === '/preview') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(generatePreviewHTML(portNum));
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  // Start server
  server.listen(portNum, () => {
    console.log(chalk.green(`\n✅ Development server running!`));
    console.log('');
    console.log(chalk.gray('   Quick App file:'), chalk.cyan(file));
    console.log(chalk.gray('   Server:        '), chalk.cyan(`http://localhost:${portNum}`));
    console.log(chalk.gray('   Preview:       '), chalk.cyan(`http://localhost:${portNum}/preview`));
    console.log(chalk.gray('   Raw APP.md:    '), chalk.cyan(`http://localhost:${portNum}/app.md`));
    console.log('');
    console.log(chalk.yellow('   Watching for changes...'));
    console.log('');
  });

  // Watch for file changes
  const watcher = chokidar.watch(file, {
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on('change', async () => {
    console.log(chalk.cyan(`   📝 ${file} changed, reloading...`));

    // Notify all connected clients
    for (const client of clients) {
      client.response.write(`data: ${JSON.stringify({ type: 'reload', file })}\n\n`);
    }
  });

  watcher.on('error', (err) => {
    console.error(chalk.red('Watch error:'), err);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n   Shutting down...'));
    watcher.close();
    server.close();
    process.exit(0);
  });
}

function generatePreviewHTML(port: number): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quick App Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
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
    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  </style>
</head>
<body class="p-8">
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="glass rounded-2xl p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-400"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
        </div>
        <div>
          <h1 class="text-lg font-bold text-white">Quick App Development Server</h1>
          <p class="text-xs text-white/50">Connected to localhost:${port}</p>
        </div>
        <div id="status" class="ml-auto px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
          Connected
        </div>
      </div>
      <div id="content" class="bg-black/30 rounded-lg p-4 font-mono text-sm text-white/80 max-h-96 overflow-y-auto">
        Loading...
      </div>
    </div>

    <div class="glass rounded-2xl p-6">
      <h2 class="text-sm font-medium text-white mb-3">Instructions</h2>
      <ul class="space-y-2 text-sm text-white/60">
        <li>• Edit your APP.md file and save to see changes here</li>
        <li>• Drag the APP.md file into LiquidOS App Store to install</li>
        <li>• Use <code class="px-1.5 py-0.5 bg-white/10 rounded">Ctrl+C</code> in terminal to stop the server</li>
      </ul>
    </div>
  </div>

  <script>
    const contentEl = document.getElementById('content');
    const statusEl = document.getElementById('status');

    // Fetch initial content
    async function loadContent() {
      try {
        const res = await fetch('/app.md');
        const text = await res.text();
        contentEl.innerHTML = '<pre>' + escapeHtml(text) + '</pre>';
      } catch (err) {
        contentEl.innerHTML = '<span class="text-red-400">Error loading content</span>';
      }
    }

    // Connect to HMR
    function connectHMR() {
      const es = new EventSource('/__quick-app-hmr');

      es.onopen = () => {
        statusEl.className = 'ml-auto px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400';
        statusEl.textContent = 'Connected';
      };

      es.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'reload') {
          loadContent();
        }
      };

      es.onerror = () => {
        statusEl.className = 'ml-auto px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400';
        statusEl.textContent = 'Disconnected';
        setTimeout(connectHMR, 2000);
      };
    }

    function escapeHtml(text) {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    loadContent();
    connectHMR();
  </script>
</body>
</html>`;
}
