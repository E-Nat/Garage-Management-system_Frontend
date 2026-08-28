import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Car, Gauge, Wrench, CheckCircle2, ArrowRight } from 'lucide-react';

interface GarageWorkflowVisualProps {
  activeField?: 'email' | 'password' | null;
}

export const GarageWorkflowVisual: React.FC<GarageWorkflowVisualProps> = ({ activeField }) => {
  const prefersReducedMotion = useReducedMotion();

  // Natural high-performance easing curve
  const easeCurve = [0.16, 1, 0.3, 1] as const;

  const workflowSteps = [
    {
      id: 'vehicle',
      step: '01',
      phase: 'VEHICLE INTAKE',
      title: 'Digital Arrival & VIN Scan',
      meta: 'VIN: APX-9840',
      icon: Car,
      active: !activeField,
    },
    {
      id: 'inspection',
      step: '02',
      phase: 'INSPECTION',
      title: 'Diagnostic & Safety Check',
      meta: 'TELEMETRY: OPTIMAL',
      icon: Gauge,
      active: activeField === 'email',
    },
    {
      id: 'repair',
      step: '03',
      phase: 'SERVICE BAY',
      title: 'Active Bay & Parts Dispatch',
      meta: 'BAY 04: ARMED',
      icon: Wrench,
      active: activeField === 'password',
    },
    {
      id: 'ready',
      step: '04',
      phase: 'READY & QA',
      title: 'Quality Test & Handover',
      meta: 'STATUS: VERIFIED',
      icon: CheckCircle2,
      active: false,
    },
  ];

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 lg:p-12 xl:p-14 bg-[#FAFAF9] border-r border-[#ECECEB] select-none overflow-hidden">
      {/* 1. Top Technical Header */}
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: easeCurve }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center text-[#EA580C] shadow-2xs font-mono font-bold text-xs">
            APX
          </div>
          <div>
            <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase block">
              WORKFLOW ORCHESTRATION
            </span>
            <span className="text-xs font-bold text-slate-900">
              GARAGE LIFECYCLE PIPELINE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1 bg-white border border-[#ECECEB] rounded-md text-[10px] font-mono text-slate-600 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
          <span>STATION 01 // ACTIVE</span>
        </div>
      </motion.div>

      {/* 2. Main Center Stage: Technical Vehicle Blueprint + Connected Workflow Stream */}
      <div className="my-auto py-6 max-w-[480px] w-full mx-auto">
        {/* Minimal Blueprint Schematic Box */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.08, ease: easeCurve }}
          className="bg-white border border-[#ECECEB] rounded-2xl p-5 shadow-2xs mb-6 relative overflow-hidden"
        >
          {/* Header readout */}
          <div className="flex items-center justify-between mb-3 border-b border-[#F4F4F3] pb-2.5 font-mono text-[10px]">
            <span className="text-slate-400 font-medium">CHASSIS BLUEPRINT // GV-GT</span>
            <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50">
              BAY SENSORS READY
            </span>
          </div>

          {/* SVG Vehicle Wireframe Outline (One-shot entrance draw, then fully static) */}
          <svg
            viewBox="0 0 460 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto my-1"
          >
            {/* Aerodynamic Monocoque Body Profile */}
            <motion.path
              d="M 30,105 
                 C 45,95 75,82 110,78 
                 C 140,75 170,78 195,75 
                 C 230,42 270,18 325,16 
                 C 370,14 405,38 425,65 
                 C 440,72 450,88 452,105 
                 L 395,105 
                 C 385,85 365,72 340,72 
                 C 315,72 295,85 285,105 
                 L 175,105 
                 C 165,85 145,72 120,72 
                 C 95,72 75,85 65,105 
                 Z"
              stroke="#0F172A"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={prefersReducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.65, ease: easeCurve }}
            />

            {/* Greenhouse Window Profile */}
            <motion.path
              d="M 205,72 C 235,48 265,28 318,25 C 358,23 385,45 402,70 Z"
              stroke="#64748B"
              strokeWidth="1.2"
              strokeLinecap="round"
              initial={prefersReducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.12, ease: easeCurve }}
            />

            {/* Precision Wheels */}
            <circle cx="120" cy="105" r="21" stroke="#0F172A" strokeWidth="1.8" fill="#FAFAF9" />
            <circle cx="120" cy="105" r="8" stroke="#EA580C" strokeWidth="1.4" fill="#FFF7ED" />

            <circle cx="340" cy="105" r="21" stroke="#0F172A" strokeWidth="1.8" fill="#FAFAF9" />
            <circle cx="340" cy="105" r="8" stroke="#EA580C" strokeWidth="1.4" fill="#FFF7ED" />

            {/* Ground Grid Datum */}
            <line x1="15" y1="115" x2="445" y2="115" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
          </svg>

          {/* Minimal Metric Readouts */}
          <div className="mt-2 pt-2.5 border-t border-[#F4F4F3] flex items-center justify-between font-mono text-[10px] text-slate-500">
            <span>DIMENSIONS: 4,820 × 1,920 MM</span>
            <span className="text-slate-800 font-semibold">BAY CAPACITY: 8/8 BAYS</span>
          </div>
        </motion.div>

        {/* 3. 4-Stage Workflow Progression (Vehicle -> Inspection -> Repair -> Ready) */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.16, ease: easeCurve }}
          className="space-y-2"
        >
          {workflowSteps.map((item, idx) => {
            const Icon = item.icon;
            const isHighlight = item.active;

            return (
              <div
                key={item.id}
                className={`px-4 py-3 rounded-xl border transition-all duration-150 flex items-center justify-between ${
                  isHighlight
                    ? 'bg-white border-orange-300 ring-1 ring-orange-200/60 shadow-2xs'
                    : 'bg-white/70 border-[#ECECEB] hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors ${
                      isHighlight
                        ? 'bg-[#EA580C] text-white shadow-2xs'
                        : 'bg-[#F4F4F3] text-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 leading-none">
                        {item.phase}
                      </span>
                      <span className="font-mono text-[9px] text-slate-400 font-medium">
                        {item.step}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5 leading-none">
                      {item.title}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] text-slate-400 bg-slate-50 border border-slate-200/70 px-1.5 py-0.5 rounded">
                    {item.meta}
                  </span>
                  {idx < 3 ? (
                    <ArrowRight className="w-3 h-3 text-slate-300" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* 4. Bottom Technical Status Bar */}
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.25 }}
        className="pt-4 border-t border-[#ECECEB] flex items-center justify-between text-[11px] font-mono text-slate-400"
      >
        <span>GARAGE OS // SECURE WORKSTATION</span>
        <span>LATENCY: 12MS</span>
      </motion.div>
    </div>
  );
};
