import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGarage } from '../../context/GarageContext';
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
  X,
  LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '../../types';
import logoImg from '../../assets/images/logo.png';

interface NavConfig {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onCloseMobile }) => {
  const { currentUser, activeTab, setActiveTab, quickSwitchRole, logout } = useAuth();
  const { systemSettings, rolePermissions } = useGarage();

  const logoUrl = (systemSettings?.garageInfo?.logoUrl && !systemSettings.garageInfo.logoUrl.includes('unsplash.com'))
    ? systemSettings.garageInfo.logoUrl
    : logoImg;

  const hasPermission = (tabId: string) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'owner') return true;

    const permissionMap: Record<string, string> = {
      dashboard: 'dashboard',
      customers: 'customers',
      vehicles: 'vehicles',
      jobs: 'repairs',
      items: 'inventory',
      stock: 'stock',
      invoices: 'invoices',
      reports: 'reports',
      settings: 'settings',
    };
    const permission = permissionMap[tabId];
    const permissions = currentUser.permissions ?? rolePermissions[currentUser.role] ?? [];
    return permission ? permissions.includes(permission) : true;
  };

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

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
  ].filter((item) => hasPermission(item.id));

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navContent = (isMobileView = false) => (
    <div className="flex flex-col justify-between h-full space-y-6">
      <div className="space-y-4">
        {/* Mobile Header in Drawer */}
        {isMobileView && (
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback');
                    if (fallback) (fallback as HTMLElement).style.display = 'flex';
                  }}
                />
                <div className="logo-fallback hidden w-8 h-8 rounded-lg bg-[#FF6B00] text-white items-center justify-center font-bold">
                  <Wrench className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900 tracking-tight block leading-tight">
                  APEX GARAGE
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Service Platform
                </span>
              </div>
            </div>
            <button
              id="close-mobile-sidebar-btn"
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Mobile Quick Role Switcher */}
        {isMobileView && (
          <div className="space-y-1.5">
            <div className="px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Switch Role
            </div>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
              {(['admin', 'advisor', 'mechanic', 'parts_manager', 'customer'] as UserRole[]).map((roleKey) => {
                const isCurrent = currentUser.role === roleKey;
                return (
                  <button
                    key={roleKey}
                    id={`mobile-quick-role-${roleKey}`}
                    onClick={() => {
                      quickSwitchRole(roleKey);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`px-2 py-1.5 rounded-lg text-[11px] transition-colors font-medium text-center cursor-pointer ${
                      isCurrent
                        ? 'bg-[#FFF1E8] text-[#FF6B00] font-semibold border border-[#FF6B00]/30 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`}
                  >
                    {roleKey === 'parts_manager' ? 'Parts' : roleKey.replace('_', ' ')}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
                  id={isMobileView ? `mobile-nav-item-${item.id}` : `nav-item-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#FFF1E8] text-[#FF6B00] font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 font-medium'
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
      <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-2 px-2">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">User</span>
          <span className="text-slate-800 font-medium truncate max-w-[120px]" title={currentUser.email}>
            {currentUser.name}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Role</span>
          <span className="text-[#FF6B00] font-semibold uppercase text-[10px] bg-[#FFF1E8] px-1.5 py-0.5 rounded">
            {currentUser.role.replace('_', ' ')}
          </span>
        </div>
        {isMobileView && (
          <button
            onClick={() => {
              logout();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full mt-2 py-2 px-3 flex items-center justify-center gap-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Static Desktop Sidebar (>= 1200px: min-[1200px]:flex) */}
      <aside className="w-60 bg-white border-r border-slate-100 text-slate-700 min-h-[calc(100vh-4rem)] p-4 hidden min-[1200px]:flex flex-col justify-between shrink-0">
        {navContent(false)}
      </aside>

      {/* Mobile/Tablet Slide-in Drawer (< 1200px: min-[1200px]:hidden) */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="min-[1200px]:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              id="sidebar-mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs cursor-pointer"
              aria-hidden="true"
            />

            {/* Sliding Drawer Panel */}
            <motion.div
              id="sidebar-mobile-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative w-72 max-w-[85vw] bg-white text-slate-700 h-full p-4 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto"
            >
              {navContent(true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

