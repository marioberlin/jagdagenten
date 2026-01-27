/**
 * UCP (Universal Commerce Protocol) Type Definitions
 * Spec Version: 2026-01-11
 * https://ucp.dev/specification/overview/
 */

export const UCP_VERSION = '2026-01-11';
export const UCP_NAMESPACE = 'dev.ucp.shopping';
export const UCP_EXTENSION_URI = `https://ucp.dev/specification/reference?v=${UCP_VERSION}`;

// ============================================================================
// Checkout Actions
// ============================================================================

export type UCPCheckoutAction =
  | 'add_to_checkout'
  | 'remove_from_checkout'
  | 'update_quantity'
  | 'apply_discount'
  | 'remove_discount'
  | 'set_shipping'
  | 'set_address'
  | 'complete_checkout'
  | 'get_checkout'
  | 'search_products'
  | 'get_product';

export interface UCPActionInput {
  action: UCPCheckoutAction;
  product_id?: string;
  variant_id?: string;
  quantity?: number;
  discount_code?: string;
  shipping_method?: string;
  address?: UCPAddress;
  search_query?: string;
  search_filters?: Record<string, string | string[]>;
}

// ============================================================================
// Money & Currency
// ============================================================================

export interface UCPMoney {
  amount: string; // Decimal string for precision (e.g., "29.99")
  currency: string; // ISO 4217 (e.g., "USD", "EUR")
}

export function createMoney(amount: number, currency: string = 'USD'): UCPMoney {
  return {
    amount: amount.toFixed(2),
    currency,
  };
}

export function moneyToNumber(money: UCPMoney): number {
  return parseFloat(money.amount);
}

export function addMoney(a: UCPMoney, b: UCPMoney): UCPMoney {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
  return createMoney(moneyToNumber(a) + moneyToNumber(b), a.currency);
}

export function subtractMoney(a: UCPMoney, b: UCPMoney): UCPMoney {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
  return createMoney(Math.max(0, moneyToNumber(a) - moneyToNumber(b)), a.currency);
}

export function multiplyMoney(money: UCPMoney, multiplier: number): UCPMoney {
  return createMoney(moneyToNumber(money) * multiplier, money.currency);
}

// ============================================================================
// Products
// ============================================================================

export interface UCPProduct {
  id: string;
  name: string;
  description: string;
  brand?: string;
  category: string;
  subcategory?: string;
  images: string[];
  price: UCPMoney;
  compare_at_price?: UCPMoney; // Original price for showing discounts
  variants?: UCPProductVariant[];
  attributes: Record<string, string>;
  inventory: UCPInventory;
  shipping: UCPShippingInfo;
  tags: string[];
  rating: number; // 0-5
  review_count: number;
  sku?: string;
  barcode?: string;
  created_at: string;
  updated_at: string;
}

export interface UCPProductVariant {
  id: string;
  name: string;
  sku?: string;
  price?: UCPMoney; // Override base price
  attributes: Record<string, string>; // e.g., { size: 'M', color: 'Blue' }
  inventory: UCPInventory;
  images?: string[];
}

export interface UCPInventory {
  in_stock: boolean;
  quantity: number;
  backorder_date?: string; // ISO date for expected availability
  low_stock_threshold?: number;
}

export interface UCPShippingInfo {
  weight: number; // in grams
  dimensions?: {
    length: number; // cm
    width: number;
    height: number;
  };
  shipping_class: 'standard' | 'oversize' | 'hazmat' | 'digital' | 'fragile';
  free_shipping_eligible: boolean;
  requires_shipping: boolean; // false for digital goods
}

// ============================================================================
// Line Items
// ============================================================================

export interface UCPLineItem {
  id: string;
  product_id: string;
  variant_id?: string;
  name: string;
  description?: string;
  image_url?: string;
  sku?: string;
  quantity: number;
  unit_price: UCPMoney;
  total_price: UCPMoney;
  attributes?: Record<string, string>;
  discounts?: UCPLineItemDiscount[];
}

export interface UCPLineItemDiscount {
  code?: string;
  description: string;
  amount: UCPMoney;
  type: 'percentage' | 'fixed' | 'buy_x_get_y';
}

// ============================================================================
// Discounts
// ============================================================================

