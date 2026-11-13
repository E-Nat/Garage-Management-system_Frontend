import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Edit2, Package, Plus, Search, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { CategoryPicker } from '../common/CategoryPicker';
import {
  createItem,
  getItems,
  getSelectableCategories,
  updateItem,
} from '../../services/api';
import type { LaravelItem, LaravelSelectableCategory } from '../../services/api';
import { getApiErrorDetails } from '../../utils/apiError';

type ItemFormData = {
  itemCode: string;
  itemName: string;
  categoryId: number | null;
  categoryLabel: string;
  brand: string;
  unit: string;
  sellingPrice: number;
  minimumStockAlert: number;
  openingStock: number;
};

const isLaravelItem = (item: LaravelItem | { category_label: string | null }): item is LaravelItem =>
  'status' in item;

const categoryLabel = (item: LaravelItem) => {
  if (!item.category) return 'Uncategorized';
  return item.category.parent
    ? `${item.category.parent.name} > ${item.category.name}`
    : item.category.name;
};

const getStockStatus = (item: LaravelItem) => item.stock_status;

export const ItemsManagement: React.FC = () => {
  const { currentUser, setActiveTab } = useAuth();
  const role = currentUser?.role;
  const canManageItems = role === 'admin' || role === 'owner' || role === 'parts_manager';
  const canManageCategories = role === 'admin' || role === 'owner';
  const [items, setItems] = useState<LaravelItem[]>([]);
  const [categories, setCategories] = useState<LaravelSelectableCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LaravelItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const itemCodeInputRef = useRef<HTMLInputElement | null>(null);
  const [formData, setFormData] = useState<ItemFormData>({
    itemCode: '',
    itemName: '',
    categoryId: null,
    categoryLabel: '',
    brand: '',
    unit: 'pcs',
    sellingPrice: 0,
    minimumStockAlert: 0,
    openingStock: 0,
  });

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setPageError(null);
    try {
      const { data } = await getItems();
      setItems(data.filter(isLaravelItem));
    } catch (error) {
      const details = getApiErrorDetails(error, 'Could not load inventory items.');
      setPageError(details.status === 403 ? `Access denied: ${details.message}` : details.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
    getSelectableCategories('item-categories')
      .then(({ data }) => setCategories(data))
      .catch((error: unknown) => {
        const details = getApiErrorDetails(error, 'Could not load item categories.');
        setPageError(details.status === 403 ? `Access denied: ${details.message}` : details.message);
      });
  }, [loadItems]);

  useEffect(() => {
    if (isModalOpen) itemCodeInputRef.current?.focus();
  }, [isModalOpen]);

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormError(null);
    setFieldErrors({});
    setFormData({
      itemCode: `ITM-${Math.floor(1000 + Math.random() * 9000)}`,
      itemName: '',
      categoryId: null,
      categoryLabel: '',
      brand: '',
      unit: 'pcs',
      sellingPrice: 0,
      minimumStockAlert: 0,
      openingStock: 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: LaravelItem) => {
    setEditingItem(item);
    setFormError(null);
    setFieldErrors({});
    setFormData({
      itemCode: item.item_code,
      itemName: item.item_name,
      categoryId: item.category_id ?? null,
      categoryLabel: categoryLabel(item) === 'Uncategorized' ? '' : categoryLabel(item),
      brand: item.brand ?? '',
      unit: item.unit ?? 'pcs',
      sellingPrice: item.selling_price,
      minimumStockAlert: item.minimum_stock_alert,
      openingStock: 0,
    });
    setIsModalOpen(true);
  };

  const handleCategorySelect = useCallback((category: LaravelSelectableCategory) => {
    setFormData((current) => ({
      ...current,
      categoryId: category.id,
      categoryLabel: category.label,
    }));
    setFieldErrors((current) => ({ ...current, category_id: undefined }));
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSaving(true);
    const payload = {
      item_code: formData.itemCode.trim().toUpperCase(),
      item_name: formData.itemName.trim(),
      selling_price: Number(formData.sellingPrice),
      category_id: formData.categoryId,
      brand: formData.brand.trim() || null,
      unit: formData.unit.trim() || null,
      minimum_stock_alert: Number(formData.minimumStockAlert),
      ...(!editingItem ? { opening_stock: Number(formData.openingStock) } : {}),
    };

    try {
      if (editingItem) {
        await updateItem(editingItem.id, payload);
        showToast(`Item "${formData.itemName}" updated successfully.`);
      } else {
        await createItem(payload);
        showToast(`New item "${formData.itemName}" added to catalog.`);
      }
      setIsModalOpen(false);
      await loadItems();
    } catch (error) {
      const details = getApiErrorDetails(error, 'Could not save this item.');
      setFormError(details.status === 403 ? `Access denied: ${details.message}` : details.message);
      setFieldErrors(details.fields);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async (item: LaravelItem) => {
    if (!window.confirm(`Deactivate "${item.item_name}"?`)) return;
    setPageError(null);
    try {
      await updateItem(item.id, { status: 'deactivated' });
      showToast(`"${item.item_name}" has been deactivated.`);
      await loadItems();
    } catch (error) {
      const details = getApiErrorDetails(error, 'Could not deactivate this item.');
      setPageError(details.status === 403 ? `Access denied: ${details.message}` : details.message);
    }
  };

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      const label = categoryLabel(item);
      const matchesSearch = !term || [
        item.item_code,
        item.item_name,
        label,
        item.brand ?? '',
      ].some((value) => value.toLowerCase().includes(term));
      const matchesCategory = categoryFilter === 'all' || label === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [categoryFilter, items, searchTerm]);

  const categoryOptions = useMemo(() => {
    const labels = new Set(categories.map((category) => category.label));
    items.forEach((item) => {
      if (item.category) labels.add(categoryLabel(item));
    });
    return Array.from(labels);
  }, [categories, items]);

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-slate-700" />
          Inventory
        </h1>
        <div className="flex flex-wrap gap-2">
          {canManageCategories && (
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs transition"
            >
              Manage categories
            </button>
          )}
          {canManageItems && (
            <button
              id="add-item-modal-btn"
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-[#FF6B00] hover:bg-[#E56000] text-white font-semibold rounded-lg text-xs flex items-center gap-2 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          )}
        </div>
      </div>

      {pageError && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{pageError}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="search-items-input"
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by code, name, category, brand..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-none"
            />
          </div>
          <select
            id="category-filter-select"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium w-full sm:w-auto"
          >
            <option value="all">All Categories</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Current Stock</th>
                <th className="py-3 px-4 text-center">Status</th>
                {canManageItems && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={canManageItems ? 6 : 5} className="py-8 text-center text-slate-400">Loading items...</td></tr>
              ) : filteredItems.length ? filteredItems.map((item) => {
                const stockStatus = getStockStatus(item);
                const isDeactivated = item.status === 'deactivated';
                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${isDeactivated ? 'bg-slate-50 text-slate-400 opacity-60' : 'hover:bg-slate-50/80'}`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold">{item.item_code}</td>
                    <td className="py-3.5 px-4 font-bold">{item.item_name}</td>
                    <td className="py-3.5 px-4 font-medium">{item.category ? categoryLabel(item) : '—'}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold">
                      <div>{item.current_stock}</div>
                      {(stockStatus === 'low' || stockStatus === 'out') && (
                        <span className={`mt-1 inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold ${stockStatus === 'out' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800'}`}>
                          {stockStatus === 'out' ? 'Out' : 'Low'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${isDeactivated ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
                        {isDeactivated ? 'Deactivated' : 'Active'}
                      </span>
                    </td>
                    {canManageItems && (
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3 text-slate-500" />
                          Edit
                        </button>
                        {!isDeactivated && (
                          <button
                            type="button"
                            onClick={() => void handleDeactivate(item)}
                            className="ml-2 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-md"
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              }) : (
                <tr><td colSpan={canManageItems ? 6 : 5} className="py-8 text-center text-slate-400">No items match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && !isSaving) setIsModalOpen(false);
            }}
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-700" />
                {editingItem ? 'Update Item' : 'Add New Item'}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && <p role="alert" className="text-xs text-rose-700">{formError}</p>}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-slate-600 font-semibold">
                  Item Code <span className="text-rose-500">*</span>
                  <input
                    ref={itemCodeInputRef}
                    id="item-code-input"
                    value={formData.itemCode}
                    onChange={(event) => setFormData({ ...formData, itemCode: event.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                    required
                  />
                  {fieldErrors.item_code?.[0] && <span className="text-rose-600">{fieldErrors.item_code[0]}</span>}
                </label>
                <label className="block text-slate-600 font-semibold">
                  Item Name <span className="text-rose-500">*</span>
                  <input
                    id="item-name-input"
                    value={formData.itemName}
                    onChange={(event) => setFormData({ ...formData, itemName: event.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                    required
                  />
                  {fieldErrors.item_name?.[0] && <span className="text-rose-600">{fieldErrors.item_name[0]}</span>}
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="item-category-picker" className="block text-slate-600 font-semibold">Category</label>
                  <CategoryPicker
                    inputId="item-category-picker"
                    categoryType="item-categories"
                    selectedId={formData.categoryId}
                    selectedLabel={formData.categoryLabel}
                    onSelect={handleCategorySelect}
                  />
                  {formData.categoryId !== null && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, categoryId: null, categoryLabel: '' })}
                      className="mt-1 text-[10px] text-slate-500 underline"
                    >
                      Clear category
                    </button>
                  )}
                  {fieldErrors.category_id?.[0] && <span className="text-rose-600">{fieldErrors.category_id[0]}</span>}
                </div>
                <label className="block text-slate-600 font-semibold">
                  Brand
                  <input
                    id="item-brand-input"
                    value={formData.brand}
                    onChange={(event) => setFormData({ ...formData, brand: event.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-slate-600 font-semibold">
                  Unit
                  <input
                    id="item-unit-input"
                    value={formData.unit}
                    onChange={(event) => setFormData({ ...formData, unit: event.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </label>
                <label className="block text-slate-600 font-semibold">
                  Selling Price ($) <span className="text-rose-500">*</span>
                  <input
                    id="item-price-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.sellingPrice}
                    onChange={(event) => setFormData({ ...formData, sellingPrice: Number(event.target.value) })}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                    required
                  />
                  {fieldErrors.selling_price?.[0] && <span className="text-rose-600">{fieldErrors.selling_price[0]}</span>}
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-slate-600 font-semibold">
                  Minimum Stock Alert
                  <input
                    id="item-minstock-input"
                    type="number"
                    min="0"
                    value={formData.minimumStockAlert}
                    onChange={(event) => setFormData({ ...formData, minimumStockAlert: Number(event.target.value) })}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                  />
                </label>
                {!editingItem && (
                  <label className="block text-slate-600 font-semibold">
                    Opening Stock
                    <input
                      id="item-opening-stock-input"
                      type="number"
                      min="0"
                      value={formData.openingStock}
                      onChange={(event) => setFormData({ ...formData, openingStock: Number(event.target.value) })}
                      className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                    />
                    {fieldErrors.opening_stock?.[0] && <span className="text-rose-600">{fieldErrors.opening_stock[0]}</span>}
                  </label>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg">
                  Cancel
                </button>
                <button id="save-item-btn" type="submit" disabled={isSaving} className="px-4 py-2 bg-[#FF6B00] hover:bg-[#E56000] text-white font-semibold rounded-lg shadow-xs disabled:opacity-60">
                  {isSaving ? 'Saving...' : editingItem ? 'Update Item' : 'Save Item'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
