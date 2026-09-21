import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Eye, ShieldCheck, Lock } from 'lucide-react';
import { Product, UserAccount } from '../types';

interface HeroBannerProps {
  featuredProduct: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  user?: UserAccount | null;
  onRequireAuth?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  featuredProduct,
  onSelect,
  onAddToCart,
  user,
  onRequireAuth,
}) => {
  const bannerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const calculateTilt = (clientX: number, clientY: number) => {
    if (!bannerRef.current) return;
    const rect = bannerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * 4.5;
    const rotY = ((x - centerX) / centerX) * 5.5;

    setTilt({ x: rotX, y: rotY });

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setGlare({ x: glareX, y: glareY, opacity: 0.18 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    calculateTilt(e.clientX, e.clientY);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
    setGlare(prev => ({ ...prev, opacity: 0 }));
  };

  // Mobile & Tablet 3D Touch
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
      setTilt({ x: 0, y: 0 });
      setGlare(prev => ({ ...prev, opacity: 0 }));
    }, 450);
  };

  const handleAddToCartClick = () => {
    if (!user) {
      if (onRequireAuth) {
        onRequireAuth();
      }
      return;
    }
    onAddToCart(featuredProduct);
  };

  return (
    <div
      style={{ perspective: '1600px' }}
      className="w-full mb-8"
    >
      <div
        ref={bannerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transformStyle: 'preserve-3d',
          transform: isHovered
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.008, 1.008, 1.008)`
            : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
          transition: isHovered
            ? 'transform 0.12s ease-out, box-shadow 0.2s ease-out'
            : 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.6s ease-out',
          boxShadow: isHovered
            ? `${-tilt.y * 2}px ${tilt.x * 2 + 25}px 50px rgba(0, 0, 0, 0.75), 0 0 35px rgba(56, 189, 248, 0.1)`
            : '0 20px 45px -10px rgba(0, 0, 0, 0.6)',
        }}
        id="devicex-flagship-showcase"
        className="relative w-full rounded-3xl overflow-hidden bg-neutral-900 border border-neutral-800/90 group will-change-transform"
      >
        {/* Specular Glare Overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300 rounded-3xl"
          style={{
            opacity: glare.opacity,
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, 0.25) 0%, rgba(56, 189, 248, 0.08) 35%, transparent 70%)`,
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[400px] sm:min-h-[440px] 2xl:min-h-[480px] items-center">
          {/* Left column: Visual Specs & Direct Actions with 3D Depth */}
          <div
            style={{ transform: isHovered ? 'translateZ(25px)' : 'translateZ(0px)', transition: 'transform 0.3s ease-out' }}
            className="lg:col-span-6 xl:col-span-5 2xl:col-span-5 p-5 sm:p-8 lg:p-10 xl:p-12 2xl:p-16 z-10 flex flex-col justify-center space-y-4 2xl:space-y-6"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-white font-mono text-[10px] uppercase font-bold tracking-widest border border-white/20 shadow-sm">
                Flagship Release • {featuredProduct.brand}
              </span>
              <span className="text-emerald-400 text-xs flex items-center gap-1 font-medium font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                Certified In Stock
              </span>
            </div>

            <div>
              <h1 className="text-xl sm:text-3xl lg:text-5xl 2xl:text-6xl font-black text-white tracking-tight leading-tight">
                {featuredProduct.name}
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-neutral-400 mt-2 max-w-md lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl font-normal leading-relaxed">
                {featuredProduct.description}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 min-[400px]:grid-cols-3 gap-2 sm:gap-3 2xl:gap-4 py-1 w-full max-w-md lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl">
              {featuredProduct.highlights.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  className="p-2 sm:p-2.5 2xl:p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800 text-left backdrop-blur-sm"
                >
                  <span className="text-[10px] text-neutral-500 block uppercase font-mono tracking-wider">
                    Spec 0{idx + 1}
                  </span>
                  <span className="text-xs 2xl:text-sm font-semibold text-white truncate block mt-0.5" title={item}>
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* Price & Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl 2xl:text-4xl font-extrabold text-white font-mono">
                  ${featuredProduct.price.toLocaleString()}
                </span>
                {featuredProduct.originalPrice && (
                  <span className="text-xs sm:text-sm text-neutral-500 line-through font-mono">
                    ${featuredProduct.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={handleAddToCartClick}
                  id="hero-add-to-cart-btn"
                  className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg min-h-[42px] btn-3d cursor-pointer ${
                    !user
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 btn-glow-neutral'
                      : 'bg-white text-neutral-950 hover:bg-neutral-100 btn-glow-white shimmer-btn'
                  }`}
                >
                  {!user ? (
                    <>
                      <Lock className="w-4 h-4 text-neutral-400" />
                      Sign In to Buy
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 transition-transform group-hover:scale-110" />
                      Add to Cart
                    </>
                  )}
                </button>
                <button
                  onClick={() => onSelect(featuredProduct)}
                  id="hero-view-details-btn"
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs border border-neutral-700 transition-all flex items-center justify-center gap-1.5 min-h-[42px] btn-glow-neutral btn-3d cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-neutral-300" />
                  Inspect
                </button>
              </div>
            </div>
          </div>

          {/* Right column: High-Impact Visual with 3D Depth */}
          <div
            style={{ transform: isHovered ? 'translateZ(35px)' : 'translateZ(0px)', transition: 'transform 0.3s ease-out' }}
            className="lg:col-span-6 xl:col-span-7 2xl:col-span-7 h-72 sm:h-84 lg:h-full min-h-[360px] sm:min-h-[420px] 2xl:min-h-[480px] relative overflow-hidden flex items-center justify-center cursor-pointer bg-neutral-950"
            onClick={() => onSelect(featuredProduct)}
          >
            <img
              src={featuredProduct.image}
              alt={featuredProduct.name}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-neutral-900 via-transparent to-transparent opacity-80 lg:opacity-90" />
          </div>
        </div>
      </div>
    </div>
  );
};

