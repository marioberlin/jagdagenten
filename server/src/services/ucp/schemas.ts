/**
 * UCP Zod Schemas for Request/Response Validation
 * Spec Version: 2026-01-11
 *
 * These schemas strictly match the UCP specification for interoperability.
 */

import { z } from 'zod';

// ============================================================================
// Base Schemas
// ============================================================================

export const MoneySchema = z.object({
  amount: z.string().regex(/^\d+\.\d{2}$/, 'Amount must be a decimal string with 2 decimal places'),
  currency: z.string().length(3, 'Currency must be ISO 4217 3-letter code'),
});

export const AddressSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  company: z.string().max(200).optional(),
  address_line_1: z.string().min(1).max(500),
  address_line_2: z.string().max(500).optional(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional(),
  postal_code: z.string().min(1).max(20),
  country: z.string().length(2, 'Country must be ISO 3166-1 alpha-2'),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
});

// ============================================================================
// Product Schemas
// ============================================================================

export const InventorySchema = z.object({
  in_stock: z.boolean(),
  quantity: z.number().int().min(0),
  backorder_date: z.string().datetime().optional(),
  low_stock_threshold: z.number().int().min(0).optional(),
});

export const ShippingInfoSchema = z.object({
  weight: z.number().min(0),
  dimensions: z
    .object({
      length: z.number().min(0),
      width: z.number().min(0),
      height: z.number().min(0),
    })
    .optional(),
  shipping_class: z.enum(['standard', 'oversize', 'hazmat', 'digital', 'fragile']),
  free_shipping_eligible: z.boolean(),
  requires_shipping: z.boolean(),
});

export const ProductVariantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  sku: z.string().optional(),
  price: MoneySchema.optional(),
  attributes: z.record(z.string()),
  inventory: InventorySchema,
  images: z.array(z.string().url()).optional(),
});

export const ProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(500),
  description: z.string().max(5000),
  brand: z.string().max(200).optional(),
  category: z.string().min(1).max(100),
  subcategory: z.string().max(100).optional(),
  images: z.array(z.string().url()),
  price: MoneySchema,
  compare_at_price: MoneySchema.optional(),
  variants: z.array(ProductVariantSchema).optional(),
  attributes: z.record(z.string()),
  inventory: InventorySchema,
  shipping: ShippingInfoSchema,
  tags: z.array(z.string()),
  rating: z.number().min(0).max(5),
  review_count: z.number().int().min(0),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// ============================================================================
// Line Item Schemas
// ============================================================================

export const LineItemDiscountSchema = z.object({
  code: z.string().optional(),
  description: z.string(),
  amount: MoneySchema,
  type: z.enum(['percentage', 'fixed', 'buy_x_get_y']),
});

export const LineItemSchema = z.object({
  id: z.string().min(1),
  product_id: z.string().min(1),
  variant_id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  image_url: z.string().url().optional(),
  sku: z.string().optional(),
  quantity: z.number().int().min(1),
  unit_price: MoneySchema,
  total_price: MoneySchema,
  attributes: z.record(z.string()).optional(),
  discounts: z.array(LineItemDiscountSchema).optional(),
});

// ============================================================================
// Discount Schemas
// ============================================================================

export const DiscountSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1).max(50),
  description: z.string().max(500),
  type: z.enum(['percentage', 'fixed', 'free_shipping', 'buy_x_get_y']),
  value: z.number().min(0),
  min_order_value: MoneySchema.optional(),
  max_discount: MoneySchema.optional(),
  applicable_categories: z.array(z.string()).optional(),
  applicable_products: z.array(z.string()).optional(),
  usage_limit: z.number().int().min(0).optional(),
  used_count: z.number().int().min(0),
  valid_from: z.string().datetime(),
  valid_until: z.string().datetime(),
  is_active: z.boolean(),
});

export const AppliedDiscountSchema = z.object({
  code: z.string(),
  description: z.string(),
  amount: MoneySchema,
  type: z.enum(['percentage', 'fixed', 'free_shipping', 'buy_x_get_y']),
});

// ============================================================================
// Shipping Schemas
// ============================================================================

export const ShippingMethodSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  carrier: z.string().optional(),
  price: MoneySchema,
  estimated_days_min: z.number().int().min(0),
  estimated_days_max: z.number().int().min(0),
  tracking_available: z.boolean(),
});

export const ShippingSelectionSchema = z.object({
  method_id: z.string().min(1),
  method_name: z.string().min(1),
  price: MoneySchema,
  estimated_delivery: z.string().datetime().optional(),
});

// ============================================================================
// Tax Schemas
// ============================================================================

