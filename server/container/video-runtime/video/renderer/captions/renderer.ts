/**
 * Caption Renderer
 *
 * Renders captions onto video frames using Canvas.
 */

import type { Caption, CaptionStyle, CaptionTrack } from './parser.js';

// Canvas and createCanvas are loaded dynamically for Node.js
let createCanvasModule: typeof import('canvas') | null = null;

async function getCanvas() {
  if (!createCanvasModule) {
    createCanvasModule = await import('canvas');
  }
  return createCanvasModule;
}

export interface CaptionRenderOptions {
  width: number;
  height: number;
  style?: CaptionStyle;
  padding?: number;
  maxLines?: number;
  lineHeight?: number;
  shadowColor?: string;
  shadowBlur?: number;
  outlineColor?: string;
  outlineWidth?: number;
}

const DEFAULT_STYLE: CaptionStyle = {
  color: '#FFFFFF',
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  fontSize: 32,
  fontFamily: 'Arial, sans-serif',
  position: 'bottom',
  align: 'center',
  bold: false,
  italic: false,
  underline: false,
};

const DEFAULT_OPTIONS: Partial<CaptionRenderOptions> = {
  padding: 16,
  maxLines: 3,
  lineHeight: 1.4,
  shadowColor: 'rgba(0, 0, 0, 0.8)',
  shadowBlur: 4,
  outlineColor: '#000000',
  outlineWidth: 2,
};

/**
 * Word wrap text to fit within a given width.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  const paragraphs = text.split('\n');

  for (const paragraph of paragraphs) {
    const words = paragraph.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * Render a single caption to a canvas buffer.
 */
export async function renderCaption(
  caption: Caption,
  options: CaptionRenderOptions
): Promise<Buffer> {
  const { createCanvas } = await getCanvas();
  const canvas = createCanvas(options.width, options.height);
  const ctx = canvas.getContext('2d');

  // Merge styles
  const style = { ...DEFAULT_STYLE, ...options.style, ...caption.styles };
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Set font
  const fontWeight = style.bold ? 'bold' : 'normal';
  const fontStyle = style.italic ? 'italic' : 'normal';
  ctx.font = `${fontStyle} ${fontWeight} ${style.fontSize}px ${style.fontFamily}`;
  ctx.textBaseline = 'top';

  // Calculate text dimensions
  const maxWidth = options.width - (opts.padding! * 2);
  const lines = wrapText(ctx as unknown as CanvasRenderingContext2D, caption.text, maxWidth);
  const limitedLines = lines.slice(0, opts.maxLines!);

  const lineHeightPx = style.fontSize! * opts.lineHeight!;
  const textHeight = limitedLines.length * lineHeightPx;
  const boxPadding = opts.padding! / 2;

  // Calculate widest line
  let maxLineWidth = 0;
  for (const line of limitedLines) {
    const metrics = ctx.measureText(line);
    maxLineWidth = Math.max(maxLineWidth, metrics.width);
  }

  // Calculate box dimensions
  const boxWidth = maxLineWidth + boxPadding * 2;
  const boxHeight = textHeight + boxPadding * 2;

  // Calculate position
  let boxX = (options.width - boxWidth) / 2; // Center by default
  let boxY: number;

  switch (style.position) {
    case 'top':
      boxY = opts.padding!;
      break;
    case 'middle':
      boxY = (options.height - boxHeight) / 2;
      break;
    case 'bottom':
    default:
      boxY = options.height - boxHeight - opts.padding!;
      break;
  }

  // Align horizontally
  switch (style.align) {
    case 'left':
      boxX = opts.padding!;
      ctx.textAlign = 'left';
      break;
    case 'right':
      boxX = options.width - boxWidth - opts.padding!;
      ctx.textAlign = 'right';
      break;
    case 'center':
    default:
      ctx.textAlign = 'center';
      break;
  }

  // Draw background
  if (style.backgroundColor) {
    ctx.fillStyle = style.backgroundColor;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 8);
    ctx.fill();
  }

  // Draw text
  ctx.fillStyle = style.color || '#FFFFFF';

  if (opts.shadowBlur) {
    ctx.shadowColor = opts.shadowColor!;
    ctx.shadowBlur = opts.shadowBlur!;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
  }

  for (let i = 0; i < limitedLines.length; i++) {
    let textX: number;
    const textY = boxY + boxPadding + i * lineHeightPx;

    switch (style.align) {
      case 'left':
        textX = boxX + boxPadding;
        break;
      case 'right':
        textX = boxX + boxWidth - boxPadding;
        break;
      case 'center':
      default:
        textX = boxX + boxWidth / 2;
        break;
    }

    // Draw outline
    if (opts.outlineWidth && opts.outlineColor) {
      ctx.strokeStyle = opts.outlineColor;
      ctx.lineWidth = opts.outlineWidth;
      ctx.strokeText(limitedLines[i], textX, textY);
    }

    // Draw text
    ctx.fillText(limitedLines[i], textX, textY);

    // Draw underline
    if (style.underline) {
      const metrics = ctx.measureText(limitedLines[i]);
      const underlineY = textY + style.fontSize! + 2;
      let underlineX1: number;
      let underlineX2: number;

      switch (style.align) {
        case 'left':
          underlineX1 = textX;
          underlineX2 = textX + metrics.width;
          break;
        case 'right':
          underlineX1 = textX - metrics.width;
          underlineX2 = textX;
          break;
        case 'center':
        default:
          underlineX1 = textX - metrics.width / 2;
          underlineX2 = textX + metrics.width / 2;
          break;
      }

      ctx.beginPath();
      ctx.moveTo(underlineX1, underlineY);
      ctx.lineTo(underlineX2, underlineY);
      ctx.strokeStyle = style.color || '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  return canvas.toBuffer('image/png');
}

/**
 * Render captions for a specific frame/time.
 */
export async function renderCaptionsAtTime(
  captions: Caption[],
  time: number,
  options: CaptionRenderOptions
): Promise<Buffer | null> {
  // Find active captions
  const activeCaptions = captions.filter(
    (c) => time >= c.startTime && time <= c.endTime
  );

  if (activeCaptions.length === 0) {
    return null;
  }

  // Merge multiple active captions
  const mergedCaption: Caption = {
    index: 0,
    startTime: Math.min(...activeCaptions.map((c) => c.startTime)),
    endTime: Math.max(...activeCaptions.map((c) => c.endTime)),
    text: activeCaptions.map((c) => c.text).join('\n'),
    styles: activeCaptions[0].styles,
  };

  return renderCaption(mergedCaption, options);
}

/**
 * Generate FFmpeg drawtext filter for captions.
 */
export function generateDrawtextFilter(
  caption: Caption,
  options: CaptionRenderOptions
): string {
  const style = { ...DEFAULT_STYLE, ...options.style, ...caption.styles };

  // Convert color to FFmpeg format (remove # and add 0x, or use color names)
  const fontColor = style.color?.replace('#', '0x') || '0xFFFFFF';
  const bgColor = style.backgroundColor?.replace('#', '0x') || '0x000000@0.75';

  // Calculate position
  let x = '(w-text_w)/2'; // Center
  let y: string;

  switch (style.position) {
    case 'top':
      y = `${options.padding || 16}`;
      break;
    case 'middle':
      y = '(h-text_h)/2';
      break;
    case 'bottom':
    default:
      y = `h-text_h-${options.padding || 16}`;
      break;
  }

  switch (style.align) {
    case 'left':
      x = `${options.padding || 16}`;
      break;
    case 'right':
      x = `w-text_w-${options.padding || 16}`;
      break;
  }

  // Escape text for FFmpeg
  const escapedText = caption.text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/:/g, '\\:')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');

  const filter = [
    'drawtext=',
    `text='${escapedText}'`,
    `fontsize=${style.fontSize}`,
    `fontcolor=${fontColor}`,
    `x=${x}`,
    `y=${y}`,
    `enable='between(t,${caption.startTime},${caption.endTime})'`,
  ];

  if (style.backgroundColor) {
    filter.push(`box=1`);
    filter.push(`boxcolor=${bgColor}`);
    filter.push(`boxborderw=8`);
  }

  if (style.fontFamily) {
    // Use system font or specify font file
    filter.push(`font='${style.fontFamily.split(',')[0].trim()}'`);
  }

  return filter.join(':');
}

