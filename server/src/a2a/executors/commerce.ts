/**
 * UCP Commerce Executor
 *
 * A2A executor for handling UCP commerce operations.
 * Processes shopping actions and returns UCP checkout objects.
 */

import { randomUUID } from 'crypto';
import { v1 } from '@liquidcrypto/a2a-sdk';
import { BaseA2UIExecutor, type ExecutorA2UIMessage } from './base.js';
import type { AgentExecutionContext, AgentExecutionResult } from '../adapter/index.js';
import {
  type UCPCheckout,
  type UCPProduct,
  type UCPActionInput,
  type UCPPaymentData,
  type UCPRiskSignals,
  UCP_DATA_KEYS,
  UCP_ERROR_CODES,
  UCPException,
} from '../../services/ucp/types.js';
import {
  handleAction,
  getOrCreateSession,
  completeCheckout,
  searchProductsForCheckout,
  type ActionResult,
} from '../../services/ucp/commerce-service.js';
import { getAvailableShippingMethods } from '../../services/ucp/pricing-engine.js';
import { validateActionInput } from '../../services/ucp/schemas.js';

// ============================================================================
// Intent Detection
// ============================================================================

interface DetectedIntent {
  action: UCPActionInput['action'];
  confidence: number;
  extractedParams: Partial<UCPActionInput>;
}

/**
 * Detect intent from natural language text
 */
function detectIntent(text: string): DetectedIntent {
  const lowerText = text.toLowerCase().trim();

  // Search intents
  if (
    lowerText.includes('search') ||
    lowerText.includes('find') ||
    lowerText.includes('looking for') ||
    lowerText.includes('show me') ||
    lowerText.includes('browse') ||
    lowerText.includes('what do you have')
  ) {
    // Extract search query - remove the intent words
    let searchQuery = lowerText
      .replace(/^(search for|find|looking for|show me|browse|what do you have in|what .* do you have)\s*/i, '')
      .replace(/\?$/, '')
      .trim();

    // Handle "featured products" or "all products" as empty search (returns all)
    if (searchQuery === 'featured products' || searchQuery === 'products' || searchQuery === 'all products') {
      searchQuery = '';
    }

    return {
      action: 'search_products',
      confidence: 0.8,
      extractedParams: { search_query: searchQuery || undefined },
    };
  }

  // Add to cart intents
  if (
    lowerText.includes('add to cart') ||
    lowerText.includes('add to my cart') ||
    lowerText.includes('add it') ||
    lowerText.includes('add this') ||
    lowerText.includes('i want') ||
    lowerText.includes("i'll take") ||
    lowerText.includes('buy')
  ) {
    // Try to extract quantity
    const quantityMatch = lowerText.match(/(\d+)\s*(of|x|\*)/i);
    const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : 1;

    return {
      action: 'add_to_checkout',
      confidence: 0.7,
      extractedParams: { quantity },
    };
  }

  // Remove from cart intents
  if (
    lowerText.includes('remove') ||
    lowerText.includes('delete') ||
    lowerText.includes('take out')
  ) {
    return {
      action: 'remove_from_checkout',
      confidence: 0.7,
      extractedParams: {},
    };
  }

  // Update quantity intents
  if (
    lowerText.includes('change quantity') ||
    lowerText.includes('update quantity') ||
    lowerText.match(/make it (\d+)/)
  ) {
    const quantityMatch = lowerText.match(/(\d+)/);
    const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : undefined;

    return {
      action: 'update_quantity',
      confidence: 0.7,
      extractedParams: { quantity },
    };
  }

  // Discount intents
  if (
    lowerText.includes('discount') ||
    lowerText.includes('promo') ||
    lowerText.includes('coupon') ||
    lowerText.includes('code')
  ) {
    // Try to extract discount code
    const codeMatch = lowerText.match(/code\s+(\w+)|apply\s+(\w+)|use\s+(\w+)/i);
    const discountCode = codeMatch?.[1] || codeMatch?.[2] || codeMatch?.[3];

    if (lowerText.includes('remove')) {
      return {
        action: 'remove_discount',
        confidence: 0.7,
        extractedParams: { discount_code: discountCode },
      };
    }

    return {
      action: 'apply_discount',
      confidence: 0.7,
      extractedParams: { discount_code: discountCode },
    };
  }

  // Shipping intents
  if (
    lowerText.includes('shipping') ||
    lowerText.includes('delivery') ||
    lowerText.includes('ship')
  ) {
    // Try to extract shipping method
    let shippingMethod: string | undefined;
    if (lowerText.includes('express')) shippingMethod = 'express';
    else if (lowerText.includes('overnight') || lowerText.includes('next day')) shippingMethod = 'overnight';
    else if (lowerText.includes('standard')) shippingMethod = 'standard';
    else if (lowerText.includes('pickup')) shippingMethod = 'pickup';

    return {
      action: 'set_shipping',
      confidence: 0.7,
      extractedParams: { shipping_method: shippingMethod },
    };
  }

  // Checkout intents
  if (
    lowerText.includes('checkout') ||
    lowerText.includes('complete') ||
    lowerText.includes('place order') ||
    lowerText.includes('pay') ||
    lowerText.includes('purchase')
  ) {
    return {
      action: 'complete_checkout',
      confidence: 0.8,
      extractedParams: {},
    };
  }

  // Cart status intents
  if (
    lowerText.includes('cart') ||
    lowerText.includes('basket') ||
    lowerText.includes('total') ||
    lowerText.includes('what do i have') ||
    lowerText.includes("what's in")
  ) {
    return {
      action: 'get_checkout',
      confidence: 0.8,
      extractedParams: {},
    };
  }

  // Default to search if no clear intent
  return {
    action: 'search_products',
    confidence: 0.3,
    extractedParams: { search_query: lowerText },
  };
}

