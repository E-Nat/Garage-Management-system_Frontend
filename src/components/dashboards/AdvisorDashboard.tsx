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
} from 'lucide-react';
import { OperationalDashboardWidgets } from './OperationalDashboardWidgets';
import { NewRepairJobModal } from '../repairs/NewRepairJobModal';
import { RepairJobDetailModal } from '../repairs/RepairJobDetailModal';
import { ReassignMechanicModal } from '../repairs/ReassignMechanicModal';
import { StatusBadge } from '../common/StatusBadge';

export const AdvisorDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { repairJobs } = useGarage();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [notifiedToast, setNotifiedToast] = useState<string | null>(null);

  // Modals state
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<RepairJob | null>(null);
  const [selectedJobForReassign, setSelectedJobForReassign] = useState<RepairJob | null>(null);

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

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Advisor Flat Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Service Advisor</h1>
          <p className="text-sm text-slate-500 mt-0.5">Vehicle intake and repair dispatch queue</p>
        </div>

        <button
          id="advisor-new-intake-btn"
          onClick={() => setIsNewJobModalOpen(true)}
          className="px-4 py-2 bg-[#FF6B00] hover:bg-[#E56000] text-white font-medium rounded-lg text-sm flex items-center gap-2 transition-colors shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Vehicle Intake</span>
        </button>
      </div>

      {/* Key Operational Numbers Widgets */}
      <OperationalDashboardWidgets />

      {notifiedToast && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200/60 rounded-lg text-xs font-medium flex items-center gap-2">
          <Send className="w-4 h-4 text-emerald-600" />
          <span>{notifiedToast}</span>
        </div>
      )}

      {/* Customer Intake & Active Jobs Table */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Car className="w-4 h-4 text-slate-500" />
              Repair Order Queue ({filteredJobs.length})
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg text-xs overflow-x-auto w-full sm:w-auto border border-slate-100">
              {[
                { id: 'all', label: 'All' },
                { id: 'pending_inspection', label: 'Pending' },
                { id: 'in_progress', label: 'In Progress' },
                { id: 'waiting_approval', label: 'Approval' },
                { id: 'completed', label: 'Completed' },
              ].map((tab) => {
                const isActive = selectedStatusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedStatusFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#FFF1E8] text-[#FF6B00] font-semibold shadow-xs border border-[#FF6B00]/30'
                        : 'text-slate-500 hover:text-slate-900 font-medium'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search RO#, make, plate..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[11px] font-medium">
                <th className="py-3 px-4">RO Number</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Customer Contact</th>
                <th className="py-3 px-4">Assigned Mechanic</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Fee / Estimate</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No repair jobs match your criteria.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => setSelectedJobForDetail(job)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                      {job.jobNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">
                        {job.vehicleMake} {job.vehicleModel}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">Plate: {job.licensePlate}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{job.customerName}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{job.customerPhone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-700 flex items-center gap-1.5">
                        <span>{job.assignedMechanicName || 'Unassigned'}</span>
                        <button
                          id={`reassign-btn-${job.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJobForReassign(job);
                          }}
                          className="text-[11px] font-medium text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2 py-0.5 rounded transition-colors border border-slate-200/60"
                        >
                          Reassign
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-900">
                      {job.status === 'pending_inspection' ? (
                        <span className="text-slate-400 font-normal italic">Pending Inspection</span>
                      ) : (
                        `$${job.totalRepairCost || job.estimatedCost || 0}`
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJobForDetail(job);
                          }}
                          className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 border border-slate-200/60 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
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

