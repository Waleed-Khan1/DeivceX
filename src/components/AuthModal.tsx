import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Mail, User, ShieldCheck, X, Eye, EyeOff, Sparkles, Check } from 'lucide-react';
import { authenticateUser, registerUser } from '../services/db';
import { UserAccount } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserAccount, message: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const enteredEmail = email.trim();
    const enteredPassword = password;
    const enteredName = name.trim();

    if (mode === 'signup') {
      if (!enteredName) {
        setError('Full name is required.');
        return;
      }
      if (enteredPassword.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }

      // Immediately remove the entered email and password from the user's screen
      setName('');
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setLoading(true);

      try {
        const result = await registerUser(enteredName, enteredEmail, enteredPassword);
        if (result.success && result.user) {
          onSuccess(result.user, `Account secured for ${result.user.name}`);
          handleClose();
        } else {
          setError(result.error || 'Registration failed.');
          setName(enteredName);
          setEmail(enteredEmail);
        }
      } catch {
        setError('An unexpected error occurred. Please try again.');
        setName(enteredName);
        setEmail(enteredEmail);
      } finally {
        setLoading(false);
      }
    } else {
      if (!enteredEmail) {
        setError('Email address is required.');
        return;
      }

      // Immediately clear the password from the screen
      setPassword('');
      setLoading(true);

      try {
        const result = await authenticateUser(enteredEmail, enteredPassword);
        if (result.success && result.user) {
          onSuccess(result.user, `Welcome back, ${result.user.name}`);
          handleClose();
        } else {
          setError(result.error || 'Authentication failed. Please verify credentials.');
        }
      } catch {
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleQuickDemoLogin = async () => {
    resetForm();
    setLoading(true);
    try {
      const res = await authenticateUser('alex.chen@devicex.io', 'Password123!');
      if (res.success && res.user) {
        onSuccess(res.user, 'Signed in as Alex Chen');
        handleClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        id="auth-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          id="auth-modal-content"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-neutral-100"
        >
          {/* Top Bar */}
          <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white font-bold text-xs">
                DX
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">DeviceX Account</h3>
                <p className="text-[11px] text-neutral-400">Access your orders, wishlist, and warranty</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
              id="close-auth-modal-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 p-1.5 m-5 mb-3 bg-neutral-950 rounded-xl border border-neutral-800/80 text-xs font-medium">
            <button
              type="button"
              id="auth-tab-signin"
              onClick={() => { setMode('signin'); resetForm(); }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'signin' ? 'bg-neutral-800 text-white shadow-sm font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              id="auth-tab-signup"
              onClick={() => { setMode('signup'); resetForm(); }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'signup' ? 'bg-neutral-800 text-white shadow-sm font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Quick Demo Login Pill for effortless testing */}
          <div className="px-5">
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={loading}
              id="demo-login-btn"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-medium transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Quick 1-Click Demo Login (Alex Chen)
            </button>
          </div>

          <div className="flex items-center gap-3 px-5 my-4">
            <div className="h-px bg-neutral-800 flex-1" />
            <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-mono">or continue with email</span>
            <div className="h-px bg-neutral-800 flex-1" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3.5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {error}
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Alex Chen"
                    className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-500 transition-colors"
                    id="auth-name-input"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-500 transition-colors"
                  id="auth-email-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-9 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-500 transition-colors"
                  id="auth-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-neutral-400 hover:text-neutral-300 absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 text-[11px] text-neutral-400 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Your personal account data is protected. We will never share or sell your details.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="auth-submit-btn"
              className="w-full py-2.5 rounded-xl bg-white text-neutral-950 font-semibold text-xs hover:bg-neutral-200 transition-colors shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                'Please wait...'
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
