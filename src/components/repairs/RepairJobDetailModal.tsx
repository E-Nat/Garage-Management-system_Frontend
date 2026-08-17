import React, { useState, useEffect } from 'react';
import { useGarage } from '../../context/GarageContext';
import { useAuth } from '../../context/AuthContext';
import { RepairJob, UsedPart, PerformedService } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { JobTypeBadge } from '../common/JobTypeBadge';
import { RecordPaymentModal } from './RecordPaymentModal';
import {
  X,
  CheckCircle2,
  XCircle,
  Receipt,
  AlertCircle,
  Plus,
  Trash2,
  CreditCard,
  Car,
  Printer,
  Tag,
  Send,
} from 'lucide-react';

interface RepairJobDetailModalProps {
  job: RepairJob;
  isOpen: boolean;
  onClose: () => void;
}

export const RepairJobDetailModal: React.FC<RepairJobDetailModalProps> = ({
  job: initialJob,
  isOpen,
  onClose,
}) => {
  const {
    repairJobs,
    inventory,
    services,
    invoices,
    paymentRecords,
    discountCampaigns,
    discountReasons,
    paymentMethods,
    roleDiscountPermissions,
    updateRepairJobStatus,
    updateRepairJobDetails,
    addInspectionRecord,
    createInvoiceFromJob,
    recordPayment,
    updateInvoiceStatus,
    updateInvoiceDiscounts,
    reassignMechanic,
    adjustStockQuantity,
    createRepairJob,
  } = useGarage();
  const { currentUser, users } = useAuth();

  const mechanicsList = users.filter((u) => u.role === 'mechanic');

  // Obtain live job from context
  const job = repairJobs.find((j) => j.id === initialJob.id) || initialJob;
  const isServiceJob = job.jobType === 'service';

  // Global mechanic delivered rule: if role is Mechanic and job is Delivered, render entire page read-only
  const isMechanic = currentUser?.role === 'mechanic';
  const isReadOnly = isMechanic && job.status === 'delivered';

  // Payment form state
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
  const [isPayingInline, setIsPayingInline] = useState(false);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('Cash');

  // Discount modal state
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [discountScope, setDiscountScope] = useState<'whole' | 'line_item'>('whole');
  const [discountLineItemKey, setDiscountLineItemKey] = useState<string>('service-0');
  const [manualDiscountType, setManualDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [manualDiscountValue, setManualDiscountValue] = useState<number>(0);
  const [manualDiscountReason, setManualDiscountReason] = useState('');
  const [discountFormError, setDiscountFormError] = useState<string | null>(null);

  // Role-based manual discount ability (fixed: Owner & Staff can apply discounts, Mechanic/Customer cannot)
  const userRole = currentUser?.role || 'admin';
  const canApplyManualDiscount = userRole === 'admin' || userRole === 'advisor' || userRole === 'parts_manager';
  const maxManualDiscountPercent = 100;

  // Form states for Inspection Form (Repair Job in Pending Inspection)
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectionFindingsInput, setInspectionFindingsInput] = useState(job.inspectionResult || '');
  const [recommendedRepairInput, setRecommendedRepairInput] = useState(
    job.recommendedRepairs || job.repairDetails || ''
  );
  const [estimatedCostInput, setEstimatedCostInput] = useState<number>(job.estimatedCost || 50);
  const [mechanicNotesInput, setMechanicNotesInput] = useState(job.inspectionNotes || '');

  // Line items state for "In Progress" status
  const [performedServices, setPerformedServices] = useState<PerformedService[]>(
    job.servicesPerformed || []
  );
  const [partsUsed, setPartsUsed] = useState<UsedPart[]>(job.partsUsed || []);

  // Controls for adding Service to In-Progress job
  const [selectedServiceId, setSelectedServiceId] = useState('');

  // Controls for adding Part to In-Progress job
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQuantityInput, setPartQuantityInput] = useState<number>(1);
  const [partSourceInput, setPartSourceInput] = useState<'garage_stock' | 'customer_provided'>('garage_stock');

  // Additional Finding state for Service Job in Progress
  const [additionalFindingNote, setAdditionalFindingNote] = useState('');

  // Toast / Error Message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter inventory: ONLY items with stock > 0 are selectable (items with zero stock are completely excluded)
  const inStockInventory = inventory.filter((item) => (item.stock || 0) > 0);

  // Keep state synced when job updates
  useEffect(() => {
    setPerformedServices(job.servicesPerformed || []);
    setPartsUsed(job.partsUsed || []);
    setInspectionFindingsInput(job.inspectionResult || '');
    setRecommendedRepairInput(job.recommendedRepairs || job.repairDetails || '');
    setEstimatedCostInput(job.estimatedCost || 50);
    setMechanicNotesInput(job.inspectionNotes || '');
  }, [job]);

  if (!isOpen) return null;

  const existingInvoice = invoices.find((i) => i.repairJobId === job.id || i.jobId === job.id);
  const jobPayments = paymentRecords.filter((p) => p.repairJobId === job.id || p.jobId === job.id);
  const totalPaid = jobPayments.reduce((sum, p) => sum + p.amount, 0);
  const hasRecordedPayment = totalPaid > 0 || existingInvoice?.status === 'paid';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --- Handlers ---

  // 1. Submit Inspection (Repair Job - Pending Inspection)
  const handleSubmitInspection = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!inspectionFindingsInput.trim() || !recommendedRepairInput.trim()) {
      setErrorMessage('Please enter both Inspection Findings and Recommended Repair.');
      return;
    }

    const staffName = currentUser?.name || 'Staff User';

    updateRepairJobDetails(
      job.id,
      {
        inspectionResult: inspectionFindingsInput.trim(),
        recommendedRepairs: recommendedRepairInput.trim(),
        repairDetails: recommendedRepairInput.trim(),
        inspectionNotes: mechanicNotesInput.trim(),
        estimatedCost: estimatedCostInput || 50,
      },
      staffName
    );

    addInspectionRecord(job.id, {
      jobId: job.id,
      inspectionResult: inspectionFindingsInput.trim(),
      diagnosticNotes: inspectionFindingsInput.trim(),
      recommendedRepairs: recommendedRepairInput.trim(),
      partsUsed: [],
      laborHours: 1.0,
      laborCost: 50,
      mechanicNotes: mechanicNotesInput.trim(),
      recordedBy: staffName,
    });

    updateRepairJobStatus(
      job.id,
      'waiting_approval',
      staffName,
      'Inspection completed. Findings recorded and waiting for customer approval.'
    );

    setIsInspecting(false);
    showToast('Inspection completed! Status updated to Waiting Approval.');
  };

  // 2. Customer Approval Actions (Repair Job - Waiting Approval)
  const handleCustomerApprove = () => {
    const staffName = currentUser?.name || 'Staff User';
    updateRepairJobStatus(
      job.id,
      'in_progress',
      staffName,
      'Customer approved repair proposal.'
    );
    showToast('Customer approved repair! Job is now In Progress.');
  };

  const handleCustomerDecline = () => {
    const staffName = currentUser?.name || 'Staff User';
    updateRepairJobStatus(
      job.id,
      'declined',
      staffName,
      'Customer declined repair proposal.'
    );
    createInvoiceFromJob(job.id);
    showToast('Customer declined repair. Inspection Fee invoice generated.');
  };

  // 3. Line Items Handlers for "In Progress" Status
  const handleAddServiceLineItem = () => {
    setErrorMessage(null);
    if (!selectedServiceId) return;
    const sObj = services.find((s) => s.id === selectedServiceId);
    if (!sObj) return;

    const newService: PerformedService = {
      serviceId: sObj.id,
      serviceName: sObj.name,
      quantity: 1,
      unitPrice: sObj.basePrice,
      totalPrice: sObj.basePrice,
    };

    const updated = [...performedServices, newService];
    setPerformedServices(updated);
    setSelectedServiceId('');
    updateRepairJobDetails(job.id, { servicesPerformed: updated }, currentUser?.name);
  };

  const handleAddPartLineItem = () => {
    setErrorMessage(null);
    if (!selectedPartId) return;
    const pObj = inventory.find((p) => p.id === selectedPartId);
    if (!pObj) return;

    if (partQuantityInput <= 0) {
      setErrorMessage('Part quantity must be at least 1.');
      return;
    }

    const isCustomerProvided = partSourceInput === 'customer_provided';
    const unitPrice = isCustomerProvided ? 0 : pObj.unitPrice;

    const newPart: UsedPart = {
      partId: pObj.id,
      partNumber: pObj.partNumber,
      partName: pObj.name,
      quantity: partQuantityInput,
      unitPrice: unitPrice,
      totalPrice: unitPrice * partQuantityInput,
      isCustomerProvided: isCustomerProvided,
    };

    const updated = [...partsUsed, newPart];
    setPartsUsed(updated);
    setSelectedPartId('');
    setPartQuantityInput(1);
    setPartSourceInput('garage_stock');
    updateRepairJobDetails(job.id, { partsUsed: updated }, currentUser?.name);
  };

  const handleRemoveServiceLineItem = (index: number) => {
    const updated = performedServices.filter((_, idx) => idx !== index);
    setPerformedServices(updated);
    updateRepairJobDetails(job.id, { servicesPerformed: updated }, currentUser?.name);
  };

  const handleRemovePartLineItem = (index: number) => {
    const updated = partsUsed.filter((_, idx) => idx !== index);
    setPartsUsed(updated);
    updateRepairJobDetails(job.id, { partsUsed: updated }, currentUser?.name);
  };

  // Calculate Combined Subtotal (Services and Parts together in ONE table, ONE subtotal)
  const combinedServicesSubtotal = performedServices.reduce(
    (sum, s) => sum + (s.totalPrice || s.unitPrice * s.quantity),
    0
  );
  const combinedPartsSubtotal = partsUsed.reduce(
    (sum, p) => sum + (p.isCustomerProvided ? 0 : p.unitPrice * p.quantity),
    0
  );
  const combinedSubtotal = combinedServicesSubtotal + combinedPartsSubtotal;

  // 4. Complete Job Action (In Progress -> Completed)
  const handleCompleteJob = () => {
    const staffName = currentUser?.name || 'Staff User';

    // Deduct inventory ONLY for garage stock parts
    partsUsed.forEach((p) => {
      if (!p.isCustomerProvided && p.quantity > 0) {
        adjustStockQuantity(
          p.partId,
          -p.quantity,
          'usage',
          `Parts used in Job ${job.jobNumber}`,
          staffName
        );
      }
    });

    updateRepairJobDetails(
      job.id,
      {
        servicesPerformed: performedServices,
        partsUsed: partsUsed,
        totalRepairCost: combinedSubtotal,
      },
      staffName
    );

    updateRepairJobStatus(
      job.id,
      'completed',
      staffName,
      'Job completed with services and parts used. Invoice generated.'
    );

    createInvoiceFromJob(job.id);
    showToast('Job marked as Completed! Invoice generated.');
  };

  // 5. Additional Finding -> Create Repair Job (Service Job in Progress)
  const handleCreateRepairFromFinding = () => {
    if (!additionalFindingNote.trim()) {
      setErrorMessage('Please enter notes for the additional finding.');
      return;
    }

    const selectedMechObj = mechanicsList.find((m) => m.id === job.assignedMechanicId);

    const result = createRepairJob({
      jobType: 'repair',
      customerId: job.customerId,
      customerName: job.customerName,
      customerPhone: job.customerPhone,
      vehicleId: job.vehicleId,
      vehicleMake: job.vehicleMake,
      vehicleModel: job.vehicleModel,
      licensePlate: job.licensePlate,
      serviceDate: new Date().toISOString().substring(0, 10),
      customerComplaint: additionalFindingNote.trim(),
      linkedRepairJobId: job.id,
      manualMechanicId: job.assignedMechanicId,
      manualMechanicName: selectedMechObj ? selectedMechObj.name : job.assignedMechanicName,
      createdByName: currentUser?.name || 'Staff User',
    });

    if (result.success && result.job) {
      setAdditionalFindingNote('');
      showToast(`Created new Repair Job #${result.job.jobNumber} (Pending Inspection) linked to this Service Job.`);
    } else {
      setErrorMessage(result.error || 'Failed to create repair job.');
    }
  };

  // 6. Mark as Delivered Action
  const handleMarkAsDelivered = () => {
    if (!hasRecordedPayment) {
      setErrorMessage('Cannot mark as delivered until a payment has been recorded.');
      return;
    }
    const staffName = currentUser?.name || 'Staff User';
    updateRepairJobStatus(
      job.id,
      'delivered',
      staffName,
      'Vehicle delivered to customer.'
    );
    showToast('Vehicle marked as Delivered!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-3xl w-full my-6 overflow-hidden text-slate-900">
        
        {/* HEADER (ALWAYS): Job ID, Job Type badge, Customer name, Vehicle, Assigned Mechanic dropdown, Status badge, Service Date */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono font-extrabold text-base text-emerald-400">
              #{job.jobNumber}
            </span>

            <JobTypeBadge type={isServiceJob ? 'Service' : 'Repair'} />
            <StatusBadge status={job.status} />
          </div>

          <button
            id="close-job-details-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast / Error Banner */}
        {toastMessage && (
          <div className="px-5 py-2.5 bg-emerald-50 text-emerald-900 border-b border-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="px-5 py-2.5 bg-rose-50 text-rose-900 border-b border-rose-200 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ALWAYS: Header Info Panel */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 uppercase text-[10px] font-bold block">Customer</span>
            <span className="font-bold text-slate-900">{job.customerName}</span>
            <span className="text-slate-500 block font-mono text-[11px]">{job.customerPhone}</span>
          </div>

          <div>
            <span className="text-slate-400 uppercase text-[10px] font-bold block">Vehicle</span>
            <span className="font-bold text-slate-900">
              {job.vehicleMake} {job.vehicleModel}
            </span>
            <span className="text-slate-500 block font-mono text-[11px]">
              Plate: {job.licensePlate}
            </span>
          </div>

          <div>
            <span className="text-slate-400 uppercase text-[10px] font-bold block">Service Date</span>
            <span className="font-semibold text-slate-900 font-mono">
              {job.serviceDate || job.receivedDate || job.entryDate}
            </span>

            {/* ASSIGNED MECHANIC DROPDOWN (Always manually selectable - no auto-assign/suggested logic) */}
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-slate-500 font-bold text-[10px] uppercase shrink-0">Mechanic:</span>
              {!isReadOnly ? (
                <select
                  id="select-assigned-mechanic-dropdown"
                  value={job.assignedMechanicId || ''}
                  onChange={(e) => {
                    const newId = e.target.value;
                    const mechObj = mechanicsList.find((m) => m.id === newId);
                    if (mechObj) {
                      reassignMechanic(
                        job.id,
                        mechObj.id,
                        mechObj.name,
                        currentUser?.name || 'Staff User',
                        'Manual selection'
                      );
                      showToast(`Assigned mechanic set to ${mechObj.name}`);
                    }
                  }}
                  className="bg-white border border-slate-200 rounded px-2 py-0.5 text-xs font-semibold text-slate-900 outline-hidden focus:border-slate-900 shrink-0"
                >
                  {!job.assignedMechanicId && <option value="">Select Mechanic</option>}
                  {mechanicsList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="font-semibold text-slate-900">{job.assignedMechanicName || 'Assigned Mechanic'}</span>
              )}
            </div>
          </div>

          <div>
            <span className="text-slate-400 uppercase text-[10px] font-bold block">Total Cost & Payment</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono font-bold text-sm text-slate-900">
                ${(
                  existingInvoice?.totalAmount ||
                  job.totalRepairCost ||
                  (job.inspectionFee || 0) +
                    (job.partsUsed?.reduce((sum, p) => sum + (p.isCustomerProvided ? 0 : p.unitPrice * p.quantity), 0) || 0) +
                    (job.servicesPerformed?.reduce((sum, s) => sum + (s.totalPrice || s.unitPrice * s.quantity), 0) || 0) +
                    (job.laborCost || 0) ||
                  job.estimatedCost ||
                  0
                ).toFixed(2)}
              </span>
              <StatusBadge status={hasRecordedPayment ? 'Paid' : 'Unpaid'} />
            </div>
          </div>
        </div>

        {/* WORKSPACE BODY - CONDITIONAL RENDERING BY JOB TYPE AND CURRENT STATUS */}
        <div className="p-5 space-y-5 max-h-[65vh] overflow-y-auto">

          {/* ------------------------------------------------------------- */}
          {/* BRANCH 1: IF Job Type = Repair AND status = "Pending Inspection" */}
          {/* ------------------------------------------------------------- */}
          {!isServiceJob && job.status === 'pending_inspection' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Complained Issue
                </span>
                <p className="text-xs text-slate-900 font-medium">{job.customerComplaint}</p>
              </div>

              {!isInspecting ? (
                <div className="p-6 bg-slate-50/80 border border-slate-200 rounded-xl text-center space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Vehicle Inspection Needed</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-0.5">
                      Perform inspection to record findings, recommended repair, and estimated cost.
                    </p>
                  </div>
                  {!isReadOnly && (
                    <button
                      type="button"
                      id="start-inspection-btn"
                      onClick={() => setIsInspecting(true)}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
                    >
                      Start Inspection
                    </button>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmitInspection} className="p-4 border border-slate-200 rounded-xl bg-white space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Inspection Form
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsInspecting(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Inspection Findings <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={inspectionFindingsInput}
                      onChange={(e) => setInspectionFindingsInput(e.target.value)}
                      placeholder="Describe findings discovered during inspection..."
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-900 outline-hidden resize-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Recommended Repair <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={recommendedRepairInput}
                      onChange={(e) => setRecommendedRepairInput(e.target.value)}
                      placeholder="Describe recommended repair steps..."
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-900 outline-hidden resize-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Estimated Cost ($) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={estimatedCostInput}
                        onChange={(e) => setEstimatedCostInput(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:bg-white focus:border-slate-900 outline-hidden"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mechanic Notes <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <textarea
                        rows={1}
                        value={mechanicNotesInput}
                        onChange={(e) => setMechanicNotesInput(e.target.value)}
                        placeholder="Additional notes..."
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-900 outline-hidden resize-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition cursor-pointer"
                    >
                      Submit for Approval
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* BRANCH 2: IF Job Type = Repair AND status = "Waiting Approval" */}
          {/* ------------------------------------------------------------- */}
          {!isServiceJob && job.status === 'waiting_approval' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                <h3 className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                  Inspection Findings & Recommended Repair (Read-Only)
                </h3>
                <div>
                  <span className="text-slate-500 font-semibold block">Inspection Findings:</span>
                  <p className="font-semibold text-slate-900">{job.inspectionResult || 'None recorded'}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Recommended Repair:</span>
                  <p className="font-semibold text-slate-900">{job.recommendedRepairs || job.repairDetails || 'None recorded'}</p>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold">
                  <span className="text-slate-600">Estimated Cost:</span>
                  <span className="font-mono text-sm text-slate-900">${(job.estimatedCost || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Approval Buttons: Customer Approved and Customer Declined */}
              {!isReadOnly && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Customer Authorization</h4>
                    <p className="text-[11px] text-slate-600">
                      Record customer response to the inspection proposal.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      id="customer-decline-btn"
                      onClick={handleCustomerDecline}
                      className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
                    >
                      Customer Declined
                    </button>

                    <button
                      id="customer-approve-btn"
                      onClick={handleCustomerApprove}
                      className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition cursor-pointer"
                    >
                      Customer Approved
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* BRANCH 3: IF status = "In Progress" (both Job Types) */}
          {/* ------------------------------------------------------------- */}
          {job.status === 'in_progress' && (
            <div className="space-y-4">
              
              {/* Additional Finding box: ONLY for Job Type = Service AND status = "In Progress" */}
              {isServiceJob && (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Additional Finding
                  </h3>
                  <textarea
                    rows={2}
                    value={additionalFindingNote}
                    onChange={(e) => setAdditionalFindingNote(e.target.value)}
                    placeholder="Enter additional findings or defects discovered during service..."
                    disabled={isReadOnly}
                    className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-900 resize-none disabled:bg-slate-100 disabled:text-slate-500"
                  />
                  {!isReadOnly && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        id="create-repair-job-from-finding-btn"
                        onClick={handleCreateRepairFromFinding}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
                      >
                        Create Repair Job
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Combined Table: Services & Parts Used (ONE table, ONE subtotal) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white space-y-3 p-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Services & Parts Used
                  </h3>
                  <span className="font-mono text-xs font-bold text-slate-900">
                    Subtotal: ${combinedSubtotal.toFixed(2)}
                  </span>
                </div>

                {/* Combined Table Rows */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                        <th className="p-2">Item / Service Name</th>
                        <th className="p-2">Type / Source</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2 text-right">Unit Price</th>
                        <th className="p-2 text-right">Total</th>
                        {!isReadOnly && <th className="p-2 text-center">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {performedServices.map((s, idx) => (
                        <tr key={`svc-${idx}`}>
                          <td className="p-2 font-semibold text-slate-900">{s.serviceName}</td>
                          <td className="p-2">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded">
                              Service
                            </span>
                          </td>
                          <td className="p-2 text-center font-mono">{s.quantity}</td>
                          <td className="p-2 text-right font-mono">${s.unitPrice.toFixed(2)}</td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">
                            ${(s.totalPrice || s.unitPrice * s.quantity).toFixed(2)}
                          </td>
                          {!isReadOnly && (
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveServiceLineItem(idx)}
                                className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}

                      {partsUsed.map((p, idx) => (
                        <tr key={`part-${idx}`}>
                          <td className="p-2 font-semibold text-slate-900">{p.partName}</td>
                          <td className="p-2">
                            {p.isCustomerProvided ? (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-bold rounded">
                                Customer Provided
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded">
                                Garage Stock
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-center font-mono">{p.quantity}</td>
                          <td className="p-2 text-right font-mono">
                            {p.isCustomerProvided ? '$0.00' : `$${p.unitPrice.toFixed(2)}`}
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">
                            ${(p.isCustomerProvided ? 0 : p.unitPrice * p.quantity).toFixed(2)}
                          </td>
                          {!isReadOnly && (
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemovePartLineItem(idx)}
                                className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}

                      {performedServices.length === 0 && partsUsed.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                            No services or parts added yet. Add items below.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Controls to Add Service or Part */}
                {!isReadOnly && (
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    {/* Add Service Row */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600 w-20 shrink-0">Service:</span>
                      <select
                        value={selectedServiceId}
                        onChange={(e) => setSelectedServiceId(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-hidden"
                      >
                        <option value="">-- Pick Service from Catalog --</option>
                        {services.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} (${s.basePrice.toFixed(2)})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddServiceLineItem}
                        className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition shrink-0 cursor-pointer"
                      >
                        Add Service
                      </button>
                    </div>

                    {/* Add Part Row with Source Toggle ("Garage Stock" vs "Customer Provided") */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-600 w-20 shrink-0">Part:</span>
                      <select
                        value={selectedPartId}
                        onChange={(e) => setSelectedPartId(e.target.value)}
                        className="flex-1 min-w-[180px] px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-hidden"
                      >
                        <option value="">-- Pick Part from Inventory --</option>
                        {inStockInventory.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (${p.unitPrice.toFixed(2)})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        value={partQuantityInput}
                        onChange={(e) => setPartQuantityInput(parseInt(e.target.value) || 1)}
                        className="w-14 px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-center outline-hidden shrink-0"
                        title="Quantity"
                      />

                      {/* Source Toggle */}
                      <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0">
                        <button
                          type="button"
                          onClick={() => setPartSourceInput('garage_stock')}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                            partSourceInput === 'garage_stock'
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Garage Stock
                        </button>
                        <button
                          type="button"
                          onClick={() => setPartSourceInput('customer_provided')}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                            partSourceInput === 'customer_provided'
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Customer Provided
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddPartLineItem}
                        className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition shrink-0 cursor-pointer"
                      >
                        Add Part
                      </button>
                    </div>
                  </div>
                )}

                {/* Complete Job Button */}
                {!isReadOnly && (
                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      id="complete-job-btn"
                      onClick={handleCompleteJob}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Complete Job</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* BRANCH 4: IF status = "declined" (Repair Jobs) */}
          {/* ------------------------------------------------------------- */}
          {!isServiceJob && job.status === 'declined' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-xs text-rose-900">
                <div className="font-bold flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Repair Proposal Declined</span>
                </div>
                <p className="text-[11px]">
                  Customer declined recommended repair. Invoice contains ONLY the Inspection Fee line item.
                </p>
              </div>

              {/* Invoice showing ONLY Inspection Fee */}
              <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-slate-900" />
                  <span>Invoice</span>
                </h4>

                <div className="overflow-x-auto border border-slate-100 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-2.5">Item</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Price</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2.5 font-semibold text-slate-900">Inspection Fee</td>
                        <td className="p-2.5 text-center font-mono">1</td>
                        <td className="p-2.5 text-right font-mono">${(job.inspectionFee ?? 50).toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          ${(job.inspectionFee ?? 50).toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Subtotal:</span>
                    <span>${(job.inspectionFee ?? 50).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-slate-900 pt-1 border-t border-slate-200 text-sm">
                    <span>Total:</span>
                    <span className="text-emerald-700">${(job.inspectionFee ?? 50).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* BRANCH 5: IF status = "Completed" or "Delivered" (both types) */}
          {/* ------------------------------------------------------------- */}
          {(job.status === 'completed' || job.status === 'delivered') && (() => {
            const currentInvNumber = existingInvoice?.id || `INV-${job.jobNumber.replace(/\D/g, '') || '3001'}`;
            const firstPayment = jobPayments[0];

            const servicesList = existingInvoice?.servicesPerformed || job.servicesPerformed || [];
            const partsList = existingInvoice?.partsUsed || job.partsUsed || [];

            // Build ONE combined list of items (Services & Parts together)
            const combinedTableRows = [
              ...servicesList.map((s, idx) => {
                const qty = s.quantity || 1;
                const unitPrice = s.unitPrice || 0;
                const gross = qty * unitPrice;
                const autoDisc = s.itemDiscountAmount || 0;
                const manDisc = s.manualDiscountAmount || 0;
                const totalDisc = autoDisc + manDisc;
                const total = Math.max(0, gross - totalDisc);
                let discountStr = '-';
                if (totalDisc > 0) {
                  discountStr = `-$${totalDisc.toFixed(2)}${s.manualDiscountReason ? ` (${s.manualDiscountReason})` : ''}`;
                }
                return {
                  key: `service_${idx}`,
                  name: s.serviceName,
                  type: 'Service',
                  qty,
                  unitPrice,
                  discountStr,
                  discAmount: totalDisc,
                  total,
                };
              }),
              ...partsList.map((p, idx) => {
                const qty = p.quantity || 1;
                const isCust = !!p.isCustomerProvided;
                const unitPrice = isCust ? 0 : (p.unitPrice || 0);
                const gross = qty * unitPrice;
                const autoDisc = isCust ? 0 : (p.itemDiscountAmount || 0);
                const manDisc = isCust ? 0 : (p.manualDiscountAmount || 0);
                const totalDisc = autoDisc + manDisc;
                const total = isCust ? 0 : Math.max(0, gross - totalDisc);
                let discountStr = '-';
                if (totalDisc > 0) {
                  discountStr = `-$${totalDisc.toFixed(2)}${p.manualDiscountReason ? ` (${p.manualDiscountReason})` : ''}`;
                }
                return {
                  key: `part_${idx}`,
                  name: p.partName,
                  type: isCust ? 'Customer Provided' : 'Garage Stock',
                  qty,
                  unitPrice,
                  discountStr,
                  discAmount: totalDisc,
                  total,
                };
              }),
            ];

            if (combinedTableRows.length === 0 && (job.status === 'declined' || job.inspectionFee)) {
              combinedTableRows.push({
                key: 'inspection_0',
                name: 'Diagnostic Inspection Fee',
                type: 'Inspection',
                qty: 1,
                unitPrice: job.inspectionFee ?? 50,
                discountStr: '-',
                discAmount: 0,
                total: job.inspectionFee ?? 50,
              });
            }

            const subtotalVal = existingInvoice?.subtotal ?? (
              combinedTableRows.reduce((sum, r) => sum + (r.unitPrice * r.qty), 0)
            );
            const manualDiscountVal = existingInvoice?.manualDiscountsTotal ?? existingInvoice?.manualDiscountAmount ?? 0;
            const campaignDiscountVal = existingInvoice?.campaignDiscountTotal ?? 0;
            const grandTotalVal = existingInvoice?.totalAmount ?? (
              Math.max(0, subtotalVal - manualDiscountVal - campaignDiscountVal - combinedTableRows.reduce((sum, r) => sum + r.discAmount, 0))
            );

            // PDF Export Function
            const handleExportPdf = () => {
              const printWindow = window.open('', '_blank');
              if (!printWindow) {
                window.print();
                return;
              }
              const content = `
                <!DOCTYPE html>
                <html>
                  <head>
                    <title>Invoice - ${currentInvNumber}</title>
                    <style>
                      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #0f172a; margin: 0; }
                      .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
                      .title { font-size: 24px; font-weight: 800; font-family: monospace; }
                      .meta { margin-bottom: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 13px; }
                      .meta-box { background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; }
                      table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 13px; }
                      th { background: #f1f5f9; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }
                      td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
                      .text-right { text-align: right; }
                      .text-center { text-align: center; }
                      .totals { width: 320px; margin-left: auto; font-size: 13px; margin-top: 16px; font-family: monospace; }
                      .total-row { display: flex; justify-content: space-between; padding: 6px 0; }
                      .grand-total { font-weight: 800; font-size: 16px; border-top: 2px solid #0f172a; padding-top: 8px; margin-top: 4px; }
                      .payment-box { margin-top: 32px; padding: 16px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; font-size: 12px; }
                      .payment-title { font-weight: bold; color: #065f46; margin-bottom: 6px; font-size: 13px; }
                    </style>
                  </head>
                  <body>
                    <div class="header">
                      <div>
                        <div class="title">${currentInvNumber}</div>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Date: ${job.serviceDate || job.entryDate || new Date().toISOString().substring(0, 10)}</div>
                      </div>
                      <div style="text-align: right;">
                        <div style="font-weight: bold;">GARAGE MANAGEMENT</div>
                        <div style="font-size: 12px; color: #64748b;">Job #${job.jobNumber}</div>
                      </div>
                    </div>

                    <div class="meta">
                      <div class="meta-box">
                        <strong>Customer Details</strong><br/>
                        ${job.customerName}<br/>
                        ${job.customerPhone || ''}
                      </div>
                      <div class="meta-box">
                        <strong>Vehicle Details</strong><br/>
                        ${job.vehicleMake} ${job.vehicleModel}<br/>
                        Plate: ${job.licensePlate}
                      </div>
                    </div>

                    <table>
                      <thead>
                        <tr>
                          <th>Item / Service</th>
                          <th>Type</th>
                          <th class="text-center">Qty</th>
                          <th class="text-right">Unit Price</th>
                          <th class="text-right">Discount</th>
                          <th class="text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${combinedTableRows.map(r => `
                          <tr>
                            <td><strong>${r.name}</strong></td>
                            <td>${r.type}</td>
                            <td class="text-center">${r.qty}</td>
                            <td class="text-right">$${r.unitPrice.toFixed(2)}</td>
                            <td class="text-right">${r.discountStr}</td>
                            <td class="text-right"><strong>$${r.total.toFixed(2)}</strong></td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>

                    <div class="totals">
                      <div class="total-row">
                        <span>Subtotal:</span>
                        <span>$${subtotalVal.toFixed(2)}</span>
                      </div>
                      ${manualDiscountVal > 0 ? `
                        <div class="total-row" style="color: #e11d48;">
                          <span>Manual Discount ${existingInvoice?.manualDiscountReason ? `(${existingInvoice.manualDiscountReason})` : ''}:</span>
                          <span>-$${manualDiscountVal.toFixed(2)}</span>
                        </div>
                      ` : ''}
                      ${campaignDiscountVal > 0 ? `
                        <div class="total-row" style="color: #e11d48;">
                          <span>Campaign Discount (${existingInvoice?.campaignName || 'Campaign'}):</span>
                          <span>-$${campaignDiscountVal.toFixed(2)}</span>
                        </div>
                      ` : ''}
                      <div class="total-row grand-total">
                        <span>Grand Total:</span>
                        <span>$${grandTotalVal.toFixed(2)}</span>
                      </div>
                    </div>

                    <div class="payment-box">
                      <div class="payment-title">Payment Status: ${hasRecordedPayment ? 'PAID' : 'UNPAID'}</div>
                      ${hasRecordedPayment ? `
                        <div>Amount: $${(firstPayment?.amount || grandTotalVal).toFixed(2)} | Method: ${firstPayment?.method || existingInvoice?.paymentMethod || 'Cash'} | Date: ${firstPayment?.date || existingInvoice?.paidAt || 'Today'} | Recorded By: ${firstPayment?.recordedBy || currentUser?.name || 'Staff User'}</div>
                      ` : `
                        <div>Payment pending upon vehicle collection.</div>
                      `}
                    </div>

                    <script>
                      window.onload = function() { window.print(); }
                    </script>
                  </body>
                </html>
              `;
              printWindow.document.write(content);
              printWindow.document.close();
            };

            // Payment Submission Handler
            const handleRecordPaymentSubmit = (e: React.FormEvent) => {
              e.preventDefault();
              let invoiceIdToUse = currentInvNumber;
              if (!existingInvoice) {
                const res = createInvoiceFromJob(job);
                if (res.success && res.invoice) {
                  invoiceIdToUse = res.invoice.id;
                }
              }

              recordPayment({
                repairJobId: job.id,
                invoiceId: invoiceIdToUse,
                amount: grandTotalVal,
                date: paymentDate,
                method: selectedPaymentMethod,
                type: 'final',
                notes: 'Full payment on delivery',
                recordedBy: currentUser?.name || 'Staff User',
              });

              updateInvoiceStatus(invoiceIdToUse, 'paid', selectedPaymentMethod);
              setIsPayingInline(false);
              showToast('Payment recorded successfully!');
            };

            return (
              <div className="space-y-4">
                {/* ONE COMBINED INVOICE + PAYMENT CARD */}
                <div className="border border-slate-200 rounded-xl bg-white p-5 space-y-4 shadow-xs">
                  {/* TOP OF CARD: Plain Text Invoice Number, Telegram Status, Export PDF, Apply Discount */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                    {/* Invoice number as plain text at top - NO label like 'Auto-Generated Order Invoice' */}
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-extrabold text-base text-slate-900 tracking-tight">
                        {currentInvNumber}
                      </span>
                      {/* Telegram status indicator (subtle indicator, NO manual send button) */}
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                        <Send className="w-3 h-3 text-slate-400" />
                        <span>Telegram: {job.telegramNotificationStatus === 'Failed' ? 'Failed' : 'Sent'}</span>
                      </span>
                    </div>

                    {/* Actions: Export PDF (always present) + Apply Discount/Campaign (only while Unpaid) */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        id="export-pdf-invoice-btn"
                        onClick={handleExportPdf}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                        <span>Export PDF</span>
                      </button>

                      {!hasRecordedPayment && !isReadOnly && (
                        <button
                          type="button"
                          id="apply-discount-campaign-btn"
                          onClick={() => {
                            setSelectedCampaignId(existingInvoice?.campaignId || '');
                            setManualDiscountType(existingInvoice?.manualDiscountType || 'fixed');
                            setManualDiscountValue(existingInvoice?.manualDiscountValue || 0);
                            setManualDiscountReason(existingInvoice?.manualDiscountReason || '');
                            setIsDiscountModalOpen(true);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Tag className="w-3.5 h-3.5 text-amber-700" />
                          <span>Apply Discount / Campaign</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ONE COMBINED TABLE OF LINE ITEMS (Services & Parts together) */}
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                          <th className="p-3">Item / Service Name</th>
                          <th className="p-3">Type</th>
                          <th className="p-3 text-center">Qty</th>
                          <th className="p-3 text-right">Unit Price</th>
                          <th className="p-3 text-right">Discount</th>
                          <th className="p-3 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {combinedTableRows.length > 0 ? (
                          combinedTableRows.map((row, idx) => (
                            <tr key={`inv-row-${idx}`} className="hover:bg-slate-50/50">
                              <td className="p-3 font-semibold text-slate-900">{row.name}</td>
                              <td className="p-3 text-slate-600 text-[11px] font-medium">{row.type}</td>
                              <td className="p-3 text-center font-mono font-medium">{row.qty}</td>
                              <td className="p-3 text-right font-mono text-slate-700">
                                ${row.unitPrice.toFixed(2)}
                              </td>
                              <td className="p-3 text-right font-mono text-rose-600">
                                {row.discountStr}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-slate-900">
                                ${row.total.toFixed(2)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="p-3 font-semibold text-slate-900">{job.description || 'General Service'}</td>
                            <td className="p-3 text-slate-600 text-[11px]">Service</td>
                            <td className="p-3 text-center font-mono">1</td>
                            <td className="p-3 text-right font-mono">${grandTotalVal.toFixed(2)}</td>
                            <td className="p-3 text-right font-mono text-slate-400">-</td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900">${grandTotalVal.toFixed(2)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* SUBTOTAL & DISCOUNTS & GRAND TOTAL BREAKDOWN */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs font-mono">
                    {/* Single Subtotal line - NO separate Services Total or Parts Total */}
                    <div className="flex justify-between text-slate-700 font-medium">
                      <span>Subtotal</span>
                      <span className="font-bold text-slate-900">${subtotalVal.toFixed(2)}</span>
                    </div>

                    {/* Manual Whole-Invoice Discount (if applied) */}
                    {manualDiscountVal > 0 && (
                      <div className="flex justify-between text-rose-600 font-medium">
                        <span>
                          Manual Discount {existingInvoice?.manualDiscountReason ? `(${existingInvoice.manualDiscountReason})` : ''}
                        </span>
                        <span className="font-bold">-${manualDiscountVal.toFixed(2)}</span>
                      </div>
                    )}

                    {/* Whole-Invoice Campaign Discount (if applied) */}
                    {campaignDiscountVal > 0 && (
                      <div className="flex justify-between text-rose-600 font-medium">
                        <span>
                          Campaign Discount ({existingInvoice?.campaignName || 'Campaign'})
                        </span>
                        <span className="font-bold">-${campaignDiscountVal.toFixed(2)}</span>
                      </div>
                    )}

                    {/* Grand Total */}
                    <div className="flex justify-between text-slate-900 font-extrabold pt-2 border-t border-slate-200 text-sm">
                      <span>Grand Total</span>
                      <span className="text-base font-extrabold text-slate-900">${grandTotalVal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* DIRECTLY BELOW GRAND TOTAL, IN THE SAME CARD: PAYMENT SECTION */}
                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Payment Status:</span>
                        <StatusBadge status={hasRecordedPayment ? 'Paid' : 'Unpaid'} />
                      </div>

                      {/* IF Unpaid: Record Payment button */}
                      {!hasRecordedPayment && !isReadOnly && !isPayingInline && (
                        <button
                          type="button"
                          id="record-payment-btn"
                          onClick={() => setIsPayingInline(true)}
                          className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Record Payment</span>
                        </button>
                      )}
                    </div>

                    {/* IF Unpaid & Paying Inline: Small Payment Form */}
                    {!hasRecordedPayment && isPayingInline && (
                      <form
                        onSubmit={handleRecordPaymentSubmit}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Record Full Payment</h4>
                          <button
                            type="button"
                            onClick={() => setIsPayingInline(false)}
                            className="text-xs text-slate-500 hover:text-slate-700"
                          >
                            Cancel
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          {/* Amount (Pre-filled and Locked to Grand Total) */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Amount (Locked)
                            </label>
                            <input
                              type="text"
                              readOnly
                              value={`$${grandTotalVal.toFixed(2)}`}
                              className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 cursor-not-allowed outline-hidden"
                            />
                          </div>

                          {/* Date */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Payment Date
                            </label>
                            <input
                              type="date"
                              required
                              value={paymentDate}
                              onChange={(e) => setPaymentDate(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 outline-hidden focus:border-slate-900"
                            />
                          </div>

                          {/* Payment Method Dropdown */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Payment Method
                            </label>
                            <select
                              value={selectedPaymentMethod}
                              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 outline-hidden focus:border-slate-900"
                            >
                              {paymentMethods.map((pm) => (
                                <option key={pm.id} value={pm.name}>
                                  {pm.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsPayingInline(false)}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            id="confirm-payment-btn"
                            className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition"
                          >
                            Confirm Full Payment (${grandTotalVal.toFixed(2)})
                          </button>
                        </div>
                      </form>
                    )}

                    {/* IF Paid: Show payment info right here instead of the button */}
                    {hasRecordedPayment && (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Payment Recorded</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-1.5 border-t border-emerald-200/70">
                          <div>
                            <span className="text-emerald-800/80 block text-[10px] font-bold uppercase">Amount</span>
                            <span className="font-extrabold text-emerald-950">${(firstPayment?.amount || grandTotalVal).toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-emerald-800/80 block text-[10px] font-bold uppercase">Date</span>
                            <span className="font-semibold text-emerald-950">{firstPayment?.date || existingInvoice?.paidAt || 'Today'}</span>
                          </div>
                          <div>
                            <span className="text-emerald-800/80 block text-[10px] font-bold uppercase">Method</span>
                            <span className="font-semibold text-emerald-950">{firstPayment?.method || existingInvoice?.paymentMethod || 'Cash'}</span>
                          </div>
                          <div>
                            <span className="text-emerald-800/80 block text-[10px] font-bold uppercase">Recorded By</span>
                            <span className="font-semibold text-emerald-950">{firstPayment?.recordedBy || currentUser?.name || 'Staff User'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mark as Delivered Button: disabled/grayed out until a payment has been recorded */}
                {job.status === 'completed' && !isReadOnly && (
                  <div className="pt-2 flex justify-end">
                    <button
                      id="mark-as-delivered-btn"
                      disabled={!hasRecordedPayment}
                      onClick={handleMarkAsDelivered}
                      className={`px-5 py-2.5 text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-2 ${
                        hasRecordedPayment
                          ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                      title={!hasRecordedPayment ? 'Record payment to enable vehicle delivery' : ''}
                    >
                      <Car className={`w-4 h-4 ${hasRecordedPayment ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>Mark as Delivered</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

        </div>
      </div>

      {/* Discount / Campaign Modal */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm">Apply Discount / Campaign</h3>
              </div>
              <button
                onClick={() => {
                  setIsDiscountModalOpen(false);
                  setDiscountFormError(null);
                }}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setDiscountFormError(null);

                const numVal = Number(manualDiscountValue) || 0;

                // Validation checks if manual discount is being applied
                if (numVal > 0) {
                  if (!canApplyManualDiscount) {
                    setDiscountFormError(`Your current role (${userRole}) is not permitted to apply manual discounts.`);
                    return;
                  }
                  if (manualDiscountType === 'percentage' && numVal > maxManualDiscountPercent) {
                    setDiscountFormError(`Maximum manual discount allowed for your role is ${maxManualDiscountPercent}%.`);
                    return;
                  }
                  if (!manualDiscountReason.trim()) {
                    setDiscountFormError('Please select a discount reason from the configured list.');
                    return;
                  }
                }

                let invoiceIdToUse = existingInvoice?.id || `INV-${job.jobNumber.replace(/\D/g, '') || '3001'}`;
                if (!existingInvoice) {
                  const res = createInvoiceFromJob(job);
                  if (res.success && res.invoice) {
                    invoiceIdToUse = res.invoice.id;
                  }
                }

                if (discountScope === 'whole') {
                  const res = updateInvoiceDiscounts({
                    invoiceId: invoiceIdToUse,
                    campaignId: selectedCampaignId || undefined,
                    manualDiscountType,
                    manualDiscountValue: numVal,
                    manualDiscountReason: numVal > 0 ? manualDiscountReason : undefined,
                  });

                  if (res.success) {
                    showToast('Discounts applied successfully!');
                    setIsDiscountModalOpen(false);
                  } else {
                    setDiscountFormError(res.error || 'Failed to apply discounts');
                  }
                } else {
                  // Line Item Discount
                  const parts = discountLineItemKey.split('_');
                  const targetType = (parts[0] === 'part' ? 'part' : 'service') as 'service' | 'part';
                  const targetIndex = parseInt(parts[1] || '0', 10);

                  const res = updateInvoiceDiscounts({
                    invoiceId: invoiceIdToUse,
                    campaignId: selectedCampaignId || undefined,
                    lineItemDiscount: {
                      targetType,
                      targetIndex,
                      discountType: manualDiscountType,
                      discountValue: numVal,
                      discountReason: manualDiscountReason,
                    },
                  });

                  if (res.success) {
                    showToast('Line item discount applied successfully!');
                    setIsDiscountModalOpen(false);
                  } else {
                    setDiscountFormError(res.error || 'Failed to apply line item discount');
                  }
                }
              }}
              className="p-5 space-y-4 text-xs"
            >
              {discountFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{discountFormError}</span>
                </div>
              )}

              {/* Campaign Discount */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Active Discount Campaign
                  </label>
                  <span className="text-[10px] text-slate-500">Max 1 campaign per invoice</span>
                </div>
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-hidden focus:border-slate-900 text-xs"
                >
                  <option value="">None (No Campaign Discount)</option>
                  {discountCampaigns
                    .filter((c) => c.status === 'active')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `$${c.discountValue} OFF`} ({c.startDate} to {c.endDate})
                      </option>
                    ))}
                </select>
              </div>

              {/* Manual Discount Section */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="block text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                    Manual Discount
                  </span>
                  {!canApplyManualDiscount && (
                    <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      Role Locked ({userRole})
                    </span>
                  )}
                </div>

                {!canApplyManualDiscount ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-xs">
                    Your role is not authorized to apply manual discounts. Contact an Admin or Owner.
                  </div>
                ) : (
                  <>
                    {/* Target Scope */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Discount Scope (Target)
                      </label>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => setDiscountScope('whole')}
                          className={`py-2 px-3 text-xs font-semibold rounded-lg border transition text-center ${
                            discountScope === 'whole'
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Whole Invoice
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountScope('line_item')}
                          className={`py-2 px-3 text-xs font-semibold rounded-lg border transition text-center ${
                            discountScope === 'line_item'
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Specific Line Item
                        </button>
                      </div>

                      {discountScope === 'line_item' && (
                        <div className="mt-2">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                            Select Item or Service
                          </label>
                          <select
                            value={discountLineItemKey}
                            onChange={(e) => setDiscountLineItemKey(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-hidden focus:border-slate-900 text-xs"
                          >
                            {(job.servicesPerformed || []).map((s, idx) => (
                              <option key={`service_${idx}`} value={`service_${idx}`}>
                                [Service] {s.serviceName} — ${s.unitPrice * (s.quantity || 1)}
                              </option>
                            ))}
                            {(job.partsUsed || []).map((p, idx) => (
                              <option key={`part_${idx}`} value={`part_${idx}`}>
                                [Part] {p.partName} {p.isCustomerProvided ? '(Cust Provided)' : `— $${p.unitPrice * (p.quantity || 1)}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                          Discount Type
                        </label>
                        <select
                          value={manualDiscountType}
                          onChange={(e) => setManualDiscountType(e.target.value as 'fixed' | 'percentage')}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-hidden focus:border-slate-900 text-xs"
                        >
                          <option value="fixed">Fixed Amount ($)</option>
                          <option value="percentage">Percentage (%)</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase">
                            Discount Value
                          </label>
                          {manualDiscountType === 'percentage' && (
                            <span className="text-[10px] text-slate-400">Max {maxManualDiscountPercent}%</span>
                          )}
                        </div>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max={manualDiscountType === 'percentage' ? maxManualDiscountPercent : undefined}
                          value={manualDiscountValue || ''}
                          onChange={(e) => setManualDiscountValue(parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 outline-hidden focus:border-slate-900 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase">
                          Discount Reason <span className="text-rose-600">*</span>
                        </label>
                        <span className="text-[10px] text-slate-400">Required if applying discount</span>
                      </div>
                      <select
                        value={manualDiscountReason}
                        onChange={(e) => setManualDiscountReason(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-hidden focus:border-slate-900 text-xs"
                      >
                        <option value="">-- Select a Reason --</option>
                        {discountReasons
                          .filter((r) => r.status === 'active')
                          .map((r) => (
                            <option key={r.id} value={r.reason}>
                              {r.reason}
                            </option>
                          ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsDiscountModalOpen(false);
                    setDiscountFormError(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition"
                >
                  Apply Discounts
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isRecordPaymentModalOpen && (
        <RecordPaymentModal
          job={job}
          isOpen={isRecordPaymentModalOpen}
          onClose={() => setIsRecordPaymentModalOpen(false)}
          onSuccess={() => {
            showToast('Payment recorded successfully!');
          }}
        />
      )}
    </div>
  );
};