/**
 * Generate FFmpeg subtitles filter for a caption track.
 */
export function generateSubtitlesFilter(
  track: CaptionTrack,
  subtitleFile: string
): string {
  // The subtitle file should be written in ASS/SSA format for full styling
  return `subtitles=${subtitleFile}:force_style='FontSize=${track.defaultStyle?.fontSize || 24},PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,Outline=2'`;
}

/**
 * Convert captions to ASS (Advanced SubStation Alpha) format.
 * ASS provides better styling support for FFmpeg.
 */
export function generateAss(
  captions: Caption[],
  options: CaptionRenderOptions
): string {
  const style = { ...DEFAULT_STYLE, ...options.style };

  // ASS uses BGR color format with alpha at the start
  const primaryColor = style.color
    ? '&H00' + style.color.slice(5, 7) + style.color.slice(3, 5) + style.color.slice(1, 3)
    : '&H00FFFFFF';

  const outlineColor = '&H00000000';
  const backColor = '&H80000000';

  // Alignment in ASS: 1=left, 2=center, 3=right, combined with position
  // Position: 1-3 bottom, 4-6 middle, 7-9 top
  let alignment = 2; // Center bottom default
  if (style.position === 'top') alignment += 6;
  else if (style.position === 'middle') alignment += 3;
  if (style.align === 'left') alignment -= 1;
  else if (style.align === 'right') alignment += 1;

  const header = `[Script Info]
Title: Generated Subtitles
ScriptType: v4.00+
Collisions: Normal
PlayDepth: 0
PlayResX: ${options.width}
PlayResY: ${options.height}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${style.fontFamily?.split(',')[0].trim() || 'Arial'},${style.fontSize},${primaryColor},&H000000FF,${outlineColor},${backColor},${style.bold ? -1 : 0},${style.italic ? -1 : 0},${style.underline ? -1 : 0},0,100,100,0,0,1,2,1,${alignment},20,20,20,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const events = captions
    .map((caption) => {
      // Format times as H:MM:SS.cc (centiseconds)
      const formatAssTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const cs = Math.round((seconds % 1) * 100);
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
      };

      const start = formatAssTime(caption.startTime);
      const end = formatAssTime(caption.endTime);

      // Replace newlines with ASS line break
      const text = caption.text.replace(/\n/g, '\\N');

      return `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`;
    })
    .join('\n');

  return header + events;
}

/**
 * Create a caption renderer for a video.
 */
export function createCaptionRenderer(options: CaptionRenderOptions) {
  return {
    async renderFrame(captions: Caption[], time: number): Promise<Buffer | null> {
      return renderCaptionsAtTime(captions, time, options);
    },

    generateFilter(captions: Caption[]): string {
      return captions.map((c) => generateDrawtextFilter(c, options)).join(',');
    },

    generateAss(captions: Caption[]): string {
      return generateAss(captions, options);
    },
  };
}
