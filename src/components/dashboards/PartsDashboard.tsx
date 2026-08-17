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
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Parts Manager Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Parts Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Stock levels, bin locations, and procurement alerts</p>
        </div>

        {lowStockItems.length > 0 && (
          <div className="px-3.5 py-2 bg-white border border-rose-100 rounded-xl text-right shadow-sm">
            <div className="text-[10px] text-slate-400 uppercase font-medium">Reorder Alerts</div>
            <div className="text-sm font-semibold text-rose-600">{lowStockItems.length} Low Stock Items</div>
          </div>
        )}
      </div>

      {reorderSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200/60 rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{reorderSuccess}</span>
        </div>
      )}

      {/* Low Stock Warnings Banner */}
      {lowStockItems.length > 0 && (
        <div className="p-3.5 bg-rose-50/70 border border-rose-200/60 rounded-xl text-rose-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <div>
              <span className="font-semibold text-rose-800">Low Stock Notice: </span>
              <span className="text-rose-700">{lowStockItems.map((i) => `${i.name} (${i.stock} left)`).join(', ')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-500" />
              Spare Parts Catalog ({filteredInventory.length})
            </h2>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search part # or name..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-slate-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[11px] font-medium">
                <th className="py-3 px-4">Part #</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Bin Location</th>
                <th className="py-3 px-4">Stock Level</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.map((item) => {
                const isLow = item.stock <= item.minStock;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                      {item.partNumber}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{item.category}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{item.location}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-xs ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                          {item.stock}
                        </span>
                        <span className="text-[11px] text-slate-400">(Min: {item.minStock})</span>
                        {isLow && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200/60 text-[10px] font-medium uppercase">
                            Low
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-900">
                      ${item.unitPrice}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          id={`decrement-stock-${item.id}`}
                          onClick={() => handleAdjustStock(item.id, -1)}
                          className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60 cursor-pointer"
                          title="Decrease stock"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`increment-stock-${item.id}`}
                          onClick={() => handleAdjustStock(item.id, 1)}
                          className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60 cursor-pointer"
                          title="Increase stock"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`reorder-stock-${item.id}`}
                          onClick={() => handleTriggerReorder(item.name)}
                          className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#FF6B00] hover:bg-[#E56000] text-white transition-colors cursor-pointer"
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
