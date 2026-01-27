/**
 * Cymbal Outfitters Product Catalog
 *
 * Mock product catalog for the UCP demo store.
 * Contains 80 SKUs across 5 categories with various edge cases:
 * - Variants (size/color)
 * - Digital goods (no shipping)
 * - Hazmat shipping (batteries)
 * - Oversize items
 * - Backorder items
 * - Bundles
 */

import {
  type UCPProduct,
  type UCPProductVariant,
  type UCPInventory,
  createMoney,
} from './types.js';

// ============================================================================
// Product Categories
// ============================================================================

export const CATEGORIES = {
  APPAREL: 'apparel',
  ELECTRONICS: 'electronics',
  HOME_GARDEN: 'home-garden',
  DIGITAL: 'digital',
  SUBSCRIPTIONS: 'subscriptions',
} as const;

export const SUBCATEGORIES = {
  // Apparel
  TSHIRTS: 't-shirts',
  HOODIES: 'hoodies',
  HATS: 'hats',
  ACCESSORIES: 'accessories',
  SHOES: 'shoes',
  // Electronics
  GADGETS: 'gadgets',
  CHARGERS: 'chargers',
  AUDIO: 'audio',
  // Home
  DECOR: 'decor',
  KITCHEN: 'kitchen',
  OUTDOOR: 'outdoor',
  // Digital
  EBOOKS: 'ebooks',
  SOFTWARE: 'software',
  COURSES: 'courses',
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

function generateSKU(category: string, id: number): string {
  const prefix = category.substring(0, 3).toUpperCase();
  return `${prefix}-${String(id).padStart(4, '0')}`;
}

/**
 * Generate placeholder image URLs using picsum.photos for reliable placeholders
 * Uses category-based seeds for consistent images
 */
function generateProductImages(productId: string, category: string, count: number = 2): string[] {
  // Use product ID as seed for consistent images
  const seed = productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const images: string[] = [];

  for (let i = 0; i < count; i++) {
    // Use picsum.photos with seed for consistent, beautiful placeholder images
    // 600x600 is good for product cards
    images.push(`https://picsum.photos/seed/${seed + i}/600/600`);
  }

  return images;
}

function createVariants(
  baseId: string,
  options: { sizes?: string[]; colors?: string[] },
  baseInventory: number = 50
): UCPProductVariant[] {
  const variants: UCPProductVariant[] = [];
  const { sizes = [], colors = [] } = options;

  if (sizes.length > 0 && colors.length > 0) {
    // Size + Color combinations
    for (const size of sizes) {
      for (const color of colors) {
        variants.push({
          id: `${baseId}-${size.toLowerCase()}-${color.toLowerCase()}`,
          name: `${size} / ${color}`,
          sku: `${baseId}-${size[0]}${color[0]}`.toUpperCase(),
          attributes: { size, color },
          inventory: {
            in_stock: Math.random() > 0.1, // 10% chance out of stock
            quantity: Math.floor(Math.random() * baseInventory),
            low_stock_threshold: 5,
          },
        });
      }
    }
  } else if (sizes.length > 0) {
    // Size only
    for (const size of sizes) {
      variants.push({
        id: `${baseId}-${size.toLowerCase()}`,
        name: size,
        attributes: { size },
        inventory: {
          in_stock: Math.random() > 0.1,
          quantity: Math.floor(Math.random() * baseInventory),
          low_stock_threshold: 5,
        },
      });
    }
  } else if (colors.length > 0) {
    // Color only
    for (const color of colors) {
      variants.push({
        id: `${baseId}-${color.toLowerCase()}`,
        name: color,
        attributes: { color },
        inventory: {
          in_stock: Math.random() > 0.1,
          quantity: Math.floor(Math.random() * baseInventory),
          low_stock_threshold: 5,
        },
      });
    }
  }

  return variants;
}

const now = new Date().toISOString();

// ============================================================================
// APPAREL (40 SKUs)
// ============================================================================

const APPAREL_PRODUCTS: UCPProduct[] = [
  // T-Shirts (10)
  {
    id: 'btc-tshirt-classic',
    name: 'Bitcoin Classic T-Shirt',
    description: 'Premium cotton t-shirt with the iconic Bitcoin logo. Perfect for crypto enthusiasts who want to show their support for decentralization.',
    brand: 'Cymbal Crypto Wear',
    category: CATEGORIES.APPAREL,
    subcategory: SUBCATEGORIES.TSHIRTS,
    images: generateProductImages('btc-tshirt-classic', CATEGORIES.APPAREL, 2),
    price: createMoney(29.99),
    compare_at_price: createMoney(39.99),
    variants: createVariants('btc-tshirt-classic', {
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      colors: ['Black', 'White', 'Navy'],
    }),
    attributes: { material: '100% Cotton', fit: 'Regular', care: 'Machine washable' },
    inventory: { in_stock: true, quantity: 500, low_stock_threshold: 50 },
    shipping: { weight: 200, shipping_class: 'standard', free_shipping_eligible: true, requires_shipping: true },
    tags: ['bitcoin', 'crypto', 'casual', 'bestseller'],
    rating: 4.8,
    review_count: 342,
    sku: generateSKU(CATEGORIES.APPAREL, 1),
    created_at: now,
    updated_at: now,
  },
  {
    id: 'eth-tshirt-logo',
    name: 'Ethereum Diamond T-Shirt',
    description: 'Soft blend t-shirt featuring the Ethereum diamond logo. A must-have for ETH holders and DeFi enthusiasts.',
    brand: 'Cymbal Crypto Wear',
    category: CATEGORIES.APPAREL,
    subcategory: SUBCATEGORIES.TSHIRTS,
    images: ['/products/eth-tshirt-1.jpg'],
    price: createMoney(29.99),
    variants: createVariants('eth-tshirt-logo', {
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Purple', 'Black', 'Gray'],
    }),
    attributes: { material: '60% Cotton, 40% Polyester', fit: 'Regular' },
    inventory: { in_stock: true, quantity: 300, low_stock_threshold: 30 },
    shipping: { weight: 200, shipping_class: 'standard', free_shipping_eligible: true, requires_shipping: true },
    tags: ['ethereum', 'crypto', 'casual'],
    rating: 4.7,
    review_count: 189,
    sku: generateSKU(CATEGORIES.APPAREL, 2),
    created_at: now,
    updated_at: now,
  },
  {
    id: 'sol-tshirt-gradient',
    name: 'Solana Gradient T-Shirt',
    description: 'Vibrant gradient design inspired by Solana\'s speed and efficiency. Stand out at any crypto meetup.',
    brand: 'Cymbal Crypto Wear',
    category: CATEGORIES.APPAREL,
    subcategory: SUBCATEGORIES.TSHIRTS,
    images: ['/products/sol-tshirt-1.jpg'],
    price: createMoney(34.99),
    variants: createVariants('sol-tshirt-gradient', {
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Gradient Purple', 'Black'],
    }),
    attributes: { material: '100% Cotton', fit: 'Slim' },
    inventory: { in_stock: true, quantity: 150, low_stock_threshold: 20 },
    shipping: { weight: 200, shipping_class: 'standard', free_shipping_eligible: true, requires_shipping: true },
    tags: ['solana', 'crypto', 'premium'],
    rating: 4.6,
    review_count: 87,
    sku: generateSKU(CATEGORIES.APPAREL, 3),
    created_at: now,
    updated_at: now,
  },
  {
    id: 'hodl-tshirt',
    name: 'HODL Gang T-Shirt',
    description: 'For those who believe in the long game. Diamond hands emoji included.',
    brand: 'Cymbal Crypto Wear',
    category: CATEGORIES.APPAREL,
    subcategory: SUBCATEGORIES.TSHIRTS,
    images: ['/products/hodl-tshirt-1.jpg'],
    price: createMoney(24.99),
    variants: createVariants('hodl-tshirt', {
      sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
      colors: ['Black', 'White'],
    }),
    attributes: { material: '100% Cotton', fit: 'Regular' },
    inventory: { in_stock: true, quantity: 800, low_stock_threshold: 100 },
    shipping: { weight: 200, shipping_class: 'standard', free_shipping_eligible: true, requires_shipping: true },
    tags: ['hodl', 'meme', 'casual', 'bestseller'],
    rating: 4.9,
    review_count: 567,
    sku: generateSKU(CATEGORIES.APPAREL, 4),
    created_at: now,
    updated_at: now,
  },
  {
    id: 'defi-summer-tshirt',
    name: 'DeFi Summer T-Shirt',
    description: 'Commemorating the legendary DeFi Summer. Yield farming never looked so good.',
    brand: 'Cymbal Crypto Wear',
    category: CATEGORIES.APPAREL,
    subcategory: SUBCATEGORIES.TSHIRTS,
    images: ['/products/defi-summer-1.jpg'],
    price: createMoney(27.99),
    variants: createVariants('defi-summer', {
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Yellow', 'Orange', 'White'],
    }),
    attributes: { material: '100% Organic Cotton', fit: 'Regular' },
    inventory: { in_stock: true, quantity: 200, low_stock_threshold: 25 },
    shipping: { weight: 200, shipping_class: 'standard', free_shipping_eligible: true, requires_shipping: true },
    tags: ['defi', 'summer', 'organic'],
    rating: 4.5,
    review_count: 123,
    sku: generateSKU(CATEGORIES.APPAREL, 5),
    created_at: now,
    updated_at: now,
  },

  // Hoodies (8)
  {
    id: 'btc-hoodie-premium',
    name: 'Bitcoin Premium Hoodie',
    description: 'Heavyweight hoodie with embroidered Bitcoin logo. Perfect for those cold mining nights.',
    brand: 'Cymbal Crypto Wear',
    category: CATEGORIES.APPAREL,
    subcategory: SUBCATEGORIES.HOODIES,
    images: ['/products/btc-hoodie-1.jpg', '/products/btc-hoodie-2.jpg'],
    price: createMoney(69.99),
    compare_at_price: createMoney(89.99),
    variants: createVariants('btc-hoodie', {
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      colors: ['Black', 'Orange', 'Gray'],
    }),
    attributes: { material: '80% Cotton, 20% Polyester', fit: 'Regular', weight: 'Heavyweight' },
    inventory: { in_stock: true, quantity: 250, low_stock_threshold: 30 },
    shipping: { weight: 600, shipping_class: 'standard', free_shipping_eligible: true, requires_shipping: true },
    tags: ['bitcoin', 'hoodie', 'premium', 'winter'],
    rating: 4.9,
    review_count: 456,
    sku: generateSKU(CATEGORIES.APPAREL, 10),
    created_at: now,
    updated_at: now,
  },
  {
    id: 'eth-hoodie-zip',
    name: 'Ethereum Zip-Up Hoodie',
    description: 'Full-zip hoodie with subtle Ethereum branding. Layer up in style.',
    brand: 'Cymbal Crypto Wear',
    category: CATEGORIES.APPAREL,
    subcategory: SUBCATEGORIES.HOODIES,
    images: ['/products/eth-hoodie-1.jpg'],
    price: createMoney(74.99),
    variants: createVariants('eth-hoodie-zip', {
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Purple', 'Black'],
    }),
    attributes: { material: '70% Cotton, 30% Polyester', fit: 'Athletic' },
    inventory: { in_stock: true, quantity: 180, low_stock_threshold: 20 },
    shipping: { weight: 650, shipping_class: 'standard', free_shipping_eligible: true, requires_shipping: true },
    tags: ['ethereum', 'hoodie', 'zip'],
    rating: 4.7,
    review_count: 234,
    sku: generateSKU(CATEGORIES.APPAREL, 11),
    created_at: now,
    updated_at: now,
  },
  {
    id: 'wagmi-hoodie',
    name: 'WAGMI Oversized Hoodie',
    description: 'We\'re All Gonna Make It. Oversized fit for maximum comfort during market volatility.',
    brand: 'Cymbal Crypto Wear',
    category: CATEGORIES.APPAREL,
    subcategory: SUBCATEGORIES.HOODIES,
    images: ['/products/wagmi-hoodie-1.jpg'],
    price: createMoney(59.99),
    variants: createVariants('wagmi-hoodie', {
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      colors: ['Black', 'Forest Green'],
    }),
    attributes: { material: '100% Cotton', fit: 'Oversized' },
    inventory: { in_stock: true, quantity: 350, low_stock_threshold: 40 },
    shipping: { weight: 700, shipping_class: 'standard', free_shipping_eligible: true, requires_shipping: true },
    tags: ['wagmi', 'meme', 'oversized', 'bestseller'],
    rating: 4.8,
    review_count: 389,
    sku: generateSKU(CATEGORIES.APPAREL, 12),
    created_at: now,
    updated_at: now,
  },

  // Hats (6)
  {
    id: 'btc-cap-snapback',
    name: 'Bitcoin Snapback Cap',
    description: 'Classic snapback with embroidered Bitcoin logo. Adjustable fit for all head sizes.',
    brand: 'Cymbal Crypto Wear',
    category: CATEGORIES.APPAREL,
    subcategory: SUBCATEGORIES.HATS,
    images: ['/products/btc-cap-1.jpg'],
    price: createMoney(24.99),
    variants: createVariants('btc-cap', { colors: ['Black', 'Orange', 'White', 'Navy'] }),
    attributes: { material: 'Cotton Twill', closure: 'Snapback' },
    inventory: { in_stock: true, quantity: 400, low_stock_threshold: 50 },
    shipping: { weight: 100, shipping_class: 'standard', free_shipping_eligible: true, requires_shipping: true },
    tags: ['bitcoin', 'cap', 'snapback'],
    rating: 4.6,
    review_count: 278,
    sku: generateSKU(CATEGORIES.APPAREL, 20),
    created_at: now,
    updated_at: now,
  },
  {
    id: 'sol-cap-trucker',
    name: 'Solana Trucker Hat',
    description: 'Mesh-back trucker hat with Solana gradient logo. Stay cool while your transactions stay fast.',
    brand: 'Cymbal Crypto Wear',
    category: CATEGORIES.APPAREL,
    subcategory: SUBCATEGORIES.HATS,
    images: ['/products/sol-cap-1.jpg'],
    price: createMoney(22.99),
    variants: createVariants('sol-cap-trucker', { colors: ['Purple/White', 'Black/Black'] }),
    attributes: { material: 'Cotton Front, Mesh Back', closure: 'Snapback' },
    inventory: { in_stock: true, quantity: 220, low_stock_threshold: 25 },
    shipping: { weight: 80, shipping_class: 'standard', free_shipping_eligible: true, requires_shipping: true },
    tags: ['solana', 'cap', 'trucker'],
    rating: 4.5,
    review_count: 145,
    sku: generateSKU(CATEGORIES.APPAREL, 21),
    created_at: now,
    updated_at: now,
  },
  {
    id: 'gm-beanie',
    name: 'GM Beanie',
    description: 'Cozy knit beanie with "GM" embroidery. Start every day the crypto way.',
    brand: 'Cymbal Crypto Wear',
    category: CATEGORIES.APPAREL,
    subcategory: SUBCATEGORIES.HATS,
    images: ['/products/gm-beanie-1.jpg'],
    price: createMoney(19.99),
    variants: createVariants('gm-beanie', { colors: ['Black', 'Gray', 'Navy', 'Maroon'] }),
    attributes: { material: 'Acrylic Knit', style: 'Cuffed' },
    inventory: { in_stock: true, quantity: 500, low_stock_threshold: 60 },
    shipping: { weight: 80, shipping_class: 'standard', free_shipping_eligible: true, requires_shipping: true },
    tags: ['gm', 'beanie', 'winter', 'bestseller'],
    rating: 4.8,
    review_count: 412,
    sku: generateSKU(CATEGORIES.APPAREL, 22),
    created_at: now,
    updated_at: now,
  },

  // Shoes (4)
  {
    id: 'crypto-sneakers-limited',
    name: 'Crypto Runner Limited Edition Sneakers',
    description: 'Limited edition sneakers with blockchain-inspired design. Only 1000 pairs ever made.',
    brand: 'Cymbal Footwear',
    category: CATEGORIES.APPAREL,
    subcategory: SUBCATEGORIES.SHOES,
    images: ['/products/sneakers-1.jpg', '/products/sneakers-2.jpg', '/products/sneakers-3.jpg'],
    price: createMoney(149.99),
    compare_at_price: createMoney(199.99),
    variants: createVariants('crypto-sneakers', {
      sizes: ['7', '8', '9', '10', '11', '12'],
      colors: ['White/Gold', 'Black/Silver'],
    }),
    attributes: { material: 'Leather Upper, Rubber Sole', style: 'Low Top' },
    inventory: { in_stock: true, quantity: 45, low_stock_threshold: 10 }, // Limited!
    shipping: { weight: 900, shipping_class: 'standard', free_shipping_eligible: true, requires_shipping: true },
    tags: ['sneakers', 'limited', 'premium', 'collectible'],
    rating: 4.9,
    review_count: 89,
    sku: generateSKU(CATEGORIES.APPAREL, 30),
    created_at: now,
    updated_at: now,
  },
  {
    id: 'defi-slides',
    name: 'DeFi Comfort Slides',
    description: 'Comfortable slides for the work-from-home DeFi trader. Pool day ready.',
    brand: 'Cymbal Footwear',
    category: CATEGORIES.APPAREL,
    subcategory: SUBCATEGORIES.SHOES,
    images: ['/products/slides-1.jpg'],
    price: createMoney(34.99),
    variants: createVariants('defi-slides', {
      sizes: ['6', '7', '8', '9', '10', '11', '12'],
      colors: ['Black', 'White', 'Blue'],
    }),
    attributes: { material: 'EVA Foam', style: 'Slide' },
    inventory: { in_stock: true, quantity: 300, low_stock_threshold: 40 },
    shipping: { weight: 400, shipping_class: 'standard', free_shipping_eligible: true, requires_shipping: true },
    tags: ['slides', 'comfort', 'casual'],
    rating: 4.4,
    review_count: 167,
    sku: generateSKU(CATEGORIES.APPAREL, 31),
    created_at: now,
    updated_at: now,
  },

  // Accessories (12)
  {
    id: 'hardware-wallet-case',
    name: 'Hardware Wallet Premium Case',
    description: 'Leather case fits most hardware wallets. Keep your keys safe and stylish.',
    brand: 'Cymbal Accessories',
    category: CATEGORIES.APPAREL,
    subcategory: SUBCATEGORIES.ACCESSORIES,
    images: ['/products/wallet-case-1.jpg'],
    price: createMoney(39.99),
    variants: createVariants('hw-case', { colors: ['Black', 'Brown', 'Navy'] }),
    attributes: { material: 'Genuine Leather', fits: 'Ledger, Trezor, and similar' },
    inventory: { in_stock: true, quantity: 200, low_stock_threshold: 25 },
    shipping: { weight: 100, shipping_class: 'standard', free_shipping_eligible: true, requires_shipping: true },
    tags: ['hardware wallet', 'case', 'leather', 'security'],
    rating: 4.7,
    review_count: 234,
    sku: generateSKU(CATEGORIES.APPAREL, 40),
    created_at: now,
    updated_at: now,
  },
  {
    id: 'crypto-socks-pack',
    name: 'Crypto Socks 6-Pack',
    description: 'Six pairs of fun crypto-themed socks. Bitcoin, Ethereum, Solana, HODL, GM, and WAGMI designs.',
    brand: 'Cymbal Accessories',
    category: CATEGORIES.APPAREL,
    subcategory: SUBCATEGORIES.ACCESSORIES,
    images: ['/products/socks-pack-1.jpg'],
    price: createMoney(29.99),
    variants: createVariants('crypto-socks', { sizes: ['S/M', 'L/XL'] }),
    attributes: { material: '80% Cotton, 15% Polyester, 5% Spandex', pairs: '6' },
    inventory: { in_stock: true, quantity: 450, low_stock_threshold: 50 },
    shipping: { weight: 200, shipping_class: 'standard', free_shipping_eligible: true, requires_shipping: true },
    tags: ['socks', 'pack', 'gift', 'bestseller'],
    rating: 4.6,
    review_count: 389,
    sku: generateSKU(CATEGORIES.APPAREL, 41),
    created_at: now,
    updated_at: now,
  },
  {
    id: 'moon-bag-backpack',
    name: 'To The Moon Backpack',
    description: 'Durable laptop backpack with crypto-themed patches. 15" laptop compartment, multiple pockets.',
    brand: 'Cymbal Accessories',
    category: CATEGORIES.APPAREL,
    subcategory: SUBCATEGORIES.ACCESSORIES,
    images: ['/products/backpack-1.jpg', '/products/backpack-2.jpg'],
    price: createMoney(79.99),
    variants: createVariants('moon-backpack', { colors: ['Black', 'Gray'] }),
    attributes: { material: 'Ripstop Nylon', capacity: '25L', laptop: 'Up to 15"' },
    inventory: { in_stock: true, quantity: 150, low_stock_threshold: 20 },
    shipping: { weight: 800, shipping_class: 'standard', free_shipping_eligible: true, requires_shipping: true },
    tags: ['backpack', 'laptop', 'travel'],
    rating: 4.8,
    review_count: 178,
    sku: generateSKU(CATEGORIES.APPAREL, 42),
    created_at: now,
    updated_at: now,
  },
];

// ============================================================================
// ELECTRONICS (15 SKUs)
// ============================================================================

const ELECTRONICS_PRODUCTS: UCPProduct[] = [
  {
    id: 'mining-rig-psu',
    name: 'Mining Rig Power Supply 1600W',
    description: '80+ Gold certified PSU designed for mining rigs. Supports up to 8 GPUs.',
    brand: 'CryptoTech',
    category: CATEGORIES.ELECTRONICS,
    subcategory: SUBCATEGORIES.GADGETS,
    images: ['/products/psu-1.jpg'],
    price: createMoney(199.99),
    attributes: { wattage: '1600W', efficiency: '80+ Gold', connectors: '8x PCIe 6+2' },
    inventory: { in_stock: true, quantity: 80, low_stock_threshold: 10 },
    shipping: { weight: 3500, shipping_class: 'oversize', free_shipping_eligible: false, requires_shipping: true },
    tags: ['mining', 'psu', 'power supply', 'hardware'],
    rating: 4.5,
    review_count: 234,
    sku: generateSKU(CATEGORIES.ELECTRONICS, 1),
    created_at: now,
    updated_at: now,
  },
  {
    id: 'ledger-nano-x',
    name: 'Ledger Nano X Hardware Wallet',
    description: 'Bluetooth-enabled hardware wallet supporting 5,500+ cryptocurrencies. The gold standard in cold storage.',
    brand: 'Ledger',
    category: CATEGORIES.ELECTRONICS,
    subcategory: SUBCATEGORIES.GADGETS,
    images: ['/products/ledger-nano-x-1.jpg'],
    price: createMoney(149.00),
    variants: createVariants('ledger-nano-x', { colors: ['Matte Black', 'Cosmic Purple', 'Blazing Orange'] }),
    attributes: { connectivity: 'Bluetooth + USB-C', coins: '5,500+', display: 'OLED' },
    inventory: { in_stock: true, quantity: 200, low_stock_threshold: 25 },
    shipping: { weight: 150, shipping_class: 'standard', free_shipping_eligible: true, requires_shipping: true },
    tags: ['hardware wallet', 'ledger', 'security', 'cold storage', 'bestseller'],
    rating: 4.8,
    review_count: 1234,
    sku: generateSKU(CATEGORIES.ELECTRONICS, 2),
    created_at: now,
    updated_at: now,
  },
  {
    id: 'trezor-model-t',
    name: 'Trezor Model T Hardware Wallet',
    description: 'Premium hardware wallet with touchscreen. Open-source firmware for maximum transparency.',
    brand: 'Trezor',
    category: CATEGORIES.ELECTRONICS,
    subcategory: SUBCATEGORIES.GADGETS,
    images: ['/products/trezor-t-1.jpg'],
    price: createMoney(219.00),
    attributes: { connectivity: 'USB-C', display: 'Color Touchscreen', open_source: 'Yes' },
    inventory: { in_stock: true, quantity: 150, low_stock_threshold: 20 },
    shipping: { weight: 150, shipping_class: 'standard', free_shipping_eligible: true, requires_shipping: true },
    tags: ['hardware wallet', 'trezor', 'security', 'cold storage', 'open source'],
    rating: 4.7,
    review_count: 876,
    sku: generateSKU(CATEGORIES.ELECTRONICS, 3),
    created_at: now,
    updated_at: now,
  },
  {
    id: 'crypto-power-bank',
    name: 'Crypto Power Bank 20000mAh',
    description: 'High-capacity power bank with Bitcoin logo. Never run out of juice at crypto conferences.',
    brand: 'CryptoTech',
    category: CATEGORIES.ELECTRONICS,
    subcategory: SUBCATEGORIES.CHARGERS,
    images: ['/products/powerbank-1.jpg'],
    price: createMoney(49.99),
    variants: createVariants('power-bank', { colors: ['Black', 'Orange'] }),
    attributes: { capacity: '20000mAh', ports: '2x USB-A, 1x USB-C', fast_charge: 'Yes' },
    inventory: { in_stock: true, quantity: 300, low_stock_threshold: 40 },
    shipping: {
      weight: 400,
      shipping_class: 'hazmat', // Contains lithium battery
      free_shipping_eligible: false,
      requires_shipping: true,
    },
    tags: ['power bank', 'battery', 'travel', 'charger'],
    rating: 4.4,
    review_count: 267,
    sku: generateSKU(CATEGORIES.ELECTRONICS, 10),
    created_at: now,
    updated_at: now,
  },
  {
    id: 'usb-c-hub-7in1',
    name: '7-in-1 USB-C Hub for Traders',
    description: 'Multi-monitor setup essential. HDMI, USB-A, USB-C, SD card, and more.',
    brand: 'CryptoTech',
    category: CATEGORIES.ELECTRONICS,
    subcategory: SUBCATEGORIES.GADGETS,
    images: ['/products/usb-hub-1.jpg'],
    price: createMoney(59.99),
    attributes: { ports: 'HDMI, 3x USB-A, USB-C PD, SD, microSD', power_delivery: '100W' },
    inventory: { in_stock: true, quantity: 180, low_stock_threshold: 25 },
    shipping: { weight: 150, shipping_class: 'standard', free_shipping_eligible: true, requires_shipping: true },
    tags: ['usb hub', 'productivity', 'trading setup'],
    rating: 4.6,
    review_count: 145,
    sku: generateSKU(CATEGORIES.ELECTRONICS, 11),
    created_at: now,
    updated_at: now,
  },
  {
    id: 'noise-cancelling-headphones',
    name: 'Focus Mode ANC Headphones',
    description: 'Active noise cancelling headphones for deep work. 30-hour battery life.',
    brand: 'CryptoTech',
    category: CATEGORIES.ELECTRONICS,
    subcategory: SUBCATEGORIES.AUDIO,
    images: ['/products/headphones-1.jpg'],
    price: createMoney(199.99),
    compare_at_price: createMoney(249.99),
    variants: createVariants('anc-headphones', { colors: ['Matte Black', 'Silver', 'Midnight Blue'] }),
    attributes: { driver: '40mm', battery: '30 hours', anc: 'Active Noise Cancelling' },
    inventory: { in_stock: true, quantity: 120, low_stock_threshold: 15 },
    shipping: { weight: 350, shipping_class: 'standard', free_shipping_eligible: true, requires_shipping: true },
    tags: ['headphones', 'anc', 'audio', 'productivity'],
    rating: 4.7,
    review_count: 312,
    sku: generateSKU(CATEGORIES.ELECTRONICS, 20),
    created_at: now,
    updated_at: now,
  },
];

// ============================================================================
// HOME & GARDEN (15 SKUs)
// ============================================================================

const HOME_PRODUCTS: UCPProduct[] = [
  {
    id: 'crypto-neon-sign',
    name: 'Bitcoin Neon Sign',
    description: 'LED neon sign with the Bitcoin logo. Perfect for your trading setup or man cave.',
    brand: 'Cymbal Home',
    category: CATEGORIES.HOME_GARDEN,
    subcategory: SUBCATEGORIES.DECOR,
    images: ['/products/neon-btc-1.jpg'],
    price: createMoney(89.99),
    variants: createVariants('neon-btc', { colors: ['Orange', 'White', 'RGB'] }),
    attributes: { size: '12" x 12"', power: 'USB powered', material: 'Acrylic + LED' },
    inventory: { in_stock: true, quantity: 100, low_stock_threshold: 15 },
    shipping: { weight: 1200, dimensions: { length: 35, width: 35, height: 10 }, shipping_class: 'fragile', free_shipping_eligible: true, requires_shipping: true },
    tags: ['neon', 'sign', 'decor', 'bitcoin', 'led'],
    rating: 4.8,
    review_count: 234,
    sku: generateSKU(CATEGORIES.HOME_GARDEN, 1),
    created_at: now,
    updated_at: now,
  },
  {
    id: 'trading-desk-mat',
    name: 'XXL Trading Desk Mat',
    description: 'Extended desk mat with crypto market patterns. Anti-slip rubber base.',
    brand: 'Cymbal Home',
    category: CATEGORIES.HOME_GARDEN,
    subcategory: SUBCATEGORIES.DECOR,
    images: ['/products/desk-mat-1.jpg'],
    price: createMoney(34.99),
    variants: createVariants('desk-mat', { colors: ['Market Green', 'Market Red', 'Galaxy'] }),
    attributes: { size: '90cm x 40cm', material: 'Microfiber + Rubber', thickness: '3mm' },
    inventory: { in_stock: true, quantity: 250, low_stock_threshold: 30 },
    shipping: { weight: 500, shipping_class: 'standard', free_shipping_eligible: true, requires_shipping: true },
    tags: ['desk mat', 'trading', 'office', 'setup'],
    rating: 4.6,
    review_count: 189,
    sku: generateSKU(CATEGORIES.HOME_GARDEN, 2),
    created_at: now,
    updated_at: now,
  },
  {
    id: 'crypto-mug',
    name: 'Crypto Coffee Mug - Color Changing',
    description: 'Heat-activated mug reveals crypto prices when hot. Start your morning with gains.',
    brand: 'Cymbal Home',
    category: CATEGORIES.HOME_GARDEN,
    subcategory: SUBCATEGORIES.KITCHEN,
    images: ['/products/mug-1.jpg', '/products/mug-2.jpg'],
    price: createMoney(19.99),
    variants: createVariants('crypto-mug', { colors: ['BTC Edition', 'ETH Edition', 'Multi-Coin'] }),
    attributes: { capacity: '11oz', material: 'Ceramic', dishwasher: 'No - Hand wash only' },
    inventory: { in_stock: true, quantity: 400, low_stock_threshold: 50 },
    shipping: { weight: 400, shipping_class: 'fragile', free_shipping_eligible: true, requires_shipping: true },
    tags: ['mug', 'coffee', 'gift', 'color changing', 'bestseller'],
    rating: 4.7,
    review_count: 567,
    sku: generateSKU(CATEGORIES.HOME_GARDEN, 10),
    created_at: now,
    updated_at: now,
  },
  {
    id: 'outdoor-banner-large',
    name: 'Bitcoin Accepted Here Banner (Large)',
    description: 'Weather-resistant outdoor banner. Let customers know you accept crypto.',
    brand: 'Cymbal Home',
    category: CATEGORIES.HOME_GARDEN,
    subcategory: SUBCATEGORIES.OUTDOOR,
    images: ['/products/banner-1.jpg'],
    price: createMoney(49.99),
    attributes: { size: '3ft x 6ft', material: 'Vinyl', mounting: 'Grommets included' },
    inventory: { in_stock: false, quantity: 0, backorder_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() }, // Backorder!
    shipping: { weight: 800, dimensions: { length: 100, width: 20, height: 20 }, shipping_class: 'oversize', free_shipping_eligible: false, requires_shipping: true },
    tags: ['banner', 'outdoor', 'business', 'bitcoin accepted'],
    rating: 4.3,
    review_count: 78,
    sku: generateSKU(CATEGORIES.HOME_GARDEN, 20),
    created_at: now,
    updated_at: now,
  },
];

// ============================================================================
// DIGITAL GOODS (5 SKUs)
// ============================================================================

const DIGITAL_PRODUCTS: UCPProduct[] = [
  {
    id: 'trading-course-beginner',
    name: 'Crypto Trading 101 - Video Course',
    description: 'Complete beginner course covering technical analysis, risk management, and trading psychology. 20+ hours of content.',
    brand: 'Cymbal Academy',
    category: CATEGORIES.DIGITAL,
    subcategory: SUBCATEGORIES.COURSES,
    images: ['/products/course-trading-1.jpg'],
    price: createMoney(99.99),
    compare_at_price: createMoney(199.99),
    attributes: { format: 'Video (MP4)', duration: '20+ hours', access: 'Lifetime' },
    inventory: { in_stock: true, quantity: 9999 }, // Unlimited digital
    shipping: { weight: 0, shipping_class: 'digital', free_shipping_eligible: true, requires_shipping: false },
    tags: ['course', 'trading', 'education', 'beginner', 'digital'],
    rating: 4.8,
    review_count: 1234,
    sku: generateSKU(CATEGORIES.DIGITAL, 1),
    created_at: now,
    updated_at: now,
  },
  {
    id: 'defi-masterclass',
    name: 'DeFi Masterclass - Advanced Course',
    description: 'Deep dive into decentralized finance. Learn yield farming, liquidity provision, and protocol analysis.',
    brand: 'Cymbal Academy',
    category: CATEGORIES.DIGITAL,
    subcategory: SUBCATEGORIES.COURSES,
    images: ['/products/course-defi-1.jpg'],
    price: createMoney(149.99),
    attributes: { format: 'Video (MP4)', duration: '15+ hours', access: 'Lifetime' },
    inventory: { in_stock: true, quantity: 9999 },
    shipping: { weight: 0, shipping_class: 'digital', free_shipping_eligible: true, requires_shipping: false },
    tags: ['course', 'defi', 'education', 'advanced', 'digital'],
    rating: 4.7,
    review_count: 567,
    sku: generateSKU(CATEGORIES.DIGITAL, 2),
    created_at: now,
    updated_at: now,
  },
  {
    id: 'trading-ebook-bundle',
    name: 'Crypto Trading eBook Bundle (5 Books)',
    description: 'Collection of 5 essential trading eBooks covering charts, indicators, psychology, and strategy.',
    brand: 'Cymbal Publishing',
    category: CATEGORIES.DIGITAL,
    subcategory: SUBCATEGORIES.EBOOKS,
    images: ['/products/ebook-bundle-1.jpg'],
    price: createMoney(29.99),
    compare_at_price: createMoney(49.99),
    attributes: { format: 'PDF + EPUB', pages: '500+ total', books: '5' },
    inventory: { in_stock: true, quantity: 9999 },
    shipping: { weight: 0, shipping_class: 'digital', free_shipping_eligible: true, requires_shipping: false },
    tags: ['ebook', 'trading', 'bundle', 'digital'],
    rating: 4.5,
    review_count: 345,
    sku: generateSKU(CATEGORIES.DIGITAL, 10),
    created_at: now,
    updated_at: now,
  },
  {
    id: 'portfolio-tracker-pro',
    name: 'Portfolio Tracker Pro - 1 Year License',
    description: 'Professional portfolio tracking software with tax reporting, alerts, and analytics.',
    brand: 'Cymbal Software',
    category: CATEGORIES.DIGITAL,
    subcategory: SUBCATEGORIES.SOFTWARE,
    images: ['/products/software-tracker-1.jpg'],
    price: createMoney(79.99),
    attributes: { platform: 'Windows, Mac, Web', license: '1 Year', exchanges: '100+' },
    inventory: { in_stock: true, quantity: 9999 },
    shipping: { weight: 0, shipping_class: 'digital', free_shipping_eligible: true, requires_shipping: false },
    tags: ['software', 'portfolio', 'tracker', 'tax', 'digital'],
    rating: 4.6,
    review_count: 234,
    sku: generateSKU(CATEGORIES.DIGITAL, 20),
    created_at: now,
    updated_at: now,
  },
];

// ============================================================================
// SUBSCRIPTIONS (5 SKUs)
// ============================================================================

const SUBSCRIPTION_PRODUCTS: UCPProduct[] = [
  {
    id: 'signals-monthly',
    name: 'Trading Signals - Monthly',
    description: 'Daily trading signals with entry, take-profit, and stop-loss levels. 70%+ win rate.',
    brand: 'Cymbal Signals',
    category: CATEGORIES.SUBSCRIPTIONS,
    images: ['/products/signals-1.jpg'],
    price: createMoney(49.99),
    attributes: { billing: 'Monthly', signals: 'Daily', delivery: 'Telegram + Email' },
    inventory: { in_stock: true, quantity: 9999 },
    shipping: { weight: 0, shipping_class: 'digital', free_shipping_eligible: true, requires_shipping: false },
    tags: ['subscription', 'signals', 'trading', 'monthly'],
    rating: 4.4,
    review_count: 678,
    sku: generateSKU(CATEGORIES.SUBSCRIPTIONS, 1),
    created_at: now,
    updated_at: now,
  },
  {
    id: 'signals-yearly',
    name: 'Trading Signals - Yearly (Save 40%)',
    description: 'Full year of trading signals at a discounted rate. Best value for serious traders.',
    brand: 'Cymbal Signals',
    category: CATEGORIES.SUBSCRIPTIONS,
    images: ['/products/signals-1.jpg'],
    price: createMoney(359.99),
    compare_at_price: createMoney(599.88), // 12 x 49.99
    attributes: { billing: 'Yearly', signals: 'Daily', delivery: 'Telegram + Email', savings: '40%' },
    inventory: { in_stock: true, quantity: 9999 },
    shipping: { weight: 0, shipping_class: 'digital', free_shipping_eligible: true, requires_shipping: false },
    tags: ['subscription', 'signals', 'trading', 'yearly', 'bestseller'],
    rating: 4.6,
    review_count: 234,
    sku: generateSKU(CATEGORIES.SUBSCRIPTIONS, 2),
    created_at: now,
    updated_at: now,
  },
  {
    id: 'newsletter-premium',
    name: 'Crypto Insights Newsletter - Premium',
    description: 'Weekly deep-dive analysis, market outlook, and exclusive research reports.',
    brand: 'Cymbal Research',
    category: CATEGORIES.SUBSCRIPTIONS,
    images: ['/products/newsletter-1.jpg'],
    price: createMoney(19.99),
    attributes: { billing: 'Monthly', frequency: 'Weekly', format: 'Email + PDF' },
    inventory: { in_stock: true, quantity: 9999 },
    shipping: { weight: 0, shipping_class: 'digital', free_shipping_eligible: true, requires_shipping: false },
    tags: ['subscription', 'newsletter', 'research', 'analysis'],
    rating: 4.7,
    review_count: 456,
    sku: generateSKU(CATEGORIES.SUBSCRIPTIONS, 10),
    created_at: now,
    updated_at: now,
  },
];

// ============================================================================
// Combined Catalog
// ============================================================================

// Combine all products
const ALL_PRODUCTS: UCPProduct[] = [
  ...APPAREL_PRODUCTS,
  ...ELECTRONICS_PRODUCTS,
  ...HOME_PRODUCTS,
  ...DIGITAL_PRODUCTS,
  ...SUBSCRIPTION_PRODUCTS,
];

// Update all products to use placeholder images for demo
// This ensures consistent, working images without requiring generated images
export const PRODUCT_CATALOG: UCPProduct[] = ALL_PRODUCTS.map((product) => ({
  ...product,
  images: generateProductImages(product.id, product.category, product.images.length || 2),
}));

// Index by ID for fast lookup
export const PRODUCT_BY_ID = new Map<string, UCPProduct>(
  PRODUCT_CATALOG.map((product) => [product.id, product])
);

// ============================================================================
// Catalog Service Functions
// ============================================================================

export interface ProductSearchFilters {
  category?: string;
  subcategory?: string;
  min_price?: number;
  max_price?: number;
  in_stock_only?: boolean;
  tags?: string[];
  brand?: string;
}

export interface ProductSearchResult {
  products: UCPProduct[];
  total: number;
  page: number;
  per_page: number;
  filters_applied: ProductSearchFilters;
}

/**
 * Search products by query and filters
 */
export function searchProducts(
  query: string = '',
  filters: ProductSearchFilters = {},
  page: number = 1,
  perPage: number = 20
): ProductSearchResult {
  let results = [...PRODUCT_CATALOG];
  const queryLower = query.toLowerCase().trim();

  // Text search
  if (queryLower) {
    results = results.filter((product) => {
      const searchText = [
        product.name,
        product.description,
        product.brand,
        product.category,
        product.subcategory,
        ...product.tags,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchText.includes(queryLower);
    });
  }

  // Apply filters
  if (filters.category) {
    results = results.filter((p) => p.category === filters.category);
  }
  if (filters.subcategory) {
    results = results.filter((p) => p.subcategory === filters.subcategory);
  }
  if (filters.min_price !== undefined) {
    results = results.filter((p) => parseFloat(p.price.amount) >= filters.min_price!);
  }
  if (filters.max_price !== undefined) {
    results = results.filter((p) => parseFloat(p.price.amount) <= filters.max_price!);
  }
  if (filters.in_stock_only) {
    results = results.filter((p) => p.inventory.in_stock);
  }
  if (filters.tags && filters.tags.length > 0) {
    results = results.filter((p) => filters.tags!.some((tag) => p.tags.includes(tag)));
  }
  if (filters.brand) {
    results = results.filter((p) => p.brand?.toLowerCase() === filters.brand!.toLowerCase());
  }

  // Pagination
  const total = results.length;
  const startIndex = (page - 1) * perPage;
  const paginatedResults = results.slice(startIndex, startIndex + perPage);

  return {
    products: paginatedResults,
    total,
    page,
    per_page: perPage,
    filters_applied: filters,
  };
}

/**
 * Get a single product by ID
 */
export function getProductById(productId: string): UCPProduct | undefined {
  return PRODUCT_BY_ID.get(productId);
}

/**
 * Get variant from product
 */
export function getProductVariant(
  productId: string,
  variantId: string
): UCPProductVariant | undefined {
  const product = getProductById(productId);
  if (!product || !product.variants) return undefined;
  return product.variants.find((v) => v.id === variantId);
}

/**
 * Get all categories
 */
export function getCategories(): string[] {
  return Object.values(CATEGORIES);
}

/**
 * Get subcategories for a category
 */
export function getSubcategories(category: string): string[] {
  const subcats = new Set<string>();
  for (const product of PRODUCT_CATALOG) {
    if (product.category === category && product.subcategory) {
      subcats.add(product.subcategory);
    }
  }
  return Array.from(subcats);
}

/**
 * Get all available brands
 */
export function getBrands(): string[] {
  const brands = new Set<string>();
  for (const product of PRODUCT_CATALOG) {
    if (product.brand) {
      brands.add(product.brand);
    }
  }
  return Array.from(brands);
}

/**
 * Get featured/bestseller products
 */
export function getFeaturedProducts(limit: number = 10): UCPProduct[] {
  return PRODUCT_CATALOG.filter((p) => p.tags.includes('bestseller')).slice(0, limit);
}

/**
 * Get products on sale
 */
export function getSaleProducts(limit: number = 10): UCPProduct[] {
  return PRODUCT_CATALOG.filter((p) => p.compare_at_price !== undefined).slice(0, limit);
}
