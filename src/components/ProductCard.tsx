import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Star, ShoppingBag, Heart, Eye, Check, Lock } from 'lucide-react';
import { Product, UserAccount } from '../types';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  isInCart: boolean;
  user?: UserAccount | null;
  onRequireAuth?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
  isInCart,
  user,
  onRequireAuth,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const calculateTilt = (clientX: number, clientY: number) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate rotation (-12deg to 12deg range for rich 3D feel)
    const rotX = -((y - centerY) / centerY) * 11;
    const rotY = ((x - centerX) / centerX) * 13;

    setRotateX(rotX);
    setRotateY(rotY);

    // Dynamic specular glare position
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setGlare({ x: glareX, y: glareY, opacity: 0.22 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    calculateTilt(e.clientX, e.clientY);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
    setGlare(prev => ({ ...prev, opacity: 0 }));
  };

  // Mobile & Tablet 3D Touch Support
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsHovered(true);
    if (e.touches[0]) {
      calculateTilt(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches[0]) {
      calculateTilt(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    setTimeout(() => {
      setIsHovered(false);
      setRotateX(0);
      setRotateY(0);
      setGlare(prev => ({ ...prev, opacity: 0 }));
    }, 450);
  };

  const handleCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      if (onRequireAuth) {
        onRequireAuth();
      }
      return;
    }
    onAddToCart(product);
  };

  return (
    <div
      style={{ perspective: '1200px' }}
      className="w-full flex"
    >
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.3 }}
        id={`product-card-${product.id}`}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transformStyle: 'preserve-3d',
          transform: isHovered
            ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.025, 1.025, 1.025)`
            : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
          transition: isHovered
            ? 'transform 0.08s ease-out, box-shadow 0.15s ease-out'
            : 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.5s ease-out',
          boxShadow: isHovered
            ? `${-rotateY * 1.5}px ${rotateX * 1.5 + 18}px 32px rgba(0, 0, 0, 0.65), 0 0 20px rgba(56, 189, 248, 0.08)`
            : '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
        }}
        className="group relative bg-neutral-900 border border-neutral-800/90 rounded-2xl overflow-hidden hover:border-neutral-700/90 w-full flex flex-col will-change-transform"
      >
        {/* Dynamic Specular Sheen / Glare Overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300 rounded-2xl"
          style={{
            opacity: glare.opacity,
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, 0.28) 0%, rgba(56, 189, 248, 0.12) 30%, transparent 65%)`,
          }}
        />

        {/* Product Image Container with 3D Depth */}
        <div
          style={{ transform: isHovered ? 'translateZ(26px)' : 'translateZ(0px)', transition: 'transform 0.3s ease-out' }}
          className="relative aspect-square w-full bg-neutral-950 overflow-hidden cursor-pointer"
          onClick={() => onSelect(product)}
        >
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          />

          {/* Top Badges with higher 3D elevation */}
          <div
            style={{ transform: isHovered ? 'translateZ(38px)' : 'translateZ(0px)', transition: 'transform 0.3s ease-out' }}
            className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none"
          >
            <span className="px-2 py-0.5 rounded-full bg-neutral-900/95 text-white font-mono text-[10px] font-semibold tracking-wider uppercase border border-neutral-700/70 backdrop-blur-md shadow-md w-fit">
              {product.brand}
            </span>
            {product.originalPrice && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-neutral-950 font-bold text-[10px] tracking-wide shadow-md">
                SAVE ${(product.originalPrice - product.price).toLocaleString()}
              </span>
            )}
            {product.isNew && (
              <span className="px-2 py-0.5 rounded-full bg-white text-neutral-950 font-bold text-[10px] tracking-wide shadow-md">
                NEW
              </span>
            )}
          </div>

          {/* Top Right Wishlist Button with 3D elevation */}
          <button
            style={{ transform: isHovered ? 'translateZ(40px)' : 'translateZ(0px)', transition: 'transform 0.3s ease-out' }}
            onClick={e => {
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            className={`absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-md active:scale-90 btn-3d cursor-pointer ${
              isWishlisted && user
                ? 'bg-rose-500/25 text-rose-400 border border-rose-500/50 shadow-rose-500/20'
                : 'bg-neutral-900/80 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-700/60 hover:border-neutral-500'
            }`}
            title={!user ? 'Sign in to save to wishlist' : isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            id={`wishlist-btn-${product.id}`}
          >
            <Heart className={`w-4 h-4 transition-transform ${isWishlisted && user ? 'fill-rose-400 scale-110' : 'hover:scale-110'}`} />
          </button>

          {/* Quick View Hover Pill with 3D Elevation */}
          <div
            style={{ transform: isHovered ? 'translateZ(44px)' : 'translateZ(0px)', transition: 'transform 0.3s ease-out' }}
            className="absolute inset-x-0 bottom-3 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none sm:pointer-events-auto z-20"
          >
            <button
              onClick={e => {
                e.stopPropagation();
                onSelect(product);
              }}
              className="px-3.5 py-1.5 rounded-full bg-neutral-900/95 border border-neutral-700 text-white text-xs font-medium backdrop-blur-md hover:bg-neutral-800 flex items-center gap-1.5 shadow-2xl transition-all btn-3d btn-glow-neutral cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-neutral-300" />
              Quick View
            </button>
          </div>
        </div>

        {/* Product Information with 3D Depth */}
        <div
          style={{ transform: isHovered ? 'translateZ(20px)' : 'translateZ(0px)', transition: 'transform 0.3s ease-out' }}
          className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3"
        >
          <div>
            <div className="flex items-center justify-between gap-2 text-xs text-neutral-400 mb-1">
              <span className="capitalize text-[11px] font-medium tracking-wide text-neutral-500">
                {product.category}
              </span>
              <div className="flex items-center gap-1 text-amber-400 font-semibold text-[11px]">
                <Star className="w-3 h-3 fill-amber-400" />
                <span>{product.rating}</span>
                <span className="text-neutral-500 font-normal">({product.reviewsCount})</span>
              </div>
            </div>

            <h3
              onClick={() => onSelect(product)}
              className="text-sm sm:text-base font-semibold text-white group-hover:text-neutral-200 transition-colors line-clamp-1 cursor-pointer"
              title={product.name}
            >
              {product.name}
            </h3>

            <p className="text-xs text-neutral-400 line-clamp-1 mt-1 font-normal">
              {product.highlights[0] || product.description}
            </p>
          </div>

          {/* Price and Add Button with 3D Depth */}
          <div
            style={{ transform: isHovered ? 'translateZ(28px)' : 'translateZ(0px)', transition: 'transform 0.3s ease-out' }}
            className="pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-2"
          >
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-bold text-white font-mono">
                  ${product.price.toLocaleString()}
                </span>
                {product.originalPrice && (
                  <span className="text-xs text-neutral-500 line-through font-mono">
                    ${product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                In Stock
              </span>
            </div>

            <button
              onClick={handleCartClick}
              id={`add-to-cart-btn-${product.id}`}
              title={!user ? 'Sign in required to purchase' : undefined}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                isInCart
                  ? 'bg-emerald-500 text-neutral-950 btn-glow-emerald btn-3d'
                  : !user
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 btn-glow-neutral btn-3d'
                  : 'bg-white hover:bg-neutral-100 text-neutral-950 btn-glow-white btn-3d shimmer-btn'
              }`}
            >
              {isInCart ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Added
                </>
              ) : !user ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-neutral-400" />
                  Buy
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                  Add
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

