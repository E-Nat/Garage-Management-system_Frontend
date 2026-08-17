import React, { useState } from 'react';
import { useGarage } from '../../context/GarageContext';
import { useAuth } from '../../context/AuthContext';
import { RepairJob, UsedPart } from '../../types';
import {
  X,
  Wrench,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Package,
  Calculator,
} from 'lucide-react';

interface CompleteRepairModalProps {
  job: RepairJob;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CompleteRepairModal: React.FC<CompleteRepairModalProps> = ({
  job,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { inventory, adjustStockQuantity, updateRepairJobDetails, createInvoiceFromJob, updateRepairJobStatus } = useGarage();
  const { currentUser } = useAuth();

  // State for parts used
  const [partsUsed, setPartsUsed] = useState<UsedPart[]>(job.partsUsed || []);
  const [laborCost, setLaborCost] = useState<number>(job.laborCost || 120);
  const [inspectionFee, setInspectionFee] = useState<number>(job.inspectionFee ?? 20);

  // Selected new part state
  const [selectedPartId, setSelectedPartId] = useState('');
  const [inputQuantity, setInputQuantity] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Confirmation dialog
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!isOpen) return null;

  // Active inventory items
  const availableParts = inventory.filter((i) => (i.status === 'active' || !i.status) && i.stock > 0);
  const selectedPart = inventory.find((i) => i.id === selectedPartId);

  // Calculations
  const partsTotal = partsUsed.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);
  const grandTotal = inspectionFee + partsTotal + laborCost;

  const handleAddPartRow = () => {
    setErrorMessage(null);

    if (!selectedPartId) {
      setErrorMessage('Please select a spare part from inventory.');
      return;
    }

    if (!selectedPart) {
      setErrorMessage('Selected part does not exist.');
      return;
    }

    if (inputQuantity <= 0) {
      setErrorMessage('Quantity used must be greater than 0.');
      return;
    }

    // Check available stock rule
    if (inputQuantity > selectedPart.stock) {
      setErrorMessage(
        `Quantity requested (${inputQuantity}) exceeds available inventory stock (${selectedPart.stock} ${selectedPart.unit || 'units'}).`
      );
      return;
    }

    // Check if part already added
    const existingIndex = partsUsed.findIndex((p) => p.partId === selectedPart.id);
    if (existingIndex >= 0) {
      const existing = partsUsed[existingIndex];
      const newQty = existing.quantity + inputQuantity;
      if (newQty > selectedPart.stock) {
        setErrorMessage(
          `Total quantity (${newQty}) exceeds available inventory stock (${selectedPart.stock} units).`
        );
        return;
      }

      const updated = [...partsUsed];
      updated[existingIndex] = {
        ...existing,
        quantity: newQty,
        totalPrice: newQty * existing.unitPrice,
      };
      setPartsUsed(updated);
    } else {
      const newPartRow: UsedPart = {
        partId: selectedPart.id,
        partNumber: selectedPart.partNumber,
        partName: selectedPart.name,
        quantity: inputQuantity,
        unitPrice: selectedPart.unitPrice,
        totalPrice: inputQuantity * selectedPart.unitPrice,
        isCustomerProvided: false,
      };
      setPartsUsed([...partsUsed, newPartRow]);
    }

    // Reset selection
    setSelectedPartId('');
    setInputQuantity(1);
  };

  const handleRemovePartRow = (index: number) => {
    setPartsUsed(partsUsed.filter((_, idx) => idx !== index));
  };

  const handleProceedToConfirm = () => {
    setErrorMessage(null);
    setShowConfirmation(true);
  };

