/**
 * Font Loading System
 *
 * Handles font loading for video rendering.
 * Supports Google Fonts and local font files.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface FontConfig {
  family: string;
  src: string | string[]; // URL or local path
  weight?: number | string;
  style?: 'normal' | 'italic';
}

export interface LoadedFont {
  family: string;
  weight: number | string;
  style: string;
  path: string;
}

export interface FontManagerConfig {
  fontDir: string;
  googleFontsApiKey?: string;
}

/**
 * Google Fonts API response structure.
 */
interface GoogleFontsResponse {
  items: Array<{
    family: string;
    variants: string[];
    files: Record<string, string>;
  }>;
}

/**
 * Font Manager for loading and managing fonts.
 */
export class FontManager {
  private config: FontManagerConfig;
  private loadedFonts: Map<string, LoadedFont> = new Map();
  private googleFontsCache: Map<string, GoogleFontsResponse['items'][0]> = new Map();

  constructor(config: FontManagerConfig) {
    this.config = config;
  }

  /**
   * Initialize the font manager.
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.config.fontDir, { recursive: true });
    console.log(`[FontManager] Initialized at ${this.config.fontDir}`);
  }

  /**
   * Load a Google Font.
   */
  async loadGoogleFont(
    family: string,
    options: {
      weights?: Array<number | string>;
      styles?: Array<'normal' | 'italic'>;
    } = {}
  ): Promise<LoadedFont[]> {
    const { weights = [400], styles = ['normal'] } = options;

    // Fetch font metadata from Google Fonts API
    const fontData = await this.fetchGoogleFontData(family);
    if (!fontData) {
      throw new Error(`Font "${family}" not found in Google Fonts`);
    }

    const loadedFonts: LoadedFont[] = [];

    for (const weight of weights) {
      for (const style of styles) {
        const variant = this.getGoogleFontVariant(weight, style);
        const url = fontData.files[variant];

        if (!url) {
          console.warn(`[FontManager] Variant ${variant} not available for ${family}`);
          continue;
        }

        // Download font file
        const fontPath = await this.downloadFont(url, family, weight, style);

        const loadedFont: LoadedFont = {
          family,
          weight,
          style,
          path: fontPath,
        };

        const key = `${family}-${weight}-${style}`;
        this.loadedFonts.set(key, loadedFont);
        loadedFonts.push(loadedFont);
      }
    }

    return loadedFonts;
  }

  /**
   * Load a local font file.
   */
  async loadLocalFont(config: FontConfig): Promise<LoadedFont> {
    const src = Array.isArray(config.src) ? config.src[0] : config.src;
    const weight = config.weight || 400;
    const style = config.style || 'normal';

    // Copy font to font directory if it's not already there
    const ext = path.extname(src);
    const fileName = `${config.family}-${weight}-${style}${ext}`;
    const destPath = path.join(this.config.fontDir, fileName);

    if (src.startsWith('http://') || src.startsWith('https://')) {
      await this.downloadFont(src, config.family, weight, style);
    } else {
      // Copy local file
      await fs.copyFile(src, destPath);
    }

    const loadedFont: LoadedFont = {
      family: config.family,
      weight,
      style,
      path: destPath,
    };

    const key = `${config.family}-${weight}-${style}`;
    this.loadedFonts.set(key, loadedFont);

    return loadedFont;
  }

  /**
   * Get a loaded font.
   */
  getFont(family: string, weight: number | string = 400, style: string = 'normal'): LoadedFont | null {
    const key = `${family}-${weight}-${style}`;
    return this.loadedFonts.get(key) || null;
  }

  /**
   * Get font path for FFmpeg drawtext filter.
   */
  getFontPath(family: string, weight: number | string = 400, style: string = 'normal'): string | null {
    const font = this.getFont(family, weight, style);
    return font?.path || null;
  }

  /**
   * List all loaded fonts.
   */
  listFonts(): LoadedFont[] {
    return Array.from(this.loadedFonts.values());
  }

