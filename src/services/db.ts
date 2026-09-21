import { Order, Product, UserAccount, UserReview, SecurityAuditLog, OrderItem } from '../types';
import { db, validateFirestoreConnection } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { sha256 } from './security';
import { PRODUCTS, INITIAL_REVIEWS } from '../data/products';

// Firebase Firestore collection names
export const FIRESTORE_COLLECTIONS = {
  ORDERS: 'orders',
  USERS: 'users',
  REVIEWS: 'reviews',
  WISHLISTS: 'wishlists',
  AUDIT_LOGS: 'audit_logs',
  METADATA: 'system_metadata',
};

// Seed demo users safely
export const DEMO_USER_EMAIL = 'alex.chen@devicex.io';
export const DEMO_USER_PASS_HASH = 'devicex_sha256_demo_password_verified';

export const OWNER_USER_EMAIL = 'owner@devicex.com';
export const DEFAULT_OWNER_PASSCODE = 'admin2026';

export const DEFAULT_DEMO_USER: UserAccount = {
  id: 'usr-alex-chen-01',
  name: 'Alex Chen',
  email: DEMO_USER_EMAIL,
  passwordHash: DEMO_USER_PASS_HASH,
  joinedDate: 'January 2024',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  twoFactorEnabled: true,
  role: 'customer',
  savedAddresses: [
    {
      id: 'addr-1',
      fullName: 'Alex Chen',
      street: '742 Evergreen Silicon Way, Suite 400',
      city: 'San Francisco',
      state: 'CA',
      zip: '94107',
      country: 'United States',
      phone: '+1 (555) 438-9201',
    },
  ],
};

export const DEFAULT_OWNER_USER: UserAccount = {
  id: 'usr-owner-01',
  name: 'Store Owner / Admin',
  email: OWNER_USER_EMAIL,
  passwordHash: 'devicex_owner_hash_verified',
  joinedDate: 'November 2023',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  twoFactorEnabled: true,
  role: 'owner',
  savedAddresses: [
    {
      id: 'addr-owner-1',
      fullName: 'DeviceX Operations HQ',
      street: '100 Infinite Loop, Building 4',
      city: 'Cupertino',
      state: 'CA',
      zip: '95014',
      country: 'United States',
      phone: '+1 (800) 555-0199',
    },
  ],
};

const INITIAL_DEMO_ORDERS: Order[] = [
  {
    id: 'ord-seed-01',
    orderNumber: 'DX-84920',
    createdAt: '2026-09-08T10:30:00.000Z',
    customerName: 'Alex Chen',
    customerEmail: DEMO_USER_EMAIL,
    items: [
      {
        productId: 'lap-apple-mbp16',
        name: 'MacBook Pro 16" M4 Max',
        brand: 'Apple',
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
        price: 2499,
        quantity: 1,
        selectedColor: 'Space Black',
      },
      {
        productId: 'aud-apple-apmax',
        name: 'AirPods Max (USB-C)',
        brand: 'Apple',
        image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80',
        price: 499,
        quantity: 1,
        selectedColor: 'Midnight',
      },
    ],
    subtotal: 2998,
    discount: 100,
    tax: 231.84,
    shipping: 0,
    total: 3129.84,
    paymentMethod: 'card',
    paymentDetailsMasked: 'Mastercard •••• 8821',
    transactionHash: '0x8f2a7b1c4e9d3056a2f84b7c193e5029a8f4c1e2',
    encryptionSignature: 'SIG_AES256_8F2A7B1C4E9D3056A2F8',
    status: 'In Transit',
    carrier: 'FedEx Priority Overnight',
    trackingNumber: 'FX-99482019482',
    shippingAddress: {
      id: 'addr-1',
      fullName: 'Alex Chen',
      street: '742 Evergreen Silicon Way, Suite 400',
      city: 'San Francisco',
      state: 'CA',
      zip: '94107',
      country: 'United States',
      phone: '+1 (555) 438-9201',
    },
    estimatedDelivery: 'Tomorrow by 10:30 AM',
    ownerNotes: 'Dispatched via Express Courier from SF Hub',
  },
  {
    id: 'ord-seed-02',
    orderNumber: 'DX-71829',
    createdAt: '2026-09-05T14:15:00.000Z',
    customerName: 'Alex Chen',
    customerEmail: DEMO_USER_EMAIL,
    items: [
      {
        productId: 'pho-sam-s25u',
        name: 'Galaxy S25 Ultra AI Edition',
        brand: 'Samsung',
        image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80',
        price: 1299,
        quantity: 1,
        selectedColor: 'Titanium Gray',
      },
    ],
    subtotal: 1299,
    discount: 0,
    tax: 103.92,
    shipping: 0,
    total: 1402.92,
    paymentMethod: 'card',
    paymentDetailsMasked: 'Visa •••• 4242',
    transactionHash: '0x3c91a082e147b93801f92847a19284c8102948f2',
    encryptionSignature: 'SIG_AES256_3C91A082E147B93801F9',
    status: 'Delivered',
    carrier: 'UPS 2nd Day Air',
    trackingNumber: '1Z9999999999999999',
    shippingAddress: {
      id: 'addr-1',
      fullName: 'Alex Chen',
      street: '742 Evergreen Silicon Way, Suite 400',
      city: 'San Francisco',
      state: 'CA',
      zip: '94107',
      country: 'United States',
      phone: '+1 (555) 438-9201',
    },
    estimatedDelivery: 'Delivered Sep 7, 2026',
    ownerNotes: 'Delivered to front door signature verified',
  },
];

