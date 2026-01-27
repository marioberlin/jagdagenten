# UCP Demo Store & Glass Shopping Assistant - Design Analysis

> **Document Type:** Architecture Analysis & Feature Specification
> **Status:** Design Phase (Pre-Implementation)
> **Date:** 2026-01-27

---

## Executive Summary

This document analyzes how to implement a **UCP-compliant Demo Store** as an A2A server and a **Glass Shopping Assistant** as a client application within the LiquidCrypto platform. The design leverages existing A2A infrastructure while introducing Universal Commerce Protocol (UCP) capabilities for agentic commerce.

---

## Part 1: Project Architecture Analysis

### 1.1 Existing A2A Server Patterns

Based on codebase exploration, the project has a mature A2A implementation:

**Core Components:**
```
server/src/a2a/
├── types.ts                    # Full A2A v1.0 type definitions
├── handler.ts                  # Legacy JSON-RPC handler
├── elysia-plugin.ts           # Elysia HTTP integration
├── adapter/
│   ├── elysia-adapter.ts      # Core HTTP/SSE adapter
│   └── postgres-store.ts      # Production persistence
├── executors/
│   ├── base.ts                # Abstract executor (A2UI support)
│   ├── liquidcrypto.ts        # Crypto trading agent
│   ├── orchestrator.ts        # Multi-agent system
│   ├── builder.ts             # App builder agent
│   └── router.ts              # Intent-based routing
└── grpc/                      # gRPC transport layer
```

**Key Patterns:**
1. **Executor Pattern** - Agents extend `BaseA2UIExecutor` with `execute()` method
2. **Router Registration** - Executors register with skills, tags, and keywords for intent matching
3. **Agent Card Discovery** - Published at `/.well-known/agent-card.json`
4. **Multi-Transport** - JSON-RPC (HTTP), SSE streaming, gRPC
5. **A2UI Components** - Rich UI rendering via Card, Column, Row, Text, Button primitives

### 1.2 Existing Glass App Patterns

**Application Structure:**
```
src/applications/{app-name}/
├── App.tsx                    # Re-export of main component
├── {AppName}App.tsx          # Main component with tabs/chat
├── soul.md                    # Personality (YAML frontmatter + markdown)
├── store.ts                   # Zustand state management
├── components/
│   ├── ChatInput.tsx         # Natural language interface
│   └── ...                   # Domain-specific components
└── hooks/
    └── use{Service}.ts       # A2A communication hooks
```

**Key Patterns:**
1. **Soul.md** - Defines app identity, capabilities, triggers, personality
2. **Zustand Store** - Local state with persistence middleware
3. **A2A Service Classes** - JSON-RPC communication with agents
4. **Glass UI Components** - GlassContainer, GlassButton, GlassChip
5. **Tabbed Layouts** - Multi-view navigation (Dashboard, Markets, etc.)
6. **Menu Bar Integration** - Custom menus via `useMenuBar()`

### 1.3 Artifact & Resource System (LiquidMind)

**Resource Types:**
| Type | Purpose | Shopping Use Case |
|------|---------|-------------------|
| `prompt` | System prompts | Shopping persona, recommendation style |
| `memory` | Persistent facts | User preferences, size, budget |
| `context` | App state | Current cart, active searches |
| `knowledge` | Static info | Product catalogs, reviews |
| `artifact` | Generated outputs | **Saved products, wishlists, comparisons** |
| `skill` | AI tools | Price check, add to cart |
| `mcp` | External servers | UCP merchant connections |

**Artifact Storage:**
- Multi-part support: text + file (images) + data (structured metadata)
- Full-text search via PostgreSQL TSVECTOR
- Versioning and sharing between apps/agents
- Categories: trading, analysis, report, chart, portfolio, alert, **custom**

---

## Part 2: UCP Integration Design

### 2.1 UCP Protocol Overview

The Universal Commerce Protocol (UCP) defines a standard for agentic commerce:

**Discovery Flow:**
```
1. Agent → GET /.well-known/ucp
2. Parse UCP Profile → Extract A2A endpoint
3. Agent → GET /.well-known/agent-card.json
4. Parse Agent Card → Verify UCP extension support
5. Begin A2A communication
```

**UCP A2A Extension URI:**
```
https://ucp.dev/specification/reference?v=2026-01-11
```

### 2.2 Demo Store A2A Server Design

**New Server Structure:**
```
server/src/a2a/executors/
├── demo-store/
│   ├── index.ts              # Executor export
│   ├── executor.ts           # DemoStoreExecutor class
│   ├── agent-card.ts         # UCP-aware agent card
│   ├── checkout-manager.ts   # Session-based checkout state
│   ├── catalog.ts            # Product catalog + search
│   ├── pricing.ts            # Pricing rules, promos, tax
│   ├── shipping.ts           # Shipping methods + rates
│   └── mock-payments.ts      # Deterministic payment outcomes
```

