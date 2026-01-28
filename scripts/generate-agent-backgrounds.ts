/**
 * Agent Background Generator
 *
 * This script generates unique background images for each agent using Gemini 3 Pro Image.
 * It uses the agent's metadata (name, description, category, color) to create
 * contextually appropriate backgrounds.
 *
 * Usage:
 *   bun run scripts/generate-agent-backgrounds.ts [agent-id]
 *   bun run scripts/generate-agent-backgrounds.ts --list    # List all agents
 *   bun run scripts/generate-agent-backgrounds.ts --missing # Generate only missing
 *
 * If no agent-id is provided, generates backgrounds for all agents.
 *
 * Required: GEMINI_API_KEY environment variable
 */

import { writeFile, mkdir, access } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

// Manual .env loading for scripts
function loadEnv() {
    try {
        const envPath = path.join(process.cwd(), '.env');
        const envContent = readFileSync(envPath, 'utf-8');
        for (const line of envContent.split('\n')) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                const value = valueParts.join('=').replace(/^["']|["']$/g, '');
                if (key && !process.env[key]) {
                    process.env[key] = value;
                }
            }
        }
    } catch {
        // .env file doesn't exist, that's fine
    }
}
loadEnv();

// Agent metadata for background generation
const AGENT_BACKGROUNDS: Record<string, {
    prompt: string;
    style: 'photorealistic' | 'digital-art' | 'anime' | 'watercolor' | '3d-render' | 'sketch';
    color: string;
}> = {
    'restaurant-finder': {
        prompt: 'Cozy restaurant interior with warm ambient lighting, exposed brick walls, hanging edison bulbs, wooden tables, plants, intimate dining atmosphere',
        style: 'photorealistic',
        color: '#F97316',
    },
    'crypto-advisor': {
        prompt: 'Abstract digital blockchain network visualization, glowing nodes connected by golden light trails, dark background with cryptocurrency symbols, futuristic finance aesthetic',
        style: 'digital-art',
        color: '#F7931A',
    },
    'market-data': {
        prompt: 'Stock market trading floor visualization, multiple glowing screens with charts, green and red data streams, professional financial technology aesthetic',
        style: 'digital-art',
        color: '#10B981',
    },
    'trade-executor': {
        prompt: 'High-tech trading terminal interface, holographic buy/sell buttons, order book visualization, blue accent lighting, professional trading desk',
        style: '3d-render',
        color: '#3B82F6',
    },
    'strategy': {
        prompt: 'Abstract chess board with glowing pieces, strategic planning visualization, purple and violet tones, analytical and thoughtful atmosphere',
        style: 'digital-art',
        color: '#8B5CF6',
    },
    'risk': {
        prompt: 'Shield and warning symbols with protective aura, risk meters and gauges, red alert accents on dark background, security monitoring dashboard',
        style: 'digital-art',
        color: '#EF4444',
    },
    'orchestrator': {
        prompt: 'Network of interconnected nodes and agents, golden connection lines, central hub coordinating multiple systems, harmonious digital orchestra',
        style: '3d-render',
        color: '#F59E0B',
    },
    'notification': {
        prompt: 'Abstract notification bells and message bubbles floating in space, pink and purple gradient, gentle pulse effects, communication aesthetic',
        style: 'digital-art',
        color: '#EC4899',
    },
    'symbol-manager': {
        prompt: 'Grid of financial symbols and trading pairs, organized catalog aesthetic, indigo accent lighting, professional market data display',
        style: 'digital-art',
        color: '#6366F1',
    },
    'webhook-gateway': {
        prompt: 'Abstract network connections and API endpoints, glowing webhook arrows connecting systems, purple tech infrastructure visualization',
        style: '3d-render',
        color: '#8B5CF6',
    },
    'maintenance': {
        prompt: 'Clean server room with organized cables, green health status lights, maintenance tools and gears, professional IT operations',
        style: 'photorealistic',
        color: '#10B981',
    },
    'rizzcharts': {
        prompt: 'Colorful data visualization explosion, flowing line charts, bar graphs, pie charts, vibrant gradients, creative analytics dashboard',
        style: 'digital-art',
        color: '#6366F1',
    },
    'documind': {
        prompt: 'Ethereal library with floating books and documents, purple magical glow, knowledge and wisdom aesthetic, scholarly atmosphere',
        style: 'watercolor',
        color: '#8B5CF6',
    },
    'nanobanana': {
        prompt: 'Artistic studio with colorful paint splashes, creative tools, golden yellow accents, playful and creative atmosphere, digital art creation',
        style: 'watercolor',
        color: '#FBBF24',
    },
    'travel-planner': {
        prompt: 'World map with glowing destination markers, airplane trails, tropical beaches and city skylines, wanderlust travel aesthetic',
        style: 'digital-art',
        color: '#0EA5E9',
    },
    'dashboard-builder': {
        prompt: 'Modular dashboard widgets floating in space, drag-and-drop interface, blue accent glow, professional analytics builder',
        style: '3d-render',
        color: '#3B82F6',
    },
    'ai-researcher': {
        prompt: 'Neural network brain visualization, research papers floating, green knowledge nodes, scientific discovery aesthetic',
        style: 'digital-art',
        color: '#10B981',
    },
    'research-canvas': {
        prompt: 'Mind map with connected ideas, purple nodes and connections, creative brainstorming space, collaborative research aesthetic',
        style: 'digital-art',
        color: '#8B5CF6',
    },
    'qa-agent': {
        prompt: 'Code testing laboratory, green checkmarks and test results, quality assurance badges, professional software testing environment',
        style: '3d-render',
        color: '#06B6D4',
    },
    'state-machine': {
        prompt: 'Flowchart with glowing state nodes and transitions, amber and gold colors, systematic workflow visualization',
        style: 'digital-art',
        color: '#F59E0B',
    },
    'copilot-form': {
        prompt: 'Interactive form fields floating in space, red accent UI elements, smart form builder aesthetic, assistive AI helper',
        style: '3d-render',
        color: '#EF4444',
    },
    'remote-password': {
        prompt: 'Secure vault door with locks and keys, red security glow, password protection aesthetic, encrypted data visualization',
        style: '3d-render',
        color: '#DC2626',
    },
    'remote-oneflow': {
        prompt: 'Workflow automation pipeline, green flowing connections, process orchestration, smooth workflow aesthetic',
        style: 'digital-art',
        color: '#10B981',
    },
    'remote-wr-demo': {
        prompt: 'Retro 80s neon aesthetic, synthwave sunset, palm trees silhouette, purple and cyan gradients, vaporwave vibes',
        style: 'digital-art',
        color: '#8B5CF6',
    },
};