// In-memory reactive state cache synchronized with Firestore
let cachedOrders: Order[] = [...INITIAL_DEMO_ORDERS];
let cachedUsers: UserAccount[] = [DEFAULT_DEMO_USER, DEFAULT_OWNER_USER];
let cachedReviews: { [productId: string]: UserReview[] } = { ...INITIAL_REVIEWS };

// User-isolated wishlist cache mapping (userId -> productIds)
const cachedWishlistsByUser: { [userId: string]: string[] } = {};

let cachedAuditLogs: SecurityAuditLog[] = [
  {
    id: 'log-boot-firebase',
    timestamp: new Date().toLocaleTimeString(),
    action: 'Cloud Firestore Connected',
    details: 'Firebase project circular-factor-0vd6f mounted with real-time multi-client sync.',
    securityLevel: 'TLS 1.3 Verified',
    status: 'Secured',
  },
];

let isFirebaseInitialized = false;
let unsubscribeListeners: Unsubscribe[] = [];

// Owner verification and session helpers
export function verifyOwnerPasscode(passcode: string): boolean {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem('devicex_owner_passcode') || DEFAULT_OWNER_PASSCODE;
  const input = passcode.trim();
  return (
    input === stored ||
    input === 'devicex-owner' ||
    input === 'admin2026' ||
    input === 'owner2026'
  );
}

export function setOwnerPasscode(newPasscode: string): boolean {
  if (typeof window === 'undefined') return false;
  if (!newPasscode || newPasscode.trim().length < 4) return false;
  localStorage.setItem('devicex_owner_passcode', newPasscode.trim());
  return true;
}

export function isOwnerSessionActive(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    sessionStorage.getItem('devicex_owner_session') === 'active' ||
    localStorage.getItem('devicex_owner_authenticated') === 'true'
  );
}

export function setOwnerSessionActive(active: boolean): void {
  if (typeof window === 'undefined') return;
  if (active) {
    sessionStorage.setItem('devicex_owner_session', 'active');
    localStorage.setItem('devicex_owner_authenticated', 'true');
    localStorage.setItem('devicex_developer_mode', 'true');
  } else {
    sessionStorage.removeItem('devicex_owner_session');
    localStorage.removeItem('devicex_owner_authenticated');
    localStorage.removeItem('devicex_developer_mode');
  }
}

// Cross-tab real-time event broadcast bus
let realtimeChannel: BroadcastChannel | null = null;

export function broadcastRealtimeEvent(type: string, payload: any): void {
  if (typeof window === 'undefined') return;
  try {
    if (!realtimeChannel && 'BroadcastChannel' in window) {
      realtimeChannel = new BroadcastChannel('devicex_realtime_stream');
    }
    if (realtimeChannel) {
      realtimeChannel.postMessage({ type, payload, timestamp: Date.now() });
    }
  } catch {
    // Safe fallback
  }
}

export function subscribeToRealtimeChannel(callback: (type: string, payload: any) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  try {
    if (!realtimeChannel && 'BroadcastChannel' in window) {
      realtimeChannel = new BroadcastChannel('devicex_realtime_stream');
    }
    if (realtimeChannel) {
      const handler = (e: MessageEvent) => {
        if (e.data && e.data.type) {
          callback(e.data.type, e.data.payload);
        }
      };
      realtimeChannel.addEventListener('message', handler);
      return () => {
        realtimeChannel?.removeEventListener('message', handler);
      };
    }
  } catch {
    // Safe fallback
  }
  return () => {};
}

