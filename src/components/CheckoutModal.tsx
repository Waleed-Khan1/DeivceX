import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  CreditCard,
  ShieldCheck,
  Lock,
  CheckCircle,
  Truck,
  X,
  ArrowRight,
  Printer,
  Copy,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { CartItem, Order, PaymentMethodType, UserAccount } from '../types';
import {
  validateLuhn,
  maskCardNumber,
  formatCardInput,
  formatExpiryInput,
  generateTransactionHash,
  generateEncryptionSignature,
} from '../services/security';
import { saveOrder } from '../services/db';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  user: UserAccount | null;
  onOrderSuccess: (order: Order) => void;
  onTrackOrder?: (orderNumber: string) => void;
  onRequireLogin?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  subtotal,
  discount,
  shipping,
  tax,
  total,
  user,
  onOrderSuccess,
  onTrackOrder,
  onRequireLogin,
}) => {
  const [step, setStep] = useState<'details' | 'payment' | 'processing' | 'success'>('details');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('card');

  // Shipping details state
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [street, setStreet] = useState(user?.savedAddresses[0]?.street || '');
  const [city, setCity] = useState(user?.savedAddresses[0]?.city || '');
  const [stateVal, setStateVal] = useState(user?.savedAddresses[0]?.state || '');
  const [zip, setZip] = useState(user?.savedAddresses[0]?.zip || '');
  const [phone, setPhone] = useState(user?.savedAddresses[0]?.phone || '');

  // Card details state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(user?.name || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardError, setCardError] = useState('');

  // Confirmed order state
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  if (!isOpen) return null;

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !street || !city || !zip) return;
    setStep('payment');
  };

  const handleProcessPayment = async () => {
    setCardError('');

    if (paymentMethod === 'card') {
      const cleanCard = cardNumber.replace(/\s+/g, '');
      if (cleanCard.length < 15) {
        setCardError('Please enter a valid 16-digit card number.');
        return;
      }
      if (!validateLuhn(cleanCard)) {
        setCardError('Invalid card checksum detected. Please verify your card number.');
        return;
      }
      if (cardExpiry.length < 5) {
        setCardError('Please enter card expiry date (MM/YY).');
        return;
      }
      if (cardCvv.length < 3) {
        setCardError('Please enter security CVV code.');
        return;
      }
    }

    setStep('processing');

    // Simulate cryptographic end-to-end handshake & ledger signing
    setTimeout(async () => {
      const orderId = `DX-${Date.now().toString().slice(-6)}`;
      const masked = paymentMethod === 'card' ? maskCardNumber(cardNumber) : `${paymentMethod.toUpperCase()} Token Verified`;
      const transactionHash = await generateTransactionHash(orderId, total, email);
      const encryptionSignature = await generateEncryptionSignature(orderId);

      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        orderNumber: orderId,
        createdAt: new Date().toISOString(),
        userId: user?.id,
        customerEmail: email,
        customerName: fullName,
        items: items.map(it => ({
          productId: it.product.id,
          name: it.product.name,
          brand: it.product.brand,
          image: it.product.image,
          price: it.product.price,
          quantity: it.quantity,
          selectedColor: it.selectedColor,
        })),
        subtotal,
        discount,
        tax,
        shipping,
        total,
        paymentMethod,
        paymentDetailsMasked: masked,
        transactionHash,
        encryptionSignature,
        status: 'Confirmed',
        shippingAddress: {
          id: `addr-${Date.now()}`,
          fullName,
          street,
          city,
          state: stateVal,
          zip,
          country: 'United States',
          phone,
        },
        estimatedDelivery: '3 - 5 Business Days (Express Insured)',
      };

      saveOrder(newOrder);
      setConfirmedOrder(newOrder);
      setStep('success');
      onOrderSuccess(newOrder);

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Safe fallback
      }
    }, 1800);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div
        id="checkout-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md"
        onClick={step === 'processing' ? undefined : onClose}
      >
        <motion.div
          id="checkout-modal-content"
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl text-neutral-100 max-h-[92vh] flex flex-col"
        >
          {/* Top Bar */}
          <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-neutral-700 flex items-center justify-center text-white">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  DeviceX Checkout
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                    Safe Checkout
                  </span>
                </h3>
                <p className="text-[11px] text-neutral-400">Order Total: ${total.toLocaleString()} • Free Express Delivery</p>
              </div>
            </div>

            {step !== 'processing' && (
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
                id="close-checkout-modal-btn"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Auth Gate for checkout if user is not signed in */}
          {!user ? (
            <div className="p-6 sm:p-10 text-center space-y-4 my-auto flex-1 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-neutral-800/90 border border-neutral-700 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/5">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-white">Sign In Required to Complete Order</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Browsing and exploring our catalog is open to everyone. However, to complete an order, activate manufacturer warranties, and receive verified tracking updates, customer login is mandatory.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRequireLogin?.();
                  }}
                  id="checkout-login-action-btn"
                  className="w-full px-5 py-2.5 rounded-xl bg-white text-neutral-950 font-bold text-xs hover:bg-neutral-100 transition-all shadow-md btn-3d btn-glow-white cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Sign In / Register
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold border border-neutral-700 transition-colors btn-3d cursor-pointer"
                >
                  Continue Browsing
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Stepper indicator */}
              {step !== 'success' && step !== 'processing' && (
                <div className="flex items-center justify-center gap-2 sm:gap-4 px-5 py-3 border-b border-neutral-800 bg-neutral-950/30 text-xs">
                  <span
                    className={`flex items-center gap-1.5 font-medium ${
                      step === 'details' ? 'text-white' : 'text-neutral-400'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-neutral-800 text-center flex items-center justify-center text-[10px]">
                      1
                    </span>
                    Shipping Address
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
                  <span
                    className={`flex items-center gap-1.5 font-medium ${
                      step === 'payment' ? 'text-white' : 'text-neutral-400'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-neutral-800 text-center flex items-center justify-center text-[10px]">
                      2
                    </span>
                    Payment Method
                  </span>
                </div>
              )}

          {/* Body */}
          <div className="p-5 flex-1 overflow-y-auto">
            {/* STEP 1: SHIPPING DETAILS */}
            {step === 'details' && (
              <form onSubmit={handleProceedToPayment} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="e.g. Alex Chen"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-500 transition-colors"
                      id="checkout-name-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="alex@devicex.io"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-500 transition-colors"
                      id="checkout-email-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={e => setStreet(e.target.value)}
                    placeholder="742 Evergreen Silicon Way"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-500 transition-colors"
                    id="checkout-street-input"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-neutral-300 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="San Francisco"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-500 transition-colors"
                      id="checkout-city-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={stateVal}
                      onChange={e => setStateVal(e.target.value)}
                      placeholder="CA"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-500 transition-colors"
                      id="checkout-state-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">ZIP / Postal</label>
                    <input
                      type="text"
                      required
                      value={zip}
                      onChange={e => setZip(e.target.value)}
                      placeholder="94107"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-500 transition-colors"
                      id="checkout-zip-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Phone Number (for courier updates)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 (555) 438-9201"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-500 transition-colors"
                    id="checkout-phone-input"
                  />
                </div>

                {/* Items Summary Pill */}
                <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-center justify-between text-xs text-neutral-300">
                  <span>Shipping {items.length} item(s) via Express Carrier</span>
                  <span className="font-bold text-white">${total.toLocaleString()}</span>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    id="proceed-to-payment-btn"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white text-neutral-950 font-bold text-xs hover:bg-neutral-100 transition-all flex items-center justify-center gap-2 shadow-lg btn-glow-white btn-3d shimmer-btn cursor-pointer"
                  >
                    Continue to Payment
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: PAYMENT METHOD & SUBMISSION */}
            {step === 'payment' && (
              <div className="space-y-4">
                {/* Method selector pills */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-2">Select Payment Method</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === 'card'
                          ? 'bg-neutral-800 border-white text-white shadow-sm'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                      id="pay-method-card-btn"
                    >
                      <CreditCard className="w-4 h-4" />
                      Credit / Debit Card
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('apple_pay')}
                      className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === 'apple_pay'
                          ? 'bg-neutral-800 border-white text-white shadow-sm'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                      id="pay-method-apple-btn"
                    >
                      <span className="text-sm font-bold leading-none">Pay</span>
                      Apple Pay
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('google_pay')}
                      className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === 'google_pay'
                          ? 'bg-neutral-800 border-white text-white shadow-sm'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                      id="pay-method-google-btn"
                    >
                      <span className="text-xs font-bold leading-none text-sky-400">G Pay</span>
                      Google Pay
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('crypto')}
                      className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === 'crypto'
                          ? 'bg-neutral-800 border-white text-white shadow-sm'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                      id="pay-method-crypto-btn"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Crypto (USDT)
                    </button>
                  </div>
                </div>

                {cardError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                    {cardError}
                  </div>
                )}

                {/* CARD PAYMENT FORM & VISUAL CARD */}
                {paymentMethod === 'card' && (
                  <div className="space-y-3">
                    {/* Visual Card Preview */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-neutral-800 via-neutral-850 to-neutral-950 border border-neutral-700 shadow-xl space-y-4 text-white">
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-6 rounded bg-amber-400/80 border border-amber-300 flex items-center justify-center">
                          <div className="w-5 h-4 border border-amber-600/60 rounded-sm" />
                        </div>
                        <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-400">
                          Debit / Credit
                        </span>
                      </div>
                      <div className="font-mono text-base tracking-widest text-neutral-200">
                        {cardNumber ? cardNumber : '•••• •••• •••• ••••'}
                      </div>
                      <div className="flex items-center justify-between text-xs text-neutral-300 font-mono">
                        <div>
                          <span className="block text-[9px] uppercase text-neutral-400">Cardholder</span>
                          <span className="truncate max-w-[150px] inline-block font-sans">
                            {cardHolder || 'Alex Chen'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase text-neutral-400">Expires</span>
                          <span>{cardExpiry || '12/28'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Form fields */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">Card Number</label>
                      <input
                        type="text"
                        maxLength={19}
                        value={cardNumber}
                        onChange={e => setCardNumber(formatCardInput(e.target.value))}
                        placeholder="4532 8921 4301 9821"
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-400 font-mono focus:outline-none focus:border-neutral-500 transition-colors"
                        id="checkout-card-number-input"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">Cardholder Name</label>
                        <input
                          type="text"
                          value={cardHolder}
                          onChange={e => setCardHolder(e.target.value)}
                          placeholder="Alex Chen"
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-500 transition-colors"
                          id="checkout-card-holder-input"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-neutral-300 mb-1">MM/YY</label>
                          <input
                            type="text"
                            maxLength={5}
                            value={cardExpiry}
                            onChange={e => setCardExpiry(formatExpiryInput(e.target.value))}
                            placeholder="08/28"
                            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-400 font-mono focus:outline-none focus:border-neutral-500 transition-colors"
                            id="checkout-card-expiry-input"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-300 mb-1">CVV</label>
                          <input
                            type="password"
                            maxLength={4}
                            value={cardCvv}
                            onChange={e => setCardCvv(e.target.value.replace(/\D/g, ''))}
                            placeholder="•••"
                            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-400 font-mono focus:outline-none focus:border-neutral-500 transition-colors"
                            id="checkout-card-cvv-input"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* APPLE PAY SIMULATION */}
                {paymentMethod === 'apple_pay' && (
                  <div className="p-6 rounded-xl bg-neutral-950 border border-neutral-800 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-white text-black mx-auto flex items-center justify-center font-bold text-lg">
                      
                    </div>
                    <h4 className="text-sm font-semibold text-white">Apple Pay One-Touch Checkout</h4>
                    <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                      Confirm payment quickly using Touch ID or Face ID without sharing physical card numbers.
                    </p>
                  </div>
                )}

                {/* GOOGLE PAY SIMULATION */}
                {paymentMethod === 'google_pay' && (
                  <div className="p-6 rounded-xl bg-neutral-950 border border-neutral-800 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-neutral-800 text-sky-400 mx-auto flex items-center justify-center font-bold text-base">
                      G Pay
                    </div>
                    <h4 className="text-sm font-semibold text-white">Google Pay Express</h4>
                    <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                      Speed through checkout with payment cards saved in your Google Account.
                    </p>
                  </div>
                )}

                {/* CRYPTO SIMULATION */}
                {paymentMethod === 'crypto' && (
                  <div className="p-5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">USDT / USDC Transfer</span>
                      <span className="text-emerald-400 font-mono">1:1 USD</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 font-mono text-[11px] text-neutral-300 break-all">
                      0x71C...4982aF981E2
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Payment is detected and confirmed automatically on the network.
                    </p>
                  </div>
                )}

                {/* Security Guarantee Note */}
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Your payment details are protected with bank-level security and processed through PCI-DSS Level 1 certified gateways.
                  </span>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs transition-all btn-glow-neutral btn-3d cursor-pointer"
                  >
                    Back to Shipping
                  </button>
                  <button
                    type="button"
                    onClick={handleProcessPayment}
                    id="submit-payment-btn"
                    className="px-6 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-xs transition-all flex items-center gap-2 shadow-lg btn-glow-white btn-3d shimmer-btn cursor-pointer"
                  >
                    <span>Place Order • ${total.toLocaleString()}</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP: PROCESSING ANIMATION */}
            {step === 'processing' && (
              <div className="py-16 text-center space-y-4">
                <div className="w-14 h-14 rounded-full border-2 border-white border-t-transparent animate-spin mx-auto" />
                <h4 className="text-base font-semibold text-white">Processing Your Order...</h4>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                  Confirming payment and preparing your items for express fulfillment.
                </p>
              </div>
            )}

            {/* STEP: SUCCESS & INVOICE */}
            {step === 'success' && confirmedOrder && (
              <div className="space-y-5" id="printable-order-receipt">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-white">Thank You! Order Confirmed</h4>
                  <p className="text-xs text-neutral-400">
                    Order <strong>#{confirmedOrder.orderNumber}</strong> has been received. A receipt has been sent to your email.
                  </p>
                </div>

                {/* Professional Order Summary Card */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-neutral-800 pb-2.5">
                    <span className="font-semibold text-white">
                      Order Reference: #{confirmedOrder.orderNumber}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(confirmedOrder.orderNumber);
                        setCopiedHash(true);
                        setTimeout(() => setCopiedHash(false), 2000);
                      }}
                      className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedHash ? 'Copied' : 'Copy Order #'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-300">
                    <div>
                      <span className="text-neutral-400 block text-[10px]">Payment Method</span>
                      <span className="font-medium text-white">{confirmedOrder.paymentDetailsMasked}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[10px]">Shipping Method</span>
                      <span className="font-medium text-white">Express Insured Courier</span>
                    </div>
                  </div>
                </div>

                {/* Order Items Table */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3 text-xs">
                  <span className="font-semibold text-white block border-b border-neutral-800 pb-2">
                    Purchased Tech Items ({confirmedOrder.items.length})
                  </span>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {confirmedOrder.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <img src={it.image} alt={it.name} className="w-8 h-8 rounded object-cover" />
                          <div className="truncate">
                            <p className="font-medium text-white truncate">{it.name}</p>
                            <p className="text-[10px] text-neutral-400">Qty: {it.quantity}</p>
                          </div>
                        </div>
                        <span className="font-semibold text-neutral-200">
                          ${(it.price * it.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-neutral-800 pt-2 space-y-1 text-[11px] text-neutral-400">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${confirmedOrder.subtotal.toLocaleString()}</span>
                    </div>
                    {confirmedOrder.discount > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Discount</span>
                        <span>-${confirmedOrder.discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Express Insured Shipping</span>
                      <span>{confirmedOrder.shipping === 0 ? 'FREE' : `$${confirmedOrder.shipping}`}</span>
                    </div>
                    <div className="flex justify-between font-bold text-white text-xs pt-1 border-t border-neutral-800">
                      <span>Total Paid</span>
                      <span>${confirmedOrder.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery details */}
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs flex items-center justify-between text-neutral-300">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-sky-400" />
                    <span>Deliver to: {confirmedOrder.shippingAddress.street}, {confirmedOrder.shippingAddress.city}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">ETA: {confirmedOrder.estimatedDelivery}</span>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <button
                    onClick={handlePrintReceipt}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-medium transition-all btn-glow-neutral btn-3d cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Receipt
                  </button>

                  <div className="flex items-center gap-2">
                    {onTrackOrder && (
                      <button
                        onClick={() => {
                          const num = confirmedOrder.orderNumber;
                          onClose();
                          onTrackOrder(num);
                        }}
                        className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-neutral-950 font-bold text-xs transition-all flex items-center gap-1.5 btn-glow-sky btn-3d shimmer-btn cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Track Live Status
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="px-5 py-2 rounded-xl bg-white text-neutral-950 font-bold text-xs hover:bg-neutral-100 transition-all btn-glow-white btn-3d shimmer-btn cursor-pointer"
                    >
                      Return to Store
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          </>
        )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