// ============================================================================
// Gemini API Configuration
// ============================================================================

const MODEL_NAME = 'gemini-2.5-flash-image';
const OUTPUT_DIR = 'public/images/backgrounds';

// Style enhancement presets for better image generation
const STYLE_ENHANCEMENTS: Record<string, string> = {
    'photorealistic': 'photorealistic, highly detailed, professional photography, 8k resolution, sharp focus, natural lighting',
    'digital-art': 'digital art, vibrant colors, detailed illustration, artstation trending, cinematic lighting',
    'anime': 'anime style, cel shaded, Studio Ghibli inspired, vibrant, detailed, high quality',
    'watercolor': 'watercolor painting, soft edges, artistic, flowing colors, paper texture, ethereal',
    '3d-render': '3D render, octane render, realistic lighting, cinematic, highly detailed, volumetric',
    'sketch': 'pencil sketch, hand drawn, artistic, detailed linework, professional illustration',
};

function getGeminiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY environment variable not set');
        console.error('   Set it with: export GEMINI_API_KEY=your_key');
        return null;
    }
    return new GoogleGenAI({ apiKey });
}

async function generateWithGemini(prompt: string, style: string): Promise<Buffer | null> {
    const client = getGeminiClient();
    if (!client) return null;

    // Enhance prompt with style modifiers
    const styleEnhancement = STYLE_ENHANCEMENTS[style] || STYLE_ENHANCEMENTS['digital-art'];
    const enhancedPrompt = `${prompt}, ${styleEnhancement}, 16:9 aspect ratio, suitable as a desktop background, dark theme friendly`;

    console.log(`  📝 Prompt: ${enhancedPrompt.substring(0, 80)}...`);

    try {
        const response = await client.models.generateContent({
            model: MODEL_NAME,
            contents: enhancedPrompt,
            config: {
                responseModalities: ['Image', 'Text'],
            }
        });

        // Extract image data from response
        const candidates = response.candidates;
        if (!candidates || candidates.length === 0) {
            console.error('  ❌ No candidates in response');
            return null;
        }

        const parts = candidates[0].content?.parts;
        if (!parts || parts.length === 0) {
            console.error('  ❌ No parts in response');
            return null;
        }

        for (const part of parts) {
            // @ts-ignore - inlineData structure
            if (part.inlineData && part.inlineData.data) {
                const base64Data = part.inlineData.data as string;
                console.log(`  ✅ Received image data (${Math.round(base64Data.length / 1024)}KB base64)`);
                return Buffer.from(base64Data, 'base64');
            }
        }

        console.error('  ❌ No inline image data found in response');
        return null;
    } catch (error) {
        console.error('  ❌ Error generating image:', error instanceof Error ? error.message : error);
        return null;
    }
}

