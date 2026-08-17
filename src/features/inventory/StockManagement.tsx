import React, { useState } from 'react';
import { useGarage } from '../../context/GarageContext';
import { useAuth } from '../../context/AuthContext';
import { InventoryItem } from '../../types';
import {
  Package,
  Plus,
  Sliders,
  History,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  X,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  Tag,
  DollarSign,
  MapPin,
  TrendingUp,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const StockManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    inventory,
    stockTransactions,
    adjustStockQuantity,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
  } = useGarage();

  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'stock_in' | 'adjust' | 'history'>('catalog');
  
  // Search & Filters for Catalog
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deactivated' | 'low_stock'>('all');

  // Stock In / Adjust state
  const [selectedPartId, setSelectedPartId] = useState(inventory[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('New Shipment Supplier Restock');
  const [supplierName, setSupplierName] = useState('');

  // History Filter
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'stock_in' | 'usage' | 'adjustment'>('all');
  const [historySearch, setHistorySearch] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isNewPartModalOpen, setIsNewPartModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);

  // Form State for Create / Edit
  const [itemFormData, setItemFormData] = useState({
    partNumber: '',
    name: '',
    category: 'Braking System',
    brand: 'OEM',
    unit: 'Pcs',
    unitPrice: 100,
    stock: 10,
    minStock: 5,
    location: 'Warehouse Bay A',
    status: 'active' as 'active' | 'deactivated',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const openCreateModal = () => {
    setItemFormData({
      partNumber: '',
      name: '',
      category: 'Braking System',
      brand: 'Brembo',
      unit: 'Pcs',
      unitPrice: 120,
      stock: 10,
      minStock: 5,
      location: 'Bay A - Shelf 1',
      status: 'active',
    });
    setIsNewPartModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setItemFormData({
      partNumber: item.partNumber,
      name: item.name,
      category: item.category,
      brand: item.brand || '',
      unit: item.unit || 'Pcs',
      unitPrice: item.unitPrice,
      stock: item.stock,
      minStock: item.minStock,
      location: item.location || '',
      status: item.status || 'active',
    });
  };

  const handleCreatePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemFormData.partNumber || !itemFormData.name) return;

    addInventoryItem(itemFormData);
    showToast(`New spare part "${itemFormData.name}" added to catalog!`);
    setIsNewPartModalOpen(false);
  };

  const handleUpdatePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    updateInventoryItem(editingItem.id, itemFormData);
    showToast(`Part details for "${itemFormData.name}" updated successfully!`);
    setEditingItem(null);
  };

  const handleDeletePart = (item: InventoryItem) => {
    if (window.confirm(`Are you sure you want to deactivate "${item.name}"?`)) {
      deleteInventoryItem(item.id);
      showToast(`Part "${item.name}" set to Deactivated.`);
    }
  };

  const handleStockAction = (e: React.FormEvent, type: 'stock_in' | 'adjustment') => {
    e.preventDefault();
    if (!selectedPartId) return;

    const delta = type === 'stock_in' ? Math.abs(quantity) : quantity;
    const res = adjustStockQuantity(
      selectedPartId,
      delta,
      type,
      reason,
      currentUser?.name || 'Staff User',
      supplierName
    );

    if (res.success) {
      const p = inventory.find((x) => x.id === selectedPartId);
      showToast(`Stock updated for ${p?.name || 'Item'}. Recorded ${type === 'stock_in' ? 'Stock In' : 'Adjustment'} of ${delta > 0 ? '+' : ''}${delta}.`);
      setQuantity(1);
    } else {
      alert(res.error);
    }
  };

  // Filter Catalog
  const categories = Array.from(new Set(inventory.map((i) => i.category)));
  const filteredCatalog = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = item.status !== 'deactivated';
    else if (statusFilter === 'deactivated') matchesStatus = item.status === 'deactivated';
    else if (statusFilter === 'low_stock') matchesStatus = item.stock <= item.minStock;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Filter Transactions History
  const filteredTransactions = stockTransactions.filter((tx) => {
    const matchesType = historyTypeFilter === 'all' || tx.type === historyTypeFilter;
    const matchesSearch =
      tx.partName.toLowerCase().includes(historySearch.toLowerCase()) ||
      tx.partNumber.toLowerCase().includes(historySearch.toLowerCase()) ||
      tx.reason.toLowerCase().includes(historySearch.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6 text-slate-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-slate-900 text-white border border-slate-700 rounded-2xl shadow-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 text-slate-900 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold mb-2">
            <Boxes className="w-3.5 h-3.5 text-slate-900" />
            Parts Inventory & Stock Control
          </div>
          <h1 className="text-2xl font-bold">Items & Stock Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage spare parts catalog, log incoming shipments, perform physical count adjustments, and track stock deductions.
          </p>
        </div>

        <button
          id="add-item-btn"
          onClick={openCreateModal}
          className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl text-xs flex items-center gap-2 shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Spare Part</span>
        </button>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-4 overflow-x-auto">
        <button
          id="tab-catalog"
          onClick={() => setActiveSubTab('catalog')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 transition border-b-2 shrink-0 ${
            activeSubTab === 'catalog'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Parts Catalog ({inventory.length})</span>
        </button>

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
          <span>Stock In (Supplier Receiving)</span>
        </button>

        <button
          id="tab-adjust"
          onClick={() => setActiveSubTab('adjust')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 transition border-b-2 shrink-0 ${
            activeSubTab === 'adjust'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Stock Adjustments</span>
        </button>

        <button
          id="tab-history"
          onClick={() => setActiveSubTab('history')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 transition border-b-2 shrink-0 ${
            activeSubTab === 'history'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Transaction History ({stockTransactions.length})</span>
        </button>
      </div>

      {/* TAB 1: PARTS CATALOG */}
      {activeSubTab === 'catalog' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="catalog-search-input"
                type="text"
                placeholder="Search part name, SKU code, brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-slate-900 outline-hidden"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto">
              <select
                id="catalog-category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-slate-900 outline-hidden"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                id="catalog-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-slate-900 outline-hidden"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="low_stock">Low Stock Alerts</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </div>
          </div>

          {/* Catalog Table */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3 px-4">SKU / Item Code</th>
                    <th className="py-3 px-4">Item Name & Category</th>
                    <th className="py-3 px-4">Brand / Unit</th>
                    <th className="py-3 px-4 text-right">Selling Price</th>
                    <th className="py-3 px-4 text-center">Stock Level</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCatalog.map((item) => {
                    const isLowStock = item.stock <= item.minStock;
                    const isDeactivated = item.status === 'deactivated';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {item.partNumber}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-[10px] text-slate-500">{item.category}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{item.brand || '—'}</div>
                          <div className="text-[10px] text-slate-400">{item.unit || 'Pcs'}</div>
                        </td>

                        <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                          ${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 font-bold font-mono">
                            <span className={isLowStock ? 'text-amber-600 font-black' : 'text-slate-900'}>
                              {item.stock}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              (Min: {item.minStock})
                            </span>
                          </div>
                          {isLowStock && (
                            <div className="text-[9px] font-bold text-amber-600 flex items-center justify-center gap-0.5 mt-0.5">
                              <AlertTriangle className="w-3 h-3" /> Low Stock
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isDeactivated
                                ? 'bg-slate-100 text-slate-400'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isDeactivated ? 'Deactivated' : 'Active'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              title="View Details"
                              onClick={() => setViewingItem(item)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              title="Edit Item"
                              onClick={() => openEditModal(item)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {!isDeactivated && (
                              <button
                                title="Deactivate Item"
                                onClick={() => handleDeletePart(item)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredCatalog.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                        No spare parts found matching your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STOCK IN (SUPPLIER SHIPMENT) */}
      {activeSubTab === 'stock_in' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs max-w-2xl space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-slate-700" />
            Log Stock In (Supplier Receiving)
          </h2>

          <form onSubmit={(e) => handleStockAction(e, 'stock_in')} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-600 font-bold uppercase text-[10px] mb-1">
                Select Part from Catalog
              </label>
              <select
                id="stock-in-part-select"
                value={selectedPartId}
                onChange={(e) => setSelectedPartId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-slate-900 outline-hidden font-medium"
              >
                {inventory.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.partNumber}) — Stock: {p.stock} {p.unit || 'Pcs'}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-bold uppercase text-[10px] mb-1">
                  Received Quantity (+ Units)
                </label>
                <input
                  id="stock-in-qty-input"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:border-slate-900 outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold uppercase text-[10px] mb-1">
                  Supplier Name (Optional)
                </label>
                <input
                  id="stock-in-supplier-input"
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="e.g. Brembo Direct USA"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-slate-900 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-bold uppercase text-[10px] mb-1">
                Reason / Supplier PO Reference #
              </label>
              <input
                id="stock-in-reason-input"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. PO-8921 Brembo Restock Shipment"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-slate-900 outline-hidden"
                required
              />
            </div>

            <button
              id="submit-stock-in-btn"
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs shadow-xs transition"
            >
              Record & Increase Stock Quantity
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: STOCK ADJUSTMENTS */}
      {activeSubTab === 'adjust' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs max-w-2xl space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-600" />
            Inventory Stock Adjustment
          </h2>

          <form onSubmit={(e) => handleStockAction(e, 'adjustment')} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-600 font-bold uppercase text-[10px] mb-1">
                Select Part
              </label>
              <select
                id="adjust-part-select"
                value={selectedPartId}
                onChange={(e) => setSelectedPartId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-slate-900 outline-hidden font-medium"
              >
                {inventory.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.partNumber}) — Stock: {p.stock}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-bold uppercase text-[10px] mb-1">
                  Quantity Delta (+ or -)
                </label>
                <input
                  id="adjust-qty-input"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:border-slate-900 outline-hidden"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Use negative values (e.g. -2) for damaged or discarded items.
                </span>
              </div>

              <div>
                <label className="block text-slate-600 font-bold uppercase text-[10px] mb-1">
                  Adjustment Category
                </label>
                <select
                  id="adjust-reason-select"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-slate-900 outline-hidden"
                >
                  <option value="Physical Count Audit Correction">Physical Count Audit Correction</option>
                  <option value="Damaged / Unusable Stock Write-off">Damaged / Unusable Stock Write-off</option>
                  <option value="Returned Defective to Supplier">Returned Defective to Supplier</option>
                  <option value="Manual Inventory Adjustment">Manual Inventory Adjustment</option>
                </select>
              </div>
            </div>

            <button
              id="submit-adjust-btn"
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs shadow-xs transition"
            >
              Save Stock Adjustment Log
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: TRANSACTION AUDIT HISTORY */}
      {activeSubTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-base font-bold text-slate-900">Stock Movement Audit History</h2>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search transaction..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-slate-900 outline-hidden"
              />

              <select
                value={historyTypeFilter}
                onChange={(e) => setHistoryTypeFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-slate-900 outline-hidden"
              >
                <option value="all">All Types</option>
                <option value="stock_in">Stock In</option>
                <option value="usage">Usage (Deductions)</option>
                <option value="adjustment">Adjustments</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Part Name & Code</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3 text-right">Qty Delta</th>
                  <th className="py-3 px-3">Reason / Details</th>
                  <th className="py-3 px-3">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => {
                  const isPositive = tx.quantity > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                        {tx.timestamp}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{tx.partName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{tx.partNumber}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            tx.type === 'stock_in'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : tx.type === 'usage'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>

                      <td
                        className={`py-3 px-3 text-right font-bold font-mono ${
                          isPositive ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isPositive ? `+${tx.quantity}` : tx.quantity}
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        {tx.reason || '—'}
                        {tx.supplier && (
                          <span className="text-[10px] text-slate-400 block font-semibold">
                            Supplier: {tx.supplier}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-800">{tx.performedBy}</td>
                    </tr>
                  );
                })}

                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                      No stock transactions match your search filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE NEW PART MODAL */}
      {isNewPartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-3xl shadow-xl max-w-lg w-full overflow-hidden text-slate-900"
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Package className="w-5 h-5 text-white" />
                Add New Spare Part
              </h3>
              <button
                id="close-create-part-modal"
                onClick={() => setIsNewPartModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePart} className="p-6 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 uppercase font-bold text-[10px] mb-1">Item Code / SKU</label>
                  <input
                    id="part-code-input"
                    type="text"
                    value={itemFormData.partNumber}
                    onChange={(e) => setItemFormData({ ...itemFormData, partNumber: e.target.value.toUpperCase() })}
                    placeholder="e.g. BP-POR-911-F"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:border-slate-900 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 uppercase font-bold text-[10px] mb-1">Item Name</label>
                  <input
                    id="part-name-input"
                    type="text"
                    value={itemFormData.name}
                    onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                    placeholder="e.g. Ceramic Front Brake Pads"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-slate-900 outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 uppercase font-bold text-[10px] mb-1">Category</label>
                  <input
                    id="part-category-input"
                    type="text"
                    value={itemFormData.category}
                    onChange={(e) => setItemFormData({ ...itemFormData, category: e.target.value })}
                    placeholder="e.g. Braking System"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-slate-900 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 uppercase font-bold text-[10px] mb-1">Brand</label>
                  <input
                    id="part-brand-input"
                    type="text"
                    value={itemFormData.brand}
                    onChange={(e) => setItemFormData({ ...itemFormData, brand: e.target.value })}
                    placeholder="e.g. Brembo"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-slate-900 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 uppercase font-bold text-[10px] mb-1">Unit</label>
                  <input
                    id="part-unit-input"
                    type="text"
                    value={itemFormData.unit}
                    onChange={(e) => setItemFormData({ ...itemFormData, unit: e.target.value })}
                    placeholder="e.g. Set / Pcs / Liter"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-slate-900 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 uppercase font-bold text-[10px] mb-1">Selling Price ($)</label>
                  <input
                    id="part-price-input"
                    type="number"
                    value={itemFormData.unitPrice}
                    onChange={(e) => setItemFormData({ ...itemFormData, unitPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:border-slate-900 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 uppercase font-bold text-[10px] mb-1">Initial Stock</label>
                  <input
                    id="part-stock-input"
                    type="number"
                    value={itemFormData.stock}
                    onChange={(e) => setItemFormData({ ...itemFormData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:border-slate-900 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 uppercase font-bold text-[10px] mb-1">Min Stock Alert</label>
                  <input
                    id="part-min-stock-input"
                    type="number"
                    value={itemFormData.minStock}
                    onChange={(e) => setItemFormData({ ...itemFormData, minStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:border-slate-900 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 uppercase font-bold text-[10px] mb-1">Warehouse Location</label>
                <input
                  id="part-location-input"
                  type="text"
                  value={itemFormData.location}
                  onChange={(e) => setItemFormData({ ...itemFormData, location: e.target.value })}
                  placeholder="e.g. Bay B - Shelf 4"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-slate-900 outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  id="cancel-create-part-btn"
                  type="button"
                  onClick={() => setIsNewPartModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  id="submit-create-part-btn"
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold shadow-xs"
                >
                  Save Item
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* EDIT PART MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-3xl shadow-xl max-w-lg w-full overflow-hidden text-slate-900"
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-white" />
                Update Item #{editingItem.partNumber}
              </h3>
              <button
                id="close-edit-part-modal"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePart} className="p-6 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 uppercase font-bold text-[10px] mb-1">Item Code / SKU</label>
                  <input
                    type="text"
                    value={itemFormData.partNumber}
                    onChange={(e) => setItemFormData({ ...itemFormData, partNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:border-slate-900 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 uppercase font-bold text-[10px] mb-1">Item Name</label>
                  <input
                    type="text"
                    value={itemFormData.name}
                    onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-slate-900 outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 uppercase font-bold text-[10px] mb-1">Category</label>
                  <input
                    type="text"
                    value={itemFormData.category}
                    onChange={(e) => setItemFormData({ ...itemFormData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-slate-900 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 uppercase font-bold text-[10px] mb-1">Brand</label>
                  <input
                    type="text"
                    value={itemFormData.brand}
                    onChange={(e) => setItemFormData({ ...itemFormData, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-slate-900 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 uppercase font-bold text-[10px] mb-1">Unit</label>
                  <input
                    type="text"
                    value={itemFormData.unit}
                    onChange={(e) => setItemFormData({ ...itemFormData, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-slate-900 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 uppercase font-bold text-[10px] mb-1">Selling Price ($)</label>
                  <input
                    type="number"
                    value={itemFormData.unitPrice}
                    onChange={(e) => setItemFormData({ ...itemFormData, unitPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:border-slate-900 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 uppercase font-bold text-[10px] mb-1">Min Stock Alert</label>
                  <input
                    type="number"
                    value={itemFormData.minStock}
                    onChange={(e) => setItemFormData({ ...itemFormData, minStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:border-slate-900 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 uppercase font-bold text-[10px] mb-1">Status</label>
                  <select
                    value={itemFormData.status}
                    onChange={(e) => setItemFormData({ ...itemFormData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-slate-900 outline-hidden"
                  >
                    <option value="active">Active</option>
                    <option value="deactivated">Deactivated</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold shadow-xs"
                >
                  Update Item
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* VIEW ITEM DETAILS MODAL */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-3xl shadow-xl max-w-md w-full overflow-hidden text-slate-900"
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">{viewingItem.name}</h3>
                <span className="text-[10px] font-mono text-slate-400">{viewingItem.partNumber}</span>
              </div>
              <button
                id="close-view-item-modal"
                onClick={() => setViewingItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Current Stock</div>
                  <div className="text-xl font-mono font-bold text-slate-900 mt-0.5">
                    {viewingItem.stock} <span className="text-xs text-slate-500 font-normal">{viewingItem.unit || 'Pcs'}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Selling Price</div>
                  <div className="text-xl font-mono font-bold text-slate-900 mt-0.5">
                    ${(viewingItem.unitPrice || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-bold text-slate-800">{viewingItem.category}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Brand:</span>
                  <span className="font-bold text-slate-800">{viewingItem.brand || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Minimum Stock Alert:</span>
                  <span className="font-mono font-bold text-slate-800">{viewingItem.minStock}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Warehouse Location:</span>
                  <span className="font-semibold text-slate-800">{viewingItem.location || '—'}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setViewingItem(null)}
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
