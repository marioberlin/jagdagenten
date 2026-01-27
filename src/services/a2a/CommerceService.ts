/**
 * Commerce Service (UCP)
 *
 * A2A client service for the Cymbal Outfitters UCP demo store.
 * Handles product search, cart management, and checkout flow.
 */
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// UCP Types (matching server schemas)
// ============================================================================

export interface Money {
  amount: string;
  currency: string;
}

export interface Address {
  first_name: string;
  last_name: string;
  company?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  price?: Money;
  attributes: Record<string, string>;
  inventory: {
    in_stock: boolean;
    quantity: number;
  };
  images?: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  brand?: string;
  category: string;
  subcategory?: string;
  images: string[];
  price: Money;
  compare_at_price?: Money;
  variants?: ProductVariant[];
  attributes: Record<string, string>;
  inventory: {
    in_stock: boolean;
    quantity: number;
  };
  tags: string[];
  rating: number;
  review_count: number;
}

export interface LineItem {
  id: string;
  product_id: string;
  variant_id?: string;
  name: string;
  description?: string;
  image_url?: string;
  sku?: string;
  quantity: number;
  unit_price: Money;
  total_price: Money;
  attributes?: Record<string, string>;
}

export interface AppliedDiscount {
  code: string;
  description: string;
  amount: Money;
  type: 'percentage' | 'fixed' | 'free_shipping' | 'buy_x_get_y';
}

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  carrier?: string;
  price: Money;
  estimated_days_min: number;
  estimated_days_max: number;
  tracking_available: boolean;
}

export interface ShippingSelection {
  method_id: string;
  method_name: string;
  price: Money;
  estimated_delivery?: string;
}

export interface TaxLine {
  name: string;
  rate: number;
  amount: Money;
  taxable_amount: Money;
}

export interface Order {
  id: string;
  order_number: string;
  permalink_url: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded';
  fulfillment_status: 'unfulfilled' | 'partial' | 'fulfilled';
  tracking_number?: string;
  tracking_url?: string;
  created_at: string;
}

export interface Checkout {
  id: string;
  status: 'draft' | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'expired';
  currency: string;
  line_items: LineItem[];
  item_count: number;
  subtotal: Money;
  discounts: AppliedDiscount[];
  discount_total: Money;
  shipping?: ShippingSelection;
  shipping_total: Money;
  tax_lines: TaxLine[];
  tax_total: Money;
  total: Money;
  shipping_address?: Address;
  billing_address?: Address;
  note?: string;
  order?: Order;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Commerce Update Type
// ============================================================================

export interface CommerceUpdate {
  type: 'checkout_update';
  checkout: Checkout;
  availableShippingMethods?: ShippingMethod[];
  message?: string;
}

export interface ProductSearchResult {
  type: 'product_search';
  products: Product[];
  total: number;
  query?: string;
  filters?: Record<string, any>;
}

export interface ProductDetailResult {
  type: 'product_detail';
  product: Product;
}

export type CommerceResult = CommerceUpdate | ProductSearchResult | ProductDetailResult;

// ============================================================================
// Commerce Service
// ============================================================================

const getBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || '';
};

// API mode: 'rest' for simpler REST API, 'a2a' for full JSON-RPC A2A
const API_MODE: 'rest' | 'a2a' = 'rest';

export class CommerceService {
  private baseUrl: string;
  private contextId: string;
  private onCheckoutUpdate?: (data: CommerceUpdate) => void;
  private onProductSearch?: (data: ProductSearchResult) => void;
  private onProductDetail?: (data: ProductDetailResult) => void;
  private useRestApi: boolean;

