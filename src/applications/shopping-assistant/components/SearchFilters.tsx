/**
 * Search Filters Component
 *
 * Advanced filtering UI for product search with category, price range,
 * brand, rating, and availability filters.
 */
import React, { useState, useCallback } from 'react';
import {
  ChevronDown, ChevronUp, X, Star, Check, Tag, DollarSign,
  Package, Sparkles, SlidersHorizontal,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface SearchFiltersState {
  categories: string[];
  priceRange: { min: number | null; max: number | null };
  brands: string[];
  minRating: number | null;
  inStockOnly: boolean;
  onSaleOnly: boolean;
  tags: string[];
  sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
}

interface SearchFiltersProps {
  filters: SearchFiltersState;
  onChange: (filters: SearchFiltersState) => void;
  availableCategories: string[];
  availableBrands: string[];
  availableTags: string[];
  priceStats?: { min: number; max: number };
  isOpen?: boolean;
  onToggle?: () => void;
  orientation?: 'vertical' | 'horizontal';
}

// Default filters
export const DEFAULT_FILTERS: SearchFiltersState = {
  categories: [],
  priceRange: { min: null, max: null },
  brands: [],
  minRating: null,
  inStockOnly: false,
  onSaleOnly: false,
  tags: [],
  sortBy: 'relevance',
};

// ============================================================================
// Main Component
// ============================================================================

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onChange,
  availableCategories,
  availableBrands,
  availableTags,
  priceStats = { min: 0, max: 500 },
  isOpen: _isOpen = true,
  onToggle: _onToggle,
  orientation = 'vertical',
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['categories', 'price', 'brands'])
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const updateFilter = useCallback(
    <K extends keyof SearchFiltersState>(key: K, value: SearchFiltersState[K]) => {
      onChange({ ...filters, [key]: value });
    },
    [filters, onChange]
  );

  const clearAllFilters = () => {
    onChange(DEFAULT_FILTERS);
  };

  const activeFilterCount = [
    filters.categories.length,
    filters.brands.length,
    filters.tags.length,
    filters.priceRange.min !== null || filters.priceRange.max !== null ? 1 : 0,
    filters.minRating !== null ? 1 : 0,
    filters.inStockOnly ? 1 : 0,
    filters.onSaleOnly ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  // Horizontal mode (compact inline filters)
  if (orientation === 'horizontal') {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {/* Sort Dropdown */}
        <SortDropdown
          value={filters.sortBy}
          onChange={(v) => updateFilter('sortBy', v)}
        />

        {/* Category Dropdown */}
        <FilterDropdown
          label="Category"
          icon={<Package size={14} />}
          selectedCount={filters.categories.length}
        >
          <CheckboxList
            options={availableCategories.map((c) => ({
              value: c,
              label: formatCategoryName(c),
            }))}
            selected={filters.categories}
            onChange={(v) => updateFilter('categories', v)}
          />
        </FilterDropdown>

        {/* Price Range Dropdown */}
        <FilterDropdown
          label="Price"
          icon={<DollarSign size={14} />}
          selectedCount={filters.priceRange.min !== null || filters.priceRange.max !== null ? 1 : 0}
        >
          <PriceRangeInputs
            value={filters.priceRange}
            onChange={(v) => updateFilter('priceRange', v)}
            min={priceStats.min}
            max={priceStats.max}
          />
        </FilterDropdown>

        {/* Rating Dropdown */}
        <FilterDropdown
          label="Rating"
          icon={<Star size={14} />}
          selectedCount={filters.minRating !== null ? 1 : 0}
        >
          <RatingFilter
            value={filters.minRating}
            onChange={(v) => updateFilter('minRating', v)}
          />
        </FilterDropdown>

        {/* Quick Toggles */}
        <button
          onClick={() => updateFilter('inStockOnly', !filters.inStockOnly)}
          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
            filters.inStockOnly
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/20'
          }`}
        >
          In Stock
        </button>

        <button
          onClick={() => updateFilter('onSaleOnly', !filters.onSaleOnly)}
          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
            filters.onSaleOnly
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/20'
          }`}
        >
          On Sale
        </button>

        {/* Clear All */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm transition-all"
          >
            <X size={14} />
            <span>Clear ({activeFilterCount})</span>
          </button>
        )}
      </div>
    );
  }

  // Vertical mode (sidebar filters)
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-white/60" />
          <h3 className="font-medium text-white">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-red-400 hover:text-red-300 transition-all"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Sort */}
      <div className="mb-4">
        <label className="block text-xs text-white/40 mb-2">Sort by</label>
        <SortDropdown
          value={filters.sortBy}
          onChange={(v) => updateFilter('sortBy', v)}
          fullWidth
        />
      </div>

      {/* Categories Section */}
      <FilterSection
        title="Categories"
        icon={<Package size={14} />}
        isExpanded={expandedSections.has('categories')}
        onToggle={() => toggleSection('categories')}
        badge={filters.categories.length}
      >
        <CheckboxList
          options={availableCategories.map((c) => ({
            value: c,
            label: formatCategoryName(c),
          }))}
          selected={filters.categories}
          onChange={(v) => updateFilter('categories', v)}
        />
      </FilterSection>

      {/* Price Section */}
      <FilterSection
        title="Price Range"
        icon={<DollarSign size={14} />}
        isExpanded={expandedSections.has('price')}
        onToggle={() => toggleSection('price')}
        badge={filters.priceRange.min !== null || filters.priceRange.max !== null ? 1 : 0}
      >
        <PriceRangeInputs
          value={filters.priceRange}
          onChange={(v) => updateFilter('priceRange', v)}
          min={priceStats.min}
          max={priceStats.max}
        />
      </FilterSection>

      {/* Brands Section */}
      {availableBrands.length > 0 && (
        <FilterSection
          title="Brands"
          icon={<Tag size={14} />}
          isExpanded={expandedSections.has('brands')}
          onToggle={() => toggleSection('brands')}
          badge={filters.brands.length}
        >
          <CheckboxList
            options={availableBrands.map((b) => ({ value: b, label: b }))}
            selected={filters.brands}
            onChange={(v) => updateFilter('brands', v)}
          />
        </FilterSection>
      )}

      {/* Rating Section */}
      <FilterSection
        title="Customer Rating"
        icon={<Star size={14} />}
        isExpanded={expandedSections.has('rating')}
        onToggle={() => toggleSection('rating')}
        badge={filters.minRating !== null ? 1 : 0}
      >
        <RatingFilter
          value={filters.minRating}
          onChange={(v) => updateFilter('minRating', v)}
        />
      </FilterSection>

      {/* Tags Section */}
      {availableTags.length > 0 && (
        <FilterSection
          title="Tags"
          icon={<Sparkles size={14} />}
          isExpanded={expandedSections.has('tags')}
          onToggle={() => toggleSection('tags')}
          badge={filters.tags.length}
        >
          <TagChips
            tags={availableTags}
            selected={filters.tags}
            onChange={(v) => updateFilter('tags', v)}
          />
        </FilterSection>
      )}

      {/* Availability Toggles */}
      <div className="mt-4 space-y-2">
        <ToggleFilter
          label="In Stock Only"
          checked={filters.inStockOnly}
          onChange={(v) => updateFilter('inStockOnly', v)}
        />
        <ToggleFilter
          label="On Sale Only"
          checked={filters.onSaleOnly}
          onChange={(v) => updateFilter('onSaleOnly', v)}
        />
      </div>
    </div>
  );
};

