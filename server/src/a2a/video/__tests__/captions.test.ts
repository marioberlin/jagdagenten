/**
 * Caption Parser Tests
 */

import { describe, test, expect } from 'bun:test';
import {
  parseSrt,
  parseVtt,
  parseCaptions,
  generateSrt,
  generateVtt,
  formatSrtTime,
  formatVttTime,
  getCaptionsAtTime,
  shiftCaptions,
  scaleCaptions,
  mergeCaptions,
} from '../renderer/captions/parser.js';

const SAMPLE_SRT = `1
00:00:01,000 --> 00:00:04,000
Hello, world!

2
00:00:05,000 --> 00:00:08,500
This is a test subtitle.

3
00:00:10,000 --> 00:00:15,000
Multiple lines
can be used.`;

const SAMPLE_VTT = `WEBVTT

00:00:01.000 --> 00:00:04.000
Hello, world!

00:00:05.000 --> 00:00:08.500
This is a test subtitle.

00:00:10.000 --> 00:00:15.000
Multiple lines
can be used.`;

describe('parseSrt', () => {
  test('parses basic SRT file', () => {
    const captions = parseSrt(SAMPLE_SRT);

    expect(captions).toHaveLength(3);
    expect(captions[0].index).toBe(1);
    expect(captions[0].startTime).toBe(1);
    expect(captions[0].endTime).toBe(4);
    expect(captions[0].text).toBe('Hello, world!');
  });

  test('handles multi-line text', () => {
    const captions = parseSrt(SAMPLE_SRT);

    expect(captions[2].text).toBe('Multiple lines\ncan be used.');
  });

  test('parses fractional seconds', () => {
    const captions = parseSrt(SAMPLE_SRT);

    expect(captions[1].endTime).toBe(8.5);
  });
});

describe('parseVtt', () => {
  test('parses basic VTT file', () => {
    const captions = parseVtt(SAMPLE_VTT);

    expect(captions).toHaveLength(3);
    expect(captions[0].startTime).toBe(1);
    expect(captions[0].endTime).toBe(4);
    expect(captions[0].text).toBe('Hello, world!');
  });

  test('handles VTT with cue identifiers', () => {
    const vtt = `WEBVTT

cue-1
00:00:01.000 --> 00:00:04.000
Test caption`;

    const captions = parseVtt(vtt);
    expect(captions).toHaveLength(1);
    expect(captions[0].text).toBe('Test caption');
  });

  test('parses cue settings', () => {
    const vtt = `WEBVTT

00:00:01.000 --> 00:00:04.000 align:left line:10%
Left aligned caption`;

    const captions = parseVtt(vtt);
    expect(captions[0].styles?.align).toBe('left');
    expect(captions[0].styles?.position).toBe('top');
  });

  test('parses inline tags', () => {
    const vtt = `WEBVTT

00:00:01.000 --> 00:00:04.000
<b>Bold</b> and <i>italic</i>`;

    const captions = parseVtt(vtt);
    expect(captions[0].text).toBe('Bold and italic');
    expect(captions[0].styles?.bold).toBe(true);
    expect(captions[0].styles?.italic).toBe(true);
  });
});

describe('parseCaptions', () => {
  test('auto-detects SRT', () => {
    const captions = parseCaptions(SAMPLE_SRT);
    expect(captions).toHaveLength(3);
  });

  test('auto-detects VTT', () => {
    const captions = parseCaptions(SAMPLE_VTT);
    expect(captions).toHaveLength(3);
  });
});

describe('formatSrtTime', () => {
  test('formats time correctly', () => {
    expect(formatSrtTime(0)).toBe('00:00:00,000');
    expect(formatSrtTime(1)).toBe('00:00:01,000');
    expect(formatSrtTime(61.5)).toBe('00:01:01,500');
    expect(formatSrtTime(3661.123)).toBe('01:01:01,123');
  });
});

describe('formatVttTime', () => {
  test('formats time without hours when < 1 hour', () => {
    expect(formatVttTime(0)).toBe('00:00.000');
    expect(formatVttTime(61.5)).toBe('01:01.500');
  });

  test('includes hours when >= 1 hour', () => {
    expect(formatVttTime(3600)).toBe('01:00:00.000');
    expect(formatVttTime(3661.5)).toBe('01:01:01.500');
  });
});

describe('generateSrt', () => {
  test('generates valid SRT', () => {
    const captions = parseSrt(SAMPLE_SRT);
    const output = generateSrt(captions);

    expect(output).toContain('00:00:01,000 --> 00:00:04,000');
    expect(output).toContain('Hello, world!');
  });

  test('round-trips correctly', () => {
    const captions = parseSrt(SAMPLE_SRT);
    const output = generateSrt(captions);
    const reparsed = parseSrt(output);

    expect(reparsed).toHaveLength(captions.length);
    expect(reparsed[0].text).toBe(captions[0].text);
  });
});

describe('generateVtt', () => {
  test('generates valid VTT', () => {
    const captions = parseVtt(SAMPLE_VTT);
    const output = generateVtt(captions);

    expect(output).toContain('WEBVTT');
    expect(output).toContain('00:01.000 --> 00:04.000');
  });
});

describe('getCaptionsAtTime', () => {
  test('returns captions visible at time', () => {
    const captions = parseSrt(SAMPLE_SRT);

    const at2 = getCaptionsAtTime(captions, 2);
    expect(at2).toHaveLength(1);
    expect(at2[0].text).toBe('Hello, world!');

    const at6 = getCaptionsAtTime(captions, 6);
    expect(at6).toHaveLength(1);
    expect(at6[0].text).toBe('This is a test subtitle.');

    const at4_5 = getCaptionsAtTime(captions, 4.5);
    expect(at4_5).toHaveLength(0);
  });
});

describe('shiftCaptions', () => {
  test('shifts all timings', () => {
    const captions = parseSrt(SAMPLE_SRT);
    const shifted = shiftCaptions(captions, 5);

    expect(shifted[0].startTime).toBe(6);
    expect(shifted[0].endTime).toBe(9);
  });

  test('clamps to 0 for negative shifts', () => {
    const captions = parseSrt(SAMPLE_SRT);
    const shifted = shiftCaptions(captions, -10);

    expect(shifted[0].startTime).toBe(0);
    expect(shifted[0].endTime).toBe(0);
  });
});

describe('scaleCaptions', () => {
  test('scales timings', () => {
    const captions = parseSrt(SAMPLE_SRT);
    const scaled = scaleCaptions(captions, 2);

    expect(scaled[0].startTime).toBe(2);
    expect(scaled[0].endTime).toBe(8);
  });

  test('handles slow-down factor', () => {
    const captions = parseSrt(SAMPLE_SRT);
    const scaled = scaleCaptions(captions, 0.5);

    expect(scaled[0].startTime).toBe(0.5);
    expect(scaled[0].endTime).toBe(2);
  });
});

describe('mergeCaptions', () => {
  test('merges overlapping captions', () => {
    const captions = [
      { index: 1, startTime: 0, endTime: 2, text: 'First' },
      { index: 2, startTime: 2.3, endTime: 4, text: 'Second' },
      { index: 3, startTime: 10, endTime: 12, text: 'Third' },
    ];

    const merged = mergeCaptions(captions, 0.5);

    expect(merged).toHaveLength(2);
    expect(merged[0].text).toBe('First\nSecond');
    expect(merged[0].endTime).toBe(4);
    expect(merged[1].text).toBe('Third');
  });
});
