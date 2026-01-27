/**
 * UCP Pricing Engine
 *
 * Handles:
 * - Tax calculation (VAT rates by category)
 * - Discount codes and promotions
 * - Shipping rates and methods
 */

import {
  type UCPCheckout,
  type UCPLineItem,
  type UCPDiscount,
  type UCPAppliedDiscount,
  type UCPShippingMethod,
  type UCPShippingSelection,
  type UCPTaxLine,
  type UCPMoney,
  type UCPAddress,
  createMoney,
  moneyToNumber,
  UCPException,
  UCP_ERROR_CODES,
} from './types.js';

// Re-export for convenience
export type { UCPShippingMethod } from './types.js';
import { getProductById } from './product-catalog.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _UCPAddress = UCPAddress; // Used for future address-based tax calculations

// ============================================================================
// Tax Configuration
// ============================================================================

export interface TaxConfig {
  name: string;
  rate: number; // 0.0 - 1.0
  categories?: string[]; // If specified, only applies to these categories
}

// Default tax rates (simplified EU VAT model)
export const TAX_RATES: TaxConfig[] = [
  { name: 'Standard VAT', rate: 0.19 }, // Default 19%
  { name: 'Reduced VAT', rate: 0.07, categories: ['subscriptions'] }, // 7% for subscriptions
  { name: 'Digital Exempt', rate: 0.0, categories: ['digital'] }, // Simplified: 0% for digital
];

/**
 * Get applicable tax rate for a product category
 */
export function getTaxRateForCategory(category: string): TaxConfig {
  // Find specific rate for category
  const specificRate = TAX_RATES.find(
    (tax) => tax.categories && tax.categories.includes(category)
  );
  if (specificRate) return specificRate;

  // Fall back to standard rate
  return TAX_RATES.find((tax) => !tax.categories) || { name: 'Standard', rate: 0.19 };
}

/**
 * Calculate tax for a checkout
 */
export function calculateTax(
  subtotal: UCPMoney,
  lineItems: UCPLineItem[],
  shippingAddress?: UCPAddress
): { taxLines: UCPTaxLine[]; taxTotal: UCPMoney } {
  const taxByRate = new Map<string, { rate: number; amount: number; taxable: number }>();

  for (const item of lineItems) {
    const product = getProductById(item.product_id);
    const category = product?.category || 'general';
    const taxConfig = getTaxRateForCategory(category);

    const itemTotal = moneyToNumber(item.total_price);
    const taxAmount = itemTotal * taxConfig.rate;

    const existing = taxByRate.get(taxConfig.name) || { rate: taxConfig.rate, amount: 0, taxable: 0 };
    existing.amount += taxAmount;
    existing.taxable += itemTotal;
    taxByRate.set(taxConfig.name, existing);
  }

  const taxLines: UCPTaxLine[] = [];
  let totalTax = 0;

  for (const [name, { rate, amount, taxable }] of taxByRate) {
    if (amount > 0) {
      taxLines.push({
        name,
        rate,
        amount: createMoney(amount, subtotal.currency),
        taxable_amount: createMoney(taxable, subtotal.currency),
      });
      totalTax += amount;
    }
  }

  return {
    taxLines,
    taxTotal: createMoney(totalTax, subtotal.currency),
  };
}

// ============================================================================
// Discount Configuration
// ============================================================================

const now = new Date();
const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

