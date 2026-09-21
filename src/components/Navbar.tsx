import React, { useState } from 'react';
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  ShieldCheck,
  X,
  SlidersHorizontal,
  Lock,
  Database,
  Terminal,
  Truck,
} from 'lucide-react';
import { UserAccount } from '../types';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenSecurity?: () => void;
  onOpenDatabase?: () => void;
  onOpenOrderTracker?: () => void;
  user: UserAccount | null;
  totalCartAmount: number;
  isDeveloperMode?: boolean;
  onToggleDeveloperMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenAuth,
  onOpenProfile,
  onOpenSecurity,
  onOpenDatabase,
  onOpenOrderTracker,
  user,
  totalCartAmount,
  isDeveloperMode = false,
  onToggleDeveloperMode,
}) => {
  const [isSearchOpenMobile, setIsSearchOpenMobile] = useState(false);

  return (
    <header
      id="devicex-header"
      className="sticky top-0 z-40 w-full bg-neutral-950/85 backdrop-blur-xl border-b border-neutral-800/80 transition-all"
    >
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#"
            onClick={e => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 group"
            id="brand-logo"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-400 flex items-center justify-center text-neutral-950 font-black text-sm tracking-tighter shadow-md shadow-white/5 group-hover:scale-105 transition-transform">
              DX
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white font-sans flex items-center gap-1.5">
                DeviceX
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              </span>
              <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-mono -mt-1 hidden sm:inline">
                Tech & Gadgets
              </span>
            </div>
          </a>
        </div>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex flex-1 max-w-md lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search laptops, mobiles, bluetooth speakers, airpods..."
              className="w-full pl-10 pr-9 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all"
              id="desktop-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Search Toggle */}
          <button
            onClick={() => setIsSearchOpenMobile(!isSearchOpenMobile)}
            className="md:hidden p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
            id="mobile-search-toggle"
            aria-label="Toggle search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Real-time Cloud Sync Live Indicator */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Real-Time Sync</span>
          </div>

          {/* Developer Mode Active Pill (ONLY visible when Developer Mode is enabled) */}
          {isDeveloperMode && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-sky-950/60 border border-sky-500/40 text-sky-300 text-xs font-mono animate-pulse">
              <Terminal className="w-3.5 h-3.5 text-sky-400" />
              <button
                onClick={onOpenDatabase}
                className="hover:text-white hover:underline transition-all cursor-pointer"
                title="Open Database Inspector"
                id="navbar-dev-db-shortcut"
              >
                Database
              </button>
            </div>
          )}

          {/* Track Order Quick Button */}
          {onOpenOrderTracker && (
            <button
              onClick={onOpenOrderTracker}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-neutral-300 hover:text-white bg-neutral-900/60 hover:bg-neutral-800/90 border border-neutral-800 transition-all text-xs font-medium btn-3d btn-glow-neutral cursor-pointer"
              id="navbar-track-order-btn"
              title="Track Order Status"
            >
              <Truck className="w-4 h-4 text-sky-400" />
              <span className="hidden lg:inline">Track Order</span>
            </button>
          )}

          {/* Wishlist Button */}
          <button
            onClick={onOpenWishlist}
            className={`relative p-2 rounded-xl transition-all min-w-[38px] min-h-[38px] flex items-center justify-center btn-3d btn-glow-neutral cursor-pointer border ${
              wishlistCount > 0 && user
                ? 'bg-neutral-900 text-rose-400 border-neutral-700/90 hover:border-rose-500/50'
                : 'bg-neutral-900/80 text-neutral-300 hover:text-white hover:bg-neutral-800 border-neutral-800 hover:border-neutral-600'
            }`}
            id="navbar-wishlist-btn"
            title={!user ? 'Sign in to view saved wishlist' : 'Saved Wishlist'}
            aria-label="View Wishlist"
          >
            <Heart className={`w-5 h-5 transition-transform hover:scale-110 ${wishlistCount > 0 && user ? 'fill-rose-400/20 text-rose-400' : ''}`} />
            {wishlistCount > 0 && user && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-md ring-2 ring-neutral-950">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white text-neutral-950 hover:bg-neutral-100 transition-all font-bold text-xs shadow-md group min-h-[38px] btn-glow-white btn-3d shimmer-btn cursor-pointer"
            id="navbar-cart-btn"
            aria-label="View Shopping Cart"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 text-neutral-950 transition-transform group-hover:scale-110" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-emerald-500 text-neutral-950 font-mono text-[9px] font-black flex items-center justify-center shadow">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="font-mono text-[11px] whitespace-nowrap">
              {totalCartAmount > 0 ? `$${totalCartAmount.toLocaleString()}` : <span className="hidden sm:inline">Cart</span>}
            </span>
          </button>

          {/* User Account / Sign In */}
          {user ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all btn-3d btn-glow-neutral cursor-pointer"
              id="navbar-profile-btn"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-6 h-6 rounded-lg object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-lg bg-neutral-800 flex items-center justify-center text-white text-xs">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
              <span className="text-xs font-medium text-white max-w-[90px] truncate hidden md:inline">
                {user.name}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-200 hover:text-white transition-all text-xs font-semibold btn-3d btn-glow-neutral cursor-pointer"
              id="navbar-signin-btn"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Search Input Drawer */}
      {isSearchOpenMobile && (
        <div className="md:hidden px-4 pb-3 border-t border-neutral-800/80 bg-neutral-950">
          <div className="relative w-full pt-2">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 translate-y-[-2px] pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search laptops, mobiles, speakers, audio..."
              className="w-full pl-9 pr-8 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-600 transition-colors"
              id="mobile-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 translate-y-[-2px] text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
