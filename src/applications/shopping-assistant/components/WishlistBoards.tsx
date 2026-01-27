/**
 * Wishlist Boards Component
 * Pinterest-style visual boards for organizing saved products
 */
import React, { useState } from 'react';
import {
  Heart,
  Plus,
  X,
  Trash2,
  ShoppingCart,
  ChevronLeft,
  Grid,
  Layout,
  Image,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Bell,
} from 'lucide-react';
import { Product } from '@/services/a2a/CommerceService';
import { useCurrency } from '@/hooks/useCurrency';

// Board interface for organizing wishlist items
export interface WishlistBoard {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  color: string;
  items: WishlistBoardItem[];
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}

export interface WishlistBoardItem {
  id: string;
  product: Product;
  addedAt: string;
  priceAtAdd: string;
  note?: string;
  priceAlertThreshold?: number;
}

// Preset board colors
const BOARD_COLORS = [
  '#6366f1', // indigo
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#14b8a6', // teal
  '#f97316', // orange
  '#84cc16', // lime
  '#06b6d4', // cyan
  '#ef4444', // red
];

interface WishlistBoardsProps {
  boards: WishlistBoard[];
  isOpen: boolean;
  onToggle: () => void;
  onCreateBoard: (name: string, color: string) => void;
  onDeleteBoard: (boardId: string) => void;
  onRenameBoard: (boardId: string, newName: string) => void;
  onMoveItem: (itemId: string, fromBoardId: string, toBoardId: string) => void;
  onRemoveItem: (boardId: string, itemId: string) => void;
  onAddToCart: (productId: string) => void;
  onSetPriceAlert: (boardId: string, itemId: string, threshold: number | null) => void;
  onUpdateNote: (boardId: string, itemId: string, note: string) => void;
}

