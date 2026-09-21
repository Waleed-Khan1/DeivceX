import React, { useState, useRef } from 'react';
import { Truck, ShieldCheck, RotateCcw, Headphones, Sparkles, CheckCircle2 } from 'lucide-react';

interface ValueCardProps {
  icon: React.FC<{ className?: string }>;
  title: string;
  subtitle: string;
  badge: string;
  accentColor: string;
}

const ValueCard: React.FC<ValueCardProps> = ({
  icon: Icon,
  title,
  subtitle,
  badge,
  accentColor,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * 7;
    const rotY = ((x - centerX) / centerX) * 8;

    setTilt({ x: rotX, y: rotY });
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.12,
    });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
    setGlare(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      style={{ perspective: '1000px' }}
      className="w-full"
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transformStyle: 'preserve-3d',
          transform: isHovered
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-4px) scale3d(1.015, 1.015, 1.015)`
            : 'rotateX(0deg) rotateY(0deg) translateY(0px) scale3d(1, 1, 1)',
          transition: isHovered
            ? 'transform 0.1s ease-out, box-shadow 0.2s ease-out, border-color 0.2s ease-out'
            : 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.5s ease-out, border-color 0.3s ease-out',
          boxShadow: isHovered
            ? `${-tilt.y * 1.5}px ${tilt.x * 1.5 + 15}px 30px rgba(0, 0, 0, 0.7), 0 0 20px ${accentColor}25`
            : '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
        className={`relative p-4 sm:p-5 rounded-2xl bg-neutral-900/80 border ${
          isHovered ? 'border-neutral-700 bg-neutral-900/95' : 'border-neutral-800/80'
        } backdrop-blur-md flex flex-col justify-between overflow-hidden cursor-default`}
      >
        {/* Specular Glare */}
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl transition-opacity duration-300 z-10"
          style={{
            opacity: glare.opacity,
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, 0.2) 0%, transparent 65%)`,
          }}
        />

        {/* 3D Elevated Content */}
        <div
          style={{
            transform: isHovered ? 'translateZ(25px)' : 'translateZ(0px)',
            transition: 'transform 0.25s ease-out',
          }}
          className="space-y-2.5 z-20"
        >
          <div className="flex items-center justify-between">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110"
              style={{
                backgroundColor: `${accentColor}15`,
                borderColor: `${accentColor}35`,
                color: accentColor,
              }}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wide border shadow-sm"
              style={{
                backgroundColor: `${accentColor}12`,
                borderColor: `${accentColor}30`,
                color: accentColor,
              }}
            >
              {badge}
            </span>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              {title}
            </h4>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed font-normal">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Bottom subtle micro-indicator */}
        <div
          style={{
            transform: isHovered ? 'translateZ(15px)' : 'translateZ(0px)',
            transition: 'transform 0.25s ease-out',
          }}
          className="mt-3 pt-2.5 border-t border-neutral-800/60 flex items-center gap-1.5 text-[11px] text-neutral-400"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>DeviceX Verified Guarantee</span>
        </div>
      </div>
    </div>
  );
};

export const ValueHighlights: React.FC = () => {
  const values = [
    {
      icon: Truck,
      title: 'Free 2-Day Insured Air',
      subtitle: 'Complimentary expedited delivery on all orders over $99 with live GPS tracking.',
      badge: 'SPEED & SAFETY',
      accentColor: '#38bdf8', // sky
    },
    {
      icon: ShieldCheck,
      title: '2-Year Direct Warranty',
      subtitle: 'Full certified hardware coverage from Apple, Dell, Sony, Bose, and Samsung.',
      badge: '100% GENUINE',
      accentColor: '#10b981', // emerald
    },
    {
      icon: RotateCcw,
      title: '30-Day Hassle-Free Returns',
      subtitle: 'Direct zero-fee return label included in box. Complete satisfaction guarantee.',
      badge: 'RISK-FREE',
      accentColor: '#f59e0b', // amber
    },
    {
      icon: Headphones,
      title: '24/7 Tech Concierge',
      subtitle: 'Expert hardware setup, compatibility questions, and rapid tech support.',
      badge: 'EXPERT SUPPORT',
      accentColor: '#a855f7', // purple
    },
  ];

  return (
    <section aria-label="Store Guarantees" className="mb-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 2xl:gap-6">
        {values.map((v, i) => (
          <ValueCard key={i} {...v} />
        ))}
      </div>
    </section>
  );
};