// ============================================================================
// Commerce Executor
// ============================================================================

export class CommerceExecutor extends BaseA2UIExecutor {
  /**
   * Execute a commerce-related message
   */
  async execute(
    message: v1.Message,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const contextId = context.contextId;
    const wantsUI = this.wantsA2UI(context);

    // Extract UCP headers/metadata
    const ucpAgent = context.metadata?.['UCP-Agent'] as string | undefined;
    const sessionMetadata = ucpAgent ? { ucp_agent: ucpAgent } : undefined;

    try {
      // Try to extract structured action from DataPart first
      const structuredAction = this.extractStructuredAction(message);

      if (structuredAction) {
        // Handle structured UCP action
        return await this.handleStructuredAction(
          contextId,
          structuredAction,
          message,
          sessionMetadata,
          wantsUI
        );
      }

      // Fall back to natural language processing
      const text = this.extractText(message);
      if (!text) {
        return this.createHelpResponse(contextId, wantsUI);
      }

      return await this.handleNaturalLanguage(
        contextId,
        text,
        message,
        sessionMetadata,
        wantsUI
      );
    } catch (error) {
      return this.handleError(error, contextId, wantsUI);
    }
  }

  /**
   * Extract structured action from message DataParts
   */
  private extractStructuredAction(message: v1.Message): UCPActionInput | null {
    for (const part of message.parts) {
      if (v1.isDataPart(part)) {
        const data = part.data?.data || part.data;

        // Check for action field
        if (data && typeof data === 'object' && 'action' in data) {
          const validation = validateActionInput(data);
          if (validation.success) {
            return validation.data as UCPActionInput;
          }
        }
      }
    }
    return null;
  }

  /**
   * Extract payment data from message
   */
  private extractPaymentData(message: v1.Message): UCPPaymentData | null {
    for (const part of message.parts) {
      if (v1.isDataPart(part)) {
        const data = part.data?.data || part.data;

        if (data && typeof data === 'object') {
          // Check for UCP payment data key
          if (UCP_DATA_KEYS.PAYMENT_DATA in data) {
            return data[UCP_DATA_KEYS.PAYMENT_DATA] as UCPPaymentData;
          }
          // Check for direct payment_data field
          if ('payment_data' in data) {
            return data.payment_data as UCPPaymentData;
          }
        }
      }
    }
    return null;
  }

