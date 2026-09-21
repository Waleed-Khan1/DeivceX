import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X, Plus, Minus, Trash2, Tag, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { CartItem, UserAccount } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
  appliedPromo: string;
  onApplyPromo: (code: string) => boolean;
  discount: number;
  user?: UserAccount | null;
  onRequireLogin?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  appliedPromo,
  onApplyPromo,
  discount,
  user,
  onRequireLogin,
}) => {
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, it) => sum + it.product.price * it.quantity, 0);
  const freeShippingThreshold = 500;
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const shipping = subtotal === 0 || subtotal >= freeShippingThreshold || appliedPromo === 'FREESHIP' ? 0 : 25;
  const tax = Math.round(subtotal * 0.08); // 8% estimated tax
  const total = Math.max(0, subtotal - discount + shipping + tax);

  const handleApplyPromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    setPromoSuccess('');
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    const ok = onApplyPromo(code);
    if (ok) {
      setPromoSuccess(`Promo code ${code} applied successfully!`);
      setPromoInput('');
    } else {
      setPromoError('Invalid promotional code. Try DEVICEX10 or FREESHIP');
    }
  };

  return (
    <AnimatePresence>
      <div
        id="cart-drawer-overlay"
        className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          id="cart-drawer-panel"
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
              <ShoppingBag className="w-5 h-5 text-white" />
              <h3 className="text-sm font-semibold text-white">Your Cart ({items.reduce((s, it) => s + it.quantity, 0)})</h3>
            </div>
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  onClick={onClearCart}
                  className="text-[11px] text-neutral-400 hover:text-rose-400 transition-colors"
                  id="clear-cart-btn"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
                id="close-cart-drawer-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Free Shipping Progress */}
          {items.length > 0 && (
            <div className="px-5 py-3 bg-neutral-950 border-b border-neutral-800/80 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-neutral-300">
                  {remainingForFreeShipping === 0 || appliedPromo === 'FREESHIP'
                    ? '🎉 You unlocked Free Express Insured Shipping!'
                    : `Add $${remainingForFreeShipping.toLocaleString()} for Free Express Shipping`}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  ${subtotal}/${freeShippingThreshold}
                </span>
              </div>
              <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-300"
                  style={{ width: `${appliedPromo === 'FREESHIP' ? 100 : progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Items list */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {items.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-700 mx-auto flex items-center justify-center text-neutral-400">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-white">Your Cart is Empty</h4>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                  Discover cutting-edge laptops, phones, speakers, and AirPods from top brands.
                </p>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-white text-neutral-950 font-bold text-xs hover:bg-neutral-100 transition-all inline-block btn-glow-white btn-3d shimmer-btn cursor-pointer"
                >
                  Explore Tech Items
                </button>
              </div>
            ) : (
              items.map(item => (
                <div
                  key={item.product.id}
                  className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex gap-3 items-center"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-lg bg-neutral-900 border border-neutral-800 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold">
                      {item.product.brand}
                    </span>
                    <h5 className="text-xs font-semibold text-white truncate">{item.product.name}</h5>
                    {item.selectedColor && (
                      <span className="text-[10px] text-neutral-400 block">Color: {item.selectedColor}</span>
                    )}
                    <span className="text-xs font-bold text-white mt-1 inline-block">
                      ${item.product.price.toLocaleString()}
                    </span>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-neutral-500 hover:text-rose-400 p-1 transition-all btn-3d cursor-pointer hover:scale-110"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 shadow-inner">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs transition-colors btn-3d cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-semibold text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs transition-colors btn-3d cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with totals and checkout */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-neutral-800 bg-neutral-950/80 space-y-3">
              {/* Promo code input */}
              <form onSubmit={handleApplyPromoCode} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={promoInput}
                    onChange={e => setPromoInput(e.target.value)}
                    placeholder="Promo code (e.g. DEVICEX10)"
                    className="w-full pl-8 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-400 uppercase font-mono focus:outline-none focus:border-neutral-600 transition-colors"
                    id="cart-promo-input"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-all btn-glow-neutral btn-3d cursor-pointer"
                  id="apply-promo-btn"
                >
                  Apply
                </button>
              </form>

              {promoSuccess && (
                <p className="text-[11px] text-emerald-400">{promoSuccess}</p>
              )}
              {promoError && (
                <p className="text-[11px] text-rose-400">{promoError}</p>
              )}

              {/* Price rows */}
              <div className="space-y-1.5 text-xs text-neutral-400 border-t border-neutral-800 pt-2.5">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-neutral-200">${subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount ({appliedPromo})</span>
                    <span>-${discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Tax (8%)</span>
                  <span className="text-neutral-200">${tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-neutral-200">{shipping === 0 ? 'FREE' : `$${shipping}`}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-neutral-800">
                  <span>Total Due</span>
                  <span className="text-base font-mono">${total.toLocaleString()}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={() => {
                  if (!user) {
                    if (onRequireLogin) onRequireLogin();
                    return;
                  }
                  onProceedToCheckout();
                }}
                id="cart-checkout-cta-btn"
                className="w-full py-3.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-xs tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 btn-glow-white btn-3d shimmer-btn cursor-pointer"
              >
                {!user ? (
                  <>
                    <Lock className="w-4 h-4 text-neutral-950" />
                    <span>Sign In to Checkout</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-neutral-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Safe checkout with 30-day money-back guarantee</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