export const TaxLineSchema = z.object({
  name: z.string(),
  rate: z.number().min(0).max(1),
  amount: MoneySchema,
  taxable_amount: MoneySchema,
});

// ============================================================================
// Customer Schemas
// ============================================================================

export const CustomerSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  is_guest: z.boolean(),
  billing_address: AddressSchema.optional(),
  shipping_address: AddressSchema.optional(),
});

// ============================================================================
// Order Schemas
// ============================================================================

export const OrderSchema = z.object({
  id: z.string().min(1),
  order_number: z.string().min(1),
  permalink_url: z.string().url(),
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
  payment_status: z.enum(['pending', 'authorized', 'captured', 'failed', 'refunded']),
  fulfillment_status: z.enum(['unfulfilled', 'partial', 'fulfilled']),
  tracking_number: z.string().optional(),
  tracking_url: z.string().url().optional(),
  created_at: z.string().datetime(),
  confirmed_at: z.string().datetime().optional(),
  shipped_at: z.string().datetime().optional(),
  delivered_at: z.string().datetime().optional(),
});

// ============================================================================
// Checkout Schemas
// ============================================================================

export const CheckoutStatusSchema = z.enum([
  'draft',
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'expired',
]);

export const CheckoutSchema = z.object({
  id: z.string().min(1),
  status: CheckoutStatusSchema,
  currency: z.string().length(3),
  line_items: z.array(LineItemSchema),
  item_count: z.number().int().min(0),
  subtotal: MoneySchema,
  discounts: z.array(AppliedDiscountSchema),
  discount_total: MoneySchema,
  shipping: ShippingSelectionSchema.optional(),
  shipping_total: MoneySchema,
  tax_lines: z.array(TaxLineSchema),
  tax_total: MoneySchema,
  total: MoneySchema,
  customer: CustomerSchema.optional(),
  shipping_address: AddressSchema.optional(),
  billing_address: AddressSchema.optional(),
  note: z.string().max(1000).optional(),
  order: OrderSchema.optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  expires_at: z.string().datetime().optional(),
});

// ============================================================================
// Payment Schemas
// ============================================================================

export const PaymentDataSchema = z.object({
  token: z.string().min(1),
  method: z.enum(['card', 'apple_pay', 'google_pay', 'paypal', 'bank_transfer']),
  amount: MoneySchema,
  billing_address: AddressSchema.optional(),
});

export const RiskSignalsSchema = z.object({
  device_fingerprint: z.string().optional(),
  ip_address: z.string().ip().optional(),
  user_agent: z.string().optional(),
  session_id: z.string().optional(),
  is_new_customer: z.boolean().optional(),
  previous_orders_count: z.number().int().min(0).optional(),
  account_age_days: z.number().int().min(0).optional(),
});

// ============================================================================
// Action Input Schemas
// ============================================================================

export const CheckoutActionSchema = z.enum([
  'add_to_checkout',
  'remove_from_checkout',
  'update_quantity',
  'apply_discount',
  'remove_discount',
  'set_shipping',
  'set_address',
  'complete_checkout',
  'get_checkout',
  'search_products',
  'get_product',
]);

export const ActionInputSchema = z.object({
  action: CheckoutActionSchema,
  product_id: z.string().optional(),
  variant_id: z.string().optional(),
  quantity: z.number().int().min(0).optional(),
  discount_code: z.string().optional(),
  shipping_method: z.string().optional(),
  address: AddressSchema.optional(),
  search_query: z.string().optional(),
  search_filters: z.record(z.union([z.string(), z.array(z.string())])).optional(),
});

// ============================================================================
// UCP Error Schema
// ============================================================================

export const UCPErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});

// ============================================================================
// Type Exports (inferred from schemas)
// ============================================================================

export type MoneyInput = z.input<typeof MoneySchema>;
export type AddressInput = z.input<typeof AddressSchema>;
export type ProductInput = z.input<typeof ProductSchema>;
export type LineItemInput = z.input<typeof LineItemSchema>;
export type CheckoutInput = z.input<typeof CheckoutSchema>;
export type PaymentDataInput = z.input<typeof PaymentDataSchema>;
export type RiskSignalsInput = z.input<typeof RiskSignalsSchema>;
export type ActionInput = z.input<typeof ActionInputSchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

export function validateCheckout(data: unknown) {
  return CheckoutSchema.safeParse(data);
}

export function validatePaymentData(data: unknown) {
  return PaymentDataSchema.safeParse(data);
}

export function validateActionInput(data: unknown) {
  return ActionInputSchema.safeParse(data);
}

export function validateProduct(data: unknown) {
  return ProductSchema.safeParse(data);
}
