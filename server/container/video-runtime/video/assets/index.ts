/**
 * Assets Module
 *
 * Asset management for video rendering.
 */

export {
  AssetManager,
  createAssetManager,
  type AssetManagerConfig,
  type AssetMetadata,
} from './manager.js';

export {
  FontManager,
  createFontManager,
  type FontConfig,
  type LoadedFont,
  type FontManagerConfig,
} from './fonts.js';