export interface UCPDiscount {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed' | 'free_shipping' | 'buy_x_get_y';
  value: number; // percentage (0-100) or fixed amount
  min_order_value?: UCPMoney;
  max_discount?: UCPMoney;
  applicable_categories?: string[];
  applicable_products?: string[];
  usage_limit?: number;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

export interface UCPAppliedDiscount {
  code: string;
  description: string;
  amount: UCPMoney;
  type: UCPDiscount['type'];
}

// ============================================================================
// Shipping
// ============================================================================

export interface UCPShippingMethod {
  id: string;
  name: string;
  description: string;
  carrier?: string;
  price: UCPMoney;
  estimated_days_min: number;
  estimated_days_max: number;
  tracking_available: boolean;
}

export interface UCPShippingSelection {
  method_id: string;
  method_name: string;
  price: UCPMoney;
  estimated_delivery?: string; // ISO date
}

// ============================================================================
// Address
// ============================================================================

export interface UCPAddress {
  first_name: string;
  last_name: string;
  company?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string; // ISO 3166-1 alpha-2
  phone?: string;
  email?: string;
}

// ============================================================================
// Customer
// ============================================================================

export interface UCPCustomer {
  id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  is_guest: boolean;
  billing_address?: UCPAddress;
  shipping_address?: UCPAddress;
}

// ============================================================================
// Tax
// ============================================================================

export interface UCPTaxLine {
  name: string;
  rate: number; // e.g., 0.19 for 19%
  amount: UCPMoney;
  taxable_amount: UCPMoney;
}

// ============================================================================
// Checkout
// ============================================================================

export type UCPCheckoutStatus =
  | 'draft' // Initial state, cart being built
  | 'pending' // Ready for payment
  | 'processing' // Payment in progress
  | 'completed' // Order placed successfully
  | 'failed' // Payment failed
  | 'cancelled' // User cancelled
  | 'expired'; // Session expired

export interface UCPCheckout {
  id: string;
  status: UCPCheckoutStatus;
  currency: string;
  line_items: UCPLineItem[];
  item_count: number;
  subtotal: UCPMoney;
  discounts: UCPAppliedDiscount[];
  discount_total: UCPMoney;
  shipping?: UCPShippingSelection;
  shipping_total: UCPMoney;
  tax_lines: UCPTaxLine[];
  tax_total: UCPMoney;
  total: UCPMoney;
  customer?: UCPCustomer;
  shipping_address?: UCPAddress;
  billing_address?: UCPAddress;
  note?: string;
  order?: UCPOrder; // Present after completion
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

// ============================================================================
// Order
// ============================================================================

export interface UCPOrder {
  id: string;
  order_number: string;
  permalink_url: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded';
  fulfillment_status: 'unfulfilled' | 'partial' | 'fulfilled';
  tracking_number?: string;
  tracking_url?: string;
  created_at: string;
  confirmed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
}

// ============================================================================
// Payment
// ============================================================================

export interface UCPPaymentData {
  token: string;
  method: 'card' | 'apple_pay' | 'google_pay' | 'paypal' | 'bank_transfer';
  amount: UCPMoney;
  billing_address?: UCPAddress;
}

export interface UCPRiskSignals {
  device_fingerprint?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  is_new_customer?: boolean;
  previous_orders_count?: number;
  account_age_days?: number;
}

export interface UCPPaymentResult {
  success: boolean;
  transaction_id?: string;
  error_code?: string;
  error_message?: string;
  requires_action?: boolean;
  action_url?: string;
  risk_level?: 'low' | 'medium' | 'high';
}

// ============================================================================
// Session
// ============================================================================

export interface UCPSession {
  id: string;
  context_id: string;
  checkout?: UCPCheckout;
  created_at: Date;
  updated_at: Date;
  expires_at: Date;
  metadata: {
    ucp_agent?: string; // Platform profile URI
    ucp_version?: string;
    risk_level?: 'low' | 'medium' | 'high';
    ip_address?: string;
    user_agent?: string;
  };
}

// ============================================================================
// A2A DataPart Keys
// ============================================================================

export const UCP_DATA_KEYS = {
  CHECKOUT: 'a2a.ucp.checkout',
  PAYMENT_DATA: 'a2a.ucp.checkout.payment_data',
  RISK_SIGNALS: 'a2a.ucp.checkout.risk_signals',
  PRODUCTS: 'a2a.ucp.products',
  PRODUCT: 'a2a.ucp.product',
  SHIPPING_METHODS: 'a2a.ucp.shipping_methods',
  ERROR: 'a2a.ucp.error',
} as const;

// ============================================================================
// Error Types
// ============================================================================

export interface UCPError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export const UCP_ERROR_CODES = {
  PRODUCT_NOT_FOUND: 'product_not_found',
  VARIANT_NOT_FOUND: 'variant_not_found',
  OUT_OF_STOCK: 'out_of_stock',
  INSUFFICIENT_QUANTITY: 'insufficient_quantity',
  INVALID_DISCOUNT_CODE: 'invalid_discount_code',
  DISCOUNT_EXPIRED: 'discount_expired',
  DISCOUNT_MIN_NOT_MET: 'discount_minimum_not_met',
  INVALID_SHIPPING_METHOD: 'invalid_shipping_method',
  SHIPPING_NOT_AVAILABLE: 'shipping_not_available',
  INVALID_ADDRESS: 'invalid_address',
  PAYMENT_FAILED: 'payment_failed',
  PAYMENT_DECLINED: 'payment_declined',
  CHECKOUT_NOT_FOUND: 'checkout_not_found',
  CHECKOUT_EXPIRED: 'checkout_expired',
  CHECKOUT_ALREADY_COMPLETED: 'checkout_already_completed',
  INVALID_ACTION: 'invalid_action',
  INTERNAL_ERROR: 'internal_error',
} as const;

export class UCPException extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'UCPException';
  }

  toUCPError(): UCPError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}