export const DISCOUNT_CODES: UCPDiscount[] = [
  {
    id: 'disc-welcome10',
    code: 'WELCOME10',
    description: '10% off your first order',
    type: 'percentage',
    value: 10,
    usage_limit: 1,
    used_count: 0,
    valid_from: now.toISOString(),
    valid_until: oneYearFromNow.toISOString(),
    is_active: true,
  },
  {
    id: 'disc-freeship80',
    code: 'FREESHIP80',
    description: 'Free shipping on orders over $80',
    type: 'free_shipping',
    value: 0,
    min_order_value: createMoney(80),
    usage_limit: undefined, // Unlimited
    used_count: 0,
    valid_from: now.toISOString(),
    valid_until: oneYearFromNow.toISOString(),
    is_active: true,
  },
  {
    id: 'disc-summer25',
    code: 'SUMMER25',
    description: '25% off apparel',
    type: 'percentage',
    value: 25,
    applicable_categories: ['apparel'],
    max_discount: createMoney(50),
    usage_limit: undefined,
    used_count: 0,
    valid_from: now.toISOString(),
    valid_until: oneYearFromNow.toISOString(),
    is_active: true,
  },
  {
    id: 'disc-bundle15',
    code: 'BUNDLE15',
    description: '15% off when you buy 3+ items',
    type: 'percentage',
    value: 15,
    usage_limit: undefined,
    used_count: 0,
    valid_from: now.toISOString(),
    valid_until: oneYearFromNow.toISOString(),
    is_active: true,
  },
  {
    id: 'disc-loyalty20',
    code: 'LOYALTY20',
    description: '20% off for returning customers',
    type: 'percentage',
    value: 20,
    max_discount: createMoney(100),
    usage_limit: undefined,
    used_count: 0,
    valid_from: now.toISOString(),
    valid_until: oneYearFromNow.toISOString(),
    is_active: true,
  },
  {
    id: 'disc-flat20',
    code: 'FLAT20',
    description: '$20 off orders over $100',
    type: 'fixed',
    value: 20,
    min_order_value: createMoney(100),
    usage_limit: undefined,
    used_count: 0,
    valid_from: now.toISOString(),
    valid_until: oneYearFromNow.toISOString(),
    is_active: true,
  },
];

// Index by code for fast lookup
const DISCOUNT_BY_CODE = new Map<string, UCPDiscount>(
  DISCOUNT_CODES.map((d) => [d.code.toUpperCase(), d])
);

/**
 * Get discount by code
 */
export function getDiscountByCode(code: string): UCPDiscount | undefined {
  return DISCOUNT_BY_CODE.get(code.toUpperCase());
}

/**
 * Validate and apply a discount code
 */
export function validateDiscount(
  code: string,
  checkout: UCPCheckout
): { valid: boolean; error?: string; discount?: UCPDiscount } {
  const discount = getDiscountByCode(code);

  if (!discount) {
    return { valid: false, error: 'Invalid discount code' };
  }

  if (!discount.is_active) {
    return { valid: false, error: 'This discount code is no longer active' };
  }

  const now = new Date();
  if (new Date(discount.valid_from) > now) {
    return { valid: false, error: 'This discount code is not yet valid' };
  }
  if (new Date(discount.valid_until) < now) {
    return { valid: false, error: 'This discount code has expired' };
  }

  if (discount.usage_limit !== undefined && discount.used_count >= discount.usage_limit) {
    return { valid: false, error: 'This discount code has reached its usage limit' };
  }

  // Check minimum order value
  if (discount.min_order_value) {
    const subtotal = moneyToNumber(checkout.subtotal);
    const minValue = moneyToNumber(discount.min_order_value);
    if (subtotal < minValue) {
      return {
        valid: false,
        error: `Minimum order of $${minValue.toFixed(2)} required for this discount`,
      };
    }
  }

  // Check BUNDLE15 condition (3+ items)
  if (discount.code === 'BUNDLE15' && checkout.item_count < 3) {
    return { valid: false, error: 'Add 3 or more items to use this discount' };
  }

  // Check if discount already applied
  if (checkout.discounts.some((d) => d.code === discount.code)) {
    return { valid: false, error: 'This discount code is already applied' };
  }

  return { valid: true, discount };
}

/**
 * Calculate discount amount for a checkout
 */
