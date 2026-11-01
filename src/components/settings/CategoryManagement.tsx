import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Edit2, Plus, Power, RefreshCw, Search, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  activateCategory,
  createCategory,
  deactivateCategory,
  getCategories,
  updateCategory,
} from '../../services/api';
import type {
  LaravelCategory,
  LaravelCategoryType,
  LaravelMainCategory,
} from '../../services/api';

type CategoryRow = {
  category: LaravelCategory;
  isMain: boolean;
};

type CategoryFieldErrors = {
  name?: string[];
  parent_id?: string[];
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

const getCategoryFieldErrors = (error: unknown): CategoryFieldErrors | null => {
  if (typeof error !== 'object' || error === null || !('response' in error)) return null;
  const response = error.response;
  if (
    typeof response !== 'object' ||
    response === null ||
    !('status' in response) ||
    response.status !== 422 ||
    !('data' in response)
  ) {
    return null;
  }

  const data = response.data;
  if (typeof data !== 'object' || data === null || !('errors' in data)) return null;
  const errors = data.errors;
  if (typeof errors !== 'object' || errors === null) return null;

  const name = 'name' in errors && Array.isArray(errors.name)
    ? errors.name.filter((message): message is string => typeof message === 'string')
    : undefined;
  const parent_id = 'parent_id' in errors && Array.isArray(errors.parent_id)
    ? errors.parent_id.filter((message): message is string => typeof message === 'string')
    : undefined;

  return name || parent_id ? { name, parent_id } : null;
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
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<LaravelCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [isSubCategory, setIsSubCategory] = useState(false);
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [activeMainCategories, setActiveMainCategories] = useState<LaravelMainCategory[]>([]);
  const [isLoadingMainCategories, setIsLoadingMainCategories] = useState(false);
  const [mainCategoryLoadError, setMainCategoryLoadError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CategoryFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const categoryTypeButtonRef = useRef<HTMLButtonElement | null>(null);

  const isItemCategory = categoryType === 'item-categories';
  const search = isItemCategory ? itemSearch : serviceSearch;
  const setSearch = isItemCategory ? setItemSearch : setServiceSearch;
  const countHeading = isItemCategory ? 'Items' : 'Services';

  useEffect(() => {
    if (isEditorOpen) categoryTypeButtonRef.current?.focus();
  }, [isEditorOpen]);

  useEffect(() => {
    if (!isEditorOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) {
        event.preventDefault();
        setIsEditorOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditorOpen, isSaving]);

  const loadActiveMainCategories = async () => {
    setIsLoadingMainCategories(true);
    setMainCategoryLoadError(null);
    try {
      const { data } = await getCategories(categoryType, { active: '1' });
      setActiveMainCategories(data);
    } catch (error) {
      setMainCategoryLoadError(getApiErrorMessage(error, 'Could not load active main categories.'));
    } finally {
      setIsLoadingMainCategories(false);
    }
  };

  const clearFormErrors = () => {
    setFieldErrors({});
    setFormError(null);
    setMainCategoryLoadError(null);
  };

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setIsSubCategory(false);
    setParentCategoryId('');
    clearFormErrors();
    setSuccessMessage(null);
    setIsEditorOpen(true);
    void loadActiveMainCategories();
  };

  const handleOpenEditCategory = (category: LaravelCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setIsSubCategory(category.parent_id !== null);
    setParentCategoryId(category.parent_id === null ? '' : String(category.parent_id));
    clearFormErrors();
    setSuccessMessage(null);
    setIsEditorOpen(true);
    void loadActiveMainCategories();
  };

  const handleSaveCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFormErrors();
    setIsSaving(true);

    const payload = {
      name: categoryName.trim(),
      parent_id: isSubCategory ? Number(parentCategoryId) : null,
    };

    try {
      if (editingCategory) {
        await updateCategory(categoryType, editingCategory.id, payload);
        setSuccessMessage(`Updated "${payload.name}".`);
      } else {
        const { data } = await createCategory(categoryType, payload);
        if (data.parent_id === null) {
          setSuccessMessage(`Added "${data.name}".`);
        } else {
          const parent = activeMainCategories.find((category) => category.id === data.parent_id);
          setSuccessMessage(`Added "${data.name}" under ${parent?.name ?? 'the selected main category'}.`);
        }
      }
      setIsEditorOpen(false);
      setRefreshKey((key) => key + 1);
    } catch (error) {
      const validationErrors = getCategoryFieldErrors(error);
      if (validationErrors) {
        setFieldErrors(validationErrors);
      } else {
        setFormError(getApiErrorMessage(error, 'Could not save category.'));
      }
    } finally {
      setIsSaving(false);
    }
  };

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
              onClick={handleOpenAddCategory}
              className="px-4 py-2 bg-[#FF6B00] hover:bg-[#E56000] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer"
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
                              onClick={() => handleOpenEditCategory(row.category)}
                              className="px-2.5 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition"
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

      {isEditorOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSaving) setIsEditorOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-editor-title"
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 id="category-editor-title" className="text-base font-bold text-slate-900">
                {editingCategory ? 'Edit category' : 'Add category'}
              </h2>
              <button
                type="button"
                aria-label="Close category form"
                onClick={() => setIsEditorOpen(false)}
                disabled={isSaving}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <fieldset>
                <legend className="block text-slate-600 font-semibold mb-1.5">
                  Type <span className="text-rose-500">*</span>
                </legend>
                <div role="radiogroup" aria-label="Category type" className="grid grid-cols-2 gap-1.5 rounded-lg border border-slate-200 bg-slate-100 p-1">
                  <button
                    ref={categoryTypeButtonRef}
                    type="button"
                    role="radio"
                    aria-checked={!isSubCategory}
                    onClick={() => {
                      setIsSubCategory(false);
                      setParentCategoryId('');
                      setFieldErrors((current) => ({ ...current, parent_id: undefined }));
                    }}
                    className={`py-2 rounded-md font-bold transition ${
                      !isSubCategory
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Main category
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSubCategory}
                    onClick={() => {
                      setIsSubCategory(true);
                      setFieldErrors((current) => ({ ...current, parent_id: undefined }));
                    }}
                    className={`py-2 rounded-md font-bold transition ${
                      isSubCategory
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sub-category
                  </button>
                </div>
              </fieldset>

              {isSubCategory && (
                <div>
                  <label htmlFor="category-parent-select" className="block text-slate-600 font-semibold mb-1">
                    Main category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="category-parent-select"
                    required
                    value={parentCategoryId}
                    onChange={(event) => {
                      setParentCategoryId(event.target.value);
                      setFieldErrors((current) => ({ ...current, parent_id: undefined }));
                    }}
                    disabled={isLoadingMainCategories}
                    aria-invalid={Boolean(fieldErrors.parent_id?.length)}
                    aria-describedby={fieldErrors.parent_id?.length ? 'category-parent-error' : undefined}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-none disabled:opacity-60"
                  >
                    <option value="">
                      {isLoadingMainCategories ? 'Loading main categories...' : 'Select a main category'}
                    </option>
                    {activeMainCategories
                      .filter((category) => category.id !== editingCategory?.id)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                  {fieldErrors.parent_id?.map((message, index) => (
                    <p
                      id={index === 0 ? 'category-parent-error' : undefined}
                      key={`${message}-${index}`}
                      className="mt-1 text-rose-600"
                    >
                      {message}
                    </p>
                  ))}
                  {mainCategoryLoadError && (
                    <p role="alert" className="mt-1 text-rose-600">{mainCategoryLoadError}</p>
                  )}
                  {!isLoadingMainCategories && !mainCategoryLoadError && activeMainCategories.length === 0 && (
                    <p className="mt-1 text-slate-500">Create an active Main category first.</p>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="category-name-input" className="block text-slate-600 font-semibold mb-1">
                  Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="category-name-input"
                  type="text"
                  required
                  autoComplete="off"
                  value={categoryName}
                  onChange={(event) => {
                    setCategoryName(event.target.value);
                    setFieldErrors((current) => ({ ...current, name: undefined }));
                  }}
                  aria-invalid={Boolean(fieldErrors.name?.length)}
                  aria-describedby={fieldErrors.name?.length ? 'category-name-error' : undefined}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-none"
                />
                {fieldErrors.name?.map((message, index) => (
                  <p
                    id={index === 0 ? 'category-name-error' : undefined}
                    key={`${message}-${index}`}
                    className="mt-1 text-rose-600"
                  >
                    {message}
                  </p>
                ))}
              </div>

              {formError && (
                <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
                  {formError}
                </p>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || (isSubCategory && isLoadingMainCategories)}
                  className="px-4 py-2 bg-[#FF6B00] hover:bg-[#E56000] text-white font-semibold rounded-lg shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};