// ============================================================================
// Sub-Components
// ============================================================================

// Filter Section (collapsible)
const FilterSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  badge?: number;
}> = ({ title, icon, children, isExpanded, onToggle, badge }) => (
  <div className="border-b border-white/5 pb-3 mb-3">
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full py-2 text-white/80 hover:text-white transition-all"
    >
      <div className="flex items-center gap-2">
        <span className="text-white/40">{icon}</span>
        <span className="text-sm font-medium">{title}</span>
        {badge !== undefined && badge > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs">
            {badge}
          </span>
        )}
      </div>
      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    </button>
    {isExpanded && <div className="mt-2">{children}</div>}
  </div>
);

// Checkbox List
const CheckboxList: React.FC<{
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
}> = ({ options, selected, onChange }) => {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => toggle(option.value)}
          className="flex items-center gap-2 w-full py-1.5 px-2 rounded-lg hover:bg-white/5 transition-all"
        >
          <div
            className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
              selected.includes(option.value)
                ? 'bg-purple-500 border-purple-500'
                : 'border-white/20'
            }`}
          >
            {selected.includes(option.value) && <Check size={10} className="text-white" />}
          </div>
          <span className="text-sm text-white/70">{option.label}</span>
        </button>
      ))}
    </div>
  );
};

// Price Range Inputs
const PriceRangeInputs: React.FC<{
  value: { min: number | null; max: number | null };
  onChange: (value: { min: number | null; max: number | null }) => void;
  min: number;
  max: number;
}> = ({ value, onChange, min, max }) => {
  const presets = [
    { label: 'Under $25', min: null, max: 25 },
    { label: '$25 - $50', min: 25, max: 50 },
    { label: '$50 - $100', min: 50, max: 100 },
    { label: '$100 - $200', min: 100, max: 200 },
    { label: 'Over $200', min: 200, max: null },
  ];

  return (
    <div className="space-y-3">
      {/* Quick Presets */}
      <div className="flex flex-wrap gap-1">
        {presets.map((preset, i) => {
          const isActive = value.min === preset.min && value.max === preset.max;
          return (
            <button
              key={i}
              onClick={() => onChange({ min: preset.min, max: preset.max })}
              className={`px-2 py-1 rounded text-xs transition-all ${
                isActive
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Custom Range Inputs */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white/40 text-xs">$</span>
          <input
            type="number"
            placeholder={min.toString()}
            value={value.min ?? ''}
            onChange={(e) =>
              onChange({ ...value, min: e.target.value ? Number(e.target.value) : null })
            }
            className="w-full pl-5 pr-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-purple-500/50"
          />
        </div>
        <span className="text-white/40">-</span>
        <div className="relative flex-1">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white/40 text-xs">$</span>
          <input
            type="number"
            placeholder={max.toString()}
            value={value.max ?? ''}
            onChange={(e) =>
              onChange({ ...value, max: e.target.value ? Number(e.target.value) : null })
            }
            className="w-full pl-5 pr-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-purple-500/50"
          />
        </div>
      </div>
    </div>
  );
};

