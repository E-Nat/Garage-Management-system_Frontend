import { useEffect, useState } from 'react';
import { getItems } from '../../services/api';
import type { LaravelMechanicItem } from '../../services/api';
import type { InventoryItem } from '../../types';
import { getApiErrorDetails } from '../../utils/apiError';

export interface RepairPartOption {
  id: string;
  itemCode: string;
  itemName: string;
  sellingPrice: number;
  currentStock: number;
  stockStatus: 'ok' | 'low' | 'out';
  categoryLabel: string;
  deactivated: boolean;
}

const isMechanicItem = (item: unknown): item is LaravelMechanicItem => {
  if (typeof item !== 'object' || item === null) return false;
  return 'id' in item && typeof item.id === 'number'
    && 'item_code' in item && typeof item.item_code === 'string'
    && 'item_name' in item && typeof item.item_name === 'string'
    && 'selling_price' in item && typeof item.selling_price === 'number'
    && 'current_stock' in item && typeof item.current_stock === 'number'
    && 'stock_status' in item && ['ok', 'low', 'out'].includes(String(item.stock_status))
    && 'category_label' in item && (typeof item.category_label === 'string' || item.category_label === null);
};

export const mapInventoryParts = (items: InventoryItem[]): RepairPartOption[] =>
  items.filter((item) => item.status !== 'deactivated').map((item) => ({
    id: item.id,
    itemCode: item.partNumber,
    itemName: item.name,
    sellingPrice: item.unitPrice,
    currentStock: item.stock,
    stockStatus: item.stock <= 0 ? 'out' : item.stock <= item.minStock ? 'low' : 'ok',
    categoryLabel: item.category,
    deactivated: item.status === 'deactivated',
  }));

export const useMechanicParts = (enabled: boolean) => {
  const [parts, setParts] = useState<RepairPartOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setParts([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);
    getItems()
      .then(({ data }) => {
        const mechanicItems = data.filter(isMechanicItem);
        if (mechanicItems.length !== data.length) {
          throw new Error('The mechanic item list did not return the required picker fields.');
        }
        if (active) {
          setParts(mechanicItems.map((item) => ({
            id: String(item.id),
            itemCode: item.item_code,
            itemName: item.item_name,
            sellingPrice: Number(item.selling_price),
            currentStock: Number(item.current_stock),
            stockStatus: item.stock_status,
            categoryLabel: item.category_label ?? '',
            deactivated: false,
          })));
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          const details = getApiErrorDetails(requestError, 'Could not load repair parts.');
          setError(details.status === 403 ? `Access denied: ${details.message}` : details.message);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled]);

  return { parts, isLoading, error };
};
