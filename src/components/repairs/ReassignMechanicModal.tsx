import React, { useState } from 'react';
import { useGarage } from '../../context/GarageContext';
import { useAuth } from '../../context/AuthContext';
import { RepairJob } from '../../types';
import { X, UserCheck, AlertCircle, Wrench, CheckCircle2 } from 'lucide-react';

interface ReassignMechanicModalProps {
  job: RepairJob;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReassignMechanicModal: React.FC<ReassignMechanicModalProps> = ({
  job,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { reassignMechanic } = useGarage();
  const { users, currentUser } = useAuth();

  const activeMechanics = users.filter(
    (u) => (u.role === 'mechanic' || u.role === 'staff' || u.role === 'admin') && u.status === 'active'
  );

  const [newMechanicId, setNewMechanicId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedMech = activeMechanics.find((m) => m.id === newMechanicId);

  const handleConfirmChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMechanicId || !selectedMech) {
      setErrorMsg('Please select a new mechanic.');
      return;
    }
    if (newMechanicId === job.assignedMechanicId) {
      setErrorMsg('Selected mechanic is already assigned to this job.');
      return;
    }

    const res = reassignMechanic(
      job.id,
      selectedMech.id,
      selectedMech.name,
      currentUser?.name || 'Staff User',
      'Reassigned by staff'
    );

    if (res.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to reassign mechanic.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-slate-900 animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold">Change Mechanic</h3>
          </div>
          <button
            id="close-reassign-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirmChange} className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <div className="font-mono font-bold text-slate-900">Job #{job.jobNumber}</div>
            <div className="font-semibold text-slate-800">
              {job.vehicleMake} {job.vehicleModel} ({job.licensePlate})
            </div>
            <div className="text-slate-500 flex items-center gap-1.5 mt-1">
              <span>Current Mechanic:</span>
              <span className="font-bold text-slate-900">{job.assignedMechanicName || 'Unassigned'}</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Select New Assigned Mechanic <span className="text-rose-500">*</span>
            </label>
            <select
              id="reassign-mechanic-select"
              value={newMechanicId}
              onChange={(e) => {
                setNewMechanicId(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-hidden"
              required
            >
              <option value="">-- Select Mechanic --</option>
              {activeMechanics
                .filter((m) => m.id !== job.assignedMechanicId)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.department || 'Mechanic'})
                  </option>
                ))}
            </select>
          </div>

          {/* Simple Confirmation prompt when mechanic is selected */}
          {selectedMech && (
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium space-y-1">
              <p className="font-bold text-slate-900">
                Change assigned mechanic from{' '}
                <span className="text-rose-700 underline">{job.assignedMechanicName || 'Unassigned'}</span> to{' '}
                <span className="text-emerald-700 underline">{selectedMech.name}</span>?
              </p>
              <p className="text-[11px] text-emerald-700">
                This action will be automatically recorded in the read-only mechanic assignment history.
              </p>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
            <button
              id="cancel-reassign-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              id="confirm-reassign-btn"
              type="submit"
              disabled={!newMechanicId}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#FF6B00] hover:bg-[#E56000] disabled:opacity-50 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              <span>Confirm Change</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
