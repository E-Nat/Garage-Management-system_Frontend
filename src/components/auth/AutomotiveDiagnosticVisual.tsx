import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Car, Gauge, Wrench, ShieldCheck, Lock } from 'lucide-react';

interface AutomotiveDiagnosticVisualProps {
  activeField?: 'email' | 'password' | null;
  isLoading?: boolean;
}

export const AutomotiveDiagnosticVisual: React.FC<AutomotiveDiagnosticVisualProps> = ({
  activeField,
  isLoading = false,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const easeCurve = [0.16, 1, 0.3, 1] as const;

  const isPasswordFocused = activeField === 'password';
  const isEmailFocused = activeField === 'email';

  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center p-8 lg:p-12 xl:p-16 bg-[#FAFAF9] border-r border-[#ECECEB] select-none overflow-hidden">
      {/* 1. Precision Engineering Coordinate Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #0F172A 1px, transparent 1px), linear-gradient(to bottom, #0F172A 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* 2. Hero Stage: Dynamic Ambient Aura & Automotive Blueprint */}
      <div className="relative w-full max-w-xl mx-auto z-10 flex flex-col items-center">
        {/* Soft Volumetric Ambient Breathing Glow */}
        <motion.div
          animate={
            prefersReducedMotion
              ? {}
              : {
                  opacity: isEmailFocused || isLoading ? [0.65, 0.95, 0.65] : [0.35, 0.6, 0.35],
                  scale: isEmailFocused || isLoading ? [1, 1.04, 1] : [1, 1.02, 1],
                }
          }
          transition={{ duration: isLoading ? 1.5 : 4.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 -inset-x-10 rounded-full pointer-events-none blur-3xl transition-colors duration-700"
          style={{
            background: isPasswordFocused
              ? 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.12) 0%, rgba(251, 146, 60, 0.04) 50%, transparent 75%)'
              : 'radial-gradient(ellipse at center, rgba(255, 107, 0, 0.15) 0%, rgba(255, 107, 0, 0.03) 55%, transparent 75%)',
          }}
        />

        {/* Floating Diagnostic Telemetry Labels (Top) */}
        <div className="w-full flex items-center justify-between px-2 mb-3.5 z-20">
          {/* Node 1: Vehicle */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: easeCurve }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] backdrop-blur-xs transition-all duration-300 ${
              isEmailFocused
                ? 'bg-orange-50/95 text-[#FF6B00] border border-orange-200/90 shadow-xs font-semibold ring-2 ring-orange-500/10'
                : 'bg-white/85 text-slate-600 border border-[#ECECEB] font-medium shadow-2xs'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                isEmailFocused ? 'bg-[#FF6B00] animate-pulse' : 'bg-slate-400'
              }`}
            />
            <Car className="w-3.5 h-3.5" />
            <span className="tracking-tight">Vehicle: Chassis & Powertrain</span>
          </motion.div>

          {/* Node 2: Diagnostics */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.06, ease: easeCurve }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] backdrop-blur-xs transition-all duration-300 ${
              isEmailFocused || isLoading
                ? 'bg-orange-50/95 text-[#FF6B00] border border-orange-200/90 shadow-xs font-semibold ring-2 ring-orange-500/10'
                : 'bg-white/85 text-slate-600 border border-[#ECECEB] font-medium shadow-2xs'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                isEmailFocused || isLoading ? 'bg-[#FF6B00] animate-pulse' : 'bg-slate-400'
              }`}
            />
            <Gauge className="w-3.5 h-3.5" />
            <span className="tracking-tight">Diagnostics: Sensor Array</span>
          </motion.div>
        </div>

        {/* Center Vehicle Blueprint Canvas */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: easeCurve }}
          className="relative w-full bg-white/95 border border-[#ECECEB] rounded-3xl p-6 sm:p-8 shadow-sm overflow-hidden backdrop-blur-xs"
        >
          {/* Volumetric Laser Scanner Sweep with Luminous Veil */}
          {!prefersReducedMotion && (
            <motion.div
              initial={{ left: '0%' }}
              animate={{
                left: isLoading
                  ? ['0%', '100%']
                  : isEmailFocused
                  ? ['0%', '100%', '0%']
                  : ['0%', '100%', '0%'],
              }}
              transition={{
                duration: isLoading ? 1.0 : isEmailFocused ? 3.0 : 5.5,
                repeat: isLoading ? 1 : Infinity,
                ease: 'easeInOut',
              }}
              className="absolute top-0 bottom-0 w-24 -ml-12 pointer-events-none z-20 flex items-center justify-center"
            >
              {/* Soft Gradient Light Veil */}
              <div className="w-full h-full bg-gradient-to-r from-transparent via-[#FF6B00]/8 to-transparent" />
              {/* High-Precision Laser Line */}
              <div className="absolute top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-[#FF6B00] to-transparent shadow-[0_0_8px_rgba(255,107,0,0.8)]" />
              {/* Top & Bottom Flare Beacons */}
              <div className="absolute top-4 w-2 h-2 rounded-full bg-[#FF6B00] blur-[1px] opacity-80" />
              <div className="absolute bottom-4 w-2 h-2 rounded-full bg-[#FF6B00] blur-[1px] opacity-80" />
            </motion.div>
          )}

          {/* Precision Automotive Silhouette SVG */}
          <div className="relative w-full aspect-[16/7] flex items-center justify-center">
            <svg
              viewBox="0 0 540 180"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto overflow-visible"
            >
              {/* Architectural Datum Baseline */}
              <line
                x1="20"
                y1="145"
                x2="520"
                y2="145"
                stroke="#E2E8F0"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />

              {/* Center Axle Alignment Guidelines */}
              <line x1="135" y1="20" x2="135" y2="155" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="395" y1="20" x2="395" y2="155" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="2 2" />

              {/* Main Aerodynamic Monocoque Chassis Profile */}
              <motion.path
                d="M 40,135 
                   C 55,120 90,105 130,100 
                   C 160,98 200,100 230,95 
                   C 270,55 315,25 380,22 
                   C 435,20 475,50 495,85 
                   C 515,95 525,115 528,135 
                   L 460,135 
                   C 450,110 425,95 395,95 
                   C 365,95 340,110 330,135 
                   L 200,135 
                   C 190,110 165,95 135,95 
                   C 105,95 80,110 70,135 
                   Z"
                stroke={isPasswordFocused ? '#0F172A' : '#1E293B'}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={prefersReducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: easeCurve }}
              />

              {/* Window Glazing & Pillar Profile */}
              <motion.path
                d="M 245,90 C 280,60 315,35 375,32 C 420,30 450,55 470,88 Z"
                stroke="#64748B"
                strokeWidth="1.3"
                strokeLinecap="round"
                initial={prefersReducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: 0.12, ease: easeCurve }}
              />

              {/* Front LED Light Cluster */}
              <motion.path
                d="M 45,130 L 72,124"
                stroke="#FF6B00"
                strokeWidth="2.8"
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.25 }}
              />

              {/* Rear Tail Light Blade */}
              <motion.path
                d="M 515,115 L 526,125"
                stroke="#EF4444"
                strokeWidth="2.2"
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.25 }}
              />

              {/* Front Wheel Hub & Pulse Ring */}
              <circle cx="135" cy="135" r="26" stroke="#0F172A" strokeWidth="2" fill="#F8FAFC" />
              <circle cx="135" cy="135" r="11" stroke="#FF6B00" strokeWidth="1.5" fill="#FFF7ED" />
              <circle cx="135" cy="135" r="3.5" fill="#FF6B00" />

              {/* Rear Wheel Hub & Pulse Ring */}
              <circle cx="395" cy="135" r="26" stroke="#0F172A" strokeWidth="2" fill="#F8FAFC" />
              <circle cx="395" cy="135" r="11" stroke="#FF6B00" strokeWidth="1.5" fill="#FFF7ED" />
              <circle cx="395" cy="135" r="3.5" fill="#FF6B00" />

              {/* Interactive Telemetry Beacon Points */}
              {/* Engine Bay Telemetry Beacon */}
              <circle
                cx="95"
                cy="114"
                r="4.5"
                fill="#FF6B00"
                className={isEmailFocused ? 'animate-ping' : ''}
                opacity={isEmailFocused ? 0.9 : 0.5}
              />
              <circle cx="95" cy="114" r="2.2" fill="#FFFFFF" />

              {/* Cabin Sensor Beacon */}
              <circle
                cx="295"
                cy="62"
                r="4"
                fill={isPasswordFocused ? '#0F172A' : '#FF6B00'}
                opacity={0.65}
              />
              <circle cx="295" cy="62" r="2" fill="#FFFFFF" />
            </svg>
          </div>
        </motion.div>

        {/* Floating Diagnostic Telemetry Labels (Bottom) */}
        <div className="w-full flex items-center justify-between px-2 mt-3.5 z-20">
          {/* Node 3: Service */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: easeCurve }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] bg-white/85 text-slate-600 border border-[#ECECEB] font-medium shadow-2xs backdrop-blur-xs"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <Wrench className="w-3.5 h-3.5" />
            <span className="tracking-tight">Service: Active Bay Allocation</span>
          </motion.div>

          {/* Node 4: Quality / Encrypted State */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12, ease: easeCurve }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] backdrop-blur-xs transition-all duration-300 ${
              isPasswordFocused
                ? 'bg-slate-900 text-white border border-slate-800 shadow-xs font-semibold ring-2 ring-slate-900/10'
                : 'bg-white/85 text-slate-600 border border-[#ECECEB] font-medium shadow-2xs'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                isPasswordFocused ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'
              }`}
            />
            {isPasswordFocused ? <Lock className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            <span className="tracking-tight">
              {isPasswordFocused ? 'Security: Encrypted Session' : 'Quality: Pre-delivery Verified'}
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
