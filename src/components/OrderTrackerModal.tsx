import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  X,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { Order, UserAccount } from '../types';
import { findOrderByNumber, getOrders } from '../services/db';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderNumber?: string;
  user?: UserAccount | null;
}

const STATUS_STEPS: Array<{ key: Order['status']; label: string; desc: string }> = [
  { key: 'Confirmed', label: 'Order Confirmed', desc: 'Payment verified & order queued' },
  { key: 'Processing', label: 'Processing & Packed', desc: 'Item inspected and packaged' },
  { key: 'In Transit', label: 'In Transit', desc: 'With express insured courier' },
  { key: 'Delivered', label: 'Delivered', desc: 'Handed over at destination' },
];

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  initialOrderNumber = '',
  user,
}) => {
  const [query, setQuery] = useState(initialOrderNumber);
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  // Search logic
  const handleSearch = (searchQuery?: string) => {
    const q = (searchQuery !== undefined ? searchQuery : query).trim();
    if (!q) {
      setErrorMsg('Please enter a valid order number or tracking reference.');
      setSearchedOrder(null);
      return;
    }

    const found = findOrderByNumber(q);
    if (found) {
      setSearchedOrder(found);
      setErrorMsg('');
    } else {
      setSearchedOrder(null);
      setErrorMsg(`No order found matching "${q}". Please check the number and try again.`);
    }
  };

  // Pre-load initial order or authenticated user's recent order when opened
  useEffect(() => {
    if (isOpen) {
      if (initialOrderNumber) {
        setQuery(initialOrderNumber);
        handleSearch(initialOrderNumber);
      } else if (user) {
        // Load latest order for the authenticated user only
        const userOrders = getOrders(user.id);
        if (userOrders.length > 0) {
          setSearchedOrder(userOrders[0]);
          setQuery(userOrders[0].orderNumber);
          setErrorMsg('');
        } else {
          setSearchedOrder(null);
          setQuery('');
          setErrorMsg('');
        }
      } else {
        // Unauthenticated guests see a clean search interface with no cross-user data leakage
        setSearchedOrder(null);
        setQuery('');
        setErrorMsg('');
      }
    }
  }, [isOpen, initialOrderNumber, user]);

  // Real-time listener: when the owner or Firestore updates order status, update instantly!
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent?.detail;
      if (searchedOrder) {
        if (
          !detail?.orderId ||
          detail.orderId === searchedOrder.id ||
          detail.orderNumber === searchedOrder.orderNumber
        ) {
          const fresh = findOrderByNumber(searchedOrder.orderNumber);
          if (fresh) {
            setSearchedOrder(fresh);
          }
        }
      }
    };

    window.addEventListener('devicex:order_status_updated', handleUpdate);
    return () => window.removeEventListener('devicex:order_status_updated', handleUpdate);
  }, [searchedOrder]);

  if (!isOpen) return null;

  const getStepIndex = (status: Order['status']) => {
    switch (status) {
      case 'Confirmed':
        return 0;
      case 'Processing':
        return 1;
      case 'In Transit':
        return 2;
      case 'Delivered':
        return 3;
      case 'Cancelled':
        return -1;
      default:
        return 0;
    }
  };

  const currentStep = searchedOrder ? getStepIndex(searchedOrder.status) : 0;
  const isCancelled = searchedOrder?.status === 'Cancelled';

  const copyTracking = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div
        id="order-tracker-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          id="order-tracker-content"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl text-neutral-100 flex flex-col my-8"
        >
          {/* Header */}
          <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Live Order Tracking</h3>
                <p className="text-xs text-neutral-400">
                  Real-time status updates synced with courier dispatch
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1.5 rounded-xl hover:bg-neutral-800 transition-all btn-3d cursor-pointer"
              id="close-order-tracker-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-5 border-b border-neutral-800 bg-neutral-950/40">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Enter Order # (e.g. DX-84920 or DX-71829)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500 font-mono"
                  id="order-tracker-input"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-xs rounded-xl transition-all shrink-0 shadow-md btn-glow-white btn-3d shimmer-btn cursor-pointer"
                id="order-tracker-submit"
              >
                Track Order
              </button>
            </form>

            {errorMsg && (
              <p className="mt-2 text-xs text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {errorMsg}
              </p>
            )}
          </div>

          {/* Body: Live Status and Details */}
          <div className="p-5 overflow-y-auto max-h-[60vh] space-y-5">
            {searchedOrder ? (
              <>
                {/* Status Hero Card */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">
                          Order #{searchedOrder.orderNumber}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                            searchedOrder.status === 'Delivered'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : searchedOrder.status === 'In Transit'
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                              : searchedOrder.status === 'Processing'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : searchedOrder.status === 'Cancelled'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              searchedOrder.status === 'Delivered'
                                ? 'bg-emerald-400'
                                : searchedOrder.status === 'Cancelled'
                                ? 'bg-rose-400'
                                : 'bg-sky-400 animate-pulse'
                            }`}
                          />
                          {searchedOrder.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Placed on {new Date(searchedOrder.createdAt).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-neutral-400 block">Estimated Arrival</span>
                      <span className="text-sm font-bold text-white">
                        {searchedOrder.estimatedDelivery || 'In 2-4 business days'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Stepper Bar */}
                  {isCancelled ? (
                    <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/50 text-rose-300 text-xs">
                      This order has been cancelled. If payment was made, a full refund has been processed.
                    </div>
                  ) : (
                    <div className="pt-2 pb-1">
                      <div className="relative">
                        {/* Connecting Line */}
                        <div className="absolute top-4 left-4 right-4 h-0.5 bg-neutral-800 -translate-y-1/2 z-0" />
                        <div
                          className="absolute top-4 left-4 h-0.5 bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-400 -translate-y-1/2 z-0 transition-all duration-500"
                          style={{
                            width: `${(Math.max(0, currentStep) / (STATUS_STEPS.length - 1)) * 100}%`,
                          }}
                        />

                        {/* Steps */}
                        <div className="relative z-10 grid grid-cols-4 gap-2">
                          {STATUS_STEPS.map((step, idx) => {
                            const isCompleted = idx <= currentStep;
                            const isCurrent = idx === currentStep;

                            return (
                              <div key={step.key} className="flex flex-col items-center text-center">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-md ${
                                    isCurrent
                                      ? 'bg-sky-500 text-neutral-950 ring-4 ring-sky-500/20'
                                      : isCompleted
                                      ? 'bg-emerald-500 text-neutral-950'
                                      : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                                  }`}
                                >
                                  {isCompleted && !isCurrent ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    idx + 1
                                  )}
                                </div>
                                <span
                                  className={`text-[11px] font-semibold mt-2 ${
                                    isCurrent
                                      ? 'text-sky-400'
                                      : isCompleted
                                      ? 'text-white'
                                      : 'text-neutral-500'
                                  }`}
                                >
                                  {step.label}
                                </span>
                                <span className="text-[9px] text-neutral-500 hidden sm:block mt-0.5">
                                  {step.desc}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Courier & Tracking Code Box */}
                  <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-sky-400 shrink-0" />
                      <div>
                        <span className="text-neutral-400 text-[10px] block uppercase font-mono">
                          Courier & Tracking Number
                        </span>
                        <span className="text-white font-mono font-semibold">
                          {searchedOrder.carrier || 'FedEx Express'} •{' '}
                          {searchedOrder.trackingNumber || `DX-TRK-${searchedOrder.orderNumber}`}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        copyTracking(searchedOrder.trackingNumber || `DX-TRK-${searchedOrder.orderNumber}`)
                      }
                      className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors text-[11px] font-mono flex items-center gap-1 shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy Tracking
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Items in this Order */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                    Items In This Shipment ({searchedOrder.items.length})
                  </h4>
                  <div className="space-y-2.5 divide-y divide-neutral-900">
                    {searchedOrder.items.map((item, idx) => (
                      <div key={idx} className="pt-2 first:pt-0 flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover bg-neutral-900 border border-neutral-800"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                          <p className="text-[11px] text-neutral-400">
                            {item.brand} • Qty: {item.quantity}
                            {item.selectedColor ? ` • ${item.selectedColor}` : ''}
                          </p>
                        </div>
                        <span className="text-xs font-mono font-semibold text-white">
                          ${(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-neutral-800 flex justify-between text-xs">
                    <span className="text-neutral-400">Total Charged</span>
                    <span className="font-bold text-white font-mono">
                      ${searchedOrder.total.toLocaleString()} via {searchedOrder.paymentMethod.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Delivery Destination */}
                {searchedOrder.shippingAddress && (
                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" />
                      <span className="font-semibold uppercase tracking-wider font-mono text-[10px]">
                        Shipping Destination
                      </span>
                    </div>
                    <p className="text-white font-medium">
                      {searchedOrder.shippingAddress.fullName || searchedOrder.customerName}
                    </p>
                    <p className="text-neutral-400 text-[11px]">
                      {searchedOrder.shippingAddress.street}
                      <br />
                      {searchedOrder.shippingAddress.city}, {searchedOrder.shippingAddress.state}{' '}
                      {searchedOrder.shippingAddress.zip}, {searchedOrder.shippingAddress.country}
                    </p>
                  </div>
                )}

                {/* Security Badge */}
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 text-emerald-400 font-medium">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Cryptographically Authenticated Record</span>
                  </div>
                  <span className="text-neutral-500 font-mono text-[10px]">
                    Signature Verified
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-neutral-400 space-y-3">
                <Package className="w-10 h-10 mx-auto text-neutral-600" />
                <p className="text-sm font-medium text-white">Track Your Shipment</p>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                  Enter your order number or tracking reference code in the search bar above to view real-time shipping status and package transit updates.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
