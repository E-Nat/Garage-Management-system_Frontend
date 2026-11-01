import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, ChevronDown, LoaderCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  createCategory,
  getCategories,
  getSelectableCategories,
} from '../../services/api';
import type {
  LaravelCategoryType,
  LaravelMainCategory,
  LaravelSelectableCategory,
} from '../../services/api';

type CategoryFieldErrors = {
  name?: string[];
  parent_id?: string[];
};

interface CategoryPickerProps {
  categoryType: LaravelCategoryType;
  selectedId: number | null;
  selectedLabel: string;
  onSelect: (category: LaravelSelectableCategory) => void;
  inputId?: string;
  error?: string | null;
}

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

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  categoryType,
  selectedId,
  selectedLabel,
  onSelect,
  inputId,
  error,
}) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const generatedId = useId().replace(/:/g, '');
  const listId = `${generatedId}-category-options`;
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const mainCategoryRequestId = useRef(0);
  const [query, setQuery] = useState(selectedLabel);
  const [hasEditedQuery, setHasEditedQuery] = useState(false);
  const [options, setOptions] = useState<LaravelSelectableCategory[]>([]);
  const [activeMainCategories, setActiveMainCategories] = useState<LaravelMainCategory[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMainCategories, setIsLoadingMainCategories] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeOptionIndex, setActiveOptionIndex] = useState(-1);
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [fieldErrors, setFieldErrors] = useState<CategoryFieldErrors>({});
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [mainCategoryError, setMainCategoryError] = useState<string | null>(null);

  useEffect(() => {
    setQuery(selectedLabel);
    setHasEditedQuery(false);
  }, [selectedId, selectedLabel]);

  useEffect(() => {
    let isCurrentRequest = true;
    setIsLoading(true);
    setPickerError(null);
    setOptions([]);
    setActiveOptionIndex(-1);

    getSelectableCategories(categoryType, { search: query })
      .then(({ data }) => {
        if (isCurrentRequest) {
          setOptions(data);
          setActiveOptionIndex(data.length > 0 ? 0 : -1);
        }
      })
      .catch((requestError: unknown) => {
        if (isCurrentRequest) {
          setPickerError(getApiErrorMessage(requestError, 'Could not load categories.'));
        }
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoading(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [categoryType, query]);

  const loadActiveMainCategories = useCallback(async () => {
    const requestId = ++mainCategoryRequestId.current;
    setIsLoadingMainCategories(true);
    setMainCategoryError(null);

    try {
      const { data } = await getCategories(categoryType, { active: '1' });
      if (requestId === mainCategoryRequestId.current) setActiveMainCategories(data);
    } catch (requestError) {
      if (requestId === mainCategoryRequestId.current) {
        setMainCategoryError(getApiErrorMessage(requestError, 'Could not load main categories.'));
      }
    } finally {
      if (requestId === mainCategoryRequestId.current) setIsLoadingMainCategories(false);
    }
  }, [categoryType]);

  useEffect(() => {
    void loadActiveMainCategories();
    return () => {
      mainCategoryRequestId.current += 1;
    };
  }, [loadActiveMainCategories]);

  useEffect(() => {
    if (hasEditedQuery || options.length === 0) return;

    if (selectedId !== null) {
      const selectedCategory = options.find((option) => option.id === selectedId);
      if (selectedCategory) setQuery(selectedCategory.label);
      return;
    }

    if (!selectedLabel) return;
    const exactLabelMatch = options.find((option) => option.label === selectedLabel);
    const nameMatches = options.filter((option) => option.name === selectedLabel);
    const matchingCategory = exactLabelMatch ?? (nameMatches.length === 1 ? nameMatches[0] : null);
    if (matchingCategory) onSelect(matchingCategory);
  }, [hasEditedQuery, onSelect, options, selectedId, selectedLabel]);

  useEffect(() => {
    const handleOutsideMouseDown = (event: MouseEvent) => {
      if (event.target instanceof Node && !wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
        setQuery(selectedLabel);
        setHasEditedQuery(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideMouseDown);
    return () => document.removeEventListener('mousedown', handleOutsideMouseDown);
  }, [selectedLabel]);

  const handleSelect = (category: LaravelSelectableCategory) => {
    onSelect(category);
    setQuery(category.label);
    setHasEditedQuery(false);
    setIsOpen(false);
    setFieldErrors({});
    setPickerError(null);
  };

  const handleCreateCategory = async () => {
    const name = query.trim();
    if (!isAdmin || !name || !parentCategoryId) return;

    const parent = activeMainCategories.find((category) => category.id === Number(parentCategoryId));
    if (!parent) {
      setFieldErrors((current) => ({
        ...current,
        parent_id: ['Select an active Main category.'],
      }));
      return;
    }

    setFieldErrors({});
    setPickerError(null);
    setIsCreating(true);
    try {
      const { data } = await createCategory(categoryType, {
        name,
        parent_id: Number(parentCategoryId),
      });

      handleSelect({
        id: data.id,
        name: data.name,
        main_id: parent.id,
        main_name: parent.name,
        label: `${parent.name} > ${data.name}`,
      });
    } catch (createError) {
      const validationErrors = getCategoryFieldErrors(createError);
      if (validationErrors) {
        setFieldErrors(validationErrors);
      } else {
        setPickerError(getApiErrorMessage(createError, 'Could not create category.'));
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setActiveOptionIndex((index) => Math.min(index + 1, options.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      setActiveOptionIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && isOpen) {
      const activeOption = options[activeOptionIndex];
      if (activeOption) {
        event.preventDefault();
        handleSelect(activeOption);
      }
    } else if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      setIsOpen(false);
      setQuery(selectedLabel);
      setHasEditedQuery(false);
    }
  };

  const showCreateRow =
    isAdmin &&
    query.trim().length > 0 &&
    options.length === 0 &&
    !isLoading &&
    !pickerError;

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-activedescendant={
            isOpen && activeOptionIndex >= 0 ? `${listId}-option-${activeOptionIndex}` : undefined
          }
          aria-invalid={Boolean(error || fieldErrors.name?.length)}
          aria-describedby={
            error || fieldErrors.name?.length
              ? `${generatedId}-category-error`
              : undefined
          }
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setHasEditedQuery(true);
            setIsOpen(true);
            setActiveOptionIndex(-1);
            setFieldErrors((current) => ({ ...current, name: undefined }));
            setPickerError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search or select a category"
          className="w-full px-3 py-2 pr-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-none"
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-slate-400" />
      </div>

      {(error || fieldErrors.name?.length) && (
        <p id={`${generatedId}-category-error`} className="mt-1 text-rose-600" role="alert">
          {error || fieldErrors.name?.[0]}
        </p>
      )}
      {fieldErrors.parent_id?.map((message, index) => (
        <p key={`${message}-${index}`} className="mt-1 text-rose-600" role="alert">
          {message}
        </p>
      ))}
      {pickerError && (
        <p className="mt-1 flex items-start gap-1 text-rose-600" role="alert">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {pickerError}
        </p>
      )}

      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full z-40 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg"
        >
          {isLoading ? (
            <div className="flex items-center gap-2 px-3 py-3 text-xs text-slate-500">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading categories...
            </div>
          ) : options.length > 0 ? (
            <div id={listId} role="listbox">
              {options.map((option, index) => (
                <div
                  id={`${listId}-option-${index}`}
                  key={option.id}
                  role="option"
                  aria-selected={selectedId === option.id}
                  onMouseEnter={() => setActiveOptionIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(option)}
                  className={`cursor-pointer px-3 py-2.5 text-xs ${
                    activeOptionIndex === index
                      ? 'bg-orange-50 text-slate-900'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {option.label}
                </div>
              ))}
            </div>
          ) : pickerError ? (
            <div className="px-3 py-3 text-xs text-rose-600">{pickerError}</div>
          ) : showCreateRow ? (
            <div className="space-y-2 border-t border-slate-100 p-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  Create &quot;{query.trim()}&quot; under
                </span>
                <select
                  aria-label="Main category for new sub-category"
                  value={parentCategoryId}
                  onChange={(event) => {
                    setParentCategoryId(event.target.value);
                    setFieldErrors((current) => ({ ...current, parent_id: undefined }));
                  }}
                  disabled={
                    isLoadingMainCategories ||
                    Boolean(mainCategoryError) ||
                    activeMainCategories.length === 0 ||
                    isCreating
                  }
                  aria-invalid={Boolean(fieldErrors.parent_id?.length)}
                  className="min-w-0 flex-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-none disabled:opacity-60"
                >
                  <option value="">
                    {isLoadingMainCategories ? 'Loading main categories...' : 'Select a main category'}
                  </option>
                  {activeMainCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => void handleCreateCategory()}
                  disabled={
                    !parentCategoryId ||
                    isLoadingMainCategories ||
                    Boolean(mainCategoryError) ||
                    isCreating
                  }
                  className="px-3 py-2 bg-[#FF6B00] hover:bg-[#E56000] text-white rounded-lg text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
              {isLoadingMainCategories && (
                <p className="text-xs text-slate-500">Loading active main categories...</p>
              )}
              {mainCategoryError && (
                <div className="flex items-center justify-between gap-2 text-xs text-rose-600" role="alert">
                  <span>{mainCategoryError}</span>
                  <button
                    type="button"
                    onClick={() => void loadActiveMainCategories()}
                    className="shrink-0 font-semibold underline"
                  >
                    Retry
                  </button>
                </div>
              )}
              {!isLoadingMainCategories && !mainCategoryError && activeMainCategories.length === 0 && (
                <p className="text-xs text-slate-500">Create an active Main category first.</p>
              )}
            </div>
          ) : (
            <div className="px-3 py-3 text-xs text-slate-500">No matching categories.</div>
          )}
        </div>
      )}
    </div>
  );
};
