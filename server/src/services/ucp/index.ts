/**
 * UCP (Universal Commerce Protocol) Module
 *
 * This module provides a complete UCP implementation for the demo store.
 */

// Types
export * from './types.js';

// Schemas
export * from './schemas.js';

// Product Catalog
export {
  PRODUCT_CATALOG,
  PRODUCT_BY_ID,
  CATEGORIES,
  SUBCATEGORIES,
  searchProducts,
  getProductById,
  getProductVariant,
  getCategories,
  getSubcategories,
  getBrands,
  getFeaturedProducts,
  getSaleProducts,
  type ProductSearchFilters,
  type ProductSearchResult,
} from './product-catalog.js';

// Pricing Engine
export {
  TAX_RATES,
  DISCOUNT_CODES,
  SHIPPING_METHODS,
  getTaxRateForCategory,
  calculateTax,
  getDiscountByCode,
  validateDiscount,
  calculateDiscountAmount,
  getShippingMethodById,
  getAvailableShippingMethods,
  calculateShipping,
  recalculateCheckout,
  qualifiesForFreeShipping,
  type TaxConfig,
} from './pricing-engine.js';

// Payment Adapter
export {
  MAGIC_TOKENS,
  processPayment,
  processRefund,
  isValidPaymentMethod,
  getSupportedPaymentMethods,
  formatCardLast4,
  type ProcessPaymentOptions,
  type RefundResult,
} from './payment-adapter.js';

// Commerce Service
export {
  getOrCreateSession,
  getSession,
  updateSession,
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
  completeCheckout,
  searchProductsForCheckout,
  getProductDetails,
  getShippingOptionsForSession,
  handleAction,
  type ActionResult,
} from './commerce-service.js';
