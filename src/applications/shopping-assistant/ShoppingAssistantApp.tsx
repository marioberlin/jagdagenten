/**
 * Shopping Assistant App
 *
 * Glass app for the Cymbal Outfitters UCP demo store.
 * Features product browsing, cart management, and checkout flow.
 */
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ShoppingBag, Search, Tag, Sparkles, Camera } from 'lucide-react';
import {
  CommerceService,
  Product,
  CommerceUpdate,
  ProductSearchResult,
  ProductDetailResult,
  ShippingMethod
} from '@/services/a2a/CommerceService';
import { usePersistedCart } from '@/hooks/usePersistedCart';
import { useSimulatedInventoryUpdates, InventoryUpdate } from '@/hooks/useInventoryWebSocket';
import { CurrencyProvider, useCurrency } from '@/hooks/useCurrency';
import { ErrorBoundary, ProductErrorBoundary, CartErrorBoundary, CheckoutErrorBoundary } from '@/components/ErrorBoundary';
import { ShoppingChatInput } from './components/ShoppingChatInput';
import { ProductGrid } from './components/ProductGrid';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartSidebar } from './components/CartSidebar';
import { CheckoutFlow } from './components/CheckoutFlow';
import { OrderConfirmation } from './components/OrderConfirmation';
import { SearchFilters, SearchFiltersState, DEFAULT_FILTERS } from './components/SearchFilters';
import { Wishlist, WishlistItem } from './components/Wishlist';
import { ComparisonBoard } from './components/ComparisonBoard';
import { VisualSearch } from './components/VisualSearch';
import { WishlistBoards, WishlistBoard, WishlistBoardItem } from './components/WishlistBoards';
import { PriceTracker, TrackedProduct } from './components/PriceTracker';
import { OrderHistory, OrderHistoryItem } from './components/OrderHistory';

type AppView = 'browse' | 'checkout' | 'confirmation';

// Local storage keys
const WISHLIST_KEY = 'cymbal-wishlist';
const WISHLIST_BOARDS_KEY = 'cymbal-wishlist-boards';
const COMPARISON_KEY = 'cymbal-comparison';
const PRICE_TRACKING_KEY = 'cymbal-price-tracking';
const ORDER_HISTORY_KEY = 'cymbal-order-history';

// Main app wrapper with currency provider
export const ShoppingAssistantApp: React.FC = () => {
  return (
    <CurrencyProvider>
      <ShoppingAssistantContent />
    </CurrencyProvider>
  );
};

