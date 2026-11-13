import React, { useEffect, useState } from 'react';
import { Boxes, Package } from 'lucide-react';
import { ItemsManagement } from '../items/ItemsManagement';
import { StockManagement } from './StockManagement';

type InventorySection = 'items' | 'stock';

const getInitialSection = (): InventorySection =>
  new URLSearchParams(window.location.search).get('tab') === 'history' ? 'stock' : 'items';

export const InventoryManagement: React.FC = () => {
  const [section, setSection] = useState<InventorySection>(getInitialSection);

  useEffect(() => {
    const syncSectionFromRoute = () => setSection(getInitialSection());
    window.addEventListener('popstate', syncSectionFromRoute);
    return () => window.removeEventListener('popstate', syncSectionFromRoute);
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex border-b border-slate-200 gap-4">
        <button
          type="button"
          onClick={() => setSection('items')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 ${
            section === 'items'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Package className="w-4 h-4" />
          Items
        </button>
        <button
          type="button"
          onClick={() => setSection('stock')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 ${
            section === 'stock'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Stock
        </button>
      </div>
      {section === 'items' ? <ItemsManagement /> : <StockManagement initialTab={getInitialSection() === 'stock' ? 'history' : 'stock_in'} />}
    </div>
  );
};
