import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

export const LoginBackground: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Primary Radial Glow Behind Form */}
      <div className="absolute -top-[25%] left-1/2 -translate-x-1/2 w-[550px] sm:w-[850px] h-[550px] bg-[#FF6B00]/12 blur-[130px] rounded-full" />

      {/* Secondary Ambient Light Spheres (Hidden on small mobile to reduce particle/DOM load) */}
      <div className="hidden sm:block absolute -bottom-[15%] -left-[10%] w-[450px] h-[450px] bg-amber-500/8 blur-[130px] rounded-full" />
      <div className="hidden sm:block absolute -bottom-[15%] -right-[10%] w-[450px] h-[450px] bg-orange-600/8 blur-[130px] rounded-full" />

      {/* Subtle Blueprint/Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #FFFFFF 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Floating Particles: reduced motion disables movement, small screen renders minimal count */}
      {!prefersReducedMotion && (
        <>
          <motion.div
            animate={{ y: [0, -18, 0], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/4 left-[12%] w-2 h-2 rounded-full bg-[#FF6B00]/50 blur-xs"
          />
          <motion.div
            animate={{ y: [0, 20, 0], opacity: [0.15, 0.45, 0.15] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="hidden sm:block absolute bottom-1/3 right-[15%] w-3 h-3 rounded-full bg-amber-400/40 blur-xs"
          />
          <motion.div
            animate={{ y: [0, -14, 0], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="hidden sm:block absolute top-2/3 left-[20%] w-2.5 h-2.5 rounded-full bg-orange-400/40 blur-xs"
          />
        </>
      )}
    </div>
  );
};
