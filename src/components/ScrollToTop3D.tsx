import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp } from 'lucide-react';

export const ScrollToTop3D: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 350) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * 15;
    const rotY = ((x - centerX) / centerX) * 15;

    setTilt({ x: rotX, y: rotY });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  if (!isVisible) return null;

  return (
    <div
      style={{ perspective: '600px' }}
      className="fixed bottom-20 md:bottom-8 right-5 sm:right-8 z-40"
    >
      <button
        ref={buttonRef}
        onClick={scrollToTop}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transformStyle: 'preserve-3d',
          transform: isHovered
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-4px) scale(1.08)`
            : 'rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)',
          transition: isHovered
            ? 'transform 0.1s ease-out, box-shadow 0.2s ease-out'
            : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease-out',
          boxShadow: isHovered
            ? '0 12px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(255, 255, 255, 0.25)'
            : '0 4px 15px rgba(0, 0, 0, 0.5)',
        }}
        id="scroll-to-top-3d-btn"
        className="w-11 h-11 rounded-2xl bg-neutral-900/90 border border-neutral-700/80 backdrop-blur-xl text-white flex items-center justify-center group active:scale-95 cursor-pointer"
        aria-label="Scroll to top"
        title="Back to Top"
      >
        <ArrowUp className="w-5 h-5 text-neutral-300 group-hover:text-white group-hover:-translate-y-0.5 transition-all" />
      </button>
    </div>
  );
};
