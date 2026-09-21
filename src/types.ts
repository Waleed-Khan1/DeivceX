export type CategoryType =
  | 'all'
  | 'laptops'
  | 'mobiles'
  | 'speakers'
  | 'audio'
  | 'wearables'
  | 'accessories';

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: CategoryType;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  additionalImages?: string[];
  specs: { [key: string]: string };
  highlights: string[];
  description: string;
  inStock: boolean;
  stockCount: number;
  isNew?: boolean;
  isFeatured?: boolean;
  colors?: { name: string; hex: string }[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
}

export interface Address {
  id: string;
  fullName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  quantity: number;
  selectedColor?: string;
}

export type PaymentMethodType = 'card' | 'apple_pay' | 'google_pay' | 'paypal' | 'crypto';

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  updatedAt?: string;
  userId?: string;
  customerEmail: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  paymentMethod: PaymentMethodType;
  paymentDetailsMasked: string;
  transactionHash: string;
  encryptionSignature: string;
  status: 'Confirmed' | 'Processing' | 'In Transit' | 'Delivered' | 'Cancelled';
  shippingAddress: Address;
  estimatedDelivery: string;
  carrier?: string;
  trackingNumber?: string;
  ownerNotes?: string;
}

export interface UserReview {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  verifiedPurchase: boolean;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  securityLevel: 'AES-256 GCM' | 'SHA-256 Hash' | 'TLS 1.3 Verified';
  status: 'Secured' | 'Passed';
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  joinedDate: string;
  avatarUrl?: string;
  twoFactorEnabled: boolean;
  savedAddresses: Address[];
  role?: 'customer' | 'owner';
}
