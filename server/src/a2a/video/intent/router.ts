/**
 * Intent Router
 *
 * Natural language intent detection for A2A Video requests.
 * Routes user requests to appropriate A2A Video methods.
 */

export type VideoIntent =
  | 'render'
  | 'render-still'
  | 'extract-frames'
  | 'media-info'
  | 'composition-register'
  | 'composition-list'
  | 'asset-upload'
  | 'capabilities'
  | 'help'
  | 'unknown';

export interface IntentResult {
  intent: VideoIntent;
  confidence: number;
  method: string;
  params: Record<string, unknown>;
  explanation?: string;
}

// Intent patterns with confidence scores
const INTENT_PATTERNS: Array<{
  intent: VideoIntent;
  patterns: RegExp[];
  method: string;
  extractParams?: (text: string) => Record<string, unknown>;
}> = [
  {
    intent: 'render',
    patterns: [
      /render\s+(a\s+)?video/i,
      /create\s+(a\s+)?video/i,
      /generate\s+(a\s+)?video/i,
      /make\s+(a\s+)?video/i,
      /export\s+(to\s+)?(mp4|webm|mov)/i,
      /encode\s+(to\s+)?video/i,
      /convert\s+to\s+video/i,
      /render\s+composition/i,
    ],
    method: 'render',
    extractParams: (text) => {
      const params: Record<string, unknown> = {};

      // Extract composition ID
      const compMatch = text.match(/composition\s+["']?([a-z0-9-_]+)["']?/i);
      if (compMatch) params.compositionId = compMatch[1];

      // Extract format
      const formatMatch = text.match(/(mp4|webm|mov|gif)/i);
      if (formatMatch) params.outputFormat = formatMatch[1].toLowerCase();

      // Extract resolution
      const resMatch = text.match(/(\d{3,4})p/i);
      if (resMatch) {
        const height = parseInt(resMatch[1]);
        params.resolution = { height, width: Math.round(height * 16 / 9) };
      }

      // Extract codec
      const codecMatch = text.match(/(h264|h265|vp8|vp9|prores)/i);
      if (codecMatch) params.codec = codecMatch[1].toLowerCase();

      // Extract fps
      const fpsMatch = text.match(/(\d+)\s*fps/i);
      if (fpsMatch) params.fps = parseInt(fpsMatch[1]);

      return params;
    },
  },
  {
    intent: 'render-still',
    patterns: [
      /render\s+(a\s+)?(still|image|frame|thumbnail|screenshot)/i,
      /capture\s+(a\s+)?frame/i,
      /export\s+(a\s+)?frame/i,
      /get\s+(a\s+)?(still|thumbnail|screenshot)/i,
      /create\s+(a\s+)?thumbnail/i,
    ],
    method: 'render.still',
    extractParams: (text) => {
      const params: Record<string, unknown> = {};

      // Extract frame number
      const frameMatch = text.match(/frame\s+(\d+)/i);
      if (frameMatch) params.frame = parseInt(frameMatch[1]);

      // Extract format
      const formatMatch = text.match(/(png|jpeg|jpg)/i);
      if (formatMatch) params.imageFormat = formatMatch[1].replace('jpg', 'jpeg');

      return params;
    },
  },
  {
    intent: 'extract-frames',
    patterns: [
      /extract\s+frames/i,
      /get\s+frames\s+from/i,
      /split\s+(video\s+)?into\s+frames/i,
      /convert\s+to\s+frames/i,
      /frame\s+extraction/i,
    ],
    method: 'render.extractFrames',
    extractParams: (text) => {
      const params: Record<string, unknown> = {};

      // Extract fps
      const fpsMatch = text.match(/(\d+)\s*fps/i);
      if (fpsMatch) params.fps = parseInt(fpsMatch[1]);

      // Extract frame range
      const rangeMatch = text.match(/frames?\s+(\d+)\s*[-to]+\s*(\d+)/i);
      if (rangeMatch) {
        params.startFrame = parseInt(rangeMatch[1]);
        params.endFrame = parseInt(rangeMatch[2]);
      }

      return params;
    },
  },
  {
    intent: 'media-info',
    patterns: [
      /get\s+(media|video|audio)\s+info/i,
      /(duration|resolution|format|codec)\s+of/i,
      /media\s+metadata/i,
      /what\s+is\s+the\s+(duration|resolution|format)/i,
      /how\s+long\s+is/i,
      /video\s+(info|details|metadata)/i,
      /analyze\s+(video|audio|media)/i,
    ],
    method: 'media.info',
    extractParams: () => ({}),
  },
  {
    intent: 'composition-register',
    patterns: [
      /register\s+(a\s+)?composition/i,
      /add\s+(a\s+)?composition/i,
      /create\s+(a\s+)?composition/i,
      /new\s+composition/i,
      /define\s+(a\s+)?composition/i,
    ],
    method: 'composition.register',
    extractParams: (text) => {
      const params: Record<string, unknown> = {};

      // Extract composition name
      const nameMatch = text.match(/(?:named?|called?)\s+["']?([a-z0-9-_ ]+)["']?/i);
      if (nameMatch) params.name = nameMatch[1].trim();

      // Extract dimensions
      const dimMatch = text.match(/(\d+)\s*x\s*(\d+)/);
      if (dimMatch) {
        params.width = parseInt(dimMatch[1]);
        params.height = parseInt(dimMatch[2]);
      }

      // Extract fps
      const fpsMatch = text.match(/(\d+)\s*fps/i);
      if (fpsMatch) params.fps = parseInt(fpsMatch[1]);

      // Extract duration
      const durMatch = text.match(/(\d+)\s*seconds?/i);
      if (durMatch) {
        const fps = (params.fps as number) || 30;
        params.durationInFrames = parseInt(durMatch[1]) * fps;
      }

      return params;
    },
  },
  {
    intent: 'composition-list',
    patterns: [
      /list\s+(all\s+)?compositions/i,
      /show\s+(all\s+)?compositions/i,
      /available\s+compositions/i,
      /what\s+compositions/i,
    ],
    method: 'composition.list',
    extractParams: () => ({}),
  },
  {
    intent: 'asset-upload',
    patterns: [
      /upload\s+(an?\s+)?(asset|file|image|video|audio|font)/i,
      /add\s+(an?\s+)?(asset|file)/i,
      /import\s+(an?\s+)?(asset|file|media)/i,
    ],
    method: 'asset.upload',
    extractParams: (text) => {
      const params: Record<string, unknown> = {};

      // Extract asset type
      const typeMatch = text.match(/(image|video|audio|font|lottie)/i);
      if (typeMatch) params.type = typeMatch[1].toLowerCase();

      return params;
    },
  },
  {
    intent: 'capabilities',
    patterns: [
      /what\s+can\s+you\s+do/i,
      /capabilities/i,
      /supported\s+(codecs|formats|features)/i,
      /what\s+(formats|codecs)\s+(are\s+)?supported/i,
    ],
    method: 'getCapabilities',
    extractParams: () => ({}),
  },
  {
    intent: 'help',
    patterns: [
      /help/i,
      /how\s+(do\s+I|to)/i,
      /what\s+is/i,
      /explain/i,
      /show\s+me\s+how/i,
    ],
    method: 'help',
    extractParams: () => ({}),
  },
];

/**
 * Detect intent from natural language text.
 */
export function detectIntent(text: string): IntentResult {
  const normalizedText = text.toLowerCase().trim();

  for (const { intent, patterns, method, extractParams } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedText)) {
        return {
          intent,
          confidence: 0.9,
          method,
          params: extractParams ? extractParams(text) : {},
        };
      }
    }
  }

  return {
    intent: 'unknown',
    confidence: 0,
    method: 'help',
    params: {},
    explanation: 'Could not understand the request. Try asking for help.',
  };
}

/**
 * Get the JSON-RPC method name for an intent.
 */
export function routeByIntent(intent: VideoIntent): string {
  const methodMap: Record<VideoIntent, string> = {
    'render': 'render',
    'render-still': 'render.still',
    'extract-frames': 'render.extractFrames',
    'media-info': 'media.info',
    'composition-register': 'composition.register',
    'composition-list': 'composition.list',
    'asset-upload': 'asset.upload',
    'capabilities': 'getCapabilities',
    'help': 'help',
    'unknown': 'help',
  };
  return methodMap[intent];
}

/**
 * Get suggested examples for an intent.
 */
export function getExamples(intent: VideoIntent): string[] {
  const examples: Record<VideoIntent, string[]> = {
    'render': [
      'Render my-composition to MP4 at 1080p',
      'Create a video with h264 codec',
      'Generate a 30fps video from intro-animation',
    ],
    'render-still': [
      'Capture frame 30 as PNG',
      'Create a thumbnail at frame 0',
      'Export frame 60 as JPEG',
    ],
    'extract-frames': [
      'Extract frames at 1 fps',
      'Get frames 0-60 from the video',
      'Split video into frames',
    ],
    'media-info': [
      'What is the duration of this video?',
      'Get the resolution and codec',
      'Show video metadata',
    ],
    'composition-register': [
      'Register a composition named intro with 1920x1080 at 30fps',
      'Create a new composition 10 seconds long',
      'Add composition called outro',
    ],
    'composition-list': [
      'List all compositions',
      'Show available compositions',
      'What compositions are registered?',
    ],
    'asset-upload': [
      'Upload an image asset',
      'Add a font file',
      'Import a video file',
    ],
    'capabilities': [
      'What codecs are supported?',
      'What can you do?',
      'Show capabilities',
    ],
    'help': [
      'How do I render a video?',
      'What is a composition?',
      'Help me get started',
    ],
    'unknown': [],
  };
  return examples[intent] || [];
}

/**
 * Parse a natural language request and return a structured A2A Video request.
 */
export function parseNaturalLanguage(text: string): {
  method: string;
  params: Record<string, unknown>;
  confidence: number;
  suggestions?: string[];
} {
  const result = detectIntent(text);

  if (result.confidence < 0.5) {
    return {
      method: 'help',
      params: { query: text },
      confidence: result.confidence,
      suggestions: [
        'Try: "Render composition my-video to MP4"',
        'Try: "Get info about this video"',
        'Try: "List all compositions"',
      ],
    };
  }

  return {
    method: result.method,
    params: result.params,
    confidence: result.confidence,
  };
}
