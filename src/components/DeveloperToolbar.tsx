import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Terminal,
  Database,
  ShieldCheck,
  RotateCcw,
  X,
  ChevronUp,
  ChevronDown,
  Cpu,
  Code2,
  HardDrive,
} from 'lucide-react';

interface DeveloperToolbarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDatabase: () => void;
  onOpenSecurity: () => void;
  onResetDatabase: () => void;
  onLockOwnerMode?: () => void;
}

export const DeveloperToolbar: React.FC<DeveloperToolbarProps> = ({
  isOpen,
  onClose,
  onOpenDatabase,
  onOpenSecurity,
  onResetDatabase,
  onLockOwnerMode,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      id="devicex-developer-toolbar"
      className="fixed bottom-16 sm:bottom-4 right-2 sm:right-4 z-50 select-none print:hidden max-w-[95vw] sm:max-w-md"
    >
      <AnimatePresence mode="wait">
        {isMinimized ? (
          <motion.button
            key="minimized"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setIsMinimized(false)}
            id="expand-dev-toolbar-btn"
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-neutral-900/95 border border-amber-500/50 text-amber-400 shadow-2xl backdrop-blur-md hover:bg-neutral-800 transition-all font-mono text-xs font-semibold"
            title="Click to expand Owner Console"
          >
            <Terminal className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Owner Console Active</span>
            <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
          </motion.button>
        ) : (
          <motion.div
            key="expanded"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="bg-neutral-900/95 border border-amber-500/40 rounded-2xl shadow-2xl shadow-black/80 backdrop-blur-xl p-3 sm:p-4 text-neutral-100 font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-neutral-800/90">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Terminal className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                    OWNER & DEV CONSOLE
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono block">
                    Restricted Access • Authenticated
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                  title="Minimize bar"
                  id="minimize-dev-toolbar-btn"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-800 transition-colors"
                  title="Hide Toolbar"
                  id="close-dev-toolbar-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Action Tools */}
            <div className="grid grid-cols-2 gap-2 pt-2.5">
              {/* Database & Plain Text Viewer */}
              <button
                onClick={onOpenDatabase}
                id="dev-open-database-btn"
                className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/50 text-neutral-200 hover:text-white transition-all text-xs font-medium group text-left"
              >
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold block text-white text-[11px]">Database & Orders</span>
                  <span className="text-[9px] text-neutral-400 font-mono">Change Status & View Text</span>
                </div>
              </button>

              {/* Security Audit Logs */}
              <button
                onClick={onOpenSecurity}
                id="dev-open-security-btn"
                className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 hover:border-emerald-500/50 text-neutral-200 hover:text-white transition-all text-xs font-medium group text-left"
              >
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold block text-white text-[11px]">Security Logs</span>
                  <span className="text-[9px] text-neutral-400 font-mono">Audit Trail & Vault</span>
                </div>
              </button>
            </div>

            {/* Bottom Utilities */}
            <div className="mt-2 pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <Database className="w-3 h-3" />
                Cloud Firestore Live
              </span>
              <button
                onClick={onLockOwnerMode || onClose}
                className="text-neutral-400 hover:text-rose-400 underline transition-colors"
                id="exit-dev-mode-text-btn"
              >
                Lock & Exit Mode
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