export function calculateDiscountAmount(
  discount: UCPDiscount,
  checkout: UCPCheckout
): UCPAppliedDiscount {
  const currency = checkout.currency;
  let amount = 0;

  switch (discount.type) {
    case 'percentage': {
      // Calculate base for percentage
      let applicableAmount = 0;

      if (discount.applicable_categories && discount.applicable_categories.length > 0) {
        // Only apply to specific categories
        for (const item of checkout.line_items) {
          const product = getProductById(item.product_id);
          if (product && discount.applicable_categories.includes(product.category)) {
            applicableAmount += moneyToNumber(item.total_price);
          }
        }
      } else {
        // Apply to full subtotal
        applicableAmount = moneyToNumber(checkout.subtotal);
      }

      amount = applicableAmount * (discount.value / 100);

      // Apply max discount cap
      if (discount.max_discount) {
        const maxAmount = moneyToNumber(discount.max_discount);
        amount = Math.min(amount, maxAmount);
      }
      break;
    }

    case 'fixed':
      amount = discount.value;
      break;

    case 'free_shipping':
      // Free shipping - amount is the shipping cost
      amount = moneyToNumber(checkout.shipping_total);
      break;

    case 'buy_x_get_y':
      // Simplified: Get the cheapest item free when buying X
      // For demo, assume X=2, Y=1 (buy 2 get 1 free)
      if (checkout.line_items.length >= 3) {
        const prices = checkout.line_items
          .map((item) => moneyToNumber(item.unit_price))
          .sort((a, b) => a - b);
        amount = prices[0]; // Cheapest item free
      }
      break;
  }

  return {
    code: discount.code,
    description: discount.description,
    amount: createMoney(amount, currency),
    type: discount.type,
  };
}

// ============================================================================
// Shipping Configuration
// ============================================================================

export const SHIPPING_METHODS: UCPShippingMethod[] = [
  {
    id: 'standard',
    name: 'Standard Shipping',
    description: 'Delivered in 5-7 business days',
    carrier: 'USPS',
    price: createMoney(5.99),
    estimated_days_min: 5,
    estimated_days_max: 7,
    tracking_available: true,
  },
  {
    id: 'express',
    name: 'Express Shipping',
    description: 'Delivered in 2-3 business days',
    carrier: 'UPS',
    price: createMoney(12.99),
    estimated_days_min: 2,
    estimated_days_max: 3,
    tracking_available: true,
  },
  {
    id: 'overnight',
    name: 'Next Day Delivery',
    description: 'Delivered next business day',
    carrier: 'FedEx',
    price: createMoney(24.99),
    estimated_days_min: 1,
    estimated_days_max: 1,
    tracking_available: true,
  },
  {
    id: 'pickup',
    name: 'Store Pickup',
    description: 'Pick up at our warehouse (1-2 hours)',
    price: createMoney(0),
    estimated_days_min: 0,
    estimated_days_max: 0,
    tracking_available: false,
  },
];

// Index by ID
const SHIPPING_BY_ID = new Map<string, UCPShippingMethod>(
  SHIPPING_METHODS.map((s) => [s.id, s])
);

/**
 * Get shipping method by ID
 */
export function getShippingMethodById(methodId: string): UCPShippingMethod | undefined {
  return SHIPPING_BY_ID.get(methodId);
}

/**
 * Get available shipping methods for a checkout
 */
export function getAvailableShippingMethods(checkout: UCPCheckout): UCPShippingMethod[] {
  // Check if all items are digital (no shipping needed)
  const allDigital = checkout.line_items.every((item) => {
    const product = getProductById(item.product_id);
    return product?.shipping.shipping_class === 'digital';
  });

  if (allDigital) {
    // No shipping options for digital-only orders
    return [];
  }

  // Check for hazmat items (restricted shipping options)
  const hasHazmat = checkout.line_items.some((item) => {
    const product = getProductById(item.product_id);
    return product?.shipping.shipping_class === 'hazmat';
  });

  // Check for oversize items
  const hasOversize = checkout.line_items.some((item) => {
    const product = getProductById(item.product_id);
    return product?.shipping.shipping_class === 'oversize';
  });

  let methods = [...SHIPPING_METHODS];

  // Hazmat items can't use overnight
  if (hasHazmat) {
    methods = methods.filter((m) => m.id !== 'overnight');
  }

  // Oversize items have surcharge (modify prices)
  if (hasOversize) {
    methods = methods.map((m) => {
      if (m.id === 'pickup') return m;
      return {
        ...m,
        price: createMoney(moneyToNumber(m.price) + 10, m.price.currency), // $10 oversize surcharge
        description: `${m.description} (+$10 oversize)`,
      };
    });
  }

  return methods;
}

