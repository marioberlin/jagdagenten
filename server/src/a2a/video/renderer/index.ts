/**
 * A2A Video Renderer Module
 *
 * Exports all rendering capabilities:
 * - Lottie animation rendering
 * - Tailwind CSS compilation
 * - Caption/subtitle rendering
 * - SVG chart generation
 * - Three.js 3D rendering
 */

// Lottie animations
export {
  LottieRenderer,
  createLottieRenderer,
  loadLottieFromFile,
  loadLottieFromUrl,
  getLottieInfo,
  type LottieRenderOptions,
  type LottieAnimationInfo,
} from './components/lottie.js';

// Tailwind CSS
export {
  compileTailwindCSS,
  renderTailwindToImage,
  type TailwindCompileOptions,
  type TailwindConfig,
  type CompiledCSS,
} from './styles/tailwind.js';

// Captions and subtitles
export {
  parseSrt,
  parseVtt,
  parseCaptions,
  generateSrt,
  generateVtt,
  getCaptionsAtTime,
  shiftCaptions,
  scaleCaptions,
  mergeCaptions,
  renderCaption,
  renderCaptionsAtTime,
  generateDrawtextFilter,
  generateSubtitlesFilter,
  generateAss,
  createCaptionRenderer,
  type Caption,
  type CaptionStyle,
  type CaptionTrack,
  type CaptionRenderOptions,
} from './captions/index.js';

// SVG Charts
export {
  generateLineChart,
  generateBarChart,
  generatePieChart,
  generateAreaChart,
  generateScatterChart,
  generateChart,
  renderChartToPng,
  renderChartAtProgress,
  generateChartFrames,
  createChartRenderer,
  CHART_PRESETS,
  type ChartType,
  type ChartSeries,
  type ChartDataPoint,
  type ChartOptions,
  type AnimatedChartOptions,
} from './charts/index.js';

// Three.js 3D
export {
  renderThreeFrame,
  generateThreeFrames,
  createThreeRenderer,
  THREE_PRESETS,
  type ThreeSceneConfig,
  type ThreeObject,
  type ThreeRenderOptions,
} from './three/index.js';