  constructor(
    contextId: string = uuidv4(),
    callbacks?: {
      onCheckoutUpdate?: (data: CommerceUpdate) => void;
      onProductSearch?: (data: ProductSearchResult) => void;
      onProductDetail?: (data: ProductDetailResult) => void;
    }
  ) {
    this.baseUrl = getBaseUrl();
    this.contextId = contextId;
    this.onCheckoutUpdate = callbacks?.onCheckoutUpdate;
    this.onProductSearch = callbacks?.onProductSearch;
    this.onProductDetail = callbacks?.onProductDetail;
    this.useRestApi = API_MODE === 'rest';
  }

  /**
   * Send a natural language message to the commerce agent
   */
  async sendMessage(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/agents/commerce/a2a`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'SendMessage',
          id: uuidv4(),
          params: {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            contextId: this.contextId,
            message: {
              id: uuidv4(),
              contextId: this.contextId,
              role: 'user',
              timestamp: new Date().toISOString(),
              parts: [{ text: prompt }]
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Commerce Agent Error: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();

      if (json.error) {
        throw new Error(json.error.message || 'Unknown commerce agent error');
      }

      const result = json.result;
      const artifacts = result.artifacts || [];

      // Also check message parts for data
      const message = result.message;
      if (message?.parts) {
        for (const part of message.parts) {
          if (part.data) {
            const dataContent = part.data.data || part.data;
            this.handleDataPart(dataContent);
          }
        }
      }

      // Extract and dispatch data updates from artifacts
      for (const artifact of artifacts) {
        for (const part of artifact.parts || []) {
          // Handle both data part formats
          const dataContent = part.data?.data || part.data;
          if (dataContent) {
            this.handleDataPart(dataContent);
          }
        }
      }

      // Extract text response from message or artifacts
      let textResponse = '';

      // Check message parts for text
      if (message?.parts) {
        const textPart = message.parts.find((p: any) => p.text !== undefined);
        if (textPart?.text) {
          textResponse = textPart.text;
        }
      }

      // Fall back to artifacts
      if (!textResponse && artifacts.length > 0) {
        const textPart = artifacts
          .flatMap((a: any) => a.parts)
          .find((p: any) => p.text !== undefined);
        textResponse = textPart?.text || '';
      }

      return textResponse || "Request processed.";

    } catch (error) {
      console.error('Commerce Service Error:', error);
      return "I'm having trouble connecting to the store. Please try again.";
    }
  }

  /**
   * Execute a structured UCP action
   */
  async executeAction(action: {
    action: string;
    product_id?: string;
    variant_id?: string;
    quantity?: number;
    discount_code?: string;
    shipping_method?: string;
    address?: Address;
    search_query?: string;
    search_filters?: Record<string, any>;
    payment_token?: string;
  }): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/agents/commerce/a2a`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'SendMessage',
          id: uuidv4(),
          params: {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            contextId: this.contextId,
            message: {
              id: uuidv4(),
              contextId: this.contextId,
              role: 'user',
              timestamp: new Date().toISOString(),
              parts: [
                {
                  type: 'data',
                  mimeType: 'application/json',
                  data: action
                }
              ]
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Commerce Agent Error: ${response.status}`);
      }

      const json = await response.json();

      if (json.error) {
        throw new Error(json.error.message || 'Action failed');
      }

      const result = json.result;
      const artifacts = result.artifacts || [];

      // Also check message parts for data
      const message = result.message;
      if (message?.parts) {
        for (const part of message.parts) {
          const dataContent = part.data?.data || part.data;
          if (dataContent) {
            this.handleDataPart(dataContent);
          }
        }
      }

      // Extract and dispatch data updates from artifacts
      for (const artifact of artifacts) {
        for (const part of artifact.parts || []) {
          const dataContent = part.data?.data || part.data;
          if (dataContent) {
            this.handleDataPart(dataContent);
          }
        }
      }

      // Extract text response from message or artifacts
      let textResponse = '';

      // Check message parts for text
      if (message?.parts) {
        const textPart = message.parts.find((p: any) => p.text !== undefined);
        if (textPart?.text) {
          textResponse = textPart.text;
        }
      }

      // Fall back to artifacts
      if (!textResponse && artifacts.length > 0) {
        const textPart = artifacts
          .flatMap((a: any) => a.parts)
          .find((p: any) => p.text !== undefined);
        textResponse = textPart?.text || '';
      }

      return textResponse || "Action completed.";

    } catch (error) {
      console.error('Commerce Action Error:', error);
      throw error;
    }
  }

  private handleDataPart(data: any) {
    // Handle UCP data keys format (a2a.ucp.* namespace)
    if (data['a2a.ucp.checkout'] && this.onCheckoutUpdate) {
      this.onCheckoutUpdate({
        type: 'checkout_update',
        checkout: data['a2a.ucp.checkout'],
        availableShippingMethods: data['a2a.ucp.shipping_methods'],
        message: data['a2a.ucp.message']
      });
      return;
    }

    if (data['a2a.ucp.products'] && this.onProductSearch) {
      this.onProductSearch({
        type: 'product_search',
        products: data['a2a.ucp.products'],
        total: data['a2a.ucp.products']?.length || 0,
        query: data['a2a.ucp.query']
      });
      return;
    }

    if (data['a2a.ucp.product'] && this.onProductDetail) {
      this.onProductDetail({
        type: 'product_detail',
        product: data['a2a.ucp.product']
      });
      return;
    }

    // Legacy format support
    switch (data.type) {
      case 'checkout_update':
        if (this.onCheckoutUpdate) {
          this.onCheckoutUpdate(data as CommerceUpdate);
        }
        break;
      case 'product_search':
        if (this.onProductSearch) {
          this.onProductSearch(data as ProductSearchResult);
        }
        break;
      case 'product_detail':
        if (this.onProductDetail) {
          this.onProductDetail(data as ProductDetailResult);
        }
        break;
    }
  }

  // ============================================================================
  // REST API Methods
  // ============================================================================

  private async restRequest<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api/ucp${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // ============================================================================
  // Convenience Methods
  // ============================================================================

  async searchProducts(query: string, filters?: Record<string, any>): Promise<string> {
    if (this.useRestApi) {
      try {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (filters?.category) params.set('category', filters.category);
        if (filters?.min_price) params.set('min_price', filters.min_price.toString());
        if (filters?.max_price) params.set('max_price', filters.max_price.toString());
        if (filters?.brand) params.set('brand', filters.brand);
        if (filters?.in_stock) params.set('in_stock', 'true');

        const result = await this.restRequest<{
          success: boolean;
          products: Product[];
          total: number;
          query?: string;
        }>(`/products?${params.toString()}`);

        if (result.products && this.onProductSearch) {
          this.onProductSearch({
            type: 'product_search',
            products: result.products,
            total: result.total,
            query: result.query,
          });
        }

        return result.total > 0
          ? `Found ${result.total} product${result.total !== 1 ? 's' : ''}`
          : 'No products found';
      } catch (error) {
        console.error('Search error:', error);
        return "I'm having trouble searching. Please try again.";
      }
    }

    return this.executeAction({
      action: 'search_products',
      search_query: query,
      search_filters: filters
    });
  }

  async getProductDetails(productId: string): Promise<string> {
    if (this.useRestApi) {
      try {
        const result = await this.restRequest<{
          success: boolean;
          product?: Product;
          error?: string;
        }>(`/products/${productId}`);

        if (result.product && this.onProductDetail) {
          this.onProductDetail({
            type: 'product_detail',
            product: result.product,
          });
        }

        return result.product ? `Here are the details for ${result.product.name}` : 'Product not found';
      } catch (error) {
        console.error('Product details error:', error);
        return "I'm having trouble loading product details.";
      }
    }

    return this.executeAction({
      action: 'get_product',
      product_id: productId
    });
  }

  async addToCart(productId: string, quantity: number = 1, variantId?: string): Promise<string> {
    if (this.useRestApi) {
      try {
        const result = await this.restRequest<{
          success: boolean;
          checkout?: Checkout;
          message?: string;
          error?: { message: string };
        }>(`/checkout/${this.contextId}/items`, {
          method: 'POST',
          body: JSON.stringify({ product_id: productId, quantity, variant_id: variantId }),
        });

        if (result.checkout && this.onCheckoutUpdate) {
          this.onCheckoutUpdate({
            type: 'checkout_update',
            checkout: result.checkout,
          });
        }

        return result.message || (result.success ? 'Added to cart' : result.error?.message || 'Failed to add');
      } catch (error) {
        console.error('Add to cart error:', error);
        return "I'm having trouble adding to cart.";
      }
    }

    return this.executeAction({
      action: 'add_to_checkout',
      product_id: productId,
      variant_id: variantId,
      quantity
    });
  }

  async removeFromCart(productId: string): Promise<string> {
    if (this.useRestApi) {
      try {
        const result = await this.restRequest<{
          success: boolean;
          checkout?: Checkout;
          message?: string;
        }>(`/checkout/${this.contextId}/items/${productId}`, {
          method: 'DELETE',
        });

        if (result.checkout && this.onCheckoutUpdate) {
          this.onCheckoutUpdate({
            type: 'checkout_update',
            checkout: result.checkout,
          });
        }

        return result.message || 'Item removed';
      } catch (error) {
        console.error('Remove from cart error:', error);
        return "I'm having trouble removing the item.";
      }
    }

    return this.executeAction({
      action: 'remove_from_checkout',
      product_id: productId
    });
  }

  async updateQuantity(productId: string, quantity: number): Promise<string> {
    if (this.useRestApi) {
      try {
        const result = await this.restRequest<{
          success: boolean;
          checkout?: Checkout;
          message?: string;
        }>(`/checkout/${this.contextId}/items/${productId}`, {
          method: 'PATCH',
          body: JSON.stringify({ quantity }),
        });

        if (result.checkout && this.onCheckoutUpdate) {
          this.onCheckoutUpdate({
            type: 'checkout_update',
            checkout: result.checkout,
          });
        }

        return result.message || 'Quantity updated';
      } catch (error) {
        console.error('Update quantity error:', error);
        return "I'm having trouble updating the quantity.";
      }
    }

    return this.executeAction({
      action: 'update_quantity',
      product_id: productId,
      quantity
    });
  }

  async applyDiscount(code: string): Promise<string> {
    if (this.useRestApi) {
      try {
        const result = await this.restRequest<{
          success: boolean;
          checkout?: Checkout;
          message?: string;
          error?: { message: string };
        }>(`/checkout/${this.contextId}/discounts`, {
          method: 'POST',
          body: JSON.stringify({ code }),
        });

        if (result.checkout && this.onCheckoutUpdate) {
          this.onCheckoutUpdate({
            type: 'checkout_update',
            checkout: result.checkout,
          });
        }

        return result.message || (result.success ? 'Discount applied' : result.error?.message || 'Invalid code');
      } catch (error) {
        console.error('Apply discount error:', error);
        return "I'm having trouble applying the discount.";
      }
    }

    return this.executeAction({
      action: 'apply_discount',
      discount_code: code
    });
  }

  async removeDiscount(code: string): Promise<string> {
    if (this.useRestApi) {
      try {
        const result = await this.restRequest<{
          success: boolean;
          checkout?: Checkout;
          message?: string;
        }>(`/checkout/${this.contextId}/discounts/${code}`, {
          method: 'DELETE',
        });

        if (result.checkout && this.onCheckoutUpdate) {
          this.onCheckoutUpdate({
            type: 'checkout_update',
            checkout: result.checkout,
          });
        }

        return result.message || 'Discount removed';
      } catch (error) {
        console.error('Remove discount error:', error);
        return "I'm having trouble removing the discount.";
      }
    }

    return this.executeAction({
      action: 'remove_discount',
      discount_code: code
    });
  }

  async setShippingMethod(methodId: string): Promise<string> {
    if (this.useRestApi) {
      try {
        const result = await this.restRequest<{
          success: boolean;
          checkout?: Checkout;
          message?: string;
          shipping_methods?: ShippingMethod[];
        }>(`/checkout/${this.contextId}/shipping`, {
          method: 'POST',
          body: JSON.stringify({ method_id: methodId }),
        });

        if (result.checkout && this.onCheckoutUpdate) {
          this.onCheckoutUpdate({
            type: 'checkout_update',
            checkout: result.checkout,
            availableShippingMethods: result.shipping_methods,
          });
        }

        return result.message || 'Shipping method set';
      } catch (error) {
        console.error('Set shipping error:', error);
        return "I'm having trouble setting shipping.";
      }
    }

    return this.executeAction({
      action: 'set_shipping',
      shipping_method: methodId
    });
  }

  async setShippingAddress(address: Address): Promise<string> {
    if (this.useRestApi) {
      try {
        const result = await this.restRequest<{
          success: boolean;
          checkout?: Checkout;
          message?: string;
        }>(`/checkout/${this.contextId}/address`, {
          method: 'POST',
          body: JSON.stringify(address),
        });

        if (result.checkout && this.onCheckoutUpdate) {
          this.onCheckoutUpdate({
            type: 'checkout_update',
            checkout: result.checkout,
          });
        }

        return result.message || 'Address saved';
      } catch (error) {
        console.error('Set address error:', error);
        return "I'm having trouble saving the address.";
      }
    }

    return this.executeAction({
      action: 'set_address',
      address
    });
  }

  async checkout(paymentToken: string = 'tok_success'): Promise<string> {
    if (this.useRestApi) {
      try {
        const result = await this.restRequest<{
          success: boolean;
          checkout?: Checkout;
          order?: Order;
          message?: string;
          error?: string;
        }>(`/checkout/${this.contextId}/complete`, {
          method: 'POST',
          body: JSON.stringify({ payment_token: paymentToken }),
        });

        if (result.checkout && this.onCheckoutUpdate) {
          this.onCheckoutUpdate({
            type: 'checkout_update',
            checkout: result.checkout,
          });
        }

        return result.message || (result.success ? 'Order completed!' : result.error || 'Checkout failed');
      } catch (error) {
        console.error('Checkout error:', error);
        return "I'm having trouble completing checkout.";
      }
    }

    return this.executeAction({
      action: 'complete_checkout',
      payment_token: paymentToken
    });
  }

  async getCheckout(): Promise<string> {
    if (this.useRestApi) {
      try {
        const result = await this.restRequest<{
          success: boolean;
          checkout?: Checkout;
          shipping_methods?: ShippingMethod[];
        }>(`/checkout/${this.contextId}`);

        if (result.checkout && this.onCheckoutUpdate) {
          this.onCheckoutUpdate({
            type: 'checkout_update',
            checkout: result.checkout,
            availableShippingMethods: result.shipping_methods,
          });
        }

        if (!result.checkout || result.checkout.line_items.length === 0) {
          return 'Your cart is empty';
        }

        return `You have ${result.checkout.item_count} item${result.checkout.item_count !== 1 ? 's' : ''} in your cart`;
      } catch (error) {
        console.error('Get checkout error:', error);
        return "I'm having trouble loading your cart.";
      }
    }

    return this.executeAction({
      action: 'get_checkout'
    });
  }

  /**
   * Get available shipping methods
   */
  async getShippingMethods(): Promise<ShippingMethod[]> {
    if (this.useRestApi) {
      try {
        const result = await this.restRequest<{
          success: boolean;
          shipping_methods: ShippingMethod[];
        }>(`/checkout/${this.contextId}/shipping`);

        return result.shipping_methods || [];
      } catch (error) {
        console.error('Get shipping methods error:', error);
        return [];
      }
    }

    // For A2A mode, fetch via get_checkout
    await this.getCheckout();
    return [];
  }
}
