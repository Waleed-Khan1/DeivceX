import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Database,
  Shield,
  Search,
  Copy,
  Check,
  Download,
  RefreshCw,
  X,
  AlertTriangle,
  Lock,
  FileText,
  Key,
  ShieldCheck,
  Truck,
  Package,
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle2,
  Trash2,
  Save,
  Radio,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  getRawDatabaseDump,
  resetDatabaseToDefaults,
  DatabaseDump,
  formatCollectionAsPlainText,
  updateOrderStatus,
  deleteOrder,
  getStoreAnalytics,
  StoreAnalytics,
} from '../services/db';
import { Order } from '../types';

interface DatabaseViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type MainTab = 'orders' | 'plaintext' | 'analytics' | 'raw' | 'schema';

const STATUS_OPTIONS: Array<Order['status']> = [
  'Confirmed',
  'Processing',
  'In Transit',
  'Delivered',
  'Cancelled',
];

export const DatabaseViewerModal: React.FC<DatabaseViewerModalProps> = ({ isOpen, onClose }) => {
  const [dbDump, setDbDump] = useState<DatabaseDump | null>(null);
  const [analytics, setAnalytics] = useState<StoreAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState<MainTab>('orders');
  const [selectedCollectionIndex, setSelectedCollectionIndex] = useState(0);
  const [searchFilter, setSearchFilter] = useState('');
  const [copied, setCopied] = useState(false);
  const [isResetConfirm, setIsResetConfirm] = useState(false);
  const [statusSuccessMsg, setStatusSuccessMsg] = useState<string | null>(null);

  // Orders tab state
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [orderSearch, setOrderSearch] = useState('');
  const [editingOrder, setEditingOrder] = useState<{
    id: string;
    carrier: string;
    trackingNumber: string;
    ownerNotes: string;
  } | null>(null);

  const loadData = () => {
    const dump = getRawDatabaseDump();
    setDbDump(dump);
    setAnalytics(getStoreAnalytics());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setIsResetConfirm(false);
    }
  }, [isOpen]);

  // Listen for real-time order updates so table stays in sync
  useEffect(() => {
    const handleUpdate = () => {
      loadData();
    };
    window.addEventListener('devicex:order_status_updated', handleUpdate);
    return () => window.removeEventListener('devicex:order_status_updated', handleUpdate);
  }, []);

  if (!isOpen || !dbDump) return null;

  const currentCollection = dbDump.collections[selectedCollectionIndex] || dbDump.collections[0];

  // Get orders list from dbDump
  const ordersCollection = dbDump.collections.find(c => c.key === 'orders' || c.key === 'devicex_enc_orders');
  const allOrders: Order[] = Array.isArray(ordersCollection?.data) ? ordersCollection.data : [];

  // Filter orders
  const filteredOrders = allOrders.filter(o => {
    const matchesStatus = orderStatusFilter === 'ALL' || o.status === orderStatusFilter;
    const matchesSearch =
      !orderSearch ||
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(orderSearch.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPlainText = () => {
    const plainText = formatCollectionAsPlainText(currentCollection.key, currentCollection.data);
    const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devicex_${currentCollection.key}_report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAllJson = () => {
    const jsonStr = JSON.stringify(dbDump, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devicex_database_snapshot_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    resetDatabaseToDefaults();
    loadData();
    setIsResetConfirm(false);
  };

  const handleQuickStatusChange = (order: Order, newStatus: Order['status']) => {
    updateOrderStatus(order.id, newStatus);
    loadData();
    setStatusSuccessMsg(`Order #${order.orderNumber} updated to "${newStatus}". Customer view synced in real-time!`);
    setTimeout(() => setStatusSuccessMsg(null), 3500);
  };

  const handleSaveOrderDetails = (orderId: string) => {
    if (!editingOrder || editingOrder.id !== orderId) return;
    updateOrderStatus(
      orderId,
      undefined,
      editingOrder.carrier,
      editingOrder.trackingNumber,
      editingOrder.ownerNotes
    );
    loadData();
    setEditingOrder(null);
    setStatusSuccessMsg(`Tracking & owner notes updated and saved to encrypted database!`);
    setTimeout(() => setStatusSuccessMsg(null), 3500);
  };

  const handleDeleteOrder = (order: Order) => {
    if (window.confirm(`Are you sure you want to permanently delete order #${order.orderNumber}?`)) {
      deleteOrder(order.id);
      loadData();
    }
  };

  const schemas: { [key: string]: string } = {
    devicex_enc_users: `interface UserAccount {
  id: string;             // Unique identifier (e.g. usr-alex-chen-01)
  name: string;           // Customer legal/display name
  email: string;          // Verified email address
  role: 'customer' | 'owner'; // RBAC Authorization Level
  passwordHash: string;   // Cryptographically salted SHA-256 hash
  joinedDate: string;     // Membership issuance timestamp
  avatarUrl?: string;     // Profile visual asset
  twoFactorEnabled: boolean; // Hardware 2FA token active
  savedAddresses: Address[]; // Encrypted shipping profiles
}`,
    devicex_enc_orders: `interface Order {
  id: string;               // UUID internal reference
  orderNumber: string;      // DX-YYMMDD-XXXX customer invoice ID
  createdAt: string;        // ISO 8601 creation timestamp
  updatedAt?: string;       // ISO 8601 last status change timestamp
  userId?: string;          // Account foreign key reference
  customerEmail: string;    // Invoicing target
  customerName: string;     // Recipient
  items: OrderItem[];       // Line item snapshot
  subtotal: number;         // Pre-tax & shipping
  discount: number;         // Applied promotion or credit
  tax: number;              // Regional sales tax
  shipping: number;         // Express insured courier cost
  total: number;            // Final billed sum
  paymentMethod: string;    // card | apple_pay | google_pay | crypto
  paymentDetailsMasked: string; // Tokenized reference (•••• 4242)
  transactionHash: string;  // SHA-256 verifiable hash
  encryptionSignature: string; // Digital HMAC signature
  status: 'Confirmed' | 'Processing' | 'In Transit' | 'Delivered' | 'Cancelled';
  carrier?: string;         // e.g. FedEx Express, DHL, UPS
  trackingNumber?: string;  // e.g. DX-TRK-84920-US
  ownerNotes?: string;      // Confidential internal notes
}`,
  };

  // Plain text representation of the currently selected collection
  const plainTextOutput = formatCollectionAsPlainText(currentCollection.key, currentCollection.data);

  // Search filter applied to plain text output
  const filteredPlainText = searchFilter
    ? plainTextOutput
        .split('\n')
        .filter(line => line.toLowerCase().includes(searchFilter.toLowerCase()))
        .join('\n')
    : plainTextOutput;

  return (
    <div
      id="db-inspector-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
        className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden text-neutral-200"
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Store Owner Database & Operations Console
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-semibold border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Firebase Cloud Firestore
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono">
                Google Cloud Firestore (circular-factor-0vd6f) • Real-Time Cloud Synchronization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAllJson}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition-colors"
              title="Download entire database backup"
            >
              <Download className="w-3.5 h-3.5" />
              Backup JSON
            </button>
            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 transition-colors"
              title="Refresh database records"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
              id="close-db-inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Security & Cryptography Notification Banner */}
        <div className="px-4 py-2 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>High-Level Security: Storage Sealed with AES-256 GCM & Salted SHA-256 Signatures</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-neutral-400 font-mono">
            <span>Owner Access: <strong className="text-white font-semibold">Authorized Session</strong></span>
            <span className="hidden md:inline text-neutral-600">•</span>
            <span className="hidden md:inline">Mode: <strong className="text-amber-400">Plain Text (Zero JSON)</strong></span>
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 px-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'orders'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            Order Management & Status ({allOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('plaintext')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'plaintext'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Plain Text Database (No JSON)
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'analytics'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Store Analytics & Revenue
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'raw'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            Ciphertext Vault
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'schema'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            Schema Types
          </button>
        </div>

        {/* Real-time Feedback Toast */}
        {statusSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-4 mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{statusSuccessMsg}</span>
          </motion.div>
        )}

        {/* TAB 1: ORDER MANAGEMENT & STATUS CONTROL */}
        {activeTab === 'orders' && (
          <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
            {/* Filter and Search Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800">
              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[11px] text-neutral-400 font-mono mr-1">Status:</span>
                {['ALL', ...STATUS_OPTIONS].map(status => (
                  <button
                    key={status}
                    onClick={() => setOrderStatusFilter(status)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      orderStatusFilter === status
                        ? 'bg-amber-500 text-neutral-950 font-bold'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Order Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  placeholder="Search order #, customer, email..."
                  className="w-full pl-9 pr-3 py-1.5 bg-neutral-900 border border-neutral-700/60 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Orders List */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-16 text-neutral-400 space-y-2">
                  <Package className="w-10 h-10 mx-auto text-neutral-600 mb-2" />
                  <p className="text-sm font-semibold text-white">No orders matching filter</p>
                  <p className="text-xs text-neutral-500">
                    Try changing your search term or select "ALL" to view all customer orders.
                  </p>
                </div>
              ) : (
                filteredOrders.map(order => {
                  const isEditingThis = editingOrder?.id === order.id;

                  return (
                    <div
                      key={order.id}
                      className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700/80 transition-all space-y-3.5"
                    >
                      {/* Order Summary Header */}
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-800 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white text-sm">
                              Order #{order.orderNumber}
                            </span>
                            <span
                              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
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
                          <p className="text-xs text-neutral-400 mt-1">
                            Customer: <strong className="text-white">{order.customerName}</strong> ({order.customerEmail})
                          </p>
                          <p className="text-[11px] text-neutral-500 font-mono">
                            Placed on {new Date(order.createdAt).toLocaleString()} • UUID: {order.id}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-mono font-bold text-white block">
                            ${order.total.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-neutral-400 capitalize block">
                            {order.paymentMethod.replace('_', ' ')} ({order.paymentDetailsMasked})
                          </span>
                          <button
                            onClick={() => handleDeleteOrder(order)}
                            className="text-[10px] text-rose-400 hover:text-rose-300 mt-1 inline-flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Purge Order
                          </button>
                        </div>
                      </div>

                      {/* Interactive Status Changer (Owner Control) */}
                      <div className="p-3 rounded-lg bg-neutral-900/80 border border-neutral-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-white flex items-center gap-1.5 font-mono text-[11px]">
                            <Radio className="w-3.5 h-3.5 text-amber-400" />
                            Live Status Changer (Updates Customer Screen Instantly):
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            1-Click Database Write
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {STATUS_OPTIONS.map(status => {
                            const isCurrent = order.status === status;
                            return (
                              <button
                                key={status}
                                onClick={() => handleQuickStatusChange(order, status)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                  isCurrent
                                    ? 'bg-amber-400 text-neutral-950 font-bold shadow-md shadow-amber-400/20 ring-2 ring-amber-400/30'
                                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                                }`}
                              >
                                {isCurrent && <Check className="w-3.5 h-3.5" />}
                                {status}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Items and Destination */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {/* Items */}
                        <div className="p-3 rounded-lg bg-neutral-900/40 border border-neutral-800/80 space-y-2">
                          <span className="font-mono text-[10px] uppercase text-neutral-400 block font-semibold">
                            Ordered Items ({order.items.length})
                          </span>
                          <div className="space-y-1.5">
                            {order.items.map((item, i) => (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <span className="text-neutral-200 truncate max-w-[200px]">
                                  {item.quantity}x {item.name}
                                </span>
                                <span className="font-mono text-neutral-400">
                                  ${(item.price * item.quantity).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Destination & Tracking */}
                        <div className="p-3 rounded-lg bg-neutral-900/40 border border-neutral-800/80 space-y-2">
                          <span className="font-mono text-[10px] uppercase text-neutral-400 block font-semibold">
                            Courier Dispatch & Destination
                          </span>
                          <p className="text-neutral-300 text-[11px] leading-snug">
                            {order.shippingAddress ? (
                              <>
                                {order.shippingAddress.street}, {order.shippingAddress.city},{' '}
                                {order.shippingAddress.state} {order.shippingAddress.zip}
                              </>
                            ) : (
                              'Standard Express Delivery Address'
                            )}
                          </p>
                          <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-neutral-400 border-t border-neutral-800">
                            <span>
                              Carrier: <strong className="text-neutral-200">{order.carrier || 'FedEx'}</strong>
                            </span>
                            <span>
                              Track: <strong className="text-sky-400">{order.trackingNumber || `DX-TRK-${order.orderNumber}`}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Courier Tracking & Owner Notes Editor */}
                      {isEditingThis ? (
                        <div className="p-3 rounded-lg bg-neutral-900 border border-amber-500/40 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                                Courier / Carrier Name:
                              </label>
                              <input
                                type="text"
                                value={editingOrder.carrier}
                                onChange={e =>
                                  setEditingOrder({ ...editingOrder, carrier: e.target.value })
                                }
                                placeholder="e.g. FedEx Express, DHL, UPS"
                                className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg text-xs text-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                                Courier Tracking Code:
                              </label>
                              <input
                                type="text"
                                value={editingOrder.trackingNumber}
                                onChange={e =>
                                  setEditingOrder({ ...editingOrder, trackingNumber: e.target.value })
                                }
                                placeholder="e.g. DX-TRK-84920-US"
                                className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg text-xs text-white font-mono"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                              Internal Owner Notes (Confidential):
                            </label>
                            <textarea
                              rows={2}
                              value={editingOrder.ownerNotes}
                              onChange={e =>
                                setEditingOrder({ ...editingOrder, ownerNotes: e.target.value })
                              }
                              placeholder="e.g. Customer requested gift wrapping. Insurance verified."
                              className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg text-xs text-white"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingOrder(null)}
                              className="px-3 py-1 text-xs text-neutral-400 hover:text-white rounded-lg"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveOrderDetails(order.id)}
                              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg flex items-center gap-1"
                            >
                              <Save className="w-3.5 h-3.5" />
                              Save Details
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[11px] text-neutral-400">
                          <span>
                            {order.ownerNotes ? (
                              <span className="text-amber-300/80 font-mono">
                                Note: {order.ownerNotes}
                              </span>
                            ) : (
                              <span className="text-neutral-500">No internal owner notes</span>
                            )}
                          </span>
                          <button
                            onClick={() =>
                              setEditingOrder({
                                id: order.id,
                                carrier: order.carrier || 'FedEx Express',
                                trackingNumber:
                                  order.trackingNumber || `DX-TRK-${order.orderNumber}`,
                                ownerNotes: order.ownerNotes || '',
                              })
                            }
                            className="text-amber-400 hover:underline font-medium text-xs"
                          >
                            Edit Carrier, Tracking & Notes
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PLAIN TEXT DATABASE (NO JSON) */}
        {activeTab === 'plaintext' && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
            {/* Collections Sidebar */}
            <div className="md:col-span-4 border-r border-neutral-800 bg-neutral-950 p-3 space-y-2 overflow-y-auto">
              <span className="text-[10px] font-mono uppercase text-neutral-500 px-2 block font-semibold">
                Database Tables (Encrypted Storage)
              </span>

              {dbDump.collections.map((col, idx) => {
                const isSelected = selectedCollectionIndex === idx;
                return (
                  <button
                    key={col.key}
                    onClick={() => {
                      setSelectedCollectionIndex(idx);
                      setSearchFilter('');
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold'
                        : 'text-neutral-400 hover:bg-neutral-900 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="truncate">
                      <p className="truncate">{col.name}</p>
                      <p className="text-[10px] font-mono opacity-60 truncate">{col.key}</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
                      {col.recordCount}
                    </span>
                  </button>
                );
              })}

              <div className="pt-4 border-t border-neutral-800/80 px-2 space-y-2 text-[11px] text-neutral-400">
                <p className="font-semibold text-white">Database Information:</p>
                <p>
                  This view displays database records in <strong>clean human plain text</strong> without
                  JSON brackets, quotes, or formatting overhead.
                </p>
                <button
                  onClick={handleDownloadPlainText}
                  className="w-full py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .TXT Report
                </button>
              </div>
            </div>

            {/* Plain Text Main Viewer */}
            <div className="md:col-span-8 flex flex-col overflow-hidden bg-neutral-900/40">
              {/* Plain Text Toolbar */}
              <div className="p-3 border-b border-neutral-800 bg-neutral-950/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white font-mono">
                    {currentCollection.name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                    Plain Text Mode
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3 h-3 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={e => setSearchFilter(e.target.value)}
                      placeholder="Filter plain text..."
                      className="pl-7 pr-2.5 py-1 bg-neutral-900 border border-neutral-700/60 rounded-lg text-xs text-white placeholder-neutral-500 font-mono w-40 sm:w-56"
                    />
                  </div>
                  <button
                    onClick={() => handleCopy(filteredPlainText)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors text-xs flex items-center gap-1"
                    title="Copy plain text report to clipboard"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Plain Text Content Box */}
              <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-neutral-200">
                <pre className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-emerald-300 text-xs leading-relaxed whitespace-pre-wrap select-text font-mono">
                  {filteredPlainText || 'No records match search filter.'}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STORE ANALYTICS */}
        {activeTab === 'analytics' && analytics && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                <span className="text-[11px] font-mono text-neutral-400 uppercase">Gross Revenue</span>
                <span className="text-2xl font-bold font-mono text-emerald-400 block">
                  ${analytics.totalRevenue.toLocaleString()}
                </span>
                <span className="text-[10px] text-neutral-500">Excludes cancelled orders</span>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                <span className="text-[11px] font-mono text-neutral-400 uppercase">Total Orders</span>
                <span className="text-2xl font-bold font-mono text-white block">
                  {analytics.totalOrders}
                </span>
                <span className="text-[10px] text-neutral-500">Across all registered users</span>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                <span className="text-[11px] font-mono text-neutral-400 uppercase">Average Order Value</span>
                <span className="text-2xl font-bold font-mono text-sky-400 block">
                  ${analytics.averageOrderValue.toFixed(2)}
                </span>
                <span className="text-[10px] text-neutral-500">AOV per transaction</span>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                <span className="text-[11px] font-mono text-neutral-400 uppercase">Fulfillment Queue</span>
                <span className="text-2xl font-bold font-mono text-amber-400 block">
                  {analytics.pendingFulfillmentCount}
                </span>
                <span className="text-[10px] text-neutral-500">Confirmed & Processing</span>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="p-5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Order Status Distribution
              </h3>
              <div className="space-y-3">
                {Object.entries(analytics.ordersByStatus).map(([status, count]) => {
                  const numericCount = typeof count === 'number' ? count : Number(count) || 0;
                  const percent =
                    analytics.totalOrders > 0
                      ? Math.round((numericCount / analytics.totalOrders) * 100)
                      : 0;

                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-neutral-300 font-semibold">{status}</span>
                        <span className="text-neutral-400">
                          {numericCount} orders ({percent}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-neutral-900 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            status === 'Delivered'
                              ? 'bg-emerald-500'
                              : status === 'In Transit'
                              ? 'bg-sky-500'
                              : status === 'Processing'
                              ? 'bg-amber-500'
                              : status === 'Cancelled'
                              ? 'bg-rose-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: RAW CIPHERTEXT VAULT */}
        {activeTab === 'raw' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Lock className="w-4 h-4" />
                Raw Encrypted Ciphertext in Storage
              </div>
              <p className="text-neutral-400 text-xs">
                Shows the exact string stored in the browser's protected storage under key{' '}
                <code className="text-amber-300 bg-neutral-900 px-1 py-0.5 rounded">{currentCollection.key}</code>.
              </p>
            </div>
            <textarea
              readOnly
              rows={14}
              value={currentCollection.rawCiphertext || 'No raw data'}
              className="w-full p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-400 font-mono text-xs leading-relaxed select-all focus:outline-none"
            />
          </div>
        )}

        {/* TAB 5: SCHEMA TYPES */}
        {activeTab === 'schema' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300">
              <span className="font-bold text-white block mb-1">TypeScript Schema Definition</span>
              All records conform to strict TypeScript interfaces before cryptographic encryption.
            </div>
            <pre className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-sky-300 text-xs leading-relaxed overflow-x-auto whitespace-pre">
              {schemas[currentCollection.key] ||
                `// Generic schema for ${currentCollection.key}\ninterface Record {\n  id: string;\n  [key: string]: unknown;\n}`}
            </pre>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500 font-mono">
          <div className="flex items-center gap-2">
            <Key className="w-3.5 h-3.5 text-neutral-400" />
            <span>DeviceX Secure Owner Console • Real-Time Order Synchronization</span>
          </div>

          <div className="flex items-center gap-3">
            {isResetConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-rose-400 text-xs">Purge all records?</span>
                <button
                  onClick={handleReset}
                  className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors"
                >
                  Confirm Reset
                </button>
                <button
                  onClick={() => setIsResetConfirm(false)}
                  className="px-2.5 py-1 rounded bg-neutral-800 text-neutral-300 text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsResetConfirm(true)}
                className="text-neutral-500 hover:text-rose-400 transition-colors text-xs flex items-center gap-1"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Reset Database to Defaults
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