async function checkFileExists(filePath: string): Promise<boolean> {
    try {
        await access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function generateAgentBackground(agentId: string, force = false): Promise<boolean> {
    const config = AGENT_BACKGROUNDS[agentId];
    if (!config) {
        console.error(`❌ No configuration found for agent: ${agentId}`);
        return false;
    }

    const outputDir = path.join(process.cwd(), OUTPUT_DIR);
    const outputPath = path.join(outputDir, `${agentId}.png`);

    // Check if file already exists (skip unless force)
    if (!force && await checkFileExists(outputPath)) {
        console.log(`⏭️  ${agentId}: Already exists, skipping`);
        return true;
    }

    console.log(`\n🎨 Generating background for ${agentId}...`);
    console.log(`  Style: ${config.style}`);

    const imageBuffer = await generateWithGemini(config.prompt, config.style);

    if (imageBuffer) {
        if (!existsSync(outputDir)) {
            await mkdir(outputDir, { recursive: true });
        }

        await writeFile(outputPath, imageBuffer);
        console.log(`  💾 Saved to ${outputPath} (${Math.round(imageBuffer.length / 1024)}KB)`);
        return true;
    } else {
        console.log(`  ❌ Failed to generate image for ${agentId}`);
        return false;
    }
}

async function main() {
    const args = process.argv.slice(2);
    const allAgents = Object.keys(AGENT_BACKGROUNDS);

    // Check for Gemini API key first
    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY environment variable not set');
        console.error('   Set it with: export GEMINI_API_KEY=your_key');
        process.exit(1);
    }

    if (args.includes('--list')) {
        // List all agents
        console.log('📋 Available agents:\n');
        for (const agentId of allAgents) {
            const config = AGENT_BACKGROUNDS[agentId];
            console.log(`  • ${agentId} (${config.style})`);
        }
        console.log(`\nTotal: ${allAgents.length} agents`);
        return;
    }

    if (args.includes('--missing')) {
        // Generate only missing backgrounds
        console.log('🔍 Checking for missing backgrounds...\n');

        let generated = 0;
        let skipped = 0;
        let failed = 0;

        for (const agentId of allAgents) {
            const outputPath = path.join(process.cwd(), OUTPUT_DIR, `${agentId}.png`);
            if (await checkFileExists(outputPath)) {
                skipped++;
                continue;
            }

            const success = await generateAgentBackground(agentId, true);
            if (success) {
                generated++;
            } else {
                failed++;
            }

            // Rate limit: 2 seconds between requests
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log(`\n📊 Summary: ${generated} generated, ${skipped} already existed, ${failed} failed`);
        return;
    }

    if (args.length > 0 && !args[0].startsWith('--')) {
        // Generate for specific agent
        const force = args.includes('--force');
        await generateAgentBackground(args[0], force);
    } else if (args.includes('--all') || args.includes('--force')) {
        // Generate for all agents (force regenerate with --force)
        const force = args.includes('--force');
        console.log(`🎨 Generating backgrounds for all ${allAgents.length} agents${force ? ' (force)' : ''}...\n`);

        let success = 0;
        let failed = 0;

        for (const agentId of allAgents) {
            const result = await generateAgentBackground(agentId, force);
            if (result) {
                success++;
            } else {
                failed++;
            }
            // Rate limit: 2 seconds between requests
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log(`\n📊 Summary: ${success} successful, ${failed} failed`);
    } else {
        // Show help
        console.log(`
🍌 Agent Background Generator (Gemini 3 Pro Image)

Usage:
  bun run scripts/generate-agent-backgrounds.ts [agent-id]     # Generate for one agent
  bun run scripts/generate-agent-backgrounds.ts --list         # List all agents
  bun run scripts/generate-agent-backgrounds.ts --missing      # Generate only missing
  bun run scripts/generate-agent-backgrounds.ts --all          # Generate all (skip existing)
  bun run scripts/generate-agent-backgrounds.ts --force        # Regenerate all
  bun run scripts/generate-agent-backgrounds.ts agent-id --force  # Regenerate specific

Examples:
  bun run scripts/generate-agent-backgrounds.ts crypto-advisor
  bun run scripts/generate-agent-backgrounds.ts --missing
`);
    }
}

// Export for use as module
export { AGENT_BACKGROUNDS, generateAgentBackground };

// Run if called directly
main().catch(console.error);