// Inner component with access to currency context
const ShoppingAssistantContent: React.FC = () => {
  // Currency formatting - used by child components via context
  useCurrency();
  // Persisted cart state - survives page reloads
  const {
    contextId: sessionId,
    checkout,
    setCheckout,
    clearCart,
    isRestored: isCartRestored,
  } = usePersistedCart({ storageKey: 'cymbal-cart', expirationHours: 48 });

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<AppView>('browse');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [_searchQuery, setSearchQuery] = useState(''); // setSearchQuery used
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [assistantMessage, setAssistantMessage] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFiltersState>(DEFAULT_FILTERS);
  // Reserved for filter sidebar toggle
  const [_isFilterSidebarOpen, _setIsFilterSidebarOpen] = useState(false);

  // Wishlist state - persisted to localStorage
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  // Comparison state - persisted to localStorage
  const [comparisonProducts, setComparisonProducts] = useState<Product[]>(() => {
    try {
      const stored = localStorage.getItem(COMPARISON_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  // Visual search state
  const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false);

  // Wishlist boards state (Pinterest-style) - persisted to localStorage
  const [wishlistBoards, setWishlistBoards] = useState<WishlistBoard[]>(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_BOARDS_KEY);
      if (stored) return JSON.parse(stored);
      // Create default board
      return [{
        id: 'default',
        name: 'My Wishlist',
        color: '#6366f1',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: true,
      }];
    } catch {
      return [{
        id: 'default',
        name: 'My Wishlist',
        color: '#6366f1',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: true,
      }];
    }
  });
  const [isWishlistBoardsOpen, setIsWishlistBoardsOpen] = useState(false);

  // Price tracking state - persisted to localStorage
  const [trackedProducts, setTrackedProducts] = useState<TrackedProduct[]>(() => {
    try {
      const stored = localStorage.getItem(PRICE_TRACKING_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  // Reserved for future price tracker panel toggle
  const [_isPriceTrackerOpen, _setIsPriceTrackerOpen] = useState(false);

  // Order history state - persisted to localStorage
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(ORDER_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  // Reserved for future order history panel toggle
  const [_isOrderHistoryOpen, _setIsOrderHistoryOpen] = useState(false);

  // Refs for stable callbacks
  const setCheckoutRef = useRef(setCheckout);
  setCheckoutRef.current = setCheckout;
  const setProductsRef = useRef(setProducts);
  setProductsRef.current = setProducts;
  const setSelectedProductRef = useRef(setSelectedProduct);
  setSelectedProductRef.current = setSelectedProduct;
  const setShippingMethodsRef = useRef(setShippingMethods);
  setShippingMethodsRef.current = setShippingMethods;

  // Create A2A service with callbacks
  const commerceService = useMemo(
    () => new CommerceService(sessionId, {
      onCheckoutUpdate: (data: CommerceUpdate) => {
        setCheckoutRef.current(data.checkout);
        if (data.availableShippingMethods) {
          setShippingMethodsRef.current(data.availableShippingMethods);
        }
        if (data.checkout.status === 'completed') {
          setView('confirmation');
        }
      },
      onProductSearch: (data: ProductSearchResult) => {
        setProductsRef.current(data.products);
      },
      onProductDetail: (data: ProductDetailResult) => {
        setSelectedProductRef.current(data.product);
      }
    }),
    [sessionId]
  );

  // Persist wishlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlistItems));
    } catch (e) {
      console.warn('Failed to persist wishlist:', e);
    }
  }, [wishlistItems]);

  // Persist wishlist boards to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_BOARDS_KEY, JSON.stringify(wishlistBoards));
    } catch (e) {
      console.warn('Failed to persist wishlist boards:', e);
    }
  }, [wishlistBoards]);

  // Persist price tracking to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PRICE_TRACKING_KEY, JSON.stringify(trackedProducts));
    } catch (e) {
      console.warn('Failed to persist price tracking:', e);
    }
  }, [trackedProducts]);

  // Persist order history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(orderHistory));
    } catch (e) {
      console.warn('Failed to persist order history:', e);
    }
  }, [orderHistory]);

  // Save completed orders to history
  useEffect(() => {
    if (checkout?.status === 'completed' && checkout.order) {
      // Check if this order is already in history
      const existingOrder = orderHistory.find(o => o.id === checkout.order!.id);
      if (!existingOrder) {
        const historyItem: OrderHistoryItem = {
          ...checkout.order,
          line_items: checkout.line_items,
          total: checkout.total,
          subtotal: checkout.subtotal,
          shipping_total: checkout.shipping_total,
          tax_total: checkout.tax_total,
          shipping_address: checkout.shipping_address,
          created_at: checkout.order.created_at || new Date().toISOString(),
        };
        setOrderHistory(prev => [historyItem, ...prev]);
      }
    }
  }, [checkout?.status, checkout?.order?.id]);

  // Real-time inventory updates (simulated for demo)
  const handleInventoryUpdates = useCallback((updates: Map<string, InventoryUpdate>) => {
    setProducts(prev => prev.map(product => {
      const update = updates.get(product.id);
      if (!update) return product;

      const updated = { ...product };
      if (update.data.quantity !== undefined) {
        updated.inventory = {
          ...updated.inventory,
          quantity: update.data.quantity,
          in_stock: update.data.quantity > 0,
        };
      }
      if (update.data.price) {
        updated.price = update.data.price;
      }
      return updated;
    }));

    // Also update selected product if viewing details
    setSelectedProduct(prev => {
      if (!prev) return prev;
      const update = updates.get(prev.id);
      if (!update) return prev;

      const updated = { ...prev };
      if (update.data.quantity !== undefined) {
        updated.inventory = {
          ...updated.inventory,
          quantity: update.data.quantity,
          in_stock: update.data.quantity > 0,
        };
      }
      if (update.data.price) {
        updated.price = update.data.price;
      }
      return updated;
    });
  }, []);

  // Enable simulated inventory updates (every 8 seconds)
  useSimulatedInventoryUpdates(products, handleInventoryUpdates, 8000);

  // Persist comparison to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(COMPARISON_KEY, JSON.stringify(comparisonProducts));
    } catch (e) {
      console.warn('Failed to persist comparison:', e);
    }
  }, [comparisonProducts]);

  // Initial load - get featured products (wait for cart restoration)
  useEffect(() => {
    if (!isCartRestored) return;

    const initStore = async () => {
      setIsLoading(true);
      try {
        const response = await commerceService.sendMessage('Show me featured products');
        setAssistantMessage(response);
      } finally {
        setIsLoading(false);
      }
    };
    initStore();
  }, [commerceService, isCartRestored]);

  // Handlers
  const handleChat = useCallback(async (message: string) => {
    setIsLoading(true);
    try {
      const response = await commerceService.sendMessage(message);
      setAssistantMessage(response);
    } finally {
      setIsLoading(false);
    }
  }, [commerceService]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    setIsLoading(true);
    try {
      await commerceService.searchProducts(query);
    } finally {
      setIsLoading(false);
    }
  }, [commerceService]);

  const handleAddToCart = useCallback(async (productId: string, quantity: number = 1, variantId?: string) => {
    setIsLoading(true);
    try {
      const response = await commerceService.addToCart(productId, quantity, variantId);
      setAssistantMessage(response);
      setIsCartOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, [commerceService]);

  const handleRemoveFromCart = useCallback(async (productId: string) => {
    setIsLoading(true);
    try {
      await commerceService.removeFromCart(productId);
    } finally {
      setIsLoading(false);
    }
  }, [commerceService]);

  const handleUpdateQuantity = useCallback(async (productId: string, quantity: number) => {
    setIsLoading(true);
    try {
      await commerceService.updateQuantity(productId, quantity);
    } finally {
      setIsLoading(false);
    }
  }, [commerceService]);

  const handleApplyDiscount = useCallback(async (code: string) => {
    setIsLoading(true);
    try {
      const response = await commerceService.applyDiscount(code);
      setAssistantMessage(response);
    } finally {
      setIsLoading(false);
    }
  }, [commerceService]);

  const handleSetShipping = useCallback(async (methodId: string) => {
    setIsLoading(true);
    try {
      await commerceService.setShippingMethod(methodId);
    } finally {
      setIsLoading(false);
    }
  }, [commerceService]);

  const handleCheckout = useCallback(async (paymentToken: string = 'tok_success') => {
    setIsLoading(true);
    try {
      const response = await commerceService.checkout(paymentToken);
      setAssistantMessage(response);
    } finally {
      setIsLoading(false);
    }
  }, [commerceService]);

  const handleViewProduct = useCallback(async (productId: string) => {
    setIsLoading(true);
    try {
      await commerceService.getProductDetails(productId);
    } finally {
      setIsLoading(false);
    }
  }, [commerceService]);

  const handleStartCheckout = useCallback(() => {
    setView('checkout');
    setIsCartOpen(false);
  }, []);

  const handleBackToBrowse = useCallback(() => {
    setView('browse');
  }, []);

  const handleNewOrder = useCallback(() => {
    setView('browse');
    clearCart(); // Clears localStorage and generates new session
    setProducts([]);
    setFilters(DEFAULT_FILTERS);
    commerceService.sendMessage('Show me featured products');
  }, [commerceService, clearCart]);

  // Wishlist handlers
  const handleAddToWishlist = useCallback((product: Product) => {
    setWishlistItems(prev => {
      // Don't add duplicates
      if (prev.some(item => item.product.id === product.id)) {
        return prev;
      }
      const newItem: WishlistItem = {
        id: `wishlist-${product.id}-${Date.now()}`,
        product,
        addedAt: new Date().toISOString(),
        priceAtAdd: product.price.amount,
        notifications: false,
      };
      return [...prev, newItem];
    });
  }, []);

  const handleRemoveFromWishlist = useCallback((itemId: string) => {
    setWishlistItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const handleSetPriceAlert = useCallback((productId: string, threshold: number | null) => {
    setWishlistItems(prev => prev.map(item =>
      item.product.id === productId
        ? { ...item, priceAlertThreshold: threshold ?? undefined, notifications: threshold !== null }
        : item
    ));
  }, []);

  const handleUpdateWishlistNote = useCallback((productId: string, note: string) => {
    setWishlistItems(prev => prev.map(item =>
      item.product.id === productId
        ? { ...item, note }
        : item
    ));
  }, []);

  const isInWishlist = useCallback((productId: string) => {
    return wishlistItems.some(item => item.product.id === productId);
  }, [wishlistItems]);

  // Comparison handlers
  const handleAddToComparison = useCallback((product: Product) => {
    setComparisonProducts(prev => {
      // Don't add duplicates
      if (prev.some(p => p.id === product.id)) {
        return prev;
      }
      // Limit to 4 products max
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, product];
    });
  }, []);

  const handleRemoveFromComparison = useCallback((productId: string) => {
    setComparisonProducts(prev => prev.filter(p => p.id !== productId));
  }, []);

  const handleClearComparison = useCallback(() => {
    setComparisonProducts([]);
  }, []);

  const isInComparison = useCallback((productId: string) => {
    return comparisonProducts.some(p => p.id === productId);
  }, [comparisonProducts]);

  // Visual search handler - simulates finding similar products
  const handleVisualSearch = useCallback(async (_imageFile: File): Promise<Product[]> => {
    // In a real app, this would upload the image to an AI vision API
    // For demo, we simulate by returning random products after a delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Return a subset of current products as "similar" results
    const shuffled = [...products].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(6, shuffled.length));
  }, [products]);

  // Wishlist boards handlers
  const handleCreateBoard = useCallback((name: string, color: string) => {
    const newBoard: WishlistBoard = {
      id: `board-${Date.now()}`,
      name,
      color,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setWishlistBoards(prev => [...prev, newBoard]);
  }, []);

  const handleDeleteBoard = useCallback((boardId: string) => {
    setWishlistBoards(prev => prev.filter(b => b.id !== boardId && !b.isDefault));
  }, []);

  const handleRenameBoard = useCallback((boardId: string, newName: string) => {
    setWishlistBoards(prev => prev.map(b =>
      b.id === boardId ? { ...b, name: newName, updatedAt: new Date().toISOString() } : b
    ));
  }, []);

  const handleMoveBoardItem = useCallback((itemId: string, fromBoardId: string, toBoardId: string) => {
    setWishlistBoards(prev => {
      const fromBoard = prev.find(b => b.id === fromBoardId);
      const item = fromBoard?.items.find(i => i.id === itemId);
      if (!item) return prev;

      return prev.map(board => {
        if (board.id === fromBoardId) {
          return { ...board, items: board.items.filter(i => i.id !== itemId), updatedAt: new Date().toISOString() };
        }
        if (board.id === toBoardId) {
          return { ...board, items: [...board.items, item], updatedAt: new Date().toISOString() };
        }
        return board;
      });
    });
  }, []);

  const handleRemoveBoardItem = useCallback((boardId: string, itemId: string) => {
    setWishlistBoards(prev => prev.map(board =>
      board.id === boardId
        ? { ...board, items: board.items.filter(i => i.id !== itemId), updatedAt: new Date().toISOString() }
        : board
    ));
  }, []);

  const handleSetBoardItemPriceAlert = useCallback((boardId: string, itemId: string, threshold: number | null) => {
    setWishlistBoards(prev => prev.map(board =>
      board.id === boardId
        ? {
            ...board,
            items: board.items.map(item =>
              item.id === itemId
                ? { ...item, priceAlertThreshold: threshold ?? undefined }
                : item
            ),
            updatedAt: new Date().toISOString(),
          }
        : board
    ));
  }, []);

  const handleUpdateBoardItemNote = useCallback((boardId: string, itemId: string, note: string) => {
    setWishlistBoards(prev => prev.map(board =>
      board.id === boardId
        ? {
            ...board,
            items: board.items.map(item =>
              item.id === itemId ? { ...item, note } : item
            ),
            updatedAt: new Date().toISOString(),
          }
        : board
    ));
  }, []);

  // Add product to a specific board (from ProductDetailModal)
  const handleAddToBoard = useCallback((product: Product, boardId: string) => {
    setWishlistBoards(prev => {
      // Check if product already exists in target board
      const targetBoard = prev.find(b => b.id === boardId);
      if (targetBoard?.items.some(item => item.product.id === product.id)) {
        return prev; // Don't add duplicates
      }

      const newItem: WishlistBoardItem = {
        id: `item-${product.id}-${Date.now()}`,
        product,
        addedAt: new Date().toISOString(),
        priceAtAdd: product.price.amount,
      };

      return prev.map(board =>
        board.id === boardId
          ? { ...board, items: [...board.items, newItem], updatedAt: new Date().toISOString() }
          : board
      );
    });
  }, []);

  // Price tracking handlers
  const handleTogglePriceAlert = useCallback((productId: string, enabled: boolean) => {
    setTrackedProducts(prev => prev.map(tp =>
      tp.id === productId ? { ...tp, alertEnabled: enabled } : tp
    ));
  }, []);

  const handleSetPriceAlertThreshold = useCallback((productId: string, threshold: number | null) => {
    setTrackedProducts(prev => prev.map(tp =>
      tp.id === productId ? { ...tp, alertThreshold: threshold ?? undefined } : tp
    ));
  }, []);

  const handleStopTracking = useCallback((productId: string) => {
    setTrackedProducts(prev => prev.filter(tp => tp.id !== productId));
  }, []);

  const handleStartTracking = useCallback((product: Product) => {
    setTrackedProducts(prev => {
      // Don't add duplicates
      if (prev.some(tp => tp.product.id === product.id)) return prev;

      const newTracked: TrackedProduct = {
        id: product.id,
        product,
        priceHistory: [{
          timestamp: new Date().toISOString(),
          price: product.price.amount,
          currency: product.price.currency,
        }],
        alertEnabled: false,
        trackingSince: new Date().toISOString(),
      };
      return [...prev, newTracked];
    });
  }, []);

  // Order history handlers
  const handleReorder = useCallback(async (order: OrderHistoryItem) => {
    // Add all items from the order to cart
    for (const item of order.line_items) {
      await handleAddToCart(item.id.replace('line-', ''), item.quantity);
    }
    setIsCartOpen(true);
  }, [handleAddToCart]);

  const handleTrackOrder = useCallback((order: OrderHistoryItem) => {
    if (order.tracking_url) {
      window.open(order.tracking_url, '_blank');
    }
  }, []);

  // Extract available filter values from products
  const availableCategories = useMemo(() => {
    const categories = new Set(products.map((p) => p.category));
    return Array.from(categories).sort();
  }, [products]);

  const availableBrands = useMemo(() => {
    const brands = new Set(products.map((p) => p.brand).filter(Boolean) as string[]);
    return Array.from(brands).sort();
  }, [products]);

  const availableTags = useMemo(() => {
    const tags = new Set(products.flatMap((p) => p.tags || []));
    return Array.from(tags).sort();
  }, [products]);

  // Apply filters to products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (filters.categories.length > 0) {
      result = result.filter((p) => filters.categories.includes(p.category));
    }

    // Brand filter
    if (filters.brands.length > 0) {
      result = result.filter((p) => p.brand && filters.brands.includes(p.brand));
    }

    // Price filter
    if (filters.priceRange.min !== null) {
      result = result.filter((p) => parseFloat(p.price.amount) >= filters.priceRange.min!);
    }
    if (filters.priceRange.max !== null) {
      result = result.filter((p) => parseFloat(p.price.amount) <= filters.priceRange.max!);
    }

    // Rating filter
    if (filters.minRating !== null) {
      result = result.filter((p) => p.rating >= filters.minRating!);
    }

    // In stock filter
    if (filters.inStockOnly) {
      result = result.filter((p) => p.inventory.in_stock);
    }

    // On sale filter
    if (filters.onSaleOnly) {
      result = result.filter(
        (p) =>
          p.compare_at_price &&
          parseFloat(p.compare_at_price.amount) > parseFloat(p.price.amount)
      );
    }

    // Tags filter
    if (filters.tags.length > 0) {
      result = result.filter((p) =>
        filters.tags.some((tag) => p.tags?.includes(tag))
      );
    }

    // Sorting
    switch (filters.sortBy) {
      case 'price_asc':
        result.sort((a, b) => parseFloat(a.price.amount) - parseFloat(b.price.amount));
        break;
      case 'price_desc':
        result.sort((a, b) => parseFloat(b.price.amount) - parseFloat(a.price.amount));
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        // Assume products are ordered newest first by default
        break;
      case 'relevance':
      default:
        // Keep original order
        break;
    }

    return result;
  }, [products, filters]);

  // Render order confirmation
  if (view === 'confirmation' && checkout?.order) {
    return (
      <ErrorBoundary>
        <div className="flex flex-col h-full bg-glass-base rounded-b-xl overflow-hidden">
          <OrderConfirmation
            order={checkout.order}
            checkout={checkout}
            onNewOrder={handleNewOrder}
          />
        </div>
      </ErrorBoundary>
    );
  }

  // Render checkout flow
  if (view === 'checkout') {
    return (
      <CheckoutErrorBoundary>
        <div className="flex flex-col h-full bg-glass-base rounded-b-xl overflow-hidden">
          <CheckoutFlow
            checkout={checkout}
            shippingMethods={shippingMethods}
            isLoading={isLoading}
            onSetShipping={handleSetShipping}
            onApplyDiscount={handleApplyDiscount}
            onCheckout={handleCheckout}
            onBack={handleBackToBrowse}
          />
        </div>
      </CheckoutErrorBoundary>
    );
  }

  // Render main browse view
  return (
    <div className="flex flex-col h-full bg-glass-base rounded-b-xl overflow-hidden relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/10 via-purple-900/5 to-transparent pointer-events-none" />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Products area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 md:p-4 border-b border-white/5">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h1 className="text-base md:text-lg font-semibold text-white">Cymbal Outfitters</h1>
                <p className="text-xs text-white/50 hidden sm:block">UCP Demo Store</p>
              </div>
            </div>

            {/* Quick actions - responsive: icons only on mobile */}
            <div className="flex items-center gap-1 md:gap-2">
              <QuickActionChip
                icon={<Search size={14} />}
                label="Search"
                onClick={() => handleSearch('')}
              />
              <QuickActionChip
                icon={<Tag size={14} />}
                label="Deals"
                onClick={() => handleChat('Show me products on sale')}
                hideLabel
              />
              <QuickActionChip
                icon={<Sparkles size={14} />}
                label="Featured"
                onClick={() => handleChat('Show me featured products')}
                hideLabel
              />
              <QuickActionChip
                icon={<Camera size={14} />}
                label="Visual Search"
                onClick={() => setIsVisualSearchOpen(true)}
                hideLabel
              />
            </div>
          </div>

          {/* Assistant message */}
          {assistantMessage && (
            <div className="px-4 py-3 bg-indigo-500/5 border-b border-white/5">
              <p className="text-sm text-white/80">{assistantMessage}</p>
            </div>
          )}

          {/* Filter bar */}
          <div className="px-3 md:px-4 py-2 border-b border-white/5 bg-glass-elevated/30 overflow-x-auto custom-scrollbar">
            <SearchFilters
              filters={filters}
              onChange={setFilters}
              availableCategories={availableCategories}
              availableBrands={availableBrands}
              availableTags={availableTags}
              orientation="horizontal"
            />
          </div>

          {/* Product count */}
          {filteredProducts.length !== products.length && products.length > 0 && (
            <div className="px-4 py-2 text-xs text-white/50">
              Showing {filteredProducts.length} of {products.length} products
            </div>
          )}

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            <ProductErrorBoundary>
              <ProductGrid
                products={filteredProducts}
                isLoading={isLoading || !isCartRestored}
                onViewProduct={handleViewProduct}
                onAddToCart={handleAddToCart}
              />
            </ProductErrorBoundary>
          </div>

          {/* Chat input with search autocomplete */}
          <div className="z-20">
            <ShoppingChatInput
              onSend={handleChat}
              onSearch={handleSearch}
              products={products}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Cart sidebar */}
        <CartErrorBoundary>
          <CartSidebar
            checkout={checkout}
            isOpen={isCartOpen}
            isLoading={isLoading}
            onToggle={() => setIsCartOpen(!isCartOpen)}
            onRemoveItem={handleRemoveFromCart}
            onUpdateQuantity={handleUpdateQuantity}
            onApplyDiscount={handleApplyDiscount}
            onCheckout={handleStartCheckout}
          />
        </CartErrorBoundary>
      </div>

      {/* Product detail modal */}
      {selectedProduct && (
        <ProductErrorBoundary>
          <ProductDetailModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAddToCart={handleAddToCart}
            onAddToWishlist={handleAddToWishlist}
            onAddToComparison={handleAddToComparison}
            onTrackPrice={handleStartTracking}
            onAddToBoard={handleAddToBoard}
            boards={wishlistBoards.map(b => ({ id: b.id, name: b.name, color: b.color }))}
            isInWishlist={isInWishlist(selectedProduct.id)}
            isInComparison={isInComparison(selectedProduct.id)}
            isTracking={trackedProducts.some(tp => tp.product.id === selectedProduct.id)}
            isLoading={isLoading}
          />
        </ProductErrorBoundary>
      )}

      {/* Wishlist sidebar */}
      <Wishlist
        items={wishlistItems}
        isOpen={isWishlistOpen}
        onToggle={() => setIsWishlistOpen(!isWishlistOpen)}
        onRemove={handleRemoveFromWishlist}
        onAddToCart={(productId) => handleAddToCart(productId)}
        onSetPriceAlert={handleSetPriceAlert}
        onUpdateNote={handleUpdateWishlistNote}
      />

      {/* Comparison board */}
      <ComparisonBoard
        products={comparisonProducts}
        isOpen={isComparisonOpen}
        onToggle={() => setIsComparisonOpen(!isComparisonOpen)}
        onRemove={handleRemoveFromComparison}
        onClear={handleClearComparison}
        onAddToCart={(productId) => handleAddToCart(productId)}
      />

      {/* Visual Search */}
      <VisualSearch
        isOpen={isVisualSearchOpen}
        onToggle={() => setIsVisualSearchOpen(!isVisualSearchOpen)}
        onSearch={handleVisualSearch}
        onAddToCart={(productId) => handleAddToCart(productId)}
        onAddToWishlist={handleAddToWishlist}
        onAddToComparison={handleAddToComparison}
      />

      {/* Pinterest-style Wishlist Boards */}
      <WishlistBoards
        boards={wishlistBoards}
        isOpen={isWishlistBoardsOpen}
        onToggle={() => setIsWishlistBoardsOpen(!isWishlistBoardsOpen)}
        onCreateBoard={handleCreateBoard}
        onDeleteBoard={handleDeleteBoard}
        onRenameBoard={handleRenameBoard}
        onMoveItem={handleMoveBoardItem}
        onRemoveItem={handleRemoveBoardItem}
        onAddToCart={(productId) => handleAddToCart(productId)}
        onSetPriceAlert={handleSetBoardItemPriceAlert}
        onUpdateNote={handleUpdateBoardItemNote}
      />

      {/* Price Tracker */}
      <PriceTracker
        trackedProducts={trackedProducts}
        onToggleAlert={handleTogglePriceAlert}
        onSetAlertThreshold={handleSetPriceAlertThreshold}
        onStopTracking={handleStopTracking}
        onAddToCart={(productId) => handleAddToCart(productId)}
      />

      {/* Order History */}
      <OrderHistory
        orders={orderHistory}
        isLoading={isLoading}
        onReorder={handleReorder}
        onTrack={handleTrackOrder}
      />
    </div>
  );
};

// Quick action chip component
const QuickActionChip: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  hideLabel?: boolean;
}> = ({ icon, label, onClick, hideLabel = false }) => (
  <button
    onClick={onClick}
    title={label}
    aria-label={label}
    className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs transition-all"
  >
    {icon}
    <span className={hideLabel ? 'hidden md:inline' : ''}>{label}</span>
  </button>
);
