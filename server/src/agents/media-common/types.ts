/**
 * Media Generation - Shared Types
 * 
 * Types shared between ImageGen and VideoGen agents.
 */

export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'night' | 'foggy';

export interface DestinationProfile {
    slug: string;
    name: string;
    landmarks: string[];
    aesthetic: string;
    defaultCamera: string;
    coordinates: { lat: number; lng: number };
}

export interface MediaGenerationRequest {
    destination: string;
    condition: WeatherCondition;
    taskId?: string;
    sessionId?: string;
}

export interface ImageArtifactMetadata {
    destination: string;
    condition: WeatherCondition;
    prompt: string;
    filePath: string;
    publicUrl: string;
    generatedAt: string;
    model: string;
}

export interface VideoArtifactMetadata {
    destination: string;
    condition: WeatherCondition;
    imageArtifactId: string;
    motionPrompt: string;
    filePath: string;
    publicUrl: string;
    status: 'pending' | 'generating' | 'complete' | 'failed';
    operationId?: string;
    errorMessage?: string;
    generatedAt?: string;
    model: string;
    durationSeconds: number;
    resolution: string;
}

export interface GenerationResult {
    success: boolean;
    artifactId: string;
    publicUrl?: string;
    error?: string;
}

/**
 * Slugify a destination name for use as cache key
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

/**
 * Generate cache key from destination + condition
 */
export function getCacheKey(destination: string, condition: WeatherCondition): string {
    return `${slugify(destination)}-${condition}`;
}
