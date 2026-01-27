/**
 * Puppeteer HTML Renderer
 *
 * Renders HTML/CSS content to PNG images using Puppeteer.
 * Used for complex layouts, data visualizations, or React components.
 *
 * Note: This is intentionally slower than Canvas rendering but provides
 * full browser capabilities including:
 * - Full CSS support (flexbox, grid, animations)
 * - Web fonts
 * - SVG rendering
 * - React component rendering
 * - Tailwind CSS
 */

import type { Browser, Page } from 'puppeteer';

export interface HtmlRenderConfig {
  /** HTML content to render */
  html?: string;
  /** URL to load and screenshot */
  url?: string;
  /** CSS to inject */
  css?: string;
  /** JavaScript to execute before screenshot */
  script?: string;
  /** Selector to wait for before screenshot */
  waitForSelector?: string;
  /** Time to wait in ms before screenshot */
  waitTime?: number;
  /** Width of the viewport/screenshot */
  width: number;
  /** Height of the viewport/screenshot */
  height: number;
  /** Device scale factor (default: 2 for retina) */
  deviceScaleFactor?: number;
  /** Transparent background (default: true) */
  transparent?: boolean;
  /** Tailwind classes for container */
  tailwindClasses?: string;
  /** React component to render */
  reactComponent?: string;
  /** Props for React component */
  reactProps?: Record<string, unknown>;
}

// Browser instance pool for reuse
let browserInstance: Browser | null = null;
let browserLaunchPromise: Promise<Browser> | null = null;

/**
 * Get or create a shared browser instance.
 */
async function getBrowser(): Promise<Browser> {
  if (browserInstance) {
    return browserInstance;
  }

  // Prevent concurrent browser launches
  if (browserLaunchPromise) {
    return browserLaunchPromise;
  }

  browserLaunchPromise = (async () => {
    const puppeteer = await import('puppeteer');
    browserInstance = await puppeteer.default.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--font-render-hinting=none',
      ],
    });

    // Clean up on process exit
    process.on('exit', () => {
      browserInstance?.close().catch(() => {});
    });

    return browserInstance;
  })();

  return browserLaunchPromise;
}

/**
 * Close the shared browser instance.
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    browserLaunchPromise = null;
  }
}

/**
 * Generate the full HTML document with styles and content.
 */
function buildHtmlDocument(config: HtmlRenderConfig): string {
  const {
    html = '',
    css = '',
    tailwindClasses = '',
    width,
    height,
    transparent = true,
  } = config;

  // Base styles for consistent rendering
  const baseStyles = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      ${transparent ? 'background: transparent;' : ''}
    }
    .container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `;

  // Include Tailwind CDN if classes are specified
  const tailwindScript = tailwindClasses
    ? '<script src="https://cdn.tailwindcss.com"></script>'
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=${width}, height=${height}">
  ${tailwindScript}
  <style>
    ${baseStyles}
    ${css}
  </style>
</head>
<body>
  <div class="container ${tailwindClasses}">
    ${html}
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate HTML for a React component.
 */
function buildReactDocument(config: HtmlRenderConfig): string {
  const {
    reactComponent = 'div',
    reactProps = {},
    css = '',
    width,
    height,
    transparent = true,
  } = config;

  const propsJson = JSON.stringify(reactProps);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=${width}, height=${height}">
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      ${transparent ? 'background: transparent;' : ''}
    }
    #root {
      width: 100%;
      height: 100%;
    }
    ${css}
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const props = ${propsJson};

    // Built-in components for common use cases
    const DataCard = ({ title, value, subtitle, icon, color = 'blue' }) => (
      <div className={\`bg-gradient-to-br from-\${color}-500 to-\${color}-700 text-white p-6 rounded-xl shadow-xl\`}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-medium opacity-90">{title}</span>
          {icon && <span className="text-2xl">{icon}</span>}
        </div>
        <div className="text-4xl font-bold mb-2">{value}</div>
        {subtitle && <div className="text-sm opacity-75">{subtitle}</div>}
      </div>
    );

    const BarChart = ({ data, colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'] }) => {
      const max = Math.max(...data.map(d => d.value));
      return (
        <div className="flex items-end justify-around h-full p-4 gap-2">
          {data.map((item, i) => (
            <div key={i} className="flex flex-col items-center flex-1">
              <div
                className="w-full rounded-t transition-all duration-500"
                style={{
                  height: \`\${(item.value / max) * 80}%\`,
                  backgroundColor: colors[i % colors.length]
                }}
              />
              <span className="text-xs mt-2 text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      );
    };

    const PriceDisplay = ({ symbol, price, change, changePercent, positive }) => (
      <div className="bg-gray-900 text-white p-6 rounded-xl">
        <div className="text-gray-400 text-sm mb-1">{symbol}</div>
        <div className="text-3xl font-bold mb-2">\${price}</div>
        <div className={\`text-lg \${positive ? 'text-green-400' : 'text-red-400'}\`}>
          {positive ? '+' : ''}{change} ({changePercent}%)
        </div>
      </div>
    );

    // Component registry
    const components = {
      DataCard,
      BarChart,
      PriceDisplay,
    };

    // Render the requested component
    const Component = components['${reactComponent}'] || (() => <div>Unknown component: ${reactComponent}</div>);

    ReactDOM.createRoot(document.getElementById('root')).render(
      <div className="w-full h-full flex items-center justify-center">
        <Component {...props} />
      </div>
    );
  </script>
</body>
</html>
  `.trim();
}

/**
 * Render HTML content to a PNG buffer.
 */
export async function renderHtmlFrame(
  config: HtmlRenderConfig,
  _frame: number = 0,
  _fps: number = 30
): Promise<Buffer> {
  const {
    url,
    html,
    script,
    waitForSelector,
    waitTime,
    width,
    height,
    deviceScaleFactor = 2,
    transparent = true,
    reactComponent,
  } = config;

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Set viewport
    await page.setViewport({
      width,
      height,
      deviceScaleFactor,
    });

    // Load content
    if (url) {
      // Load from URL
      await page.goto(url, { waitUntil: 'networkidle2' });
    } else if (reactComponent) {
      // Render React component
      const htmlDoc = buildReactDocument(config);
      await page.setContent(htmlDoc, { waitUntil: 'networkidle2' });
    } else if (html) {
      // Render HTML content
      const htmlDoc = buildHtmlDocument(config);
      await page.setContent(htmlDoc, { waitUntil: 'domcontentloaded' });
    } else {
      throw new Error('No content provided: specify html, url, or reactComponent');
    }

    // Wait for selector if specified
    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout: 10000 });
    }

    // Wait additional time if specified
    if (waitTime && waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    // Execute custom script if provided
    if (script) {
      await page.evaluate(script);
    }

    // Take screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      omitBackground: transparent,
      clip: {
        x: 0,
        y: 0,
        width,
        height,
      },
    });

    return Buffer.from(screenshot);
  } finally {
    await page.close();
  }
}

/**
 * Pre-warm the browser for faster first render.
 */
export async function warmupBrowser(): Promise<void> {
  await getBrowser();
}

/**
 * Check if Puppeteer is available.
 */
export async function isPuppeteerAvailable(): Promise<boolean> {
  try {
    await import('puppeteer');
    return true;
  } catch {
    return false;
  }
}
