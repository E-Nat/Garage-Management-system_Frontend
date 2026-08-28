import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { VehicleIllustration } from './VehicleIllustration';

interface GarageAnimationProps {
  onPhaseChange?: (phase: number) => void;
}

export const GarageAnimation: React.FC<GarageAnimationProps> = ({ onPhaseChange }) => {
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<number>(prefersReducedMotion ? 5 : 1);
  const [mouseOffset, setMouseOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 5-Phase Garage Initialization Timeline
  useEffect(() => {
    if (prefersReducedMotion) {
      setPhase(5);
      if (onPhaseChange) onPhaseChange(5);
      return;
    }

    // Phase 1 (0-500ms): System Wake
    setPhase(1);
    if (onPhaseChange) onPhaseChange(1);

    // Phase 2 (500-1200ms): Diagnostic Scan
    const t2 = setTimeout(() => {
      setPhase(2);
      if (onPhaseChange) onPhaseChange(2);
    }, 500);

    // Phase 3 (1200-1800ms): System Ready
    const t3 = setTimeout(() => {
      setPhase(3);
      if (onPhaseChange) onPhaseChange(3);
    }, 1200);

    // Phase 4 (1800-2400ms): Login Reveal
    const t4 = setTimeout(() => {
      setPhase(4);
      if (onPhaseChange) onPhaseChange(4);
    }, 1800);

    // Phase 5 (>2400ms): Idle Telemetry State
    const t5 = setTimeout(() => {
      setPhase(5);
      if (onPhaseChange) onPhaseChange(5);
    }, 2400);

    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [prefersReducedMotion, onPhaseChange]);

  // Subtle Mouse Parallax Handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const normalizedX = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const normalizedY = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    setMouseOffset({
      x: Math.max(-1, Math.min(1, normalizedX)),
      y: Math.max(-1, Math.min(1, normalizedY)),
    });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-full flex flex-col justify-between bg-[#F7F7F5] border-r border-[#EBEBE8] overflow-hidden"
    >
      {/* Top Architectural Header */}
      <div className="p-8 pb-0 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#111111] flex items-center justify-center text-white shadow-xs">
            <span className="font-mono text-xs font-bold text-[#10B981]">AG</span>
          </div>
          <div>
            <h2 className="text-xs font-mono font-bold tracking-[0.2em] text-[#111111] uppercase">
              GARAGE MANAGEMENT SYSTEM
            </h2>
            <span className="text-[10px] font-mono text-slate-500 tracking-wider">
              PRECISION AUTOMOTIVE WORKSHOP SUITE
            </span>
          </div>
        </div>

        {/* Phase 3+ Status Pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: phase >= 3 ? 1 : 0, scale: phase >= 3 ? 1 : 0.95 }}
          transition={{ duration: 0.4 }}
          className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white border border-[#E2E8F0] rounded-full shadow-xs text-[10px] font-mono"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
          <span className="font-semibold text-slate-900">SYSTEM READY</span>
        </motion.div>
      </div>

      {/* Center Automotive Visualization Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <VehicleIllustration phase={phase} mouseOffset={mouseOffset} />
      </div>

      {/* Subtle Bottom Technical Footer */}
      <div className="p-8 pt-0 flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-[#EBEBE8]/60 pt-4 z-20">
        <span>SECURITY PROTOCOL // TLS 1.3 / AES-256</span>
        <span className="hidden md:inline">SYSTEM TERMINAL ID: AG-WS-842</span>
      </div>
    </div>
  );
};
