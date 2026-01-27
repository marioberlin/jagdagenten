/**
 * UCP REST API Routes
 *
 * Simplified REST endpoints for the UCP commerce service.
 * Provides an alternative to the JSON-RPC A2A interface for easier frontend integration.
 */
import { Elysia, t } from 'elysia';
import {
  handleAction,
  getOrCreateSession,
  searchProductsForCheckout,
  getProductDetails,
  completeCheckout,
} from '../services/ucp/commerce-service.js';
import { getAvailableShippingMethods } from '../services/ucp/pricing-engine.js';
import { getCurrencyInfo, CURRENCY_CONFIG } from '../services/ucp/currency-localization.js';
import type { UCPActionInput, UCPPaymentData } from '../services/ucp/types.js';

export const ucpApiRoutes = new Elysia({ prefix: '/api/ucp' })

  // Get currency info based on client IP
  .get('/currency', async ({ request, headers }) => {
    // Get client IP from headers (handles proxies) or connection
    const forwardedFor = headers['x-forwarded-for'];
    const realIp = headers['x-real-ip'];
    const ip = (forwardedFor?.split(',')[0]?.trim()) || realIp || '127.0.0.1';

    const currencyInfo = await getCurrencyInfo(ip);

    return {
      success: true,
      ...currencyInfo,
      config: CURRENCY_CONFIG[currencyInfo.currency] || { symbol: currencyInfo.currency, position: 'before', decimals: 2 },
    };
  })

  // Get or create session with checkout
  .get('/session/:contextId', async ({ params }) => {
    const session = getOrCreateSession(params.contextId);
    return {
      success: true,
      session: {
        id: session.id,
        context_id: session.context_id,
        checkout: session.checkout,
      },
    };
  })

  // Search products
  .get('/products', async ({ query }) => {
    const { q, category, min_price, max_price, brand, in_stock, limit, offset } = query;
    const results = searchProductsForCheckout(q || '', {
      category: category as string | undefined,
      min_price: min_price ? parseFloat(min_price as string) : undefined,
      max_price: max_price ? parseFloat(max_price as string) : undefined,
      brand: brand as string | undefined,
      in_stock_only: in_stock === 'true',
      limit: limit ? parseInt(limit as string, 10) : 20,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });
    return {
      success: true,
      products: results.products,
      total: results.total,
      query: q,
    };
  })

  // Get product details
  .get('/products/:productId', async ({ params }) => {
    const product = getProductDetails(params.productId);
    if (!product) {
      return { success: false, error: 'Product not found' };
    }
    return { success: true, product };
  })

  // Get checkout
  .get('/checkout/:contextId', async ({ params }) => {
    const session = getOrCreateSession(params.contextId);
    return {
      success: true,
      checkout: session.checkout,
      shipping_methods: session.checkout ? getAvailableShippingMethods(session.checkout) : [],
    };
  })

  // Add item to checkout
  .post('/checkout/:contextId/items', async ({ params, body }) => {
    const { product_id, quantity, variant_id } = body as {
      product_id: string;
      quantity?: number;
      variant_id?: string;
    };

    const result = await handleAction(params.contextId, {
      action: 'add_to_checkout',
      product_id,
      quantity: quantity || 1,
      variant_id,
    });

    return {
      success: result.success,
      checkout: result.checkout,
      message: result.message,
      error: result.error,
    };
  })

  // Remove item from checkout
  .delete('/checkout/:contextId/items/:productId', async ({ params }) => {
    const result = await handleAction(params.contextId, {
      action: 'remove_from_checkout',
      product_id: params.productId,
    });

    return {
      success: result.success,
      checkout: result.checkout,
      message: result.message,
    };
  })

  // Update item quantity
  .patch('/checkout/:contextId/items/:productId', async ({ params, body }) => {
    const { quantity } = body as { quantity: number };

    const result = await handleAction(params.contextId, {
      action: 'update_quantity',
      product_id: params.productId,
      quantity,
    });

    return {
      success: result.success,
      checkout: result.checkout,
      message: result.message,
    };
  })

  // Apply discount code
  .post('/checkout/:contextId/discounts', async ({ params, body }) => {
    const { code } = body as { code: string };

    const result = await handleAction(params.contextId, {
      action: 'apply_discount',
      discount_code: code,
    });

    return {
      success: result.success,
      checkout: result.checkout,
      message: result.message,
      error: result.error,
    };
  })

  // Remove discount code
  .delete('/checkout/:contextId/discounts/:code', async ({ params }) => {
    const result = await handleAction(params.contextId, {
      action: 'remove_discount',
      discount_code: params.code,
    });

    return {
      success: result.success,
      checkout: result.checkout,
      message: result.message,
    };
  })

  // Set shipping method
  .post('/checkout/:contextId/shipping', async ({ params, body }) => {
    const { method_id } = body as { method_id: string };

    const result = await handleAction(params.contextId, {
      action: 'set_shipping',
      shipping_method: method_id,
    });

    return {
      success: result.success,
      checkout: result.checkout,
      message: result.message,
      shipping_methods: result.shipping_methods,
    };
  })

  // Get available shipping methods
  .get('/checkout/:contextId/shipping', async ({ params }) => {
    const session = getOrCreateSession(params.contextId);
    if (!session.checkout) {
      return { success: false, error: 'No checkout found', shipping_methods: [] };
    }
    const methods = getAvailableShippingMethods(session.checkout);
    return { success: true, shipping_methods: methods };
  })

  // Set shipping address
  .post('/checkout/:contextId/address', async ({ params, body }) => {
    const result = await handleAction(params.contextId, {
      action: 'set_address',
      address: body as any,
    });

    return {
      success: result.success,
      checkout: result.checkout,
      message: result.message,
    };
  })

  // Complete checkout
  .post('/checkout/:contextId/complete', async ({ params, body }) => {
    const { payment_token } = body as { payment_token?: string };
    const session = getOrCreateSession(params.contextId);

    if (!session.checkout) {
      return { success: false, error: 'No checkout to complete' };
    }

    // For demo purposes, use a test token if none provided
    const paymentData: UCPPaymentData = {
      type: 'token',
      token: payment_token || 'tok_demo_success',
      billing_address: session.checkout.billing_address || session.checkout.shipping_address,
    };

    try {
      const checkout = await completeCheckout(session, paymentData);
      return {
        success: true,
        checkout,
        order: checkout.order,
        message: `Order ${checkout.order?.order_number} confirmed!`,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });
