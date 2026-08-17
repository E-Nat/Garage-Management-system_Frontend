import React, { useState } from 'react';
import { useGarage } from '../../context/GarageContext';
import { useAuth } from '../../context/AuthContext';
import { RepairJob } from '../../types';
import {
  X,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  CreditCard,
  Calendar,
  Car,
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
  const { invoices, paymentMethods, recordPayment, updateRepairJobStatus, updateInvoiceStatus } = useGarage();
  const { currentUser } = useAuth();

  // Find invoice
  const inv = invoices.find((i) => i.repairJobId === job.id);
  const totalAmount = inv ? inv.totalAmount : (job.totalRepairCost || 150);
  const initialPaid = inv ? inv.totalPaid : 0;
  const initialBalance = Math.max(0, totalAmount - initialPaid);

  // Payment states
  const [payAmount, setPayAmount] = useState<number>(initialBalance);
  const [selectedMethod, setSelectedMethod] = useState<string>('Cash');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [notes, setNotes] = useState<string>('Final payment upon vehicle delivery');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeMethods = paymentMethods.filter((m) => m.status === 'active');

  const handleConfirmDelivery = () => {
    setErrorMessage(null);

    const staffName = currentUser?.name || 'Staff User';

    // If there is an outstanding balance and user inputs pay amount
    if (initialBalance > 0 && payAmount > 0) {
      if (payAmount > initialBalance + 0.01) {
        setErrorMessage(`Payment amount ($${payAmount}) cannot exceed remaining balance ($${initialBalance.toFixed(2)}).`);
        return;
      }

      const payResult = recordPayment({
        repairJobId: job.id,
        invoiceId: inv?.id,
        amount: payAmount,
        date: paymentDate,
        method: selectedMethod,
        type: payAmount >= initialBalance ? 'final' : 'partial',
        notes,
        recordedBy: staffName,
      });

      if (!payResult.success) {
        setErrorMessage(payResult.error || 'Failed to record payment.');
        return;
      }
    }

    if (inv) {
      updateInvoiceStatus(inv.id, 'paid', selectedMethod);
    }

    // Move status to delivered
    updateRepairJobStatus(
      job.id,
      'delivered',
      staffName,
      `Vehicle handed back to customer. Final payment confirmed via ${selectedMethod}.`
    );

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full my-6 overflow-hidden text-slate-900 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-800 text-teal-300 rounded-xl">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Confirm Vehicle Delivery</h2>
              <p className="text-xs text-teal-200">Hand back vehicle to customer</p>
            </div>
          </div>
          <button onClick={onClose} className="text-teal-300 hover:text-white transition p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Job & Customer Summary */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Repair Job:</span>
              <span className="font-bold font-mono text-slate-900">#{job.jobNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span className="font-bold text-slate-900">{job.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Vehicle:</span>
              <span className="font-semibold text-slate-800">{job.vehicleMake} {job.vehicleModel} ({job.licensePlate})</span>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="p-3.5 bg-slate-900 text-white rounded-xl text-xs space-y-1 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Repair Amount:</span>
              <span className="font-bold text-white">${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Amount Already Paid:</span>
              <span className="text-emerald-400">${initialPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-1 font-bold text-sm">
              <span className="text-slate-300">Balance Remaining:</span>
              <span className={initialBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                ${initialBalance.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Input if Balance Remains */}
          {initialBalance > 0 ? (
            <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-slate-900" />
                Record Final Payment
              </h3>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Payment Amount ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:border-slate-900 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:border-slate-900 outline-hidden"
                >
                  {activeMethods.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                  <option value="Cash">Cash</option>
                  <option value="ABA Bank Transfer">ABA Bank Transfer</option>
                  <option value="Acleda Mobile">Acleda Mobile</option>
                  <option value="Credit / Debit Card">Credit / Debit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:border-slate-900 outline-hidden"
                />
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Job is fully paid (${totalAmount.toFixed(2)}). Ready for delivery confirmation.</span>
            </div>
          )}

          {/* Dialog Confirmation Note */}
          <p className="text-xs text-slate-500 leading-relaxed text-center">
            Clicking confirm will record vehicle delivery, mark status as <strong>Delivered</strong>, and finalize the repair order.
          </p>

          {/* Form Actions */}
          <div className="pt-2 flex justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelivery}
              className="px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-teal-300" />
              <span>Confirm Delivery</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
