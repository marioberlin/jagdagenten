/**
 * UCP Commerce Service
 *
 * Manages checkout state and orchestrates all commerce operations.
 * This is the main entry point for UCP checkout functionality.
 */

import { randomUUID } from 'crypto';
import {
  type UCPCheckout,
  type UCPLineItem,
  type UCPAddress,
  type UCPCustomer,
  type UCPOrder,
  type UCPPaymentData,
  type UCPRiskSignals,
  type UCPSession,
  type UCPActionInput,
  type UCPProduct,
  createMoney,
  moneyToNumber,
  UCPException,
  UCP_ERROR_CODES,
} from './types.js';
import {
  getProductById,
  getProductVariant,
  searchProducts,
  type ProductSearchFilters,
  type ProductSearchResult,
} from './product-catalog.js';
import {
  recalculateCheckout,
  validateDiscount,
  calculateDiscountAmount,
  getDiscountByCode,
  getAvailableShippingMethods,
  calculateShipping,
  type UCPShippingMethod,
} from './pricing-engine.js';
import { processPayment, type ProcessPaymentOptions } from './payment-adapter.js';

// ============================================================================
// Session Store (In-Memory for Demo)
// ============================================================================

// In production, this would use PostgreSQL/Redis
const sessions = new Map<string, UCPSession>();

/**
 * Get or create a session for a context ID
 */
export function getOrCreateSession(contextId: string, metadata?: Partial<UCPSession['metadata']>): UCPSession {
  let session = sessions.get(contextId);

  if (!session) {
    session = {
      id: randomUUID(),
      context_id: contextId,
      checkout: undefined,
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      metadata: metadata || {},
    };
    sessions.set(contextId, session);
  } else if (metadata) {
    session.metadata = { ...session.metadata, ...metadata };
    session.updated_at = new Date();
  }

  return session;
}

/**
 * Get session by context ID
 */
export function getSession(contextId: string): UCPSession | undefined {
  return sessions.get(contextId);
}

/**
 * Update session
 */
export function updateSession(session: UCPSession): void {
  session.updated_at = new Date();
  sessions.set(session.context_id, session);
}

/**
 * Delete session
 */
export function deleteSession(contextId: string): void {
  sessions.delete(contextId);
}

// ============================================================================
// Checkout Management
// ============================================================================

/**
 * Create a new checkout for a session
 */
export function createCheckout(session: UCPSession, currency: string = 'USD'): UCPCheckout {
  const checkout: UCPCheckout = {
    id: randomUUID(),
    status: 'draft',
    currency,
    line_items: [],
    item_count: 0,
    subtotal: createMoney(0, currency),
    discounts: [],
    discount_total: createMoney(0, currency),
    shipping: undefined,
    shipping_total: createMoney(0, currency),
    tax_lines: [],
    tax_total: createMoney(0, currency),
    total: createMoney(0, currency),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
  };

  session.checkout = checkout;
  updateSession(session);

  return checkout;
}

/**
 * Get checkout for a session, creating if needed
 */
export function getOrCreateCheckout(session: UCPSession): UCPCheckout {
  if (!session.checkout) {
    return createCheckout(session);
  }

  // Check if checkout expired
  if (session.checkout.expires_at && new Date(session.checkout.expires_at) < new Date()) {
    session.checkout.status = 'expired';
    return createCheckout(session);
  }

  return session.checkout;
}

/**
 * Add item to checkout
 */