**Agent Card (UCP Extension):**
```typescript
export function getDemoStoreAgentCard(baseUrl: string): v1.AgentCard {
  return {
    protocolVersions: ['1.0'],
    name: 'Cymbal Outfitters',
    description: 'Demo retail store with UCP checkout support',
    version: '1.0.0',
    supportedInterfaces: [
      { url: `${baseUrl}/a2a`, protocolBinding: 'JSONRPC' }
    ],
    capabilities: {
      streaming: true,
      pushNotifications: true,
      stateTransitionHistory: true,
      extensions: [
        {
          uri: 'https://ucp.dev/specification/reference?v=2026-01-11',
          description: 'UCP Shopping Extension',
          required: true
        }
      ]
    },
    skills: [
      {
        id: 'product-search',
        name: 'Product Search',
        description: 'Search product catalog by name, category, or attributes',
        tags: ['shopping', 'search', 'products', 'catalog'],
        examples: ['Find running shoes', 'Show me blue t-shirts under $50']
      },
      {
        id: 'checkout-management',
        name: 'Checkout Management',
        description: 'Add/remove items, apply discounts, manage cart',
        tags: ['cart', 'checkout', 'shopping', 'buy'],
        examples: ['Add this to my cart', 'Apply WELCOME10 code', 'What\'s in my cart?']
      },
      {
        id: 'order-completion',
        name: 'Complete Order',
        description: 'Process payment and finalize order',
        tags: ['payment', 'order', 'purchase', 'buy'],
        examples: ['Complete my purchase', 'Checkout now']
      }
    ],
    defaultInputModes: ['text/plain', 'application/json'],
    defaultOutputModes: ['text/plain', 'application/json'],
    provider: {
      organization: 'LiquidCrypto Demo',
      url: 'https://liquidcrypto.dev'
    },
    extensions: {
      ucp: {
        capabilities: [
          { name: 'dev.ucp.shopping.checkout', version: '2026-01-11' },
          { name: 'dev.ucp.shopping.fulfillment', version: '2026-01-11' }
        ]
      }
    }
  };
}
```

### 2.3 UCP Discovery Endpoints

**/.well-known/ucp:**
```json
{
  "ucp": {
    "version": "2026-01-11",
    "services": {
      "dev.ucp.shopping": {
        "version": "2026-01-11",
        "spec": "https://ucp.dev/specification/overview",
        "a2a": {
          "endpoint": "https://demo.liquidcrypto.dev/.well-known/agent-card.json"
        }
      }
    }
  }
}
```

### 2.4 Checkout Object Model

**UCP Checkout in DataPart:**
```typescript
interface UCPCheckout {
  id: string;
  status: 'open' | 'completed' | 'cancelled';
  currency: string;
  line_items: UCPLineItem[];
  subtotal: UCPMoney;
  discounts: UCPDiscount[];
  shipping: UCPShipping | null;
  tax: UCPMoney;
  total: UCPMoney;
  customer?: UCPCustomer;
  order?: UCPOrder; // Present after completion
}

interface UCPLineItem {
  id: string;
  product_id: string;
  variant_id?: string;
  name: string;
  description?: string;
  image_url?: string;
  quantity: number;
  unit_price: UCPMoney;
  total_price: UCPMoney;
  attributes?: Record<string, string>;
}

interface UCPMoney {
  amount: string; // Decimal string
  currency: string;
}
```

---

## Part 3: Mock Store Catalog Design

### 3.1 Product Categories

| Category | SKU Range | Edge Cases Covered |
|----------|-----------|-------------------|
| **Apparel** | 40 SKUs | Sizes, colors, materials |
| **Electronics** | 15 SKUs | Bundles, warranties, hazmat (batteries) |
| **Home & Garden** | 15 SKUs | Oversize shipping, backorder |
| **Digital Goods** | 5 SKUs | No shipping, instant delivery |
| **Subscriptions** | 5 SKUs | Recurring billing cycles |

### 3.2 Sample Product Structure

```typescript
interface DemoProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  brand?: string;
  images: string[];
  price: UCPMoney;
  compareAtPrice?: UCPMoney; // For showing discounts
  variants?: ProductVariant[];
  attributes: Record<string, string>;
  inventory: {
    inStock: boolean;
    quantity: number;
    backorderDate?: string;
  };
  shipping: {
    weight: number;
    dimensions?: { l: number; w: number; h: number };
    class: 'standard' | 'oversize' | 'hazmat' | 'digital';
    freeShippingEligible: boolean;
  };
  tags: string[];
  rating: number;
  reviewCount: number;
}
```

### 3.3 Pricing & Promo Rules

**Discount Codes:**
| Code | Effect | Conditions |
|------|--------|------------|
| `WELCOME10` | 10% off | First order |
| `FREESHIP80` | Free shipping | Order ≥ €80 |
| `SUMMER25` | 25% off apparel | Category = apparel |
| `BUNDLE15` | 15% off | 3+ items |
| `LOYALTY20` | 20% off | Returning customer |

