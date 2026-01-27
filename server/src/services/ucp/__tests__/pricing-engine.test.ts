/**
 * Pricing Engine Unit Tests
 *
 * Tests for discount validation, shipping calculations, and checkout recalculation.
 */
import { describe, it, expect } from 'bun:test';
import {
  validateDiscount,
  calculateDiscountAmount,
  getDiscountByCode,
  getAvailableShippingMethods,
  calculateShipping,
  recalculateCheckout,
} from '../pricing-engine.js';
import { createMoney, type UCPCheckout, type UCPLineItem } from '../types.js';

// ============================================================================
// Helper Functions
// ============================================================================

function createTestCheckout(items: Partial<UCPLineItem>[] = []): UCPCheckout {
  const lineItems: UCPLineItem[] = items.map((item, i) => ({
    id: `item-${i}`,
    product_id: item.product_id || `product-${i}`,
    name: item.name || `Test Product ${i}`,
    quantity: item.quantity || 1,
    unit_price: item.unit_price || createMoney(29.99, 'USD'),
    total_price: createMoney(
      (item.quantity || 1) * parseFloat((item.unit_price || createMoney(29.99, 'USD')).amount),
      'USD'
    ),
    ...item,
  }));

  const subtotal = lineItems.reduce(
    (sum, item) => sum + parseFloat(item.total_price.amount),
    0
  );

  return {
    id: 'test-checkout',
    status: 'draft',
    currency: 'USD',
    line_items: lineItems,
    item_count: lineItems.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: createMoney(subtotal, 'USD'),
    discounts: [],
    discount_total: createMoney(0, 'USD'),
    shipping_total: createMoney(0, 'USD'),
    tax_lines: [],
    tax_total: createMoney(0, 'USD'),
    total: createMoney(subtotal, 'USD'),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ============================================================================
// Discount Validation Tests
// ============================================================================

describe('Discount Validation', () => {
  it('should validate WELCOME10 discount code', () => {
    const checkout = createTestCheckout([{ quantity: 1, unit_price: createMoney(50, 'USD') }]);
    const result = validateDiscount('WELCOME10', checkout);

    expect(result.valid).toBe(true);
    expect(result.discount).toBeDefined();
    expect(result.discount?.code).toBe('WELCOME10');
  });

  it('should validate WELCOME10 case-insensitively', () => {
    const checkout = createTestCheckout([{ quantity: 1, unit_price: createMoney(50, 'USD') }]);
    const result = validateDiscount('welcome10', checkout);

    expect(result.valid).toBe(true);
  });

  it('should reject invalid discount code', () => {
    const checkout = createTestCheckout([{ quantity: 1 }]);
    const result = validateDiscount('INVALID_CODE', checkout);

    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject discount below minimum order', () => {
    // CRYPTO25 requires $75 minimum
    const checkout = createTestCheckout([{ quantity: 1, unit_price: createMoney(30, 'USD') }]);
    const result = validateDiscount('CRYPTO25', checkout);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('minimum');
  });

  it('should accept discount at minimum order', () => {
    // CRYPTO25 requires $75 minimum
    const checkout = createTestCheckout([{ quantity: 1, unit_price: createMoney(100, 'USD') }]);
    const result = validateDiscount('CRYPTO25', checkout);

    expect(result.valid).toBe(true);
  });

  it('should reject already applied discount', () => {
    const checkout = createTestCheckout([{ quantity: 1, unit_price: createMoney(50, 'USD') }]);
    checkout.discounts.push({
      code: 'WELCOME10',
      description: '10% off',
      amount: createMoney(5, 'USD'),
      type: 'percentage',
    });

    const result = validateDiscount('WELCOME10', checkout);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('already applied');
  });

  it('should get discount by code', () => {
    const discount = getDiscountByCode('WELCOME10');

    expect(discount).toBeDefined();
    expect(discount?.code).toBe('WELCOME10');
    expect(discount?.type).toBe('percentage');
  });
});

// ============================================================================
// Discount Calculation Tests
// ============================================================================

describe('Discount Calculation', () => {
  it('should calculate percentage discount correctly', () => {
    const checkout = createTestCheckout([{ quantity: 2, unit_price: createMoney(50, 'USD') }]); // $100 subtotal
    const discount = getDiscountByCode('WELCOME10')!; // 10% off

    const applied = calculateDiscountAmount(discount, checkout);

    expect(applied.code).toBe('WELCOME10');
    expect(parseFloat(applied.amount.amount)).toBe(10); // 10% of $100
  });

  it('should calculate fixed discount correctly', () => {
    const checkout = createTestCheckout([{ quantity: 1, unit_price: createMoney(100, 'USD') }]);
    const discount = getDiscountByCode('CRYPTO25')!; // $25 off

    const applied = calculateDiscountAmount(discount, checkout);

    expect(parseFloat(applied.amount.amount)).toBe(25);
  });

  it('should cap percentage discount at max amount', () => {
    const checkout = createTestCheckout([{ quantity: 10, unit_price: createMoney(100, 'USD') }]); // $1000 subtotal
    const discount = getDiscountByCode('WELCOME10')!; // 10% off, max $50

    const applied = calculateDiscountAmount(discount, checkout);

    // Should be capped at $50, not $100 (10% of $1000)
    expect(parseFloat(applied.amount.amount)).toBeLessThanOrEqual(50);
  });

  it('should not exceed subtotal for fixed discount', () => {
    const checkout = createTestCheckout([{ quantity: 1, unit_price: createMoney(20, 'USD') }]);
    const discount = getDiscountByCode('CRYPTO25')!; // $25 off but subtotal is only $20

    const applied = calculateDiscountAmount(discount, checkout);

    expect(parseFloat(applied.amount.amount)).toBe(20); // Can't discount more than subtotal
  });
});

// ============================================================================
// Shipping Tests
// ============================================================================

describe('Shipping Methods', () => {
  it('should return available shipping methods', () => {
    const checkout = createTestCheckout([{ quantity: 1 }]);
    const methods = getAvailableShippingMethods(checkout);

    expect(methods.length).toBeGreaterThan(0);
    expect(methods.some(m => m.id === 'standard')).toBe(true);
  });

  it('should include express shipping', () => {
    const checkout = createTestCheckout([{ quantity: 1 }]);
    const methods = getAvailableShippingMethods(checkout);

    expect(methods.some(m => m.id === 'express')).toBe(true);
  });

  it('should calculate standard shipping', () => {
    const checkout = createTestCheckout([{ quantity: 1 }]);
    const shipping = calculateShipping('standard', checkout);

    expect(shipping).toBeDefined();
    expect(shipping.method_id).toBe('standard');
    expect(parseFloat(shipping.price.amount)).toBeGreaterThan(0);
  });

  it('should calculate express shipping higher than standard', () => {
    const checkout = createTestCheckout([{ quantity: 1 }]);
    const standard = calculateShipping('standard', checkout);
    const express = calculateShipping('express', checkout);

    expect(parseFloat(express.price.amount)).toBeGreaterThan(
      parseFloat(standard.price.amount)
    );
  });
});

// ============================================================================
// Checkout Recalculation Tests
// ============================================================================

describe('Checkout Recalculation', () => {
  it('should calculate correct item count', () => {
    const checkout = createTestCheckout([
      { quantity: 2 },
      { quantity: 3 },
    ]);

    const recalculated = recalculateCheckout(checkout);

    expect(recalculated.item_count).toBe(5);
  });

  it('should calculate correct subtotal', () => {
    const checkout = createTestCheckout([
      { quantity: 2, unit_price: createMoney(25, 'USD') },
      { quantity: 1, unit_price: createMoney(50, 'USD') },
    ]);

    const recalculated = recalculateCheckout(checkout);

    expect(parseFloat(recalculated.subtotal.amount)).toBe(100);
  });

  it('should apply discount to total', () => {
    const checkout = createTestCheckout([{ quantity: 1, unit_price: createMoney(100, 'USD') }]);
    checkout.discounts.push({
      code: 'TEST',
      description: '$10 off',
      amount: createMoney(10, 'USD'),
      type: 'fixed',
    });

    const recalculated = recalculateCheckout(checkout);

    expect(parseFloat(recalculated.discount_total.amount)).toBe(10);
    expect(parseFloat(recalculated.total.amount)).toBeLessThan(100);
  });

  it('should include shipping in total', () => {
    const checkout = createTestCheckout([{ quantity: 1, unit_price: createMoney(50, 'USD') }]);
    checkout.shipping = {
      method_id: 'standard',
      method_name: 'Standard Shipping',
      price: createMoney(9.99, 'USD'),
    };

    const recalculated = recalculateCheckout(checkout);

    expect(parseFloat(recalculated.shipping_total.amount)).toBe(9.99);
    expect(parseFloat(recalculated.total.amount)).toBeGreaterThan(50);
  });

  it('should calculate tax', () => {
    const checkout = createTestCheckout([{ quantity: 1, unit_price: createMoney(100, 'USD') }]);

    const recalculated = recalculateCheckout(checkout);

    expect(parseFloat(recalculated.tax_total.amount)).toBeGreaterThan(0);
    expect(recalculated.tax_lines.length).toBeGreaterThan(0);
  });

  it('should calculate total correctly with all components', () => {
    const checkout = createTestCheckout([{ quantity: 2, unit_price: createMoney(50, 'USD') }]);
    checkout.discounts.push({
      code: 'TEST',
      description: '$10 off',
      amount: createMoney(10, 'USD'),
      type: 'fixed',
    });
    checkout.shipping = {
      method_id: 'standard',
      method_name: 'Standard',
      price: createMoney(10, 'USD'),
    };

    const recalculated = recalculateCheckout(checkout);

    const subtotal = parseFloat(recalculated.subtotal.amount);
    const discount = parseFloat(recalculated.discount_total.amount);
    const shipping = parseFloat(recalculated.shipping_total.amount);
    const tax = parseFloat(recalculated.tax_total.amount);
    const total = parseFloat(recalculated.total.amount);

    // Total should equal: subtotal - discount + shipping + tax
    expect(total).toBeCloseTo(subtotal - discount + shipping + tax, 2);
  });
});
