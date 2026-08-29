import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGarage } from '../../context/GarageContext';
import { INITIAL_REPAIR_JOBS } from '../../data/mockData';
import { Invoice } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { CheckCircle2, Send, Car, ShieldCheck, Wrench, Calendar, Hash, Receipt, Download, X } from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { customers, vehicles, repairJobs, invoices } = useGarage();
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<Invoice | null>(null);

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

  // Filter invoices strictly belonging to this customer
  const myInvoices = invoices.filter(
    (inv) =>
      (customerProfile && (inv.customerId === customerProfile.id || inv.customerName.toLowerCase() === customerProfile.fullName.toLowerCase())) ||
      inv.customerName.toLowerCase() === currentUser?.name?.toLowerCase()
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
            <span className="text-base font-semibold text-slate-900">
              ${(Number(activeJob.totalRepairCost || activeJob.estimatedCost || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
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

      {/* My Invoices Section (Step 7) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#FF6B00]" />
              <span>My Invoices ({myInvoices.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Official electronic billing receipts and payment statements for your account
            </p>
          </div>
        </div>

        {myInvoices.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50 space-y-2">
            <Receipt className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-500">No invoices issued for your account yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {inv.id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">
                      {inv.vehicleInfo || 'Customer Vehicle'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {inv.issuedAt ? inv.issuedAt.substring(0, 10) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={inv.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      ${(inv.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoiceForModal(inv)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                      >
                        View Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Invoice Detail Modal */}
      {selectedInvoiceForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-8 overflow-hidden text-slate-900 space-y-6 p-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-slate-500 uppercase">
                  Official Electronic Invoice
                </span>
                <h3 className="text-xl font-bold text-slate-900 font-mono mt-0.5">
                  {selectedInvoiceForModal.id}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Issued: {selectedInvoiceForModal.issuedAt ? selectedInvoiceForModal.issuedAt.substring(0, 10) : 'Today'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedInvoiceForModal.status} />
                <button
                  onClick={() => setSelectedInvoiceForModal(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px] block">Customer</span>
                <span className="font-bold text-slate-900">{selectedInvoiceForModal.customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px] block">Vehicle</span>
                <span className="font-bold text-slate-900">{selectedInvoiceForModal.vehicleInfo}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-bold text-slate-900">
                  ${(selectedInvoiceForModal.subtotal || selectedInvoiceForModal.totalAmount || 0).toFixed(2)}
                </span>
              </div>
              {Boolean(selectedInvoiceForModal.itemDiscountsTotal || selectedInvoiceForModal.manualDiscountsTotal) && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discounts Applied:</span>
                  <span className="font-bold">
                    -${((selectedInvoiceForModal.itemDiscountsTotal || 0) + (selectedInvoiceForModal.manualDiscountsTotal || 0)).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-extrabold text-slate-900">
                <span>Total Amount:</span>
                <span>${(selectedInvoiceForModal.totalAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600 pt-1">
                <span>Payment Status:</span>
                <span className="uppercase font-bold">{selectedInvoiceForModal.status}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Print / Download</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoiceForModal(null)}
                className="px-4 py-2 bg-[#FF6B00] hover:bg-[#E56000] text-white text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
