import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGarage } from '../../context/GarageContext';
import { RepairJob } from '../../types';
import {
  Wrench,
  Play,
  Pause,
  PlusCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { StatusBadge } from '../common/StatusBadge';

export const MechanicDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { repairJobs, inventory, updateRepairJobStatus, addInspectionRecord } = useGarage();

  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(1420); // 23 mins 40 secs
  const [selectedJobForModal, setSelectedJobForModal] = useState<RepairJob | null>(null);

  // Form State for Inspection / Repair Record
  const [inspectionResult, setInspectionResult] = useState('Requires Repair');
  const [diagnosticNotes, setDiagnosticNotes] = useState('');
  const [recommendedRepairs, setRecommendedRepairs] = useState('');
  const [mileageAtInspection, setMileageAtInspection] = useState(45000);
  const [photoUrl, setPhotoUrl] = useState('');
  const [mechanicNotes, setMechanicNotes] = useState('');
  const [laborHours, setLaborHours] = useState(1.5);
  const [selectedPartId, setSelectedPartId] = useState(inventory[0]?.id || '');
  const [partQty, setPartQty] = useState(1);
  const [isCustomerProvidedPart, setIsCustomerProvidedPart] = useState(false);
  const [partsUsed, setPartsUsed] = useState<Array<{ partId: string; partName: string; quantity: number; unitPrice: number; isCustomerProvided?: boolean }>>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter ONLY assigned jobs for logged in mechanic
  const assignedJobs = repairJobs.filter(
    (j) =>
      !currentUser ||
      currentUser.role === 'admin' ||
      j.assignedMechanicId === currentUser.id ||
      j.assignedMechanicName?.toLowerCase() === currentUser.name.toLowerCase()
  );

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddPartToRecord = () => {
    const part = inventory.find((p) => p.id === selectedPartId);
    if (!part) return;

    if (!isCustomerProvidedPart && part.stock < partQty) {
      alert(`Only ${part.stock} units available in stock for ${part.name}`);
      return;
    }

    setPartsUsed((prev) => [
      ...prev,
      {
        partId: part.id,
        partName: isCustomerProvidedPart ? `${part.name} (Customer Provided)` : part.name,
        quantity: partQty,
        unitPrice: isCustomerProvidedPart ? 0 : part.unitPrice,
        isCustomerProvided: isCustomerProvidedPart,
      },
    ]);
  };

  const handleSaveInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobForModal) return;

    addInspectionRecord(selectedJobForModal.id, {
      jobId: selectedJobForModal.id,
      inspectionResult,
      diagnosticNotes,
      recommendedRepairs,
      mileageAtInspection: Number(mileageAtInspection) || undefined,
      photos: photoUrl.trim() ? [photoUrl.trim()] : undefined,
      partsUsed,
      laborHours,
      laborCost: laborHours * 90,
      mechanicNotes,
      recordedBy: currentUser?.name || 'Mechanic Technician',
    });

    showToast(`Inspection recorded for ${selectedJobForModal.jobNumber}. Status transitioned to Waiting Approval!`);
    setSelectedJobForModal(null);
    setDiagnosticNotes('');
    setRecommendedRepairs('');
    setPhotoUrl('');
    setMechanicNotes('');
    setPartsUsed([]);
  };

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-slate-900 text-white rounded-xl shadow-lg flex items-center gap-3 border border-slate-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Mechanic Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Mechanic Workshop</h1>
          <p className="text-sm text-slate-500 mt-0.5">Assigned repair orders and diagnostic logs</p>
        </div>

        {/* Active Timer Pill */}
        <div className="p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm flex items-center gap-3.5 shrink-0">
          <div>
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Labor Clock</div>
            <div className="text-lg font-mono font-semibold text-slate-900">{formatTimer(timerSeconds)}</div>
          </div>
          <button
            id="toggle-mechanic-timer-btn"
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className={`p-2 rounded-lg font-medium text-white transition-colors cursor-pointer ${
              isTimerRunning ? 'bg-slate-900 hover:bg-slate-800' : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
            title={isTimerRunning ? 'Pause Labor Timer' : 'Start Labor Timer'}
          >
            {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Repair Orders Queue */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-slate-500" />
          Assigned Queue ({assignedJobs.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignedJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-medium text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                    {job.jobNumber}
                  </span>
                  <StatusBadge status={job.status} />
                </div>

                <h3 className="text-base font-semibold text-slate-900">
                  {job.vehicleMake} {job.vehicleModel}
                </h3>
                <div className="text-xs text-slate-400 font-mono mb-3">Plate: {job.licensePlate} • Customer: {job.customerName}</div>

                <div className="text-xs text-slate-600 bg-slate-50/75 p-3 rounded-lg border border-slate-100 mb-3">
                  <strong className="text-slate-900">Work Scope:</strong> {job.description}
                </div>

                {/* Inspection Records List */}
                {job.inspectionRecords && job.inspectionRecords.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Recorded Inspection Findings</span>
                    {job.inspectionRecords.map((rec) => (
                      <div key={rec.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1">
                        <div className="font-medium text-slate-800">{rec.diagnosticNotes}</div>
                        {rec.partsUsed.length > 0 && (
                          <div className="text-[11px] text-slate-500 font-mono">
                            Parts: {rec.partsUsed.map((p) => `${p.partName} (x${p.quantity})`).join(', ')}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400">By {rec.recordedBy} at {rec.recordedAt}</div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  id={`record-inspection-btn-${job.id}`}
                  onClick={() => setSelectedJobForModal(job)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Record Inspection & Parts Used</span>
                </button>
              </div>

              {/* Status Actions according to official workflow */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-400">Stage:</span>
                <div className="flex items-center gap-2">
                  {job.status === 'pending_inspection' && (
                    <button
                      id={`record-inspection-btn-${job.id}`}
                      onClick={() => setSelectedJobForModal(job)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Record & Complete</span>
                    </button>
                  )}

                  {job.status === 'waiting_approval' && (
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/60 font-medium rounded-md text-xs">
                      Awaiting Customer Approval
                    </span>
                  )}

                  {job.status === 'in_progress' && (
                    <button
                      id={`mechanic-stage-completed-${job.id}`}
                      onClick={() => {
                        updateRepairJobStatus(job.id, 'completed');
                        showToast(`Job ${job.jobNumber} Marked Completed!`);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Completed</span>
                    </button>
                  )}

                  {job.status === 'completed' && (
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium rounded-md text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Completed
                    </span>
                  )}

                  {job.status === 'delivered' && (
                    <span className="px-2.5 py-1 bg-slate-50 text-slate-700 border border-slate-200/60 font-medium rounded-md text-xs">
                      Delivered
                    </span>
                  )}

                  {job.status === 'declined' && (
                    <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200/60 font-medium rounded-md text-xs">
                      Declined
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Record Inspection & Parts Modal */}
      {selectedJobForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-100 rounded-xl shadow-xl max-w-lg w-full overflow-hidden text-slate-900"
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-emerald-400 font-medium">
                  {selectedJobForModal.jobNumber}
                </span>
                <h3 className="text-sm font-semibold">Record Inspection & Spare Parts</h3>
              </div>
              <button
                id="close-inspection-modal"
                onClick={() => setSelectedJobForModal(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInspection} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="p-3 bg-slate-50 border border-slate-100 text-slate-600 rounded-lg text-xs space-y-1">
                <p>
                  Submitting this inspection will save findings, deduct consumed parts from inventory, and update status to <strong className="text-slate-900 font-medium">Waiting Approval</strong>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Inspection Outcome
                  </label>
                  <select
                    id="inspection-result-select"
                    value={inspectionResult}
                    onChange={(e) => setInspectionResult(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-slate-400 focus:outline-none"
                  >
                    <option value="Requires Repair">Requires Repair</option>
                    <option value="Passed - No Fault Found">Passed - No Fault Found</option>
                    <option value="Critical Repair Needed">Critical Repair Needed</option>
                    <option value="Scheduled Maintenance Due">Scheduled Maintenance Due</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Mileage at Inspection
                  </label>
                  <input
                    id="inspection-mileage-input"
                    type="number"
                    value={mileageAtInspection}
                    onChange={(e) => setMileageAtInspection(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono text-slate-900 focus:border-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Diagnostic Findings & Fault Codes
                </label>
                <textarea
                  id="inspection-diagnostic-input"
                  value={diagnosticNotes}
                  onChange={(e) => setDiagnosticNotes(e.target.value)}
                  placeholder="e.g. Scanned P0300 code. Cylinder 2 ignition coil failed resistance test."
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-slate-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Recommended Repairs
                </label>
                <textarea
                  id="inspection-recommended-repairs-input"
                  value={recommendedRepairs}
                  onChange={(e) => setRecommendedRepairs(e.target.value)}
                  placeholder="e.g. Replace Cylinder 2 ignition coil, install 4 OEM spark plugs, perform road test."
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Inspection Photos / Attachment URL (Optional)
                </label>
                <input
                  id="inspection-photo-input"
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-1486006920555-c77dce18193b"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono text-slate-900 focus:border-slate-400 focus:outline-none"
                />
              </div>

              {/* Spare Parts Log Selector */}
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg space-y-2">
                <span className="text-xs font-medium text-slate-900 block">Spare Parts Consumed</span>
                <div className="flex gap-2">
                  <select
                    id="part-select-for-repair"
                    value={selectedPartId}
                    onChange={(e) => setSelectedPartId(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-slate-400 focus:outline-none"
                  >
                    {inventory.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${p.unitPrice} • Stock: {p.stock})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={partQty}
                    onChange={(e) => setPartQty(Number(e.target.value))}
                    className="w-16 px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono text-center"
                  />

                  <button
                    type="button"
                    onClick={handleAddPartToRecord}
                    className="px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shrink-0 cursor-pointer"
                  >
                    Add Part
                  </button>
                </div>

                <div className="flex items-center gap-2 my-1">
                  <input
                    id="customer-provided-part-checkbox"
                    type="checkbox"
                    checked={isCustomerProvidedPart}
                    onChange={(e) => setIsCustomerProvidedPart(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-slate-900 border-slate-300 focus:ring-slate-900 cursor-pointer"
                  />
                  <label htmlFor="customer-provided-part-checkbox" className="text-xs text-slate-600 cursor-pointer">
                    Customer Provided Part ($0 price / labor-only)
                  </label>
                </div>
                {partsUsed.length > 0 && (
                  <div className="space-y-1 pt-2">
                    {partsUsed.map((p, idx) => (
                      <div key={idx} className="text-xs font-medium text-slate-800 flex justify-between bg-white p-2 rounded-lg border border-slate-200/60">
                        <span>{p.partName} (x{p.quantity})</span>
                        <span className="font-mono text-emerald-600 font-semibold">${p.unitPrice * p.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Labor Hours Spent
                </label>
                <input
                  id="labor-hours-input"
                  type="number"
                  step="0.5"
                  value={laborHours}
                  onChange={(e) => setLaborHours(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono text-slate-900 focus:border-slate-400 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  id="cancel-inspection-btn"
                  type="button"
                  onClick={() => setSelectedJobForModal(null)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="submit-inspection-btn"
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Save Findings & Request Approval
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