export const WishlistBoards: React.FC<WishlistBoardsProps> = ({
  boards,
  isOpen,
  onToggle,
  onCreateBoard,
  onDeleteBoard,
  onRenameBoard: _onRenameBoard, // Reserved for future inline rename feature
  onMoveItem,
  onRemoveItem,
  onAddToCart,
  onSetPriceAlert,
  onUpdateNote,
}) => {
  const { formatPrice, currencyInfo } = useCurrency();
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardColor, setNewBoardColor] = useState(BOARD_COLORS[0]);
  const [editingNote, setEditingNote] = useState<{ boardId: string; itemId: string } | null>(null);
  const [noteValue, setNoteValue] = useState('');
  const [alertInput, setAlertInput] = useState<{ boardId: string; itemId: string; value: string } | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ boardId: string; itemId: string } | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('masonry');

  // Get total item count
  const totalItems = boards.reduce((sum, board) => sum + board.items.length, 0);

  // Handle board creation
  const handleCreateBoard = () => {
    if (newBoardName.trim()) {
      onCreateBoard(newBoardName.trim(), newBoardColor);
      setNewBoardName('');
      setNewBoardColor(BOARD_COLORS[Math.floor(Math.random() * BOARD_COLORS.length)]);
      setIsCreatingBoard(false);
    }
  };

  // Handle note save
  const handleSaveNote = (boardId: string, itemId: string) => {
    onUpdateNote(boardId, itemId, noteValue);
    setEditingNote(null);
    setNoteValue('');
  };

  // Handle price alert
  const handleSetAlert = (boardId: string, itemId: string) => {
    if (alertInput && alertInput.boardId === boardId && alertInput.itemId === itemId) {
      const threshold = parseFloat(alertInput.value);
      if (!isNaN(threshold) && threshold > 0) {
        onSetPriceAlert(boardId, itemId, threshold);
      }
      setAlertInput(null);
    }
  };

  // Calculate price change
  const getPriceChange = (item: WishlistBoardItem): { change: number; direction: 'up' | 'down' | 'same' } => {
    const currentPrice = parseFloat(item.product.price.amount);
    const originalPrice = parseFloat(item.priceAtAdd);
    const change = currentPrice - originalPrice;
    const direction = change > 0.01 ? 'up' : change < -0.01 ? 'down' : 'same';
    return { change, direction };
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, boardId: string, itemId: string) => {
    setDraggedItem({ boardId, itemId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetBoardId: string) => {
    e.preventDefault();
    if (draggedItem && draggedItem.boardId !== targetBoardId) {
      onMoveItem(draggedItem.itemId, draggedItem.boardId, targetBoardId);
    }
    setDraggedItem(null);
  };

  // Get the currently selected board
  const currentBoard = selectedBoard ? boards.find(b => b.id === selectedBoard) : null;

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className={`fixed right-4 bottom-36 z-40 p-3 rounded-full shadow-lg transition-all ${
          isOpen ? 'bg-white/10' : 'bg-pink-500 hover:bg-pink-600'
        }`}
      >
        <Heart size={24} className={isOpen ? 'text-white' : 'text-white fill-white'} />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-pink-500 text-xs flex items-center justify-center font-medium">
            {totalItems}
          </span>
        )}
      </button>

      {/* Wishlist panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[450px] bg-glass-elevated border-l border-white/10 transform transition-transform duration-300 z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            {selectedBoard ? (
              <button
                onClick={() => setSelectedBoard(null)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-white/60 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
            ) : (
              <Heart size={20} className="text-pink-400 fill-pink-400" />
            )}
            <div>
              <h2 className="text-lg font-semibold text-white">
                {selectedBoard ? currentBoard?.name : 'Wishlist Boards'}
              </h2>
              {!selectedBoard && totalItems > 0 && (
                <p className="text-xs text-white/40">{totalItems} items in {boards.length} boards</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedBoard && (
              <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40'}`}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('masonry')}
                  className={`p-1.5 rounded ${viewMode === 'masonry' ? 'bg-white/10 text-white' : 'text-white/40'}`}
                >
                  <Layout size={16} />
                </button>
              </div>
            )}
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-white/5 text-white/60 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(100%-64px)]">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            {!selectedBoard ? (
              // Board Grid View
              <div className="space-y-4">
                {/* Create new board */}
                {isCreatingBoard ? (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                    <input
                      type="text"
                      value={newBoardName}
                      onChange={(e) => setNewBoardName(e.target.value)}
                      placeholder="Board name..."
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-pink-500/50"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/50">Color:</span>
                      {BOARD_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewBoardColor(color)}
                          className={`w-6 h-6 rounded-full transition-all ${
                            newBoardColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateBoard}
                        disabled={!newBoardName.trim()}
                        className="flex-1 py-2 rounded-lg bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white text-sm transition-all"
                      >
                        Create Board
                      </button>
                      <button
                        onClick={() => setIsCreatingBoard(false)}
                        className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-sm transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCreatingBoard(true)}
                    className="w-full p-4 rounded-xl border-2 border-dashed border-white/10 hover:border-pink-500/30 flex items-center justify-center gap-2 text-white/40 hover:text-pink-400 transition-all"
                  >
                    <Plus size={20} />
                    <span>Create New Board</span>
                  </button>
                )}

                {/* Board cards */}
                <div className="grid grid-cols-2 gap-3">
                  {boards.map((board) => (
                    <div
                      key={board.id}
                      className="group relative rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-white/20 transition-all"
                      onClick={() => setSelectedBoard(board.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, board.id)}
                    >
                      {/* Board cover */}
                      <div
                        className="aspect-square"
                        style={{ backgroundColor: board.color + '30' }}
                      >
                        {board.items.length > 0 ? (
                          <div className="grid grid-cols-2 gap-0.5 h-full">
                            {board.items.slice(0, 4).map((item) => (
                              <div key={item.id} className="bg-white/5 overflow-hidden">
                                {item.product.images.length > 0 ? (
                                  <img
                                    src={item.product.images[0]}
                                    alt={item.product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Image size={20} className="text-white/20" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Heart size={32} style={{ color: board.color }} />
                          </div>
                        )}
                      </div>

                      {/* Board info */}
                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                        <h3 className="font-medium text-white truncate">{board.name}</h3>
                        <p className="text-xs text-white/50">{board.items.length} items</p>
                      </div>

                      {/* Actions menu */}
                      {!board.isDefault && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteBoard(board.id);
                            }}
                            className="p-1.5 rounded-full bg-black/50 hover:bg-red-500/50 text-white/60 hover:text-white transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {boards.length === 0 && !isCreatingBoard && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Heart size={48} className="text-white/20 mb-4" />
                    <p className="text-white/50 mb-2">No boards yet</p>
                    <p className="text-sm text-white/30">Create a board to start organizing your wishlist</p>
                  </div>
                )}
              </div>
            ) : (
              // Board Items View
              <div
                className={viewMode === 'masonry' ? 'columns-2 gap-3 space-y-3' : 'grid grid-cols-2 gap-3'}
              >
                {currentBoard?.items.map((item) => {
                  const priceInfo = getPriceChange(item);

                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, selectedBoard, item.id)}
                      className={`group rounded-xl bg-white/5 border border-white/5 overflow-hidden hover:border-white/10 transition-all cursor-move ${
                        viewMode === 'masonry' ? 'break-inside-avoid' : ''
                      }`}
                    >
                      {/* Product image */}
                      <div className="relative aspect-square bg-white/5">
                        {item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/20">
                            <Heart size={32} />
                          </div>
                        )}

                        {/* Price badge */}
                        <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm">
                          <span className="text-sm font-medium text-white">
                            {formatPrice(item.product.price.amount)}
                          </span>
                        </div>

                        {/* Price change indicator */}
                        {priceInfo.direction !== 'same' && (
                          <div
                            className={`absolute top-2 right-2 px-2 py-1 rounded-full flex items-center gap-1 text-xs ${
                              priceInfo.direction === 'down'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {priceInfo.direction === 'down' ? (
                              <TrendingDown size={12} />
                            ) : (
                              <TrendingUp size={12} />
                            )}
                            {formatPrice(Math.abs(priceInfo.change).toFixed(2))}
                          </div>
                        )}

                        {/* Remove button */}
                        <button
                          onClick={() => onRemoveItem(selectedBoard, item.id)}
                          className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/60 text-white/60 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Product info */}
                      <div className="p-3 space-y-2">
                        <h4 className="text-sm font-medium text-white line-clamp-2">
                          {item.product.name}
                        </h4>

                        {item.product.brand && (
                          <p className="text-xs text-white/40">{item.product.brand}</p>
                        )}

                        {/* Note */}
                        {editingNote?.boardId === selectedBoard && editingNote?.itemId === item.id ? (
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={noteValue}
                              onChange={(e) => setNoteValue(e.target.value)}
                              placeholder="Add a note..."
                              className="flex-1 px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveNote(selectedBoard, item.id)}
                              className="px-2 py-1 rounded bg-pink-500 text-white text-xs"
                            >
                              Save
                            </button>
                          </div>
                        ) : item.note ? (
                          <p
                            className="text-xs text-white/50 italic cursor-pointer hover:text-white/70"
                            onClick={() => {
                              setEditingNote({ boardId: selectedBoard, itemId: item.id });
                              setNoteValue(item.note || '');
                            }}
                          >
                            "{item.note}"
                          </p>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingNote({ boardId: selectedBoard, itemId: item.id });
                              setNoteValue('');
                            }}
                            className="text-xs text-white/30 hover:text-white/50"
                          >
                            + Add note
                          </button>
                        )}

                        {/* Price alert */}
                        {alertInput?.boardId === selectedBoard && alertInput?.itemId === item.id ? (
                          <div className="flex items-center gap-1">
                            <Bell size={12} className="text-yellow-400" />
                            <span className="text-xs text-white/50">{currencyInfo?.symbol || '$'}</span>
                            <input
                              type="number"
                              value={alertInput.value}
                              onChange={(e) => setAlertInput({ ...alertInput, value: e.target.value })}
                              className="w-16 px-1 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSetAlert(selectedBoard, item.id)}
                              className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-xs"
                            >
                              Set
                            </button>
                          </div>
                        ) : item.priceAlertThreshold ? (
                          <div className="flex items-center gap-1 text-xs text-yellow-400">
                            <Bell size={12} />
                            <span>Alert at {formatPrice(item.priceAlertThreshold)}</span>
                            <button
                              onClick={() => onSetPriceAlert(selectedBoard, item.id, null)}
                              className="text-white/40 hover:text-white/60"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAlertInput({ boardId: selectedBoard, itemId: item.id, value: '' })}
                            className="flex items-center gap-1 text-xs text-white/30 hover:text-yellow-400"
                          >
                            <Bell size={10} />
                            <span>Price alert</span>
                          </button>
                        )}

                        {/* Add to cart button */}
                        <button
                          onClick={() => onAddToCart(item.product.id)}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-xs transition-all"
                        >
                          <ShoppingCart size={12} />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {currentBoard?.items.length === 0 && (
                  <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center">
                    <Heart size={32} className="text-white/20 mb-3" />
                    <p className="text-white/50 text-sm">This board is empty</p>
                    <p className="text-xs text-white/30 mt-1">
                      Browse products and add them to this board
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Outfit suggestion (when viewing a board) */}
          {selectedBoard && currentBoard && currentBoard.items.length >= 2 && (
            <div className="p-4 border-t border-white/5">
              <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 text-white transition-all">
                <Sparkles size={16} className="text-pink-400" />
                <span className="text-sm font-medium">Generate Outfit Ideas</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={onToggle}
        />
      )}
    </>
  );
};

export default WishlistBoards;
