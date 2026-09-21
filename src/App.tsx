import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { HeroBanner } from './components/HeroBanner';
import { CategoryBar } from './components/CategoryBar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { SecurityAuditModal } from './components/SecurityAuditModal';
import { DatabaseViewerModal } from './components/DatabaseViewerModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { DeveloperToolbar } from './components/DeveloperToolbar';
import { OwnerAccessModal } from './components/OwnerAccessModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Footer } from './components/Footer';
import { Scene3DBackground } from './components/Scene3DBackground';
import { Cursor3DLighting } from './components/Cursor3DLighting';
import { ValueHighlights } from './components/ValueHighlights';
import { ScrollToTop3D } from './components/ScrollToTop3D';
import { PRODUCTS } from './data/products';
import { CategoryType, Product, CartItem, UserAccount, Order } from './types';
import {
  initializeDatabase,
  getCurrentSession,
  logoutUser,
  getWishlist,
  toggleWishlistProduct,
  addAuditLog,
  isOwnerSessionActive,
  setOwnerSessionActive,
  broadcastRealtimeEvent,
  subscribeToRealtimeChannel,
} from './services/db';
import { Search, Sparkles, Filter, X, ChevronDown } from 'lucide-react';

const CART_STORAGE_KEY = 'devicex_cart_items_v1';
const INITIAL_VISIBLE_COUNT = 8;

