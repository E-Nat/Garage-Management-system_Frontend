import React, { useState } from 'react';
import { useGarage } from '../../context/GarageContext';
import { useAuth } from '../../context/AuthContext';
import {
  Package,
  Sliders,
  History,
  CheckCircle2,
  Search,
  Plus,
  Minus,
  Download,
} from 'lucide-react';

export const StockManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const { inventory, stockTransactions, adjustStockQuantity } = useGarage();

  const [activeSubTab, setActiveSubTab] = useState<'stock_in' | 'adjust' | 'history'>('stock_in');

  // Today's Date String YYYY-MM-DD
  const todayStr = new Date().toISOString().substring(0, 10);

  // Stock In Form State (Item, Quantity, Date, Remarks)
  const [stockInItemId, setStockInItemId] = useState(inventory[0]?.id || '');
  const [stockInQty, setStockInQty] = useState(1);
  const [stockInDate, setStockInDate] = useState(todayStr);
  const [stockInRemarks, setStockInRemarks] = useState('');

  // Stock Adjustment Form State (Item, Increase/Decrease, Quantity, Reason, Date, Remarks)
  const [adjustItemId, setAdjustItemId] = useState(inventory[0]?.id || '');
  const [adjustDirection, setAdjustDirection] = useState<'increase' | 'decrease'>('increase');
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustReason, setAdjustReason] = useState('Physical Count Audit');
  const [adjustDate, setAdjustDate] = useState(todayStr);
  const [adjustRemarks, setAdjustRemarks] = useState('');

  // Stock History Filters
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'stock_in' | 'adjustment' | 'usage'>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle Stock In Submit
  const handleStockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockInItemId) return;
    const qty = Math.abs(Number(stockInQty));
    if (qty <= 0) return;

    const res = adjustStockQuantity(
      stockInItemId,
      qty,
      'stock_in',
      stockInRemarks || 'Stock In receiving',
      currentUser?.name || 'Staff User',
      stockInRemarks
    );

    if (res.success) {
      const item = inventory.find((i) => i.id === stockInItemId);
      showToast(`Logged Stock In: +${qty} for ${item?.name || 'Item'}`);
      setStockInQty(1);
      setStockInRemarks('');
    } else {
      alert(res.error);
    }
  };

  // Handle Stock Adjustment Submit
  const handleStockAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItemId) return;
    const qtyVal = Math.abs(Number(adjustQty));
    if (qtyVal <= 0) return;

    const delta = adjustDirection === 'increase' ? qtyVal : -qtyVal;
    const combinedReason = adjustRemarks.trim()
      ? `${adjustReason} - ${adjustRemarks.trim()}`
      : adjustReason;

    const res = adjustStockQuantity(
      adjustItemId,
      delta,
      'adjustment',
      `${combinedReason} (Date: ${adjustDate})`,
      currentUser?.name || 'Staff User'
    );

    if (res.success) {
      const item = inventory.find((i) => i.id === adjustItemId);
      showToast(
        `Stock Adjustment recorded for ${item?.name || 'Item'}: ${delta > 0 ? '+' : ''}${delta}`
      );
      setAdjustQty(1);
      setAdjustRemarks('');
    } else {
      alert(res.error);
    }
  };

  // Filter History with Date Range
  const filteredHistory = stockTransactions.filter((tx) => {
    const matchesType = historyTypeFilter === 'all' || tx.type === historyTypeFilter;
    const term = historySearch.toLowerCase();
    const matchesSearch =
      tx.partName.toLowerCase().includes(term) ||
      tx.partNumber.toLowerCase().includes(term) ||
      (tx.reason && tx.reason.toLowerCase().includes(term));

    let matchesDate = true;
    const txDate = tx.timestamp.substring(0, 10);

    if (dateRangeFilter === 'today') {
      matchesDate = txDate === todayStr;
    } else if (dateRangeFilter === 'past_7_days') {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 7);
      const past7Str = past7.toISOString().substring(0, 10);
      matchesDate = txDate >= past7Str;
    } else if (dateRangeFilter === 'this_month') {
      matchesDate = txDate.substring(0, 7) === todayStr.substring(0, 7);
    } else if (dateRangeFilter === 'custom') {
      if (customStartDate && txDate < customStartDate) matchesDate = false;
      if (customEndDate && txDate > customEndDate) matchesDate = false;
    }

    return matchesType && matchesSearch && matchesDate;
  });

  // Export to Excel / CSV
  const handleExportToExcel = () => {
    if (filteredHistory.length === 0) {
      alert('No rows available to export.');
      return;
    }

    const headers = ['Item', 'Part Number', 'Movement Type', 'Quantity', 'Date & Time', 'Reason / Remarks', 'Recorded By'];
    const rows = filteredHistory.map((tx) => {
      const typeLabel =
        tx.type === 'stock_in'
          ? 'Stock In'
          : tx.type === 'usage'
          ? 'Usage'
          : 'Adjustment';
      const qtyStr = tx.quantity > 0 ? `+${tx.quantity}` : `${tx.quantity}`;
      const reasonStr = [tx.reason, tx.supplier ? `Ref: ${tx.supplier}` : ''].filter(Boolean).join(' | ');

      return [
        `"${(tx.partName || '').replace(/"/g, '""')}"`,
        `"${(tx.partNumber || '').replace(/"/g, '""')}"`,
        `"${typeLabel}"`,
        `"${qtyStr}"`,
        `"${tx.timestamp}"`,
        `"${reasonStr.replace(/"/g, '""')}"`,
        `"${(tx.performedBy || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Stock_History_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Exported filtered stock records to Excel (CSV).');
  };

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl font-bold text-slate-900">Stock</h1>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 space-x-4 overflow-x-auto">
        <button
          id="tab-stock-in"
          onClick={() => setActiveSubTab('stock_in')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 transition border-b-2 shrink-0 ${
            activeSubTab === 'stock_in'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Stock In</span>
        </button>

        <button
          id="tab-stock-adjustment"
          onClick={() => setActiveSubTab('adjust')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 transition border-b-2 shrink-0 ${
            activeSubTab === 'adjust'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Stock Adjustment</span>
        </button>

        <button
          id="tab-stock-history"
          onClick={() => setActiveSubTab('history')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 transition border-b-2 shrink-0 ${
            activeSubTab === 'history'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Stock History ({stockTransactions.length})</span>
        </button>
      </div>

      {/* TAB 1: STOCK IN FORM */}
      {activeSubTab === 'stock_in' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-xl space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-slate-700" />
            Stock In
          </h2>

          <form onSubmit={handleStockInSubmit} className="space-y-4 text-xs">
            {/* Item Select (Item name only) */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Item <span className="text-rose-500">*</span>
              </label>
              <select
                id="stock-in-item-select"
                value={stockInItemId}
                onChange={(e) => setStockInItemId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:border-slate-900 outline-none"
                required
              >
                {inventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Quantity <span className="text-rose-500">*</span>
                </label>
                <input
                  id="stock-in-quantity-input"
                  type="number"
                  min="1"
                  value={stockInQty}
                  onChange={(e) => setStockInQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:border-slate-900 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Date <span className="text-rose-500">*</span>
                </label>
                <input
                  id="stock-in-date-input"
                  type="date"
                  value={stockInDate}
                  onChange={(e) => setStockInDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-slate-900 outline-none"
                  required
                />
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Remarks</label>
              <input
                id="stock-in-remarks-input"
                type="text"
                value={stockInRemarks}
                onChange={(e) => setStockInRemarks(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-slate-900 outline-none"
              />
            </div>

            <button
              id="submit-stock-in-btn"
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs transition text-xs"
            >
              Record Stock In
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: STOCK ADJUSTMENT FORM */}
      {activeSubTab === 'adjust' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-xl space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-600" />
            Stock Adjustment
          </h2>

          <form onSubmit={handleStockAdjustmentSubmit} className="space-y-4 text-xs">
            {/* Item Select (Item name only) */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Item <span className="text-rose-500">*</span>
              </label>
              <select
                id="adjust-item-select"
                value={adjustItemId}
                onChange={(e) => setAdjustItemId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:border-slate-900 outline-none"
                required
              >
                {inventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Increase / Decrease Toggle */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Adjustment Type <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="adjust-toggle-increase"
                  onClick={() => setAdjustDirection('increase')}
                  className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 border transition ${
                    adjustDirection === 'increase'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>Increase (+)</span>
                </button>

                <button
                  type="button"
                  id="adjust-toggle-decrease"
                  onClick={() => setAdjustDirection('decrease')}
                  className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 border transition ${
                    adjustDirection === 'decrease'
                      ? 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-400'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Minus className="w-4 h-4 text-rose-600" />
                  <span>Decrease (-)</span>
                </button>
              </div>
            </div>

            {/* Quantity & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Quantity <span className="text-rose-500">*</span>
                </label>
                <input
                  id="adjust-quantity-input"
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:border-slate-900 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Date <span className="text-rose-500">*</span>
                </label>
                <input
                  id="adjust-date-input"
                  type="date"
                  value={adjustDate}
                  onChange={(e) => setAdjustDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-slate-900 outline-none"
                  required
                />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Reason <span className="text-rose-500">*</span>
              </label>
              <input
                id="adjust-reason-input"
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-slate-900 outline-none"
                required
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Remarks</label>
              <input
                id="adjust-remarks-input"
                type="text"
                value={adjustRemarks}
                onChange={(e) => setAdjustRemarks(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-slate-900 outline-none"
              />
            </div>

            <button
              id="submit-adjust-btn"
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs transition text-xs"
            >
              Save Adjustment
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: STOCK HISTORY TABLE */}
      {activeSubTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
            <h2 className="text-sm font-bold text-slate-900">Stock History</h2>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="history-search-input"
                  type="text"
                  placeholder="Search..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-slate-900 outline-none"
                />
              </div>

              <select
                id="history-type-filter"
                value={historyTypeFilter}
                onChange={(e) => setHistoryTypeFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:border-slate-900 outline-none"
              >
                <option value="all">All Movement Types</option>
                <option value="stock_in">Stock In</option>
                <option value="adjustment">Stock Adjustment</option>
                <option value="usage">Usage</option>
              </select>

              <select
                id="history-date-filter"
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:border-slate-900 outline-none"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="past_7_days">Past 7 Days</option>
                <option value="this_month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>

              {dateRangeFilter === 'custom' && (
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                  <span className="text-slate-400 text-xs">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              )}

              <button
                id="export-stock-history-btn"
                onClick={handleExportToExcel}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export to Excel</span>
              </button>
            </div>
          </div>

          {/* Movements Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Movement Type</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Reason / Remarks</th>
                  <th className="py-3 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((tx, idx) => {
                    const isPositive = tx.quantity > 0;

                    return (
                      <tr key={tx.id ? `${tx.id}-${idx}` : idx} className="hover:bg-slate-50/80 transition-colors">
                        {/* Item */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{tx.partName}</div>
                          <div className="text-[10px] font-mono text-slate-500">{tx.partNumber}</div>
                        </td>

                        {/* Type */}
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider ${
                              tx.type === 'stock_in'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : tx.type === 'usage'
                                ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {tx.type === 'stock_in'
                              ? 'Stock In'
                              : tx.type === 'usage'
                              ? 'Usage'
                              : 'Adjustment'}
                          </span>
                        </td>

                        {/* Quantity */}
                        <td
                          className={`py-3 px-4 text-right font-bold font-mono text-xs ${
                            isPositive ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isPositive ? `+${tx.quantity}` : tx.quantity}
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                          {tx.timestamp}
                        </td>

                        {/* Reason / Remarks */}
                        <td className="py-3 px-4 text-slate-700">
                          {tx.reason || '—'}
                          {tx.supplier && (
                            <span className="block text-[10px] text-slate-400">
                              Ref: {tx.supplier}
                            </span>
                          )}
                        </td>

                        {/* Recorded By */}
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {tx.performedBy}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No stock history records match your search filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
