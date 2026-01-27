/**
 * Tailwind CSS Compiler
 *
 * On-demand Tailwind CSS compilation for video rendering.
 * Compiles Tailwind classes to CSS for use in canvas/SVG rendering.
 */

// Note: These dependencies need to be installed:
// bun add tailwindcss postcss autoprefixer

export interface TailwindCompileOptions {
  content: string; // HTML/JSX content to scan for classes
  config?: TailwindConfig;
  darkMode?: boolean;
}

export interface TailwindConfig {
  theme?: {
    extend?: Record<string, unknown>;
    colors?: Record<string, string | Record<string, string>>;
    spacing?: Record<string, string>;
    fontSize?: Record<string, string | [string, Record<string, string>]>;
    fontFamily?: Record<string, string[]>;
  };
  plugins?: unknown[];
}

export interface CompiledCSS {
  css: string;
  classes: string[];
}

/**
 * Compile Tailwind CSS for given content.
 */
export async function compileTailwindCSS(options: TailwindCompileOptions): Promise<CompiledCSS> {
  const { content, config = {}, darkMode = false } = options;

  try {
    const postcss = (await import('postcss')).default;
    const tailwindcss = (await import('tailwindcss')).default;
    const autoprefixer = (await import('autoprefixer')).default;

    // Create inline Tailwind config
    const tailwindConfig = {
      content: [{ raw: content, extension: 'html' }],
      darkMode: darkMode ? 'class' : 'media',
      theme: {
        extend: config.theme?.extend || {},
        ...(config.theme || {}),
      },
      plugins: config.plugins || [],
    };

    // Base CSS with Tailwind directives
    const inputCSS = `
      @tailwind base;
      @tailwind components;
      @tailwind utilities;
    `;

    // Process with PostCSS
    const result = await postcss([
      tailwindcss(tailwindConfig as any),
      autoprefixer,
    ]).process(inputCSS, {
      from: undefined,
    });

    // Extract used classes from content
    const classRegex = /class(?:Name)?=["']([^"']+)["']/g;
    const classes: string[] = [];
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      classes.push(...match[1].split(/\s+/).filter(Boolean));
    }

    return {
      css: result.css,
      classes: [...new Set(classes)],
    };
  } catch (error) {
    console.warn('[TailwindCompiler] PostCSS/Tailwind not available, using fallback');
    return {
      css: getFallbackCSS(content),
      classes: extractClasses(content),
    };
  }
}

/**
 * Extract CSS classes from content.
 */
function extractClasses(content: string): string[] {
  const classRegex = /class(?:Name)?=["']([^"']+)["']/g;
  const classes: string[] = [];
  let match;
  while ((match = classRegex.exec(content)) !== null) {
    classes.push(...match[1].split(/\s+/).filter(Boolean));
  }
  return [...new Set(classes)];
}

/**
 * Generate fallback CSS for common Tailwind classes.
 * Used when PostCSS/Tailwind is not available.
 */
function getFallbackCSS(content: string): string {
  const classes = extractClasses(content);
  const rules: string[] = [];

  for (const cls of classes) {
    const rule = getTailwindRule(cls);
    if (rule) {
      rules.push(`.${escapeClass(cls)} { ${rule} }`);
    }
  }

  return rules.join('\n');
}

/**
 * Escape CSS class name.
 */