  /**
   * Extract risk signals from message
   */
  private extractRiskSignals(message: v1.Message): UCPRiskSignals | null {
    for (const part of message.parts) {
      if (v1.isDataPart(part)) {
        const data = part.data?.data || part.data;

        if (data && typeof data === 'object') {
          if (UCP_DATA_KEYS.RISK_SIGNALS in data) {
            return data[UCP_DATA_KEYS.RISK_SIGNALS] as UCPRiskSignals;
          }
          if ('risk_signals' in data) {
            return data.risk_signals as UCPRiskSignals;
          }
        }
      }
    }
    return null;
  }

  /**
   * Handle a structured UCP action
   */
  private async handleStructuredAction(
    contextId: string,
    action: UCPActionInput,
    message: v1.Message,
    sessionMetadata: Record<string, string> | undefined,
    wantsUI: boolean
  ): Promise<AgentExecutionResult> {
    // Special handling for complete_checkout
    if (action.action === 'complete_checkout') {
      const paymentData = this.extractPaymentData(message);
      const riskSignals = this.extractRiskSignals(message);

      if (!paymentData) {
        return this.createTextResponse(
          'To complete your purchase, please provide payment information.',
          contextId
        );
      }

      const session = getOrCreateSession(contextId, sessionMetadata);
      const checkout = await completeCheckout(session, paymentData, riskSignals || undefined);

      return this.createCheckoutResponse(
        checkout,
        `Order confirmed! Your order number is ${checkout.order?.order_number}. Thank you for your purchase!`,
        contextId,
        wantsUI
      );
    }

    // Handle other actions through the commerce service
    const result = await handleAction(contextId, action, sessionMetadata);
    return this.createActionResultResponse(result, contextId, wantsUI);
  }

  /**
   * Handle natural language input
   */
  private async handleNaturalLanguage(
    contextId: string,
    text: string,
    message: v1.Message,
    sessionMetadata: Record<string, string> | undefined,
    wantsUI: boolean
  ): Promise<AgentExecutionResult> {
    // Detect intent from text
    const intent = detectIntent(text);

    // Build action from intent
    const action: UCPActionInput = {
      action: intent.action,
      ...intent.extractedParams,
    };

    // Handle complete_checkout specially
    if (action.action === 'complete_checkout') {
      const paymentData = this.extractPaymentData(message);

      if (paymentData) {
        const riskSignals = this.extractRiskSignals(message);
        const session = getOrCreateSession(contextId, sessionMetadata);
        const checkout = await completeCheckout(session, paymentData, riskSignals || undefined);

        return this.createCheckoutResponse(
          checkout,
          `Order confirmed! Your order number is ${checkout.order?.order_number}. Thank you for your purchase!`,
          contextId,
          wantsUI
        );
      }

      // No payment data - show checkout summary instead
      const result = await handleAction(contextId, { action: 'get_checkout' }, sessionMetadata);

      if (!result.checkout || result.checkout.line_items.length === 0) {
        return this.createTextResponse('Your cart is empty. Add some items before checking out!', contextId);
      }

      return this.createCheckoutResponse(
        result.checkout,
        `Ready to checkout! Your total is $${result.checkout.total.amount}. Please provide payment information to complete your purchase.`,
        contextId,
        wantsUI
      );
    }

    // Handle other actions
    const result = await handleAction(contextId, action, sessionMetadata);
    return this.createActionResultResponse(result, contextId, wantsUI);
  }

