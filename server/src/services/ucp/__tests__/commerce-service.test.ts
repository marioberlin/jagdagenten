/**
 * Commerce Service Unit Tests
 *
 * Tests for the UCP commerce service including checkout operations,
 * product search, and payment processing.
 */
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import {
  getOrCreateSession,
  getSession,
  deleteSession,
  createCheckout,
  getOrCreateCheckout,
  addItemToCheckout,
  removeItemFromCheckout,
  updateItemQuantity,
  applyDiscountCode,
  removeDiscountCode,
  setShippingMethod,
  setShippingAddress,
  searchProductsForCheckout,
  getProductDetails,
  handleAction,
} from '../commerce-service.js';
import { UCPException, UCP_ERROR_CODES } from '../types.js';

// ============================================================================
// Session Management Tests
// ============================================================================

describe('Session Management', () => {
  const testContextId = 'test-context-123';

  afterEach(() => {
    deleteSession(testContextId);
  });

  it('should create a new session', () => {
    const session = getOrCreateSession(testContextId);

    expect(session).toBeDefined();
    expect(session.context_id).toBe(testContextId);
    expect(session.id).toBeDefined();
    expect(session.checkout).toBeUndefined();
  });

  it('should return existing session', () => {
    const session1 = getOrCreateSession(testContextId);
    const session2 = getOrCreateSession(testContextId);

    expect(session1.id).toBe(session2.id);
  });

  it('should update session metadata', () => {
    getOrCreateSession(testContextId, { source: 'test' });
    const session = getOrCreateSession(testContextId, { userId: 'user-123' });

    expect(session.metadata.source).toBe('test');
    expect(session.metadata.userId).toBe('user-123');
  });

  it('should delete session', () => {
    getOrCreateSession(testContextId);
    deleteSession(testContextId);

    const session = getSession(testContextId);
    expect(session).toBeUndefined();
  });
});

// ============================================================================
// Checkout Management Tests
// ============================================================================

describe('Checkout Management', () => {
  const testContextId = 'checkout-test-context';
  let session: ReturnType<typeof getOrCreateSession>;

  beforeEach(() => {
    session = getOrCreateSession(testContextId);
  });

  afterEach(() => {
    deleteSession(testContextId);
  });

  it('should create a new checkout', () => {
    const checkout = createCheckout(session);

    expect(checkout).toBeDefined();
    expect(checkout.id).toBeDefined();
    expect(checkout.status).toBe('draft');
    expect(checkout.currency).toBe('USD');
    expect(checkout.line_items).toEqual([]);
    expect(checkout.item_count).toBe(0);
  });

  it('should get or create checkout', () => {
    const checkout1 = getOrCreateCheckout(session);
    const checkout2 = getOrCreateCheckout(session);

    expect(checkout1.id).toBe(checkout2.id);
  });

  it('should add item to checkout', () => {
    const checkout = addItemToCheckout(session, 'btc-tshirt-classic', 2);

    expect(checkout.line_items.length).toBe(1);
    expect(checkout.line_items[0].product_id).toBe('btc-tshirt-classic');
    expect(checkout.line_items[0].quantity).toBe(2);
    expect(checkout.item_count).toBe(2);
  });

  it('should update quantity for existing item', () => {
    addItemToCheckout(session, 'btc-tshirt-classic', 1);
    const checkout = addItemToCheckout(session, 'btc-tshirt-classic', 2);

    expect(checkout.line_items.length).toBe(1);
    expect(checkout.line_items[0].quantity).toBe(3);
  });

  it('should throw error for non-existent product', () => {
    expect(() => {
      addItemToCheckout(session, 'non-existent-product', 1);
    }).toThrow(UCPException);
  });

  it('should remove item from checkout', () => {
    addItemToCheckout(session, 'btc-tshirt-classic', 1);
    addItemToCheckout(session, 'eth-tshirt-logo', 1);

    const checkout = removeItemFromCheckout(session, 'btc-tshirt-classic');

    expect(checkout.line_items.length).toBe(1);
    expect(checkout.line_items[0].product_id).toBe('eth-tshirt-logo');
  });

  it('should update item quantity', () => {
    addItemToCheckout(session, 'btc-tshirt-classic', 1);

    const checkout = updateItemQuantity(session, 'btc-tshirt-classic', 5);

    expect(checkout.line_items[0].quantity).toBe(5);
  });

  it('should remove item when quantity set to 0', () => {
    addItemToCheckout(session, 'btc-tshirt-classic', 1);

    const checkout = updateItemQuantity(session, 'btc-tshirt-classic', 0);

    expect(checkout.line_items.length).toBe(0);
  });
});

