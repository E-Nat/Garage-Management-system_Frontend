import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GarageProvider, useGarage } from './context/GarageContext';
import { LoginForm } from './components/auth/LoginForm';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { AdvisorDashboard } from './components/dashboards/AdvisorDashboard';
import { MechanicDashboard } from './components/dashboards/MechanicDashboard';
import { PartsDashboard } from './components/dashboards/PartsDashboard';
import { CustomerDashboard } from './components/dashboards/CustomerDashboard';
import { CustomerManagement } from './components/customers/CustomerManagement';
import { VehicleManagement } from './components/vehicles/VehicleManagement';
import { RepairJobManagement } from './components/repairs/RepairJobManagement';
import { ItemsManagement } from './components/items/ItemsManagement';
import { InvoiceManagement } from './components/invoices/InvoiceManagement';
import { StockManagement } from './components/inventory/StockManagement';
import { ReportsOverview } from './components/reports/ReportsOverview';
import { SettingsView } from './components/settings/SettingsView';
import { motion, AnimatePresence } from 'motion/react';
import { ModulePermissionId } from './types';

const TAB_TO_PERMISSION: Record<string, ModulePermissionId> = {
  dashboard: 'dashboard',
  customers: 'customers',
  vehicles: 'vehicles',
  jobs: 'repairs',
  repairs: 'repairs',
  items: 'inventory',
  stock: 'stock',
  invoices: 'invoices',
  reports: 'reports',
  settings: 'settings',
};

const DEFAULT_ALLOWED_TABS = ['dashboard', 'customers', 'vehicles', 'jobs', 'items', 'stock', 'invoices', 'reports', 'settings'];

function AppContent() {
  const { currentUser, activeTab, setActiveTab } = useAuth();
  const { rolePermissions } = useGarage();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const effectivePermissions = useMemo(() => {
    if (!currentUser) return [] as ModulePermissionId[];
    if (currentUser.role === 'admin' || currentUser.role === 'owner') {
      return Array.from(new Set(DEFAULT_ALLOWED_TABS.map((tab) => TAB_TO_PERMISSION[tab])));
    }

    const fromUser = currentUser.permissions ?? [];
    if (fromUser.length > 0) return fromUser;
    return rolePermissions[currentUser.role] ?? [];
  }, [currentUser, rolePermissions]);

  const hasPermission = (tabId: string) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'owner') return true;

    const permissionKey = TAB_TO_PERMISSION[tabId] ?? TAB_TO_PERMISSION[tabId === 'repairs' ? 'jobs' : tabId];
    return Boolean(permissionKey && effectivePermissions.includes(permissionKey));
  };

  const allowedTabs = DEFAULT_ALLOWED_TABS.filter((tab) => hasPermission(tab));
  const isTabAuthorized = allowedTabs.includes(activeTab) || (activeTab === 'repairs' && hasPermission('jobs')) || (activeTab === 'jobs' && hasPermission('jobs'));

  useEffect(() => {
    if (!currentUser) return;
    const requestedTab = activeTab === 'repairs' ? 'jobs' : activeTab;
    if (!hasPermission(requestedTab)) {
      setActiveTab(allowedTabs[0] ?? 'dashboard');
    }
  }, [activeTab, allowedTabs, currentUser, setActiveTab]);

  useEffect(() => {
    if (!currentUser) return;
    const hash = window.location.hash.replace('#', '').trim();
    if (hash && !['dashboard', 'customers', 'vehicles', 'jobs', 'items', 'stock', 'invoices', 'reports', 'settings', 'repairs'].includes(hash)) {
      return;
    }
    if (hash && !hasPermission(hash === 'repairs' ? 'jobs' : hash)) {
      window.location.hash = '#dashboard';
      setActiveTab('dashboard');
    }
  }, [currentUser, allowedTabs, setActiveTab]);

  // Lock background body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileSidebarOpen]);

  // Close mobile sidebar if window resizes to >= 1200px
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1200 && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileSidebarOpen]);

  if (!currentUser) {
    return <LoginForm />;
  }

  const renderDashboardByRole = () => {
    switch (currentUser.role) {
      case 'admin':
      case 'owner':
        return <AdminDashboard />;
      case 'advisor':
      case 'staff':
        return <AdvisorDashboard />;
      case 'mechanic':
        return <MechanicDashboard />;
      case 'parts_manager':
        return <PartsDashboard />;
      case 'customer':
        return <CustomerDashboard />;
      default:
        return <AdminDashboard />;
    }
  };

  const renderForbidden = () => (
    <div className="bg-white border border-rose-200 rounded-2xl p-8 shadow-sm max-w-xl mx-auto text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 text-rose-600 mb-4">
        <span className="text-xl font-bold">403</span>
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Access denied</h2>
      <p className="text-sm text-slate-600 mb-4">
        This section is not included in your current permission set.
      </p>
      <button
        type="button"
        onClick={() => setActiveTab(allowedTabs[0] ?? 'dashboard')}
        className="px-4 py-2 bg-[#FF6B00] hover:bg-[#E56000] text-white rounded-lg text-xs font-bold"
      >
        Return to dashboard
      </button>
    </div>
  );

  const renderTabContent = () => {
    if (!isTabAuthorized) return renderForbidden();

    switch (activeTab) {
      case 'dashboard':
        return renderDashboardByRole();
      case 'customers':
        return <CustomerManagement />;
      case 'vehicles':
        return <VehicleManagement />;
      case 'jobs':
      case 'repairs':
        if (currentUser.role === 'mechanic') return <MechanicDashboard />;
        return <RepairJobManagement />;
      case 'items':
        return <ItemsManagement />;
      case 'stock':
        return <StockManagement />;
      case 'invoices':
        return <InvoiceManagement />;
      case 'reports':
        return <ReportsOverview />;
      case 'settings':
        return <SettingsView />;
      default:
        return renderDashboardByRole();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans selection:bg-[#FF6B00] selection:text-white max-w-full overflow-x-hidden">
      <Header
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isSidebarOpen={isMobileSidebarOpen}
      />
      <div className="flex-1 flex max-w-7xl w-full mx-auto min-w-0">
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentUser.id}-${activeTab}-${currentUser.role}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="min-w-0"
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GarageProvider>
        <AppContent />
      </GarageProvider>
    </AuthProvider>
  );
}