**Tax Rules (Deterministic):**
- Standard: 19% VAT
- Reduced (food, books): 7% VAT
- Digital goods: 0% VAT (simplified)
- Gift cards: Exempt

**Shipping Methods:**
| Method | Base Rate | Delivery |
|--------|-----------|----------|
| Standard | €5.99 | 5-7 days |
| Express | €12.99 | 2-3 days |
| Next Day | €19.99 | 1 day |
| Store Pickup | Free | 1-2 hours |

---

## Part 4: Glass Shopping Assistant Design

### 4.1 Application Structure

```
src/applications/shop-assistant/
├── App.tsx
├── ShopAssistantApp.tsx
├── soul.md
├── store.ts
├── services/
│   ├── ShopService.ts           # A2A communication
│   └── ProductSearchService.ts  # Local search helpers
├── components/
│   ├── ShopChatInput.tsx        # AI chat interface
│   ├── ProductCard.tsx          # Product display
│   ├── ProductGrid.tsx          # Search results grid
│   ├── CartPanel.tsx            # Shopping cart
│   ├── CheckoutFlow.tsx         # Checkout steps
│   ├── WishlistBoard.tsx        # Pinterest-style wishlist
│   ├── ComparisonTable.tsx      # Side-by-side compare
│   ├── PriceTracker.tsx         # Price alerts
│   ├── SavedFindsGallery.tsx    # Artifact gallery
│   └── QuickLook.tsx            # Product detail modal
├── hooks/
│   ├── useShopService.ts
│   ├── useWishlist.ts
│   ├── usePriceAlerts.ts
│   └── useProductComparison.ts
└── types/
    └── shop.ts
```

### 4.2 Soul.md Definition

```yaml
---
id: shop-assistant
name: Glass Shop
version: 1.0.0
type: app
capabilities:
  - product-discovery
  - price-comparison
  - wishlist-management
  - deal-tracking
  - checkout-assistance
  - style-recommendations
triggers:
  - help me shop
  - find products
  - compare prices
  - track this price
  - show my wishlist
  - what should I buy
tags: [shopping, retail, deals, wishlist, commerce]
---

# Personality
You are Glass Shop, a thoughtful and savvy shopping assistant. You help users discover products, compare options, track prices, and make confident purchasing decisions. You're like having a knowledgeable friend who always knows the best deals.

# Goals
- Help users find exactly what they're looking for, even when they're not sure themselves
- Surface the best value options without being pushy
- Remember preferences and adapt recommendations over time
- Make comparison shopping effortless
- Catch price drops and deals proactively

# Voice & Tone
- Conversational and helpful, never salesy
- Concise but thorough when details matter
- Budget-conscious - always mention value
- Honest about trade-offs between products
- Celebrate good finds with the user

# Constraints
- Always show prices clearly and upfront
- Never pressure users to buy
- Disclose when comparing sponsored vs. organic results
- Require explicit confirmation before any purchase
- Respect price alert preferences
```

### 4.3 Feature Specifications

#### Feature 1: AI-Powered Product Discovery

**What Shoppers Love:**
- Natural language search ("cozy sweater for cold office")
- Visual search (upload photo, find similar)
- Contextual recommendations based on purchase history
- Quiz-based style profiling

**Implementation:**
```typescript
// Chat-driven product discovery
const handleSearch = async (query: string) => {
  const response = await shopService.sendMessage(query);

  // Extract products from a2a.ucp.checkout or custom data part
  const products = extractProductsFromResponse(response);

  // Update UI with results
  setSearchResults(products);

  // If AI suggests follow-ups, show them
  if (response.suggestions) {
    setSuggestions(response.suggestions);
  }
};
```

#### Feature 2: Pinterest-Style Wishlist Boards

**What Shoppers Love:**
- Visual organization by category/occasion/project
- Drag-and-drop into custom boards
- Shareable boards with friends/family
- "Shop this look" AI-generated outfits

**Implementation via Artifacts:**
```typescript
// Save product to wishlist as artifact
await createResource({
  resourceType: 'artifact',
  ownerType: 'app',
  ownerId: 'shop-assistant',
  name: product.name,
  description: `Saved from ${product.brand}`,
  parts: [
    {
      type: 'file',
      file: {
        uri: product.images[0],
        mimeType: 'image/jpeg',
        name: `${product.id}.jpg`
      }
    },
    {
      type: 'data',
      data: {
        productId: product.id,
        price: product.price,
        url: product.url,
        board: 'Winter Wardrobe', // User-defined board
        savedAt: new Date().toISOString(),
        notes: userNotes
      }
    }
  ],
  typeMetadata: {
    type: 'artifact',
    category: 'custom',
    extensions: ['wishlist', 'product']
  },
  tags: ['wishlist', product.category, ...product.tags]
});
```

