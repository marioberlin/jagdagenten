/**
 * Media Generation - Prompt Engineering
 * 
 * Generates optimized prompts for Gemini image and Veo video generation.
 */

import type { WeatherCondition } from './types.js';
import { getDestination } from './destinations.js';

/**
 * Weather-specific visual modifiers for image prompts
 */
const WEATHER_IMAGE_MODIFIERS: Record<WeatherCondition, string> = {
    sunny: 'bright golden sunlight, clear blue sky with fluffy clouds, warm tones, lens flare, beautiful day',
    cloudy: 'dramatic overcast sky, silver cloud linings, soft diffused light, contemplative mood, moody atmosphere',
    rainy: 'rainfall, wet reflections on surfaces, moody purple-blue tones, umbrellas, glistening streets, atmospheric',
    night: 'nighttime cityscape, vibrant city lights, neon glow, stars visible, blue hour transitioning to night',
    snowy: 'gentle snowfall, white blanket of snow, cozy warm lights from windows, winter wonderland, magical atmosphere',
    foggy: 'morning mist, ethereal atmosphere, soft diffused light, buildings emerging from fog, mysterious mood'
};

/**
 * Weather-specific motion descriptions for video prompts
 */
const WEATHER_MOTION_MODIFIERS: Record<WeatherCondition, string> = {
    sunny: 'Gentle camera drift, birds occasionally flying across the sky, clouds moving slowly, warm lens flare shifts, leaves rustling in breeze',
    cloudy: 'Timelapse-style cloud movement, subtle light shifts as clouds pass, contemplative atmosphere, occasional rays breaking through',
    rainy: 'Continuous rainfall with varying intensity, rain streaks across frame, reflections shimmering on wet surfaces, distant thunder, water droplets on lens',
    night: 'Slow dolly forward, car headlights creating light trails, building lights twinkling randomly, subtle city movement, electronic ambient hum',
    snowy: 'Snowflakes drifting slowly downward, peaceful stillness, warm glow pulsing softly from windows, occasional wind gusts swirling snow',
    foggy: 'Fog slowly rolling and swirling, buildings appearing and disappearing, very slow camera push-in, dreamlike ethereal quality'
};

/**
 * Ambient sound descriptions for Veo audio generation
 */
const WEATHER_AUDIO_DESCRIPTIONS: Record<WeatherCondition, string> = {
    sunny: 'Warm ambient city sounds, distant traffic hum, birds chirping, gentle breeze, peaceful daytime atmosphere',
    cloudy: 'Soft wind, muted city ambiance, contemplative silence, occasional distant sounds',
    rainy: 'Rain falling steadily, distant thunder rumbles, water splashing, muffled city sounds through rain',
    night: 'Subtle electronic hum of city lights, distant traffic, occasional car passing, urban night ambiance',
    snowy: 'Soft wind, muffled silence of snow, distant sleigh bells, peaceful winter quiet',
    foggy: 'Muffled city sounds, soft mysterious wind, ethereal silence, distant foghorn or bell'
};

/**
 * Generate image prompt for Gemini
 */
export function generateImagePrompt(destination: string, condition: WeatherCondition): string {
    const dest = getDestination(destination);
    const primaryLandmark = dest.landmarks[0];
    const weatherMod = WEATHER_IMAGE_MODIFIERS[condition];

    return `
Cinematic ${dest.defaultCamera} of ${primaryLandmark} in ${dest.name}.
${weatherMod}.
${dest.aesthetic}.
Professional cinematography, 16:9 aspect ratio, 8K quality, hyperrealistic.
No text, no watermarks, no people in foreground, focus on architecture and atmosphere.
Suitable as a video background, clean composition with space for UI overlay.
    `.trim().replace(/\n+/g, ' ');
}

/**
 * Generate motion prompt for Veo video
 */
export function generateMotionPrompt(destination: string, condition: WeatherCondition): string {
    const dest = getDestination(destination);
    const motionMod = WEATHER_MOTION_MODIFIERS[condition];
    const audioMod = WEATHER_AUDIO_DESCRIPTIONS[condition];

    return `
${motionMod}.
Smooth, seamless motion suitable for looping as a background video.
8 seconds of continuous, calming movement.
Cinematic quality matching the ${dest.aesthetic} aesthetic.
Ambient sounds: ${audioMod}
    `.trim().replace(/\n+/g, ' ');
}

/**
 * Generate negative prompt to avoid common issues
 */
export function generateNegativePrompt(): string {
    return 'text, watermarks, logos, people walking in foreground, blurry, low quality, distorted, glitches, artifacts, sudden camera movements, jarring transitions';
}

/**
 * Get all weather conditions
 */
export function getAllConditions(): WeatherCondition[] {
    return ['sunny', 'cloudy', 'rainy', 'snowy', 'night', 'foggy'];
}
