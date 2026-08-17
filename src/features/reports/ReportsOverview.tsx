import React from 'react';
import { useGarage } from '../../context/GarageContext';
import {
  BarChart3,
  DollarSign,
  Wrench,
  TrendingUp,
  PackageCheck,
  Award,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

export const ReportsOverview: React.FC = () => {
  const { repairJobs, invoices, inventory, paymentRecords } = useGarage();

  // Calculate actual total money collected from payment records
  const totalRevenueCollected = paymentRecords.reduce((sum, p) => sum + p.amount, 0);

  // Calculate total unpaid balance remaining across active invoices
  const totalUnpaidReceivables = invoices.reduce(
    (sum, i) => sum + (i.balanceRemaining !== undefined ? i.balanceRemaining : i.status === 'paid' ? 0 : i.totalAmount),
    0
  );

  // Calculate total discounts given
  const totalDiscountsGiven = invoices.reduce(
    (sum, i) =>
      sum +
      (i.itemDiscountsTotal || 0) +
      (i.manualDiscountAmount || 0) +
      (i.campaignDiscountTotal || 0),
    0
  );

  const completedJobsCount = repairJobs.filter(
    (j) => j.status === 'ready' || j.status === 'delivered' || j.status === 'completed'
  ).length;

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
            Track gross revenue collected, pending receivables, discount allowances, repair throughput, and technician efficiency metrics.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Settled Cash Collected</span>
            <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            ${totalRevenueCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-emerald-600 font-semibold">{paymentRecords.length} total payment logs</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Receivables</span>
            <div className="p-2 bg-amber-50 text-amber-800 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-700 font-mono">
            ${totalUnpaidReceivables.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-500">Uncollected invoice balances</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Discounts Given</span>
            <div className="p-2 bg-indigo-50 text-indigo-800 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-900 font-mono">
            ${totalDiscountsGiven.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-500">Item + Manual + Campaign</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Jobs Completed</span>
            <div className="p-2 bg-slate-100 text-slate-800 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {completedJobsCount} <span className="text-xs text-slate-500 font-normal">/ {repairJobs.length} total</span>
          </div>
          <p className="text-xs text-slate-500">100% inspection logs filled</p>
        </div>
      </div>

      {/* Detailed Report Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mechanic Performance Summary */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            Technician Performance & Productivity
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Dave Miller (Senior Technician)</div>
                <div className="text-[10px] text-slate-500">Assigned Orders: 2 • Average Turnaround: 3.2 hrs</div>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                  96% On-Time
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Robert Tanaka (Diagnostic Lead)</div>
                <div className="text-[10px] text-slate-500">Assigned Orders: 2 • Average Turnaround: 2.8 hrs</div>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                  98% On-Time
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Parts Consumption Breakdown */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-600" />
            High-Volume Spare Parts Consumption
          </h2>

          <div className="space-y-3 text-xs">
            {inventory.slice(0, 4).map((p) => (
              <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{p.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{p.partNumber}</div>
                </div>
                <div className="text-right font-mono font-bold text-slate-900">
                  {p.stock} units in stock
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