function escapeClass(className: string): string {
  return className.replace(/[/:[\]().#]/g, '\\$&');
}

/**
 * Get CSS rule for a Tailwind class (fallback implementation).
 */
function getTailwindRule(className: string): string | null {
  // Common Tailwind class mappings
  const rules: Record<string, string> = {
    // Layout
    'flex': 'display: flex',
    'inline-flex': 'display: inline-flex',
    'block': 'display: block',
    'inline-block': 'display: inline-block',
    'hidden': 'display: none',
    'grid': 'display: grid',

    // Flexbox
    'flex-row': 'flex-direction: row',
    'flex-col': 'flex-direction: column',
    'flex-wrap': 'flex-wrap: wrap',
    'flex-nowrap': 'flex-wrap: nowrap',
    'items-start': 'align-items: flex-start',
    'items-center': 'align-items: center',
    'items-end': 'align-items: flex-end',
    'justify-start': 'justify-content: flex-start',
    'justify-center': 'justify-content: center',
    'justify-end': 'justify-content: flex-end',
    'justify-between': 'justify-content: space-between',
    'justify-around': 'justify-content: space-around',

    // Position
    'relative': 'position: relative',
    'absolute': 'position: absolute',
    'fixed': 'position: fixed',

    // Size
    'w-full': 'width: 100%',
    'h-full': 'height: 100%',
    'w-screen': 'width: 100vw',
    'h-screen': 'height: 100vh',

    // Text
    'text-left': 'text-align: left',
    'text-center': 'text-align: center',
    'text-right': 'text-align: right',
    'text-xs': 'font-size: 0.75rem; line-height: 1rem',
    'text-sm': 'font-size: 0.875rem; line-height: 1.25rem',
    'text-base': 'font-size: 1rem; line-height: 1.5rem',
    'text-lg': 'font-size: 1.125rem; line-height: 1.75rem',
    'text-xl': 'font-size: 1.25rem; line-height: 1.75rem',
    'text-2xl': 'font-size: 1.5rem; line-height: 2rem',
    'text-3xl': 'font-size: 1.875rem; line-height: 2.25rem',
    'text-4xl': 'font-size: 2.25rem; line-height: 2.5rem',
    'text-5xl': 'font-size: 3rem; line-height: 1',
    'text-6xl': 'font-size: 3.75rem; line-height: 1',

    // Font weight
    'font-thin': 'font-weight: 100',
    'font-light': 'font-weight: 300',
    'font-normal': 'font-weight: 400',
    'font-medium': 'font-weight: 500',
    'font-semibold': 'font-weight: 600',
    'font-bold': 'font-weight: 700',
    'font-extrabold': 'font-weight: 800',
    'font-black': 'font-weight: 900',

    // Colors (common)
    'text-white': 'color: #ffffff',
    'text-black': 'color: #000000',
    'bg-white': 'background-color: #ffffff',
    'bg-black': 'background-color: #000000',
    'bg-transparent': 'background-color: transparent',

    // Border
    'border': 'border-width: 1px',
    'border-0': 'border-width: 0',
    'border-2': 'border-width: 2px',
    'border-4': 'border-width: 4px',
    'rounded': 'border-radius: 0.25rem',
    'rounded-md': 'border-radius: 0.375rem',
    'rounded-lg': 'border-radius: 0.5rem',
    'rounded-xl': 'border-radius: 0.75rem',
    'rounded-2xl': 'border-radius: 1rem',
    'rounded-full': 'border-radius: 9999px',

    // Shadow
    'shadow': 'box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    'shadow-md': 'box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    'shadow-lg': 'box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    'shadow-none': 'box-shadow: none',

    // Opacity
    'opacity-0': 'opacity: 0',
    'opacity-25': 'opacity: 0.25',
    'opacity-50': 'opacity: 0.5',
    'opacity-75': 'opacity: 0.75',
    'opacity-100': 'opacity: 1',

    // Overflow
    'overflow-hidden': 'overflow: hidden',
    'overflow-auto': 'overflow: auto',
    'overflow-scroll': 'overflow: scroll',
    'overflow-visible': 'overflow: visible',
  };

  // Direct match
  if (rules[className]) {
    return rules[className];
  }

  // Dynamic spacing (p-, m-, gap-)
  const spacingMatch = className.match(/^(p|m|gap)([xytblr])?-(\d+)$/);
  if (spacingMatch) {
    const [, type, direction, value] = spacingMatch;
    const rem = parseInt(value) * 0.25;
    const property =
      type === 'p' ? 'padding' : type === 'm' ? 'margin' : 'gap';

    const dirMap: Record<string, string> = {
      x: `-left: ${rem}rem; ${property}-right: ${rem}rem`,
      y: `-top: ${rem}rem; ${property}-bottom: ${rem}rem`,
      t: '-top',
      b: '-bottom',
      l: '-left',
      r: '-right',
    };

    if (direction) {
      if (direction === 'x' || direction === 'y') {
        return `${property}${dirMap[direction]}`;
      }
      return `${property}${dirMap[direction]}: ${rem}rem`;
    }
    return `${property}: ${rem}rem`;
  }

  // Dynamic colors
  const colorMatch = className.match(/^(text|bg|border)-([a-z]+)-(\d+)$/);
  if (colorMatch) {
    const [, type, color, shade] = colorMatch;
    const colorValue = getTailwindColor(color, parseInt(shade));
    if (colorValue) {
      const property =
        type === 'text'
          ? 'color'
          : type === 'bg'
          ? 'background-color'
          : 'border-color';
      return `${property}: ${colorValue}`;
    }
  }

  return null;
}

/**
 * Get Tailwind color value.
 */
function getTailwindColor(color: string, shade: number): string | null {
  const colors: Record<string, Record<number, string>> = {
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    red: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    blue: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    green: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    yellow: {
      50: '#fefce8',
      100: '#fef9c3',
      200: '#fef08a',
      300: '#fde047',
      400: '#facc15',
      500: '#eab308',
      600: '#ca8a04',
      700: '#a16207',
      800: '#854d0e',
      900: '#713f12',
    },
    purple: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
    },
  };

  return colors[color]?.[shade] || null;
}

/**
 * Render HTML content with Tailwind CSS to an image.
 * Requires Puppeteer for full rendering support.
 */
export async function renderTailwindToImage(
  content: string,
  width: number,
  height: number,
  options: TailwindCompileOptions = { content }
): Promise<Buffer> {
  const { css } = await compileTailwindCSS({ ...options, content });

  const fullHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { width: ${width}px; height: ${height}px; overflow: hidden; }
          ${css}
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `;

  // For full rendering, use Puppeteer
  try {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    await page.setContent(fullHTML, { waitUntil: 'networkidle0' });
    const screenshot = await page.screenshot({ type: 'png' });
    await browser.close();
    return Buffer.from(screenshot);
  } catch (error) {
    console.warn('[TailwindCompiler] Puppeteer not available for rendering');
    throw new Error('Puppeteer required for Tailwind rendering');
  }
}