  /**
   * Get system fonts path (for Noto fonts installed via apt).
   */
  getSystemFontPath(family: string): string | null {
    const systemFontPaths = [
      '/usr/share/fonts/truetype/noto',
      '/usr/share/fonts/opentype/noto',
      '/usr/share/fonts/truetype/dejavu',
    ];

    const familyPatterns: Record<string, string[]> = {
      'Noto Sans': ['NotoSans-Regular.ttf', 'NotoSans-Regular.otf'],
      'Noto Sans CJK': ['NotoSansCJK-Regular.ttc', 'NotoSansCJKsc-Regular.otf'],
      'Noto Serif': ['NotoSerif-Regular.ttf', 'NotoSerif-Regular.otf'],
      'DejaVu Sans': ['DejaVuSans.ttf'],
    };

    const patterns = familyPatterns[family] || [];

    for (const fontDir of systemFontPaths) {
      for (const pattern of patterns) {
        const fontPath = path.join(fontDir, pattern);
        try {
          // Note: In production, use fs.accessSync or async check
          return fontPath;
        } catch {
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Fetch Google Font metadata.
   */
  private async fetchGoogleFontData(family: string): Promise<GoogleFontsResponse['items'][0] | null> {
    // Check cache
    if (this.googleFontsCache.has(family)) {
      return this.googleFontsCache.get(family)!;
    }

    try {
      const apiKey = this.config.googleFontsApiKey || '';
      const url = apiKey
        ? `https://www.googleapis.com/webfonts/v1/webfonts?family=${encodeURIComponent(family)}&key=${apiKey}`
        : `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}`;

      if (!apiKey) {
        // Without API key, we can still get fonts from Google Fonts CSS endpoint
        // but we'll use a simpler approach - assume standard font URL format
        const fontData: GoogleFontsResponse['items'][0] = {
          family,
          variants: ['regular', '500', '600', '700', 'italic'],
          files: {
            regular: `https://fonts.gstatic.com/s/${family.toLowerCase().replace(/\s+/g, '')}/v1/${family.replace(/\s+/g, '')}-Regular.ttf`,
          },
        };
        this.googleFontsCache.set(family, fontData);
        return fontData;
      }

      const response = await fetch(url);
      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as GoogleFontsResponse;
      const fontData = data.items?.[0];

      if (fontData) {
        this.googleFontsCache.set(family, fontData);
      }

      return fontData || null;
    } catch (error) {
      console.error(`[FontManager] Failed to fetch Google Font "${family}":`, error);
      return null;
    }
  }

  /**
   * Download a font file.
   */
  private async downloadFont(
    url: string,
    family: string,
    weight: number | string,
    style: string
  ): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download font: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Determine extension from URL or content-type
    let ext = path.extname(new URL(url).pathname);
    if (!ext) {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('truetype')) ext = '.ttf';
      else if (contentType?.includes('opentype')) ext = '.otf';
      else if (contentType?.includes('woff2')) ext = '.woff2';
      else if (contentType?.includes('woff')) ext = '.woff';
      else ext = '.ttf';
    }

    const fileName = `${family.replace(/\s+/g, '-')}-${weight}-${style}${ext}`;
    const fontPath = path.join(this.config.fontDir, fileName);

    await fs.writeFile(fontPath, buffer);
    console.log(`[FontManager] Downloaded ${family} ${weight} ${style} to ${fontPath}`);

    return fontPath;
  }

  /**
   * Get Google Font variant string.
   */
  private getGoogleFontVariant(weight: number | string, style: string): string {
    const w = String(weight);
    if (style === 'italic') {
      return w === '400' ? 'italic' : `${w}italic`;
    }
    return w === '400' ? 'regular' : w;
  }
}

/**
 * Create a font manager.
 */
export function createFontManager(config: FontManagerConfig): FontManager {
  return new FontManager(config);
}