  const handleConfirmCompletion = () => {
    const staffName = currentUser?.name || 'Staff User';

    // 1. Deduct stock from inventory for used parts
    partsUsed.forEach((p) => {
      if (!p.isCustomerProvided && p.quantity > 0) {
        adjustStockQuantity(
          p.partId,
          -p.quantity,
          'usage',
          `Part deduction for completed Repair Job ${job.jobNumber}`,
          staffName
        );
      }
    });

    // 2. Save job details (parts used, labor cost, total repair cost)
    updateRepairJobDetails(
      job.id,
      {
        partsUsed,
        laborCost,
        inspectionFee,
        totalRepairCost: grandTotal,
        estimatedCost: grandTotal,
        completionDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      },
      staffName
    );

    // 3. Generate Invoice
    createInvoiceFromJob(job.id);

    // 4. Update status to 'completed'
    updateRepairJobStatus(
      job.id,
      'completed',
      staffName,
      `Repair work completed. Inventory stock deducted and final invoice generated.`
    );

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full my-6 overflow-hidden text-slate-900 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Complete Repair Job #{job.jobNumber}</h2>
              <p className="text-xs text-slate-400">Record parts used, service fee, and calculate final total</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!showConfirmation ? (
          <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. Parts Used Input */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-slate-900" />
                1. Parts Used & Quantity
              </h3>

              {/* Add Part Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                <div className="sm:col-span-6">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Select Spare Part
                  </label>
                  <select
                    value={selectedPartId}
                    onChange={(e) => setSelectedPartId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:border-slate-900 outline-hidden"
                  >
                    <option value="">-- Choose Part from Inventory --</option>
                    {availableParts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.partNumber}) — Stock: {p.stock} | ${p.unitPrice.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Qty Used {selectedPart && <span className="text-slate-400 font-normal">(Max {selectedPart.stock})</span>}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedPart?.stock || 999}
                    value={inputQuantity}
                    onChange={(e) => setInputQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:border-slate-900 outline-hidden"
                  />
                </div>

                <div className="sm:col-span-3">
                  <button
                    type="button"
                    onClick={handleAddPartRow}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>Add Part</span>
                  </button>
                </div>
              </div>

              {/* Added Parts Table */}
              {partsUsed.length > 0 ? (
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mt-2">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                        <th className="p-2">Part Name</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2 text-right">Unit Price</th>
                        <th className="p-2 text-right">Subtotal</th>
                        <th className="p-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {partsUsed.map((p, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-semibold text-slate-900">{p.partName}</td>
                          <td className="p-2 text-center font-mono font-bold">{p.quantity}</td>
                          <td className="p-2 text-right font-mono">${p.unitPrice.toFixed(2)}</td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">
                            ${(p.quantity * p.unitPrice).toFixed(2)}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemovePartRow(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
                        <td colSpan={3} className="p-2 text-right uppercase text-[11px]">Parts Total:</td>
                        <td className="p-2 text-right font-mono text-emerald-700">${partsTotal.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic bg-white p-3 border border-slate-200 rounded-lg">
                  No parts added yet. Select a part above if spare parts were used during the repair.
                </p>
              )}
            </div>

            {/* 2. Service & Fee Input */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-slate-900" />
                2. Service & Labor Fees
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Inspection Fee ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={inspectionFee}
                    onChange={(e) => setInspectionFee(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:border-slate-900 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Repair / Service Fee ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={laborCost}
                    onChange={(e) => setLaborCost(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:border-slate-900 outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Total Summary */}
            <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Calculated Grand Total:</span>
              </div>
              <span className="text-xl font-extrabold font-mono text-emerald-400">
                ${grandTotal.toFixed(2)}
              </span>
            </div>

            {/* Form Actions */}
            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedToConfirm}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Complete Repair & Generate Invoice</span>
              </button>
            </div>
          </div>
        ) : (
          /* Confirmation Screen */
          <div className="p-6 space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-900">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span>Confirmation Required</span>
              </div>
              <p className="text-xs leading-relaxed">
                Complete Repair? This will record the parts used, deduct the quantities from inventory, calculate the final amount (<strong>${grandTotal.toFixed(2)}</strong>), and generate the invoice.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Inspection Fee:</span>
                <span>${inspectionFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Parts Total ({partsUsed.length} items):</span>
                <span>${partsTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Repair / Service Fee:</span>
                <span>${laborCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-900">
                <span>Grand Total:</span>
                <span className="text-emerald-700">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCompletion}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Yes, Confirm & Complete</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
