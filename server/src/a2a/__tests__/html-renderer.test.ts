/**
 * HTML Renderer Tests
 *
 * Tests for Puppeteer-based HTML element rendering.
 */

import { describe, test, expect } from 'bun:test';
import type { HtmlRenderConfig } from '../video/renderer/html/renderer.js';

describe('HtmlRenderConfig', () => {
  describe('basic configuration', () => {
    test('config with HTML content', () => {
      const config: HtmlRenderConfig = {
        html: '<div class="test">Hello World</div>',
        width: 800,
        height: 600,
      };

      expect(config.html).toBe('<div class="test">Hello World</div>');
      expect(config.width).toBe(800);
      expect(config.height).toBe(600);
    });

    test('config with URL', () => {
      const config: HtmlRenderConfig = {
        url: 'https://example.com',
        width: 1920,
        height: 1080,
      };

      expect(config.url).toBe('https://example.com');
    });

    test('config with CSS injection', () => {
      const config: HtmlRenderConfig = {
        html: '<div class="styled">Styled Content</div>',
        css: '.styled { color: red; font-size: 24px; }',
        width: 400,
        height: 300,
      };

      expect(config.css).toContain('color: red');
    });

    test('config with JavaScript execution', () => {
      const config: HtmlRenderConfig = {
        html: '<div id="dynamic"></div>',
        script: 'document.getElementById("dynamic").textContent = "Updated";',
        width: 400,
        height: 300,
      };

      expect(config.script).toContain('Updated');
    });
  });

  describe('wait options', () => {
    test('wait for selector', () => {
      const config: HtmlRenderConfig = {
        html: '<div class="loading">Loading...</div>',
        waitForSelector: '.loaded',
        width: 400,
        height: 300,
      };

      expect(config.waitForSelector).toBe('.loaded');
    });

    test('wait time', () => {
      const config: HtmlRenderConfig = {
        html: '<div class="animated">Animating...</div>',
        waitTime: 1000,
        width: 400,
        height: 300,
      };

      expect(config.waitTime).toBe(1000);
    });
  });

  describe('rendering options', () => {
    test('device scale factor', () => {
      const config: HtmlRenderConfig = {
        html: '<div>High DPI</div>',
        width: 400,
        height: 300,
        deviceScaleFactor: 3,
      };

      expect(config.deviceScaleFactor).toBe(3);
    });

    test('transparent background', () => {
      const config: HtmlRenderConfig = {
        html: '<div>Transparent</div>',
        width: 400,
        height: 300,
        transparent: true,
      };

      expect(config.transparent).toBe(true);
    });

    test('opaque background', () => {
      const config: HtmlRenderConfig = {
        html: '<div>Opaque</div>',
        width: 400,
        height: 300,
        transparent: false,
      };

      expect(config.transparent).toBe(false);
    });
  });

  describe('Tailwind integration', () => {
    test('config with Tailwind classes', () => {
      const config: HtmlRenderConfig = {
        html: '<div>Tailwind Styled</div>',
        tailwindClasses: 'bg-blue-500 text-white p-4 rounded-lg shadow-xl',
        width: 400,
        height: 300,
      };

      expect(config.tailwindClasses).toContain('bg-blue-500');
      expect(config.tailwindClasses).toContain('rounded-lg');
    });
  });

  describe('React component rendering', () => {
    test('DataCard component', () => {
      const config: HtmlRenderConfig = {
        reactComponent: 'DataCard',
        reactProps: {
          title: 'Revenue',
          value: '$12,345',
          subtitle: '+15% from last month',
          icon: '💰',
          color: 'green',
        },
        width: 300,
        height: 200,
      };

      expect(config.reactComponent).toBe('DataCard');
      expect(config.reactProps?.title).toBe('Revenue');
      expect(config.reactProps?.value).toBe('$12,345');
    });

    test('BarChart component', () => {
      const config: HtmlRenderConfig = {
        reactComponent: 'BarChart',
        reactProps: {
          data: [
            { label: 'Jan', value: 100 },
            { label: 'Feb', value: 150 },
            { label: 'Mar', value: 200 },
          ],
          colors: ['#3B82F6', '#10B981', '#F59E0B'],
        },
        width: 600,
        height: 400,
      };

      expect(config.reactComponent).toBe('BarChart');
      expect(config.reactProps?.data).toHaveLength(3);
    });

    test('PriceDisplay component', () => {
      const config: HtmlRenderConfig = {
        reactComponent: 'PriceDisplay',
        reactProps: {
          symbol: 'BTC/USD',
          price: '67,234.56',
          change: '+1,234.56',
          changePercent: '1.87',
          positive: true,
        },
        width: 250,
        height: 150,
      };

      expect(config.reactComponent).toBe('PriceDisplay');
      expect(config.reactProps?.symbol).toBe('BTC/USD');
      expect(config.reactProps?.positive).toBe(true);
    });
  });

  describe('full configuration', () => {
    test('config with all options', () => {
      const config: HtmlRenderConfig = {
        html: '<div class="full">Complete Config</div>',
        css: '.full { background: linear-gradient(45deg, #ff6b6b, #4ecdc4); }',
        script: 'console.log("Initialized");',
        waitForSelector: '.full',
        waitTime: 500,
        width: 1920,
        height: 1080,
        deviceScaleFactor: 2,
        transparent: false,
        tailwindClasses: 'flex items-center justify-center',
      };

      expect(config.html).toBeDefined();
      expect(config.css).toBeDefined();
      expect(config.script).toBeDefined();
      expect(config.waitForSelector).toBe('.full');
      expect(config.waitTime).toBe(500);
      expect(config.width).toBe(1920);
      expect(config.height).toBe(1080);
      expect(config.deviceScaleFactor).toBe(2);
      expect(config.transparent).toBe(false);
      expect(config.tailwindClasses).toBeDefined();
    });
  });
});

