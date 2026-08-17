import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_INVENTORY } from '../../data/mockData';
import { Package, AlertTriangle, Plus, Minus, CheckCircle, Search } from 'lucide-react';

export const PartsDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [searchTerm, setSearchTerm] = useState('');
  const [reorderSuccess, setReorderSuccess] = useState<string | null>(null);

  const lowStockItems = inventory.filter((item) => item.stock <= item.minStock);

  const handleAdjustStock = (id: string, delta: number) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, stock: Math.max(0, item.stock + delta) } : item))
    );
  };

  const handleTriggerReorder = (itemName: string) => {
    setReorderSuccess(`Purchase Order dispatched for ${itemName}!`);
    setTimeout(() => setReorderSuccess(null), 3000);
  };

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-900">
      {/* Parts Manager Welcome Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 text-slate-900 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold mb-2">
            <Package className="w-3.5 h-3.5 text-slate-900" />
            Inventory & Procurement Workbench
          </div>
          <h1 className="text-2xl font-bold">Welcome, {currentUser?.name}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor spare parts stock levels, issue critical reorders, and update bin locations.
          </p>
        </div>

        <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-right">
          <div className="text-[10px] text-slate-500 uppercase font-semibold">Low Stock Items</div>
          <div className="text-xl font-extrabold text-rose-600">{lowStockItems.length} Critical Alerts</div>
        </div>
      </div>

      {reorderSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{reorderSuccess}</span>
        </div>
      )}

      {/* Low Stock Warnings Banner */}
      {lowStockItems.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold">Low Stock Warning: </span>
              {lowStockItems.map((i) => `${i.name} (${i.stock} left)`).join(', ')}
            </div>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-700" />
              Spare Parts Catalog ({filteredInventory.length})
            </h2>
            <p className="text-xs text-slate-500">Live stock levels & minimum reorder thresholds</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search part # or name..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-slate-900 outline-hidden"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Part #</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Bin Location</th>
                <th className="py-3 px-3">Stock Level</th>
                <th className="py-3 px-3 text-right">Unit Price</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.map((item) => {
                const isLow = item.stock <= item.minStock;
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {item.partNumber}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{item.category}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{item.location}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                          {item.stock}
                        </span>
                        <span className="text-[10px] text-slate-400">(Min: {item.minStock})</span>
                        {isLow && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200 text-[9px] font-bold uppercase">
                            Low
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      ${item.unitPrice}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          id={`decrement-stock-${item.id}`}
                          onClick={() => handleAdjustStock(item.id, -1)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                          title="Decrease stock"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`increment-stock-${item.id}`}
                          onClick={() => handleAdjustStock(item.id, 1)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                          title="Increase stock"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`reorder-stock-${item.id}`}
                          onClick={() => handleTriggerReorder(item.name)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                        >
                          Reorder
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