  /**
   * Create a response from an action result
   */
  private createActionResultResponse(
    result: ActionResult,
    contextId: string,
    wantsUI: boolean
  ): AgentExecutionResult {
    if (result.checkout) {
      return this.createCheckoutResponse(result.checkout, result.message, contextId, wantsUI);
    }

    if (result.products && result.products.length > 0) {
      return this.createProductsResponse(result.products, result.message, contextId, wantsUI);
    }

    if (result.product) {
      return this.createProductDetailResponse(result.product, result.message, contextId, wantsUI);
    }

    if (result.shipping_methods) {
      return this.createShippingMethodsResponse(result.shipping_methods, result.message, contextId, wantsUI);
    }

    return this.createTextResponse(result.message, contextId);
  }

  /**
   * Create a checkout response with UCP data
   */
  private createCheckoutResponse(
    checkout: UCPCheckout,
    message: string,
    contextId: string,
    wantsUI: boolean
  ): AgentExecutionResult {
    const parts: v1.Part[] = [
      { text: message },
      {
        data: {
          data: {
            [UCP_DATA_KEYS.CHECKOUT]: checkout,
          },
        },
      } as v1.DataPart,
    ];

    const artifacts: v1.Artifact[] = [
      this.createTextArtifact(message),
      {
        artifactId: randomUUID(),
        name: 'ucp-checkout',
        parts: [
          {
            data: {
              data: {
                [UCP_DATA_KEYS.CHECKOUT]: checkout,
              },
            },
          } as v1.DataPart,
        ],
      },
    ];

    if (wantsUI) {
      const a2ui = this.buildCheckoutA2UI(checkout);
      artifacts.push(this.createA2UIArtifact(a2ui, 'checkout-ui'));
    }

    return {
      message: this.createAgentMessage(parts, contextId),
      artifacts,
      status: v1.TaskState.COMPLETED,
    };
  }

  /**
   * Create a products list response
   */
  private createProductsResponse(
    products: UCPProduct[],
    message: string,
    contextId: string,
    wantsUI: boolean
  ): AgentExecutionResult {
    const parts: v1.Part[] = [
      { text: message },
      {
        data: {
          data: {
            [UCP_DATA_KEYS.PRODUCTS]: products,
          },
        },
      } as v1.DataPart,
    ];

    const artifacts: v1.Artifact[] = [
      this.createTextArtifact(this.formatProductsList(products)),
      {
        artifactId: randomUUID(),
        name: 'products',
        parts: [
          {
            data: {
              data: {
                [UCP_DATA_KEYS.PRODUCTS]: products,
              },
            },
          } as v1.DataPart,
        ],
      },
    ];

    if (wantsUI) {
      const a2ui = this.buildProductsA2UI(products);
      artifacts.push(this.createA2UIArtifact(a2ui, 'products-ui'));
    }

    return {
      message: this.createAgentMessage(parts, contextId),
      artifacts,
      status: v1.TaskState.COMPLETED,
    };
  }

  /**
   * Create a product detail response
   */
  private createProductDetailResponse(
    product: UCPProduct,
    message: string,
    contextId: string,
    wantsUI: boolean
  ): AgentExecutionResult {
    const parts: v1.Part[] = [
      { text: message },
      {
        data: {
          data: {
            [UCP_DATA_KEYS.PRODUCT]: product,
          },
        },
      } as v1.DataPart,
    ];

    const artifacts: v1.Artifact[] = [
      this.createTextArtifact(this.formatProductDetail(product)),
      {
        artifactId: randomUUID(),
        name: 'product',
        parts: [
          {
            data: {
              data: {
                [UCP_DATA_KEYS.PRODUCT]: product,
              },
            },
          } as v1.DataPart,
        ],
      },
    ];

    if (wantsUI) {
      const a2ui = this.buildProductDetailA2UI(product);
      artifacts.push(this.createA2UIArtifact(a2ui, 'product-ui'));
    }

    return {
      message: this.createAgentMessage(parts, contextId),
      artifacts,
      status: v1.TaskState.COMPLETED,
    };
  }

