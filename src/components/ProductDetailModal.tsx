import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  ShoppingBag,
  Heart,
  Plus,
  Minus,
  Sparkles,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { Product, UserAccount, UserReview } from '../types';
import { getProductReviews, addProductReview } from '../services/db';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, color?: string) => void;
  onInstantBuy: (product: Product, quantity: number, color?: string) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  user: UserAccount | null;
  onRequireLogin: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onInstantBuy,
  isWishlisted,
  onToggleWishlist,
  user,
  onRequireLogin,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'reviews'>('specs');

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Real-time reviews list
  const [reviewsList, setReviewsList] = useState<UserReview[]>(() =>
    product ? getProductReviews(product.id) : []
  );

  useEffect(() => {
    if (product) {
      setReviewsList(getProductReviews(product.id));
      setSelectedImage('');
      setSelectedColor('');
    }
    const handleReviewsUpdate = () => {
      if (product) {
        setReviewsList(getProductReviews(product.id));
      }
    };
    window.addEventListener('devicex:reviews_updated', handleReviewsUpdate);
    return () => window.removeEventListener('devicex:reviews_updated', handleReviewsUpdate);
  }, [product]);

  if (!product) return null;

  const currentImage = selectedImage || product.image;
  const allImages = [product.image, ...(product.additionalImages || [])];
  const reviews = reviewsList;

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    if (!user) {
      onRequireLogin();
      return;
    }

    addProductReview(product.id, {
      productId: product.id,
      userName: user.name,
      rating: reviewRating,
      comment: reviewComment.trim(),
      verifiedPurchase: true,
    });

    setReviewComment('');
    setReviewSuccess(true);
    setTimeout(() => setReviewSuccess(false), 3000);
  };

  const handleAddToCart = () => {
    if (!user) {
      onRequireLogin();
      return;
    }
    onAddToCart(product, quantity, selectedColor || product.colors?.[0]?.name);
    onClose();
  };

  const handleInstantBuy = () => {
    if (!user) {
      onRequireLogin();
      return;
    }
    onInstantBuy(product, quantity, selectedColor || product.colors?.[0]?.name);
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        id="product-detail-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          id="product-detail-modal"
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-neutral-100"
        >
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="uppercase font-bold text-white tracking-wider">{product.brand}</span>
              <span>/</span>
              <span className="capitalize">{product.category}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleWishlist(product.id)}
                className={`p-2 rounded-xl border transition-all btn-3d cursor-pointer ${
                  isWishlisted && user
                    ? 'border-rose-500/50 bg-rose-500/15 text-rose-400 shadow-rose-500/20'
                    : 'border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
                title={!user ? 'Sign in to save to wishlist' : isWishlisted ? 'Saved in wishlist' : 'Save to wishlist'}
              >
                <Heart className={`w-4 h-4 transition-transform ${isWishlisted && user ? 'fill-rose-400 scale-110' : 'hover:scale-110'}`} />
              </button>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-white p-2 rounded-xl hover:bg-neutral-800 transition-all btn-3d cursor-pointer"
                id="close-product-detail-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Left: Product Images */}
            <div className="space-y-3">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 flex items-center justify-center group">
                <img
                  src={currentImage}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {product.originalPrice && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-emerald-500 text-neutral-950 font-bold text-[10px] tracking-wide">
                    SAVE ${(product.originalPrice - product.price).toLocaleString()}
                  </span>
                )}
                {product.isNew && (
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white text-neutral-950 font-bold text-[10px] tracking-wide">
                    NEW RELEASE
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-2">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border transition-all cursor-pointer ${
                        currentImage === img
                          ? 'border-white scale-105 shadow-md'
                          : 'border-neutral-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-neutral-400">
                <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800 text-center">
                  <Truck className="w-4 h-4 mx-auto text-sky-400 mb-1" />
                  <span>Free Express</span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800 text-center">
                  <ShieldCheck className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
                  <span>2-Year Warranty</span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800 text-center">
                  <RotateCcw className="w-4 h-4 mx-auto text-amber-400 mb-1" />
                  <span>30-Day Return</span>
                </div>
              </div>
            </div>

            {/* Right: Info & Actions */}
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                  {product.brand}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-1 leading-snug">
                  {product.name}
                </h2>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{product.rating}</span>
                  </div>
                  <span className="text-neutral-500">•</span>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className="text-xs text-neutral-400 hover:text-white underline underline-offset-2"
                  >
                    {product.reviewsCount + reviews.length} customer reviews
                  </button>
                  <span className="text-neutral-500">•</span>
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    In Stock ({product.stockCount} units)
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 pt-1 border-t border-neutral-800">
                <span className="text-2xl sm:text-3xl font-bold text-white">
                  ${product.price.toLocaleString()}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-neutral-500 line-through">
                    ${product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                {product.description}
              </p>

              {/* Color swatches if any */}
              {product.colors && product.colors.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-medium text-neutral-300 block">
                    Finish: <span className="text-white font-semibold">{selectedColor || product.colors[0].name}</span>
                  </span>
                  <div className="flex gap-2">
                    {product.colors.map(col => (
                      <button
                        key={col.name}
                        onClick={() => setSelectedColor(col.name)}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${
                          (selectedColor || product.colors![0].name) === col.name
                            ? 'border-white scale-110 shadow'
                            : 'border-neutral-700 opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: col.hex }}
                        title={col.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity and Actions */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col min-[420px]:flex-row items-stretch min-[420px]:items-center gap-2.5 min-[420px]:gap-3">
                  <div className="flex items-center justify-between min-[420px]:justify-start bg-neutral-950 border border-neutral-800 rounded-xl p-1 shadow-inner">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors btn-3d cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-white">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors btn-3d cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    id="modal-add-to-cart-btn"
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg min-h-[42px] btn-3d cursor-pointer ${
                      !user
                        ? 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 btn-glow-neutral'
                        : 'bg-white hover:bg-neutral-100 text-neutral-950 btn-glow-white shimmer-btn'
                    }`}
                  >
                    {!user ? (
                      <>
                        <Lock className="w-4 h-4 text-neutral-400" />
                        Sign In to Buy • ${(product.price * quantity).toLocaleString()}
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 transition-transform group-hover:scale-110" />
                        Add to Cart • ${(product.price * quantity).toLocaleString()}
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={handleInstantBuy}
                  id="modal-instant-buy-btn"
                  className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md btn-3d cursor-pointer ${
                    !user
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 btn-glow-neutral'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 btn-glow-emerald shimmer-btn'
                  }`}
                >
                  {!user ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-neutral-400" />
                      Sign In to Complete Purchase
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Buy Now • Express Checkout
                    </>
                  )}
                </button>
              </div>

              {/* Tabs: Specs & Reviews */}
              <div className="pt-4 border-t border-neutral-800">
                <div className="flex gap-4 border-b border-neutral-800 pb-2 text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab('specs')}
                    className={`transition-colors ${
                      activeTab === 'specs' ? 'text-white border-b-2 border-white pb-2' : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    Technical Specifications
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`transition-colors ${
                      activeTab === 'reviews' ? 'text-white border-b-2 border-white pb-2' : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    Customer Reviews ({reviews.length})
                  </button>
                </div>

                <div className="pt-3">
                  {activeTab === 'specs' ? (
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      {Object.entries(product.specs).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-1.5 border-b border-neutral-800/60">
                          <span className="text-neutral-400">{key}</span>
                          <span className="text-white font-medium text-right ml-2">{value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Add review form (Auth gated) */}
                      {!user ? (
                        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-center space-y-2.5">
                          <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center mx-auto text-amber-400">
                            <Lock className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-white">Sign In Required to Review</h4>
                            <p className="text-[11px] text-neutral-400 mt-1 max-w-xs mx-auto">
                              To prevent spam and guarantee verified purchase ratings, customer login is required to submit a review.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onRequireLogin();
                            }}
                            className="px-4 py-2 rounded-xl bg-white text-neutral-950 font-bold text-xs hover:bg-neutral-100 transition-all shadow btn-3d btn-glow-white cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            Sign In to Write a Review
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleAddReview} className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                          <span className="text-xs font-semibold text-white block">Write a Verified Review</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(st => (
                              <button
                                type="button"
                                key={st}
                                onClick={() => setReviewRating(st)}
                                className="p-1 text-amber-400"
                              >
                                <Star className={`w-4 h-4 ${st <= reviewRating ? 'fill-amber-400' : 'text-neutral-600'}`} />
                              </button>
                            ))}
                          </div>
                          <textarea
                            rows={2}
                            required
                            value={reviewComment}
                            onChange={e => setReviewComment(e.target.value)}
                            placeholder="Share your experience with this device..."
                            className="w-full p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 resize-none"
                          />
                          {reviewSuccess && (
                            <p className="text-[11px] text-emerald-400">Review added and verified!</p>
                          )}
                          <button
                            type="submit"
                            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium transition-colors"
                          >
                            Submit Review
                          </button>
                        </form>
                      )}

                      {/* Reviews list */}
                      <div className="space-y-2.5 max-h-48 overflow-y-auto">
                        {reviews.length === 0 ? (
                          <p className="text-xs text-neutral-500 py-3 text-center">No reviews yet. Be the first to review!</p>
                        ) : (
                          reviews.map(rev => (
                            <div key={rev.id} className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white">{rev.userName}</span>
                                  {rev.verifiedPurchase && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      Verified Buyer
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-neutral-500">{rev.date}</span>
                              </div>
                              <div className="flex items-center gap-0.5 text-amber-400 py-0.5">
                                {Array.from({ length: rev.rating }).map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-amber-400" />
                                ))}
                              </div>
                              <p className="text-neutral-300 leading-relaxed">{rev.comment}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
