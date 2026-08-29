import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGarage } from '../../context/GarageContext';
import { INITIAL_REPAIR_JOBS } from '../../data/mockData';
import { CheckCircle2, Send, Car, ShieldCheck, Wrench, Calendar, Hash } from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { customers, vehicles, repairJobs } = useGarage();

  // Resolve matching Customer Profile
  const customerProfile = customers.find(
    (c) =>
      c.fullName.toLowerCase() === currentUser?.name?.toLowerCase() ||
      (c.phone && currentUser?.phone && c.phone.replace(/\D/g, '') === currentUser.phone.replace(/\D/g, ''))
  );

  // Filter vehicles strictly belonging to this customer
  const myVehicles = vehicles.filter(
    (v) =>
      (customerProfile && v.customerId === customerProfile.id) ||
      v.customerName.toLowerCase() === currentUser?.name?.toLowerCase()
  );

  // Find job associated with customer or fallback to active demo job
  const activeJob =
    repairJobs.find((j) => (customerProfile && j.customerId === customerProfile.id) || j.customerName === currentUser?.name || j.customerPhone === currentUser?.phone) ||
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
          <p className="text-sm text-slate-500 mt-0.5">Live service tracking and garage records for {currentUser?.name}</p>
        </div>

        <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-2.5">
          <Send className="w-4 h-4 text-sky-600 shrink-0" />
          <div className="text-xs">
            <div className="font-semibold text-slate-900">Telegram Updates</div>
            <div className="text-slate-500 text-[11px] font-mono">{currentUser?.telegramHandle || customerProfile?.telegramHandle || '@alex_sterling'}</div>
          </div>
        </div>
      </div>

      {/* Vehicle Live Status Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs font-mono text-slate-500">
              Order #{activeJob.jobNumber}
            </span>
            <h2 className="text-lg font-semibold text-slate-900 mt-0.5">
              {activeJob.vehicleMake} {activeJob.vehicleModel}
            </h2>
            <div className="text-xs text-slate-500 font-mono mt-0.5">
              Plate: {activeJob.licensePlate} • Technician: {activeJob.assignedMechanicName}
            </div>
          </div>

          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right">
            <div className="text-[10px] text-slate-500 font-medium uppercase">Est. Completion</div>
            <div className="text-xs font-semibold text-slate-900">{activeJob.estimatedCompletion}</div>
          </div>
        </div>

        {/* Live Stepper Bar */}
        <div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">
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
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
          <div className="text-xs font-semibold text-slate-700">
            Work Scope
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {activeJob.description}
          </p>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">Estimated Total:</span>
            <span className="text-base font-semibold text-slate-900">${activeJob.estimatedCost}.00</span>
          </div>
        </div>
      </div>

      {/* My Vehicles Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Car className="w-5 h-5 text-[#FF6B00]" />
              <span>My Vehicles ({myVehicles.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Registered vehicles connected to your Apex Garage account
            </p>
          </div>
        </div>

        {myVehicles.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50 space-y-2">
            <Car className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-500">No vehicles registered under your account yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myVehicles.map((veh) => {
              const activeVehJob = repairJobs.find(
                (j) => j.vehicleId === veh.id && j.status !== 'completed' && j.status !== 'delivered'
              );

              return (
                <div
                  key={veh.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 hover:border-slate-300 transition shadow-2xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {veh.brand} {veh.model}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-slate-900 text-white font-mono font-bold text-xs rounded">
                          {veh.plateNumber}
                        </span>
                        <span className="text-xs text-slate-600 font-medium">{veh.year}</span>
                        {veh.color && (
                          <span className="text-xs text-slate-500">• {veh.color}</span>
                        )}
                      </div>
                    </div>

                    {activeVehJob ? (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-amber-600" />
                        <span>In Service</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-mono">
                    <div>
                      <span className="text-slate-400 block font-sans">Mileage</span>
                      <span className="font-semibold text-slate-800">
                        {veh.mileage ? `${veh.mileage.toLocaleString()} km` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-sans">VIN</span>
                      <span className="font-semibold text-slate-800 truncate block" title={veh.vin}>
                        {veh.vin || 'Not specified'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
