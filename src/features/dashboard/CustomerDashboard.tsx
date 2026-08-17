import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGarage } from '../../context/GarageContext';
import { INITIAL_REPAIR_JOBS } from '../../data/mockData';
import { CheckCircle2, Send } from 'lucide-react';

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
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Customer Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Customer Portal</h1>
          <p className="text-sm text-slate-500 mt-0.5">Live service tracking and order status for {currentUser?.name}</p>
        </div>

        <div className="p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm flex items-center gap-2.5">
          <Send className="w-4 h-4 text-slate-500 shrink-0" />
          <div className="text-xs">
            <div className="font-medium text-slate-900">Telegram Updates</div>
            <div className="text-slate-400 text-[11px] font-mono">{currentUser?.telegramHandle || '@alex_sterling'}</div>
          </div>
        </div>
      </div>

      {/* Vehicle Live Status Card */}
      <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs font-mono text-slate-400">
              Order #{activeJob.jobNumber}
            </span>
            <h2 className="text-lg font-semibold text-slate-900 mt-0.5">
              {activeJob.vehicleMake} {activeJob.vehicleModel}
            </h2>
            <div className="text-xs text-slate-500 font-mono mt-0.5">
              Plate: {activeJob.licensePlate} • Technician: {activeJob.assignedMechanicName}
            </div>
          </div>

          <div className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-right">
            <div className="text-[10px] text-slate-400 font-medium uppercase">Est. Completion</div>
            <div className="text-xs font-semibold text-slate-900">{activeJob.estimatedCompletion}</div>
          </div>
        </div>

        {/* Live Stepper Bar */}
        <div>
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">
            Repair Order Progress
          </div>
          <div className="grid grid-cols-5 gap-2 relative">
            {stages.map((stg, idx) => {
              const isPassed = idx <= currentStageIdx;
              const isCurrent = idx === currentStageIdx;
              return (
                <div key={stg.key} className="flex flex-col items-center text-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs mb-2 transition-all ${
                      isCurrent
                        ? 'bg-[#FF6B00] text-white ring-2 ring-[#FFF1E8]'
                        : isPassed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={`text-xs ${isCurrent ? 'text-slate-900 font-semibold' : isPassed ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                    {stg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Repair Description & Estimate breakdown */}
        <div className="p-4 bg-slate-50/75 rounded-lg border border-slate-100 space-y-3">
          <div className="text-xs font-medium text-slate-700">
            Work Scope
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {activeJob.description}
          </p>

          <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
            <span className="text-slate-500">Estimated Total:</span>
            <span className="text-base font-semibold text-slate-900">${activeJob.estimatedCost}.00</span>
          </div>
        </div>
      </div>
    </div>
  );
};
