import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, X, ShoppingBag, Trash2, ArrowRight, Lock } from 'lucide-react';
import { Product, UserAccount } from '../types';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistProducts: Product[];
  onRemoveFromWishlist: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  user?: UserAccount | null;
  onRequireLogin?: () => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  wishlistProducts,
  onRemoveFromWishlist,
  onAddToCart,
  user,
  onRequireLogin,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="wishlist-drawer-overlay"
        className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          id="wishlist-drawer-panel"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 240 }}
          onClick={e => e.stopPropagation()}
          className="bg-neutral-900 border-l border-neutral-800 w-full max-w-md h-full flex flex-col shadow-2xl text-neutral-100"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/50">
            <div className="flex items-center gap-2.5">
              <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
              <h3 className="text-sm font-semibold text-white">Saved Wishlist ({wishlistProducts.length})</h3>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
              id="close-wishlist-drawer-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {!user ? (
              <div className="py-20 text-center space-y-4 px-4">
                <div className="w-16 h-16 rounded-2xl bg-neutral-800 border border-neutral-700 mx-auto flex items-center justify-center text-rose-400">
                  <Lock className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-base font-bold text-white">Sign In Required</h4>
                  <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                    Please sign in to your DeviceX account to view your saved wishlist items and sync them across all your devices.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    if (onRequireLogin) onRequireLogin();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-white text-neutral-950 font-bold text-xs hover:bg-neutral-200 transition-all btn-3d shadow-lg"
                  id="wishlist-require-login-btn"
                >
                  Sign In to Account
                </button>
              </div>
            ) : wishlistProducts.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-700 mx-auto flex items-center justify-center text-neutral-400">
                  <Heart className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-white">No Saved Items</h4>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                  Click the heart icon on any laptop, phone, or audio gear to save it to your personal account.
                </p>
              </div>
            ) : (
              wishlistProducts.map(product => (
                <div
                  key={product.id}
                  className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex gap-3 items-center"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-lg bg-neutral-900 border border-neutral-800 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold">
                      {product.brand}
                    </span>
                    <h5 className="text-xs font-semibold text-white truncate">{product.name}</h5>
                    <span className="text-xs font-bold text-white mt-1 block">
                      ${product.price.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        if (!user) {
                          if (onRequireLogin) onRequireLogin();
                          return;
                        }
                        onAddToCart(product);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shadow-sm btn-3d cursor-pointer ${
                        !user
                          ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700'
                          : 'bg-white text-neutral-950 hover:bg-neutral-100 btn-glow-white border border-white'
                      }`}
                      title={!user ? 'Sign in to add to cart' : 'Move to Cart'}
                    >
                      {!user ? <Lock className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                      {!user ? 'Sign In' : 'Add'}
                    </button>
                    <button
                      onClick={() => onRemoveFromWishlist(product.id)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors border border-transparent hover:border-neutral-700/60"
                      title="Remove from saved"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
