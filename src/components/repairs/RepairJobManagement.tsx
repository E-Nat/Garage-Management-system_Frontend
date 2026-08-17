import React, { useState } from 'react';
import { useGarage } from '../../context/GarageContext';
import { useAuth } from '../../context/AuthContext';
import { RepairJob } from '../../types';
import {
  Plus,
  Search,
} from 'lucide-react';
import { NewRepairJobModal } from './NewRepairJobModal';
import { RepairJobDetailModal } from './RepairJobDetailModal';
import { StatusBadge } from '../common/StatusBadge';
import { JobTypeBadge } from '../common/JobTypeBadge';

export const RepairJobManagement: React.FC = () => {
  const { repairJobs, invoices, paymentRecords } = useGarage();
  const { users } = useAuth();

  const mechanicsList = users.filter((u) => u.role === 'mechanic');

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    return sessionStorage.getItem('repair_job_status_filter') || 'all';
  });
  const [mechanicFilter, setMechanicFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  React.useEffect(() => {
    const saved = sessionStorage.getItem('repair_job_status_filter');
    if (saved) {
      setStatusFilter(saved);
      sessionStorage.removeItem('repair_job_status_filter');
    }
  }, []);

  // Modals state
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<RepairJob | null>(null);

  const filteredJobs = repairJobs.filter((j) => {
    // 1. Search term - primary search by Customer Name (and phone/plate helper)
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      j.customerName.toLowerCase().includes(term) ||
      (j.customerPhone && j.customerPhone.toLowerCase().includes(term)) ||
      j.jobNumber.toLowerCase().includes(term);

    // 2. Job Type filter
    const matchesJobType =
      jobTypeFilter === 'all' || j.jobType === jobTypeFilter;

    // 3. Status filter
    const matchesStatus =
      statusFilter === 'all' || j.status === statusFilter;

    // 4. Mechanic filter
    const matchesMechanic =
      mechanicFilter === 'all'
        ? true
        : mechanicFilter === 'unassigned'
        ? !j.assignedMechanicId
        : j.assignedMechanicId === mechanicFilter;

    // 5. Date range filter
    const jobDate = j.serviceDate || j.receivedDate || j.entryDate || '';
    const matchesStartDate = !startDate || jobDate >= startDate;
    const matchesEndDate = !endDate || jobDate <= endDate;

    return (
      matchesSearch &&
      matchesJobType &&
      matchesStatus &&
      matchesMechanic &&
      matchesStartDate &&
      matchesEndDate
    );
  });

  return (
    <div className="space-y-6 text-slate-900">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Jobs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage Service and Repair jobs, track progress, inspect vehicles, and record payments.
          </p>
        </div>

        <button
          id="create-job-btn"
          onClick={() => setIsNewJobModalOpen(true)}
          className="px-4 py-2.5 bg-[#FF6B00] hover:bg-[#E56000] text-white font-semibold rounded-lg text-xs flex items-center gap-2 shadow-xs transition shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Create Job</span>
        </button>
      </div>

      {/* Main Jobs List Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Filter Controls Bar above the table */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
            {/* Search Input - Primary search by customer name */}
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                id="search-jobs-input"
                type="text"
                placeholder="Search by customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
              />
            </div>

            {/* Job Type Dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                Job Type
              </label>
              <select
                id="filter-job-type-select"
                value={jobTypeFilter}
                onChange={(e) => setJobTypeFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] font-medium"
              >
                <option value="all">All Types</option>
                <option value="service">Service</option>
                <option value="repair">Repair</option>
              </select>
            </div>

            {/* Status Dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                Status
              </label>
              <select
                id="filter-status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="pending_inspection">Pending Inspection</option>
                <option value="waiting_approval">Waiting Approval</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="delivered">Delivered</option>
                <option value="declined">Declined</option>
              </select>
            </div>

            {/* Mechanic Dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                Mechanic
              </label>
              <select
                id="filter-mechanic-select"
                value={mechanicFilter}
                onChange={(e) => setMechanicFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] font-medium"
              >
                <option value="all">All Mechanics</option>
                <option value="unassigned">Unassigned</option>
                {mechanicsList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Inputs */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                Date Range
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-1/2 px-1.5 py-1 bg-white border border-slate-200 rounded text-[11px] font-mono text-slate-900 focus:outline-hidden"
                  title="Start Date"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-1/2 px-1.5 py-1 bg-white border border-slate-200 rounded text-[11px] font-mono text-slate-900 focus:outline-hidden"
                  title="End Date"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Data Table: Columns as plain text headers, rows as plain text rows */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Job ID</th>
                <th className="py-3 px-4">Job Type</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Assigned Mechanic</th>
                <th className="py-3 px-4">Service Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Total Cost & Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => {
                  const isService = job.jobType === 'service';
                  const jobPayments = paymentRecords.filter((p) => p.repairJobId === job.id || p.jobId === job.id);
                  const existingInvoice = invoices.find((i) => i.repairJobId === job.id || i.jobId === job.id);
                  const isPaid = jobPayments.length > 0 || existingInvoice?.status === 'paid' || (existingInvoice?.totalPaid || 0) > 0;

                  const calculatedTotal =
                    existingInvoice?.totalAmount ||
                    job.totalRepairCost ||
                    (job.inspectionFee || 0) +
                      (job.partsUsed?.reduce((sum, p) => sum + (p.isCustomerProvided ? 0 : p.unitPrice * p.quantity), 0) || 0) +
                      (job.servicesPerformed?.reduce((sum, s) => sum + (s.totalPrice || s.unitPrice * s.quantity), 0) || 0) +
                      (job.laborCost || 0) ||
                    job.estimatedCost ||
                    0;

                  return (
                    <tr
                      key={job.id}
                      onClick={() => setSelectedJobForDetail(job)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {job.jobNumber}
                      </td>

                      <td className="py-3.5 px-4">
                        <JobTypeBadge type={job.jobType === 'repair' ? 'Repair' : 'Service'} />
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {job.customerName}
                      </td>

                      <td className="py-3.5 px-4 text-slate-800">
                        {job.vehicleMake} {job.vehicleModel} ({job.licensePlate})
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">
                        {job.assignedMechanicName || <span className="text-slate-400 italic">Unassigned</span>}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {job.serviceDate || job.receivedDate || job.entryDate}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={job.status} />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-mono font-bold text-slate-900">
                            ${calculatedTotal.toFixed(2)}
                          </span>
                          <StatusBadge status={isPaid ? 'Paid' : 'Unpaid'} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-600">No jobs found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try adjusting your search criteria or filter options.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create New Job Modal */}
      {isNewJobModalOpen && (
        <NewRepairJobModal
          isOpen={isNewJobModalOpen}
          onClose={() => setIsNewJobModalOpen(false)}
          onSuccess={(createdJob) => {
            setIsNewJobModalOpen(false);
            // Navigate straight to created job's detail page
            setSelectedJobForDetail(createdJob);
          }}
        />
      )}

      {/* Job Detail Modal */}
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