export function addItemToCheckout(
  session: UCPSession,
  productId: string,
  quantity: number = 1,
  variantId?: string
): UCPCheckout {
  const checkout = getOrCreateCheckout(session);

  // Validate checkout can be modified
  if (checkout.status !== 'draft') {
    throw new UCPException(
      UCP_ERROR_CODES.CHECKOUT_ALREADY_COMPLETED,
      'Cannot modify a checkout that is not in draft status'
    );
  }

  // Get product
  const product = getProductById(productId);
  if (!product) {
    throw new UCPException(UCP_ERROR_CODES.PRODUCT_NOT_FOUND, `Product "${productId}" not found`);
  }

  // Get variant if specified
  let variant = variantId ? getProductVariant(productId, variantId) : undefined;

  // If product has variants but none specified, use first in-stock variant
  if (product.variants && product.variants.length > 0 && !variant) {
    variant = product.variants.find((v) => v.inventory.in_stock);
    if (!variant) {
      throw new UCPException(
        UCP_ERROR_CODES.OUT_OF_STOCK,
        `All variants of "${product.name}" are out of stock`
      );
    }
  }

  // Check inventory
  const inventory = variant?.inventory || product.inventory;
  if (!inventory.in_stock) {
    throw new UCPException(UCP_ERROR_CODES.OUT_OF_STOCK, `"${product.name}" is out of stock`);
  }
  if (inventory.quantity < quantity) {
    throw new UCPException(
      UCP_ERROR_CODES.INSUFFICIENT_QUANTITY,
      `Only ${inventory.quantity} units of "${product.name}" available`
    );
  }

  // Determine price
  const price = variant?.price || product.price;
  const unitPrice = moneyToNumber(price);

  // Check if item already in cart
  const existingItemIndex = checkout.line_items.findIndex(
    (item) => item.product_id === productId && item.variant_id === variantId
  );

  if (existingItemIndex >= 0) {
    // Update quantity
    const existingItem = checkout.line_items[existingItemIndex];
    const newQuantity = existingItem.quantity + quantity;

    // Check inventory for new quantity
    if (inventory.quantity < newQuantity) {
      throw new UCPException(
        UCP_ERROR_CODES.INSUFFICIENT_QUANTITY,
        `Only ${inventory.quantity} units of "${product.name}" available`
      );
    }

    existingItem.quantity = newQuantity;
    existingItem.total_price = createMoney(unitPrice * newQuantity, checkout.currency);
  } else {
    // Add new line item
    const lineItem: UCPLineItem = {
      id: randomUUID(),
      product_id: productId,
      variant_id: variantId,
      name: variant ? `${product.name} - ${variant.name}` : product.name,
      description: product.description.substring(0, 100),
      image_url: variant?.images?.[0] || product.images[0],
      sku: variant?.sku || product.sku,
      quantity,
      unit_price: createMoney(unitPrice, checkout.currency),
      total_price: createMoney(unitPrice * quantity, checkout.currency),
      attributes: variant?.attributes || {},
    };

    checkout.line_items.push(lineItem);
  }

  // Recalculate totals
  session.checkout = recalculateCheckout(checkout);
  updateSession(session);

  return session.checkout;
}

/**
 * Remove item from checkout
 */
export function removeItemFromCheckout(
  session: UCPSession,
  productId: string,
  variantId?: string
): UCPCheckout {
  const checkout = getOrCreateCheckout(session);

  if (checkout.status !== 'draft') {
    throw new UCPException(
      UCP_ERROR_CODES.CHECKOUT_ALREADY_COMPLETED,
      'Cannot modify a checkout that is not in draft status'
    );
  }

  const itemIndex = checkout.line_items.findIndex(
    (item) => item.product_id === productId && item.variant_id === variantId
  );

  if (itemIndex < 0) {
    throw new UCPException(UCP_ERROR_CODES.PRODUCT_NOT_FOUND, 'Item not found in cart');
  }

  checkout.line_items.splice(itemIndex, 1);

  session.checkout = recalculateCheckout(checkout);
  updateSession(session);

  return session.checkout;
}

/**
 * Update item quantity
 */
export function updateItemQuantity(
  session: UCPSession,
  productId: string,
  quantity: number,
  variantId?: string
): UCPCheckout {
  const checkout = getOrCreateCheckout(session);

  if (checkout.status !== 'draft') {
    throw new UCPException(
      UCP_ERROR_CODES.CHECKOUT_ALREADY_COMPLETED,
      'Cannot modify a checkout that is not in draft status'
    );
  }

  if (quantity <= 0) {
    return removeItemFromCheckout(session, productId, variantId);
  }

  const item = checkout.line_items.find(
    (i) => i.product_id === productId && i.variant_id === variantId
  );

  if (!item) {
    throw new UCPException(UCP_ERROR_CODES.PRODUCT_NOT_FOUND, 'Item not found in cart');
  }

  // Check inventory
  const product = getProductById(productId);
  const variant = variantId ? getProductVariant(productId, variantId) : undefined;
  const inventory = variant?.inventory || product?.inventory;

  if (inventory && inventory.quantity < quantity) {
    throw new UCPException(
      UCP_ERROR_CODES.INSUFFICIENT_QUANTITY,
      `Only ${inventory.quantity} units available`
    );
  }

  item.quantity = quantity;
  item.total_price = createMoney(moneyToNumber(item.unit_price) * quantity, checkout.currency);

  session.checkout = recalculateCheckout(checkout);
  updateSession(session);

  return session.checkout;
}

