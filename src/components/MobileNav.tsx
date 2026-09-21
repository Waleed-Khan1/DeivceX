import React from 'react';
import { Home, Layers, Heart, ShoppingBag, User, ShieldCheck } from 'lucide-react';
import { UserAccount } from '../types';

interface MobileNavProps {
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onScrollToProducts: () => void;
  user: UserAccount | null;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenAuth,
  onOpenProfile,
  onScrollToProducts,
  user,
}) => {
  return (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-neutral-950/90 backdrop-blur-lg border-t border-neutral-800 px-2 py-1.5 flex items-center justify-around text-neutral-400"
    >
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="flex flex-col items-center justify-center min-w-[48px] min-h-[44px] p-1 text-white hover:text-white"
        id="mobile-nav-home"
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] font-medium mt-0.5">Home</span>
      </button>

      <button
        onClick={onScrollToProducts}
        className="flex flex-col items-center justify-center min-w-[48px] min-h-[44px] p-1 text-neutral-400 hover:text-white"
        id="mobile-nav-catalog"
      >
        <Layers className="w-5 h-5" />
        <span className="text-[10px] font-medium mt-0.5">Devices</span>
      </button>

      <button
        onClick={onOpenWishlist}
        className={`relative flex flex-col items-center justify-center min-w-[48px] min-h-[44px] p-1 transition-colors ${
          wishlistCount > 0 && user ? 'text-rose-400' : 'text-neutral-400 hover:text-white'
        }`}
        id="mobile-nav-wishlist"
      >
        <Heart className={`w-5 h-5 ${wishlistCount > 0 && user ? 'fill-rose-400/20' : ''}`} />
        {wishlistCount > 0 && user && (
          <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-sm">
            {wishlistCount}
          </span>
        )}
        <span className="text-[10px] font-medium mt-0.5">Saved</span>
      </button>

      <button
        onClick={onOpenCart}
        className="relative flex flex-col items-center justify-center min-w-[48px] min-h-[44px] p-1 text-neutral-400 hover:text-white"
        id="mobile-nav-cart"
      >
        <ShoppingBag className="w-5 h-5" />
        {cartCount > 0 && (
          <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-emerald-500 text-neutral-950 font-mono text-[9px] font-bold flex items-center justify-center">
            {cartCount}
          </span>
        )}
        <span className="text-[10px] font-medium mt-0.5">Cart</span>
      </button>

      <button
        onClick={user ? onOpenProfile : onOpenAuth}
        className="flex flex-col items-center justify-center min-w-[48px] min-h-[44px] p-1 text-neutral-400 hover:text-white"
        id="mobile-nav-account"
      >
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
        ) : (
          <User className="w-5 h-5" />
        )}
        <span className="text-[10px] font-medium mt-0.5">{user ? 'Account' : 'Login'}</span>
      </button>
    </nav>
  );
};
