import React, { useState } from 'react';
import { useGarage } from '../../context/GarageContext';
import { InventoryItem } from '../../types';
import { Search, Package, Plus, Edit2, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ItemsManagement: React.FC = () => {
  const { inventory, addInventoryItem, updateInventoryItem, systemSettings } = useGarage();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    partNumber: '',
    name: '',
    category: 'Braking System',
    brand: '',
    unit: 'pcs',
    unitPrice: 0,
    minStock: 5,
    status: 'active' as 'active' | 'deactivated',
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const categoriesList = systemSettings?.itemCategories || [
    'Braking System',
    'Engine Oil & Filters',
    'Suspension & Steering',
    'Electrical & Ignition',
    'Tires & Wheels',
    'Fluids & Chemicals',
  ];

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      partNumber: `ITM-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      category: categoriesList[0] || 'Braking System',
      brand: '',
      unit: 'pcs',
      unitPrice: 0,
      minStock: 5,
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      partNumber: item.partNumber,
      name: item.name,
      category: item.category,
      brand: item.brand || '',
      unit: item.unit || 'pcs',
      unitPrice: item.unitPrice,
      minStock: item.minStock,
      status: item.status || 'active',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partNumber.trim() || !formData.name.trim()) return;

    if (editingItem) {
      updateInventoryItem(editingItem.id, {
        partNumber: formData.partNumber.trim().toUpperCase(),
        name: formData.name.trim(),
        category: formData.category,
        brand: formData.brand.trim() || undefined,
        unit: formData.unit.trim() || 'pcs',
        unitPrice: Number(formData.unitPrice),
        minStock: Number(formData.minStock),
        status: formData.status,
      });
      showToast(`Item "${formData.name}" updated successfully.`);
    } else {
      addInventoryItem({
        partNumber: formData.partNumber.trim().toUpperCase(),
        name: formData.name.trim(),
        category: formData.category,
        brand: formData.brand.trim() || undefined,
        unit: formData.unit.trim() || 'pcs',
        stock: 0,
        minStock: Number(formData.minStock),
        unitPrice: Number(formData.unitPrice),
        location: 'Main Warehouse',
        status: formData.status,
      });
      showToast(`New item "${formData.name}" added to catalog.`);
    }

    setIsModalOpen(false);
  };

  const filteredItems = inventory.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      item.partNumber.toLowerCase().includes(term) ||
      item.name.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      (item.brand && item.brand.toLowerCase().includes(term));

    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-slate-700" />
          Items
        </h1>

        <button
          id="add-item-modal-btn"
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs flex items-center gap-2 shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Item</span>
        </button>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="search-items-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Code, Name, Category, Brand..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-900 outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              id="category-filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:border-slate-900 outline-none w-full sm:w-auto"
            >
              <option value="all">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Current Stock</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const isDeactivated = item.status === 'deactivated';

                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleOpenEditModal(item)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {item.partNumber}
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {item.name}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {item.category}
                      </td>

                      {/* Current Stock (Bare number only) */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                        {item.stock}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {isDeactivated ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Deactivated
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          id={`edit-item-btn-${item.id}`}
                          onClick={() => handleOpenEditModal(item)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3 text-slate-500" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No items match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Update Item Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-700" />
                {editingItem ? 'Update Item' : 'Add New Item'}
              </h3>
              <button
                id="close-item-modal-btn"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              {/* Item Code & Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Item Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="item-code-input"
                    type="text"
                    value={formData.partNumber}
                    onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                    placeholder="e.g. PRT-1001"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:border-slate-900 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Item Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="item-name-input"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Front Brake Pads"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-slate-900 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Category & Brand */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Category</label>
                  <select
                    id="item-category-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-slate-900 outline-none"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Brand
                  </label>
                  <input
                    id="item-brand-input"
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g. Brembo / Mobil1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Unit & Selling Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Unit</label>
                  <input
                    id="item-unit-input"
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="pcs / Liter / Set"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Selling Price ($)</label>
                  <input
                    id="item-price-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:border-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Minimum Stock Alert & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Minimum Stock Alert
                  </label>
                  <input
                    id="item-minstock-input"
                    type="number"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:border-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Status</label>
                  <select
                    id="item-status-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-slate-900 outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="deactivated">Deactivated</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  id="save-item-btn"
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs"
                >
                  {editingItem ? 'Update Item' : 'Save Item'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
