import React from 'react';
import { useGarage } from '../../context/GarageContext';
import { useAuth } from '../../context/AuthContext';
import { RepairJob } from '../../types';
import {
  X,
  CheckCircle2,
  Car,
  User,
  Calendar,
  FileText,
} from 'lucide-react';

interface DeliverVehicleModalProps {
  job: RepairJob;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeliverVehicleModal: React.FC<DeliverVehicleModalProps> = ({
  job,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { invoices, updateRepairJobStatus } = useGarage();
  const { currentUser } = useAuth();

  if (!isOpen) return null;

  const inv = invoices.find((i) => i.repairJobId === job.id);

  const handleConfirmDelivery = () => {
    const staffName = currentUser?.name || 'Staff User';

    updateRepairJobStatus(
      job.id,
      'delivered',
      staffName,
      `Vehicle successfully delivered to customer ${job.customerName}.`
    );

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-md w-full overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Car className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold tracking-tight">Mark Vehicle as Delivered</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Confirmation Box */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-0.5">Payment Confirmed (PAID)</p>
              <p className="text-[11px] text-emerald-800">
                You are about to complete vehicle handover to the customer and mark this job as Delivered.
              </p>
            </div>
          </div>

          {/* Details card */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Job Number:
              </span>
              <span className="font-mono font-bold text-slate-900">#{job.jobNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Customer:
              </span>
              <span className="font-bold text-slate-900">{job.customerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-slate-400" />
                Vehicle:
              </span>
              <span className="font-semibold text-slate-800">
                {job.vehicleMake} {job.vehicleModel} ({job.licensePlate})
              </span>
            </div>
            {inv && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Invoice Paid:</span>
                <span className="font-mono font-bold text-emerald-700">
                  ${inv.totalAmount.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelivery}
              className="px-4 py-2 font-semibold text-white bg-[#FF6B00] hover:bg-[#E56000] rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Confirm Vehicle Delivered</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