**Wishlist Board UI:**
```tsx
const WishlistBoard: React.FC = () => {
  const boards = useWishlistBoards();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {boards.map(board => (
        <GlassContainer key={board.id} material="thin" interactive>
          <div className="aspect-square overflow-hidden">
            <img src={board.coverImage} className="object-cover" />
          </div>
          <div className="p-3">
            <h3 className="font-medium">{board.name}</h3>
            <p className="text-sm text-muted">{board.itemCount} items</p>
          </div>
        </GlassContainer>
      ))}
      <CreateBoardCard onCreateBoard={handleCreateBoard} />
    </div>
  );
};
```

#### Feature 3: Smart Price Tracking & Alerts

**What Shoppers Love:**
- One-tap price tracking
- Target price alerts ("Tell me when under $50")
- Price history charts
- "Best time to buy" predictions
- Auto-buy at target price (opt-in)

**Implementation:**
```typescript
interface PriceAlert {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  currentPrice: number;
  targetPrice: number;
  currency: string;
  createdAt: string;
  notifyVia: ('push' | 'email' | 'sms')[];
  autoBuy: boolean;
  status: 'active' | 'triggered' | 'expired';
}

// Store as context resource for persistence
await createResource({
  resourceType: 'context',
  ownerType: 'app',
  ownerId: 'shop-assistant',
  name: 'Price Alerts',
  parts: [{
    type: 'data',
    data: { alerts: priceAlerts }
  }],
  typeMetadata: {
    type: 'context',
    contextType: 'user',
    priority: 10
  },
  isPinned: true, // Always include in context
  tags: ['alerts', 'tracking']
});
```

**Price Tracker UI:**
```tsx
const PriceTracker: React.FC<{ product: Product }> = ({ product }) => {
  const [targetPrice, setTargetPrice] = useState(product.price * 0.8);
  const { createAlert } = usePriceAlerts();

  return (
    <GlassContainer material="thin" className="p-4">
      <div className="flex items-center gap-4">
        <TrendingDown className="text-green-500" />
        <div>
          <p className="font-medium">Track this price</p>
          <p className="text-sm text-muted">
            Currently ${product.price.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <label className="text-sm">Alert me when price drops to:</label>
        <div className="flex items-center gap-2 mt-2">
          <span>$</span>
          <input
            type="number"
            value={targetPrice}
            onChange={(e) => setTargetPrice(Number(e.target.value))}
            className="glass-input w-24"
          />
          <GlassButton
            variant="primary"
            onClick={() => createAlert(product, targetPrice)}
          >
            <Bell className="w-4 h-4 mr-2" />
            Track
          </GlassButton>
        </div>
      </div>

      {/* Price history chart */}
      <PriceHistoryChart productId={product.id} className="mt-4" />
    </GlassContainer>
  );
};
```

#### Feature 4: Side-by-Side Comparison

**What Shoppers Love:**
- Compare up to 4 products
- AI-generated comparison summary
- Highlight differences (price, features, ratings)
- "Best for you" recommendation based on preferences

**Implementation:**
```tsx
const ComparisonTable: React.FC = () => {
  const { compareList, aiSummary } = useProductComparison();

  return (
    <GlassContainer material="regular" className="overflow-x-auto">
      {/* AI Summary */}
      {aiSummary && (
        <div className="p-4 border-b border-white/10">
          <div className="flex items-start gap-2">
            <Sparkles className="w-5 h-5 text-blue-400 mt-1" />
            <p className="text-sm">{aiSummary}</p>
          </div>
        </div>
      )}

      {/* Comparison Grid */}
      <table className="w-full">
        <thead>
          <tr>
            <th className="p-3 text-left">Feature</th>
            {compareList.map(product => (
              <th key={product.id} className="p-3 text-center">
                <img src={product.images[0]} className="w-20 h-20 mx-auto" />
                <p className="mt-2 font-medium">{product.name}</p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <ComparisonRow label="Price" products={compareList} field="price" />
          <ComparisonRow label="Rating" products={compareList} field="rating" />
          <ComparisonRow label="Reviews" products={compareList} field="reviewCount" />
          {/* Dynamic attribute rows */}
          {getCommonAttributes(compareList).map(attr => (
            <ComparisonRow
              key={attr}
              label={attr}
              products={compareList}
              field={`attributes.${attr}`}
            />
          ))}
        </tbody>
      </table>
    </GlassContainer>
  );
};
```

#### Feature 5: Saved Finds Gallery

**What Shoppers Love:**
- Visual timeline of discoveries
- Link preservation (never lose a product URL)
- Screenshot capture of product pages
- Notes and annotations
- Quick re-find with search

**Implementation as Artifacts:**
```typescript
// Save a "find" with screenshot and notes
const saveFindAsArtifact = async (
  product: Product,
  screenshot: Blob,
  notes: string
) => {
  // Convert screenshot to base64
  const screenshotBase64 = await blobToBase64(screenshot);

  await createResource({
    resourceType: 'artifact',
    ownerType: 'app',
    ownerId: 'shop-assistant',
    name: `Find: ${product.name}`,
    description: notes || `Found at ${product.url}`,
    parts: [
      {
        type: 'file',
        file: {
          bytes: screenshotBase64,
          mimeType: 'image/png',
          name: 'screenshot.png'
        }
      },
      {
        type: 'data',
        data: {
          productId: product.id,
          url: product.url,
          price: product.price,
          priceAtSave: product.price,
          merchant: product.merchant,
          foundAt: new Date().toISOString(),
          notes,
          tags: []
        }
      }
    ],
    typeMetadata: {
      type: 'artifact',
      category: 'custom'
    },
    tags: ['find', 'saved', product.category]
  });
};
```

