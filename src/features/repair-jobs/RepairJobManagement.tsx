import React, { useState } from 'react';
import { useGarage } from '../../context/GarageContext';
import { RepairJob } from '../../types';
import {
  Wrench,
  Plus,
  Search,
  Eye,
  Send,
  User,
  Car,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Phone,
} from 'lucide-react';
import { NewRepairJobModal } from './NewRepairJobModal';
import { RepairJobDetailModal } from './RepairJobDetailModal';

export const RepairJobManagement: React.FC = () => {
  const { repairJobs } = useGarage();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [notifiedToast, setNotifiedToast] = useState<string | null>(null);

  // Modals state
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<RepairJob | null>(null);

  const handleNotifyTelegram = (e: React.MouseEvent, jobId: string, customerName: string) => {
    e.stopPropagation();
    setNotifiedToast(`Telegram notification sent to ${customerName}!`);
    setTimeout(() => setNotifiedToast(null), 3000);
  };

  const filteredJobs = repairJobs.filter((j) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      j.jobNumber.toLowerCase().includes(term) ||
      j.customerName.toLowerCase().includes(term) ||
      j.vehicleMake.toLowerCase().includes(term) ||
      j.vehicleModel.toLowerCase().includes(term) ||
      j.licensePlate.toLowerCase().includes(term) ||
      (j.assignedMechanicName && j.assignedMechanicName.toLowerCase().includes(term));

    const matchesStatus =
      selectedStatusFilter === 'all' || j.status === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: RepairJob['status']) => {
    switch (status) {
      case 'pending_inspection':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Pending Inspection
          </span>
        );
      case 'waiting_approval':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Clock className="w-3 h-3 text-indigo-600" />
            Waiting Approval
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
            <Wrench className="w-3 h-3 text-sky-600" />
            In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Completed
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200">
            <CheckCircle2 className="w-3 h-3 text-teal-600" />
            Delivered
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Declined
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 capitalize">
            {String(status).replace('_', ' ')}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Repair Jobs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage vehicle inspections, repairs, approvals, and job status.
          </p>
        </div>

        <button
          id="create-repair-job-btn-feat"
          onClick={() => setIsNewJobModalOpen(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs flex items-center gap-2 shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Create Repair Job</span>
        </button>
      </div>

      {notifiedToast && (
        <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-medium flex items-center gap-2 animate-fade-in">
          <Send className="w-4 h-4 text-emerald-600" />
          <span>{notifiedToast}</span>
        </div>
      )}

      {/* Main Repair Jobs List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Controls Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search job ID, customer, vehicle, plate, mechanic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Jobs' },
              { id: 'pending_inspection', label: 'Pending Inspection' },
              { id: 'waiting_approval', label: 'Waiting Approval' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'completed', label: 'Completed' },
              { id: 'delivered', label: 'Delivered' },
              { id: 'declined', label: 'Declined' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedStatusFilter(f.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${
                  selectedStatusFilter === f.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Job ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Mechanic</th>
                <th className="py-3 px-4">Received Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Total Cost</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => {
                  const calculatedTotal =
                    job.totalRepairCost ||
                    (job.inspectionFee || 0) +
                      (job.partsUsed?.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0) || 0) +
                      (job.laborCost || 0) ||
                    job.estimatedCost ||
                    0;

                  return (
                    <tr
                      key={job.id}
                      onClick={() => setSelectedJobForDetail(job)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {job.jobNumber}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{job.customerName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{job.customerPhone}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {job.vehicleMake} {job.vehicleModel}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Plate: {job.licensePlate}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-700">
                        {job.assignedMechanicName ? (
                          <span className="flex items-center gap-1.5">
                            <Wrench className="w-3 h-3 text-slate-400" />
                            {job.assignedMechanicName}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600">
                        {job.receivedDate || job.entryDate}
                      </td>

                      <td className="py-3 px-4">{getStatusBadge(job.status)}</td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {job.status === 'pending_inspection' ? (
                          <span className="text-slate-400 font-normal italic">Pending Inspection</span>
                        ) : (
                          `$${(calculatedTotal || 0).toFixed(2)}`
                        )}
                      </td>

                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => setSelectedJobForDetail(job)}
                            className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md transition shadow-2xs flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>View Details</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Wrench className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-slate-600">No repair jobs found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTerm || selectedStatusFilter !== 'all'
                        ? 'Try clearing your search query or filters.'
                        : 'Click "Create Repair Job" above to register a new repair intake.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create New Repair Job Modal */}
      {isNewJobModalOpen && (
        <NewRepairJobModal
          isOpen={isNewJobModalOpen}
          onClose={() => setIsNewJobModalOpen(false)}
        />
      )}

      {/* Repair Job Detail Modal */}
      {selectedJobForDetail && (
        <RepairJobDetailModal
          job={selectedJobForDetail}
          isOpen={!!selectedJobForDetail}
          onClose={() => setSelectedJobForDetail(null)}
        />
      )}
    </div>
  );
};