// ============================================================================
// Discount Tests
// ============================================================================

describe('Discount Management', () => {
  const testContextId = 'discount-test-context';
  let session: ReturnType<typeof getOrCreateSession>;

  beforeEach(() => {
    session = getOrCreateSession(testContextId);
    addItemToCheckout(session, 'btc-tshirt-classic', 2);
  });

  afterEach(() => {
    deleteSession(testContextId);
  });

  it('should apply valid discount code', () => {
    const checkout = applyDiscountCode(session, 'WELCOME10');

    expect(checkout.discounts.length).toBe(1);
    expect(checkout.discounts[0].code).toBe('WELCOME10');
    expect(parseFloat(checkout.discount_total.amount)).toBeGreaterThan(0);
  });

  it('should throw error for invalid discount code', () => {
    expect(() => {
      applyDiscountCode(session, 'INVALID_CODE');
    }).toThrow(UCPException);
  });

  it('should remove discount code', () => {
    applyDiscountCode(session, 'WELCOME10');
    const checkout = removeDiscountCode(session, 'WELCOME10');

    expect(checkout.discounts.length).toBe(0);
  });

  it('should not allow duplicate discount codes', () => {
    applyDiscountCode(session, 'WELCOME10');

    expect(() => {
      applyDiscountCode(session, 'WELCOME10');
    }).toThrow(UCPException);
  });
});

// ============================================================================
// Shipping Tests
// ============================================================================

describe('Shipping Management', () => {
  const testContextId = 'shipping-test-context';
  let session: ReturnType<typeof getOrCreateSession>;

  beforeEach(() => {
    session = getOrCreateSession(testContextId);
    addItemToCheckout(session, 'btc-tshirt-classic', 1);
  });

  afterEach(() => {
    deleteSession(testContextId);
  });

  it('should set shipping method', () => {
    const checkout = setShippingMethod(session, 'standard');

    expect(checkout.shipping).toBeDefined();
    expect(checkout.shipping?.method_id).toBe('standard');
  });

  it('should throw error for invalid shipping method', () => {
    expect(() => {
      setShippingMethod(session, 'invalid-method');
    }).toThrow(UCPException);
  });

  it('should set shipping address', () => {
    const address = {
      first_name: 'John',
      last_name: 'Doe',
      address_line_1: '123 Main St',
      city: 'New York',
      state: 'NY',
      postal_code: '10001',
      country: 'US',
      email: 'john@example.com',
    };

    const checkout = setShippingAddress(session, address);

    expect(checkout.shipping_address).toEqual(address);
    expect(checkout.customer?.email).toBe('john@example.com');
  });
});

// ============================================================================
// Product Search Tests
// ============================================================================

describe('Product Search', () => {
  it('should search products by query', () => {
    const results = searchProductsForCheckout('bitcoin');

    expect(results.products.length).toBeGreaterThan(0);
    expect(results.total).toBeGreaterThan(0);
  });

  it('should return empty results for non-matching query', () => {
    const results = searchProductsForCheckout('xyznonexistent123');

    expect(results.products.length).toBe(0);
    expect(results.total).toBe(0);
  });

  it('should filter by category', () => {
    const results = searchProductsForCheckout('', { category: 'apparel' });

    expect(results.products.length).toBeGreaterThan(0);
    results.products.forEach(product => {
      expect(product.category).toBe('apparel');
    });
  });

  it('should filter by price range', () => {
    const results = searchProductsForCheckout('', { min_price: 20, max_price: 50 });

    expect(results.products.length).toBeGreaterThan(0);
    results.products.forEach(product => {
      const price = parseFloat(product.price.amount);
      expect(price).toBeGreaterThanOrEqual(20);
      expect(price).toBeLessThanOrEqual(50);
    });
  });

  it('should get product details', () => {
    const product = getProductDetails('btc-tshirt-classic');

    expect(product).toBeDefined();
    expect(product?.id).toBe('btc-tshirt-classic');
    expect(product?.name).toBeDefined();
    expect(product?.price).toBeDefined();
  });

  it('should return undefined for non-existent product', () => {
    const product = getProductDetails('non-existent-product');

    expect(product).toBeUndefined();
  });
});

// ============================================================================
// Action Handler Tests
// ============================================================================