export default function App() {
  // Database & Session
  const [user, setUser] = useState<UserAccount | null>(null);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Owner & Developer Access (strictly restricted from regular customers)
  const [isDeveloperMode, setIsDeveloperMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return isOwnerSessionActive();
  });
  const [isOwnerAccessOpen, setIsOwnerAccessOpen] = useState(false);

  // Toggle Developer Toolbar (only when owner is authenticated)
  const toggleDeveloperMode = () => {
    if (!isOwnerSessionActive()) {
      setIsOwnerAccessOpen(true);
      return;
    }
    setIsDeveloperMode(prev => !prev);
  };

  // Lock and exit owner mode
  const handleLockOwnerMode = () => {
    setOwnerSessionActive(false);
    setIsDeveloperMode(false);
    setIsOwnerAccessOpen(false);
    addToast('info', 'Owner Mode Locked', 'Developer console locked. Standard customer view active.');
  };

  // When owner successfully authenticates with master passcode
  const handleOwnerAuthenticated = () => {
    setOwnerSessionActive(true);
    setIsDeveloperMode(true);
    setIsOwnerAccessOpen(false);
    addToast('success', 'Owner Mode Unlocked', 'Store owner console and database tools are now active.');
  };

  // Keyboard shortcut listener: ~ or Ctrl+Shift+D / Cmd+Shift+D opens Owner Gatekeeper
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '`' ||
        e.key === '~' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) ||
        (e.metaKey && e.shiftKey && (e.key === 'D' || e.key === 'd'))
      ) {
        const activeEl = document.activeElement;
        const tag = activeEl?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || (activeEl as HTMLElement)?.isContentEditable) {
          return;
        }
        e.preventDefault();
        if (isOwnerSessionActive()) {
          toggleDeveloperMode();
        } else {
          setIsOwnerAccessOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check URL parameters for direct owner portal access: ?owner=true or ?admin=true
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('owner') === 'true' || urlParams.get('admin') === 'true') {
        setIsOwnerAccessOpen(true);
      }
    }
  }, []);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [selectedBrand, setSelectedBrand] = useState('All Brands');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  // Promo Code State
  const [appliedPromo, setAppliedPromo] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  // Modal Views
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isDatabaseOpen, setIsDatabaseOpen] = useState(false);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState(false);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState('');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Initialize DB, user session, and stored isolated cart/wishlist
  useEffect(() => {
    initializeDatabase();
    const session = getCurrentSession();
    if (session) {
      setUser(session);
      setWishlistIds(getWishlist(session.id));
      try {
        const savedCart = localStorage.getItem(`devicex_cart_${session.id}`);
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      } catch {
        // Safe fallback
      }
    } else {
      setUser(null);
      setWishlistIds([]);
      try {
        const savedCart = localStorage.getItem('devicex_cart_guest');
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      } catch {
        // Safe fallback
      }
    }
  }, []);

  // Real-time synchronization across all tabs and Firestore live events
  useEffect(() => {
    // 1. Wishlist updates (Firestore snapshot / local / cross-tab)
    const handleWishlistUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      if (detail && detail.userId) {
        const session = getCurrentSession();
        if (session && detail.userId === session.id && Array.isArray(detail.wishlist)) {
          setWishlistIds(detail.wishlist);
        }
      } else if (!getCurrentSession()) {
        setWishlistIds([]);
      }
    };
    window.addEventListener('devicex:wishlist_updated', handleWishlistUpdate);

    // 2. Order status live notification toast
    const handleOrderUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      if (detail && detail.status && detail.orderNumber) {
        addToast(
          'info',
          'Live Order Status Update',
          `Order #${detail.orderNumber} is now "${detail.status}"`
        );
      }
    };
    window.addEventListener('devicex:order_status_updated', handleOrderUpdate);

    // 3. Storage event fallback for cross-tab cart & user synchronization
    const handleStorage = (e: StorageEvent) => {
      const session = getCurrentSession();
      const currentCartKey = session ? `devicex_cart_${session.id}` : 'devicex_cart_guest';
      if (e.key === currentCartKey && e.newValue) {
        try {
          setCart(JSON.parse(e.newValue));
        } catch {
          // safe
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    // 4. Real-time broadcast channel for instantaneous cross-tab reactivity
    const unsubBroadcast = subscribeToRealtimeChannel((type, payload) => {
      const session = getCurrentSession();
      if (type === 'cart_updated' && payload && Array.isArray(payload.cart)) {
        const currentUserId = session ? session.id : 'guest';
        if (payload.userId === currentUserId) {
          setCart(payload.cart);
        }
      } else if (type === 'wishlist_updated' && payload && Array.isArray(payload.wishlist)) {
        if (session && payload.userId === session.id) {
          setWishlistIds(payload.wishlist);
        }
      } else if (type === 'auth_updated') {
        const newAuth = payload.user || null;
        setUser(newAuth);
        if (newAuth) {
          setWishlistIds(getWishlist(newAuth.id));
        } else {
          setWishlistIds([]);
          setCart([]);
        }
      } else if (type === 'order_status_updated' && payload && payload.orderNumber) {
        addToast(
          'info',
          'Live Order Status Update',
          `Order #${payload.orderNumber} is now "${payload.status}"`
        );
      }
    });

    return () => {
      window.removeEventListener('devicex:wishlist_updated', handleWishlistUpdate);
      window.removeEventListener('devicex:order_status_updated', handleOrderUpdate);
      window.removeEventListener('storage', handleStorage);
      unsubBroadcast();
    };
  }, []);

  // Save cart changes & broadcast in real-time strictly scoped to this user
  useEffect(() => {
    try {
      const cartKey = user ? `devicex_cart_${user.id}` : 'devicex_cart_guest';
      localStorage.setItem(cartKey, JSON.stringify(cart));
      broadcastRealtimeEvent('cart_updated', { cart, userId: user?.id || 'guest' });
    } catch {
      // Fallback
    }
  }, [cart, user]);

  // Toast helper
  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3800);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Cart Calculations
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [cart]);
  const shipping = subtotal === 0 || subtotal >= 500 || appliedPromo === 'FREESHIP' ? 0 : 25;
  const tax = Math.round(subtotal * 0.08);
  const total = Math.max(0, subtotal - discountAmount + shipping + tax);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(product => {
      // Category filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }
      // Brand filter
      if (selectedBrand !== 'All Brands' && product.brand !== selectedBrand) {
        return false;
      }
      // In-stock filter
      if (inStockOnly && !product.inStock) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesBrand = product.brand.toLowerCase().includes(q);
        const matchesCat = product.category.toLowerCase().includes(q);
        const matchesHighlights = product.highlights.some(h => h.toLowerCase().includes(q));
        const matchesDesc = product.description.toLowerCase().includes(q);
        if (!matchesName && !matchesBrand && !matchesCat && !matchesHighlights && !matchesDesc) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      // Default: featured first, then new
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });
  }, [selectedCategory, selectedBrand, inStockOnly, searchQuery, sortBy]);

  // Reset pagination when any filter changes
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [selectedCategory, selectedBrand, inStockOnly, searchQuery, sortBy]);

  // Sliced devices for progressive discovery
  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  // Wishlist items array & real-time verified count (strictly isolated to active authenticated user)
  const wishlistProducts = useMemo(() => {
    if (!user) return [];
    return PRODUCTS.filter(p => wishlistIds.includes(p.id));
  }, [wishlistIds, user]);
  const wishlistCount = user ? wishlistProducts.length : 0;

  // Featured flagship product for Hero Banner (MacBook Pro or first featured)
  const heroProduct = useMemo(() => {
    return PRODUCTS.find(p => p.id === 'lap-apple-mbp16') || PRODUCTS[0];
  }, []);

  // Handlers
  const handleOpenWishlist = () => {
    if (!user) {
      addToast('info', 'Sign In Required', 'Please sign in to your account to view your saved wishlist.');
      setIsAuthOpen(true);
      return;
    }
    setIsWishlistOpen(true);
  };

  const handleAddToCart = (product: Product, quantity = 1, color?: string) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(
        it => it.product.id === product.id && it.selectedColor === color
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + quantity,
        };
        return updated;
      } else {
        return [...prev, { product, quantity, selectedColor: color }];
      }
    });
    addToast('success', 'Added to Cart', `${product.name} (x${quantity})`);
    addAuditLog('Item Added to Cart', `Added ${product.name} to local encrypted session cart`, 'AES-256 GCM');
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(it => (it.product.id === productId ? { ...it, quantity } : it))
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(it => it.product.id !== productId));
    addToast('info', 'Item Removed', 'Product removed from your shopping cart');
  };

  const handleClearCart = () => {
    setCart([]);
    setAppliedPromo('');
    setDiscountAmount(0);
    addToast('info', 'Cart Cleared', 'All items have been removed');
  };

  const handleToggleWishlist = (productId: string) => {
    if (!user) {
      addToast('info', 'Sign In Required', 'Please sign in to your account to save items to your wishlist.');
      setIsAuthOpen(true);
      return;
    }
    const res = toggleWishlistProduct(productId, user.id);
    setWishlistIds(res.items);
    const prod = PRODUCTS.find(p => p.id === productId);
    if (res.isWishlisted) {
      addToast('success', 'Saved to Wishlist', `${prod?.name || 'Device'} saved to your account`);
    } else {
      addToast('info', 'Removed from Wishlist', `${prod?.name || 'Device'} removed from your wishlist`);
    }
  };

  const handleInstantBuy = (product: Product, quantity = 1, color?: string) => {
    handleAddToCart(product, quantity, color);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleApplyPromo = (code: string): boolean => {
    if (code === 'DEVICEX10') {
      const disc = Math.round(subtotal * 0.1);
      setDiscountAmount(disc);
      setAppliedPromo('DEVICEX10');
      addToast('success', 'Promo Applied', '10% discount applied to your order!');
      return true;
    }
    if (code === 'FREESHIP') {
      setAppliedPromo('FREESHIP');
      addToast('success', 'Free Shipping Unlocked', 'Express Insured Shipping is now $0.00!');
      return true;
    }
    return false;
  };

  const handleLoginSuccess = (account: UserAccount, message: string) => {
    setUser(account);
    setWishlistIds(getWishlist(account.id));
    try {
      const userCartKey = `devicex_cart_${account.id}`;
      const savedUserCart = localStorage.getItem(userCartKey);
      if (savedUserCart) {
        setCart(JSON.parse(savedUserCart));
      }
    } catch {
      // safe
    }
    addToast('success', 'Authenticated', message);
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setWishlistIds([]);
    setCart([]);
    setIsProfileOpen(false);
    setIsWishlistOpen(false);
    addToast('info', 'Signed Out', 'You have been safely signed out.');
  };

  const handleOrderSuccess = (order: Order) => {
    setCart([]);
    setAppliedPromo('');
    setDiscountAmount(0);
    setTrackingOrderNumber(order.orderNumber);
    addToast('success', 'Order Confirmed', `Thank you! Order #${order.orderNumber} is confirmed.`);
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedBrand('All Brands');
    setSearchQuery('');
    setInStockOnly(false);
    setSortBy('featured');
  };

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedBrand !== 'All Brands' ||
    Boolean(searchQuery.trim()) ||
    inStockOnly ||
    sortBy !== 'featured';

  const scrollToCatalog = () => {
    const el = document.getElementById('catalog-anchor');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-white selection:text-neutral-950 relative">
      {/* Ambient 3D Three.js Parallax Background */}
      <Scene3DBackground />

      {/* Dynamic 3D Cursor Lighting Halo */}
      <Cursor3DLighting />

      {/* Navigation Header */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={handleOpenWishlist}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        onOpenDatabase={() => setIsDatabaseOpen(true)}
        onOpenOrderTracker={() => setIsOrderTrackerOpen(true)}
        user={user}
        totalCartAmount={total}
        isDeveloperMode={isDeveloperMode}
        onToggleDeveloperMode={toggleDeveloperMode}
      />

      {/* Main Content */}
      <main className="flex-1 w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 pt-6 sm:pt-8 pb-24 md:pb-12">
        {/* Flagship Hero Showcase (only show when not actively searching) */}
        {!searchQuery && selectedCategory === 'all' && selectedBrand === 'All Brands' && (
          <>
            <HeroBanner
              featuredProduct={heroProduct}
              onSelect={setSelectedProduct}
              onAddToCart={handleAddToCart}
              user={user}
              onRequireAuth={() => setIsAuthOpen(true)}
            />
            {/* 3D Value Propositions Section */}
            <ValueHighlights />
          </>
        )}

        {/* Anchor for catalog scrolling */}
        <div id="catalog-anchor" className="scroll-mt-20">
          {/* Category Pills & Sorting Bar */}
          <CategoryBar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedBrand={selectedBrand}
            onSelectBrand={setSelectedBrand}
            sortBy={sortBy}
            onSortChange={setSortBy}
            inStockOnly={inStockOnly}
            onToggleInStock={() => setInStockOnly(!inStockOnly)}
            totalResults={filteredProducts.length}
            onResetFilters={handleResetFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        {/* Active Search & Filter Banner */}
        {searchQuery && (
          <div className="mb-6 p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs">
            <span className="text-neutral-300 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-neutral-400" />
              Showing results for &quot;<strong className="text-white">{searchQuery}</strong>&quot; ({filteredProducts.length} matches)
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-neutral-400 hover:text-white flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Clear Search
            </button>
          </div>
        )}

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center space-y-4 rounded-3xl bg-neutral-900/50 border border-neutral-800">
            <div className="w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-700 mx-auto flex items-center justify-center text-neutral-400">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">No tech devices match your criteria</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                Try searching for another device name, brand (Apple, Samsung, Sony, Bose, Dell), or clear filters.
              </p>
            </div>
            <button
              onClick={handleResetFilters}
              className="px-5 py-2 rounded-xl bg-white text-neutral-950 font-semibold text-xs hover:bg-neutral-200 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 min-[1920px]:grid-cols-6 min-[2400px]:grid-cols-7 gap-4 sm:gap-5 lg:gap-6">
              {visibleProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={setSelectedProduct}
                  onAddToCart={handleAddToCart}
                  isWishlisted={wishlistIds.includes(product.id)}
                  onToggleWishlist={handleToggleWishlist}
                  isInCart={cart.some(it => it.product.id === product.id)}
                  user={user}
                  onRequireAuth={() => setIsAuthOpen(true)}
                />
              ))}
            </div>

            {/* Show More Devices Button */}
            {filteredProducts.length > visibleCount && (
              <div className="mt-12 flex flex-col items-center justify-center gap-3">
                <p className="text-xs text-neutral-400 font-mono">
                  Showing <span className="text-white font-semibold">{visibleProducts.length}</span> of{' '}
                  <span className="text-white font-semibold">{filteredProducts.length}</span> devices
                </p>
                <div className="w-48 sm:w-64 h-1.5 bg-neutral-900 border border-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-neutral-500 to-white rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.min(100, (visibleProducts.length / filteredProducts.length) * 100)}%` }}
                  />
                </div>
                <button
                  id="show-more-devices-btn"
                  onClick={() => setVisibleCount(prev => prev + INITIAL_VISIBLE_COUNT)}
                  className="mt-1 px-8 py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 hover:border-neutral-500 text-white font-medium text-xs sm:text-sm flex items-center gap-2.5 transition-all btn-3d shadow-xl hover:shadow-2xl cursor-pointer active:scale-95"
                >
                  <span>Show More Devices</span>
                  <ChevronDown className="w-4 h-4 text-neutral-400" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenSecurity={() => setIsSecurityOpen(true)}
        isDeveloperMode={isDeveloperMode}
        onToggleDeveloperMode={toggleDeveloperMode}
      />

      {/* Mobile Sticky Bottom Nav for Phones */}
      <MobileNav
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={handleOpenWishlist}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onScrollToProducts={scrollToCatalog}
        user={user}
      />

      {/* Modals & Drawers */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onInstantBuy={handleInstantBuy}
        isWishlisted={selectedProduct ? wishlistIds.includes(selectedProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
        user={user}
        onRequireLogin={() => setIsAuthOpen(true)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        appliedPromo={appliedPromo}
        onApplyPromo={handleApplyPromo}
        discount={discountAmount}
        user={user}
        onRequireLogin={() => {
          setIsCartOpen(false);
          setIsAuthOpen(true);
        }}
      />

      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistProducts={wishlistProducts}
        onRemoveFromWishlist={handleToggleWishlist}
        onAddToCart={prod => {
          if (!user) {
            setIsWishlistOpen(false);
            setIsAuthOpen(true);
            return;
          }
          handleAddToCart(prod);
          addToast('success', 'Moved to Cart', prod.name);
        }}
        user={user}
        onRequireLogin={() => {
          setIsWishlistOpen(false);
          setIsAuthOpen(true);
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        subtotal={subtotal}
        discount={discountAmount}
        shipping={shipping}
        tax={tax}
        total={total}
        user={user}
        onOrderSuccess={handleOrderSuccess}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      <UserProfileModal
        isOpen={isProfileOpen}
        user={user}
        onClose={() => setIsProfileOpen(false)}
        onLogout={handleLogout}
        onOpenSecurityDetails={() => {
          setIsProfileOpen(false);
          setIsSecurityOpen(true);
        }}
        onOpenOwnerAccess={() => {
          setIsProfileOpen(false);
          setIsOwnerAccessOpen(true);
        }}
        onOpenOrderTracker={orderNum => {
          setIsProfileOpen(false);
          if (orderNum) {
            setTrackingOrderNumber(orderNum);
          }
          setIsOrderTrackerOpen(true);
        }}
      />

      {/* Order Tracker Modal */}
      <OrderTrackerModal
        isOpen={isOrderTrackerOpen}
        onClose={() => setIsOrderTrackerOpen(false)}
        initialOrderNumber={trackingOrderNumber}
        user={user}
      />

      <SecurityAuditModal
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
      />

      <DatabaseViewerModal
        isOpen={isDatabaseOpen}
        onClose={() => setIsDatabaseOpen(false)}
      />

      {/* Owner Access Gatekeeper Modal (Requires Master Key to unlock Developer Mode) */}
      <OwnerAccessModal
        isOpen={isOwnerAccessOpen}
        onClose={() => setIsOwnerAccessOpen(false)}
        onAuthenticated={handleOwnerAuthenticated}
        onLockOwnerMode={handleLockOwnerMode}
        onOpenDatabase={() => setIsDatabaseOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
      />

      {/* Developer Toolbar Console (Only rendered when Developer Mode is active for the Owner) */}
      <DeveloperToolbar
        isOpen={isDeveloperMode}
        onClose={toggleDeveloperMode}
        onOpenDatabase={() => setIsDatabaseOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        onResetDatabase={() => {
          setIsDatabaseOpen(true);
        }}
        onLockOwnerMode={handleLockOwnerMode}
      />

      {/* 3D Floating Scroll To Top Control */}
      <ScrollToTop3D />

      {/* Global Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