/**
 * Apply discount code
 */
export function applyDiscountCode(session: UCPSession, code: string): UCPCheckout {
  const checkout = getOrCreateCheckout(session);

  if (checkout.status !== 'draft') {
    throw new UCPException(
      UCP_ERROR_CODES.CHECKOUT_ALREADY_COMPLETED,
      'Cannot modify a checkout that is not in draft status'
    );
  }

  const validation = validateDiscount(code, checkout);

  if (!validation.valid || !validation.discount) {
    throw new UCPException(UCP_ERROR_CODES.INVALID_DISCOUNT_CODE, validation.error || 'Invalid discount code');
  }

  const appliedDiscount = calculateDiscountAmount(validation.discount, checkout);
  checkout.discounts.push(appliedDiscount);

  session.checkout = recalculateCheckout(checkout);
  updateSession(session);

  return session.checkout;
}

/**
 * Remove discount code
 */
export function removeDiscountCode(session: UCPSession, code: string): UCPCheckout {
  const checkout = getOrCreateCheckout(session);

  if (checkout.status !== 'draft') {
    throw new UCPException(
      UCP_ERROR_CODES.CHECKOUT_ALREADY_COMPLETED,
      'Cannot modify a checkout that is not in draft status'
    );
  }

  const discountIndex = checkout.discounts.findIndex(
    (d) => d.code.toUpperCase() === code.toUpperCase()
  );

  if (discountIndex < 0) {
    throw new UCPException(UCP_ERROR_CODES.INVALID_DISCOUNT_CODE, 'Discount code not applied');
  }

  checkout.discounts.splice(discountIndex, 1);

  session.checkout = recalculateCheckout(checkout);
  updateSession(session);

  return session.checkout;
}

/**
 * Set shipping method
 */
export function setShippingMethod(session: UCPSession, methodId: string): UCPCheckout {
  const checkout = getOrCreateCheckout(session);

  if (checkout.status !== 'draft') {
    throw new UCPException(
      UCP_ERROR_CODES.CHECKOUT_ALREADY_COMPLETED,
      'Cannot modify a checkout that is not in draft status'
    );
  }

  // Validate method is available
  const availableMethods = getAvailableShippingMethods(checkout);
  const method = availableMethods.find((m) => m.id === methodId);

  if (!method) {
    throw new UCPException(
      UCP_ERROR_CODES.INVALID_SHIPPING_METHOD,
      `Shipping method "${methodId}" is not available for this order`
    );
  }

  checkout.shipping = calculateShipping(methodId, checkout);

  session.checkout = recalculateCheckout(checkout);
  updateSession(session);

  return session.checkout;
}

/**
 * Set shipping address
 */
export function setShippingAddress(session: UCPSession, address: UCPAddress): UCPCheckout {
  const checkout = getOrCreateCheckout(session);

  if (checkout.status !== 'draft') {
    throw new UCPException(
      UCP_ERROR_CODES.CHECKOUT_ALREADY_COMPLETED,
      'Cannot modify a checkout that is not in draft status'
    );
  }

  checkout.shipping_address = address;

  // Update customer if email provided
  if (address.email) {
    checkout.customer = {
      ...(checkout.customer || { is_guest: true, email: address.email }),
      email: address.email,
      first_name: address.first_name,
      last_name: address.last_name,
      phone: address.phone,
      shipping_address: address,
    };
  }

  session.checkout = recalculateCheckout(checkout);
  updateSession(session);

  return session.checkout;
}

/**
 * Complete checkout (process payment)
 */