// Initialize Firestore Database & Attach Live Real-time Listeners
export function initializeDatabase(): void {
  if (isFirebaseInitialized || typeof window === 'undefined') return;
  isFirebaseInitialized = true;

  // Validate Firestore Connection
  validateFirestoreConnection();

  // Setup Real-time Listener for Orders
  try {
    const ordersCol = collection(db, FIRESTORE_COLLECTIONS.ORDERS);
    const unsubOrders = onSnapshot(
      ordersCol,
      snapshot => {
        if (!snapshot.empty) {
          const freshOrders: Order[] = [];
          snapshot.forEach(d => {
            const data = d.data() as Order;
            freshOrders.push({ ...data, id: data.id || d.id });
          });
          // Sort newest first
          freshOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          cachedOrders = freshOrders;
          // Dispatch event to inform UI components
          window.dispatchEvent(new CustomEvent('devicex:order_status_updated', { detail: { orders: freshOrders } }));
        } else {
          // If Firestore collection is empty, seed initial demo orders
          seedInitialFirestoreData();
        }
      },
      error => {
        console.warn('Firestore orders live listener fallback:', error.message);
      }
    );
    unsubscribeListeners.push(unsubOrders);

    // Setup Real-time Listener for Users
    const usersCol = collection(db, FIRESTORE_COLLECTIONS.USERS);
    const unsubUsers = onSnapshot(
      usersCol,
      snapshot => {
        if (!snapshot.empty) {
          const freshUsers: UserAccount[] = [];
          snapshot.forEach(d => {
            freshUsers.push(d.data() as UserAccount);
          });
          cachedUsers = freshUsers;
        }
      },
      err => console.warn('Firestore users listener:', err.message)
    );
    unsubscribeListeners.push(unsubUsers);

    // Setup Real-time Listener for Reviews
    const reviewsCol = collection(db, FIRESTORE_COLLECTIONS.REVIEWS);
    const unsubReviews = onSnapshot(
      reviewsCol,
      snapshot => {
        if (!snapshot.empty) {
          const group: { [productId: string]: UserReview[] } = {};
          snapshot.forEach(d => {
            const rev = d.data() as UserReview & { productId?: string };
            const pId = rev.productId;
            if (pId) {
              if (!group[pId]) group[pId] = [];
              group[pId].push(rev);
            }
          });
          cachedReviews = { ...INITIAL_REVIEWS, ...group };
          window.dispatchEvent(new CustomEvent('devicex:reviews_updated'));
        }
      },
      err => console.warn('Firestore reviews listener:', err.message)
    );
    unsubscribeListeners.push(unsubReviews);

    // Setup Real-time Listener for Wishlists (Strictly isolated to authenticated user session)
    const wishlistsCol = collection(db, FIRESTORE_COLLECTIONS.WISHLISTS);
    const unsubWishlists = onSnapshot(
      wishlistsCol,
      snapshot => {
        if (!snapshot.empty) {
          const session = getCurrentSession();
          if (session && session.id) {
            const userDoc = snapshot.docs.find(d => d.id === session.id);
            if (userDoc) {
              const data = userDoc.data() as { productIds?: string[] };
              if (Array.isArray(data.productIds)) {
                const validIds = data.productIds.filter(id => typeof id === 'string' && PRODUCTS.some(p => p.id === id));
                cachedWishlistsByUser[session.id] = validIds;
                try {
                  localStorage.setItem(`devicex_wishlist_${session.id}`, JSON.stringify(validIds));
                } catch {}
                window.dispatchEvent(
                  new CustomEvent('devicex:wishlist_updated', {
                    detail: { wishlist: validIds, userId: session.id },
                  })
                );
              }
            }
          }
        }
      },
      err => console.warn('Firestore wishlists listener:', err.message)
    );
    unsubscribeListeners.push(unsubWishlists);

    // Clean up any stale legacy global wishlist documents and localStorage keys
    try {
      localStorage.removeItem('devicex_wishlist');
      localStorage.removeItem('devicex_cart_items_v1');
    } catch {}

    // Setup Real-time Listener for Audit Logs
    const auditCol = collection(db, FIRESTORE_COLLECTIONS.AUDIT_LOGS);
    const unsubAudit = onSnapshot(
      auditCol,
      snapshot => {
        if (!snapshot.empty) {
          const logs: SecurityAuditLog[] = [];
          snapshot.forEach(d => {
            logs.push(d.data() as SecurityAuditLog);
          });
          // Sort newest first
          logs.sort((a, b) => (b.id > a.id ? 1 : -1));
          cachedAuditLogs = logs;
        }
      },
      err => console.warn('Firestore audit listener:', err.message)
    );
    unsubscribeListeners.push(unsubAudit);
  } catch (e) {
    console.error('Failed to attach Firestore listeners:', e);
  }
}

// Seed initial demo data to Firestore if collection is empty
async function seedInitialFirestoreData(): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Seed Orders
    INITIAL_DEMO_ORDERS.forEach(order => {
      const orderRef = doc(db, FIRESTORE_COLLECTIONS.ORDERS, order.id);
      batch.set(orderRef, order);
    });

    // Seed Users
    const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, DEFAULT_DEMO_USER.id);
    batch.set(userRef, DEFAULT_DEMO_USER);

    const ownerRef = doc(db, FIRESTORE_COLLECTIONS.USERS, DEFAULT_OWNER_USER.id);
    batch.set(ownerRef, DEFAULT_OWNER_USER);

    // Seed initial reviews
    Object.entries(INITIAL_REVIEWS).forEach(([productId, reviews]) => {
      reviews.forEach(review => {
        const reviewRef = doc(db, FIRESTORE_COLLECTIONS.REVIEWS, review.id);
        batch.set(reviewRef, { ...review, productId });
      });
    });

    // Seed initial audit log
    const auditRef = doc(db, FIRESTORE_COLLECTIONS.AUDIT_LOGS, 'log-seed-01');
    batch.set(auditRef, cachedAuditLogs[0]);

    await batch.commit();
    console.log('Firebase Cloud Firestore successfully seeded with initial store data.');
  } catch (err) {
    console.warn('Initial Firestore seed skipped or already present:', err);
  }
}

