import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Edit2, Plus, Power, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  activateCategory,
  deactivateCategory,
  getCategories,
} from '../../services/api';
import type { LaravelCategory, LaravelCategoryType, LaravelMainCategory } from '../../services/api';

type CategoryRow = {
  category: LaravelCategory;
  isMain: boolean;
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = error.response;
    if (typeof response === 'object' && response !== null && 'data' in response) {
      const data = response.data;
      if (
        typeof data === 'object' &&
        data !== null &&
        'message' in data &&
        typeof data.message === 'string'
      ) {
        return data.message;
      }
    }
  }
  return error instanceof Error ? error.message : fallback;
};

export const CategoryManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const [categoryType, setCategoryType] = useState<LaravelCategoryType>('item-categories');
  const [itemSearch, setItemSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [categories, setCategories] = useState<LaravelMainCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [updatingCategoryId, setUpdatingCategoryId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const isItemCategory = categoryType === 'item-categories';
  const search = isItemCategory ? itemSearch : serviceSearch;
  const setSearch = isItemCategory ? setItemSearch : setServiceSearch;
  const countHeading = isItemCategory ? 'Items' : 'Services';

  useEffect(() => {
    let isCurrentRequest = true;
    setCategories([]);
    setIsLoading(true);
    setLoadError(null);

    getCategories(categoryType, { search })
      .then(({ data }) => {
        if (isCurrentRequest) setCategories(data);
      })
      .catch((error: unknown) => {
        if (isCurrentRequest) {
          setLoadError(getApiErrorMessage(error, 'Could not load categories.'));
        }
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoading(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [categoryType, refreshKey, search]);

  const handleStatusChange = async (row: CategoryRow) => {
    setLoadError(null);
    setSuccessMessage(null);

    if (row.category.is_active && row.isMain) {
      const confirmed = window.confirm(
        `Deactivating "${row.category.name}" will also deactivate its sub-categories. They will be hidden from category pickers. Continue?`
      );
      if (!confirmed) return;
    }

    setUpdatingCategoryId(row.category.id);
    try {
      if (row.category.is_active) {
        await deactivateCategory(categoryType, row.category.id);
        setSuccessMessage(`Deactivated "${row.category.name}".`);
      } else {
        await activateCategory(categoryType, row.category.id);
        setSuccessMessage(`Activated "${row.category.name}".`);
      }
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, 'Could not update category status.'));
    } finally {
      setUpdatingCategoryId(null);
    }
  };

  const rows: CategoryRow[] = categories.flatMap((main) => [
    { category: main, isMain: true },
    ...main.children.map((child) => ({ category: child, isMain: false })),
  ]);

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex border-b border-slate-200 gap-4">
        <button
          id="subtab-item-categories"
          type="button"
          onClick={() => setCategoryType('item-categories')}
          className={`pb-2 text-xs font-bold border-b-2 transition ${
            isItemCategory
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Item Categories
        </button>
        <button
          id="subtab-service-categories"
          type="button"
          onClick={() => setCategoryType('service-categories')}
          className={`pb-2 text-xs font-bold border-b-2 transition ${
            !isItemCategory
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Service Categories
        </button>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${isItemCategory ? 'item' : 'service'} categories...`}
              aria-label={`Search ${isItemCategory ? 'item' : 'service'} categories`}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
            />
          </div>

          {isAdmin && (
            <button
              id="add-category-btn"
              type="button"
              disabled
              title="Category creation is added in the next step."
              className="px-4 py-2 bg-[#FF6B00] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shrink-0 opacity-60 cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>Add category</span>
            </button>
          )}
        </div>

        {loadError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{loadError}</span>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full min-w-[680px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wide">
                <th scope="col" className="py-3 px-4">Name</th>
                <th scope="col" className="py-3 px-4">Type</th>
                <th scope="col" className="py-3 px-4 text-center">{countHeading}</th>
                <th scope="col" className="py-3 px-4 text-center">Status</th>
                <th scope="col" className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Loading categories...
                  </td>
                </tr>
              ) : rows.length > 0 ? (
                rows.map((row) => {
                  const isInactive = !row.category.is_active;
                  const isUpdating = updatingCategoryId === row.category.id;

                  return (
                    <tr
                      key={row.category.id}
                      className={`transition-colors hover:bg-slate-50/70 ${isInactive ? 'opacity-50' : ''}`}
                    >
                      <td className={`py-3.5 px-4 text-slate-900 ${row.isMain ? 'font-bold' : 'font-medium'}`}>
                        <span className={row.isMain ? '' : 'ml-7'}>
                          {row.category.name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold ${
                            row.isMain
                              ? 'bg-slate-100 text-slate-700 border-slate-200'
                              : 'bg-orange-50 text-orange-700 border-orange-200'
                          }`}
                        >
                          {row.isMain ? 'Main' : 'Sub'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-700">
                        {row.category.count ?? 0}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md border text-[10px] font-bold ${
                            row.category.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {row.category.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isAdmin ? (
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              disabled
                              title="Category editing is added in the next step."
                              className="px-2.5 py-1.5 text-slate-500 rounded-md text-xs font-semibold inline-flex items-center gap-1 opacity-50 cursor-not-allowed"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleStatusChange(row)}
                              disabled={isUpdating}
                              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition ${
                                row.category.is_active
                                  ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                                  : 'text-emerald-700 hover:bg-emerald-50'
                              } disabled:opacity-50`}
                            >
                              {isUpdating ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Power className="h-3.5 w-3.5" />
                              )}
                              <span>{row.category.is_active ? 'Deactivate' : 'Activate'}</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 px-4 text-center text-slate-500">
                    {search
                      ? 'No categories match your search. Try another name or clear the search.'
                      : 'No categories yet. Add a category to get started.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
