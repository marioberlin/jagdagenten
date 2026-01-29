/**
 * A2A Executors
 *
 * Agent executors that implement the business logic for A2A message handling.
 */

export {
  BaseA2UIExecutor,
  type AgentExecutionContext,
  type AgentExecutionResult,
  type ExecutorA2UIMessage,
  type ExecutorA2UIComponent,
  type ExecutorA2UIStyling,
  type ExecutorA2UIBeginRendering,
  type ExecutorA2UISurfaceUpdate,
  type ExecutorA2UISetModel,
  type ExecutorA2UIActionResponse,
} from './base.js';
export { LiquidCryptoExecutor, getLiquidCryptoAgentCard } from './liquidcrypto.js';

// Trading A2UI Components
export {
  TradingComponents,
  createTradingDashboard,
  type PriceData,
  type OrderBookData,
  type OrderBookEntry,
  type PortfolioData,
  type PortfolioHolding,
  type TradeData,
  type AlertData,
  type ChartDataPoint,
} from './trading-components.js';

// Orchestrator Executor
export { OrchestratorExecutor, getOrchestratorAgentCard } from './orchestrator.js';

// Builder Executor
export { BuilderExecutor, getBuilderAgentCard } from './builder.js';

// Router Executor (multi-executor routing)
export { RouterExecutor } from './router.js';

// Voice Executor (Gemini Live API)
export { VoiceExecutor, getVoiceAgentCard } from './voice.js';

// Alexa+ Executor
export { AlexaExecutor, getAlexaAgentCard } from './alexa.js';

// Video Render Executor
export { VideoRenderExecutor, getVideoRenderAgentCard } from './video-render.js';

// Video Render Pipeline
export {
  VideoRenderPipeline,
  getVideoRenderPipeline,
  createVideoRenderPipeline,
  type RenderOptions,
  type RenderResult,
  type A2AArtifact,
  type PipelineConfig,
} from './video-render-pipeline.js';

// Video Render Service
export {
  VideoRenderService,
  getVideoRenderService,
  createVideoRenderService,
  type VideoRenderServiceConfig,
  type CreateCompositionParams,
  type RenderJobParams,
} from './video-render-service.js';

// Composition Renderer
export {
  CompositionRenderer,
  getCompositionRenderer,
  compositionToDefinition,
  type CompositionDefinition,
  type CompositionElement,
  type TextElement,
  type ImageElement,
  type ShapeElement,
  type GradientElement,
  type ProgressElement,
  type ChartElement,
  type LottieElement,
  type TextEffect,
  type ImageEffect,
  type ShapeType,
  type ChartType,
} from './composition-renderer.js';
