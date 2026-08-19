import React, { useState, useEffect } from 'react';
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

function AppContent() {
  const { currentUser, activeTab } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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

  const renderTabContent = () => {
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