// Rating Filter
const RatingFilter: React.FC<{
  value: number | null;
  onChange: (value: number | null) => void;
}> = ({ value, onChange }) => {
  const ratings = [4, 3, 2, 1];

  return (
    <div className="space-y-1">
      {ratings.map((rating) => (
        <button
          key={rating}
          onClick={() => onChange(value === rating ? null : rating)}
          className={`flex items-center gap-2 w-full py-1.5 px-2 rounded-lg transition-all ${
            value === rating ? 'bg-purple-500/10' : 'hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={12}
                className={i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}
              />
            ))}
          </div>
          <span className="text-sm text-white/60">& up</span>
        </button>
      ))}
    </div>
  );
};

// Tag Chips
const TagChips: React.FC<{
  tags: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}> = ({ tags, selected, onChange }) => {
  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => toggle(tag)}
          className={`px-2 py-1 rounded-full text-xs transition-all ${
            selected.includes(tag)
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/20'
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
};

// Toggle Filter
const ToggleFilter: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className="flex items-center justify-between w-full py-2 px-2 rounded-lg hover:bg-white/5 transition-all"
  >
    <span className="text-sm text-white/70">{label}</span>
    <div
      className={`w-9 h-5 rounded-full transition-all ${
        checked ? 'bg-purple-500' : 'bg-white/10'
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full bg-white shadow transition-all ${
          checked ? 'translate-x-4.5 ml-0.5 mt-0.5' : 'ml-0.5 mt-0.5'
        }`}
        style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }}
      />
    </div>
  </button>
);

// Sort Dropdown
const SortDropdown: React.FC<{
  value: SearchFiltersState['sortBy'];
  onChange: (value: SearchFiltersState['sortBy']) => void;
  fullWidth?: boolean;
}> = ({ value, onChange, fullWidth }) => {
  const options: { value: SearchFiltersState['sortBy']; label: string }[] = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Top Rated' },
    { value: 'newest', label: 'Newest' },
  ];

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SearchFiltersState['sortBy'])}
        className={`appearance-none px-3 py-2 pr-8 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50 ${
          fullWidth ? 'w-full' : ''
        }`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
      />
    </div>
  );
};

// Filter Dropdown (for horizontal mode)
const FilterDropdown: React.FC<{
  label: string;
  icon: React.ReactNode;
  selectedCount: number;
  children: React.ReactNode;
}> = ({ label, icon, selectedCount, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
          selectedCount > 0
            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
            : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/20'
        }`}
      >
        {icon}
        <span>{label}</span>
        {selectedCount > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-purple-500 text-white text-xs">
            {selectedCount}
          </span>
        )}
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-64 p-3 rounded-xl bg-glass-elevated border border-white/10 shadow-xl z-50">
            {children}
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================================
// Utilities
// ============================================================================

function formatCategoryName(category: string): string {
  return category
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default SearchFilters;
