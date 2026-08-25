import React, { useState } from 'react';
import { useGarage } from '../../context/GarageContext';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Car,
  Clock,
  FileCheck,
  Wrench,
  CheckCircle2,
  PackageCheck,
  XCircle,
  DollarSign,
  AlertTriangle,
  Calendar,
  Filter,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  Receipt,
} from 'lucide-react';

export type DashboardDateFilterPreset = 'today' | 'week' | 'month' | 'custom';

export const OperationalDashboardWidgets: React.FC = () => {
  const { customers, vehicles, repairJobs, invoices, inventory } = useGarage();
  const { setActiveTab } = useAuth();

  // Unified Dashboard Date Filter State
  const [dateFilter, setDateFilter] = useState<DashboardDateFilterPreset>('today');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const now = new Date();

  const formatYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Helper to compute active Start and End date strings
  const getActiveDateRange = () => {
    const year = now.getFullYear();
    const month = now.getMonth();

    if (dateFilter === 'today') {
      const todayStr = formatYMD(now);
      return { start: todayStr, end: todayStr, label: `Today (${todayStr})` };
    }

    if (dateFilter === 'week') {
      const dayOfWeek = now.getDay();
      const distToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distToMon);
      const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);

      const startStr = formatYMD(monday);
      const endStr = formatYMD(sunday);
      return { start: startStr, end: endStr, label: `This Week (${startStr} to ${endStr})` };
    }

    if (dateFilter === 'month') {
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);

      const startStr = formatYMD(startOfMonth);
      const endStr = formatYMD(endOfMonth);
      return { start: startStr, end: endStr, label: `This Month (${startStr} to ${endStr})` };
    }

    if (dateFilter === 'custom') {
      let label = 'Custom Range';
      if (customStartDate && customEndDate) {
        label = `Custom (${customStartDate} to ${customEndDate})`;
      } else if (customStartDate) {
        label = `From ${customStartDate}`;
      } else if (customEndDate) {
        label = `Until ${customEndDate}`;
      }
      return {
        start: customStartDate,
        end: customEndDate,
        label,
      };
    }

    return { start: '', end: '', label: 'All Time' };
  };

  const activeRange = getActiveDateRange();

  // Helper to check if any given date string falls within active date range
  const isDateInRange = (dateStr?: string): boolean => {
    if (!activeRange.start && !activeRange.end) return true;
    if (!dateStr) return false;
    const extracted = dateStr.split(' ')[0].split('T')[0];
    if (activeRange.start && extracted < activeRange.start) return false;
    if (activeRange.end && extracted > activeRange.end) return false;
    return true;
  };

  // Period widgets use creation/payment timestamps, while status widgets use transition timestamps.
  const filteredCustomers = customers.filter((c) => isDateInRange(c.createdAt));
  const newCustomers = filteredCustomers.length;

  // 2. Filtered Vehicles
  const filteredVehicles = vehicles.filter((v) => isDateInRange(v.createdAt));
  const newVehicles = filteredVehicles.length;

  const filteredRepairJobs = repairJobs.filter((j) => {
    const history = j.statusHistory || [];
    return history.length > 0
      ? history.some((entry) => isDateInRange(entry.timestamp))
      : isDateInRange(j.entryDate || j.serviceDate || j.receivedDate);
  });

  const enteredStatusCount = (statuses: string[]) =>
    repairJobs.filter((job) => {
      const history = job.statusHistory || [];
      if (history.length > 0) {
        return history.some(
          (entry) => statuses.includes(entry.toStatus) && isDateInRange(entry.timestamp)
        );
      }
      return statuses.includes(job.status) && isDateInRange(job.entryDate || job.serviceDate || job.receivedDate);
    }).length;

  // Job Status breakdown for filtered jobs
  const pendingInspectionCount = enteredStatusCount(['pending_inspection', 'checked_in', 'diagnosing']);

  const waitingApprovalCount = enteredStatusCount(['waiting_approval', 'waiting_parts']);

  const inProgressCount = enteredStatusCount(['in_progress']);

  const completedCount = enteredStatusCount(['completed', 'ready']);

  const deliveredCount = enteredStatusCount(['delivered']);

  const declinedCount = enteredStatusCount(['declined']);

  // 4. Filtered Revenue (Paid Invoices)
  const paidInvoicesInRange = invoices.filter(
    (inv) =>
      inv.status === 'paid' &&
      isDateInRange(inv.paidAt || inv.issuedAt || (inv as unknown as { createdAt?: string }).createdAt)
  );
  const calculatedRevenue = paidInvoicesInRange.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const paidInvoicesCount = paidInvoicesInRange.length;

  // 5. Low stock items list (items at or below minimum alert stock)
  const lowStockItems = inventory.filter((item) => item.stock <= item.minStock);

  const handleStatusCardClick = (statusKey: string) => {
    sessionStorage.setItem('repair_job_status_filter', statusKey);
    setActiveTab('repairs');
  };

  const handlePresetSelect = (preset: DashboardDateFilterPreset) => {
    setDateFilter(preset);
    if (preset !== 'custom') {
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  const handleResetFilter = () => {
    setDateFilter('today');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const presetLabels: Record<DashboardDateFilterPreset, string> = {
    today: 'Today',
    week: 'This Week',
    month: 'This Month',
    custom: 'Custom Range',
  };

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Master Date Filter Bar for ALL Dashboard Widgets */}
      <div
        id="widget-date-filter-container"
        className="bg-white p-4 sm:p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-slate-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Date Range
              </span>
              <span className="text-xs font-medium text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200/60">
                {activeRange.label}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(['today', 'week', 'month', 'custom'] as DashboardDateFilterPreset[]).map((preset) => {
            const isActive = dateFilter === preset;
            return (
              <button
                key={preset}
                id={`date-filter-btn-${preset}`}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#FF6B00] text-white font-semibold shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                }`}
              >
                {preset === 'custom' && <Filter className="w-3 h-3 inline mr-1 text-slate-400" />}
                {presetLabels[preset]}
              </button>
            );
          })}

          {dateFilter !== 'today' && (
            <button
              id="date-filter-reset-btn"
              type="button"
              onClick={handleResetFilter}
              title="Reset to Today"
              className="p-1.5 text-xs text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200/60"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Custom Date Range Selector (Shown when 'custom' is active) */}
      {dateFilter === 'custom' && (
        <div
          id="custom-date-range-picker"
          className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-4 text-xs"
        >
          <div className="flex items-center gap-2">
            <label htmlFor="custom-start-date-input" className="font-medium text-slate-600">
              Start Date:
            </label>
            <input
              id="custom-start-date-input"
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:border-slate-400 focus:ring-1 focus:ring-slate-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="custom-end-date-input" className="font-medium text-slate-600">
              End Date:
            </label>
            <input
              id="custom-end-date-input"
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:border-slate-400 focus:ring-1 focus:ring-slate-400 focus:outline-none"
            />
          </div>

          {(customStartDate || customEndDate) && (
            <button
              type="button"
              onClick={() => {
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className="px-2.5 py-1 text-slate-500 hover:text-slate-900 text-xs font-medium underline cursor-pointer"
            >
              Clear dates
            </button>
          )}
        </div>
      )}

      {/* Top Stats Grid: Total Customers & Total Vehicles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Customers */}
        <div
          id="widget-total-customers"
          onClick={() => setActiveTab('customers')}
          className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-slate-200 transition-colors group"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                New Customers
              </span>
              {dateFilter !== 'all' && (
                <span className="text-[10px] font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                  Filtered
                </span>
              )}
            </div>
            <div className="text-3xl font-semibold text-slate-900 mt-1">{newCustomers}</div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1 group-hover:text-slate-700 transition-colors">
              <span>View customer directory</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
          <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Total Vehicles */}
        <div
          id="widget-total-vehicles"
          onClick={() => setActiveTab('vehicles')}
          className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-slate-200 transition-colors group"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                New Vehicles
              </span>
              {dateFilter !== 'all' && (
                <span className="text-[10px] font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                  Filtered
                </span>
              )}
            </div>
            <div className="text-3xl font-semibold text-slate-900 mt-1">{newVehicles}</div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1 group-hover:text-slate-700 transition-colors">
              <span>View registered vehicles</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
          <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
            <Car className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Stat Cards Per Job Status */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <span>Job Status Breakdown</span>
            <span className="text-xs font-normal text-slate-400">
              ({filteredRepairJobs.length} total)
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Pending Inspection */}
          <button
            id="widget-pending-inspection"
            type="button"
            onClick={() => handleStatusCardClick('pending_inspection')}
            className="bg-white hover:bg-slate-50/70 p-4 rounded-xl border border-slate-100 shadow-sm transition-colors text-left flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium text-slate-600 block">
                Pending Inspection
              </span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-semibold text-slate-900">{pendingInspectionCount}</div>
          </button>

          {/* Waiting Approval */}
          <button
            id="widget-waiting-approval"
            type="button"
            onClick={() => handleStatusCardClick('waiting_approval')}
            className="bg-white hover:bg-slate-50/70 p-4 rounded-xl border border-slate-100 shadow-sm transition-colors text-left flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium text-slate-600 block">
                Waiting Approval
              </span>
              <FileCheck className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-semibold text-slate-900">{waitingApprovalCount}</div>
          </button>

          {/* In Progress */}
          <button
            id="widget-in-progress"
            type="button"
            onClick={() => handleStatusCardClick('in_progress')}
            className="bg-white hover:bg-slate-50/70 p-4 rounded-xl border border-slate-100 shadow-sm transition-colors text-left flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium text-slate-600 block">In Progress</span>
              <Wrench className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-semibold text-slate-900">{inProgressCount}</div>
          </button>

          {/* Completed */}
          <button
            id="widget-completed"
            type="button"
            onClick={() => handleStatusCardClick('completed')}
            className="bg-white hover:bg-slate-50/70 p-4 rounded-xl border border-slate-100 shadow-sm transition-colors text-left flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium text-slate-600 block">Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-semibold text-slate-900">{completedCount}</div>
          </button>

          {/* Delivered */}
          <button
            id="widget-delivered"
            type="button"
            onClick={() => handleStatusCardClick('delivered')}
            className="bg-white hover:bg-slate-50/70 p-4 rounded-xl border border-slate-100 shadow-sm transition-colors text-left flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium text-slate-600 block">Delivered</span>
              <PackageCheck className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-semibold text-slate-900">{deliveredCount}</div>
          </button>

          {/* Declined */}
          <button
            id="widget-declined"
            type="button"
            onClick={() => handleStatusCardClick('declined')}
            className="bg-white hover:bg-slate-50/70 p-4 rounded-xl border border-slate-100 shadow-sm transition-colors text-left flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium text-slate-600 block">Declined</span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-semibold text-slate-900">{declinedCount}</div>
          </button>
        </div>
      </div>

      {/* Revenue Card (Synced with Master Dashboard Date Filter) */}
      <div
        id="widget-revenue-card"
        className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-slate-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                  Total Paid Revenue
                </span>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                  {activeRange.label}
                </span>
              </div>
              <div className="text-3xl font-semibold text-slate-900 mt-0.5">
                ${calculatedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px] font-medium uppercase tracking-wider">Paid Invoices</span>
              <span className="font-semibold text-slate-900">{paidInvoicesCount} invoices</span>
            </div>
            <button
              onClick={() => setActiveTab('invoices')}
              className="px-4 py-2 bg-[#FF6B00] hover:bg-[#E56000] text-white font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer text-sm"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>View Invoices</span>
            </button>
          </div>
        </div>
      </div>

      {/* Low Stock Items List */}
      <div
        id="widget-low-stock-alert"
        className="bg-amber-50/40 border border-amber-200 rounded-xl p-5 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="text-amber-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Low Stock Alerts ({lowStockItems.length})
              </h3>
              <p className="text-xs text-slate-500">
                Items at or below minimum threshold
              </p>
            </div>
          </div>

        </div>

        {/* Low stock is a live inventory snapshot and is intentionally not date-filtered. */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-medium uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4 text-right">Current Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lowStockItems.length > 0 ? (
                lowStockItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      <span className="font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/50">
                        {item.stock}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="py-6 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2 text-emerald-600 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>No low stock items. All inventory is well stocked.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