export async function completeCheckout(
  session: UCPSession,
  paymentData: UCPPaymentData,
  riskSignals?: UCPRiskSignals
): Promise<UCPCheckout> {
  const checkout = session.checkout;

  if (!checkout) {
    throw new UCPException(UCP_ERROR_CODES.CHECKOUT_NOT_FOUND, 'No checkout found');
  }

  if (checkout.status === 'completed') {
    throw new UCPException(
      UCP_ERROR_CODES.CHECKOUT_ALREADY_COMPLETED,
      'This checkout has already been completed'
    );
  }

  if (checkout.status === 'expired') {
    throw new UCPException(UCP_ERROR_CODES.CHECKOUT_EXPIRED, 'This checkout has expired');
  }

  if (checkout.line_items.length === 0) {
    throw new UCPException(UCP_ERROR_CODES.INVALID_ACTION, 'Cannot complete checkout with no items');
  }

  // Require shipping for physical goods
  const hasPhysicalGoods = checkout.line_items.some((item) => {
    const product = getProductById(item.product_id);
    return product?.shipping.requires_shipping !== false;
  });

  if (hasPhysicalGoods && !checkout.shipping) {
    throw new UCPException(
      UCP_ERROR_CODES.SHIPPING_NOT_AVAILABLE,
      'Please select a shipping method before completing checkout'
    );
  }

  // Update status to processing
  checkout.status = 'processing';
  updateSession(session);

  // Process payment
  const paymentResult = await processPayment({
    checkout,
    paymentData,
    riskSignals,
  });

  if (!paymentResult.success) {
    checkout.status = 'failed';
    updateSession(session);

    throw new UCPException(
      UCP_ERROR_CODES.PAYMENT_FAILED,
      paymentResult.error_message || 'Payment failed',
      { error_code: paymentResult.error_code }
    );
  }

  // Payment successful - create order
  const order: UCPOrder = {
    id: randomUUID(),
    order_number: `ORD-${Date.now().toString(36).toUpperCase()}`,
    permalink_url: `https://cymbal-outfitters.demo/orders/${randomUUID()}`,
    status: 'confirmed',
    payment_status: 'captured',
    fulfillment_status: hasPhysicalGoods ? 'unfulfilled' : 'fulfilled',
    created_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
  };

  checkout.status = 'completed';
  checkout.order = order;
  checkout.updated_at = new Date().toISOString();

  session.checkout = checkout;
  updateSession(session);

  return checkout;
}

// ============================================================================
// Product Search (Convenience Wrapper)
// ============================================================================

/**
 * Search products with natural language query
 */
export function searchProductsForCheckout(
  query: string,
  filters?: ProductSearchFilters,
  page?: number,
  perPage?: number
): ProductSearchResult {
  return searchProducts(query, filters, page, perPage);
}

/**
 * Get product details
 */
export function getProductDetails(productId: string): UCPProduct | undefined {
  return getProductById(productId);
}

/**
 * Get available shipping methods for session's checkout
 */
export function getShippingOptionsForSession(session: UCPSession): UCPShippingMethod[] {
  const checkout = session.checkout;
  if (!checkout || checkout.line_items.length === 0) {
    return [];
  }
  return getAvailableShippingMethods(checkout);
}

// ============================================================================
// Action Handler (for A2A Integration)
// ============================================================================

export interface ActionResult {
  success: boolean;
  checkout?: UCPCheckout;
  products?: UCPProduct[];
  product?: UCPProduct;
  shipping_methods?: UCPShippingMethod[];
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  message: string;
}

/**
 * Handle a UCP action from an A2A message
 */
