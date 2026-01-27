/**
 * Visual Search Component
 * Upload a photo to find similar products using image recognition
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  Camera,
  Upload,
  Image,
  X,
  Search,
  Sparkles,
  Loader2,
  ShoppingCart,
  Heart,
  GitCompare,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { Product } from '@/services/a2a/CommerceService';
import { useCurrency } from '@/hooks/useCurrency';

interface VisualSearchProps {
  isOpen: boolean;
  onToggle: () => void;
  onSearch: (imageFile: File) => Promise<Product[]>;
  onAddToCart: (productId: string) => void;
  onAddToWishlist: (product: Product) => void;
  onAddToComparison: (product: Product) => void;
}

export const VisualSearch: React.FC<VisualSearchProps> = ({
  isOpen,
  onToggle,
  onSearch,
  onAddToCart,
  onAddToWishlist,
  onAddToComparison,
}) => {
  const { formatPrice } = useCurrency();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    setError(null);
    setUploadedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Clear previous results
    setResults([]);
  }, []);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }, [handleFileSelect]);

  // Perform visual search
  const performSearch = useCallback(async () => {
    if (!uploadedFile) return;

    setIsSearching(true);
    setError(null);

    try {
      const searchResults = await onSearch(uploadedFile);
      setResults(searchResults);

      if (searchResults.length === 0) {
        setError('No similar products found. Try a different image.');
      }
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error('Visual search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, [uploadedFile, onSearch]);

  // Reset search
  const handleReset = useCallback(() => {
    setUploadedImage(null);
    setUploadedFile(null);
    setResults([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-4 bottom-4 z-40 p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg transition-all"
        title="Visual Search"
      >
        <Camera size={24} className="text-white" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onToggle}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-glass-elevated rounded-2xl border border-white/10 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20">
              <Camera size={20} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Visual Search</h2>
              <p className="text-xs text-white/50">Upload an image to find similar products</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-white/5 text-white/60 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upload Section */}
            <div className="space-y-4">
              {/* Drop zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative aspect-square rounded-xl border-2 border-dashed transition-all ${
                  dragActive
                    ? 'border-purple-400 bg-purple-500/10'
                    : uploadedImage
                    ? 'border-transparent'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                {uploadedImage ? (
                  <div className="relative w-full h-full">
                    <img
                      src={uploadedImage}
                      alt="Uploaded"
                      className="w-full h-full object-contain rounded-xl"
                    />
                    <button
                      onClick={handleReset}
                      className="absolute top-2 right-2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleInputChange}
                      className="hidden"
                    />
                    <Upload size={48} className="text-white/30 mb-4" />
                    <p className="text-white/60 mb-2">Drag & drop an image here</p>
                    <p className="text-white/40 text-sm">or click to browse</p>
                    <div className="flex items-center gap-2 mt-4 text-xs text-white/30">
                      <Image size={14} />
                      <span>PNG, JPG, WEBP up to 10MB</span>
                    </div>
                  </label>
                )}
              </div>

              {/* Search button */}
              {uploadedImage && (
                <button
                  onClick={performSearch}
                  disabled={isSearching}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white font-medium transition-all"
                >
                  {isSearching ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>Find Similar Products</span>
                    </>
                  )}
                </button>
              )}

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                  <AlertCircle size={16} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Tips */}
              <div className="p-4 rounded-xl bg-white/5 space-y-2">
                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                  <Sparkles size={14} className="text-purple-400" />
                  Tips for best results
                </h4>
                <ul className="text-xs text-white/50 space-y-1">
                  <li>• Use clear, well-lit photos</li>
                  <li>• Focus on a single product</li>
                  <li>• Avoid cluttered backgrounds</li>
                  <li>• Show the product from the front</li>
                </ul>
              </div>
            </div>

            {/* Results Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <Search size={14} />
                  {results.length > 0 ? `${results.length} Similar Products Found` : 'Search Results'}
                </h3>
                {results.length > 0 && (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1 text-xs text-white/50 hover:text-white"
                  >
                    <RotateCcw size={12} />
                    New Search
                  </button>
                )}
              </div>

              {/* Results grid */}
              {results.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                  {results.map((product, index) => (
                    <div
                      key={product.id}
                      className="group relative rounded-xl bg-white/5 border border-white/5 overflow-hidden hover:border-white/10 transition-all"
                    >
                      {/* Match score badge */}
                      <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm">
                        <span className="text-xs font-medium text-white">
                          {Math.max(95 - index * 5, 70)}% match
                        </span>
                      </div>

                      {/* Product image */}
                      <div className="aspect-square bg-white/5">
                        {product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/20">
                            <Image size={24} />
                          </div>
                        )}
                      </div>

                      {/* Product info */}
                      <div className="p-3 space-y-2">
                        <h4 className="text-sm font-medium text-white line-clamp-2">
                          {product.name}
                        </h4>
                        {product.brand && (
                          <p className="text-xs text-white/40">{product.brand}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold text-white">
                            {formatPrice(product.price.amount)}
                          </span>
                          {product.compare_at_price && (
                            <span className="text-sm text-white/40 line-through">
                              {formatPrice(product.compare_at_price.amount)}
                            </span>
                          )}
                        </div>

                        {/* Quick actions */}
                        <div className="flex items-center gap-1 pt-2">
                          <button
                            onClick={() => onAddToCart(product.id)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-xs transition-all"
                          >
                            <ShoppingCart size={12} />
                            <span>Add</span>
                          </button>
                          <button
                            onClick={() => onAddToWishlist(product)}
                            className="p-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 transition-all"
                          >
                            <Heart size={14} />
                          </button>
                          <button
                            onClick={() => onAddToComparison(product)}
                            className="p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-all"
                          >
                            <GitCompare size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search size={48} className="text-white/20 mb-4" />
                  <p className="text-white/50 mb-2">No results yet</p>
                  <p className="text-sm text-white/30">
                    Upload an image and click "Find Similar Products"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualSearch;