describe('Action Handler', () => {
  const testContextId = 'action-test-context';

  afterEach(() => {
    deleteSession(testContextId);
  });

  it('should handle search_products action', async () => {
    const result = await handleAction(testContextId, {
      action: 'search_products',
      search_query: 'hoodie',
    });

    expect(result.success).toBe(true);
    expect(result.products).toBeDefined();
    expect(result.products!.length).toBeGreaterThan(0);
  });

  it('should handle get_product action', async () => {
    const result = await handleAction(testContextId, {
      action: 'get_product',
      product_id: 'btc-hoodie-premium',
    });

    expect(result.success).toBe(true);
    expect(result.product).toBeDefined();
    expect(result.product!.id).toBe('btc-hoodie-premium');
  });

  it('should handle add_to_checkout action', async () => {
    const result = await handleAction(testContextId, {
      action: 'add_to_checkout',
      product_id: 'btc-tshirt-classic',
      quantity: 2,
    });

    expect(result.success).toBe(true);
    expect(result.checkout).toBeDefined();
    expect(result.checkout!.line_items.length).toBe(1);
    expect(result.checkout!.item_count).toBe(2);
  });

  it('should handle remove_from_checkout action', async () => {
    await handleAction(testContextId, {
      action: 'add_to_checkout',
      product_id: 'btc-tshirt-classic',
      quantity: 1,
    });

    const result = await handleAction(testContextId, {
      action: 'remove_from_checkout',
      product_id: 'btc-tshirt-classic',
    });

    expect(result.success).toBe(true);
    expect(result.checkout!.line_items.length).toBe(0);
  });

  it('should handle apply_discount action', async () => {
    await handleAction(testContextId, {
      action: 'add_to_checkout',
      product_id: 'btc-tshirt-classic',
      quantity: 1,
    });

    const result = await handleAction(testContextId, {
      action: 'apply_discount',
      discount_code: 'WELCOME10',
    });

    expect(result.success).toBe(true);
    expect(result.checkout!.discounts.length).toBe(1);
  });

  it('should handle set_shipping action', async () => {
    await handleAction(testContextId, {
      action: 'add_to_checkout',
      product_id: 'btc-tshirt-classic',
      quantity: 1,
    });

    const result = await handleAction(testContextId, {
      action: 'set_shipping',
      shipping_method: 'standard',
    });

    expect(result.success).toBe(true);
    expect(result.checkout!.shipping).toBeDefined();
  });

  it('should handle get_checkout action', async () => {
    await handleAction(testContextId, {
      action: 'add_to_checkout',
      product_id: 'btc-tshirt-classic',
      quantity: 2,
    });

    const result = await handleAction(testContextId, {
      action: 'get_checkout',
    });

    expect(result.success).toBe(true);
    expect(result.checkout).toBeDefined();
    expect(result.checkout!.item_count).toBe(2);
  });

  it('should handle unknown action', async () => {
    const result = await handleAction(testContextId, {
      action: 'unknown_action' as any,
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe(UCP_ERROR_CODES.INVALID_ACTION);
  });
});

// ============================================================================
// Checkout Total Calculation Tests
// ============================================================================

describe('Checkout Total Calculation', () => {
  const testContextId = 'calc-test-context';
  let session: ReturnType<typeof getOrCreateSession>;

  beforeEach(() => {
    session = getOrCreateSession(testContextId);
  });

  afterEach(() => {
    deleteSession(testContextId);
  });

  it('should calculate correct subtotal', () => {
    addItemToCheckout(session, 'btc-tshirt-classic', 2); // $29.99 each
    const checkout = getOrCreateCheckout(session);

    const subtotal = parseFloat(checkout.subtotal.amount);
    expect(subtotal).toBeCloseTo(59.98, 2);
  });

  it('should calculate correct total with shipping', () => {
    addItemToCheckout(session, 'btc-tshirt-classic', 1);
    setShippingMethod(session, 'standard');
    const checkout = getOrCreateCheckout(session);

    const subtotal = parseFloat(checkout.subtotal.amount);
    const shipping = parseFloat(checkout.shipping_total.amount);
    const total = parseFloat(checkout.total.amount);

    expect(total).toBeGreaterThan(subtotal);
    expect(total).toBeCloseTo(subtotal + shipping + parseFloat(checkout.tax_total.amount), 2);
  });

  it('should calculate correct total with discount', () => {
    addItemToCheckout(session, 'btc-tshirt-classic', 2);
    const beforeDiscount = getOrCreateCheckout(session);
    const totalBefore = parseFloat(beforeDiscount.total.amount);

    applyDiscountCode(session, 'WELCOME10');
    const afterDiscount = getOrCreateCheckout(session);
    const totalAfter = parseFloat(afterDiscount.total.amount);

    expect(totalAfter).toBeLessThan(totalBefore);
  });
});