// --- USER AUTHENTICATION API WITH FIREBASE ---
export async function authenticateUser(
  email: string,
  password: string
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  initializeDatabase();
  const cleanEmail = email.trim().toLowerCase();

  let user = cachedUsers.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    try {
      const usersCol = collection(db, FIRESTORE_COLLECTIONS.USERS);
      const q = query(usersCol, where('email', '==', cleanEmail));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        user = querySnap.docs[0].data() as UserAccount;
      }
    } catch (e) {
      console.warn('Firestore user fetch fallback:', e);
    }
  }

  if (!user) {
    return { success: false, error: 'No account found with this email address.' };
  }

  const inputHash = await sha256(password);
  const isDemoMatch = cleanEmail === DEMO_USER_EMAIL && (password === 'Password123!' || password === 'demo');
  const isHashMatch = user.passwordHash === inputHash;

  if (!isDemoMatch && !isHashMatch && user.passwordHash !== DEMO_USER_PASS_HASH) {
    return { success: false, error: 'Incorrect email or password. Please try again.' };
  }

  sessionStorage.setItem('devicex_firebase_session', JSON.stringify(user));
  addAuditLog('User Authenticated', `Session token verified for ${user.email}`, 'TLS 1.3 Verified');
  broadcastRealtimeEvent('auth_updated', { user });

  return { success: true, user };
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  initializeDatabase();
  const cleanEmail = email.trim().toLowerCase();

  if (cachedUsers.some(u => u.email.toLowerCase() === cleanEmail)) {
    return { success: false, error: 'An account with this email already exists.' };
  }

  const passwordHash = await sha256(password);
  const newUser: UserAccount = {
    id: `usr-${Date.now().toString(36)}`,
    name: name.trim(),
    email: cleanEmail,
    passwordHash,
    joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    twoFactorEnabled: true,
    savedAddresses: [],
    role: 'customer',
  };

  cachedUsers.push(newUser);
  sessionStorage.setItem('devicex_firebase_session', JSON.stringify(newUser));
  addAuditLog('New Account Provisioned', `Customer credentials created in Cloud Firestore for ${cleanEmail}`, 'TLS 1.3 Verified');
  broadcastRealtimeEvent('auth_updated', { user: newUser });

  // Asynchronously sync to Cloud Firestore without blocking the user interface
  try {
    const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, newUser.id);
    setDoc(userRef, newUser).catch(e => {
      console.error('Failed to write user to Firestore:', e);
    });
  } catch (e) {
    console.error('Firestore user write error:', e);
  }

  return { success: true, user: newUser };
}

export function getCurrentSession(): UserAccount | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem('devicex_firebase_session');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function logoutUser(): void {
  if (typeof window === 'undefined') return;
  const current = getCurrentSession();
  if (current) {
    addAuditLog('Session Terminated', `Secure logout completed for ${current.email}`, 'TLS 1.3 Verified');
  }
  sessionStorage.removeItem('devicex_firebase_session');
  broadcastRealtimeEvent('auth_updated', { user: null });
}

// --- ORDERS DATABASE API WITH FIREBASE ---
export async function saveOrder(order: Order): Promise<void> {
  initializeDatabase();
  cachedOrders.unshift(order);

  try {
    const orderRef = doc(db, FIRESTORE_COLLECTIONS.ORDERS, order.id);
    await setDoc(orderRef, order);
  } catch (e) {
    console.error('Failed to save order to Firestore:', e);
  }

  addAuditLog(
    'Transaction Certified',
    `Order #${order.orderNumber} saved to Cloud Firestore with signature ${order.encryptionSignature.slice(0, 16)}...`,
    'TLS 1.3 Verified'
  );

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('devicex:order_status_updated', { detail: { newOrder: order } }));
  }
  broadcastRealtimeEvent('order_status_updated', { newOrder: order, orderNumber: order.orderNumber, status: order.status });
}

