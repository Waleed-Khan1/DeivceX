import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  KeyRound,
  Lock,
  Unlock,
  CheckCircle2,
  Database,
  Terminal,
  X,
  AlertTriangle,
  Eye,
  EyeOff,
  LogOut,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import {
  verifyOwnerPasscode,
  setOwnerPasscode,
  isOwnerSessionActive,
  setOwnerSessionActive,
  DEFAULT_OWNER_PASSCODE,
} from '../services/db';

interface OwnerAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
  onLockOwnerMode: () => void;
  onOpenDatabase: () => void;
  onOpenSecurity: () => void;
}

export const OwnerAccessModal: React.FC<OwnerAccessModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  onLockOwnerMode,
  onOpenDatabase,
  onOpenSecurity,
}) => {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isChangingPasscode, setIsChangingPasscode] = useState(false);
  const [newPasscode, setNewPasscode] = useState('');

  const isAlreadyAuthenticated = isOwnerSessionActive();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!passcode.trim()) {
      setError('Please enter the owner master key.');
      return;
    }

    if (verifyOwnerPasscode(passcode)) {
      setOwnerSessionActive(true);
      setSuccessMsg('Authentication successful! Developer & owner controls unlocked.');
      setPasscode('');
      setTimeout(() => {
        onAuthenticated();
      }, 500);
    } else {
      setError('Invalid owner master key. Access denied.');
    }
  };

  const handleLock = () => {
    setOwnerSessionActive(false);
    onLockOwnerMode();
    setSuccessMsg('Developer mode locked. Customer view restored.');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleChangePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasscode || newPasscode.trim().length < 4) {
      setError('Passcode must be at least 4 characters long.');
      return;
    }
    const updated = setOwnerPasscode(newPasscode);
    if (updated) {
      setSuccessMsg('Owner master key updated successfully.');
      setIsChangingPasscode(false);
      setNewPasscode('');
    } else {
      setError('Failed to update passcode.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-neutral-100"
          id="owner-access-modal"
        >
          {/* Top Banner Header */}
          <div className="p-5 sm:p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Store Owner & Developer Portal
                  {isAlreadyAuthenticated && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                      Authenticated
                    </span>
                  )}
                </h3>
                <p className="text-xs text-neutral-400">
                  Restricted system controls and database tools
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              id="close-owner-modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {/* Explanatory Context */}
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 flex items-start gap-3">
              <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-white block">Strict Owner Privacy</span>
                <p className="text-neutral-400 leading-relaxed text-[11px]">
                  Developer tools, live database tables, customer orders, and internal audit logs are hidden from regular shoppers. Only the store owner or developer with the master security key can unlock this console.
                </p>
              </div>
            </div>

            {/* IF ALREADY AUTHENTICATED: Show Owner Quick Controls */}
            {isAlreadyAuthenticated ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-emerald-300 block">Owner Session Active</span>
                    <span className="text-emerald-400/80 text-[11px]">
                      Developer tools and database inspector are unlocked for your current browser session.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenDatabase();
                    }}
                    id="owner-launch-database-btn"
                    className="p-3.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-sky-500/50 text-left transition-all flex items-center gap-3 group"
                  >
                    <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 transition-colors shrink-0">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white block">Database Inspector</span>
                      <span className="text-[11px] text-neutral-400 block">Inspect orders, items & users</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onOpenSecurity();
                    }}
                    id="owner-launch-audit-btn"
                    className="p-3.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-emerald-500/50 text-left transition-all flex items-center gap-3 group"
                  >
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white block">Activity Logs</span>
                      <span className="text-[11px] text-neutral-400 block">Review transaction trail</span>
                    </div>
                  </button>
                </div>

                {/* Lock Session Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-800">
                  <button
                    onClick={() => setIsChangingPasscode(!isChangingPasscode)}
                    className="text-xs text-neutral-400 hover:text-white transition-colors"
                  >
                    {isChangingPasscode ? 'Cancel Passcode Change' : 'Change Master Passcode'}
                  </button>

                  <button
                    onClick={handleLock}
                    id="owner-lock-session-btn"
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Lock & Exit Owner Mode
                  </button>
                </div>

                {/* Change Passcode Subform */}
                {isChangingPasscode && (
                  <form onSubmit={handleChangePasscode} className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                    <span className="text-xs font-semibold text-white block">Update Owner Master Key</span>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="Enter new master key (min 4 chars)"
                        value={newPasscode}
                        onChange={(e) => setNewPasscode(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="submit"
                        className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              /* NOT AUTHENTICATED: Owner Login Form */
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                    <span>Owner Master Key / Passcode</span>
                    <button
                      type="button"
                      onClick={() => setPasscode(DEFAULT_OWNER_PASSCODE)}
                      className="text-[11px] text-amber-400/80 hover:text-amber-300 underline"
                    >
                      Fill Default Key ({DEFAULT_OWNER_PASSCODE})
                    </button>
                  </label>

                  <div className="relative">
                    <input
                      type={showPasscode ? 'text' : 'password'}
                      value={passcode}
                      onChange={(e) => {
                        setPasscode(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Enter owner master key..."
                      autoFocus
                      id="owner-passcode-input"
                      className="w-full px-3.5 py-3 pr-10 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasscode(!showPasscode)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                    >
                      {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-neutral-500 font-mono">
                    Owner Passcode Protected
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      id="submit-owner-passcode-btn"
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      Unlock Owner Mode
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