  /**
   * Create shipping methods response
   */
  private createShippingMethodsResponse(
    methods: Array<{ id: string; name: string; price: { amount: string } }>,
    message: string,
    contextId: string,
    _wantsUI: boolean
  ): AgentExecutionResult {
    const formatted = methods.map((m) => `• ${m.name}: $${m.price.amount}`).join('\n');

    return this.createTextResponse(`${message}\n\n${formatted}`, contextId);
  }

  /**
   * Create help response
   */
  private createHelpResponse(
    contextId: string,
    _wantsUI: boolean
  ): AgentExecutionResult {
    const helpText = `Welcome to Cymbal Outfitters! I can help you with:

• **Search products**: "Find running shoes" or "Show me t-shirts under $30"
• **Add to cart**: "Add the Bitcoin hoodie to my cart"
• **Apply discounts**: "Apply code WELCOME10"
• **Choose shipping**: "Use express shipping"
• **Checkout**: "Complete my purchase"
• **View cart**: "What's in my cart?"

What would you like to do?`;

    return this.createTextResponse(helpText, contextId);
  }

  /**
   * Handle errors
   */
  private handleError(
    error: unknown,
    contextId: string,
    _wantsUI: boolean
  ): AgentExecutionResult {
    if (error instanceof UCPException) {
      return this.createTextResponse(
        `Sorry, there was an issue: ${error.message}`,
        contextId
      );
    }

    console.error('Commerce executor error:', error);
    return this.createTextResponse(
      'Sorry, something went wrong. Please try again.',
      contextId
    );
  }

  // ==========================================================================
  // Formatting Helpers
  // ==========================================================================

  private formatProductsList(products: UCPProduct[]): string {
    if (products.length === 0) return 'No products found.';

    return products
      .slice(0, 10)
      .map((p) => {
        const price = `$${p.price.amount}`;
        const rating = '⭐'.repeat(Math.round(p.rating));
        return `**${p.name}** - ${price} ${rating}\n${p.description.substring(0, 100)}...`;
      })
      .join('\n\n');
  }

  private formatProductDetail(product: UCPProduct): string {
    const lines = [
      `# ${product.name}`,
      `**Price:** $${product.price.amount}`,
      product.compare_at_price ? `~~$${product.compare_at_price.amount}~~ SALE` : '',
      `**Rating:** ${'⭐'.repeat(Math.round(product.rating))} (${product.review_count} reviews)`,
      `**Brand:** ${product.brand || 'Cymbal Outfitters'}`,
      '',
      product.description,
      '',
      `**In Stock:** ${product.inventory.in_stock ? 'Yes' : 'No'}`,
    ];

    if (product.variants && product.variants.length > 0) {
      lines.push('', '**Available Options:**');
      for (const variant of product.variants.slice(0, 5)) {
        lines.push(`• ${variant.name}`);
      }
    }

    return lines.filter(Boolean).join('\n');
  }

  // ==========================================================================
  // A2UI Builders
  // ==========================================================================

  private buildCheckoutA2UI(checkout: UCPCheckout): ExecutorA2UIMessage[] {
    const components: Array<{ id: string; component: Record<string, unknown> }> = [];

    // Title
    components.push({
      id: 'title',
      component: this.Text('Shopping Cart', 'h1'),
    });

    // Line items
    const itemIds: string[] = [];
    checkout.line_items.forEach((item, index) => {
      const itemId = `item-${index}`;
      itemIds.push(itemId);
      components.push({
        id: itemId,
        component: this.Row(
          [`item-${index}-name`, `item-${index}-qty`, `item-${index}-price`],
          { justify: 'space-between', align: 'center' }
        ),
      });
      components.push({
        id: `item-${index}-name`,
        component: this.Text(item.name),
      });
      components.push({
        id: `item-${index}-qty`,
        component: this.Text(`x${item.quantity}`),
      });
      components.push({
        id: `item-${index}-price`,
        component: this.Text(`$${item.total_price.amount}`),
      });
    });

    // Totals
    components.push({
      id: 'divider',
      component: this.Divider(),
    });
    components.push({
      id: 'subtotal',
      component: this.Row(['subtotal-label', 'subtotal-value'], { justify: 'space-between' }),
    });
    components.push({
      id: 'subtotal-label',
      component: this.Text('Subtotal'),
    });
    components.push({
      id: 'subtotal-value',
      component: this.Text(`$${checkout.subtotal.amount}`),
    });
    components.push({
      id: 'total',
      component: this.Row(['total-label', 'total-value'], { justify: 'space-between' }),
    });
    components.push({
      id: 'total-label',
      component: this.Text('Total', 'h2'),
    });
    components.push({
      id: 'total-value',
      component: this.Text(`$${checkout.total.amount}`, 'h2'),
    });

    // Root
    components.push({
      id: 'root',
      component: this.Card(['content']),
    });
    components.push({
      id: 'content',
      component: this.Column(['title', ...itemIds, 'divider', 'subtotal', 'total']),
    });

    return [
      {
        type: 'beginRendering',
        surfaceId: 'checkout',
        rootComponentId: 'root',
      },
      {
        type: 'surfaceUpdate',
        surfaceId: 'checkout',
        components,
      },
    ];
  }

