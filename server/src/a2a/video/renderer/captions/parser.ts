/**
 * Caption Parser
 *
 * Parses SRT and VTT subtitle formats for video overlay.
 */

export interface Caption {
  index: number;
  startTime: number; // seconds
  endTime: number; // seconds
  text: string;
  styles?: CaptionStyle;
}

export interface CaptionStyle {
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
  position?: 'top' | 'middle' | 'bottom';
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export interface CaptionTrack {
  language: string;
  label: string;
  captions: Caption[];
  defaultStyle?: CaptionStyle;
}

/**
 * Parse time string to seconds.
 * Supports: HH:MM:SS,mmm (SRT) or HH:MM:SS.mmm (VTT)
 */
function parseTime(timeStr: string): number {
  // Normalize separator
  const normalized = timeStr.replace(',', '.');
  const parts = normalized.split(':');

  if (parts.length === 3) {
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }

  return parseFloat(normalized);
}

/**
 * Format seconds to SRT time string.
 */
export function formatSrtTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

/**
 * Format seconds to VTT time string.
 */
export function formatVttTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

/**
 * Parse VTT cue settings.
 */
function parseVttSettings(settingsStr: string): Partial<CaptionStyle> {
  const style: Partial<CaptionStyle> = {};
  const settings = settingsStr.split(/\s+/);

  for (const setting of settings) {
    const [key, value] = setting.split(':');
    if (!key || !value) continue;

    switch (key) {
      case 'align':
        if (value === 'start' || value === 'left') style.align = 'left';
        else if (value === 'end' || value === 'right') style.align = 'right';
        else style.align = 'center';
        break;
      case 'line':
        if (value.includes('%')) {
          const percent = parseFloat(value);
          if (percent < 33) style.position = 'top';
          else if (percent > 66) style.position = 'bottom';
          else style.position = 'middle';
        }
        break;
      case 'position':
        // Horizontal position - not directly mapped to our style
        break;
      case 'size':
        // Width percentage - not directly mapped
        break;
    }
  }

  return style;
}

/**
 * Parse inline VTT tags for styling.
 */
function parseVttTags(text: string): { cleanText: string; style: Partial<CaptionStyle> } {
  const style: Partial<CaptionStyle> = {};
  let cleanText = text;

  // Bold
  if (/<b>/i.test(text)) {
    style.bold = true;
    cleanText = cleanText.replace(/<\/?b>/gi, '');
  }

  // Italic
  if (/<i>/i.test(text)) {
    style.italic = true;
    cleanText = cleanText.replace(/<\/?i>/gi, '');
  }

  // Underline
  if (/<u>/i.test(text)) {
    style.underline = true;
    cleanText = cleanText.replace(/<\/?u>/gi, '');
  }

  // Voice span (for speaker identification)
  cleanText = cleanText.replace(/<v\s+[^>]+>([^<]*)<\/v>/gi, '$1');

  // Color class
  const colorMatch = cleanText.match(/<c\.([^>]+)>([^<]*)<\/c>/i);
  if (colorMatch) {
    style.color = colorMatch[1];
    cleanText = cleanText.replace(/<c\.[^>]+>([^<]*)<\/c>/gi, '$1');
  }

  // Remove any remaining tags
  cleanText = cleanText.replace(/<[^>]+>/g, '');

  return { cleanText: cleanText.trim(), style };
}

/**
 * Parse SRT subtitle file.
 */
export function parseSrt(content: string): Caption[] {
  const captions: Caption[] = [];
  const blocks = content.trim().split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length < 3) continue;

    // First line is index
    const index = parseInt(lines[0], 10);
    if (isNaN(index)) continue;

    // Second line is timing
    const timingMatch = lines[1].match(
      /(\d{1,2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,\.]\d{3})/
    );
    if (!timingMatch) continue;

    const startTime = parseTime(timingMatch[1]);
    const endTime = parseTime(timingMatch[2]);

    // Rest is text
    const text = lines.slice(2).join('\n');

    captions.push({
      index,
      startTime,
      endTime,
      text,
    });
  }

  return captions;
}

/**
 * Parse VTT subtitle file.
 */
