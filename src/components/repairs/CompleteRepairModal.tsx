import React, { useState } from 'react';
import { useGarage } from '../../context/GarageContext';
import { useAuth } from '../../context/AuthContext';
import { RepairJob, UsedPart, PerformedService } from '../../types';
import {
  X,
  Wrench,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Package,
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
  const {
    inventory,
    services,
    discountReasons,
    itemDiscounts,
    discountCampaigns,
    adjustStockQuantity,
    updateRepairJobDetails,
    createInvoiceFromJob,
    updateRepairJobStatus,
  } = useGarage();
  const { currentUser } = useAuth();

  // State for Services Performed and Parts Used
  const [performedServices, setPerformedServices] = useState<PerformedService[]>(
    job.servicesPerformed || []
  );
  const [partsUsed, setPartsUsed] = useState<UsedPart[]>(job.partsUsed || []);

  // Selected inputs for adding service
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [serviceQty, setServiceQty] = useState(1);

  // Selected inputs for adding part
  const [partSource, setPartSource] = useState<'garage' | 'customer'>('garage');
  const [selectedPartId, setSelectedPartId] = useState('');
  const [customPartName, setCustomPartName] = useState('');
  const [partQty, setPartQty] = useState(1);

  // Discounts
  const [manualDiscountVal, setManualDiscountVal] = useState<number>(0);
  const [manualDiscountType, setManualDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [manualDiscountReason, setManualDiscountReason] = useState<string>('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().substring(0, 10);

  // Available active inventory parts
  const availableParts = inventory.filter((i) => (i.status === 'active' || !i.status) && i.stock > 0);
  const selectedPart = inventory.find((i) => i.id === selectedPartId);
  const selectedService = services.find((s) => s.id === selectedServiceId);

  // Active campaigns
  const activeCampaigns = discountCampaigns.filter(
    (c) => c.status === 'active' && todayStr >= c.startDate && todayStr <= c.endDate
  );

  // --- Handlers for Services ---
  const handleAddService = () => {
    setErrorMessage(null);
    if (!selectedService) {
      setErrorMessage('Please select a service.');
      return;
    }

    const lineGross = selectedService.basePrice * serviceQty;

    // Check automatic item discount
    const activeRules = itemDiscounts.filter(
      (d) => d.status === 'active' && todayStr >= d.startDate && todayStr <= d.endDate
    );
    const serviceRule = activeRules.find(
      (d) =>
        (d.targetType === 'service' || d.targetType === 'item') &&
        (d.targetId === selectedService.id || d.targetId === selectedService.name)
    );
    const catRule = activeRules.find(
      (d) => d.targetType === 'category' && d.targetId === selectedService.category
    );
    const rule = serviceRule || catRule;

    let autoDisc = 0;
    if (rule) {
      if (rule.discountType === 'percentage') {
        autoDisc = lineGross * (rule.discountValue / 100);
      } else {
        autoDisc = Math.min(lineGross, rule.discountValue * serviceQty);
      }
    }

    const newService: PerformedService = {
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      quantity: serviceQty,
      unitPrice: selectedService.basePrice,
      totalPrice: lineGross,
      itemDiscountAmount: autoDisc,
    };

    setPerformedServices([...performedServices, newService]);
    setSelectedServiceId('');
    setServiceQty(1);
  };

  const handleRemoveService = (index: number) => {
    setPerformedServices(performedServices.filter((_, idx) => idx !== index));
  };

  // --- Handlers for Parts ---
  const handleAddPart = () => {
    setErrorMessage(null);
    if (partQty <= 0) {
      setErrorMessage('Quantity must be greater than 0.');
      return;
    }

    if (partSource === 'customer') {
      const pName = selectedPart ? selectedPart.name : customPartName.trim();
      if (!pName) {
        setErrorMessage('Please select or enter the customer-provided part name.');
        return;
      }

      const newPart: UsedPart = {
        partId: selectedPart ? selectedPart.id : `cust-part-${Date.now()}`,
        partNumber: selectedPart ? selectedPart.partNumber : 'CUST-PROVIDED',
        partName: pName,
        quantity: partQty,
        unitPrice: 0,
        totalPrice: 0,
        isCustomerProvided: true,
        itemDiscountAmount: 0,
      };

      setPartsUsed([...partsUsed, newPart]);
      setSelectedPartId('');
      setCustomPartName('');
      setPartQty(1);
      return;
    }

    if (!selectedPart) {
      setErrorMessage('Please select a part from inventory.');
      return;
    }

    if (partQty > selectedPart.stock) {
      setErrorMessage(`Requested quantity (${partQty}) exceeds stock (${selectedPart.stock}).`);
      return;
    }

    const lineGross = selectedPart.unitPrice * partQty;

    // Automatic discount calculation
    const activeRules = itemDiscounts.filter(
      (d) => d.status === 'active' && todayStr >= d.startDate && todayStr <= d.endDate
    );
    const partRule = activeRules.find(
      (d) => d.targetType === 'item' && (d.targetId === selectedPart.id || d.targetId === selectedPart.partNumber)
    );
    const catRule = activeRules.find(
      (d) => d.targetType === 'category' && d.targetId === selectedPart.category
    );
    const rule = partRule || catRule;

    let autoDisc = 0;
    if (rule) {
      if (rule.discountType === 'percentage') {
        autoDisc = lineGross * (rule.discountValue / 100);
      } else {
        autoDisc = Math.min(lineGross, rule.discountValue * partQty);
      }
    }

    const newPart: UsedPart = {
      partId: selectedPart.id,
      partNumber: selectedPart.partNumber,
      partName: selectedPart.name,
      quantity: partQty,
      unitPrice: selectedPart.unitPrice,
      totalPrice: lineGross,
      isCustomerProvided: false,
      itemDiscountAmount: autoDisc,
    };

    setPartsUsed([...partsUsed, newPart]);
    setSelectedPartId('');
    setPartQty(1);
  };

  const handleRemovePart = (index: number) => {
    setPartsUsed(partsUsed.filter((_, idx) => idx !== index));
  };

  // --- Combine Services & Parts into Line Items ---
  const combinedLineItems = [
    ...performedServices.map((s) => ({
      name: s.serviceName,
      type: 'Service' as const,
      quantity: s.quantity,
      unitPrice: s.unitPrice,
      autoDiscount: s.itemDiscountAmount || 0,
      total: s.totalPrice - (s.itemDiscountAmount || 0),
    })),
    ...partsUsed.map((p) => ({
      name: p.partName,
      type: 'Part' as const,
      quantity: p.quantity,
      unitPrice: p.unitPrice,
      autoDiscount: p.itemDiscountAmount || 0,
      total: p.totalPrice - (p.itemDiscountAmount || 0),
    })),
  ];

  // Totals calculations
  const grossSubtotal = combinedLineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalAutoDiscounts = combinedLineItems.reduce((sum, item) => sum + item.autoDiscount, 0);
  const netLineSubtotal = Math.max(0, grossSubtotal - totalAutoDiscounts);

  // Manual Discount
  let manualDiscAmount = 0;
  if (manualDiscountVal > 0) {
    if (manualDiscountType === 'percentage') {
      manualDiscAmount = netLineSubtotal * (manualDiscountVal / 100);
    } else {
      manualDiscAmount = Math.min(netLineSubtotal, manualDiscountVal);
    }
  }
  const subtotalAfterManual = Math.max(0, netLineSubtotal - manualDiscAmount);

  // Campaign Discount
  let campaignDiscAmount = 0;
  let campaignObj = activeCampaigns.find((c) => c.id === selectedCampaignId);
  if (campaignObj) {
    if (campaignObj.discountType === 'percentage') {
      campaignDiscAmount = subtotalAfterManual * (campaignObj.discountValue / 100);
    } else {
      campaignDiscAmount = Math.min(subtotalAfterManual, campaignObj.discountValue);
    }
  }

  const grandTotal = Math.max(0, subtotalAfterManual - campaignDiscAmount);

  const handleProceedToConfirm = () => {
    setErrorMessage(null);
    if (combinedLineItems.length === 0) {
      setErrorMessage('Please add at least one service or part performed.');
      return;
    }
    if (manualDiscountVal > 0 && !manualDiscountReason.trim()) {
      setErrorMessage('Please select a reason for the manual discount.');
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmCompletion = () => {
    const staffName = currentUser?.name || 'Staff User';

    // 1. Deduct stock for parts used ONLY NOW
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

    // 2. Save job details
    updateRepairJobDetails(
      job.id,
      {
        servicesPerformed: performedServices,
        partsUsed,
        totalRepairCost: grandTotal,
        estimatedCost: grandTotal,
        completionDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      },
      staffName
    );

    // 3. Generate Invoice
    createInvoiceFromJob(
      job.id,
      0, // Tax handled in invoice
      manualDiscountVal,
      manualDiscountType,
      manualDiscountReason,
      selectedCampaignId
    );

    // 4. Update status to 'completed'
    updateRepairJobStatus(
      job.id,
      'completed',
      staffName,
      'Repair completed. Parts stock deducted and invoice generated.'
    );

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-2xl w-full my-6 overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold tracking-tight">Complete Repair — #{job.jobNumber}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!showConfirmation ? (
          <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. Services Performed */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-slate-900" />
                Add Services Performed
              </h3>
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-7">
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 outline-hidden"
                  >
                    <option value="">-- Select Service --</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (${s.basePrice.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    value={serviceQty}
                    onChange={(e) => setServiceQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-center outline-hidden"
                  />
                </div>
                <div className="col-span-3">
                  <button
                    type="button"
                    onClick={handleAddService}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Add Service</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Parts Used */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-slate-900" />
                  Add Parts Used
                </h3>
                {/* Part Source Toggle */}
                <div className="flex items-center gap-1 bg-white p-1 border border-slate-200 rounded-lg text-[11px]">
                  <span className="text-slate-400 font-medium px-1">Source:</span>
                  <button
                    type="button"
                    onClick={() => setPartSource('garage')}
                    className={`px-2 py-0.5 font-bold rounded transition ${
                      partSource === 'garage'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Garage Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartSource('customer')}
                    className={`px-2 py-0.5 font-bold rounded transition ${
                      partSource === 'customer'
                        ? 'bg-purple-700 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Customer Provided
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-7">
                  {partSource === 'garage' ? (
                    <select
                      value={selectedPartId}
                      onChange={(e) => setSelectedPartId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 outline-hidden"
                    >
                      <option value="">-- Choose Part from Inventory --</option>
                      {availableParts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stock: {p.stock}) — ${p.unitPrice.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Enter customer-provided part name..."
                      value={customPartName}
                      onChange={(e) => setCustomPartName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 outline-hidden"
                    />
                  )}
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    max={partSource === 'garage' ? selectedPart?.stock || 999 : 999}
                    value={partQty}
                    onChange={(e) => setPartQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-center outline-hidden"
                  />
                </div>
                <div className="col-span-3">
                  <button
                    type="button"
                    onClick={handleAddPart}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Add Part</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Combined Line Item Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                    <th className="p-2.5">Item / Service</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Unit Price</th>
                    <th className="p-2.5 text-right">Discount</th>
                    <th className="p-2.5 text-right">Total</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {performedServices.map((s, idx) => (
                    <tr key={`srv-${idx}`}>
                      <td className="p-2.5 font-medium text-slate-900">{s.serviceName}</td>
                      <td className="p-2.5">
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded">
                          Service
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-mono">{s.quantity}</td>
                      <td className="p-2.5 text-right font-mono">${s.unitPrice.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-mono text-emerald-600">
                        {s.itemDiscountAmount && s.itemDiscountAmount > 0
                          ? `-$${s.itemDiscountAmount.toFixed(2)}`
                          : '—'}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        ${(s.totalPrice - (s.itemDiscountAmount || 0)).toFixed(2)}
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveService(idx)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {partsUsed.map((p, idx) => (
                    <tr key={`prt-${idx}`}>
                      <td className="p-2.5 font-medium text-slate-900">{p.partName}</td>
                      <td className="p-2.5">
                        {p.isCustomerProvided ? (
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-bold rounded">
                            Customer Provided Part
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold rounded">
                            Garage Stock Part
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-center font-mono">{p.quantity}</td>
                      <td className="p-2.5 text-right font-mono">${p.unitPrice.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-mono text-emerald-600">
                        {p.itemDiscountAmount && p.itemDiscountAmount > 0
                          ? `-$${p.itemDiscountAmount.toFixed(2)}`
                          : '—'}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        ${(p.totalPrice - (p.itemDiscountAmount || 0)).toFixed(2)}
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemovePart(idx)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {combinedLineItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-xs text-slate-400 italic">
                        No services or parts added yet. Add items above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Discount Inputs */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Discounts & Campaign
              </h4>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-4">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    Manual Discount
                  </label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min="0"
                      value={manualDiscountVal}
                      onChange={(e) => setManualDiscountVal(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                    />
                    <select
                      value={manualDiscountType}
                      onChange={(e) => setManualDiscountType(e.target.value as any)}
                      className="px-1.5 py-1 bg-white border border-slate-200 rounded text-xs"
                    >
                      <option value="fixed">$</option>
                      <option value="percentage">%</option>
                    </select>
                  </div>
                </div>

                <div className="col-span-4">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    Discount Reason
                  </label>
                  <select
                    value={manualDiscountReason}
                    onChange={(e) => setManualDiscountReason(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                  >
                    <option value="">-- Select Reason --</option>
                    {discountReasons.map((r) => (
                      <option key={r.id} value={r.reason}>
                        {r.reason}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-4">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    Campaign Discount
                  </label>
                  <select
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                  >
                    <option value="">-- No Campaign --</option>
                    {activeCampaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.discountType === 'percentage' ? `${c.discountValue}%` : `$${c.discountValue}`})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Calculation Summary */}
            <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal:</span>
                <span className="font-mono">${netLineSubtotal.toFixed(2)}</span>
              </div>
              {manualDiscAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Manual Discount ({manualDiscountReason || 'Applied'}):</span>
                  <span className="font-mono">-${manualDiscAmount.toFixed(2)}</span>
                </div>
              )}
              {campaignDiscAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Campaign ({campaignObj?.name}):</span>
                  <span className="font-mono">-${campaignDiscAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-slate-800 text-sm font-bold">
                <span>Grand Total:</span>
                <span className="font-mono text-emerald-400">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedToConfirm}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition"
              >
                Proceed to Complete Repair
              </button>
            </div>
          </div>
        ) : (
          /* Short Confirmation Screen */
          <div className="p-5 space-y-4">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-amber-900 text-xs">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Confirm Repair Completion
              </h4>
              <p>
                Confirm completing repair for <strong>#{job.jobNumber}</strong>? This will deduct the used parts from inventory stock and generate the final invoice.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Services ({performedServices.length}):</span>
                <span>${performedServices.reduce((a, b) => a + b.totalPrice, 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Parts ({partsUsed.length}):</span>
                <span>${partsUsed.reduce((a, b) => a + b.totalPrice, 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Discounts Total:</span>
                <span>-${(totalAutoDiscounts + manualDiscAmount + campaignDiscAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-900 text-sm">
                <span>Grand Total:</span>
                <span className="text-emerald-700">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCompletion}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Complete</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
