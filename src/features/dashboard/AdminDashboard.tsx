import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { OperationalDashboardWidgets } from './OperationalDashboardWidgets';

export const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Operational overview for {currentUser?.name}
          </p>
        </div>
      </div>

      {/* Operational Dashboard Summary Widgets with Date Filter */}
      <OperationalDashboardWidgets />
    </div>
  );
};