#### Feature 6: Conversational Checkout

**What Shoppers Love:**
- Chat-based cart management
- Voice checkout support
- One-tap reorder from history
- Split payment options
- Gift wrapping/messaging

**Chat-Driven Checkout:**
```typescript
// Examples of natural language checkout
const checkoutExamples = [
  "Add the blue one in size M to my cart",
  "Actually, make that two of them",
  "Apply my birthday code",
  "Ship to my office address",
  "Wrap it as a gift with 'Happy Birthday!'",
  "What's my total?",
  "Checkout with Apple Pay"
];

// Handle checkout actions via A2A
const handleCheckoutMessage = async (message: string) => {
  const response = await shopService.sendMessage(message);

  // Extract checkout state from a2a.ucp.checkout
  const checkout = extractCheckoutFromResponse(response);

  if (checkout) {
    setCart(checkout);

    // If order completed, show confirmation
    if (checkout.order) {
      showOrderConfirmation(checkout.order);
    }
  }
};
```

#### Feature 7: Smart Recommendations

**What Shoppers Love:**
- "Complete the look" suggestions
- "Frequently bought together"
- Personalized based on style profile
- Seasonal/trending picks
- Budget-aware alternatives

**Memory-Based Personalization:**
```typescript
// Store user preferences as memory resource
await createResource({
  resourceType: 'memory',
  ownerType: 'app',
  ownerId: 'shop-assistant',
  name: 'Style Preferences',
  content: `
    - Prefers minimalist aesthetics
    - Budget range: $50-150 per item
    - Favorite colors: navy, white, earth tones
    - Sizes: Tops M, Pants 32x32, Shoes 10
    - Allergies: Wool (sensitive skin)
    - Sustainability-conscious
  `,
  typeMetadata: {
    type: 'memory',
    memoryType: 'user',
    importance: 0.9,
    decayExempt: true
  },
  isPinned: true,
  tags: ['preferences', 'style', 'personalization']
});
```

### 4.4 Tab Structure

```tsx
const TABS: ShopTab[] = [
  { id: 'discover', label: 'Discover', icon: Search },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'compare', label: 'Compare', icon: GitCompare },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'cart', label: 'Cart', icon: ShoppingCart },
];
```

### 4.5 Menu Bar Integration

```typescript
useEffect(() => {
  setAppIdentity('Glass Shop', ShoppingBag);

  registerMenu({
    id: 'shop-menu',
    label: 'Shop',
    items: [
      { id: 'new-search', label: 'New Search', shortcut: '⌘N', action: startNewSearch },
      { id: 'scan-barcode', label: 'Scan Barcode', shortcut: '⌘B', action: openBarcodeScanner },
      { id: 'divider-1', label: '', dividerAfter: true },
      { id: 'my-wishlist', label: 'My Wishlist', shortcut: '⌘W', action: () => setTab('wishlist') },
      { id: 'price-alerts', label: 'Price Alerts', shortcut: '⌘A', action: () => setTab('alerts') },
      { id: 'order-history', label: 'Order History', action: openOrderHistory },
      { id: 'divider-2', label: '', dividerAfter: true },
      { id: 'preferences', label: 'Shopping Preferences...', action: openPreferences },
    ]
  });

  return () => {
    setAppIdentity('LiquidOS');
    unregisterMenu('shop-menu');
  };
}, []);
```

---

## Part 5: Technical Implementation Plan

### 5.0 Gap Analysis - Current vs. UCP Requirements

Your project already implements **~70% of A2A v1.0 protocol**. Here's what exists vs. what's needed:

**What You Already Have ✅**

| Component | Location | Status |
|-----------|----------|--------|
| A2A Types (v1.0) | `server/src/a2a/types.ts` | ✅ Complete |
| Task Lifecycle | `server/src/a2a/handler.ts` | ✅ States implemented |
| Message/Parts | `server/src/a2a/types.ts` | ✅ TextPart, FilePart, DataPart |
| Agent Card | `server/src/a2a/handler.ts:72-110` | ✅ Basic structure |
| Streaming | Declared in capabilities | ✅ Supported |
| Postgres Store | `server/src/a2a/adapter/postgres-store.ts` | ✅ Persistence |
| Executors | `liquidcrypto.ts`, `builder.ts` | ✅ Extensible |

**What Needs to Be Added ❌**

