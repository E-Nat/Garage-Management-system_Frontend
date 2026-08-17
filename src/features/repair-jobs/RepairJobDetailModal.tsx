import React, { useState, useEffect } from 'react';
import { useGarage } from '../../context/GarageContext';
import { useAuth } from '../../context/AuthContext';
import { RepairJob } from '../../types';
import { ReassignMechanicModal } from './ReassignMechanicModal';
import { CompleteRepairModal } from './CompleteRepairModal';
import { DeliverVehicleModal } from './DeliverVehicleModal';
import {
  X,
  Car,
  User,
  Phone,
  Wrench,
  Clock,
  DollarSign,
  FileText,
  UserCheck,
  History,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Check,
  Edit2,
  Receipt,
  RotateCcw,
  Plus,
} from 'lucide-react';

interface RepairJobDetailModalProps {
  job: RepairJob;
  isOpen: boolean;
  onClose: () => void;
}

export const RepairJobDetailModal: React.FC<RepairJobDetailModalProps> = ({
  job,
  isOpen,
  onClose,
}) => {
  const {
    updateRepairJobStatus,
    updateRepairJobDetails,
    addInspectionRecord,
    customers,
    vehicles,
    invoices,
    createInvoiceFromJob,
  } = useGarage();
  const { currentUser } = useAuth();

  // Modals state
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isCompleteRepairModalOpen, setIsCompleteRepairModalOpen] = useState(false);
  const [isDeliverVehicleModalOpen, setIsDeliverVehicleModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Inspection Input state for Pending Inspection
  const [problemsFound, setProblemsFound] = useState(job.inspectionResult || '');
  const [recommendedRepairs, setRecommendedRepairs] = useState(
    job.recommendedRepairs || job.repairDetails || ''
  );
  const [inspectionNotes, setInspectionNotes] = useState(job.inspectionNotes || '');

  // Inspection Fee for Declined jobs
  const [inspectionFeeInput, setInspectionFeeInput] = useState<number>(job.inspectionFee ?? 20);

  // General Edit Details state
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editInspectionResult, setEditInspectionResult] = useState(job.inspectionResult || '');
  const [editRepairDetails, setEditRepairDetails] = useState(
    job.repairDetails || job.recommendedRepairs || ''
  );

  // Confirm Decline Modal
  const [showConfirmDecline, setShowConfirmDecline] = useState(false);
  const [declineReasonInput, setDeclineReasonInput] = useState('');

  // Sync state when job changes
  useEffect(() => {
    setProblemsFound(job.inspectionResult || '');
    setRecommendedRepairs(job.recommendedRepairs || job.repairDetails || '');
    setInspectionNotes(job.inspectionNotes || '');
    setEditInspectionResult(job.inspectionResult || '');
    setEditRepairDetails(job.repairDetails || job.recommendedRepairs || '');
    setInspectionFeeInput(job.inspectionFee ?? 20);
  }, [job]);

  if (!isOpen) return null;

  // Lookup customer, vehicle, and invoice records
  const customerRecord = customers.find((c) => c.id === job.customerId);
  const vehicleRecord = vehicles.find((v) => v.id === job.vehicleId);
  const existingInvoice = invoices.find((i) => i.repairJobId === job.id);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Complete Inspection Handler -> Waiting Approval
  const handleCompleteInspection = () => {
    if (!problemsFound.trim() && !recommendedRepairs.trim()) {
      showToast('Please enter the problems found and recommended repairs before completing inspection.');
      return;
    }

    updateRepairJobDetails(
      job.id,
      {
        inspectionResult: problemsFound.trim(),
        recommendedRepairs: recommendedRepairs.trim(),
        inspectionNotes: inspectionNotes.trim(),
        repairDetails: recommendedRepairs.trim() || job.description,
      },
      currentUser?.name
    );

    addInspectionRecord(job.id, {
      jobId: job.id,
      inspectionResult: problemsFound.trim(),
      diagnosticNotes: problemsFound.trim(),
      recommendedRepairs: recommendedRepairs.trim(),
      partsUsed: job.partsUsed || [],
      laborHours: job.laborHours || 1.5,
      laborCost: job.laborCost || 120,
      mechanicNotes: inspectionNotes.trim(),
      recordedBy: currentUser?.name || 'Staff Inspector',
    });

    updateRepairJobStatus(
      job.id,
      'waiting_approval',
      currentUser?.name || 'Staff User',
      'Inspection completed. Diagnostic findings recorded and submitted for customer approval.'
    );

    showToast('Inspection completed! Repair Job moved to Waiting Approval.');
  };

  // Approval Handlers
  const handleApprove = () => {
    updateRepairJobStatus(
      job.id,
      'in_progress',
      currentUser?.name || 'Staff User',
      'Customer approved proposed repair work order'
    );
    showToast('Customer approval recorded! Status updated to In Progress.');
  };

  const handleDecline = () => {
    const reason = declineReasonInput.trim() || 'Customer declined repair proposal';
    updateRepairJobStatus(
      job.id,
      'declined',
      currentUser?.name || 'Staff User',
      reason
    );
    setShowConfirmDecline(false);
    setDeclineReasonInput('');
    showToast('Repair job marked as Declined.');
  };

  const handleGenerateInspectionFeeInvoice = () => {
    updateRepairJobDetails(job.id, { inspectionFee: inspectionFeeInput }, currentUser?.name);
    const result = createInvoiceFromJob(job.id);
    if (result.success) {
      showToast('Inspection Fee Invoice generated successfully!');
    } else {
      showToast(result.error || 'Failed to generate invoice.');
    }
  };

  const handleReopenJob = () => {
    updateRepairJobStatus(
      job.id,
      'waiting_approval',
      currentUser?.name || 'Staff User',
      'Reopened repair job for customer re-approval'
    );
    showToast('Repair job reopened! Moved back to Waiting Approval.');
  };

  const handleSaveDetails = () => {
    updateRepairJobDetails(
      job.id,
      {
        inspectionResult: editInspectionResult,
        repairDetails: editRepairDetails,
        recommendedRepairs: editRepairDetails,
      },
      currentUser?.name
    );
    setIsEditingDetails(false);
    showToast('Inspection & repair details saved!');
  };

  // Status Badge Helper
  const renderStatusBadge = (status: RepairJob['status']) => {
    switch (status) {
      case 'pending_inspection':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Pending Inspection
          </span>
        );
      case 'waiting_approval':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-900 border border-indigo-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            Waiting Approval
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-100 text-sky-900 border border-sky-300 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-sky-600" />
            In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Completed
          </span>
        );
      case 'delivered':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-100 text-teal-900 border border-teal-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            Delivered
          </span>
        );
      case 'declined':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Declined
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-300">
            {String(status).replace('_', ' ')}
          </span>
        );
    }
  };

  // Workflow timeline steps
  const workflowSteps = [
    { key: 'pending_inspection', label: '1. Pending Inspection' },
    { key: 'waiting_approval', label: '2. Waiting Approval' },
    { key: 'in_progress', label: '3. In Progress' },
    { key: 'completed', label: '4. Completed' },
    { key: 'delivered', label: '5. Delivered' },
  ];

  const getStepStatus = (stepKey: string) => {
    if (job.status === 'declined') {
      if (stepKey === 'pending_inspection' || stepKey === 'waiting_approval') return 'completed';
      return 'declined';
    }

    const order = ['pending_inspection', 'waiting_approval', 'in_progress', 'completed', 'delivered'];
    const currentIndex = order.indexOf(job.status);
    const stepIndex = order.indexOf(stepKey);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const calculatedPartsTotal = job.partsUsed?.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0) || 0;
  const inspectionFeeVal = job.inspectionFee ?? 20;
  const laborCostVal = job.laborCost ?? 120;
  const finalTotalCost = job.totalRepairCost || (inspectionFeeVal + calculatedPartsTotal + laborCostVal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-4xl w-full my-6 overflow-hidden text-slate-900 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold text-center animate-fade-in shrink-0">
            {toastMessage}
          </div>
        )}

        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-lg border border-emerald-500/30">
              #{job.jobNumber}
            </span>
            <div>
              <h2 className="text-base font-bold">
                Repair Job #{job.jobNumber}
              </h2>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Customer: {job.customerName}</span>
                <span>•</span>
                <span>Vehicle: {job.vehicleMake} {job.vehicleModel} ({job.licensePlate})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {renderStatusBadge(job.status)}
            <button
              id="close-job-detail-btn"
              onClick={onClose}
              className="text-slate-400 hover:text-white transition p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Section 1: Workflow Timeline */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-900" />
                Official Repair Workflow
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                Current Status: <strong className="text-slate-900 uppercase">{job.status.replace('_', ' ')}</strong>
              </span>
            </div>

            {/* Horizontal Timeline */}
            <div className="grid grid-cols-5 gap-2 pt-2">
              {workflowSteps.map((step, idx) => {
                const st = getStepStatus(step.key);
                return (
                  <div key={step.key} className="flex flex-col items-center text-center space-y-1.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition ${
                        st === 'completed'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : st === 'current'
                          ? 'bg-slate-900 text-white border-slate-900 ring-4 ring-slate-900/10'
                          : st === 'declined'
                          ? 'bg-rose-100 text-rose-600 border-rose-300'
                          : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      {st === 'completed' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-semibold leading-tight ${
                        st === 'current' ? 'text-slate-900 font-bold' : 'text-slate-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Status-Based Contextual Action Banner */}
          {/* 1. Pending Inspection Banner */}
          {job.status === 'pending_inspection' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-amber-600" />
                    Inspection Required (Pending Inspection)
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Please inspect the vehicle and input findings below. Cost breakdown is hidden until inspection is finished.
                  </p>
                </div>

                <button
                  id="complete-inspection-top-btn"
                  type="button"
                  onClick={handleCompleteInspection}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition shrink-0 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Complete Inspection</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. Waiting Approval Banner */}
          {job.status === 'waiting_approval' && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-indigo-600" />
                    Customer Approval Required
                  </h3>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    Inspection results and proposed costs are ready. Record customer decision:
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    id="approve-start-repair-btn"
                    type="button"
                    onClick={handleApprove}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Customer Approved</span>
                  </button>

                  <button
                    id="decline-repair-btn"
                    type="button"
                    onClick={() => setShowConfirmDecline(true)}
                    className="px-4 py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Customer Declined</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. In Progress Banner */}
          {job.status === 'in_progress' && (
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-sky-600" />
                  Repair In Progress
                </h3>
                <p className="text-xs text-sky-700 mt-0.5">
                  Execution in progress. When work is finished, click Complete Repair to input parts used and generate final invoice.
                </p>
              </div>

              <button
                id="complete-repair-open-modal-btn"
                type="button"
                onClick={() => setIsCompleteRepairModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5 shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Repair</span>
              </button>
            </div>
          )}

          {/* 4. Completed Banner */}
          {job.status === 'completed' && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Repair Completed
                </h3>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Work completed & invoice generated. Ready to deliver vehicle to customer.
                </p>
              </div>

              <button
                id="mark-delivered-open-modal-btn"
                type="button"
                onClick={() => setIsDeliverVehicleModalOpen(true)}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5 shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark as Delivered</span>
              </button>
            </div>
          )}

          {/* 5. Delivered Banner */}
          {job.status === 'delivered' && (
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  Vehicle Delivered
                </h3>
                <p className="text-xs text-teal-700 mt-0.5">
                  Vehicle delivered to customer. All information, invoice, and history are read-only.
                </p>
              </div>

              <span className="px-3 py-1 bg-teal-100 text-teal-800 font-bold text-xs rounded-lg border border-teal-200">
                Delivered: {job.deliveredAt || job.completionDate || '2026-08-11'}
              </span>
            </div>
          )}

          {/* 6. Declined Banner & Inspection Fee Invoice Section */}
          {job.status === 'declined' && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Repair Job Declined
                  </h3>
                  <p className="text-xs text-rose-700 mt-0.5">
                    Customer declined repair proposal. Job is recorded in Vehicle Service History. Parts usage is disallowed.
                  </p>
                  <div className="text-[11px] text-rose-800 mt-1 font-mono">
                    <span>Declined Date: <strong>{job.declinedAt || '2026-08-03 15:30'}</strong></span>
                    {job.declineReason && <span className="ml-3">• Reason: <em>"{job.declineReason}"</em></span>}
                  </div>
                </div>

                <button
                  id="reopen-job-btn"
                  type="button"
                  onClick={handleReopenJob}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                  <span>Reopen / Request Approval</span>
                </button>
              </div>

              {/* Inspection Fee Section for Declined Job */}
              <div className="pt-3 border-t border-rose-200/80 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 block">
                  Inspection Fee Invoice
                </span>

                {existingInvoice ? (
                  <div className="p-3 bg-white border border-rose-200 rounded-lg text-xs space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span>Invoice Number:</span>
                      <strong className="text-slate-900">{existingInvoice.id}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Inspection Fee:</span>
                      <strong className="text-rose-700">${(existingInvoice.inspectionFee || existingInvoice.totalAmount).toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment Status:</span>
                      <span className="uppercase font-bold text-amber-700">{existingInvoice.status}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Issued Date:</span>
                      <span>{existingInvoice.issuedAt}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Inspection Fee Amount ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={inspectionFeeInput}
                        onChange={(e) => setInspectionFeeInput(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateInspectionFeeInvoice}
                      className="px-4 py-2 mt-4 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shrink-0"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>Generate Inspection Fee Invoice</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Grid: Customer & Vehicle Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Information */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                <User className="w-3.5 h-3.5 text-slate-900" />
                Customer Information
              </h3>

              <div className="grid grid-cols-1 gap-1 pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Full Name:</span>
                  <span className="font-bold text-slate-900">{job.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone Number:</span>
                  <span className="font-mono font-semibold text-slate-900">{job.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Address:</span>
                  <span className="font-medium text-slate-800">{customerRecord?.address || 'Phnom Penh'}</span>
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                <Car className="w-3.5 h-3.5 text-slate-900" />
                Vehicle Information
              </h3>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1">
                <div>
                  <span className="text-slate-500 block">Brand:</span>
                  <span className="font-bold text-slate-900">{job.vehicleMake}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Model:</span>
                  <span className="font-bold text-slate-900">{job.vehicleModel}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Plate Number:</span>
                  <span className="font-mono font-bold text-slate-900">{job.licensePlate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Year:</span>
                  <span className="font-mono font-semibold text-slate-900">{vehicleRecord?.year || 2022}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Color:</span>
                  <span className="font-semibold text-slate-900">{vehicleRecord?.color || 'Standard'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Mileage:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {vehicleRecord?.mileage ? `${vehicleRecord.mileage.toLocaleString()} km` : '45,000 km'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Mechanic Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Assigned Mechanic
              </span>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Wrench className="w-4 h-4 text-slate-700" />
                <span>{job.assignedMechanicName || 'Unassigned'}</span>
              </div>
            </div>

            {job.status !== 'delivered' && (
              <button
                id="change-mechanic-btn"
                type="button"
                onClick={() => setIsReassignModalOpen(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-2xs transition"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Change Mechanic</span>
              </button>
            )}
          </div>

          {/* Inspection Result & Repair Information */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-900" />
                Inspection & Repair Information
              </h3>

              {job.status !== 'pending_inspection' && job.status !== 'delivered' && (
                !isEditingDetails ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingDetails(true)}
                    className="text-xs font-semibold text-slate-900 hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit Details</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveDetails}
                    className="px-2.5 py-1 bg-slate-900 text-white text-xs font-bold rounded-md"
                  >
                    Save Details
                  </button>
                )
              )}
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-slate-500 font-medium block text-[11px]">Received Date:</span>
                <span className="font-mono font-semibold text-slate-900">{job.receivedDate || job.entryDate}</span>
              </div>

              <div>
                <span className="text-slate-500 font-medium block text-[11px]">Customer Complained Issue:</span>
                <p className="text-slate-900 bg-white p-2.5 rounded-lg border border-slate-200 font-medium mt-0.5">
                  {job.customerComplaint || job.description || 'No initial complaint recorded.'}
                </p>
              </div>

              {/* PENDING INSPECTION INPUT FORM */}
              {job.status === 'pending_inspection' ? (
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3">
                  <span className="font-bold text-slate-900 block text-xs border-b border-slate-100 pb-1">
                    Input Inspection Result & Findings
                  </span>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Problems / Issues Found <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Front ceramic brake pads worn down to 2mm. Severe squeal under braking."
                      value={problemsFound}
                      onChange={(e) => setProblemsFound(e.target.value)}
                      className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Recommended Repairs <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Replace front brake pads, turn front rotors, and perform brake fluid flush."
                      value={recommendedRepairs}
                      onChange={(e) => setRecommendedRepairs(e.target.value)}
                      className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Inspection Notes
                    </label>
                    <input
                      type="text"
                      placeholder="Additional technician observations..."
                      value={inspectionNotes}
                      onChange={(e) => setInspectionNotes(e.target.value)}
                      className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:border-slate-900"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      id="complete-inspection-bottom-btn"
                      type="button"
                      onClick={handleCompleteInspection}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Complete Inspection & Move to Waiting Approval</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* DISPLAY INSPECTION FINDINGS FOR OTHER STATUSES */
                !isEditingDetails ? (
                  <>
                    <div>
                      <span className="text-slate-500 font-medium block text-[11px]">Problems / Issues Found:</span>
                      <p className="text-slate-900 bg-white p-2.5 rounded-lg border border-slate-200 font-medium mt-0.5">
                        {job.inspectionResult || job.inspectionRecords?.[0]?.diagnosticNotes || 'Diagnostic scan completed.'}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium block text-[11px]">Recommended Repairs:</span>
                      <p className="text-slate-900 bg-white p-2.5 rounded-lg border border-slate-200 font-medium mt-0.5">
                        {job.recommendedRepairs || job.repairDetails || job.description || 'Recommended repair work.'}
                      </p>
                    </div>

                    {job.inspectionNotes && (
                      <div>
                        <span className="text-slate-500 font-medium block text-[11px]">Inspection Notes:</span>
                        <p className="text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 font-medium mt-0.5">
                          {job.inspectionNotes}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-2 pt-1">
                    <div>
                      <span className="text-[11px] font-bold text-slate-700 block">Problems / Issues Found:</span>
                      <textarea
                        rows={2}
                        value={editInspectionResult}
                        onChange={(e) => setEditInspectionResult(e.target.value)}
                        className="w-full mt-1 p-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-700 block">Recommended Repairs:</span>
                      <textarea
                        rows={2}
                        value={editRepairDetails}
                        onChange={(e) => setEditRepairDetails(e.target.value)}
                        className="w-full mt-1 p-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                      />
                    </div>
                  </div>
                )
              )}

              {/* Parts Used Table (Only shown for non-declined jobs after inspection) */}
              {job.status !== 'pending_inspection' && job.status !== 'declined' && (
                <div className="pt-2">
                  <span className="text-slate-500 font-medium block text-[11px] mb-1">Parts Used / Installed:</span>
                  {job.partsUsed && job.partsUsed.length > 0 ? (
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                            <th className="p-2">Part Name</th>
                            <th className="p-2 text-center">Qty</th>
                            <th className="p-2 text-right">Unit Price</th>
                            <th className="p-2 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {job.partsUsed.map((p, idx) => (
                            <tr key={idx}>
                              <td className="p-2 font-medium text-slate-900">{p.partName}</td>
                              <td className="p-2 text-center font-mono">{p.quantity || 0}</td>
                              <td className="p-2 text-right font-mono">${(p.unitPrice || 0).toFixed(2)}</td>
                              <td className="p-2 text-right font-mono font-bold text-slate-900">
                                ${((p.unitPrice || 0) * (p.quantity || 0)).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No parts recorded yet. Parts are added upon completing the repair.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* COST BREAKDOWN (HIDDEN DURING PENDING INSPECTION) */}
          {job.status === 'pending_inspection' ? (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong className="font-bold">Cost Breakdown Hidden:</strong> Repair cost will be calculated and displayed after inspection completion.
                </span>
              </div>
            </div>
          ) : job.status !== 'declined' ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-900" />
                Cost Breakdown
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 text-[11px] block">Inspection Fee:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">${(inspectionFeeVal || 0).toFixed(2)}</span>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 text-[11px] block">Parts Total:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">${(calculatedPartsTotal || 0).toFixed(2)}</span>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 text-[11px] block">Repair / Service Fee:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">${(laborCostVal || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase">Total Repair Cost:</span>
                <span className="text-lg font-extrabold font-mono text-emerald-800 bg-emerald-50 px-3.5 py-1 rounded-lg border border-emerald-200">
                  ${(finalTotalCost || 0).toFixed(2)}
                </span>
              </div>
            </div>
          ) : null}

          {/* Section: Status History Log */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-900" />
                Status History & Activity Log
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Read-Only Activity Log</span>
            </div>

            {job.statusHistory && job.statusHistory.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {job.statusHistory.map((sh) => (
                  <div key={sh.id} className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 uppercase text-[10px] bg-slate-100 px-2 py-0.5 rounded-md">
                        {sh.toStatus.replace('_', ' ')}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{sh.timestamp}</span>
                    </div>
                    {sh.note && (
                      <p className="text-[11px] text-slate-600 italic">"{sh.note}"</p>
                    )}
                    <div className="text-[10px] text-slate-500">
                      Changed by: <strong className="text-slate-800">{sh.changedBy}</strong>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No status history recorded yet.</p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            id="close-repair-detail-modal-btn"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition"
          >
            Close Details
          </button>
        </div>
      </div>

      {/* Reassignment Modal */}
      {isReassignModalOpen && (
        <ReassignMechanicModal
          job={job}
          isOpen={isReassignModalOpen}
          onClose={() => setIsReassignModalOpen(false)}
        />
      )}

      {/* Complete Repair Modal */}
      {isCompleteRepairModalOpen && (
        <CompleteRepairModal
          job={job}
          isOpen={isCompleteRepairModalOpen}
          onClose={() => setIsCompleteRepairModalOpen(false)}
          onSuccess={() => showToast('Repair work completed & invoice generated!')}
        />
      )}

      {/* Deliver Vehicle Modal */}
      {isDeliverVehicleModalOpen && (
        <DeliverVehicleModal
          job={job}
          isOpen={isDeliverVehicleModalOpen}
          onClose={() => setIsDeliverVehicleModalOpen(false)}
          onSuccess={() => showToast('Vehicle marked as Delivered!')}
        />
      )}

      {/* Confirm Decline Dialog */}
      {showConfirmDecline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl max-w-sm w-full space-y-4 text-slate-900 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
              <AlertCircle className="w-5 h-5" />
              <span>Decline Repair Job</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure customer <strong>{job.customerName}</strong> declined the repair proposal? The job will be recorded as <strong>Declined</strong> and cannot move to In Progress unless reopened.
            </p>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Reason for Decline (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. High part cost, decided to sell vehicle..."
                value={declineReasonInput}
                onChange={(e) => setDeclineReasonInput(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmDecline(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDecline}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
