import React from 'react';
import {
  Laptop,
  Smartphone,
  Speaker,
  Headphones,
  Watch,
  Plug,
  Layers,
  ArrowUpDown,
  Filter,
  Check,
  X,
} from 'lucide-react';
import { CategoryType } from '../types';
import { BRANDS } from '../data/products';

interface CategoryBarProps {
  selectedCategory: CategoryType;
  onSelectCategory: (category: CategoryType) => void;
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'rating';
  onSortChange: (sort: 'featured' | 'price-asc' | 'price-desc' | 'rating') => void;
  inStockOnly: boolean;
  onToggleInStock: () => void;
  totalResults: number;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

const CATEGORIES: { id: CategoryType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'all', label: 'All Tech', icon: Layers },
  { id: 'laptops', label: 'Laptops', icon: Laptop },
  { id: 'mobiles', label: 'Mobiles', icon: Smartphone },
  { id: 'speakers', label: 'Bluetooth Speakers', icon: Speaker },
  { id: 'audio', label: 'AirPods & Audio', icon: Headphones },
  { id: 'wearables', label: 'Wearables', icon: Watch },
  { id: 'accessories', label: 'Accessories', icon: Plug },
];

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedBrand,
  onSelectBrand,
  sortBy,
  onSortChange,
  inStockOnly,
  onToggleInStock,
  totalResults,
  onResetFilters,
  hasActiveFilters,
}) => {
  return (
    <div id="category-filter-section" className="space-y-4 mb-8">
      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto 2xl:flex-wrap pt-2 pb-2.5 px-1 -mt-2 -mx-1 scrollbar-none no-scrollbar">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              id={`cat-filter-${cat.id}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer btn-3d ${
                isSelected
                  ? 'bg-white text-neutral-950 shadow-lg scale-[1.02] btn-glow-white font-bold border border-white'
                  : 'bg-neutral-900/90 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-600 btn-glow-neutral'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Secondary Row: Brand Filter Chips & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Brand Selector Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1.5 pb-2 px-1 -mt-1.5 -mx-1 max-w-full no-scrollbar">
          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Brands:
          </span>
          {BRANDS.map(brand => {
            const isSelected = selectedBrand === brand;
            return (
              <button
                key={brand}
                onClick={() => onSelectBrand(brand)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all shrink-0 min-h-[30px] cursor-pointer btn-3d ${
                  isSelected
                    ? 'bg-white text-neutral-950 font-bold btn-glow-white shadow-md border border-white'
                    : 'bg-neutral-900/90 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-600 btn-glow-neutral'
                }`}
                id={`brand-filter-${brand.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {brand}
              </button>
            );
          })}
        </div>

        {/* Right side: Sorting & In-Stock & Count */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-1 sm:pt-0 border-t border-neutral-800/60 sm:border-0">
          {/* In Stock Toggle */}
          <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-400 hover:text-neutral-200 select-none min-h-[36px] px-2 py-1 rounded-lg hover:bg-neutral-900/50 transition-colors">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={onToggleInStock}
              className="sr-only peer"
            />
            <div className="w-7 h-4 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500 relative shadow-inner" />
            <span className="text-[11px]">In Stock</span>
          </label>

          {/* Sort Dropdown */}
          <div className="relative flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 pointer-events-none" />
            <select
              value={sortBy}
              onChange={e => onSortChange(e.target.value as any)}
              className="pl-8 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-200 font-medium appearance-none focus:outline-none focus:border-neutral-600 hover:border-neutral-700 cursor-pointer min-h-[36px] transition-colors"
              id="sort-select-dropdown"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

          {/* Reset button if active filters */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition-all px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 hover:border-rose-500/50 btn-3d cursor-pointer"
              title="Reset all filters"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          <span className="text-[11px] text-neutral-400 font-mono hidden md:inline">
            ({totalResults})
          </span>
        </div>
      </div>
    </div>
  );
};
