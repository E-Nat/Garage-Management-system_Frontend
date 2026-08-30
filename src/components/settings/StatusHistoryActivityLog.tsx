import React, { useState, useMemo } from 'react';
import { useGarage } from '../../context/GarageContext';
import { RepairStatusHistory } from '../../types';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  ArrowUpDown,
} from 'lucide-react';

const STATUS_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  pending_inspection: { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  waiting_approval: { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  in_progress: { bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  delivered: { bg: 'bg-teal-50', text: 'text-teal-700', badge: 'bg-teal-100 text-teal-800 border-teal-200' },
  declined: { bg: 'bg-rose-50', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-800 border-rose-200' },
};

const getStatusLabel = (status: string): string => {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const StatusHistoryActivityLog: React.FC = () => {
  const { repairStatusHistory, repairJobs } = useGarage();

  // Filter & Pagination State
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [changedByFilter, setChangedByFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get unique staff members from history
  const staffMembers = useMemo(() => {
    const members = new Set<string>();
    repairStatusHistory.forEach((h) => members.add(h.changedBy));
    return Array.from(members).sort();
  }, [repairStatusHistory]);

  // Get unique statuses
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>();
    repairStatusHistory.forEach((h) => {
      statuses.add(h.fromStatus);
      statuses.add(h.toStatus);
    });
    return Array.from(statuses).sort();
  }, [repairStatusHistory]);

  // Get job type filter options from jobs
  const jobTypes = useMemo(() => {
    const types = new Set<string>();
    repairJobs.forEach((job) => {
      // Infer job type from description or use default
      if (job.description.toLowerCase().includes('oil change') || job.description.toLowerCase().includes('service')) {
        types.add('Service');
      } else if (job.description.toLowerCase().includes('inspection')) {
        types.add('Inspection');
      } else {
        types.add('Repair');
      }
    });
    return Array.from(types).sort();
  }, [repairJobs]);

  // Build enriched history with job details
  // Merge the global status history log with every job's own statusHistory
  // (deduplicated by entry id so entries written to both sources appear once).
  const enrichedHistory = useMemo(() => {
    const combined = new Map<string, RepairStatusHistory>();
    repairStatusHistory.forEach((h) => {
      if (!combined.has(h.id)) combined.set(h.id, h);
    });
    repairJobs.forEach((job) => {
      (job.statusHistory || []).forEach((h) => {
        if (!combined.has(h.id)) combined.set(h.id, h);
      });
    });

    return Array.from(combined.values()).map((history) => {
      const job = repairJobs.find((j) => j.id === history.jobId);
      let jobType = 'Repair';
      if (job?.description.toLowerCase().includes('oil change') || job?.description.toLowerCase().includes('service')) {
        jobType = 'Service';
      } else if (job?.description.toLowerCase().includes('inspection')) {
        jobType = 'Inspection';
      }

      return {
        ...history,
        jobType,
        jobNumber: job?.jobNumber || 'N/A',
        customerName: job?.customerName || 'Unknown',
        vehicleInfo: job ? `${job.vehicleMake} ${job.vehicleModel} (${job.licensePlate})` : 'Unknown',
      };
    });
  }, [repairStatusHistory, repairJobs]);

  // Apply filters
  const filteredHistory = useMemo(() => {
    return enrichedHistory.filter((history) => {
      // Date range filter
      if (dateFromFilter && history.timestamp < dateFromFilter) return false;
      if (dateToFilter && history.timestamp > dateToFilter) return false;

      // Job type filter
      if (jobTypeFilter !== 'all' && history.jobType !== jobTypeFilter) return false;

      // Status filter (both from and to)
      if (statusFilter !== 'all') {
        if (history.fromStatus !== statusFilter && history.toStatus !== statusFilter) return false;
      }

      // Changed by filter
      if (changedByFilter !== 'all' && history.changedBy !== changedByFilter) return false;

      return true;
    });
  }, [enrichedHistory, dateFromFilter, dateToFilter, jobTypeFilter, statusFilter, changedByFilter]);

  // Sort history
  const sortedHistory = useMemo(() => {
    const sorted = [...filteredHistory];
    if (sortOrder === 'newest') {
      sorted.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else {
      sorted.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }
    return sorted;
  }, [filteredHistory, sortOrder]);

  // Paginate
  const totalPages = Math.ceil(sortedHistory.length / itemsPerPage);
  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedHistory.slice(start, start + itemsPerPage);
  }, [sortedHistory, currentPage]);

  const handleReset = () => {
    setDateFromFilter('');
    setDateToFilter('');
    setJobTypeFilter('all');
    setStatusFilter('all');
    setChangedByFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = dateFromFilter || dateToFilter || jobTypeFilter !== 'all' || statusFilter !== 'all' || changedByFilter !== 'all';

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs space-y-5">
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Repair Status History Log</h2>
            <p className="text-xs text-slate-500 mt-1">Chronological audit trail of all repair job status changes</p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition border border-slate-200"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Date From */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">From Date</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={dateFromFilter}
                onChange={(e) => {
                  setDateFromFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
              />
            </div>
          </div>

          {/* Date To */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">To Date</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={dateToFilter}
                onChange={(e) => {
                  setDateToFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
              />
            </div>
          </div>

          {/* Job Type Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Job Type</label>
            <select
              value={jobTypeFilter}
              onChange={(e) => {
                setJobTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
            >
              <option value="all">All Types</option>
              {jobTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
            >
              <option value="all">All Statuses</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {getStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>

          {/* Changed By Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Changed By</label>
            <select
              value={changedByFilter}
              onChange={(e) => {
                setChangedByFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
            >
              <option value="all">All Staff</option>
              {staffMembers.map((member) => (
                <option key={member} value={member}>
                  {member}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-600 font-semibold">
              {sortedHistory.length} {sortedHistory.length === 1 ? 'entry' : 'entries'} found
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-semibold">Sort:</span>
            <button
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition flex items-center gap-1.5 ${
                sortOrder === 'newest'
                  ? 'bg-[#FF6B00] text-white border-[#FF6B00]'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="px-6 pb-6">
        {sortedHistory.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">No Status Changes Found</h3>
            <p className="text-xs text-slate-500">
              {hasActiveFilters ? 'Try adjusting your filters to find more entries.' : 'No repair job status history available.'}
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg mb-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                    <th className="py-3 px-4">Job ID</th>
                    <th className="py-3 px-4">Customer / Vehicle</th>
                    <th className="py-3 px-4">From Status</th>
                    <th className="py-3 px-4">To Status</th>
                    <th className="py-3 px-4">Changed By</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedHistory.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/50 transition">
                      {/* Job ID + Type */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div>
                          <div className="font-mono text-xs">{entry.jobNumber}</div>
                          <div className="text-[10px] text-slate-500 font-normal mt-0.5">{entry.jobType}</div>
                        </div>
                      </td>

                      {/* Customer / Vehicle */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 text-xs">{entry.customerName}</div>
                        <div className="text-[11px] text-slate-500 font-normal mt-0.5 truncate">
                          {entry.vehicleInfo}
                        </div>
                      </td>

                      {/* From Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            STATUS_COLORS[entry.fromStatus]?.badge || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {getStatusLabel(entry.fromStatus)}
                        </span>
                      </td>

                      {/* To Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            STATUS_COLORS[entry.toStatus]?.badge || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {getStatusLabel(entry.toStatus)}
                        </span>
                      </td>

                      {/* Changed By */}
                      <td className="py-3 px-4 text-slate-700 font-medium">{entry.changedBy}</td>

                      {/* Date & Time */}
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap text-[11px]">
                        {entry.timestamp}
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-4 max-w-xs">
                        {entry.note ? (
                          <div
                            className="text-[11px] text-slate-600 line-clamp-2"
                            title={entry.note}
                          >
                            {entry.note}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No notes</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-600 font-semibold">
                  Page {currentPage} of {totalPages} ({sortedHistory.length} total entries)
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition border border-slate-200"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        const diff = Math.abs(page - currentPage);
                        return diff === 0 || diff === 1 || page === 1 || page === totalPages;
                      })
                      .map((page, idx, arr) => {
                        if (idx > 0 && arr[idx - 1] !== page - 1) {
                          return (
                            <span key={`dots-${page}`} className="px-2 text-slate-400">
                              ...
                            </span>
                          );
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                              page === currentPage
                                ? 'bg-[#FF6B00] text-white border-[#FF6B00]'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition border border-slate-200"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
