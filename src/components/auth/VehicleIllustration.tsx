import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface VehicleIllustrationProps {
  phase: number; // 1: System Wake, 2: Diagnostic Scan, 3: System Ready, 4: Login Reveal, 5: Idle
  mouseOffset?: { x: number; y: number };
}

export const VehicleIllustration: React.FC<VehicleIllustrationProps> = ({
  phase,
  mouseOffset = { x: 0, y: 0 },
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [blinkState, setBlinkState] = useState(false);

  // Periodic subtle diagnostic node blink
  useEffect(() => {
    if (prefersReducedMotion) return;
    const interval = setInterval(() => {
      setBlinkState((prev) => !prev);
    }, 2400);
    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  // Parallax transform (clamped to max +/- 12px)
  const parallaxX = prefersReducedMotion ? 0 : mouseOffset.x * 12;
  const parallaxY = prefersReducedMotion ? 0 : mouseOffset.y * 8;

  // Path drawing transition
  const drawTransition = {
    duration: prefersReducedMotion ? 0.2 : 1.4,
    ease: [0.16, 1, 0.3, 1],
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 lg:p-12 select-none overflow-hidden">
      {/* Background Architectural Datum Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #111111 1px, transparent 1px), linear-gradient(to bottom, #111111 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Coordinate Markings in Corners */}
      <div className="absolute top-8 left-8 flex items-center gap-3 font-mono text-[10px] text-slate-400 tracking-wider">
        <span className="text-[#059669] font-bold">+</span>
        <span>SYS_COORD // LAT: 45.3892 LON: -122.7631</span>
      </div>

      <div className="absolute top-8 right-8 font-mono text-[10px] text-slate-400 tracking-wider hidden sm:block">
        <span>WORKSHOP NODE // 01-ALPHA</span>
      </div>

      {/* Main Automotive Visualization Stage */}
      <motion.div
        style={{
          transform: `translate3d(${parallaxX}px, ${parallaxY}px, 0)`,
          transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        className="relative w-full max-w-2xl aspect-[16/9] flex items-center justify-center"
      >
        {/* Horizontal Precision Scanline Sweep (Active during Phase 1 & 2) */}
        {!prefersReducedMotion && (phase === 1 || phase === 2) && (
          <motion.div
            initial={{ left: '-5%', opacity: 0 }}
            animate={{ left: '105%', opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], repeat: phase === 2 ? 0 : Infinity }}
            className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#059669] to-transparent z-30 pointer-events-none shadow-[0_0_12px_#059669]"
          >
            <div className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 rounded-full bg-[#059669] blur-xs" />
            <div className="absolute top-1/4 -left-1 w-2 h-2 rounded-full bg-[#059669]/60" />
            <div className="absolute top-3/4 -left-1 w-2 h-2 rounded-full bg-[#059669]/60" />
          </motion.div>
        )}

        {/* Precision Technical SVG Blueprint of Luxury GT Vehicle */}
        <svg
          viewBox="0 0 800 450"
          className="w-full h-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Soft Metallic Linear Gradient */}
            <linearGradient id="chassisGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1E293B" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#0F172A" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#1E293B" stopOpacity="0.4" />
            </linearGradient>

            {/* Electric Mint Accent Gradient */}
            <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>

          {/* 1. Ground Plane Datum & Dimension Guidelines */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 2 ? 1 : 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Ground line */}
            <line x1="80" y1="340" x2="720" y2="340" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="4 4" />
            
            {/* Center Datum Line */}
            <line x1="400" y1="100" x2="400" y2="360" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 4" />

            {/* Dimension brackets */}
            <path d="M 80,355 L 80,365 L 720,365 L 720,355" stroke="#CBD5E1" strokeWidth="1" />
            <text x="400" y="378" textAnchor="middle" fill="#94A3B8" className="font-mono text-[10px] tracking-widest">
              OVERALL LENGTH // 4,820 MM
            </text>

            {/* Wheelbase Bracket */}
            <path d="M 230,335 L 230,345 L 590,345 L 590,335" stroke="#CBD5E1" strokeWidth="0.8" />
            <text x="410" y="330" textAnchor="middle" fill="#64748B" className="font-mono text-[9px] tracking-wider">
              WHEELBASE 2,900 MM
            </text>
          </motion.g>

          {/* 2. Main Vehicle Silhouette Paths (Animated with strokeDashoffset) */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{
              opacity: phase >= 2 ? (phase === 5 && !prefersReducedMotion ? [0.85, 1, 0.85] : 1) : 0,
            }}
            transition={{
              opacity: {
                duration: phase === 5 ? 4 : 0.8,
                repeat: phase === 5 ? Infinity : 0,
                ease: 'easeInOut',
              },
            }}
          >
            {/* Outer Aerodynamic Roofline & Body Monocoque */}
            <motion.path
              d="M 110,310 
                 C 130,290 170,270 210,265 
                 C 250,260 290,265 330,260 
                 C 380,210 440,165 520,160 
                 C 590,155 640,195 670,240 
                 C 695,250 710,275 715,305 
                 C 715,320 680,325 660,325 
                 C 650,290 620,265 580,265 
                 C 540,265 510,290 500,325 
                 L 310,325 
                 C 300,290 270,265 230,265 
                 C 190,265 160,290 150,325 
                 L 110,325 Z"
              stroke="url(#chassisGrad)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: phase >= 2 ? 1 : 0 }}
              transition={drawTransition}
            />

            {/* Greenhouse Window Contours */}
            <motion.path
              d="M 345,252 
                 C 390,215 440,175 515,172 
                 C 575,170 615,200 645,248 
                 L 345,252 Z"
              stroke="#64748B"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: phase >= 2 ? 1 : 0 }}
              transition={{ ...drawTransition, delay: 0.15 }}
            />

            {/* Window B-Pillar Divider */}
            <motion.line
              x1="490"
              y1="173"
              x2="475"
              y2="252"
              stroke="#94A3B8"
              strokeWidth="1.2"
              strokeDasharray="2 2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: phase >= 2 ? 1 : 0 }}
              transition={{ ...drawTransition, delay: 0.2 }}
            />

            {/* Shoulder Sculpt Line */}
            <motion.path
              d="M 130,285 C 220,275 320,278 450,270 C 560,262 640,270 705,285"
              stroke="#CBD5E1"
              strokeWidth="1"
              strokeDasharray="4 3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: phase >= 2 ? 1 : 0 }}
              transition={{ ...drawTransition, delay: 0.25 }}
            />

            {/* Front Headlight Cluster (Precision LED line) */}
            <motion.path
              d="M 115,302 L 145,295 L 155,300"
              stroke="#059669"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: phase >= 2 ? 1 : 0 }}
              transition={{ ...drawTransition, delay: 0.3 }}
            />

            {/* Rear Taillight Blade */}
            <motion.path
              d="M 690,280 L 715,288 L 712,300"
              stroke="#F43F5E"
              strokeWidth="1.8"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: phase >= 2 ? 1 : 0 }}
              transition={{ ...drawTransition, delay: 0.35 }}
            />

            {/* Front Wheel Rim Assembly */}
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: phase >= 2 ? 1 : 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <circle cx="230" cy="325" r="38" stroke="#1E293B" strokeWidth="2" fill="#F8FAFC" />
              <circle cx="230" cy="325" r="28" stroke="#64748B" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="230" cy="325" r="10" stroke="#059669" strokeWidth="1.5" fill="#059669" fillOpacity="0.1" />
              {/* Rotor Brake Caliper */}
              <path d="M 215,310 A 18 18 0 0 1 245,310" stroke="#059669" strokeWidth="3.5" strokeLinecap="round" />
            </motion.g>

            {/* Rear Wheel Rim Assembly */}
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: phase >= 2 ? 1 : 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
            >
              <circle cx="580" cy="325" r="38" stroke="#1E293B" strokeWidth="2" fill="#F8FAFC" />
              <circle cx="580" cy="325" r="28" stroke="#64748B" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="580" cy="325" r="10" stroke="#059669" strokeWidth="1.5" fill="#059669" fillOpacity="0.1" />
              {/* Rotor Brake Caliper */}
              <path d="M 565,310 A 18 18 0 0 1 595,310" stroke="#059669" strokeWidth="3.5" strokeLinecap="round" />
            </motion.g>

            {/* Center of Gravity Marker */}
            <circle cx="410" cy="275" r="6" stroke="#059669" strokeWidth="1" strokeDasharray="2 2" />
            <path d="M 404,275 L 416,275 M 410,269 L 410,281" stroke="#059669" strokeWidth="0.8" />
          </motion.g>

          {/* 3. Diagnostic Telemetry Callouts */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 3 ? 1 : 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Front Diagnostic Node */}
            <g className="font-mono text-[9px]">
              <circle cx="170" cy="250" r="3" fill="#059669" className={blinkState ? 'opacity-100' : 'opacity-40'} />
              <polyline points="170,250 140,210 60,210" stroke="#CBD5E1" strokeWidth="0.8" fill="none" />
              <text x="60" y="200" fill="#0F172A" fontWeight="600">
                POWERTRAIN // DUAL-MOTOR
              </text>
              <text x="60" y="215" fill="#059669" fontWeight="500">
                STATUS: OPTIMAL
              </text>
            </g>

            {/* Battery / Inverter Node */}
            <g className="font-mono text-[9px]">
              <circle cx="410" cy="315" r="3" fill="#059669" className={blinkState ? 'opacity-40' : 'opacity-100'} />
              <polyline points="410,315 450,380 540,380" stroke="#CBD5E1" strokeWidth="0.8" fill="none" />
              <text x="450" y="395" fill="#0F172A" fontWeight="600">
                HV BATTERY PACK // 800V
              </text>
              <text x="450" y="408" fill="#64748B">
                STATE: 99.4% NOMINAL
              </text>
            </g>

            {/* Rear Torque Vectoring Node */}
            <g className="font-mono text-[9px]">
              <circle cx="630" cy="245" r="3" fill="#059669" className={blinkState ? 'opacity-100' : 'opacity-60'} />
              <polyline points="630,245 660,195 740,195" stroke="#CBD5E1" strokeWidth="0.8" fill="none" />
              <text x="660" y="185" fill="#0F172A" fontWeight="600">
                TELEMETRY // GV-2048
              </text>
              <text x="660" y="198" fill="#059669">
                DIAGNOSTICS ARMED
              </text>
            </g>
          </motion.g>
        </svg>
      </motion.div>

      {/* Bottom Technical Status Ribbon */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: phase >= 3 ? 1 : 0, y: phase >= 3 ? 0 : 10 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl mt-4 pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] text-slate-500"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
          <span className="font-semibold text-slate-900 tracking-wider">SYSTEM READY</span>
          <span className="text-slate-300">|</span>
          <span>STATION 01</span>
        </div>

        <div className="flex items-center gap-4 text-[10px] text-slate-400">
          <span>LATENCY: 12ms</span>
          <span className="hidden sm:inline">FREQ: 144Hz</span>
          <span className="text-slate-900 font-semibold">APEX ENGINE v4.2</span>
        </div>
      </motion.div>
    </div>
  );
};
