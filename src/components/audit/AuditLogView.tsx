import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuditLog } from '../../types';
import {
  ShieldAlert,
  Search,
  Filter,
  Calendar,
  Lock,
  Eye,
  X,
  FileText,
  UserCheck,
  CheckCircle2,
  Clock,
  Layers,
  Info,
} from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const { currentUser, auditLogs } = useAuth();

  // Modal State
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('ALL');

  // Check Admin / Owner access
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner';

  // Filter logs based on search query, module, and date range
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (log.userName && log.userName.toLowerCase().includes(q)) ||
        (log.action && log.action.toLowerCase().includes(q)) ||
        (log.reference && log.reference.toLowerCase().includes(q)) ||
        (log.details && log.details.toLowerCase().includes(q)) ||
        (log.module && log.module.toLowerCase().includes(q));

      // 2. Module Filter
      const matchesModule =
        selectedModule === 'ALL' ||
        log.module?.toUpperCase() === selectedModule.toUpperCase() ||
        (selectedModule === 'REPAIR' && log.module === 'Repair Job');

      // 3. Date Range Filter
      let matchesDate = true;
      if (selectedDateRange !== 'ALL' && log.timestamp) {
        const logDate = new Date(log.timestamp);
        const now = new Date();
        
        if (!isNaN(logDate.getTime())) {
          if (selectedDateRange === 'TODAY') {
            matchesDate =
              logDate.getDate() === now.getDate() &&
              logDate.getMonth() === now.getMonth() &&
              logDate.getFullYear() === now.getFullYear();
          } else if (selectedDateRange === 'THIS_WEEK') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7);
            matchesDate = logDate >= sevenDaysAgo;
          } else if (selectedDateRange === 'THIS_MONTH') {
            matchesDate =
              logDate.getMonth() === now.getMonth() &&
              logDate.getFullYear() === now.getFullYear();
          }
        }
      }

      return matchesSearch && matchesModule && matchesDate;
    });
  }, [auditLogs, searchQuery, selectedModule, selectedDateRange]);

  if (!isAdmin) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-xs text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Only users with the <span className="font-bold text-slate-900 uppercase">Admin</span> role can access Activity Logs.
        </p>
      </div>
    );
  }

  // Get module badge styling
  const getModuleBadgeStyle = (moduleName: string) => {
    switch (moduleName) {
      case 'Customer':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Vehicle':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Repair Job':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Payment':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Telegram':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-900" />
            Centralized System Audit Trail
          </div>
          <h1 className="text-2xl font-bold">Activity Logs</h1>
          <p className="text-xs text-slate-500 mt-1">
            Centralized activity logs for all system operations
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-600 font-medium">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Read-Only & Immutable Audit Log</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by user, reference (e.g. RO-2026-0481), action, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-hidden focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Module Filter Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Module:</span>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
              >
                <option value="ALL">All Modules</option>
                <option value="Customer">Customer</option>
                <option value="Vehicle">Vehicle</option>
                <option value="Repair Job">Repair Job</option>
                <option value="Payment">Payment</option>
                <option value="Telegram">Telegram</option>
              </select>
            </div>

            {/* Date Range Dropdown */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Date Range:</span>
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="THIS_WEEK">This Week</option>
                <option value="THIS_MONTH">This Month</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Activity Log Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">User</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Module</th>
                <th className="py-3 px-3 font-mono">Reference</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs font-medium">
                    No activity logs found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr key={`${log.id || 'log'}-${idx}`} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => setSelectedLog(log)}>
                    <td className="py-3.5 px-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-900">
                      {log.userName}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-slate-900">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getModuleBadgeStyle(log.module)}`}>
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                      {log.reference || '—'}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-[#FF6B00] hover:text-white text-slate-700 font-bold rounded-lg text-[11px] inline-flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Log Details Modal (Read-Only) */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getModuleBadgeStyle(selectedLog.module)}`}>
                    {selectedLog.module}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">ID: {selectedLog.id}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  {selectedLog.action}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Read-Only Details Grid */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    User
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedLog.userName}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Date & Time
                  </span>
                  <span className="font-mono font-semibold text-slate-700">
                    {selectedLog.timestamp}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Module
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedLog.module}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Reference Code
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedLog.reference || '—'}
                  </span>
                </div>
              </div>

              {/* Status / Value Change Comparison */}
              {(selectedLog.previousValue || selectedLog.newValue) && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Recorded State Change
                  </span>
                  <div className="flex items-center justify-between gap-2 p-3 bg-white border border-slate-200 rounded-xl">
                    {selectedLog.previousValue && (
                      <div>
                        <span className="text-[10px] text-slate-400 block">Previous Status / Value</span>
                        <span className="font-bold text-rose-700 line-through">{selectedLog.previousValue}</span>
                      </div>
                    )}
                    {selectedLog.previousValue && selectedLog.newValue && (
                      <span className="text-slate-400 font-bold">→</span>
                    )}
                    {selectedLog.newValue && (
                      <div>
                        <span className="text-[10px] text-slate-400 block">New Status / Value</span>
                        <span className="font-bold text-emerald-700">{selectedLog.newValue}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description / Details */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Description / Event Details
                </span>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {selectedLog.details || 'No additional details logged.'}
                </p>
              </div>

              {selectedLog.ipAddress && (
                <div className="text-[10px] text-slate-400 font-mono text-right">
                  Client IP: {selectedLog.ipAddress}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#FF6B00] hover:bg-[#E56000] text-white font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