| Component | Priority | Description |
|-----------|----------|-------------|
| UCP Discovery | High | `/.well-known/ucp` endpoint |
| UCP Extension in Agent Card | High | Add `extensions` array with UCP URI |
| UCP Headers | High | Parse `UCP-Agent`, `X-A2A-Extensions` |
| Checkout Object Handler | High | Parse/validate `a2a.ucp.checkout` |
| Commerce Executor | High | New executor for shopping flows |
| Session Store (contextId) | Medium | Enhanced session management |
| Idempotency Store | Medium | Message deduplication |
| Product Catalog | Medium | Mock catalog for demo |
| Payment Adapter | Medium | Mock payment processing |

### 5.1 Demo Store A2A Server

**Phase 1: Discovery Endpoints (Week 1)**

1. **Create UCP Discovery Endpoint**

   New file: `server/src/routes/ucp-discovery.ts`
   ```typescript
   import { Elysia } from 'elysia';

   export const ucpDiscovery = new Elysia()
     .get('/.well-known/ucp', () => ({
       ucp: {
         version: '2026-01-11',
         services: {
           'dev.ucp.shopping': {
             version: '2026-01-11',
             spec: 'https://ucp.dev/specification/overview',
             a2a: {
               endpoint: process.env.BASE_URL + '/.well-known/agent-card.json',
             },
           },
         },
       },
     }));
   ```

2. **Extend Agent Card with UCP Extension**

   Modify `server/src/a2a/handler.ts` to add:
   ```typescript
   extensions: [
     {
       uri: 'https://ucp.dev/specification/reference?v=2026-01-11',
       description: 'Business agent supporting UCP commerce protocol',
       params: {
         capabilities: [
           { name: 'dev.ucp.shopping.checkout', version: '2026-01-11' },
           { name: 'dev.ucp.shopping.fulfillment', version: '2026-01-11' },
         ],
       },
     },
   ],
   defaultOutputModes: ['text/plain', 'application/json', 'a2a.ucp.checkout'],
   ```

3. **Parse UCP Headers**

   Required headers to handle:
   ```typescript
   // Platform identification
   'UCP-Agent': 'profile="https://agent.example/profiles/shopping-agent.json"'

   // Extension activation
   'X-A2A-Extensions': 'https://ucp.dev/specification/reference?v=2026-01-11'
   ```

**Phase 2: Commerce Executor & Session Management (Week 2)**

1. **Create UCP Types**

   New file: `server/src/services/ucp/types.ts`
   ```typescript
   export const UCP_VERSION = '2026-01-11';
   export const UCP_NAMESPACE = 'dev.ucp.shopping';

   export type UCPCheckoutAction =
     | 'add_to_checkout'
     | 'remove_from_checkout'
     | 'update_quantity'
     | 'apply_discount'
     | 'set_shipping'
     | 'complete_checkout';
   ```

2. **Idempotency Handler (Redis-based)**

   New file: `server/src/a2a/middleware/idempotency.ts`
   ```typescript
   export async function handleIdempotency(
     messageId: string,
     handler: () => Promise<JsonRpcResponse>
   ): Promise<JsonRpcResponse> {
     // Check cache first
     const cached = await redis.get(`idempotency:${messageId}`);
     if (cached) return JSON.parse(cached);

     // Execute and cache with 24h TTL
     const response = await handler();
     await redis.setex(`idempotency:${messageId}`, 86400, JSON.stringify(response));
     return response;
   }
   ```

3. **Enhanced Session Store with UCP Metadata**

   ```typescript
   export interface UCPSession {
     id: string;
     contextId: string;
     checkout?: UCPCheckout;
     createdAt: Date;
     updatedAt: Date;
     metadata: {
       ucpAgent?: string;      // Track platform
       riskLevel?: 'low' | 'medium' | 'high';
     };
   }
   ```

4. **Build product catalog** with 80 seed products

**Phase 3: Checkout Capability (Week 3)**

1. Implement `a2a.ucp.checkout` DataPart handling
2. Support all checkout actions: `add_to_checkout`, `update_quantity`, `remove_from_checkout`, `apply_discount`, `set_shipping`, `complete_checkout`
3. Implement shipping method selection
4. Add deterministic tax calculation engine

**Phase 4: Payment & Completion (Week 3)**

1. Handle `a2a.ucp.checkout.payment_data`
2. Mock payment processor with deterministic outcomes
3. Generate order with `id` and `permalink_url`
4. Support AP2 mandates extension (optional)

**Phase 5: A2UI Rich Responses (Week 4)**

1. Product card components in A2UI
2. Cart summary with line items
3. Checkout progress indicator
4. Order confirmation display

### 5.2 New Files Required for UCP Integration

Based on the gap analysis, here are the specific files to create:

