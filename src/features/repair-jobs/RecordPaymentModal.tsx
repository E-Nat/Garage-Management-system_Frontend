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
} from 'lucide-react';

interface RecordPaymentModalProps {
  job: RepairJob;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  job,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { invoices, paymentMethods, recordPayment, updateInvoiceStatus } = useGarage();
  const { currentUser } = useAuth();

  const inv = invoices.find((i) => i.repairJobId === job.id);
  const totalAmount = inv ? inv.totalAmount : (job.totalRepairCost || 0);

  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [selectedMethod, setSelectedMethod] = useState<string>('Cash');
  const [notes, setNotes] = useState<string>('Full payment recorded at pickup');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeMethods = paymentMethods.filter((m) => m.status === 'active');

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const staffName = currentUser?.name || 'Staff User';

    if (totalAmount <= 0) {
      setErrorMessage('Invoice total amount must be greater than $0 to record payment.');
      return;
    }

    const payResult = recordPayment({
      repairJobId: job.id,
      invoiceId: inv?.id,
      amount: totalAmount,
      date: paymentDate,
      method: selectedMethod,
      type: 'final',
      notes,
      recordedBy: staffName,
    });

    if (!payResult.success) {
      setErrorMessage(payResult.error || 'Failed to record payment.');
      return;
    }

    if (inv) {
      updateInvoiceStatus(inv.id, 'paid', selectedMethod);
    }

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-md w-full overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold tracking-tight">Record Full Payment</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmitPayment} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Job Info Summary */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Job Number:</span>
              <span className="font-bold font-mono text-slate-900">#{job.jobNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span className="font-bold text-slate-900">{job.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Vehicle:</span>
              <span className="font-semibold text-slate-800">
                {job.vehicleMake} {job.vehicleModel} ({job.licensePlate})
              </span>
            </div>
          </div>

          {/* Total Amount Card & Locked Amount Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-slate-500" />
              <span>Amount (Grand Total - Not Editable)</span>
            </label>
            <input
              type="text"
              value={`$${totalAmount.toFixed(2)}`}
              disabled
              readOnly
              className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold cursor-not-allowed select-none"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
              <span>Payment Method</span>
            </label>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-hidden"
              required
            >
              {activeMethods.length > 0 ? (
                activeMethods.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} {m.isDefault ? '(Default)' : ''}
                  </option>
                ))
              ) : (
                <option value="Cash">Cash</option>
              )}
            </select>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Payment Date</span>
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-hidden"
              required
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Record Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