export function parseVtt(content: string): Caption[] {
  const captions: Caption[] = [];

  // Remove WEBVTT header and any metadata
  const lines = content.split('\n');
  let startIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('WEBVTT')) {
      startIndex = i + 1;
      break;
    }
  }

  // Skip header metadata (lines starting with NOTE, STYLE, etc.)
  while (startIndex < lines.length) {
    const line = lines[startIndex].trim();
    if (line === '' || line.startsWith('NOTE') || line.startsWith('STYLE') || line.startsWith('REGION')) {
      startIndex++;
      // Skip until next blank line for multi-line headers
      if (line.startsWith('NOTE') || line.startsWith('STYLE') || line.startsWith('REGION')) {
        while (startIndex < lines.length && lines[startIndex].trim() !== '') {
          startIndex++;
        }
      }
    } else {
      break;
    }
  }

  // Join remaining content and split into cue blocks
  const cueContent = lines.slice(startIndex).join('\n');
  const blocks = cueContent.trim().split(/\n\n+/);

  let index = 1;
  for (const block of blocks) {
    const blockLines = block.split('\n').filter((l) => l.trim() !== '');
    if (blockLines.length < 2) continue;

    let timingLineIndex = 0;

    // Check if first line is a cue identifier
    if (!blockLines[0].includes('-->')) {
      timingLineIndex = 1;
    }

    if (timingLineIndex >= blockLines.length) continue;

    // Parse timing line
    const timingLine = blockLines[timingLineIndex];
    const timingMatch = timingLine.match(
      /(\d{1,2}:?\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{1,2}:?\d{2}:\d{2}[,\.]\d{3})(.*)$/
    );
    if (!timingMatch) continue;

    const startTime = parseTime(timingMatch[1]);
    const endTime = parseTime(timingMatch[2]);
    const settingsStr = timingMatch[3]?.trim() || '';

    // Parse cue settings
    const positionStyle = settingsStr ? parseVttSettings(settingsStr) : {};

    // Rest is text
    const textLines = blockLines.slice(timingLineIndex + 1);
    const rawText = textLines.join('\n');

    // Parse inline tags
    const { cleanText, style: tagStyle } = parseVttTags(rawText);

    captions.push({
      index: index++,
      startTime,
      endTime,
      text: cleanText,
      styles: { ...positionStyle, ...tagStyle },
    });
  }

  return captions;
}

/**
 * Auto-detect format and parse.
 */
export function parseCaptions(content: string): Caption[] {
  const trimmed = content.trim();

  if (trimmed.startsWith('WEBVTT') || trimmed.includes('\nWEBVTT')) {
    return parseVtt(content);
  }

  return parseSrt(content);
}

/**
 * Generate SRT content from captions.
 */
export function generateSrt(captions: Caption[]): string {
  return captions
    .map((caption, i) => {
      const index = caption.index || i + 1;
      const timing = `${formatSrtTime(caption.startTime)} --> ${formatSrtTime(caption.endTime)}`;
      return `${index}\n${timing}\n${caption.text}`;
    })
    .join('\n\n');
}

/**
 * Generate VTT content from captions.
 */
export function generateVtt(captions: Caption[], includeStyles = false): string {
  const header = 'WEBVTT\n\n';

  const cues = captions
    .map((caption) => {
      let timing = `${formatVttTime(caption.startTime)} --> ${formatVttTime(caption.endTime)}`;

      // Add cue settings if styles are present
      if (includeStyles && caption.styles) {
        const settings: string[] = [];
        if (caption.styles.align) {
          settings.push(`align:${caption.styles.align}`);
        }
        if (caption.styles.position) {
          const lineMap = { top: '10%', middle: '50%', bottom: '90%' };
          settings.push(`line:${lineMap[caption.styles.position]}`);
        }
        if (settings.length > 0) {
          timing += ' ' + settings.join(' ');
        }
      }

      let text = caption.text;

      // Wrap with style tags if needed
      if (includeStyles && caption.styles) {
        if (caption.styles.bold) text = `<b>${text}</b>`;
        if (caption.styles.italic) text = `<i>${text}</i>`;
        if (caption.styles.underline) text = `<u>${text}</u>`;
      }

      return `${timing}\n${text}`;
    })
    .join('\n\n');

  return header + cues;
}

/**
 * Get captions visible at a specific time.
 */
export function getCaptionsAtTime(captions: Caption[], time: number): Caption[] {
  return captions.filter((c) => time >= c.startTime && time <= c.endTime);
}

/**
 * Shift all caption timings.
 */
export function shiftCaptions(captions: Caption[], offsetSeconds: number): Caption[] {
  return captions.map((c) => ({
    ...c,
    startTime: Math.max(0, c.startTime + offsetSeconds),
    endTime: Math.max(0, c.endTime + offsetSeconds),
  }));
}

/**
 * Scale caption timings (for speed changes).
 */
export function scaleCaptions(captions: Caption[], factor: number): Caption[] {
  return captions.map((c) => ({
    ...c,
    startTime: c.startTime * factor,
    endTime: c.endTime * factor,
  }));
}

/**
 * Merge overlapping captions.
 */
export function mergeCaptions(captions: Caption[], maxGap = 0.5): Caption[] {
  if (captions.length === 0) return [];

  const sorted = [...captions].sort((a, b) => a.startTime - b.startTime);
  const merged: Caption[] = [];
  let current = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];

    // If captions are close enough, merge them
    if (next.startTime - current.endTime <= maxGap) {
      current.endTime = Math.max(current.endTime, next.endTime);
      current.text = current.text + '\n' + next.text;
    } else {
      merged.push(current);
      current = { ...next };
    }
  }

  merged.push(current);

  // Re-index
  return merged.map((c, i) => ({ ...c, index: i + 1 }));
}
