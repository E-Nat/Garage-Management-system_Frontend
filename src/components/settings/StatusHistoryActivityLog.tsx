import React, { useState, useMemo, useEffect } from 'react';
import { useGarage } from '../../context/GarageContext';
import { RepairStatusHistory } from '../../types';
import { INITIAL_USERS } from '../../data/mockUsers';
import { getRepairStatusHistories } from '../../services/api';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  ArrowUpDown,
  Search,
} from 'lucide-react';

const STATUS_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  pending_inspection: { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  waiting_approval: { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  in_progress: { bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  delivered: { bg: 'bg-teal-50', text: 'text-teal-700', badge: 'bg-teal-100 text-teal-800 border-teal-200' },
  declined: { bg: 'bg-rose-50', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-800 border-rose-200' },
  cancelled: { bg: 'bg-slate-100', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-800 border-slate-200' },
  'Customer Intake': { bg: 'bg-indigo-50', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  intake: { bg: 'bg-indigo-50', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
};

const getStatusLabel = (status?: string | null): string => {
  if (!status) return '—';
  if (status.toLowerCase().includes('intake')) return 'Customer Intake';
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const StatusHistoryActivityLog: React.FC = () => {
  const { repairStatusHistory, repairJobs } = useGarage();

  // Remote Backend History state (if available)
  const [remoteHistory, setRemoteHistory] = useState<RepairStatusHistory[]>([]);

  // Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [changedByFilter, setChangedByFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Attempt to load authoritative backend status history on mount
  useEffect(() => {
    let isMounted = true;
    getRepairStatusHistories({ per_page: 'all' })
      .then((res) => {
        if (isMounted && res && Array.isArray(res.data) && res.data.length > 0) {
          const mapped: RepairStatusHistory[] = res.data.map((item: any) => ({
            id: String(item.id),
            jobId: item.repair_job_id ? String(item.repair_job_id) : '',
            fromStatus: item.from_status || 'Customer Intake',
            toStatus: item.to_status,
            changedBy: item.changed_by_user_name || 'Staff User',
            timestamp: item.created_at ? item.created_at.substring(0, 16).replace('T', ' ') : '',
            note: item.note || '',
          }));
          setRemoteHistory(mapped);
        }
      })
      .catch((err) => {
        console.warn('API getRepairStatusHistories failed, using local context state:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Get unique staff members from real users + history
  const staffMembers = useMemo(() => {
    const members = new Set<string>();
    INITIAL_USERS.forEach((u) => {
      if (u.role !== 'customer') members.add(u.name);
    });
    repairStatusHistory.forEach((h) => {
      if (h.changedBy && h.changedBy.trim()) members.add(h.changedBy.trim());
    });
    remoteHistory.forEach((h) => {
      if (h.changedBy && h.changedBy.trim()) members.add(h.changedBy.trim());
    });
    return Array.from(members).sort();
  }, [repairStatusHistory, remoteHistory]);

  // Get unique statuses
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>([
      'pending_inspection',
      'waiting_approval',
      'in_progress',
      'completed',
      'delivered',
      'declined',
    ]);
    repairStatusHistory.forEach((h) => {
      if (h.fromStatus && h.fromStatus !== 'Customer Intake') statuses.add(h.fromStatus);
      if (h.toStatus) statuses.add(h.toStatus);
    });
    return Array.from(statuses).sort();
  }, [repairStatusHistory]);

  // Get job type filter options from jobs
  const jobTypes = useMemo(() => {
    return ['Repair', 'Service', 'Inspection'];
  }, []);

  // Build enriched history with job details
  // Deduplicate by entry ID to prevent duplicate items
  const enrichedHistory = useMemo(() => {
    const combined = new Map<string, RepairStatusHistory>();

    // 1. Authoritative Remote backend history (if loaded)
    remoteHistory.forEach((h) => {
      if (!combined.has(h.id)) combined.set(h.id, h);
    });

    // 2. Context status history log
    repairStatusHistory.forEach((h) => {
      if (!combined.has(h.id)) combined.set(h.id, h);
    });

    // 3. Job embedded status history
    repairJobs.forEach((job) => {
      (job.statusHistory || []).forEach((h) => {
        if (!combined.has(h.id)) combined.set(h.id, h);
      });
    });

    return Array.from(combined.values()).map((history) => {
      const job = repairJobs.find((j) => String(j.id) === String(history.jobId));
      let jobType = 'Repair';
      if (job?.jobType) {
        jobType = job.jobType.charAt(0).toUpperCase() + job.jobType.slice(1);
      } else if (job?.description?.toLowerCase().includes('oil change') || job?.description?.toLowerCase().includes('service')) {
        jobType = 'Service';
      } else if (job?.description?.toLowerCase().includes('inspection')) {
        jobType = 'Inspection';
      }

      return {
        ...history,
        jobType,
        jobNumber: job?.jobNumber || (history.jobId ? `#${history.jobId}` : 'N/A'),
        customerName: job?.customerName || 'Customer',
        vehicleInfo: job ? `${job.vehicleMake} ${job.vehicleModel} (${job.licensePlate})` : 'Vehicle',
      };
    });
  }, [remoteHistory, repairStatusHistory, repairJobs]);

  // Apply filters
  const filteredHistory = useMemo(() => {
    const fromCompare = dateFromFilter ? `${dateFromFilter} 00:00:00` : '';
    const toCompare = dateToFilter ? `${dateToFilter} 23:59:59` : '';
    const searchLower = searchQuery.toLowerCase().trim();

    return enrichedHistory.filter((history) => {
      const histDate = history.timestamp ? history.timestamp.replace('T', ' ') : '';

      // Date range filter
      if (fromCompare && histDate < fromCompare) return false;
      if (toCompare && histDate > toCompare) return false;

      // Job type filter
      if (jobTypeFilter !== 'all' && history.jobType.toLowerCase() !== jobTypeFilter.toLowerCase()) return false;

      // Status filter (matches either from or to)
      if (statusFilter !== 'all') {
        if (history.fromStatus !== statusFilter && history.toStatus !== statusFilter) return false;
      }

      // Changed by filter
      if (changedByFilter !== 'all' && history.changedBy !== changedByFilter) return false;

      // Search keyword filter
      if (searchLower) {
        const matchesJobNumber = history.jobNumber?.toLowerCase().includes(searchLower);
        const matchesCustomer = history.customerName?.toLowerCase().includes(searchLower);
        const matchesVehicle = history.vehicleInfo?.toLowerCase().includes(searchLower);
        const matchesNote = history.note?.toLowerCase().includes(searchLower);
        const matchesStaff = history.changedBy?.toLowerCase().includes(searchLower);

        if (!matchesJobNumber && !matchesCustomer && !matchesVehicle && !matchesNote && !matchesStaff) {
          return false;
        }
      }

      return true;
    });
  }, [enrichedHistory, dateFromFilter, dateToFilter, jobTypeFilter, statusFilter, changedByFilter, searchQuery]);

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
  const totalPages = Math.max(1, Math.ceil(sortedHistory.length / itemsPerPage));
  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedHistory.slice(start, start + itemsPerPage);
  }, [sortedHistory, currentPage]);

  const handleReset = () => {
    setSearchQuery('');
    setDateFromFilter('');
    setDateToFilter('');
    setJobTypeFilter('all');
    setStatusFilter('all');
    setChangedByFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
    dateFromFilter ||
    dateToFilter ||
    jobTypeFilter !== 'all' ||
    statusFilter !== 'all' ||
    changedByFilter !== 'all'
  );

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
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition border border-slate-200 cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by RO Job #, Customer, Vehicle, Staff, or Notes..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
            />
          </div>
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
              type="button"
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
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
                    type="button"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition border border-slate-200 cursor-pointer"
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
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
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
                    type="button"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition border border-slate-200 cursor-pointer"
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
