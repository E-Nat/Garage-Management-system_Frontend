import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGarage } from '../../context/GarageContext';
import { INITIAL_REPAIR_JOBS } from '../../data/mockData';
import { Car, CheckCircle2, Send } from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { repairJobs } = useGarage();

  // Find job associated with customer or fallback to active demo job
  const activeJob =
    repairJobs.find((j) => j.customerName === currentUser?.name || j.customerPhone === currentUser?.phone) ||
    repairJobs[0] ||
    INITIAL_REPAIR_JOBS[0];

  const stages = [
    { key: 'pending_inspection', label: 'Inspection' },
    { key: 'waiting_approval', label: 'Approval' },
    { key: 'in_progress', label: 'In Repair' },
    { key: 'completed', label: 'Completed' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const getStageIndex = (status: string) => {
    switch (status) {
      case 'pending_inspection': return 0;
      case 'waiting_approval': return 1;
      case 'in_progress': return 2;
      case 'completed': return 3;
      case 'delivered': return 4;
      case 'declined': return 1;
      default: return 0;
    }
  };

  const currentStageIdx = getStageIndex(activeJob.status);

  return (
    <div className="space-y-6 text-slate-900">
      {/* Customer Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 text-slate-900 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Hello, {currentUser?.name}!</h1>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
          <Send className="w-5 h-5 text-slate-700 shrink-0" />
          <div className="text-xs">
            <div className="font-bold text-slate-900">Telegram Notifications</div>
            <div className="text-slate-500 text-[11px] font-mono">{currentUser?.telegramHandle || '@alex_sterling'}</div>
          </div>
        </div>
      </div>

      {/* Vehicle Live Status Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Active Service Order #{activeJob.jobNumber}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
              {activeJob.vehicleMake} {activeJob.vehicleModel}
            </h2>
            <div className="text-xs text-slate-500 font-mono mt-0.5">
              License Plate: {activeJob.licensePlate} • Technician: {activeJob.assignedMechanicName}
            </div>
          </div>

          <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-2xl text-right">
            <div className="text-[10px] text-emerald-800 font-semibold uppercase">Estimated Completion</div>
            <div className="text-sm font-bold text-emerald-900">{activeJob.estimatedCompletion}</div>
          </div>
        </div>

        {/* Live Stepper Bar */}
        <div className="my-8">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Live Repair Progress Tracker
          </div>
          <div className="grid grid-cols-5 gap-2 relative">
            {stages.map((stg, idx) => {
              const isPassed = idx <= currentStageIdx;
              const isCurrent = idx === currentStageIdx;
              return (
                <div key={stg.key} className="flex flex-col items-center text-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-all ${
                      isCurrent
                        ? 'bg-slate-900 text-white ring-4 ring-slate-200 scale-105'
                        : isPassed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                  </div>
                  <span className={`text-xs font-semibold ${isCurrent ? 'text-slate-900 font-bold' : isPassed ? 'text-slate-800' : 'text-slate-400'}`}>
                    {stg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Repair Description & Estimate breakdown */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Approved Work Scope
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {activeJob.description}
          </p>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">Estimated Invoice Total:</span>
            <span className="text-lg font-extrabold text-slate-900">${activeJob.estimatedCost}.00</span>
          </div>
        </div>
      </div>
    </div>
  );
};
