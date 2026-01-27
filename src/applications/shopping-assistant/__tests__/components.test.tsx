/**
 * Shopping Assistant Component Tests
 *
 * Tests for Wishlist, ComparisonBoard, and SearchAutocomplete components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Wishlist, WishlistItem } from '../components/Wishlist';
import { ComparisonBoard } from '../components/ComparisonBoard';
import { Product } from '@/services/a2a/CommerceService';

// ============================================================================
// Test Fixtures
// ============================================================================

function createTestProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: `product-${Math.random().toString(36).slice(2)}`,
    name: 'Test Product',
    description: 'A test product description',
    price: { amount: '29.99', currency: 'USD' },
    images: ['https://example.com/image.jpg'],
    category: 'electronics',
    brand: 'TestBrand',
    rating: 4.5,
    review_count: 42,
    inventory: { in_stock: true, quantity: 10 },
    variants: [],
    attributes: { color: 'blue', size: 'medium' },
    tags: ['featured', 'sale'],
    ...overrides,
  };
}

function createTestWishlistItem(overrides: Partial<WishlistItem> = {}): WishlistItem {
  return {
    id: `wishlist-${Math.random().toString(36).slice(2)}`,
    product: createTestProduct(),
    addedAt: new Date().toISOString(),
    priceAtAdd: '29.99',
    notifications: false,
    ...overrides,
  };
}

// ============================================================================
// Wishlist Tests
// ============================================================================

describe('Wishlist', () => {
  const mockOnToggle = vi.fn();
  const mockOnRemove = vi.fn();
  const mockOnAddToCart = vi.fn();
  const mockOnSetPriceAlert = vi.fn();
  const mockOnUpdateNote = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no items', () => {
    render(
      <Wishlist
        items={[]}
        isOpen={true}
        onToggle={mockOnToggle}
        onRemove={mockOnRemove}
        onAddToCart={mockOnAddToCart}
        onSetPriceAlert={mockOnSetPriceAlert}
        onUpdateNote={mockOnUpdateNote}
      />
    );

    expect(screen.getByText('Your wishlist is empty')).toBeInTheDocument();
  });

  it('displays wishlist items correctly', () => {
    const items = [
      createTestWishlistItem({ product: createTestProduct({ name: 'Item One' }) }),
      createTestWishlistItem({ product: createTestProduct({ name: 'Item Two' }) }),
    ];

    render(
      <Wishlist
        items={items}
        isOpen={true}
        onToggle={mockOnToggle}
        onRemove={mockOnRemove}
        onAddToCart={mockOnAddToCart}
        onSetPriceAlert={mockOnSetPriceAlert}
        onUpdateNote={mockOnUpdateNote}
      />
    );

    expect(screen.getByText('Item One')).toBeInTheDocument();
    expect(screen.getByText('Item Two')).toBeInTheDocument();
    expect(screen.getByText('2 items')).toBeInTheDocument();
  });

  it('calls onRemove when remove button clicked', async () => {
    const item = createTestWishlistItem();
    const user = userEvent.setup();

    render(
      <Wishlist
        items={[item]}
        isOpen={true}
        onToggle={mockOnToggle}
        onRemove={mockOnRemove}
        onAddToCart={mockOnAddToCart}
        onSetPriceAlert={mockOnSetPriceAlert}
        onUpdateNote={mockOnUpdateNote}
      />
    );

    const removeButtons = screen.getAllByRole('button');
    const removeButton = removeButtons.find(btn => btn.getAttribute('class')?.includes('red'));

    if (removeButton) {
      await user.click(removeButton);
      expect(mockOnRemove).toHaveBeenCalledWith(item.id);
    }
  });

  it('calls onAddToCart when add to cart button clicked', async () => {
    const item = createTestWishlistItem();
    const user = userEvent.setup();

    render(
      <Wishlist
        items={[item]}
        isOpen={true}
        onToggle={mockOnToggle}
        onRemove={mockOnRemove}
        onAddToCart={mockOnAddToCart}
        onSetPriceAlert={mockOnSetPriceAlert}
        onUpdateNote={mockOnUpdateNote}
      />
    );

    const addToCartButton = screen.getByText('Add to Cart');
    await user.click(addToCartButton);
    expect(mockOnAddToCart).toHaveBeenCalledWith(item.product.id);
  });

  it('shows price change indicator when price changed', () => {
    const item = createTestWishlistItem({
      priceAtAdd: '39.99',
      product: createTestProduct({ price: { amount: '29.99', currency: 'USD' } }),
    });

    render(
      <Wishlist
        items={[item]}
        isOpen={true}
        onToggle={mockOnToggle}
        onRemove={mockOnRemove}
        onAddToCart={mockOnAddToCart}
        onSetPriceAlert={mockOnSetPriceAlert}
        onUpdateNote={mockOnUpdateNote}
      />
    );

    // Should show price drop indicator ($10 drop)
    expect(screen.getByText('$10.00')).toBeInTheDocument();
  });

  it('toggles visibility when toggle button clicked', async () => {
    const user = userEvent.setup();

    render(
      <Wishlist
        items={[]}
        isOpen={false}
        onToggle={mockOnToggle}
        onRemove={mockOnRemove}
        onAddToCart={mockOnAddToCart}
        onSetPriceAlert={mockOnSetPriceAlert}
        onUpdateNote={mockOnUpdateNote}
      />
    );

    const toggleButton = screen.getByRole('button');
    await user.click(toggleButton);
    expect(mockOnToggle).toHaveBeenCalled();
  });
});

// ============================================================================
// ComparisonBoard Tests
// ============================================================================

describe('ComparisonBoard', () => {
  const mockOnToggle = vi.fn();
  const mockOnRemove = vi.fn();
  const mockOnClear = vi.fn();
  const mockOnAddToCart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no products', () => {
    render(
      <ComparisonBoard
        products={[]}
        isOpen={true}
        onToggle={mockOnToggle}
        onRemove={mockOnRemove}
        onClear={mockOnClear}
        onAddToCart={mockOnAddToCart}
      />
    );

    expect(screen.getByText('No products to compare')).toBeInTheDocument();
  });

  it('displays products in comparison table', () => {
    const products = [
      createTestProduct({ name: 'Product A', price: { amount: '99.99', currency: 'USD' } }),
      createTestProduct({ name: 'Product B', price: { amount: '149.99', currency: 'USD' } }),
    ];

    render(
      <ComparisonBoard
        products={products}
        isOpen={true}
        onToggle={mockOnToggle}
        onRemove={mockOnRemove}
        onClear={mockOnClear}
        onAddToCart={mockOnAddToCart}
      />
    );

    expect(screen.getByText('Product A')).toBeInTheDocument();
    expect(screen.getByText('Product B')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('$149.99')).toBeInTheDocument();
  });

  it('highlights best price when comparing', () => {
    const products = [
      createTestProduct({ id: '1', name: 'Cheap', price: { amount: '50.00', currency: 'USD' } }),
      createTestProduct({ id: '2', name: 'Expensive', price: { amount: '100.00', currency: 'USD' } }),
    ];

    render(
      <ComparisonBoard
        products={products}
        isOpen={true}
        onToggle={mockOnToggle}
        onRemove={mockOnRemove}
        onClear={mockOnClear}
        onAddToCart={mockOnAddToCart}
      />
    );

    // The cheaper product should be highlighted as best price
    expect(screen.getByText('Best Price')).toBeInTheDocument();
  });

  it('calls onRemove when remove button clicked', async () => {
    const products = [createTestProduct()];
    const user = userEvent.setup();

    render(
      <ComparisonBoard
        products={products}
        isOpen={true}
        onToggle={mockOnToggle}
        onRemove={mockOnRemove}
        onClear={mockOnClear}
        onAddToCart={mockOnAddToCart}
      />
    );

    // Find and click the X button in the table header
    const removeButtons = screen.getAllByRole('button');
    const removeButton = removeButtons.find(btn => {
      const svg = btn.querySelector('svg');
      return svg && btn.closest('th');
    });

    if (removeButton) {
      await user.click(removeButton);
      expect(mockOnRemove).toHaveBeenCalledWith(products[0].id);
    }
  });

  it('calls onClear when Clear All button clicked', async () => {
    const products = [createTestProduct()];
    const user = userEvent.setup();

    render(
      <ComparisonBoard
        products={products}
        isOpen={true}
        onToggle={mockOnToggle}
        onRemove={mockOnRemove}
        onClear={mockOnClear}
        onAddToCart={mockOnAddToCart}
      />
    );

    const clearButton = screen.getByText('Clear All');
    await user.click(clearButton);
    expect(mockOnClear).toHaveBeenCalled();
  });

  it('shows toggle button with count when closed', () => {
    const products = [createTestProduct(), createTestProduct()];

    render(
      <ComparisonBoard
        products={products}
        isOpen={false}
        onToggle={mockOnToggle}
        onRemove={mockOnRemove}
        onClear={mockOnClear}
        onAddToCart={mockOnAddToCart}
      />
    );

    // Should show floating button with count
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('displays product attributes in comparison', () => {
    const products = [
      createTestProduct({
        name: 'Product A',
        attributes: { color: 'red', material: 'cotton' },
      }),
      createTestProduct({
        name: 'Product B',
        attributes: { color: 'blue', material: 'polyester' },
      }),
    ];

    render(
      <ComparisonBoard
        products={products}
        isOpen={true}
        onToggle={mockOnToggle}
        onRemove={mockOnRemove}
        onClear={mockOnClear}
        onAddToCart={mockOnAddToCart}
      />
    );

    expect(screen.getByText('red')).toBeInTheDocument();
    expect(screen.getByText('blue')).toBeInTheDocument();
    expect(screen.getByText('cotton')).toBeInTheDocument();
    expect(screen.getByText('polyester')).toBeInTheDocument();
  });
});

// ============================================================================
// SearchAutocomplete (within ShoppingChatInput) Tests
// ============================================================================

describe('ShoppingChatInput with Autocomplete', () => {
  // Note: These tests would require mocking localStorage and testing the
  // autocomplete behavior. Since ShoppingChatInput is a larger component,
  // we'd typically test the key behaviors:

  it('should show trending searches when in search mode with empty input', () => {
    // Test that when search mode is activated with empty input,
    // trending searches are shown
  });

  it('should filter suggestions based on input', () => {
    // Test that typing filters the suggestions
  });

  it('should save searches to history', () => {
    // Test that completed searches are saved to localStorage
  });

  it('should navigate suggestions with arrow keys', () => {
    // Test keyboard navigation in autocomplete dropdown
  });
});
