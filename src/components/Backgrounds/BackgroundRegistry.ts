import { BackgroundConfig } from '../../types/ThemeTypes';
import { LiquidBackground } from './LiquidBackground';
import { AuroraBorealis } from './Elements/AuroraBorealis';
import { MeshGradient } from './Elements/MeshGradient';
import { NeonGrid } from './Elements/NeonGrid';
import { DeepOcean } from './Elements/DeepOcean';
import { GeometricShapes } from './Elements/GeometricShapes';
import { AbstractWaves } from './Elements/AbstractWaves';
import { DigitalRain } from './Elements/DigitalRain';
import { FloatingBubbles } from './Elements/FloatingBubbles';
import { HexagonPattern } from './Elements/HexagonPattern';
import { CyberCircuit } from './Elements/CyberCircuit';
import { SoftClouds } from './Elements/SoftClouds';
import { PaperTexture } from './Elements/PaperTexture';
import { CleanGrid } from './Elements/CleanGrid';

export const Backgrounds: BackgroundConfig[] = [
    // --- ELEMENTS (Dynamic CSS/SVG) ---
    { id: 'liquid-1', type: 'element', name: 'Liquid Blob (Default)', component: LiquidBackground, preferredTheme: 'dark' },
    { id: 'soft-clouds', type: 'element', name: 'Soft Clouds', component: SoftClouds, preferredTheme: 'light' },
    { id: 'paper-texture', type: 'element', name: 'Paper Grain', component: PaperTexture, preferredTheme: 'light' },
    { id: 'clean-grid', type: 'element', name: 'Architectural', component: CleanGrid, preferredTheme: 'light' },
    { id: 'aurora', type: 'element', name: 'Aurora Borealis', component: AuroraBorealis, preferredTheme: 'dark' },
    { id: 'mesh-gradient', type: 'element', name: 'Mesh Gradient', component: MeshGradient, preferredTheme: 'light' },
    { id: 'neon-grid', type: 'element', name: 'Neon Grid', component: NeonGrid, preferredTheme: 'dark' },
    { id: 'deep-ocean', type: 'element', name: 'Deep Ocean', component: DeepOcean, preferredTheme: 'dark' },
    { id: 'geo-shapes', type: 'element', name: 'Geometric Shapes', component: GeometricShapes, preferredTheme: 'light' },
    { id: 'abstract-waves', type: 'element', name: 'Abstract Waves', component: AbstractWaves, preferredTheme: 'dark' },
    { id: 'digital-rain', type: 'element', name: 'Digital Rain', component: DigitalRain, preferredTheme: 'dark' },
    { id: 'bubbles', type: 'element', name: 'Floating Bubbles', component: FloatingBubbles, preferredTheme: 'dark' },
    { id: 'hex-pattern', type: 'element', name: 'Hexagon Pattern', component: HexagonPattern, preferredTheme: 'dark' },
    { id: 'cyber-circuit', type: 'element', name: 'Cyber Circuit', component: CyberCircuit, preferredTheme: 'dark' },

    // --- IMAGES ---
    { id: 'img-abstract-1', type: 'image', name: 'Abstract Waves', src: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000&auto=format&fit=crop', preferredTheme: 'dark' },
    { id: 'img-glass-prism', type: 'image', name: 'Glass Prism', src: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=2000&auto=format&fit=crop', preferredTheme: 'light' },
    { id: 'img-ceramic', type: 'image', name: 'Ceramic Light', src: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=2000&auto=format&fit=crop', preferredTheme: 'light' },
    { id: 'img-white-sand', type: 'image', name: 'White Sand', src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000&auto=format&fit=crop', preferredTheme: 'light' }, // Updated
    { id: 'img-soft-pastel', type: 'image', name: 'Soft Pastel', src: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2000&auto=format&fit=crop', preferredTheme: 'light' }, // Updated
    { id: 'img-geometry', type: 'image', name: 'Geometry', src: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?q=80&w=2000&auto=format&fit=crop', preferredTheme: 'light' }, // Updated
    { id: 'img-dune', type: 'image', name: 'Desert Dune', src: 'https://images.unsplash.com/photo-1662010021854-e67c538ea7a9?q=80&w=2000&auto=format&fit=crop', preferredTheme: 'light' },
    { id: 'img-space', type: 'image', name: 'Deep Space', src: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2000&auto=format&fit=crop', preferredTheme: 'dark' },
    { id: 'img-cube', type: 'image', name: 'Glass Cube', src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop', preferredTheme: 'dark' },
    { id: 'img-dark-matter', type: 'image', name: 'Dark Matter', src: 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?q=80&w=2000&auto=format&fit=crop', preferredTheme: 'dark' }, // Fixed
    { id: 'img-gradient', type: 'image', name: 'Soft Gradient', src: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop', preferredTheme: 'light' },
    { id: 'img-crystals', type: 'image', name: 'Crystals', src: 'https://plus.unsplash.com/premium_photo-1691979207099-36fa5ad3f726?fm=jpg&q=80&w=2000&auto=format&fit=crop', preferredTheme: 'light' },
    { id: 'img-neon-city', type: 'image', name: 'Neon City', src: 'https://plus.unsplash.com/premium_photo-1700769221371-e6fbd55753ee?fm=jpg&q=80&w=2000&auto=format&fit=crop', preferredTheme: 'dark' },

    // --- CULINARY COLLECTION ---
    { id: 'img-food-minimal', type: 'image', name: 'Minimalist Dining', src: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=2000&auto=format&fit=crop', preferredTheme: 'light' },
    { id: 'img-food-dark', type: 'image', name: 'Moody Cuisine', src: 'https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?q=80&w=2000&auto=format&fit=crop', preferredTheme: 'dark' },
    { id: 'img-food-art', type: 'image', name: 'Culinary Art', src: 'https://images.unsplash.com/photo-1567306301408-9b74779a11af?q=80&w=2000&auto=format&fit=crop', preferredTheme: 'light' },

    // --- VIDEO BACKGROUNDS ---
    // Using authenticated YouTube IDs extracted from live search results
    { id: 'vid-liquid-abstract', type: 'video', name: 'Liquid Abstract', videoUrl: 'https://www.youtube.com/embed/wjQq0nSGS28?autoplay=1&mute=1&loop=1&playlist=wjQq0nSGS28&controls=0&showinfo=0&rel=0', thumbnail: 'https://img.youtube.com/vi/wjQq0nSGS28/mqdefault.jpg', preferredTheme: 'dark' },
    { id: 'vid-colorful-ink', type: 'video', name: 'Ink & Water', videoUrl: 'https://www.youtube.com/embed/4hiAs7bcsX8?autoplay=1&mute=1&loop=1&playlist=4hiAs7bcsX8&controls=0&showinfo=0&rel=0', thumbnail: 'https://img.youtube.com/vi/4hiAs7bcsX8/mqdefault.jpg', preferredTheme: 'dark' },
    { id: 'vid-glass-refraction', type: 'video', name: 'Glass Refraction', videoUrl: 'https://www.youtube.com/embed/Tot8_Ddx9Is?autoplay=1&mute=1&loop=1&playlist=Tot8_Ddx9Is&controls=0&showinfo=0&rel=0', thumbnail: 'https://img.youtube.com/vi/Tot8_Ddx9Is/mqdefault.jpg', preferredTheme: 'light' },
    { id: 'vid-liquid-flow', type: 'video', name: 'Liquid Flow', videoUrl: 'https://www.youtube.com/embed/hOgVAYpHPCc?autoplay=1&mute=1&loop=1&playlist=hOgVAYpHPCc&controls=0&showinfo=0&rel=0', thumbnail: 'https://img.youtube.com/vi/hOgVAYpHPCc/mqdefault.jpg', preferredTheme: 'dark' },
    { id: 'vid-gold-liquid', type: 'video', name: 'Gold Liquid', videoUrl: 'https://www.youtube.com/embed/htXe0ybca1U?autoplay=1&mute=1&loop=1&playlist=htXe0ybca1U&controls=0&showinfo=0&rel=0', thumbnail: 'https://img.youtube.com/vi/htXe0ybca1U/mqdefault.jpg', preferredTheme: 'dark' },
    { id: 'vid-ethereal-blue', type: 'video', name: 'Ethereal Blue', videoUrl: 'https://www.youtube.com/embed/-YnELWcnwNo?autoplay=1&mute=1&loop=1&playlist=-YnELWcnwNo&controls=0&showinfo=0&rel=0', thumbnail: 'https://img.youtube.com/vi/-YnELWcnwNo/mqdefault.jpg', preferredTheme: 'light' },
    { id: 'vid-geometry', type: 'video', name: 'Abstract Geometry', videoUrl: 'https://www.youtube.com/embed/Tkqu4j0Gpvk?autoplay=1&mute=1&loop=1&playlist=Tkqu4j0Gpvk&controls=0&showinfo=0&rel=0', thumbnail: 'https://img.youtube.com/vi/Tkqu4j0Gpvk/mqdefault.jpg', preferredTheme: 'dark' },
    { id: 'vid-nebula', type: 'video', name: 'Cosmic Nebula', videoUrl: 'https://www.youtube.com/embed/5CRfNSq1GRc?autoplay=1&mute=1&loop=1&playlist=5CRfNSq1GRc&controls=0&showinfo=0&rel=0', thumbnail: 'https://img.youtube.com/vi/5CRfNSq1GRc/mqdefault.jpg', preferredTheme: 'dark' }
];

export const addDynamicBackground = (bg: BackgroundConfig) => {
    // Check if exists
    if (!Backgrounds.find(b => b.id === bg.id)) {
        Backgrounds.push(bg);
    }
};