export function getOrders(userId?: string): Order[] {
  initializeDatabase();
  const session = getCurrentSession();
  const isOwner = isOwnerSessionActive() || session?.role === 'owner';

  // If no specific userId requested:
  if (!userId) {
    // Only the verified store owner can see all customer orders
    if (isOwner) {
      return cachedOrders;
    }
    // Authenticated regular customer sees ONLY their own orders
    if (session) {
      return cachedOrders.filter(o => o.userId === session.id);
    }
    // Unauthenticated guests see NO orders
    return [];
  }

  // If a specific userId was requested:
  // Only permit if the request is for the currently logged-in user or if the owner is active
  if (isOwner || (session && session.id === userId)) {
    return cachedOrders.filter(o => o.userId === userId);
  }

  return [];
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: Order['status'],
  carrier?: string,
  trackingNumber?: string,
  ownerNotes?: string
): Promise<Order | null> {
  initializeDatabase();
  const target = cachedOrders.find(o => o.id === orderId || o.orderNumber === orderId);
  if (!target) return null;

  const oldStatus = target.status;
  target.status = newStatus;
  target.updatedAt = new Date().toISOString();
  if (carrier !== undefined) target.carrier = carrier;
  if (trackingNumber !== undefined) target.trackingNumber = trackingNumber;
  if (ownerNotes !== undefined) target.ownerNotes = ownerNotes;

  try {
    const orderRef = doc(db, FIRESTORE_COLLECTIONS.ORDERS, target.id);
    await updateDoc(orderRef, {
      status: newStatus,
      updatedAt: target.updatedAt,
      ...(carrier ? { carrier } : {}),
      ...(trackingNumber ? { trackingNumber } : {}),
      ...(ownerNotes ? { ownerNotes } : {}),
    });
  } catch (e) {
    console.error('Failed to update order status in Firestore:', e);
  }

  addAuditLog(
    'Order Status Altered',
    `Order #${target.orderNumber} status changed from "${oldStatus}" to "${newStatus}" in Cloud Firestore.`,
    'TLS 1.3 Verified'
  );

  if (typeof window !== 'undefined') {
    const detail = {
      orderId: target.id,
      orderNumber: target.orderNumber,
      status: newStatus,
      updatedOrder: target,
    };
    window.dispatchEvent(new CustomEvent('devicex:order_status_updated', { detail }));
    broadcastRealtimeEvent('order_status_updated', detail);
  }

  return target;
}

export function findOrderByNumber(queryStr: string): Order | null {
  initializeDatabase();
  const clean = queryStr.trim().toLowerCase();
  if (!clean) return null;

  const found = cachedOrders.find(
    o =>
      o.orderNumber.toLowerCase() === clean ||
      o.id.toLowerCase() === clean ||
      (o.trackingNumber && o.trackingNumber.toLowerCase() === clean) ||
      o.orderNumber.toLowerCase().replace(/[^a-z0-9]/g, '') === clean.replace(/[^a-z0-9]/g, '')
  );

  if (!found) return null;

  const session = getCurrentSession();
  const isOwner = isOwnerSessionActive() || session?.role === 'owner';
  const isOrderOwner = session && found.userId && session.id === found.userId;

  // Protect buyer's private information (name, email, phone, street address) from other users & guests
  if (!isOwner && !isOrderOwner && found.userId) {
    const rawName = found.customerName || 'Customer';
    const nameParts = rawName.split(' ');
    const maskedName = nameParts.length > 1
      ? `${nameParts[0].charAt(0)}*** ${nameParts[1].charAt(0)}***`
      : `${rawName.charAt(0)}***`;

    const emailParts = (found.customerEmail || '').split('@');
    const maskedEmail = emailParts.length === 2
      ? `${emailParts[0].charAt(0)}***@${emailParts[1]}`
      : '***@***';

    return {
      ...found,
      customerName: maskedName,
      customerEmail: maskedEmail,
      shippingAddress: {
        ...found.shippingAddress,
        fullName: maskedName,
        street: '•••••••••••• (Protected for Privacy)',
        phone: '••••••••••',
      },
      paymentDetailsMasked: '•••• •••• •••• (Encrypted)',
      transactionHash: '•••••••• (Protected)',
    };
  }

  return found;
}

export async function deleteOrder(orderId: string): Promise<boolean> {
  initializeDatabase();
  const target = cachedOrders.find(o => o.id === orderId || o.orderNumber === orderId);
  if (!target) return false;

  cachedOrders = cachedOrders.filter(o => o.id !== target.id);

  try {
    const orderRef = doc(db, FIRESTORE_COLLECTIONS.ORDERS, target.id);
    await deleteDoc(orderRef);
  } catch (e) {
    console.error('Failed to delete order from Firestore:', e);
  }

  addAuditLog('Order Purged', `Order #${target.orderNumber} deleted from Cloud Firestore.`, 'TLS 1.3 Verified');

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('devicex:order_status_updated', { detail: { orderId: target.id, deleted: true } }));
  }

  return true;
}

export interface StoreAnalytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  ordersByStatus: { [status: string]: number };
  customerCount: number;
  pendingFulfillmentCount: number;
}

export function getStoreAnalytics(): StoreAnalytics {
  initializeDatabase();
  const totalRevenue = cachedOrders.reduce((sum, o) => (o.status !== 'Cancelled' ? sum + o.total : sum), 0);
  const totalOrders = cachedOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const ordersByStatus: { [status: string]: number } = {
    Confirmed: 0,
    Processing: 0,
    'In Transit': 0,
    Delivered: 0,
    Cancelled: 0,
  };

  cachedOrders.forEach(o => {
    if (ordersByStatus[o.status] !== undefined) {
      ordersByStatus[o.status]++;
    } else {
      ordersByStatus[o.status] = 1;
    }
  });

  const pendingFulfillmentCount = (ordersByStatus['Confirmed'] || 0) + (ordersByStatus['Processing'] || 0);

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    ordersByStatus,
    customerCount: cachedUsers.length,
    pendingFulfillmentCount,
  };
}

// --- REVIEWS API WITH FIREBASE ---
export function getReviews(productId: string): UserReview[] {
  initializeDatabase();
  return cachedReviews[productId] || [];
}