  private buildProductsA2UI(products: UCPProduct[]): ExecutorA2UIMessage[] {
    const components: Array<{ id: string; component: Record<string, unknown> }> = [];
    const productIds: string[] = [];

    products.slice(0, 6).forEach((product, index) => {
      const productId = `product-${index}`;
      productIds.push(productId);

      components.push({
        id: productId,
        component: this.Card([`${productId}-content`]),
      });
      components.push({
        id: `${productId}-content`,
        component: this.Column([`${productId}-name`, `${productId}-price`, `${productId}-add`]),
      });
      components.push({
        id: `${productId}-name`,
        component: this.Text(product.name, 'h3'),
      });
      components.push({
        id: `${productId}-price`,
        component: this.Text(`$${product.price.amount}`),
      });
      components.push({
        id: `${productId}-add`,
        component: this.Button('Add to Cart', `add-${product.id}`, 'primary'),
      });
    });

    components.push({
      id: 'root',
      component: this.Column(productIds),
    });

    return [
      {
        type: 'beginRendering',
        surfaceId: 'products',
        rootComponentId: 'root',
      },
      {
        type: 'surfaceUpdate',
        surfaceId: 'products',
        components,
      },
    ];
  }

  private buildProductDetailA2UI(product: UCPProduct): ExecutorA2UIMessage[] {
    const components: Array<{ id: string; component: Record<string, unknown> }> = [];

    components.push({
      id: 'root',
      component: this.Card(['content']),
    });
    components.push({
      id: 'content',
      component: this.Column(['name', 'price', 'description', 'add-btn']),
    });
    components.push({
      id: 'name',
      component: this.Text(product.name, 'h1'),
    });
    components.push({
      id: 'price',
      component: this.Text(`$${product.price.amount}`, 'h2'),
    });
    components.push({
      id: 'description',
      component: this.Text(product.description),
    });
    components.push({
      id: 'add-btn',
      component: this.Button('Add to Cart', `add-${product.id}`, 'primary'),
    });

    return [
      {
        type: 'beginRendering',
        surfaceId: 'product-detail',
        rootComponentId: 'root',
      },
      {
        type: 'surfaceUpdate',
        surfaceId: 'product-detail',
        components,
      },
    ];
  }
}

/**
 * Get the agent card for the commerce executor
 */
export function getCommerceAgentCard(baseUrl: string) {
  // Import from ucp-discovery to avoid duplication
  // This is just a stub - the actual card comes from ucp-discovery.ts
  return {
    protocolVersions: ['1.0'],
    name: 'Cymbal Outfitters Commerce',
    description: 'UCP Commerce Agent',
    version: '1.0.0',
    skills: [
      {
        id: 'commerce',
        name: 'Commerce',
        description: 'Handle shopping and checkout',
        tags: ['shopping', 'commerce', 'checkout', 'ucp', 'cart', 'buy'],
      },
    ],
  };
}