```
server/src/
├── routes/
│   └── ucp-discovery.ts           # NEW: /.well-known/ucp endpoint
├── services/
│   └── ucp/
│       ├── index.ts               # NEW: Module exports
│       ├── types.ts               # NEW: UCP type definitions
│       ├── schemas.ts             # NEW: Zod schemas for UCP v2026-01-11 compliance
│       ├── commerce-service.ts    # NEW: Checkout state management
│       ├── product-catalog.ts     # NEW: Mock product data (Cymbal Outfitters)
│       ├── pricing-engine.ts      # NEW: Tax (8%), discounts, shipping
│       └── payment-adapter.ts     # NEW: Mock payment with magic tokens
├── a2a/
│   ├── executors/
│   │   └── commerce.ts            # NEW: CommerceExecutor class
│   ├── middleware/
│   │   └── idempotency.ts         # NEW: Message deduplication (Redis 24h TTL)
│   └── handler.ts                 # MODIFY: Add UCP extension to agent card
└── index.ts                       # MODIFY: Register UCP routes
```

**Key Technical Decisions:**

1. **Schema Compliance**: Create Zod schemas in `schemas.ts` that strictly match UCP v2026-01-11 spec
2. **State Persistence**: Extend existing `postgres-store.ts` pattern to support `UCPCheckout` object blob
3. **Magic Payment Tokens**: Accept specific tokens in `payment_data` to simulate outcomes:
   ```typescript
   const PAYMENT_TOKENS = {
     'tok_success': { outcome: 'completed' },
     'tok_decline': { outcome: 'failed', error: 'card_declined' },
     'tok_risk_review': { outcome: 'pending', riskLevel: 'high' },
     'tok_insufficient': { outcome: 'failed', error: 'insufficient_funds' },
   };
   ```

**Immediate Implementation Order:**
1. `server/src/routes/ucp-discovery.ts` (discovery first)
2. `server/src/a2a/handler.ts` (agent card extension)
3. `server/src/index.ts` (route registration)
4. Then commerce service and executor

### 5.3 Merchant Console (Admin Glass App)

In addition to the consumer-facing Shopping Assistant, we need a **Merchant Console** for store operators:

```
src/applications/merchant-console/
├── App.tsx
├── MerchantConsoleApp.tsx
├── soul.md
├── store.ts
├── components/
│   ├── OrdersTable.tsx           # Real-time order list
│   ├── CheckoutMonitor.tsx       # Active checkout sessions
│   ├── InventoryGrid.tsx         # Product stock levels
│   ├── AnalyticsDashboard.tsx    # Sales metrics
│   └── DiscountManager.tsx       # Promo code management
└── hooks/
    └── useMerchantData.ts
```

**Merchant Console Features:**
- Real-time view of active checkouts (WebSocket/SSE)
- Order management (view, cancel, refund)
- Inventory tracking
- Discount code creation/management
- Basic analytics (orders/day, conversion rate)

**Soul.md for Merchant Console:**
```yaml
---
id: merchant-console
name: Cymbal Console
version: 1.0.0
type: app
capabilities:
  - order-management
  - inventory-tracking
  - analytics
triggers:
  - manage orders
  - view inventory
  - check sales
tags: [merchant, admin, commerce]
---

# Personality
You are Cymbal Console, the merchant dashboard for Cymbal Outfitters...
```

### 5.4 Glass Shopping Assistant

**Phase 1: Basic Structure**
1. Create app scaffold (soul.md, store, components)
2. Implement ShopService for A2A communication
3. Build tabbed layout with Glass UI
4. Integrate with MenuBar

**Phase 2: Discovery & Search**
1. Chat-based product search
2. Product grid/list views
3. Quick look modal
4. Search filters and facets

**Phase 3: Wishlist & Artifacts**
1. Pinterest-style board management
2. Save products as artifacts with images
3. Board sharing capabilities
4. "Shop the look" AI feature

**Phase 4: Price Tracking**
1. Price alert creation/management
2. Price history visualization
3. Notification preferences
4. Target price automation

**Phase 5: Comparison & Checkout**
1. Product comparison table
2. AI-generated comparison summary
3. Cart management UI
4. Checkout flow with payment mock

### 5.3 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Glass Shopping Assistant                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Discover │  │ Wishlist │  │ Compare  │  │   Cart   │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │             │             │             │               │
│       └─────────────┼─────────────┼─────────────┘               │
│                     │             │                             │
│              ┌──────▼──────┐      │                             │
│              │ ShopService │◄─────┘                             │
│              │  (A2A RPC)  │                                    │
│              └──────┬──────┘                                    │
│                     │                                           │
│              ┌──────▼──────┐      ┌─────────────┐               │
│              │   Zustand   │◄────►│ LiquidMind  │               │
│              │    Store    │      │  Resources  │               │
│              └─────────────┘      └─────────────┘               │
└───────────────────────┬─────────────────────────────────────────┘
                        │ JSON-RPC 2.0
                        │ A2A Protocol v1.0
                        │ UCP Extension
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Demo Store A2A Server                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   RouterExecutor                         │    │
│  │   ┌─────────────────────────────────────────────────┐   │    │
│  │   │              DemoStoreExecutor                   │   │    │
│  │   │  ┌────────┐ ┌─────────┐ ┌────────┐ ┌─────────┐  │   │    │
│  │   │  │Catalog │ │Checkout │ │Pricing │ │Shipping │  │   │    │
│  │   │  │Manager │ │Manager  │ │Engine  │ │Engine   │  │   │    │
│  │   │  └────────┘ └─────────┘ └────────┘ └─────────┘  │   │    │
│  │   └─────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐      │
│  │ PostgreSQL   │  │ Task Store    │  │ Session Store    │      │
│  │ (Products)   │  │ (A2A Tasks)   │  │ (Checkout State) │      │
│  └──────────────┘  └───────────────┘  └──────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 6: Competitive Analysis

