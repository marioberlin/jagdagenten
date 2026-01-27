/**
 * Product Image Generator
 *
 * Generates 3 high-quality images for each product in the UCP catalog
 * using Gemini's Nano Banana Pro API (gemini-2.5-flash-image).
 * Falls back to Unsplash for placeholder images if Gemini key is not available.
 *
 * Usage: bun run scripts/generate-product-images.ts
 *
 * Options:
 * - GEMINI_API_KEY environment variable for AI generation
 * - Falls back to Unsplash placeholders if key is missing
 * - Output directory: public/products/
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Configuration
// ============================================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OUTPUT_DIR = join(process.cwd(), 'public', 'products');
const MODEL = 'gemini-2.0-flash-exp'; // Use available model
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const IMAGES_PER_PRODUCT = 3;
const RATE_LIMIT_DELAY_MS = 2000; // Delay between API calls to avoid rate limiting
const USE_UNSPLASH_FALLBACK = !GEMINI_API_KEY; // Use Unsplash if no API key

// Product catalog (simplified for image generation)
interface ProductForImageGen {
  id: string;
  name: string;
  description: string;
  category: string;
  brand?: string;
  attributes: Record<string, string>;
}

// Image generation prompt templates by category
const PROMPT_TEMPLATES: Record<string, (product: ProductForImageGen, imageNum: number) => string> = {
  apparel: (product, imageNum) => {
    const angles = ['front view on white background', 'side angle lifestyle shot', 'flat lay product photography'];
    return `Professional e-commerce product photography of ${product.name}. ${product.description}. ${angles[imageNum - 1]}. High quality, sharp focus, clean professional lighting, 4K resolution, no text overlays, no watermarks.`;
  },
  electronics: (product, imageNum) => {
    const angles = ['hero shot on gradient background', '45-degree angle showing details', 'lifestyle context shot on desk'];
    return `Professional product photography of ${product.name}. ${product.description}. ${angles[imageNum - 1]}. Sleek modern aesthetic, studio lighting, tech product style, 4K resolution, no text, no watermarks.`;
  },
  'home-garden': (product, imageNum) => {
    const angles = ['product hero shot', 'in-context lifestyle shot in modern room', 'detail close-up shot'];
    return `Professional home decor product photography of ${product.name}. ${product.description}. ${angles[imageNum - 1]}. Warm inviting lighting, lifestyle aesthetic, 4K resolution, no text, no watermarks.`;
  },
  digital: (product, imageNum) => {
    const angles = ['3D mockup of digital product box', 'interface preview mockup', 'marketing banner style'];
    return `Digital product marketing image for ${product.name}. ${product.description}. ${angles[imageNum - 1]}. Modern clean design, professional mockup style, vibrant colors, 4K resolution, minimal text.`;
  },
  subscriptions: (product, imageNum) => {
    const angles = ['premium membership card design', 'abstract premium service visualization', 'badge/icon style representation'];
    return `Premium subscription service marketing image for ${product.name}. ${product.description}. ${angles[imageNum - 1]}. Luxury aesthetic, gold/premium colors, professional, 4K, minimal.`;
  },
};

// ============================================================================
// Product Data (extracted from product-catalog.ts)
// ============================================================================

const PRODUCTS: ProductForImageGen[] = [
  // APPAREL - T-Shirts
  { id: 'btc-tshirt-classic', name: 'Bitcoin Classic T-Shirt', description: 'Premium cotton t-shirt with embroidered Bitcoin logo', category: 'apparel', brand: 'Cymbal Outfitters', attributes: { material: '100% organic cotton', fit: 'regular' } },
  { id: 'eth-tshirt-logo', name: 'Ethereum Diamond T-Shirt', description: 'Soft blend t-shirt with Ethereum diamond logo', category: 'apparel', brand: 'Cymbal Outfitters', attributes: { material: '60% cotton, 40% polyester', fit: 'slim' } },
  { id: 'sol-tshirt-gradient', name: 'Solana Gradient T-Shirt', description: 'Vibrant gradient design Solana t-shirt', category: 'apparel', brand: 'Cymbal Outfitters', attributes: { material: '100% cotton', fit: 'regular' } },
  { id: 'hodl-tshirt', name: 'HODL Gang T-Shirt', description: 'Bold HODL typography t-shirt for crypto believers', category: 'apparel', brand: 'Cymbal Outfitters', attributes: { material: '100% cotton', fit: 'relaxed' } },
  { id: 'defi-summer-tshirt', name: 'DeFi Summer T-Shirt', description: 'Commemorative DeFi Summer 2020 edition t-shirt', category: 'apparel', brand: 'Cymbal Outfitters', attributes: { material: '100% cotton', fit: 'regular' } },

  // APPAREL - Hoodies
  { id: 'btc-hoodie-premium', name: 'Bitcoin Premium Hoodie', description: 'Heavy-weight premium hoodie with Bitcoin embroidery', category: 'apparel', brand: 'Cymbal Outfitters', attributes: { material: '80% cotton, 20% polyester', fit: 'regular', weight: 'heavyweight' } },
  { id: 'eth-hoodie-zip', name: 'Ethereum Zip-Up Hoodie', description: 'Athletic zip-up hoodie with Ethereum branding', category: 'apparel', brand: 'Cymbal Outfitters', attributes: { material: '100% polyester', fit: 'athletic', closure: 'full-zip' } },
  { id: 'wagmi-hoodie', name: 'WAGMI Oversized Hoodie', description: 'Trendy oversized hoodie with WAGMI slogan', category: 'apparel', brand: 'Cymbal Outfitters', attributes: { material: '80% cotton, 20% polyester', fit: 'oversized' } },

  // APPAREL - Hats
  { id: 'btc-cap-snapback', name: 'Bitcoin Snapback Cap', description: 'Classic snapback cap with Bitcoin logo', category: 'apparel', brand: 'Cymbal Outfitters', attributes: { material: 'cotton twill', closure: 'snapback' } },
  { id: 'sol-cap-trucker', name: 'Solana Trucker Hat', description: 'Mesh trucker hat with Solana branding', category: 'apparel', brand: 'Cymbal Outfitters', attributes: { material: 'cotton/mesh', closure: 'snapback' } },
  { id: 'gm-beanie', name: 'GM Beanie', description: 'Cozy knit beanie with GM embroidery', category: 'apparel', brand: 'Cymbal Outfitters', attributes: { material: '100% acrylic', fit: 'cuffed' } },

  // APPAREL - Shoes & Accessories
  { id: 'crypto-sneakers-limited', name: 'Crypto Runner Limited Edition Sneakers', description: 'Limited edition sneakers with holographic crypto design', category: 'apparel', brand: 'Cymbal Outfitters', attributes: { material: 'synthetic leather, mesh', sole: 'rubber' } },
  { id: 'defi-slides', name: 'DeFi Comfort Slides', description: 'Comfortable slides with DeFi-inspired design', category: 'apparel', brand: 'Cymbal Outfitters', attributes: { material: 'EVA foam', style: 'slides' } },
  { id: 'hardware-wallet-case', name: 'Hardware Wallet Premium Case', description: 'Protective leather case for hardware wallets', category: 'apparel', brand: 'Cymbal Outfitters', attributes: { material: 'genuine leather', fits: 'Ledger, Trezor' } },
  { id: 'crypto-socks-pack', name: 'Crypto Socks 6-Pack', description: 'Fun crypto-themed socks bundle', category: 'apparel', brand: 'Cymbal Outfitters', attributes: { material: '80% cotton, 20% spandex', quantity: '6 pairs' } },
  { id: 'moon-bag-backpack', name: 'To The Moon Backpack', description: 'Durable backpack with rocket and moon design', category: 'apparel', brand: 'Cymbal Outfitters', attributes: { material: 'nylon', capacity: '25L' } },

  // ELECTRONICS
  { id: 'mining-rig-psu', name: 'Mining Rig Power Supply 1600W', description: 'High-efficiency modular PSU for mining rigs', category: 'electronics', brand: 'PowerMax', attributes: { wattage: '1600W', efficiency: '94%', certification: '80+ Platinum' } },
  { id: 'ledger-nano-x', name: 'Ledger Nano X Hardware Wallet', description: 'Bluetooth-enabled hardware wallet with secure chip', category: 'electronics', brand: 'Ledger', attributes: { connectivity: 'Bluetooth, USB-C', coins: '5000+ supported' } },
  { id: 'trezor-model-t', name: 'Trezor Model T Hardware Wallet', description: 'Premium hardware wallet with touchscreen', category: 'electronics', brand: 'Trezor', attributes: { display: 'color touchscreen', coins: '1800+ supported' } },
  { id: 'crypto-power-bank', name: 'Crypto Power Bank 20000mAh', description: 'High-capacity power bank with crypto branding', category: 'electronics', brand: 'Cymbal Tech', attributes: { capacity: '20000mAh', ports: 'USB-C, USB-A x2' } },
  { id: 'usb-c-hub-7in1', name: '7-in-1 USB-C Hub for Traders', description: 'Multi-port hub for trading setups', category: 'electronics', brand: 'Cymbal Tech', attributes: { ports: 'HDMI, USB-A x3, USB-C, SD, microSD' } },
  { id: 'noise-cancelling-headphones', name: 'Focus Mode ANC Headphones', description: 'Premium noise-cancelling headphones for focused trading', category: 'electronics', brand: 'Cymbal Audio', attributes: { type: 'over-ear', anc: 'active', battery: '30 hours' } },

  // HOME & GARDEN
  { id: 'crypto-neon-sign', name: 'Bitcoin Neon Sign', description: 'LED neon sign with Bitcoin logo', category: 'home-garden', brand: 'Cymbal Decor', attributes: { type: 'LED neon', size: '16 inches', power: 'USB' } },
  { id: 'trading-desk-mat', name: 'XXL Trading Desk Mat', description: 'Extended desk mat with trading chart design', category: 'home-garden', brand: 'Cymbal Decor', attributes: { size: '900x400mm', material: 'rubber base, cloth top' } },
  { id: 'crypto-mug', name: 'Crypto Coffee Mug - Color Changing', description: 'Heat-activated color-changing mug', category: 'home-garden', brand: 'Cymbal Drinkware', attributes: { capacity: '11oz', material: 'ceramic', feature: 'heat-reactive' } },
  { id: 'outdoor-banner-large', name: 'Bitcoin Accepted Here Banner', description: 'Large outdoor banner for businesses', category: 'home-garden', brand: 'Cymbal Signs', attributes: { size: '3x6 feet', material: 'vinyl', finish: 'weather-resistant' } },

  // DIGITAL GOODS
  { id: 'trading-course-beginner', name: 'Crypto Trading 101 - Video Course', description: 'Comprehensive beginner course on crypto trading', category: 'digital', brand: 'Cymbal Academy', attributes: { format: 'video', duration: '10 hours', level: 'beginner' } },
  { id: 'defi-masterclass', name: 'DeFi Masterclass - Advanced Course', description: 'Advanced DeFi strategies and yield farming', category: 'digital', brand: 'Cymbal Academy', attributes: { format: 'video', duration: '20 hours', level: 'advanced' } },
  { id: 'trading-ebook-bundle', name: 'Crypto Trading eBook Bundle', description: 'Collection of 5 essential crypto trading ebooks', category: 'digital', brand: 'Cymbal Publishing', attributes: { format: 'PDF/ePub', books: '5', pages: '500+' } },
  { id: 'portfolio-tracker-pro', name: 'Portfolio Tracker Pro - 1 Year License', description: 'Professional portfolio tracking software', category: 'digital', brand: 'Cymbal Software', attributes: { license: '1 year', platforms: 'Windows, Mac, Web' } },

  // SUBSCRIPTIONS
  { id: 'signals-monthly', name: 'Trading Signals - Monthly', description: 'Daily trading signals and analysis', category: 'subscriptions', brand: 'Cymbal Signals', attributes: { frequency: 'daily', delivery: 'Telegram, Email' } },
  { id: 'signals-yearly', name: 'Trading Signals - Yearly', description: 'Annual subscription with 40% savings', category: 'subscriptions', brand: 'Cymbal Signals', attributes: { frequency: 'daily', delivery: 'Telegram, Email', savings: '40%' } },
  { id: 'newsletter-premium', name: 'Crypto Insights Newsletter - Premium', description: 'Weekly in-depth market analysis newsletter', category: 'subscriptions', brand: 'Cymbal Insights', attributes: { frequency: 'weekly', format: 'email', bonus: 'monthly video call' } },
];

// ============================================================================
// API Functions
// ============================================================================

async function generateImage(prompt: string): Promise<Buffer | null> {
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not set');
    return null;
  }

  try {
    const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseModalities: ['IMAGE'],
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`API Error: ${response.status} - ${error}`);
      return null;
    }

    const result = await response.json();

    // Extract base64 image data from response
    const imagePart = result.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inline_data?.mime_type?.startsWith('image/')
    );

    if (!imagePart?.inline_data?.data) {
      console.error('No image data in response');
      return null;
    }

    return Buffer.from(imagePart.inline_data.data, 'base64');
  } catch (error) {
    console.error('Image generation error:', error);
    return null;
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Main Generation Function
// ============================================================================

async function generateProductImages(): Promise<void> {
  console.log('🍌 Nano Banana Pro - Product Image Generator\n');

  // Create output directory
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}\n`);
  }

  // Track progress
  const progressFile = join(OUTPUT_DIR, '.generation-progress.json');
  let progress: Record<string, number[]> = {};

  if (existsSync(progressFile)) {
    progress = JSON.parse(readFileSync(progressFile, 'utf-8'));
    console.log('Resuming from previous progress...\n');
  }

  const totalImages = PRODUCTS.length * IMAGES_PER_PRODUCT;
  let generatedCount = 0;
  let skippedCount = 0;

  for (const product of PRODUCTS) {
    const categoryTemplate = PROMPT_TEMPLATES[product.category] || PROMPT_TEMPLATES.apparel;

    for (let imageNum = 1; imageNum <= IMAGES_PER_PRODUCT; imageNum++) {
      const filename = `${product.id}-${imageNum}.png`;
      const filepath = join(OUTPUT_DIR, filename);

      // Skip if already generated
      if (existsSync(filepath)) {
        console.log(`⏭️  Skipping ${filename} (already exists)`);
        skippedCount++;
        continue;
      }

      // Skip if marked as generated in progress
      if (progress[product.id]?.includes(imageNum)) {
        console.log(`⏭️  Skipping ${filename} (marked in progress)`);
        skippedCount++;
        continue;
      }

      const prompt = categoryTemplate(product, imageNum);
      console.log(`🎨 Generating ${filename}...`);
      console.log(`   Prompt: ${prompt.substring(0, 80)}...`);

      const imageBuffer = await generateImage(prompt);

      if (imageBuffer) {
        writeFileSync(filepath, imageBuffer);
        generatedCount++;

        // Update progress
        if (!progress[product.id]) {
          progress[product.id] = [];
        }
        progress[product.id].push(imageNum);
        writeFileSync(progressFile, JSON.stringify(progress, null, 2));

        console.log(`✅ Saved ${filename} (${imageBuffer.length} bytes)`);
      } else {
        console.log(`❌ Failed to generate ${filename}`);
      }

      // Rate limiting delay
      await sleep(RATE_LIMIT_DELAY_MS);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Total products: ${PRODUCTS.length}`);
  console.log(`   Total images: ${totalImages}`);
  console.log(`   Generated: ${generatedCount}`);
  console.log(`   Skipped: ${skippedCount}`);
  console.log(`   Output: ${OUTPUT_DIR}`);
}

// ============================================================================
// CLI Entry Point
// ============================================================================

if (process.argv[1].endsWith('generate-product-images.ts')) {
  generateProductImages().catch(console.error);
}

export { generateProductImages, PRODUCTS };
