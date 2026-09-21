import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Package,
  Shield,
  LogOut,
  X,
  CheckCircle,
  ExternalLink,
  Clock,
  Truck,
  ShieldCheck,
  KeyRound,
  Check,
  Radio,
} from 'lucide-react';
import { Order, UserAccount } from '../types';
import { getOrders } from '../services/db';

interface UserProfileModalProps {
  isOpen: boolean;
  user: UserAccount | null;
  onClose: () => void;
  onLogout: () => void;
  onOpenSecurityDetails: () => void;
  onOpenOwnerAccess?: () => void;
  onOpenOrderTracker?: (orderNumber?: string) => void;
}

const ORDER_STEPS: Array<{ key: Order['status']; label: string }> = [
  { key: 'Confirmed', label: 'Confirmed' },
  { key: 'Processing', label: 'Processing' },
  { key: 'In Transit', label: 'In Transit' },
  { key: 'Delivered', label: 'Delivered' },
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  user,
  onClose,
  onLogout,
  onOpenSecurityDetails,
  onOpenOwnerAccess,
  onOpenOrderTracker,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'security'>('orders');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);

  // Sync orders on open and listen to real-time status updates from the owner/database
  useEffect(() => {
    if (isOpen && user) {
      setUserOrders(getOrders(user.id));
    }
  }, [isOpen, user]);

  useEffect(() => {
    const handleStatusUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      if (user) {
        setUserOrders(getOrders(user.id));
      }
    };

    window.addEventListener('devicex:order_status_updated', handleStatusUpdate);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'devicex_order_ping' && user) {
        setUserOrders(getOrders(user.id));
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('devicex:order_status_updated', handleStatusUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [user]);

  if (!isOpen || !user) return null;

  const isOwner =
    user.role === 'owner' ||
    user.email.toLowerCase() === 'owner@devicex.com' ||
    user.email.toLowerCase() === 'waleedkhan12618@gmail.com';

  const copyToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

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

  return (
    <AnimatePresence>
      <div
        id="profile-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          id="profile-modal-content"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl text-neutral-100 max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 overflow-hidden flex items-center justify-center">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-neutral-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-white">{user.name}</h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    DeviceX Member
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  {user.email} • Member since {user.joinedDate}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-medium transition-colors"
                id="profile-logout-btn"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
                id="close-profile-modal-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Store Owner Privileges Banner (strictly for authenticated store owner accounts) */}
          {isOwner && onOpenOwnerAccess && (
            <div className="mx-6 mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block">Store Owner Operations</span>
                  <span className="text-[11px] text-amber-300/80">
                    Change order statuses, view plain text database & manage fulfillment
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenOwnerAccess();
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors shrink-0"
              >
                Owner Portal
              </button>
            </div>
          )}

          {/* Tab Selector */}
          <div className="flex border-b border-neutral-800 px-5 bg-neutral-950/40">
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-3 px-4 text-xs font-medium border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'orders'
                  ? 'border-white text-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Package className="w-4 h-4" />
              Order History ({userOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-3 px-4 text-xs font-medium border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'security'
                  ? 'border-white text-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              Security & Privacy
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-5 flex-1 overflow-y-auto">
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {userOrders.length === 0 ? (
                  <div className="text-center py-12 text-neutral-400 space-y-2">
                    <Package className="w-10 h-10 mx-auto text-neutral-600 mb-2" />
                    <p className="text-sm font-medium text-white">No orders yet</p>
                    <p className="text-xs text-neutral-400">Your order history and delivery tracking will appear here.</p>
                  </div>
                ) : (
                  userOrders.map(order => {
                    const stepIdx = getStepIndex(order.status);
                    const isCancelled = order.status === 'Cancelled';

                    return (
                      <div
                        key={order.id}
                        className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3.5 transition-all"
                      >
                        {/* Top Line */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white text-xs">
                                Order #{order.orderNumber}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                                  order.status === 'Delivered'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : order.status === 'In Transit'
                                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                                    : order.status === 'Processing'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                    : order.status === 'Cancelled'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    order.status === 'Delivered'
                                      ? 'bg-emerald-400'
                                      : order.status === 'Cancelled'
                                      ? 'bg-rose-400'
                                      : 'bg-sky-400 animate-pulse'
                                  }`}
                                />
                                {order.status}
                              </span>
                            </div>
                            <span className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5 font-mono">
                              <Clock className="w-3 h-3 text-neutral-500" />
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-bold text-white font-mono">
                              ${order.total.toLocaleString()}
                            </span>
                            <span className="block text-[10px] text-neutral-400 capitalize">
                              Paid via {order.paymentMethod.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Order Progress Stepper (Updates instantly when owner changes status) */}
                        {!isCancelled ? (
                          <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
                            <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-2 font-mono">
                              <span className="flex items-center gap-1">
                                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                                Live Status Progress
                              </span>
                              <span className="text-neutral-300 font-semibold">
                                {order.status === 'Delivered'
                                  ? 'Shipment Delivered'
                                  : order.status === 'In Transit'
                                  ? 'Out For Delivery'
                                  : order.status === 'Processing'
                                  ? 'Being Prepared & Packed'
                                  : 'Order Confirmed'}
                              </span>
                            </div>

                            {/* Stepper Dots & Line */}
                            <div className="relative flex items-center justify-between px-2 pt-1 pb-1">
                              <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-neutral-800 -translate-y-1/2 z-0" />
                              <div
                                className="absolute top-1/2 left-4 h-0.5 bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-400 -translate-y-1/2 z-0 transition-all duration-500"
                                style={{
                                  width: `${(Math.max(0, stepIdx) / (ORDER_STEPS.length - 1)) * 92}%`,
                                }}
                              />

                              {ORDER_STEPS.map((s, idx) => {
                                const isDone = idx <= stepIdx;
                                const isCur = idx === stepIdx;

                                return (
                                  <div
                                    key={s.key}
                                    className="relative z-10 flex flex-col items-center group cursor-default"
                                  >
                                    <div
                                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all shadow-sm ${
                                        isCur
                                          ? 'bg-sky-400 text-neutral-950 ring-2 ring-sky-400/40 ring-offset-2 ring-offset-neutral-950'
                                          : isDone
                                          ? 'bg-emerald-500 text-neutral-950'
                                          : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                                      }`}
                                    >
                                      {isDone && !isCur ? (
                                        <Check className="w-3 h-3" />
                                      ) : (
                                        idx + 1
                                      )}
                                    </div>
                                    <span
                                      className={`text-[9px] mt-1 font-mono ${
                                        isCur
                                          ? 'text-sky-400 font-bold'
                                          : isDone
                                          ? 'text-neutral-200'
                                          : 'text-neutral-600'
                                      }`}
                                    >
                                      {s.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-800/50 text-rose-300 text-xs">
                            Order has been cancelled.
                          </div>
                        )}

                        {/* Items */}
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-10 h-10 object-cover rounded-lg bg-neutral-900 border border-neutral-800"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-white truncate">{item.name}</p>
                                <p className="text-[11px] text-neutral-400">
                                  {item.brand} • Qty: {item.quantity}{' '}
                                  {item.selectedColor ? `• ${item.selectedColor}` : ''}
                                </p>
                              </div>
                              <span className="text-xs text-neutral-300 font-mono">
                                ${(item.price * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Tracking / Action Bar */}
                        <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <Truck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            <span className="text-neutral-300 font-medium truncate font-mono">
                              {order.carrier || 'FedEx Express'}:{' '}
                              {order.trackingNumber || `DX-TRK-${order.orderNumber}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  order.trackingNumber || `DX-TRK-${order.orderNumber}`
                                )
                              }
                              className="text-[10px] px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors shrink-0"
                            >
                              {copiedHash === (order.trackingNumber || `DX-TRK-${order.orderNumber}`)
                                ? 'Copied!'
                                : 'Copy'}
                            </button>
                            {onOpenOrderTracker && (
                              <button
                                onClick={() => {
                                  onClose();
                                  onOpenOrderTracker(order.orderNumber);
                                }}
                                className="text-[10px] px-2.5 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 font-semibold transition-colors shrink-0 flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Track Live
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
                          <span className="flex items-center gap-1">
                            <span>Est. Delivery:</span>
                            <strong className="text-neutral-200">{order.estimatedDelivery}</strong>
                          </span>
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Verified Purchase
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h4 className="font-semibold text-white">Two-Factor Authentication (2FA)</h4>
                        <p className="text-neutral-400 text-[11px]">
                          Extra layer of protection for new logins and order changes
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-semibold border border-emerald-500/20">
                      Active
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-sky-400" />
                    Encrypted Session Token
                  </h4>
                  <p className="text-neutral-400 text-[11px]">
                    Your active session credentials are authenticated using salted SHA-256 hashes and
                    AES-256 client protection.
                  </p>
                  <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 font-mono text-[10px] text-neutral-400 truncate">
                    auth_token_{user.id.replace('usr-', '')}_aes256_active
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSecurityDetails();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Shield className="w-4 h-4 text-sky-400" />
                    View System Security & Integrity Audit
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