export async function handleAction(
  contextId: string,
  action: UCPActionInput,
  metadata?: Partial<UCPSession['metadata']>
): Promise<ActionResult> {
  const session = getOrCreateSession(contextId, metadata);

  try {
    switch (action.action) {
      case 'search_products': {
        const results = searchProductsForCheckout(
          action.search_query || '',
          action.search_filters as ProductSearchFilters
        );
        return {
          success: true,
          products: results.products,
          message: results.total > 0
            ? `Found ${results.total} product${results.total !== 1 ? 's' : ''}`
            : 'No products found matching your search',
        };
      }

      case 'get_product': {
        if (!action.product_id) {
          return {
            success: false,
            error: { code: UCP_ERROR_CODES.INVALID_ACTION, message: 'Product ID required' },
            message: 'Please specify which product you want to see',
          };
        }
        const product = getProductDetails(action.product_id);
        if (!product) {
          return {
            success: false,
            error: { code: UCP_ERROR_CODES.PRODUCT_NOT_FOUND, message: 'Product not found' },
            message: `Product "${action.product_id}" not found`,
          };
        }
        return {
          success: true,
          product,
          message: `Here are the details for ${product.name}`,
        };
      }

      case 'add_to_checkout': {
        if (!action.product_id) {
          return {
            success: false,
            error: { code: UCP_ERROR_CODES.INVALID_ACTION, message: 'Product ID required' },
            message: 'Please specify which product to add',
          };
        }
        const checkout = addItemToCheckout(
          session,
          action.product_id,
          action.quantity || 1,
          action.variant_id
        );
        const product = getProductById(action.product_id);
        return {
          success: true,
          checkout,
          message: `Added ${action.quantity || 1}x ${product?.name || action.product_id} to your cart`,
        };
      }

      case 'remove_from_checkout': {
        if (!action.product_id) {
          return {
            success: false,
            error: { code: UCP_ERROR_CODES.INVALID_ACTION, message: 'Product ID required' },
            message: 'Please specify which product to remove',
          };
        }
        const checkout = removeItemFromCheckout(session, action.product_id, action.variant_id);
        return {
          success: true,
          checkout,
          message: 'Item removed from your cart',
        };
      }

      case 'update_quantity': {
        if (!action.product_id || action.quantity === undefined) {
          return {
            success: false,
            error: { code: UCP_ERROR_CODES.INVALID_ACTION, message: 'Product ID and quantity required' },
            message: 'Please specify the product and new quantity',
          };
        }
        const checkout = updateItemQuantity(
          session,
          action.product_id,
          action.quantity,
          action.variant_id
        );
        return {
          success: true,
          checkout,
          message: `Updated quantity to ${action.quantity}`,
        };
      }

      case 'apply_discount': {
        if (!action.discount_code) {
          return {
            success: false,
            error: { code: UCP_ERROR_CODES.INVALID_ACTION, message: 'Discount code required' },
            message: 'Please enter a discount code',
          };
        }
        const checkout = applyDiscountCode(session, action.discount_code);
        const discount = getDiscountByCode(action.discount_code);
        return {
          success: true,
          checkout,
          message: `Discount "${action.discount_code}" applied: ${discount?.description || 'Discount applied'}`,
        };
      }

      case 'remove_discount': {
        if (!action.discount_code) {
          return {
            success: false,
            error: { code: UCP_ERROR_CODES.INVALID_ACTION, message: 'Discount code required' },
            message: 'Please specify which discount to remove',
          };
        }
        const checkout = removeDiscountCode(session, action.discount_code);
        return {
          success: true,
          checkout,
          message: 'Discount removed',
        };
      }

      case 'set_shipping': {
        if (!action.shipping_method) {
          // Return available methods
          const methods = getShippingOptionsForSession(session);
          return {
            success: true,
            shipping_methods: methods,
            checkout: session.checkout,
            message: methods.length > 0
              ? `Available shipping methods: ${methods.map((m) => m.name).join(', ')}`
              : 'No shipping required for your order',
          };
        }
        const checkout = setShippingMethod(session, action.shipping_method);
        return {
          success: true,
          checkout,
          message: `Shipping method set to ${checkout.shipping?.method_name || action.shipping_method}`,
        };
      }

      case 'set_address': {
        if (!action.address) {
          return {
            success: false,
            error: { code: UCP_ERROR_CODES.INVALID_ACTION, message: 'Address required' },
            message: 'Please provide a shipping address',
          };
        }
        const checkout = setShippingAddress(session, action.address);
        return {
          success: true,
          checkout,
          message: 'Shipping address updated',
        };
      }

      case 'get_checkout': {
        const checkout = getOrCreateCheckout(session);
        return {
          success: true,
          checkout,
          message: checkout.line_items.length > 0
            ? `Your cart has ${checkout.item_count} item${checkout.item_count !== 1 ? 's' : ''} totaling $${checkout.total.amount}`
            : 'Your cart is empty',
        };
      }

      case 'complete_checkout': {
        // This requires payment_data from a separate DataPart
        // The executor will handle extracting payment_data
        return {
          success: false,
          error: {
            code: UCP_ERROR_CODES.INVALID_ACTION,
            message: 'complete_checkout requires payment_data',
          },
          message: 'To complete your purchase, please provide payment information',
        };
      }

      default:
        return {
          success: false,
          error: {
            code: UCP_ERROR_CODES.INVALID_ACTION,
            message: `Unknown action: ${action.action}`,
          },
          message: `I don't understand the action "${action.action}". Try: search_products, add_to_checkout, apply_discount, set_shipping, or complete_checkout`,
        };
    }
  } catch (error) {
    if (error instanceof UCPException) {
      return {
        success: false,
        checkout: session.checkout,
        error: error.toUCPError(),
        message: error.message,
      };
    }

    return {
      success: false,
      checkout: session.checkout,
      error: {
        code: UCP_ERROR_CODES.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      message: 'Sorry, something went wrong. Please try again.',
    };
  }
}
