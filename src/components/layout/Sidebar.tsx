import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Car,
  Wrench,
  Package,
  Boxes,
  Receipt,
  BarChart3,
  Settings,
} from 'lucide-react';

interface NavConfig {
  id: string;
  label: string;
  icon: React.ElementType;
}

export const Sidebar: React.FC = () => {
  const { currentUser, activeTab, setActiveTab } = useAuth();

  if (!currentUser) return null;

  const navItems: NavConfig[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
    },
    {
      id: 'vehicles',
      label: 'Vehicles',
      icon: Car,
    },
    {
      id: 'jobs',
      label: 'Jobs',
      icon: Wrench,
    },
    {
      id: 'items',
      label: 'Items',
      icon: Package,
    },
    {
      id: 'stock',
      label: 'Stock',
      icon: Boxes,
    },
    {
      id: 'invoices',
      label: 'Invoices',
      icon: Receipt,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-60 bg-white border-r border-slate-100 text-slate-700 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex shrink-0">
      <div className="space-y-6">
        <div>
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.id === 'jobs' && activeTab === 'repairs');
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#FFF1E8] text-[#FF6B00] font-semibold'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/70 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF6B00]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer info inside sidebar */}
      <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1.5 px-2">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">User</span>
          <span className="text-slate-800 font-medium truncate max-w-[110px]" title={currentUser.email}>
            {currentUser.name}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Role</span>
          <span className="text-[#FF6B00] font-semibold uppercase text-[10px] bg-[#FFF1E8] px-1.5 py-0.5 rounded">
            {currentUser.role.replace('_', ' ')}
          </span>
        </div>
      </div>
    </aside>
  );
};

