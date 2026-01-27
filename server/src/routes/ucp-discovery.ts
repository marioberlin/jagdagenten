/**
 * UCP Discovery Endpoints
 *
 * Implements the UCP well-known endpoints for agent discovery:
 * - GET /.well-known/ucp - UCP service manifest
 * - GET /.well-known/agent-card.json - A2A agent card (extended for UCP)
 *
 * Spec: https://ucp.dev/specification/checkout-a2a/
 */

import { Elysia } from 'elysia';
import { UCP_VERSION, UCP_NAMESPACE, UCP_EXTENSION_URI } from '../services/ucp/types.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * UCP Service Manifest
 * Published at /.well-known/ucp
 */
export function getUCPManifest() {
  return {
    ucp: {
      version: UCP_VERSION,
      services: {
        [UCP_NAMESPACE]: {
          version: UCP_VERSION,
          spec: 'https://ucp.dev/specification/overview',
          a2a: {
            endpoint: `${BASE_URL}/.well-known/agent-card.json`,
          },
        },
      },
    },
  };
}

/**
 * UCP-Extended Agent Card
 * Published at /.well-known/agent-card.json
 *
 * This extends the standard A2A agent card with UCP commerce capabilities.
 */
export function getUCPAgentCard(baseUrl: string = BASE_URL) {
  return {
    // A2A Protocol Version
    protocolVersions: ['1.0'],

    // Agent Identity
    name: 'Cymbal Outfitters',
    description:
      'Demo retail store powered by UCP (Universal Commerce Protocol). Browse products, manage your cart, apply discounts, and complete checkout - all through natural conversation.',
    version: '1.0.0',

    // Provider Info
    provider: {
      organization: 'LiquidCrypto Demo',
      url: 'https://liquidcrypto.dev',
    },

    // A2A Interface
    supportedInterfaces: [
      {
        url: `${baseUrl}/a2a`,
        protocolBinding: 'JSONRPC',
      },
    ],

    // Capabilities
    capabilities: {
      streaming: true,
      pushNotifications: false,
      stateTransitionHistory: true,
      extendedAgentCard: true,
      extensions: [
        {
          uri: UCP_EXTENSION_URI,
          description: 'Business agent supporting UCP commerce protocol',
          required: true,
        },
      ],
    },

    // UCP Extension Details
    extensions: {
      ucp: {
        version: UCP_VERSION,
        capabilities: [
          {
            name: 'dev.ucp.shopping.checkout',
            version: UCP_VERSION,
            description: 'Full checkout lifecycle support',
          },
          {
            name: 'dev.ucp.shopping.fulfillment',
            version: UCP_VERSION,
            extends: 'dev.ucp.shopping.checkout',
            description: 'Order fulfillment and tracking',
          },
        ],
        features: {
          guest_checkout: true,
          discount_codes: true,
          multiple_shipping_methods: true,
          tax_calculation: true,
          price_tracking: false,
          wishlists: false,
        },
      },
    },

    // Agent Skills
    skills: [
      {
        id: 'product-search',
        name: 'Product Search',
        description: 'Search and browse the product catalog by name, category, price, or attributes',
        tags: ['shopping', 'search', 'products', 'catalog', 'browse', 'find'],
        examples: [
          'Find running shoes',
          'Show me blue t-shirts under $50',
          'What electronics do you have?',
          'Search for winter jackets in size M',
        ],
        inputModes: ['text/plain'],
        outputModes: ['text/plain', 'application/json'],
      },
      {
        id: 'product-details',
        name: 'Product Details',
        description: 'Get detailed information about a specific product including variants, pricing, and availability',
        tags: ['product', 'details', 'info', 'price', 'stock'],
        examples: [
          'Tell me more about this product',
          'What sizes are available?',
          'Is this in stock?',
          'Show me the product details',
        ],
        inputModes: ['text/plain'],
        outputModes: ['text/plain', 'application/json'],
      },
      {
        id: 'cart-management',
        name: 'Cart Management',
        description: 'Add items to cart, update quantities, remove items, and view cart contents',
        tags: ['cart', 'add', 'remove', 'quantity', 'shopping', 'basket'],
        examples: [
          'Add this to my cart',
          'Add 2 of the blue ones in size M',
          'Remove the t-shirt from my cart',
          'Change quantity to 3',
          "What's in my cart?",
        ],
        inputModes: ['text/plain', 'application/json'],
        outputModes: ['text/plain', 'application/json', 'a2a.ucp.checkout'],
      },
      {
        id: 'discount-codes',
        name: 'Discount Codes',
        description: 'Apply or remove promotional discount codes',
        tags: ['discount', 'promo', 'coupon', 'code', 'offer', 'deal'],
        examples: [
          'Apply code WELCOME10',
          'I have a promo code',
          'Remove the discount',
          'What discounts are available?',
        ],
        inputModes: ['text/plain'],
        outputModes: ['text/plain', 'application/json', 'a2a.ucp.checkout'],
      },
      {
        id: 'shipping',
        name: 'Shipping Options',
        description: 'View and select shipping methods, set delivery address',
        tags: ['shipping', 'delivery', 'address', 'express', 'standard'],
        examples: [
          'What shipping options do you have?',
          'Use express shipping',
          'Ship to my home address',
          'How long will delivery take?',
        ],
        inputModes: ['text/plain', 'application/json'],
        outputModes: ['text/plain', 'application/json', 'a2a.ucp.checkout'],
      },
      {
        id: 'checkout',
        name: 'Checkout',
        description: 'Review order and complete purchase with payment',
        tags: ['checkout', 'payment', 'buy', 'purchase', 'order', 'complete'],
        examples: [
          'Proceed to checkout',
          'Complete my purchase',
          "What's my total?",
          'Review my order',
          'Place the order',
        ],
        inputModes: ['text/plain', 'application/json'],
        outputModes: ['text/plain', 'application/json', 'a2a.ucp.checkout'],
      },
    ],

    // I/O Modes
    defaultInputModes: ['text/plain', 'application/json'],
    defaultOutputModes: ['text/plain', 'application/json', 'a2a.ucp.checkout'],

    // Documentation
    documentationUrl: 'https://ucp.dev/specification/checkout-a2a/',
    iconUrl: `${baseUrl}/assets/cymbal-outfitters-logo.png`,
  };
}

/**
 * Elysia plugin for UCP discovery routes
 */
export const ucpDiscovery = new Elysia({ name: 'ucp-discovery' })
  // UCP Manifest
  .get('/.well-known/ucp', () => getUCPManifest(), {
    detail: {
      summary: 'UCP Service Manifest',
      description: 'Returns the UCP service manifest for agent discovery',
      tags: ['UCP'],
    },
  })

  // Agent Card (UCP-extended)
  .get(
    '/.well-known/agent-card.json',
    ({ headers }) => {
      // Optionally customize based on request headers
      const baseUrl = headers['x-forwarded-host']
        ? `https://${headers['x-forwarded-host']}`
        : BASE_URL;

      return getUCPAgentCard(baseUrl);
    },
    {
      detail: {
        summary: 'A2A Agent Card (UCP Extended)',
        description: 'Returns the A2A agent card with UCP commerce capabilities',
        tags: ['UCP', 'A2A'],
      },
    }
  )

  // Health check for UCP service
  .get(
    '/ucp/health',
    () => ({
      status: 'healthy',
      ucp_version: UCP_VERSION,
      timestamp: new Date().toISOString(),
    }),
    {
      detail: {
        summary: 'UCP Health Check',
        description: 'Returns the health status of the UCP service',
        tags: ['UCP'],
      },
    }
  );

export default ucpDiscovery;
