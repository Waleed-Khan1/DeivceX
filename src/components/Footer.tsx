import React from 'react';
import { ShieldCheck, Award, Cpu, Truck, Headphones, Terminal } from 'lucide-react';
import { BRANDS } from '../data/products';

interface FooterProps {
  onOpenSecurity?: () => void;
  onOpenOrderTracker?: () => void;
  isDeveloperMode?: boolean;
  onToggleDeveloperMode?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenOrderTracker,
  isDeveloperMode = false,
  onToggleDeveloperMode,
}) => {
  return (
    <footer id="devicex-footer" className="border-t border-neutral-800 bg-neutral-950 text-neutral-400 text-xs mt-16 pb-20 md:pb-8">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 py-12">
        {/* Brand guarantee columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 2xl:gap-10 pb-10 border-b border-neutral-800/80 text-center sm:text-left">
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-white font-semibold">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Genuine Hardware</span>
            </div>
            <p className="text-[11px] text-neutral-400">100% factory-sealed original tech from authorized brand partners.</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-white font-semibold">
              <Award className="w-4 h-4 text-sky-400" />
              <span>2-Year Warranty</span>
            </div>
            <p className="text-[11px] text-neutral-400">Official manufacturer warranty and full replacement guarantee.</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-white font-semibold">
              <Truck className="w-4 h-4 text-indigo-400" />
              <span>Express Delivery</span>
            </div>
            <p className="text-[11px] text-neutral-400">Fast, insured courier delivery with real-time tracking updates.</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-white font-semibold">
              <Headphones className="w-4 h-4 text-amber-400" />
              <span>Dedicated Support</span>
            </div>
            <p className="text-[11px] text-neutral-400">24/7 priority customer service and setup guidance.</p>
          </div>
        </div>

        {/* Brands listed */}
        <div className="py-8 border-b border-neutral-800/80">
          <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 block mb-3 text-center sm:text-left">
            Authorized Hardware Partners & Ecosystem
          </span>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 text-neutral-400 text-xs font-semibold">
            {BRANDS.filter(b => b !== 'All Brands').map(brand => (
              <span key={brand} className="hover:text-white transition-colors cursor-default">
                {brand}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom copyright, customer trust, and discreet developer link */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">DeviceX</span>
            <span>© {new Date().getFullYear()} DeviceX Inc. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4">
            {onOpenOrderTracker && (
              <>
                <button
                  onClick={onOpenOrderTracker}
                  className="hover:text-white transition-colors flex items-center gap-1 text-sky-400"
                  id="footer-track-order-btn"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Track an Order</span>
                </button>
                <span className="text-neutral-700">•</span>
              </>
            )}
            <span className="hover:text-neutral-200 transition-colors cursor-pointer">Privacy Policy</span>
            <span className="text-neutral-700">•</span>
            <span className="hover:text-neutral-200 transition-colors cursor-pointer">Terms of Sale</span>
            <span className="text-neutral-700">•</span>
            <span className="hover:text-neutral-200 transition-colors cursor-pointer">Returns & Exchanges</span>
            {/* Owner portal trigger - only shown when owner session is already unlocked */}
            {isDeveloperMode && onToggleDeveloperMode && (
              <>
                <span className="text-neutral-700 hidden sm:inline">•</span>
                <button
                  onClick={onToggleDeveloperMode}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md font-mono transition-colors text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30"
                  title="Owner Controls Active"
                  id="footer-toggle-dev-mode-btn"
                >
                  <Terminal className="w-3 h-3 text-amber-400" />
                  <span>Owner Console Active</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