describe('HTML Element Use Cases', () => {
  test('data visualization dashboard', () => {
    const config: HtmlRenderConfig = {
      html: `
        <div class="dashboard">
          <div class="metric">
            <span class="label">Users</span>
            <span class="value">12,345</span>
          </div>
          <div class="metric">
            <span class="label">Revenue</span>
            <span class="value">$98,765</span>
          </div>
        </div>
      `,
      css: `
        .dashboard {
          display: flex;
          gap: 20px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea, #764ba2);
        }
        .metric {
          background: rgba(255,255,255,0.1);
          padding: 15px;
          border-radius: 8px;
        }
        .label { color: rgba(255,255,255,0.7); font-size: 12px; }
        .value { color: white; font-size: 24px; font-weight: bold; }
      `,
      width: 600,
      height: 200,
      transparent: false,
    };

    expect(config.html).toContain('dashboard');
    expect(config.css).toContain('linear-gradient');
  });

  test('animated chart with wait time', () => {
    const config: HtmlRenderConfig = {
      reactComponent: 'BarChart',
      reactProps: {
        data: [
          { label: 'Q1', value: 250 },
          { label: 'Q2', value: 380 },
          { label: 'Q3', value: 420 },
          { label: 'Q4', value: 510 },
        ],
      },
      waitTime: 500, // Wait for CSS transitions
      width: 800,
      height: 400,
    };

    expect(config.waitTime).toBe(500);
  });

  test('complex Tailwind layout', () => {
    const config: HtmlRenderConfig = {
      html: `
        <div class="card">
          <h2>Premium Feature</h2>
          <p>Access exclusive content</p>
          <button>Get Started</button>
        </div>
      `,
      tailwindClasses: 'min-h-full bg-gradient-to-br from-purple-600 to-blue-500',
      css: `
        .card {
          @apply bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-white;
        }
        h2 { @apply text-2xl font-bold mb-2; }
        p { @apply text-white/80 mb-4; }
        button { @apply bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold; }
      `,
      width: 400,
      height: 300,
    };

    expect(config.tailwindClasses).toContain('from-purple-600');
  });
});
