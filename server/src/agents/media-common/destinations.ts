/**
 * Media Generation - Destination Profiles
 * 
 * Iconic landmarks and visual aesthetics for each destination.
 */

import type { DestinationProfile } from './types.js';

export const DESTINATIONS: Record<string, DestinationProfile> = {
    tokyo: {
        slug: 'tokyo',
        name: 'Tokyo',
        landmarks: ['Tokyo Tower', 'Shibuya Crossing', 'Senso-ji Temple', 'Rainbow Bridge', 'Shinjuku Skyline'],
        aesthetic: 'cyberpunk neon, futuristic, blade runner vibes, vibrant pink and cyan',
        defaultCamera: 'wide establishing shot',
        coordinates: { lat: 35.6762, lng: 139.6503 }
    },
    paris: {
        slug: 'paris',
        name: 'Paris',
        landmarks: ['Eiffel Tower', 'Champs-Élysées', 'Sacré-Cœur', 'Notre-Dame', 'Arc de Triomphe'],
        aesthetic: 'romantic, warm golden tones, classic European elegance, soft lighting',
        defaultCamera: 'cinematic wide shot',
        coordinates: { lat: 48.8566, lng: 2.3522 }
    },
    london: {
        slug: 'london',
        name: 'London',
        landmarks: ['Big Ben', 'Tower Bridge', 'London Eye', 'Buckingham Palace', 'The Shard'],
        aesthetic: 'moody, sophisticated, classic British, dramatic skies',
        defaultCamera: 'establishing shot with depth',
        coordinates: { lat: 51.5074, lng: -0.1278 }
    },
    'new-york': {
        slug: 'new-york',
        name: 'New York',
        landmarks: ['Empire State Building', 'Times Square', 'Brooklyn Bridge', 'Central Park', 'Statue of Liberty'],
        aesthetic: 'urban energy, dramatic lighting, cinematic, gritty and glamorous',
        defaultCamera: 'sweeping aerial or street level',
        coordinates: { lat: 40.7128, lng: -74.0060 }
    },
    dubai: {
        slug: 'dubai',
        name: 'Dubai',
        landmarks: ['Burj Khalifa', 'Palm Jumeirah', 'Dubai Marina', 'Burj Al Arab', 'Dubai Frame'],
        aesthetic: 'futuristic luxury, golden desert tones, ultra-modern architecture',
        defaultCamera: 'dramatic low angle or aerial',
        coordinates: { lat: 25.2048, lng: 55.2708 }
    },
    sydney: {
        slug: 'sydney',
        name: 'Sydney',
        landmarks: ['Sydney Opera House', 'Harbour Bridge', 'Bondi Beach', 'Darling Harbour', 'Circular Quay'],
        aesthetic: 'coastal vibrancy, blue waters, sunny Australian optimism',
        defaultCamera: 'wide harbour shot',
        coordinates: { lat: -33.8688, lng: 151.2093 }
    },
    rome: {
        slug: 'rome',
        name: 'Rome',
        landmarks: ['Colosseum', 'Trevi Fountain', 'Vatican', 'Pantheon', 'Spanish Steps'],
        aesthetic: 'ancient grandeur, warm terracotta tones, timeless beauty',
        defaultCamera: 'classical composition',
        coordinates: { lat: 41.9028, lng: 12.4964 }
    },
    barcelona: {
        slug: 'barcelona',
        name: 'Barcelona',
        landmarks: ['Sagrada Familia', 'Park Güell', 'Casa Batlló', 'La Rambla', 'Gothic Quarter'],
        aesthetic: 'Gaudí-inspired whimsy, Mediterranean warmth, artistic energy',
        defaultCamera: 'artistic wide angle',
        coordinates: { lat: 41.3851, lng: 2.1734 }
    },
    amsterdam: {
        slug: 'amsterdam',
        name: 'Amsterdam',
        landmarks: ['Canal Houses', 'Rijksmuseum', 'Anne Frank House', 'Dam Square', 'Vondelpark'],
        aesthetic: 'cozy Dutch charm, canal reflections, bicycles and bridges',
        defaultCamera: 'canal-level perspective',
        coordinates: { lat: 52.3676, lng: 4.9041 }
    },
    singapore: {
        slug: 'singapore',
        name: 'Singapore',
        landmarks: ['Marina Bay Sands', 'Gardens by the Bay', 'Merlion', 'Supertree Grove', 'Clarke Quay'],
        aesthetic: 'futuristic garden city, lush greenery meets sleek architecture',
        defaultCamera: 'dramatic skyline shot',
        coordinates: { lat: 1.3521, lng: 103.8198 }
    },
    'hong-kong': {
        slug: 'hong-kong',
        name: 'Hong Kong',
        landmarks: ['Victoria Peak', 'Victoria Harbour', 'Star Ferry', 'Tian Tan Buddha', 'Central Skyline'],
        aesthetic: 'dense urban verticality, neon signs, harbor reflections',
        defaultCamera: 'dramatic skyline from water',
        coordinates: { lat: 22.3193, lng: 114.1694 }
    },
    'los-angeles': {
        slug: 'los-angeles',
        name: 'Los Angeles',
        landmarks: ['Hollywood Sign', 'Santa Monica Pier', 'Griffith Observatory', 'Venice Beach', 'Downtown Skyline'],
        aesthetic: 'California dreaming, golden hour, palm trees and sunsets',
        defaultCamera: 'cinematic wide shot',
        coordinates: { lat: 34.0522, lng: -118.2437 }
    },
    berlin: {
        slug: 'berlin',
        name: 'Berlin',
        landmarks: ['Brandenburg Gate', 'Berlin TV Tower', 'East Side Gallery', 'Reichstag', 'Potsdamer Platz'],
        aesthetic: 'industrial chic, artistic graffiti, historic meets modern, grey tones with vibrant accents',
        defaultCamera: 'wide urban establishing shot',
        coordinates: { lat: 52.5200, lng: 13.4050 }
    },
    toronto: {
        slug: 'toronto',
        name: 'Toronto',
        landmarks: ['CN Tower', 'Rogers Centre', 'Toronto Islands', 'Distillery District', 'Nathan Phillips Square'],
        aesthetic: 'clean modern skyline, multicultural vibrancy, lakefront serenity',
        defaultCamera: 'sweeping lakefront view',
        coordinates: { lat: 43.6532, lng: -79.3832 }
    },
    milan: {
        slug: 'milan',
        name: 'Milan',
        landmarks: ['Duomo di Milano', 'Galleria Vittorio Emanuele II', 'Sforza Castle', 'Navigli District', 'Porta Nuova'],
        aesthetic: 'high fashion elegance, Gothic grandeur, sophisticated Italian style',
        defaultCamera: 'elegant architectural composition',
        coordinates: { lat: 45.4642, lng: 9.1900 }
    }
};

/**
 * Get destination profile, with fallback to Tokyo
 */
export function getDestination(name: string): DestinationProfile {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    return DESTINATIONS[slug] || DESTINATIONS['tokyo'];
}

/**
 * Get all available destination slugs
 */
export function getAllDestinationSlugs(): string[] {
    return Object.keys(DESTINATIONS);
}
