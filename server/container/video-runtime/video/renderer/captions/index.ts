/**
 * Caption Module
 *
 * SRT/VTT parsing and video caption rendering.
 */

export {
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
  type Caption,
  type CaptionStyle,
  type CaptionTrack,
} from './parser.js';

export {
  renderCaption,
  renderCaptionsAtTime,
  generateDrawtextFilter,
  generateSubtitlesFilter,
  generateAss,
  createCaptionRenderer,
  type CaptionRenderOptions,
} from './renderer.js';
