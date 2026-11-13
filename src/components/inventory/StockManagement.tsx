import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, History, Minus, Package, Plus, Sliders } from 'lucide-react';
import { createStockMovement, getItems, getStockMovements } from '../../services/api';
import type {
  LaravelItem,
  LaravelMechanicItem,
  LaravelPaginationMeta,
  LaravelStockMovement,
} from '../../services/api';
import { getApiErrorDetails } from '../../utils/apiError';

const PAGE_SIZE = 25;
const ADJUSTMENT_REASONS = ['Count correction', 'Damaged', 'Returned', 'Other'] as const;

const isLaravelItem = (
  item: LaravelItem | LaravelMechanicItem
): item is LaravelItem => 'status' in item;

const emptyMeta = (total: number): LaravelPaginationMeta => ({
  current_page: 1,
  last_page: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  per_page: PAGE_SIZE,
  total,
});

interface StockManagementProps {
  initialTab?: 'stock_in' | 'adjust' | 'history';
}

export const StockManagement: React.FC<StockManagementProps> = ({ initialTab = 'stock_in' }) => {
  const today = new Date().toISOString().slice(0, 10);
  const [activeTab, setActiveTab] = useState<'stock_in' | 'adjust' | 'history'>(initialTab);
  const [items, setItems] = useState<LaravelItem[]>([]);
  const [movements, setMovements] = useState<LaravelStockMovement[]>([]);
  const [movementMeta, setMovementMeta] = useState<LaravelPaginationMeta>(emptyMeta(0));
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isLoadingMovements, setIsLoadingMovements] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [movementsError, setMovementsError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formFieldErrors, setFormFieldErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [stockInItemId, setStockInItemId] = useState('');
  const [stockInQuantity, setStockInQuantity] = useState(1);
  const [stockInDate, setStockInDate] = useState(today);
  const [stockInRemarks, setStockInRemarks] = useState('');
  const [adjustItemId, setAdjustItemId] = useState('');
  const [adjustDirection, setAdjustDirection] = useState<'increase' | 'decrease'>('increase');
  const [adjustQuantity, setAdjustQuantity] = useState(1);
  const [adjustReason, setAdjustReason] = useState<(typeof ADJUSTMENT_REASONS)[number]>('Count correction');
  const [otherReason, setOtherReason] = useState('');
  const [adjustDate, setAdjustDate] = useState(today);
  const [adjustRemarks, setAdjustRemarks] = useState('');
  const [itemFilter, setItemFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | LaravelStockMovement['movement_type']>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    let active = true;
    setIsLoadingItems(true);
    setItemsError(null);
    getItems()
      .then(({ data }) => {
        if (!active) return;
        const availableItems = data.filter(isLaravelItem);
        setItems(availableItems);
        setStockInItemId((current) => current || String(availableItems[0]?.id ?? ''));
        setAdjustItemId((current) => current || String(availableItems[0]?.id ?? ''));
      })
      .catch((error: unknown) => {
        if (!active) return;
        const details = getApiErrorDetails(error, 'Could not load inventory items.');
        setItemsError(details.status === 403 ? `Access denied: ${details.message}` : details.message);
      })
      .finally(() => {
        if (active) setIsLoadingItems(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    let active = true;
    setIsLoadingMovements(true);
    setMovementsError(null);
    const params = {
      page: currentPage,
      per_page: PAGE_SIZE,
      ...(itemFilter !== 'all' ? { item_id: Number(itemFilter) } : {}),
      ...(typeFilter !== 'all' ? { movement_type: typeFilter } : {}),
      ...(dateFrom ? { date_from: dateFrom } : {}),
      ...(dateTo ? { date_to: dateTo } : {}),
    };

    getStockMovements(params)
      .then(({ data, meta }) => {
        if (!active) return;
        if (meta) {
          setMovements(data);
          setMovementMeta(meta);
        } else {
          const filtered = data.filter((movement) => {
            const movementDate = movement.movement_date.slice(0, 10);
            return (itemFilter === 'all' || movement.item_id === Number(itemFilter))
              && (typeFilter === 'all' || movement.movement_type === typeFilter)
              && (!dateFrom || movementDate >= dateFrom)
              && (!dateTo || movementDate <= dateTo);
          });
          const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
          const page = Math.min(currentPage, pageCount);
          setMovements(filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
          setMovementMeta({
            current_page: page,
            last_page: pageCount,
            per_page: PAGE_SIZE,
            total: filtered.length,
          });
          if (page !== currentPage) setCurrentPage(page);
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        const details = getApiErrorDetails(error, 'Could not load stock movements.');
        setMovementsError(details.status === 403 ? `Access denied: ${details.message}` : details.message);
      })
      .finally(() => {
        if (active) setIsLoadingMovements(false);
      });

    return () => {
      active = false;
    };
  }, [currentPage, dateFrom, dateTo, itemFilter, refreshKey, typeFilter]);

  const handleMovementSuccess = (movement: LaravelStockMovement | undefined, itemId: string) => {
    if (movement?.item) {
      setItems((current) => current.map((item) => item.id === movement.item.id ? movement.item : item));
    }
    setRefreshKey((key) => key + 1);
    setCurrentPage(1);
    setFormError(null);
    setFormFieldErrors({});
    const item = items.find((entry) => String(entry.id) === itemId);
    showToast(`Stock movement recorded for ${movement?.item?.item_name ?? item?.item_name ?? 'item'}.`);
  };

  const submitMovement = async (
    event: React.FormEvent,
    payload: Parameters<typeof createStockMovement>[0],
    itemId: string,
    onSuccess: () => void
  ) => {
    event.preventDefault();
    setFormError(null);
    setFormFieldErrors({});
    setIsSubmitting(true);
    try {
      const { data } = await createStockMovement(payload);
      handleMovementSuccess(data, itemId);
      onSuccess();
    } catch (error) {
      const details = getApiErrorDetails(error, 'Could not record the stock movement.');
      setFormError(details.status === 403 ? `Access denied: ${details.message}` : details.message);
      setFormFieldErrors(details.fields);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockInSubmit = (event: React.FormEvent) => {
    void submitMovement(
      event,
      {
        item_id: Number(stockInItemId),
        movement_type: 'stock_in',
        quantity: Number(stockInQuantity),
        movement_date: stockInDate,
        remarks: stockInRemarks,
      },
      stockInItemId,
      () => {
        setStockInQuantity(1);
        setStockInRemarks('');
      }
    );
  };

  const handleAdjustmentSubmit = (event: React.FormEvent) => {
    const reason = adjustReason === 'Other' ? otherReason.trim() : adjustReason;
    if (adjustReason === 'Other' && !reason) {
      event.preventDefault();
      setFormError('Enter a reason for the adjustment.');
      return;
    }
    void submitMovement(
      event,
      {
        item_id: Number(adjustItemId),
        movement_type: 'adjustment',
        adjustment_direction: adjustDirection,
        quantity: Number(adjustQuantity),
        movement_date: adjustDate,
        reason,
        remarks: adjustRemarks,
      },
      adjustItemId,
      () => {
        setAdjustQuantity(1);
        setOtherReason('');
        setAdjustRemarks('');
      }
    );
  };

  const exportMovements = () => {
    if (!movements.length) return;
    const headers = ['Item', 'Item Code', 'Movement Type', 'Quantity Change', 'Date', 'Reason', 'Remarks', 'Performed By'];
    const rows = movements.map((movement) => {
      const delta = movement.quantity_after - movement.quantity_before;
      const signedDelta = delta >= 0 ? `+${delta}` : `${delta}`;
      const typeLabel = movement.movement_type === 'stock_in'
        ? 'Stock in'
        : movement.movement_type === 'adjustment'
          ? 'Adjustment'
          : movement.movement_type === 'stock_out'
            ? 'Stock out'
            : 'Used on job';
      return [
        movement.item.item_name,
        movement.item.item_code,
        typeLabel,
        signedDelta,
        movement.movement_date,
        movement.reason ?? '',
        movement.remarks ?? '',
        movement.performed_by?.name ?? '',
      ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',');
    });
    const blob = new Blob(['\uFEFF', [headers.join(','), ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Stock_Movements_${today}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderItemSelect = (id: string, value: string, onChange: (value: string) => void) => (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
      required
      disabled={isLoadingItems || items.length === 0}
    >
      <option value="">Select an item</option>
      {items.map((item) => (
        <option key={item.id} value={item.id}>{item.item_name} ({item.item_code})</option>
      ))}
    </select>
  );

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900">Stock</h1>
      </div>

      {(itemsError || movementsError) && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{[itemsError, movementsError].filter(Boolean).join(' ')}</span>
        </div>
      )}

      <div className="flex border-b border-slate-200 space-x-4 overflow-x-auto">
        {([
          ['stock_in', 'Stock in', Package],
          ['adjust', 'Adjustment', Sliders],
          ['history', 'Stock movements', History],
        ] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 shrink-0 ${activeTab === id ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {formError && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          {formError}
          {Object.entries(formFieldErrors).map(([field, messages]) => (
            <p key={field}>{field}: {messages.join(', ')}</p>
          ))}
        </div>
      )}

      {activeTab === 'stock_in' && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-xl space-y-4">
          <h2 className="text-base font-bold flex items-center gap-2"><Package className="w-5 h-5" />Stock in</h2>
          <form onSubmit={handleStockInSubmit} className="space-y-4 text-xs">
            <label className="block text-slate-700 font-semibold">
              Item <span className="text-rose-500">*</span>
              <span className="mt-1 block">{renderItemSelect('stock-in-item-select', stockInItemId, setStockInItemId)}</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-slate-700 font-semibold">
                Quantity <span className="text-rose-500">*</span>
                <input id="stock-in-quantity-input" type="number" min="1" step="1" value={stockInQuantity} onChange={(event) => setStockInQuantity(Number(event.target.value))} required className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono" />
              </label>
              <label className="block text-slate-700 font-semibold">
                Date <span className="text-rose-500">*</span>
                <input id="stock-in-date-input" type="date" max={today} value={stockInDate} onChange={(event) => setStockInDate(event.target.value)} required className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
              </label>
            </div>
            <label className="block text-slate-700 font-semibold">
              Remarks
              <input id="stock-in-remarks-input" value={stockInRemarks} onChange={(event) => setStockInRemarks(event.target.value)} className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
            </label>
            <button id="submit-stock-in-btn" type="submit" disabled={isSubmitting || !stockInItemId} className="px-5 py-2.5 bg-[#FF6B00] hover:bg-[#E56000] text-white font-semibold rounded-lg disabled:opacity-60">
              {isSubmitting ? 'Recording...' : 'Record stock in'}
            </button>
          </form>
        </section>
      )}

      {activeTab === 'adjust' && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-xl space-y-4">
          <h2 className="text-base font-bold flex items-center gap-2"><Sliders className="w-5 h-5 text-amber-600" />Adjustment</h2>
          <form onSubmit={handleAdjustmentSubmit} className="space-y-4 text-xs">
            <label className="block text-slate-700 font-semibold">
              Item <span className="text-rose-500">*</span>
              <span className="mt-1 block">{renderItemSelect('adjust-item-select', adjustItemId, setAdjustItemId)}</span>
            </label>
            <div>
              <span className="block text-slate-700 font-semibold mb-1">Direction <span className="text-rose-500">*</span></span>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setAdjustDirection('increase')} className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 border ${adjustDirection === 'increase' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                  <Plus className="w-4 h-4" />Increase
                </button>
                <button type="button" onClick={() => setAdjustDirection('decrease')} className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 border ${adjustDirection === 'decrease' ? 'bg-rose-50 text-rose-800 border-rose-300' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                  <Minus className="w-4 h-4" />Decrease
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-slate-700 font-semibold">
                Quantity <span className="text-rose-500">*</span>
                <input id="adjust-quantity-input" type="number" min="1" step="1" value={adjustQuantity} onChange={(event) => setAdjustQuantity(Number(event.target.value))} required className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono" />
              </label>
              <label className="block text-slate-700 font-semibold">
                Date <span className="text-rose-500">*</span>
                <input id="adjust-date-input" type="date" max={today} value={adjustDate} onChange={(event) => setAdjustDate(event.target.value)} required className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
              </label>
            </div>
            <label className="block text-slate-700 font-semibold">
              Reason <span className="text-rose-500">*</span>
              <select id="adjust-reason-select" value={adjustReason} onChange={(event) => setAdjustReason(event.target.value as (typeof ADJUSTMENT_REASONS)[number])} required className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                {ADJUSTMENT_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
              </select>
            </label>
            {adjustReason === 'Other' && (
              <label className="block text-slate-700 font-semibold">
                Specify reason <span className="text-rose-500">*</span>
                <input id="adjust-other-reason-input" value={otherReason} onChange={(event) => setOtherReason(event.target.value)} required className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
              </label>
            )}
            <label className="block text-slate-700 font-semibold">
              Remarks
              <input id="adjust-remarks-input" value={adjustRemarks} onChange={(event) => setAdjustRemarks(event.target.value)} className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
            </label>
            <button id="submit-adjust-btn" type="submit" disabled={isSubmitting || !adjustItemId} className="px-5 py-2.5 bg-[#FF6B00] hover:bg-[#E56000] text-white font-semibold rounded-lg disabled:opacity-60">
              {isSubmitting ? 'Saving...' : 'Save adjustment'}
            </button>
          </form>
        </section>
      )}

      {activeTab === 'history' && (
        <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
            <h2 className="text-sm font-bold text-slate-900">Stock movements ({movementMeta.total})</h2>
            <div className="flex flex-wrap items-center gap-2">
              <select id="history-item-filter" value={itemFilter} onChange={(event) => { setItemFilter(event.target.value); setCurrentPage(1); }} className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg">
                <option value="all">All items</option>
                {items.map((item) => <option key={item.id} value={item.id}>{item.item_name}</option>)}
              </select>
              <select id="history-type-filter" value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value as typeof typeFilter); setCurrentPage(1); }} className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg">
                <option value="all">All movement types</option>
                <option value="stock_in">Stock in</option>
                <option value="adjustment">Adjustment</option>
                <option value="stock_out">Stock out</option>
                <option value="usage">Used on job</option>
              </select>
              <label className="text-xs text-slate-600">From <input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setCurrentPage(1); }} className="ml-1 px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg" /></label>
              <label className="text-xs text-slate-600">To <input type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setCurrentPage(1); }} className="ml-1 px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg" /></label>
              <button type="button" onClick={exportMovements} disabled={!movements.length} className="px-3 py-1.5 bg-[#FF6B00] hover:bg-[#E56000] text-white font-semibold rounded-lg text-xs disabled:opacity-60">Export</button>
            </div>
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Movement type</th>
                  <th className="py-3 px-4 text-right">Quantity change</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Reason / Remarks</th>
                  <th className="py-3 px-4">Performed by</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingMovements ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-400">Loading stock movements...</td></tr>
                ) : movements.length ? movements.map((movement) => {
                  const delta = movement.quantity_after - movement.quantity_before;
                  const typeLabel = movement.movement_type === 'stock_in'
                    ? 'Stock in'
                    : movement.movement_type === 'adjustment'
                      ? 'Adjustment'
                      : movement.movement_type === 'stock_out'
                        ? 'Stock out'
                        : 'Used on job';
                  return (
                    <tr key={movement.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{movement.item.item_name}</div>
                        <div className="text-[10px] font-mono text-slate-500">{movement.item.item_code}</div>
                      </td>
                      <td className="py-3 px-4">{typeLabel}</td>
                      <td className={`py-3 px-4 text-right font-bold font-mono ${delta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{delta >= 0 ? `+${delta}` : delta}</td>
                      <td className="py-3 px-4">{movement.movement_date}</td>
                      <td className="py-3 px-4">{[movement.reason, movement.remarks].filter(Boolean).join(' — ') || '—'}</td>
                      <td className="py-3 px-4">{movement.performed_by?.name ?? '—'}</td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-400">No stock movements found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Page {movementMeta.current_page} of {movementMeta.last_page} · {movementMeta.total} total</span>
            <div className="flex gap-2">
              <button type="button" disabled={movementMeta.current_page <= 1 || isLoadingMovements} onClick={() => setCurrentPage(movementMeta.current_page - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-50">Previous</button>
              <button type="button" disabled={movementMeta.current_page >= movementMeta.last_page || isLoadingMovements} onClick={() => setCurrentPage(movementMeta.current_page + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-50">Next</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
