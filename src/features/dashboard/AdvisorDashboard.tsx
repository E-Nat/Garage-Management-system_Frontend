import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGarage } from '../../context/GarageContext';
import { RepairJob } from '../../types';
import {
  Car,
  Send,
  PlusCircle,
  Search,
  Phone,
  Eye,
  UserCheck,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { OperationalDashboardWidgets } from './OperationalDashboardWidgets';
import { NewRepairJobModal } from '../repair-jobs/NewRepairJobModal';
import { RepairJobDetailModal } from '../repair-jobs/RepairJobDetailModal';
import { ReassignMechanicModal } from '../repair-jobs/ReassignMechanicModal';

export const AdvisorDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { repairJobs } = useGarage();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [notifiedToast, setNotifiedToast] = useState<string | null>(null);
  const [notifiedMap, setNotifiedMap] = useState<Record<string, boolean>>({});

  // Modals state
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<RepairJob | null>(null);
  const [selectedJobForReassign, setSelectedJobForReassign] = useState<RepairJob | null>(null);

  const handleNotifyTelegram = (e: React.MouseEvent, jobId: string, customerName: string) => {
    e.stopPropagation();
    setNotifiedMap((prev) => ({ ...prev, [jobId]: true }));
    setNotifiedToast(`Telegram notification dispatched to ${customerName}!`);
    setTimeout(() => setNotifiedToast(null), 3000);
  };

  const filteredJobs = repairJobs.filter((j) => {
    const matchesSearch =
      j.vehicleMake.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.jobNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatusFilter === 'all' || j.status === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusBadgeColorMap: Record<RepairJob['status'], string> = {
    pending_inspection: 'bg-amber-100 text-amber-900 border-amber-200',
    waiting_approval: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    in_progress: 'bg-sky-100 text-sky-900 border-sky-200',
    completed: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    delivered: 'bg-teal-100 text-teal-900 border-teal-200',
    declined: 'bg-rose-100 text-rose-900 border-rose-200',
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* Advisor Welcome Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 text-slate-900 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {currentUser?.name}</h1>
        </div>

        <button
          id="advisor-new-intake-btn"
          onClick={() => setIsNewJobModalOpen(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-xs transition shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-emerald-400" />
          <span>New Vehicle Intake</span>
        </button>
      </div>

      {/* Key Operational Numbers Widgets */}
      <OperationalDashboardWidgets />

      {notifiedToast && (
        <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-medium flex items-center gap-2 animate-fade-in">
          <Send className="w-4 h-4 text-emerald-600" />
          <span>{notifiedToast}</span>
        </div>
      )}

      {/* Customer Intake & Active Jobs Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Car className="w-5 h-5 text-slate-700" />
              Customer Repair Order Queue ({filteredJobs.length})
            </h2>
            <p className="text-xs text-slate-500">Auto-assigned mechanic queue with real-time status and call logs</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs overflow-x-auto w-full sm:w-auto">
              <button
                onClick={() => setSelectedStatusFilter('all')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  selectedStatusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedStatusFilter('pending_inspection')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  selectedStatusFilter === 'pending_inspection'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setSelectedStatusFilter('in_progress')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  selectedStatusFilter === 'in_progress'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => setSelectedStatusFilter('waiting_approval')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  selectedStatusFilter === 'waiting_approval'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Approval
              </button>
              <button
                onClick={() => setSelectedStatusFilter('completed')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  selectedStatusFilter === 'completed'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Completed
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search RO#, make, plate..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-slate-900 outline-hidden"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">RO Number</th>
                <th className="py-3 px-3">Vehicle</th>
                <th className="py-3 px-3">Customer Contact</th>
                <th className="py-3 px-3">Assigned Mechanic</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Fee / Estimate</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No repair jobs match your search/filter criteria.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => setSelectedJobForDetail(job)}
                    className="hover:bg-slate-50 transition cursor-pointer"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {job.jobNumber}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">
                        {job.vehicleMake} {job.vehicleModel}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">Plate: {job.licensePlate}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{job.customerName}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{job.customerPhone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800 flex items-center gap-1.5">
                        <span>{job.assignedMechanicName || 'Unassigned'}</span>
                        <button
                          id={`reassign-btn-${job.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJobForReassign(job);
                          }}
                          className="text-[10px] font-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md transition"
                        >
                          Reassign
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          statusBadgeColorMap[job.status] || 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        {job.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {job.status === 'pending_inspection' ? (
                        <span className="text-slate-400 font-normal italic">Pending Inspection</span>
                      ) : (
                        `$${job.totalRepairCost || job.estimatedCost || 0}`
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJobForDetail(job);
                          }}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold transition flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Details</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isNewJobModalOpen && (
        <NewRepairJobModal
          isOpen={isNewJobModalOpen}
          onClose={() => setIsNewJobModalOpen(false)}
          onSuccess={(jobId) => {
            const newJob = repairJobs.find((j) => j.id === jobId);
            if (newJob) setSelectedJobForDetail(newJob);
          }}
        />
      )}

      {selectedJobForDetail && (
        <RepairJobDetailModal
          job={selectedJobForDetail}
          isOpen={!!selectedJobForDetail}
          onClose={() => setSelectedJobForDetail(null)}
        />
      )}

      {selectedJobForReassign && (
        <ReassignMechanicModal
          job={selectedJobForReassign}
          isOpen={!!selectedJobForReassign}
          onClose={() => setSelectedJobForReassign(null)}
          onSuccess={() => {
            // refresh
          }}
        />
      )}
    </div>
  );
};