/**
 * Calculate shipping cost
 */
export function calculateShipping(
  methodId: string,
  checkout: UCPCheckout
): UCPShippingSelection {
  const methods = getAvailableShippingMethods(checkout);
  const method = methods.find((m) => m.id === methodId);

  if (!method) {
    throw new UCPException(
      UCP_ERROR_CODES.INVALID_SHIPPING_METHOD,
      `Shipping method "${methodId}" is not available for this order`
    );
  }

  // Check for free shipping discount
  const hasFreeShipping = checkout.discounts.some((d) => d.type === 'free_shipping');

  // Calculate estimated delivery date
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + method.estimated_days_max);

  return {
    method_id: method.id,
    method_name: method.name,
    price: hasFreeShipping && method.id !== 'overnight'
      ? createMoney(0, method.price.currency)
      : method.price,
    estimated_delivery: estimatedDelivery.toISOString(),
  };
}

// ============================================================================
// Checkout Recalculation
// ============================================================================

/**
 * Recalculate all totals for a checkout
 */
export function recalculateCheckout(checkout: UCPCheckout): UCPCheckout {
  const currency = checkout.currency;

  // Calculate subtotal from line items
  let subtotal = 0;
  let itemCount = 0;

  for (const item of checkout.line_items) {
    subtotal += moneyToNumber(item.total_price);
    itemCount += item.quantity;
  }

  checkout.subtotal = createMoney(subtotal, currency);
  checkout.item_count = itemCount;

  // Recalculate discounts
  let discountTotal = 0;
  const updatedDiscounts: UCPAppliedDiscount[] = [];

  for (const appliedDiscount of checkout.discounts) {
    const discount = getDiscountByCode(appliedDiscount.code);
    if (discount) {
      const calculated = calculateDiscountAmount(discount, {
        ...checkout,
        subtotal: createMoney(subtotal, currency),
      });
      updatedDiscounts.push(calculated);
      discountTotal += moneyToNumber(calculated.amount);
    }
  }

  checkout.discounts = updatedDiscounts;
  checkout.discount_total = createMoney(discountTotal, currency);

  // Recalculate shipping if method is selected
  if (checkout.shipping) {
    try {
      checkout.shipping = calculateShipping(checkout.shipping.method_id, checkout);
      checkout.shipping_total = checkout.shipping.price;
    } catch {
      // Shipping method no longer available - clear it
      checkout.shipping = undefined;
      checkout.shipping_total = createMoney(0, currency);
    }
  } else {
    checkout.shipping_total = createMoney(0, currency);
  }

  // Recalculate tax
  const { taxLines, taxTotal } = calculateTax(
    checkout.subtotal,
    checkout.line_items,
    checkout.shipping_address
  );
  checkout.tax_lines = taxLines;
  checkout.tax_total = taxTotal;

  // Calculate final total
  const total =
    subtotal -
    discountTotal +
    moneyToNumber(checkout.shipping_total) +
    moneyToNumber(checkout.tax_total);

  checkout.total = createMoney(Math.max(0, total), currency);
  checkout.updated_at = new Date().toISOString();

  return checkout;
}

/**
 * Check if checkout qualifies for free shipping
 */
export function qualifiesForFreeShipping(checkout: UCPCheckout): boolean {
  const subtotal = moneyToNumber(checkout.subtotal);

  // Check if any discount provides free shipping
  if (checkout.discounts.some((d) => d.type === 'free_shipping')) {
    return true;
  }

  // Check product-level free shipping eligibility
  const allEligible = checkout.line_items.every((item) => {
    const product = getProductById(item.product_id);
    return product?.shipping.free_shipping_eligible;
  });

  // Free shipping on eligible products over $80
  return allEligible && subtotal >= 80;
}
