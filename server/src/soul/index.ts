/**
 * Soul Module
 * 
 * Soul.me system for app and agent personality definitions.
 */

export {
    SoulGeneratorService,
    createSoulGenerator,
    type SoulDefinition,
    type SoulGeneratorConfig,
} from './soul-generator';

export {
    SoulLoaderService,
    createSoulLoader,
    type ParsedSoul,
    type SoulLoaderConfig,
} from './soul-loader';

// Quick access singleton instances
import { createSoulGenerator } from './soul-generator';
import { createSoulLoader } from './soul-loader';

let _generator: ReturnType<typeof createSoulGenerator> | null = null;
let _loader: ReturnType<typeof createSoulLoader> | null = null;

export function getSoulGenerator() {
    if (!_generator) {
        _generator = createSoulGenerator();
    }
    return _generator;
}

export function getSoulLoader() {
    if (!_loader) {
        _loader = createSoulLoader();
    }
    return _loader;
}