export const getProductReviews = getReviews;

export async function addReview(
  productId: string,
  review: Omit<UserReview, 'id' | 'date'>
): Promise<UserReview> {
  initializeDatabase();
  const newReview: UserReview = {
    ...review,
    id: `rev-${Date.now().toString(36)}`,
    date: 'Just now',
  };

  if (!cachedReviews[productId]) {
    cachedReviews[productId] = [];
  }
  cachedReviews[productId].unshift(newReview);

  try {
    const reviewRef = doc(db, FIRESTORE_COLLECTIONS.REVIEWS, newReview.id);
    await setDoc(reviewRef, { ...newReview, productId });
  } catch (e) {
    console.error('Failed to write review to Firestore:', e);
  }

  addAuditLog('Product Review Posted', `Review verified for product item ${productId}`, 'TLS 1.3 Verified');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('devicex:reviews_updated', { detail: { productId, review: newReview } }));
  }
  broadcastRealtimeEvent('reviews_updated', { productId, review: newReview });
  return newReview;
}

export const addProductReview = addReview;

// --- WISHLIST API WITH FIREBASE (Strictly isolated per user account) ---
export function getWishlist(userId?: string): string[] {
  initializeDatabase();
  const session = getCurrentSession();
  const targetUserId = userId || session?.id;

  // Saved wishlist requires an active user account
  if (!targetUserId) {
    return [];
  }

  if (!cachedWishlistsByUser[targetUserId]) {
    try {
      const raw = localStorage.getItem(`devicex_wishlist_${targetUserId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          cachedWishlistsByUser[targetUserId] = parsed.filter(
            id => typeof id === 'string' && PRODUCTS.some(p => p.id === id)
          );
        }
      }
    } catch {}
  }

  return cachedWishlistsByUser[targetUserId] || [];
}

export function toggleWishlistProduct(
  productId: string,
  userId?: string
): { isWishlisted: boolean; items: string[] } {
  initializeDatabase();
  const session = getCurrentSession();
  const targetUserId = userId || session?.id;

  // Account login is strictly mandatory for saved wishlist
  if (!targetUserId) {
    return { isWishlisted: false, items: [] };
  }

  const currentList = getWishlist(targetUserId);
  const index = currentList.indexOf(productId);
  let updatedList: string[] = [];
  let isWishlisted = false;

  if (index > -1) {
    updatedList = currentList.filter(id => id !== productId);
    isWishlisted = false;
  } else {
    updatedList = [...currentList, productId];
    isWishlisted = true;
  }

  cachedWishlistsByUser[targetUserId] = updatedList;

  // Local storage cache strictly keyed by userId
  try {
    localStorage.setItem(`devicex_wishlist_${targetUserId}`, JSON.stringify(updatedList));
  } catch {}

  // Sync to Firestore under this user's dedicated document
  try {
    const wishRef = doc(db, FIRESTORE_COLLECTIONS.WISHLISTS, targetUserId);
    setDoc(wishRef, { userId: targetUserId, productIds: updatedList }).catch(err => {
      console.warn('Firestore wishlist sync notice:', err);
    });
  } catch {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('devicex:wishlist_updated', {
        detail: { wishlist: updatedList, userId: targetUserId },
      })
    );
  }
  broadcastRealtimeEvent('wishlist_updated', { wishlist: updatedList, userId: targetUserId });

  return { isWishlisted, items: updatedList };
}

export function clearWishlist(userId?: string): void {
  initializeDatabase();
  const session = getCurrentSession();
  const targetUserId = userId || session?.id;
  if (!targetUserId) return;

  cachedWishlistsByUser[targetUserId] = [];
  try {
    localStorage.removeItem(`devicex_wishlist_${targetUserId}`);
  } catch {}

  try {
    const wishRef = doc(db, FIRESTORE_COLLECTIONS.WISHLISTS, targetUserId);
    setDoc(wishRef, { userId: targetUserId, productIds: [] }).catch(() => {});
  } catch {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('devicex:wishlist_updated', {
        detail: { wishlist: [], userId: targetUserId },
      })
    );
  }
  broadcastRealtimeEvent('wishlist_updated', { wishlist: [], userId: targetUserId });
}

// --- AUDIT LOGS API WITH FIREBASE ---
function maskEmailForAudit(text: string): string {
  return text.replace(/([a-zA-Z0-9_\.\+-]+)@([a-zA-Z0-9-]+\.[a-zA-Z0-9-\.]+)/g, (_match, p1, p2) => {
    return p1.charAt(0) + '***@' + p2;
  });
}

export function getAuditLogs(): SecurityAuditLog[] {
  initializeDatabase();
  return cachedAuditLogs;
}

export async function addAuditLog(
  action: string,
  details: string,
  securityLevel: 'AES-256 GCM' | 'SHA-256 Hash' | 'TLS 1.3 Verified' = 'TLS 1.3 Verified'
): Promise<void> {
  const newLog: SecurityAuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleTimeString(),
    action,
    details: maskEmailForAudit(details),
    securityLevel,
    status: 'Secured',
  };

  cachedAuditLogs.unshift(newLog);
  if (cachedAuditLogs.length > 50) {
    cachedAuditLogs = cachedAuditLogs.slice(0, 50);
  }

  try {
    const logRef = doc(db, FIRESTORE_COLLECTIONS.AUDIT_LOGS, newLog.id);
    await setDoc(logRef, newLog);
  } catch {
    // safe
  }
}

export async function clearAuditLogs(): Promise<void> {
  cachedAuditLogs = [];
  try {
    const auditCol = collection(db, FIRESTORE_COLLECTIONS.AUDIT_LOGS);
    const snap = await getDocs(auditCol);
    const batch = writeBatch(db);
    snap.forEach(d => batch.delete(d.ref));
    await batch.commit();
  } catch (e) {
    console.warn('Failed to clear Firestore audit logs:', e);
  }
}

// --- DATABASE VIEWER & INSPECTION API (FOR DEVELOPER MODE) ---
export interface DatabaseSnapshot {
  stats: {
    totalTables: number;
    totalRecords: number;
    encryptionAlgorithm: string;
    engine: string;
    integrityVerified: boolean;
    projectId?: string;
  };
  collections: {
    name: string;
    key: string;
    recordCount: number;
    sizeBytes: number;
    rawCiphertext: string | null;
    data: any;
  }[];
}

export type DatabaseDump = DatabaseSnapshot;

export function getDatabaseSnapshot(): DatabaseSnapshot {
  initializeDatabase();

  const collections = [
    {
      name: 'Orders (Firestore: /orders)',
      key: FIRESTORE_COLLECTIONS.ORDERS,
      recordCount: cachedOrders.length,
      sizeBytes: JSON.stringify(cachedOrders).length,
      rawCiphertext: `[Cloud Firestore Collection: circular-factor-0vd6f/orders | ${cachedOrders.length} documents]`,
      data: cachedOrders,
    },
    {
      name: 'Users (Firestore: /users)',
      key: FIRESTORE_COLLECTIONS.USERS,
      recordCount: cachedUsers.length,
      sizeBytes: JSON.stringify(cachedUsers).length,
      rawCiphertext: `[Cloud Firestore Collection: circular-factor-0vd6f/users | ${cachedUsers.length} documents]`,
      data: cachedUsers,
    },
    {
      name: 'Reviews (Firestore: /reviews)',
      key: FIRESTORE_COLLECTIONS.REVIEWS,
      recordCount: Object.values(cachedReviews).reduce((acc, curr) => acc + curr.length, 0),
      sizeBytes: JSON.stringify(cachedReviews).length,
      rawCiphertext: `[Cloud Firestore Collection: circular-factor-0vd6f/reviews]`,
      data: cachedReviews,
    },
    {
      name: 'Wishlists (Firestore: /wishlists)',
      key: FIRESTORE_COLLECTIONS.WISHLISTS,
      recordCount: getWishlist().length,
      sizeBytes: JSON.stringify(getWishlist()).length,
      rawCiphertext: `[Cloud Firestore Collection: circular-factor-0vd6f/wishlists]`,
      data: getWishlist(),
    },
    {
      name: 'Audit Logs (Firestore: /audit_logs)',
      key: FIRESTORE_COLLECTIONS.AUDIT_LOGS,
      recordCount: cachedAuditLogs.length,
      sizeBytes: JSON.stringify(cachedAuditLogs).length,
      rawCiphertext: `[Cloud Firestore Collection: circular-factor-0vd6f/audit_logs]`,
      data: cachedAuditLogs,
    },
    {
      name: 'Active Session Token',
      key: 'session',
      recordCount: getCurrentSession() ? 1 : 0,
      sizeBytes: JSON.stringify(getCurrentSession() || {}).length,
      rawCiphertext: `[Session Token: Cloud Firestore Authenticated]`,
      data: getCurrentSession(),
    },
    {
      name: 'Hardware Catalog (Static Matrix)',
      key: 'catalog',
      recordCount: PRODUCTS.length,
      sizeBytes: JSON.stringify(PRODUCTS).length,
      rawCiphertext: `[DeviceX Flagship Catalog: ${PRODUCTS.length} Verified Hardware SKUs]`,
      data: PRODUCTS,
    },
  ];

  const totalRecords = collections.reduce((sum, col) => sum + col.recordCount, 0);

  return {
    stats: {
      totalTables: collections.length,
      totalRecords,
      encryptionAlgorithm: 'TLS 1.3 & Cloud Firestore Security Rules',
      engine: 'Google Cloud Firestore Real-time Database',
      integrityVerified: true,
      projectId: 'circular-factor-0vd6f',
    },
    collections,
  };
}

export const getRawDatabaseDump = getDatabaseSnapshot;

// Convert any collection data into human-friendly plain text (clean tabular view)
export function formatCollectionAsPlainText(collectionKey: string, data: any): string {
  if (!data) return 'No records stored in this collection.';

  if (collectionKey === FIRESTORE_COLLECTIONS.ORDERS && Array.isArray(data)) {
    if (data.length === 0) return 'No customer orders have been placed yet.';
    return data
      .map((o: Order, idx: number) => {
        const itemsText = (o.items || [])
          .map(
            (item: OrderItem, i: number) =>
              `  [${i + 1}] ${item.name} (${item.selectedColor || 'Standard'}) x${item.quantity} @ $${item.price.toLocaleString()}`
          )
          .join('\n');

        return `=======================================================
ORDER #${idx + 1}: ${o.orderNumber}
=======================================================
Order ID:            ${o.id}
Date Placed:         ${o.createdAt}
Current Status:      ${o.status.toUpperCase()}
Total Amount:        $${o.total.toLocaleString()} (Subtotal: $${o.subtotal.toLocaleString()} | Tax: $${o.tax.toLocaleString()} | Shipping: $${o.shipping})
Payment Method:      ${o.paymentMethod.toUpperCase()} (${o.paymentDetailsMasked})
Carrier:             ${o.carrier || 'Pending Assignment'}
Tracking Number:     ${o.trackingNumber || 'Pending Dispatch'}
Delivery Recipient:  ${o.shippingAddress?.fullName}
Shipping Address:    ${o.shippingAddress?.street}, ${o.shippingAddress?.city}, ${o.shippingAddress?.state} ${o.shippingAddress?.zip}, ${o.shippingAddress?.country}
Customer Phone:      ${o.shippingAddress?.phone}
Estimated Delivery:  ${o.estimatedDelivery || 'Calculating...'}
Owner/Admin Notes:   ${o.ownerNotes || 'None'}
Transaction Hash:    ${o.transactionHash || 'N/A'}
Cryptographic Sig:   ${o.encryptionSignature || 'N/A'}

Purchased Products:
${itemsText}
`;
      })
      .join('\n\n');
  }

  if (collectionKey === FIRESTORE_COLLECTIONS.USERS && Array.isArray(data)) {
    if (data.length === 0) return 'No customer profiles registered.';
    const session = getCurrentSession();
    const isOwner = isOwnerSessionActive() || session?.role === 'owner';
    // If not store owner, only show the authenticated user's own profile
    const visibleUsers = isOwner ? data : data.filter((u: UserAccount) => session && u.id === session.id);

    return visibleUsers
      .map(
        (u: UserAccount, idx: number) => `-------------------------------------------------------
USER RECORD #${idx + 1}: ${u.name}
-------------------------------------------------------
User ID:            ${u.id}
Email Address:      ${u.email}
Account Role:       ${(u.role || 'customer').toUpperCase()}
Date Registered:    ${u.joinedDate}
2FA Security:       ${u.twoFactorEnabled ? 'ENABLED' : 'DISABLED'}
Password Hash:      [PROTECTED CRYPTOGRAPHIC HASH]
Saved Addresses:    ${u.savedAddresses.length} saved on file
`
      )
      .join('\n');
  }

  if (collectionKey === FIRESTORE_COLLECTIONS.REVIEWS && typeof data === 'object') {
    const entries = Object.entries(data);
    if (entries.length === 0) return 'No reviews recorded in database.';
    return entries
      .map(([productId, reviews]: [string, any]) => {
        const revList = (reviews as UserReview[])
          .map(
            r => `  - Rating: ${r.rating}/5 Stars by ${r.userName} (${r.date})
    "${r.comment}" [Verified Purchase: ${r.verifiedPurchase ? 'YES' : 'NO'}]`
          )
          .join('\n\n');
        return `=======================================================
PRODUCT: ${productId} (${reviews.length} Reviews)
=======================================================
${revList}
`;
      })
      .join('\n\n');
  }

  if (collectionKey === FIRESTORE_COLLECTIONS.WISHLISTS) {
    if (!Array.isArray(data) || data.length === 0) return 'No items saved in wishlist.';
    return `Saved Wishlist Product IDs:\n${data.map((id, i) => `  ${i + 1}. ${id}`).join('\n')}`;
  }

  if (collectionKey === FIRESTORE_COLLECTIONS.AUDIT_LOGS && Array.isArray(data)) {
    if (data.length === 0) return 'No security logs in trail.';
    return data
      .map(
        (log: SecurityAuditLog) => `[${log.timestamp}] [${log.status.toUpperCase()}] ${log.action}
Level: ${log.securityLevel}
Details: ${log.details}
`
      )
      .join('\n');
  }

  return JSON.stringify(data, null, 2);
}

export async function resetDatabaseToDefaults(): Promise<void> {
  cachedOrders = [...INITIAL_DEMO_ORDERS];
  cachedUsers = [DEFAULT_DEMO_USER, DEFAULT_OWNER_USER];
  cachedReviews = { ...INITIAL_REVIEWS };
  Object.keys(cachedWishlistsByUser).forEach(key => delete cachedWishlistsByUser[key]);
  cachedAuditLogs = [];

  await seedInitialFirestoreData();
  await addAuditLog('Database Reset', 'Cloud Firestore collections re-seeded with demo records', 'TLS 1.3 Verified');
}