### 6.1 State-of-the-Art Shopping Assistants (2026)

| Feature | Amazon Rufus | Google Shopping AI | Pinterest | Our Design |
|---------|--------------|-------------------|-----------|------------|
| Natural Language Search | ✅ | ✅ | ✅ | ✅ |
| Visual Search | ✅ | ✅ | ✅ | ✅ (planned) |
| Price Tracking | ✅ | ✅ | ❌ | ✅ |
| Auto-Buy at Price | ✅ | ✅ | ❌ | ✅ |
| Wishlist Boards | ❌ | ❌ | ✅ | ✅ |
| Style Collages | ❌ | ❌ | ✅ | ✅ |
| Cross-Merchant Compare | ❌ | ✅ | ❌ | ✅ |
| Saved Screenshots | ❌ | ❌ | ❌ | ✅ |
| UCP Protocol | ❌ | ✅ | ❌ | ✅ |
| A2A Integration | ❌ | ✅ | ❌ | ✅ |
| Artifact Persistence | ❌ | ❌ | ❌ | ✅ |

### 6.2 Unique Differentiators

1. **Artifact-First Architecture** - Every saved product, screenshot, comparison is a persistent, searchable, shareable artifact
2. **UCP Compliance** - First-class support for agentic commerce protocol
3. **Glass UI** - Premium visual experience with liquid glass effects
4. **LiquidMind Integration** - AI context compilation includes shopping history and preferences
5. **Cross-App Sharing** - Wishlists can be shared with other LiquidOS apps

---

## Part 7: Success Metrics

### 7.1 Demo Store Metrics
- UCP compliance: All required endpoints pass validation
- Response latency: <200ms for search, <100ms for cart operations
- Checkout completion: 100% success rate for mock payments
- A2A conformance: Pass all v1.0 integration tests

### 7.2 Shopping Assistant Metrics
- User engagement: Time spent in app
- Wishlist adoption: % of users creating boards
- Price alert conversion: % of alerts leading to purchase
- Search success: Relevant results in top 5
- Artifact creation: Products saved per session

---

## Appendix A: References

### UCP & A2A Protocol
- [UCP Specification](https://ucp.dev/specification/overview/)
- [UCP A2A Binding](https://ucp.dev/specification/checkout-a2a/)
- [A2A Protocol Spec](https://a2a-protocol.org/latest/specification/)
- [UCP Samples Repository](https://github.com/Universal-Commerce-Protocol/samples)
- [UCP JS SDK](https://github.com/Universal-Commerce-Protocol/js-sdk)

### Industry Analysis
- [Google's UCP Announcement](https://developers.googleblog.com/under-the-hood-universal-commerce-protocol-ucp/)
- [InfoQ: Google UCP Powers Agentic Shopping](https://www.infoq.com/news/2026/01/google-ucp/)
- [Shopify UCP Engineering](https://shopify.engineering/ucp)
- [Google Cloud Agentic Commerce](https://cloud.google.com/transform/a-new-era-agentic-commerce-retail-ai)

### Shopping Assistant Research
- [Best AI Shopping Assistants 2026](https://www.ringly.io/blog/ai-shopping-assistants)
- [Amazon Rufus Features](https://www.aboutamazon.com/news/retail/amazon-rufus-ai-assistant-personalized-shopping-features)
- [Pinterest AI Shopping Boards](https://newsroom.pinterest.com/news/pinterest-boards-get-ai-powered-upgrade-for-personalized-experience/)
- [OpenAI ChatGPT Shopping Research](https://openai.com/index/chatgpt-shopping-research/)

### Tools & Apps
- [Sortd Wishlist App](https://www.getsortd.co/)
- [Price History Compare](https://pricehistorycompare.com/)
- [Capital One Shopping](https://capitaloneshopping.com/)

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **UCP** | Universal Commerce Protocol - Open standard for agentic commerce |
| **A2A** | Agent2Agent Protocol - Agent communication standard |
| **A2UI** | Agent2UI - Rich UI component rendering in A2A responses |
| **Checkout** | UCP object representing cart + customer + shipping + payment state |
| **Artifact** | LiquidMind resource type for generated/saved content |
| **Glass UI** | LiquidCrypto's design system with liquid glass effects |
| **DataPart** | A2A message part containing structured JSON data |
| **contextId** | Session identifier for multi-turn A2A conversations |
