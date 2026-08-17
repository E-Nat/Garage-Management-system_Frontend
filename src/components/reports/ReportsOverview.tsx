import React, { useState } from 'react';
import { useGarage } from '../../context/GarageContext';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart3,
  DollarSign,
  Wrench,
  TrendingUp,
  PackageCheck,
  Award,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  PieChart,
  UserCheck,
  History,
  Layers,
  Sparkles,
} from 'lucide-react';

type ReportTab = 'revenue' | 'jobs' | 'inventory' | 'mechanics';

export const ReportsOverview: React.FC = () => {
  const { repairJobs, invoices, inventory, paymentRecords, stockTransactions } = useGarage();
  const { users } = useAuth();

  const [activeTab, setActiveTab] = useState<ReportTab>('revenue');

  // Date Range Filter States
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [quickRange, setQuickRange] = useState<string>('all');

  const handleApplyQuickRange = (range: string) => {
    setQuickRange(range);
    const today = new Date();
    const todayStr = today.toISOString().substring(0, 10);

    if (range === 'all') {
      setStartDate('2025-01-01');
      setEndDate(todayStr);
    } else if (range === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().substring(0, 10);
      setStartDate(firstDay);
      setEndDate(todayStr);
    } else if (range === 'last_30') {
      const past30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
      setStartDate(past30);
      setEndDate(todayStr);
    } else if (range === 'this_year') {
      const firstYearDay = new Date(today.getFullYear(), 0, 1).toISOString().substring(0, 10);
      setStartDate(firstYearDay);
      setEndDate(todayStr);
    }
  };

  // Helper date checker
  const isWithinDateRange = (dateStr?: string) => {
    if (!dateStr) return true;
    const cleanDate = dateStr.substring(0, 10);
    return cleanDate >= startDate && cleanDate <= endDate;
  };

  // Filtered Payments & Invoices & Jobs
  const filteredPayments = paymentRecords.filter((p) => isWithinDateRange(p.date));
  const filteredInvoices = invoices.filter((inv) => isWithinDateRange(inv.issuedAt));
  const filteredJobs = repairJobs.filter((j) => isWithinDateRange(j.createdAt || j.serviceDate));
  const filteredStockTxns = stockTransactions.filter((st) => isWithinDateRange(st.date));

  // ---------------- REVENUE CALCULATIONS ----------------
  const totalRevenueCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  // Group Payments by Day (YYYY-MM-DD)
  const dailyRevenueMap: Record<string, { date: string; amount: number; count: number }> = {};
  filteredPayments.forEach((p) => {
    const day = p.date.substring(0, 10);
    if (!dailyRevenueMap[day]) {
      dailyRevenueMap[day] = { date: day, amount: 0, count: 0 };
    }
    dailyRevenueMap[day].amount += p.amount;
    dailyRevenueMap[day].count += 1;
  });
  const dailyRevenueList = Object.values(dailyRevenueMap).sort((a, b) => b.date.localeCompare(a.date));

  // Group Payments by Month (YYYY-MM)
  const monthlyRevenueMap: Record<string, { month: string; amount: number; count: number }> = {};
  filteredPayments.forEach((p) => {
    const month = p.date.substring(0, 7);
    if (!monthlyRevenueMap[month]) {
      monthlyRevenueMap[month] = { month, amount: 0, count: 0 };
    }
    monthlyRevenueMap[month].amount += p.amount;
    monthlyRevenueMap[month].count += 1;
  });
  const monthlyRevenueList = Object.values(monthlyRevenueMap).sort((a, b) => b.month.localeCompare(a.month));

  // Group Payments by Year (YYYY)
  const yearlyRevenueMap: Record<string, { year: string; amount: number; count: number }> = {};
  filteredPayments.forEach((p) => {
    const year = p.date.substring(0, 4);
    if (!yearlyRevenueMap[year]) {
      yearlyRevenueMap[year] = { year, amount: 0, count: 0 };
    }
    yearlyRevenueMap[year].amount += p.amount;
    yearlyRevenueMap[year].count += 1;
  });
  const yearlyRevenueList = Object.values(yearlyRevenueMap).sort((a, b) => b.year.localeCompare(a.year));

  // ---------------- JOB CALCULATIONS ----------------
  const totalJobsCount = filteredJobs.length;
  const serviceJobsCount = filteredJobs.filter((j) => j.jobType === 'service').length;
  const repairJobsCount = filteredJobs.filter((j) => j.jobType !== 'service').length;
  const completedJobsList = filteredJobs.filter(
    (j) => j.status === 'ready' || j.status === 'delivered' || j.status === 'completed'
  );
  const declinedJobsList = filteredJobs.filter((j) => j.status === 'declined');

  // ---------------- INVENTORY CALCULATIONS ----------------
  const lowStockItems = inventory.filter((item) => item.stock <= item.minStock);

  // ---------------- MECHANIC CALCULATIONS ----------------
  const mechanics = users.filter((u) => u.role === 'mechanic');
  const mechanicPerformance = mechanics.map((m) => {
    const assignedJobs = filteredJobs.filter((j) => j.assignedMechanicId === m.id || j.assignedMechanicName === m.name);
    const completed = assignedJobs.filter(
      (j) => j.status === 'ready' || j.status === 'delivered' || j.status === 'completed'
    );
    const activeWorkload = assignedJobs.filter(
      (j) => j.status === 'in_progress' || j.status === 'pending_inspection' || j.status === 'waiting_approval'
    );

    const estRevenue = assignedJobs.reduce((sum, j) => sum + (j.estimatedCost || 0), 0);

    return {
      mechanic: m,
      totalAssigned: assignedJobs.length,
      completedCount: completed.length,
      activeWorkloadCount: activeWorkload.length,
      estimatedRevenue: estRevenue,
      assignedJobs,
      activeWorkload,
      completedJobs: completed,
    };
  });

  return (
    <div className="space-y-6 text-slate-900">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 text-slate-900 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-slate-900" />
            Executive Financial & Operational Analytics
          </div>
          <h1 className="text-2xl font-bold">Business Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time breakdown of daily/monthly revenue, job conversion, inventory movements, and technician workload.
          </p>
        </div>
      </div>

      {/* Global Date Range Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 shrink-0">
          <Filter className="w-4 h-4 text-slate-500" />
          <span>Date Filter:</span>
        </div>

        {/* Quick Range Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'All Time' },
            { id: 'this_month', label: 'This Month' },
            { id: 'last_30', label: 'Last 30 Days' },
            { id: 'this_year', label: 'This Year' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleApplyQuickRange(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                quickRange === item.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers */}
        <div className="flex items-center gap-2 text-xs">
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setQuickRange('custom');
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 text-xs outline-hidden focus:border-slate-900"
          />
          <span className="text-slate-400 font-bold">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setQuickRange('custom');
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 text-xs outline-hidden focus:border-slate-900"
          />
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        {[
          { id: 'revenue', label: 'Revenue Reports', icon: DollarSign },
          { id: 'jobs', label: 'Job Reports', icon: Wrench },
          { id: 'inventory', label: 'Inventory Reports', icon: PackageCheck },
          { id: 'mechanics', label: 'Mechanic Workload', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ReportTab)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: REVENUE REPORTS */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* Revenue KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Gross Revenue Collected
              </span>
              <div className="text-2xl font-extrabold text-emerald-600 font-mono">
                ${totalRevenueCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-500">{filteredPayments.length} payments within date filter</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Avg. Revenue Per Payment
              </span>
              <div className="text-2xl font-extrabold text-slate-900 font-mono">
                $
                {filteredPayments.length > 0
                  ? (totalRevenueCollected / filteredPayments.length).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })
                  : '0.00'}
              </div>
              <p className="text-xs text-slate-500">Average transaction size</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Invoices Issued
              </span>
              <div className="text-2xl font-extrabold text-indigo-900 font-mono">
                {filteredInvoices.length}
              </div>
              <p className="text-xs text-slate-500">Billed repair orders</p>
            </div>
          </div>

          {/* Revenue Tables: Daily, Monthly, Yearly */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Revenue Breakdown */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 lg:col-span-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Daily Revenue</span>
                </h3>
                <span className="text-[10px] font-semibold text-slate-500">{dailyRevenueList.length} Days</span>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {dailyRevenueList.length > 0 ? (
                  dailyRevenueList.map((d) => (
                    <div
                      key={d.date}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{d.date}</div>
                        <div className="text-[10px] text-slate-500">{d.count} transaction(s)</div>
                      </div>
                      <div className="font-mono font-extrabold text-emerald-600">
                        ${d.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic p-4 text-center">No payment records found in this range.</p>
                )}
              </div>
            </div>

            {/* Monthly Revenue Breakdown */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 lg:col-span-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span>Monthly Revenue</span>
                </h3>
                <span className="text-[10px] font-semibold text-slate-500">{monthlyRevenueList.length} Months</span>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {monthlyRevenueList.length > 0 ? (
                  monthlyRevenueList.map((m) => (
                    <div
                      key={m.month}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{m.month}</div>
                        <div className="text-[10px] text-slate-500">{m.count} payments</div>
                      </div>
                      <div className="font-mono font-extrabold text-indigo-700">
                        ${m.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic p-4 text-center">No monthly data available.</p>
                )}
              </div>
            </div>

            {/* Yearly Revenue Breakdown */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 lg:col-span-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>Yearly Revenue</span>
                </h3>
                <span className="text-[10px] font-semibold text-slate-500">{yearlyRevenueList.length} Years</span>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {yearlyRevenueList.length > 0 ? (
                  yearlyRevenueList.map((y) => (
                    <div
                      key={y.year}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{y.year} Annual</div>
                        <div className="text-[10px] text-slate-500">{y.count} total payments</div>
                      </div>
                      <div className="font-mono font-extrabold text-slate-900">
                        ${y.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic p-4 text-center">No yearly data available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: JOB REPORTS */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          {/* Job KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Jobs</span>
              <div className="text-2xl font-extrabold text-slate-900">{totalJobsCount}</div>
              <p className="text-xs text-slate-500">Service + Repair combined</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Service vs Repair</span>
              <div className="text-2xl font-extrabold text-indigo-700">
                {serviceJobsCount} <span className="text-slate-400 font-normal">/</span> {repairJobsCount}
              </div>
              <p className="text-xs text-slate-500">Maintenance vs Diagnostics</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Completed Jobs</span>
              <div className="text-2xl font-extrabold text-emerald-600">{completedJobsList.length}</div>
              <p className="text-xs text-emerald-600 font-semibold">
                {totalJobsCount > 0 ? Math.round((completedJobsList.length / totalJobsCount) * 100) : 0}% Completion Rate
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Declined Jobs</span>
              <div className="text-2xl font-extrabold text-rose-600">{declinedJobsList.length}</div>
              <p className="text-xs text-rose-500 font-semibold">Declined by customer</p>
            </div>
          </div>

          {/* Detailed Lists: Completed & Declined Jobs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Completed Jobs */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Completed Jobs ({completedJobsList.length})</span>
              </h3>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {completedJobsList.length > 0 ? (
                  completedJobsList.map((j) => (
                    <div
                      key={j.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {j.jobNumber} • {j.vehicleMake} {j.vehicleModel} ({j.licensePlate})
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Customer: {j.customerName} • Assigned: {j.assignedMechanicName || 'Unassigned'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                          ${j.estimatedCost || 0}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic p-4 text-center">No completed jobs in date filter.</p>
                )}
              </div>
            </div>

            {/* Declined Jobs */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Declined Jobs ({declinedJobsList.length})</span>
              </h3>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {declinedJobsList.length > 0 ? (
                  declinedJobsList.map((j) => (
                    <div
                      key={j.id}
                      className="p-3 bg-rose-50/40 border border-rose-200 rounded-2xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {j.jobNumber} • {j.vehicleMake} {j.vehicleModel}
                        </div>
                        <div className="text-[10px] text-rose-700 font-medium">
                          Declined Note: {j.inspectionNotes || 'Customer declined repair estimate'}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">
                        Declined
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic p-4 text-center">No declined jobs in date filter.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INVENTORY REPORTS */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Inventory KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total SKUs Registered</span>
              <div className="text-2xl font-extrabold text-slate-900">{inventory.length} Parts</div>
              <p className="text-xs text-slate-500">Catalog spare items</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Low Stock Alerts</span>
              <div className="text-2xl font-extrabold text-rose-600">{lowStockItems.length} SKUs</div>
              <p className="text-xs text-rose-600 font-semibold">At or below minimum alert stock</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stock Movements Logged</span>
              <div className="text-2xl font-extrabold text-indigo-700">{filteredStockTxns.length} Movement Logs</div>
              <p className="text-xs text-slate-500">Stock In / Adjustments in date range</p>
            </div>
          </div>

          {/* Low Stock Alert Table */}
          {lowStockItems.length > 0 && (
            <div className="bg-rose-50/50 border border-rose-200 rounded-3xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-rose-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Low Stock Critical Report</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-rose-200 text-rose-900 font-bold">
                      <th className="pb-2">Part Code</th>
                      <th className="pb-2">Item Name</th>
                      <th className="pb-2">Category</th>
                      <th className="pb-2 text-right">Current Stock</th>
                      <th className="pb-2 text-right">Min Alert Threshold</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100">
                    {lowStockItems.map((item) => (
                      <tr key={item.id} className="text-slate-900 font-medium">
                        <td className="py-2.5 font-mono font-bold text-rose-800">{item.partNumber}</td>
                        <td className="py-2.5 font-bold">{item.name}</td>
                        <td className="py-2.5 text-slate-600">{item.category}</td>
                        <td className="py-2.5 text-right font-mono font-extrabold text-rose-700">{item.stock}</td>
                        <td className="py-2.5 text-right font-mono text-slate-500">{item.minStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Stock Movements Log */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <History className="w-4 h-4 text-indigo-600" />
              <span>Stock In / Stock Movement Logs ({filteredStockTxns.length})</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Item Name</th>
                    <th className="pb-2 text-right">Quantity</th>
                    <th className="pb-2">Reason / Remarks</th>
                    <th className="pb-2">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStockTxns.length > 0 ? (
                    filteredStockTxns.map((st, idx) => (
                      <tr key={st.id ? `${st.id}-${idx}` : idx} className="text-slate-800">
                        <td className="py-2.5 font-mono text-[11px] text-slate-500">{st.date}</td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              st.type === 'stock_in'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {st.type === 'stock_in' ? 'Stock In' : 'Adjustment'}
                          </span>
                        </td>
                        <td className="py-2.5 font-bold">{st.itemName}</td>
                        <td className="py-2.5 text-right font-mono font-bold">
                          {st.quantity > 0 ? `+${st.quantity}` : st.quantity}
                        </td>
                        <td className="py-2.5 text-slate-600">{st.reason || st.remarks || '-'}</td>
                        <td className="py-2.5 text-slate-500">{st.performedBy}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-400 italic">
                        No stock movement transactions recorded in this date range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MECHANIC REPORTS */}
      {activeTab === 'mechanics' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>Technician Workload & Completion Performance</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mechanicPerformance.map((mp) => (
                <div key={mp.mechanic.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{mp.mechanic.name}</h4>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">
                        {mp.mechanic.role} • {mp.mechanic.email}
                      </span>
                    </div>
                    <div className="p-2 bg-indigo-100 text-indigo-800 rounded-xl">
                      <UserCheck className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-slate-200 py-2 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-sans">Active Workload</span>
                      <strong className="text-amber-700 text-base">{mp.activeWorkloadCount} Jobs</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-sans">Completed</span>
                      <strong className="text-emerald-700 text-base">{mp.completedCount} Jobs</strong>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">Assigned Active Jobs:</span>
                    {mp.activeWorkload.length > 0 ? (
                      <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                        {mp.activeWorkload.map((j) => (
                          <div key={j.id} className="text-[11px] bg-white p-2 border border-slate-200 rounded-lg flex justify-between">
                            <span className="font-bold text-slate-800">{j.jobNumber}</span>
                            <span className="text-slate-500 uppercase text-[9px] font-semibold">{j.status.replace('_', ' ')}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No active assigned jobs currently.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
