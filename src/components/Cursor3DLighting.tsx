import React, { useEffect, useState } from 'react';

export const Cursor3DLighting: React.FC = () => {
  const [position, setPosition] = useState({ x: -200, y: -200 });
  const [isHoveringClickable, setIsHoveringClickable] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let animationFrameId: number;
    let targetX = -200;
    let targetY = -200;
    let currentX = -200;
    let currentY = -200;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!isVisible) setIsVisible(true);

      // Check if hovering over interactive element
      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = Boolean(
          target.closest('button') ||
          target.closest('a') ||
          target.closest('[role="button"]') ||
          target.closest('.group') ||
          target.closest('input') ||
          target.closest('select')
        );
        setIsHoveringClickable(isInteractive);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const updatePosition = () => {
      // Smooth lerp following
      currentX += (targetX - currentX) * 0.14;
      currentY += (targetY - currentY) * 0.14;

      setPosition({ x: currentX, y: currentY });
      animationFrameId = requestAnimationFrame(updatePosition);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    animationFrameId = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      id="cursor-3d-lighting-halo"
      className="fixed inset-0 pointer-events-none z-10 overflow-hidden transition-opacity duration-500"
      aria-hidden="true"
    >
      {/* Primary Ambient Specular Spotlight */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300 pointer-events-none blur-3xl"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: isHoveringClickable ? '540px' : '440px',
          height: isHoveringClickable ? '540px' : '440px',
          background: isHoveringClickable
            ? 'radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, rgba(129, 140, 248, 0.04) 45%, transparent 70%)'
            : 'radial-gradient(circle, rgba(255, 255, 255, 0.045) 0%, rgba(56, 189, 248, 0.02) 40%, transparent 70%)',
        }}
      />

      {/* Subtle Precision Center Flare */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none blur-xl opacity-60"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: isHoveringClickable ? '140px' : '90px',
          height: isHoveringClickable ? '140px' : '90px',
          background: isHoveringClickable
            ? 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
        }}
      />
    </div>
  );
};
