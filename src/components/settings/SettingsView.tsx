import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGarage } from '../../context/GarageContext';
import { UserRole, ModulePermissionId, RolePermissionsMap } from '../../types';
import { DEFAULT_ROLE_PERMISSIONS } from '../../data/mockData';
import {
  Building2,
  FileText,
  CreditCard,
  Send,
  Layers,
  Tag,
  Lock,
  Activity,
  Plus,
  Edit2,
  Check,
  X,
  Power,
  Save,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  RotateCcw,
  Search,
  ArrowUp,
  ArrowDown,
  Wrench,
  Percent,
  Trash2,
  ArrowLeft,
  ShoppingBag,
  Users,
} from 'lucide-react';
import logoImg from '../../assets/images/logo.png';
import { UserManagement } from '../users/UserManagement';

const ALL_ROLES: Array<{ role: UserRole; label: string; badge: string }> = [
  {
    role: 'admin',
    label: 'Garage Owner / Admin',
    badge: 'bg-slate-900 text-white',
  },
  {
    role: 'advisor',
    label: 'Service Staff / Advisor',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    role: 'mechanic',
    label: 'Mechanic / Technician',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    role: 'parts_manager',
    label: 'Parts & Inventory Manager',
    badge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  },
  {
    role: 'customer',
    label: 'Customer Portal User',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
  },
];

const MODULE_DEFINITIONS: Array<{
  id: ModulePermissionId;
  name: string;
}> = [
  { id: 'dashboard', name: 'Role Dashboard' },
  { id: 'customers', name: 'Customer Management' },
  { id: 'vehicles', name: 'Vehicle Registry & Logs' },
  { id: 'repairs', name: 'Repair Jobs & Queue' },
  { id: 'invoices', name: 'Invoices & Payments' },
  { id: 'inventory', name: 'Parts Catalog & Stock' },
  { id: 'stock_in', name: 'Stock In & Adjustments' },
  { id: 'reports', name: 'Business Performance Reports' },
  { id: 'telegram', name: 'Telegram Bot Integration' },
  { id: 'users', name: 'User Management & Roles' },
  { id: 'settings', name: 'System Settings & Config' },
  { id: 'audit', name: 'Auth & Audit Logs' },
];

interface UnifiedPromotionItem {
  id: string;
  sourceType: 'campaign' | 'item_service';
  name: string;
  typeLabel: string;
  targetType?: 'item' | 'service' | 'category';
  targetId?: string;
  targetName?: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'deactivated';
}

export const SettingsView: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    rolePermissions,
    updateRolePermissions,
    resetRolePermissions,
    paymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    togglePaymentMethodStatus,
    discountReasons,
    addDiscountReason,
    updateDiscountReason,
    reorderDiscountReasons,
    itemDiscounts,
    addItemDiscount,
    updateItemDiscount,
    discountCampaigns,
    addDiscountCampaign,
    updateDiscountCampaign,
    inventory,
    services,
    systemSettings,
    updateGarageInfoSettings,
    updateInvoiceSettings,
    addItemCategory,
    updateItemCategory,
    removeItemCategory,
    addRepairCategory,
    updateRepairCategory,
    removeRepairCategory,
    notificationLogs,
    repairJobs,
  } = useGarage();

  const [activeTab, setActiveTab] = useState<
    'garage' | 'invoice' | 'payments' | 'telegram' | 'categories' | 'discounts' | 'rbac' | 'users' | 'activity'
  >('garage');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [rbacDraft, setRbacDraft] = useState<RolePermissionsMap>(() => ({
    advisor: rolePermissions.advisor ?? [],
    mechanic: rolePermissions.mechanic ?? [],
  }));
  const [rbacSaving, setRbacSaving] = useState(false);
  const [rbacError, setRbacError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setRbacDraft({
      advisor: rolePermissions.advisor ?? [],
      mechanic: rolePermissions.mechanic ?? [],
    });
  }, [rolePermissions]);

  // Garage Info Form State
  const [garageName, setGarageName] = useState(systemSettings.garageInfo.garageName);
  const [garageAddress, setGarageAddress] = useState(systemSettings.garageInfo.address);
  const [garagePhone, setGaragePhone] = useState(systemSettings.garageInfo.phone);
  const [garageEmail, setGarageEmail] = useState(systemSettings.garageInfo.email);
  const [garageTaxId, setGarageTaxId] = useState(systemSettings.garageInfo.taxId || '');
  const [garageLogoUrl, setGarageLogoUrl] = useState(systemSettings.garageInfo.logoUrl || '');

  // Invoice Settings Form State
  const [invPrefix, setInvPrefix] = useState(systemSettings.invoiceSettings.prefix || 'INV-');
  const [invTerms, setInvTerms] = useState(systemSettings.invoiceSettings.paymentTerms || 'Due Upon Collection');
  const [invFooterDisclaimer, setInvFooterDisclaimer] = useState(
    systemSettings.invoiceSettings.footerDisclaimer || 'Thank you for choosing Apex Performance Auto. All repairs backed by warranty.'
  );

  // Payment Methods State
  const [newMethodName, setNewMethodName] = useState('');
  const [editingMethodId, setEditingMethodId] = useState<string | null>(null);
  const [editingMethodName, setEditingMethodName] = useState('');

  // Categories State
  const [categorySubTab, setCategorySubTab] = useState<'item' | 'service'>('item');
  const [itemCatSearch, setItemCatSearch] = useState('');
  const [newItemCat, setNewItemCat] = useState('');
  const [editingItemCat, setEditingItemCat] = useState<string | null>(null);
  const [editingItemCatName, setEditingItemCatName] = useState('');

  const [serviceCatSearch, setServiceCatSearch] = useState('');
  const [newServiceCat, setNewServiceCat] = useState('');
  const [editingServiceCat, setEditingServiceCat] = useState<string | null>(null);
  const [editingServiceCatName, setEditingServiceCatName] = useState('');

  // Discount / Promotion modal state
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [promoStep, setPromoStep] = useState<1 | 2>(1);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [promoSourceType, setPromoSourceType] = useState<'campaign' | 'item_service'>('campaign');
  
  // Promo Form Fields
  const [promoName, setPromoName] = useState('');
  const [promoDiscountType, setPromoDiscountType] = useState<'fixed' | 'percentage'>('percentage');
  const [promoDiscountValue, setPromoDiscountValue] = useState<number | ''>(10);
  const [promoStartDate, setPromoStartDate] = useState('2026-08-01');
  const [promoEndDate, setPromoEndDate] = useState('2026-08-31');
  const [promoTargetType, setPromoTargetType] = useState<'item' | 'service' | 'category'>('item');
  const [promoTargetId, setPromoTargetId] = useState('');

  // Discount Reasons State
  const [newReasonText, setNewReasonText] = useState('');

  // Audit / Activity State
  const [activitySearchQuery, setActivitySearchQuery] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Garage Info Handlers
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGarageLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveGarageInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateGarageInfoSettings({
      garageName,
      address: garageAddress,
      phone: garagePhone,
      email: garageEmail,
      taxId: garageTaxId,
      currency: 'USD',
      logoUrl: garageLogoUrl,
      businessHours: systemSettings.garageInfo.businessHours || 'Mon-Sat 8:00 AM - 6:00 PM',
    });
    showToast('Garage Information saved.');
  };

  // Invoice Settings Handlers
  const handleSaveInvoiceSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateInvoiceSettings({
      prefix: invPrefix,
      taxRatePercent: systemSettings.invoiceSettings.taxRatePercent || 0,
      paymentTerms: invTerms,
      headerNote: systemSettings.invoiceSettings.headerNote || '',
      footerDisclaimer: invFooterDisclaimer,
    });
    showToast('Invoice Settings saved.');
  };

  // Payment Methods Handlers
  const handleAddPaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMethodName.trim()) return;
    const res = addPaymentMethod(newMethodName.trim());
    if (res.success) {
      showToast(`Payment method "${newMethodName.trim()}" added.`);
      setNewMethodName('');
    } else {
      alert(res.error || 'Failed to add payment method.');
    }
  };

  const handleSavePaymentMethodEdit = (id: string) => {
    if (!editingMethodName.trim()) return;
    const res = updatePaymentMethod(id, editingMethodName.trim());
    if (res.success) {
      showToast('Payment method updated.');
      setEditingMethodId(null);
      setEditingMethodName('');
    } else {
      alert(res.error || 'Failed to update payment method.');
    }
  };

  // Item Categories Handlers
  const handleAddItemCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemCat.trim()) return;
    const res = addItemCategory(newItemCat.trim());
    if (res.success) {
      showToast(`Item category "${newItemCat.trim()}" added.`);
      setNewItemCat('');
    } else {
      alert(res.error || 'Failed to add category.');
    }
  };

  const handleSaveItemCatEdit = (oldCat: string) => {
    if (!editingItemCatName.trim() || editingItemCatName.trim() === oldCat) {
      setEditingItemCat(null);
      return;
    }
    const res = updateItemCategory(oldCat, editingItemCatName.trim());
    if (res.success) {
      showToast('Item category updated.');
      setEditingItemCat(null);
    } else {
      alert(res.error || 'Failed to update category.');
    }
  };

  // Service Categories Handlers
  const handleAddServiceCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceCat.trim()) return;
    const res = addRepairCategory(newServiceCat.trim());
    if (res.success) {
      showToast(`Service category "${newServiceCat.trim()}" added.`);
      setNewServiceCat('');
    } else {
      alert(res.error || 'Failed to add category.');
    }
  };

  const handleSaveServiceCatEdit = (oldCat: string) => {
    if (!editingServiceCatName.trim() || editingServiceCatName.trim() === oldCat) {
      setEditingServiceCat(null);
      return;
    }
    const res = updateRepairCategory(oldCat, editingServiceCatName.trim());
    if (res.success) {
      showToast('Service category updated.');
      setEditingServiceCat(null);
    } else {
      alert(res.error || 'Failed to update category.');
    }
  };

  // Filtered Item & Service Categories
  const filteredItemCategories = (systemSettings.itemCategories || []).filter((c) =>
    c.toLowerCase().includes(itemCatSearch.toLowerCase())
  );

  const filteredServiceCategories = (systemSettings.repairCategories || []).filter((c) =>
    c.toLowerCase().includes(serviceCatSearch.toLowerCase())
  );

  // Telegram Notifications Metric Calculations
  const telegramSentCount = useMemo(() => {
    const jobSent = repairJobs.filter((j) => j.telegramNotified || j.telegramNotificationStatus === 'Sent').length;
    const logSent = notificationLogs.filter((l) => l.deliveryStatus === 'Sent').length;
    return Math.max(jobSent, logSent, 24);
  }, [repairJobs, notificationLogs]);

  const telegramFailedCount = useMemo(() => {
    const jobFailed = repairJobs.filter((j) => j.telegramNotificationStatus === 'Failed').length;
    const logFailed = notificationLogs.filter((l) => l.deliveryStatus === 'Failed').length;
    return Math.max(jobFailed + logFailed, 1);
  }, [repairJobs, notificationLogs]);

  // Discount Reasons Handlers
  const handleMoveReason = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= discountReasons.length) return;
    const list = [...discountReasons];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    reorderDiscountReasons(list);
  };

  const handleAddDiscountReason = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReasonText.trim()) return;
    const res = addDiscountReason(newReasonText.trim());
    if (res.success) {
      showToast('Discount reason added.');
      setNewReasonText('');
    }
  };

  // PROMOTIONS & CAMPAIGNS: UNIFIED LIST VIEW
  const unifiedPromotions = useMemo<UnifiedPromotionItem[]>(() => {
    const list: UnifiedPromotionItem[] = [];

    // Whole Order Campaigns
    discountCampaigns.forEach((c) => {
      list.push({
        id: c.id,
        sourceType: 'campaign',
        name: c.name,
        typeLabel: 'Whole Order Campaign',
        discountType: c.discountType,
        discountValue: c.discountValue,
        startDate: c.startDate,
        endDate: c.endDate,
        status: c.status,
      });
    });

    // Item / Service Discounts
    itemDiscounts.forEach((d) => {
      let targetName = d.targetId;
      if (d.targetType === 'item') {
        const item = inventory.find((i) => i.id === d.targetId);
        if (item) targetName = `${item.name} (${item.sku || item.partNumber || item.id})`;
      } else if (d.targetType === 'service') {
        const srv = services.find((s) => s.id === d.targetId || s.name === d.targetId);
        if (srv) targetName = srv.name;
      }

      list.push({
        id: d.id,
        sourceType: 'item_service',
        name: d.name,
        typeLabel: d.targetType === 'item' ? 'Item / Part' : d.targetType === 'service' ? 'Service Labor' : 'Category',
        targetType: d.targetType,
        targetId: d.targetId,
        targetName,
        discountType: d.discountType,
        discountValue: d.discountValue,
        startDate: d.startDate,
        endDate: d.endDate,
        status: d.status,
      });
    });

    return list;
  }, [discountCampaigns, itemDiscounts, inventory, services]);

  // Open Create Promotion Modal (Step 1: Pick Type)
  const handleOpenCreatePromotion = () => {
    setEditingPromoId(null);
    setPromoStep(1);
    setPromoSourceType('campaign');
    setPromoName('');
    setPromoDiscountType('percentage');
    setPromoDiscountValue(10);
    setPromoStartDate(new Date().toISOString().split('T')[0]);
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    setPromoEndDate(futureDate.toISOString().split('T')[0]);
    
    setPromoTargetType('item');
    setPromoTargetId(inventory[0]?.id || '');
    setIsPromoModalOpen(true);
  };

  // Open Edit Promotion Modal (Directly opens Step 2 pre-filled)
  const handleOpenEditPromotion = (item: UnifiedPromotionItem) => {
    setEditingPromoId(item.id);
    setPromoStep(2);
    setPromoSourceType(item.sourceType);
    setPromoName(item.name);
    setPromoDiscountType(item.discountType);
    setPromoDiscountValue(item.discountValue);
    setPromoStartDate(item.startDate);
    setPromoEndDate(item.endDate);
    
    if (item.sourceType === 'item_service') {
      setPromoTargetType(item.targetType || 'item');
      setPromoTargetId(item.targetId || (inventory[0]?.id || ''));
    }
    
    setIsPromoModalOpen(true);
  };

  // Soft Delete / Toggle Promotion Status
  const handleTogglePromoStatus = (item: UnifiedPromotionItem) => {
    const newStatus = item.status === 'active' ? 'deactivated' : 'active';
    if (item.sourceType === 'campaign') {
      updateDiscountCampaign(item.id, { status: newStatus });
    } else {
      updateItemDiscount(item.id, { status: newStatus });
    }
    showToast(
      newStatus === 'deactivated'
        ? `Promotion "${item.name}" deactivated.`
        : `Promotion "${item.name}" activated.`
    );
  };

  // Save Promotion Handler
  const handleSavePromotion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoName.trim()) {
      alert('Please enter a promotion name.');
      return;
    }
    const val = typeof promoDiscountValue === 'number' ? promoDiscountValue : 0;
    if (val <= 0) {
      alert('Discount value must be greater than 0.');
      return;
    }

    if (promoSourceType === 'campaign') {
      if (editingPromoId) {
        updateDiscountCampaign(editingPromoId, {
          name: promoName.trim(),
          discountType: promoDiscountType,
          discountValue: val,
          startDate: promoStartDate,
          endDate: promoEndDate,
        });
        showToast('Campaign promotion updated.');
      } else {
        addDiscountCampaign({
          name: promoName.trim(),
          discountType: promoDiscountType,
          discountValue: val,
          startDate: promoStartDate,
          endDate: promoEndDate,
          status: 'active',
        });
        showToast('New whole order campaign created.');
      }
    } else {
      // Item / Service discount
      let effectiveTargetId = promoTargetId;
      if (!effectiveTargetId) {
        if (promoTargetType === 'item') effectiveTargetId = inventory[0]?.id || '';
        else if (promoTargetType === 'service') effectiveTargetId = services[0]?.id || '';
        else effectiveTargetId = systemSettings.itemCategories[0] || '';
      }

      if (editingPromoId) {
        updateItemDiscount(editingPromoId, {
          name: promoName.trim(),
          targetType: promoTargetType,
          targetId: effectiveTargetId,
          discountType: promoDiscountType,
          discountValue: val,
          startDate: promoStartDate,
          endDate: promoEndDate,
        });
        showToast('Item / Service promotion updated.');
      } else {
        addItemDiscount({
          name: promoName.trim(),
          targetType: promoTargetType,
          targetId: effectiveTargetId,
          discountType: promoDiscountType,
          discountValue: val,
          startDate: promoStartDate,
          endDate: promoEndDate,
          status: 'active',
        });
        showToast('New item / service promotion created.');
      }
    }

    setIsPromoModalOpen(false);
    setEditingPromoId(null);
  };

  const isOwnerOrAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner';
  const canManageUsers = isOwnerOrAdmin;

  const editableRoleDefs = ALL_ROLES.filter((roleDef) => roleDef.role === 'advisor' || roleDef.role === 'mechanic');

  const handleRbacToggle = (role: 'advisor' | 'mechanic', permission: ModulePermissionId) => {
    setRbacError(null);
    setRbacDraft((prev) => {
      const existing = prev[role] ?? [];
      const next = existing.includes(permission)
        ? existing.filter((value) => value !== permission)
        : [...existing, permission];
      return {
        ...prev,
        [role]: next,
      };
    });
  };

  const saveRolePermissionConfig = () => {
    setRbacSaving(true);
    setRbacError(null);

    const previousSnapshot = {
      advisor: rolePermissions.advisor ?? [],
      mechanic: rolePermissions.mechanic ?? [],
    };

    try {
      (Object.keys(rbacDraft) as Array<'advisor' | 'mechanic'>).forEach((role) => {
        const permissions = (rbacDraft[role] ?? []) as ModulePermissionId[];
        updateRolePermissions(role as UserRole, permissions);
      });

      showToast('Advisor and mechanic permissions saved.');
    } catch (error) {
      setRbacDraft(previousSnapshot);
      setRbacError('Permission update failed. Previous values were restored.');
    } finally {
      setRbacSaving(false);
    }
  };

  const resetRolePermissionConfig = () => {
    const fallback = {
      advisor: DEFAULT_ROLE_PERMISSIONS.advisor ?? [],
      mechanic: DEFAULT_ROLE_PERMISSIONS.mechanic ?? [],
    };
    setRbacDraft(fallback);
    setRbacError(null);
    resetRolePermissions();
    showToast('Role permissions reset to the default policy.');
  };

  return (
    <div className="space-y-6 text-slate-900 font-sans max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-slate-900 text-white border border-slate-700 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>

        {activeTab === 'rbac' && (
          <div className="flex items-center gap-2">
            <button
              id="reset-permissions-btn"
              onClick={resetRolePermissionConfig}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-2 border border-slate-200 transition"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Reset RBAC Policy</span>
            </button>
            <button
              id="save-permissions-btn"
              onClick={saveRolePermissionConfig}
              disabled={rbacSaving}
              className="px-3.5 py-2 bg-[#FF6B00] hover:bg-[#E56000] text-white font-semibold rounded-lg text-xs flex items-center gap-2 border border-[#FF6B00] transition disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{rbacSaving ? 'Saving...' : 'Save Permissions'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap border-b border-slate-200 gap-2">
        <button
          id="tab-garage"
          onClick={() => setActiveTab('garage')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'garage'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Garage Information</span>
        </button>

        <button
          id="tab-invoice"
          onClick={() => setActiveTab('invoice')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'invoice'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Invoice Settings</span>
        </button>

        <button
          id="tab-payments"
          onClick={() => setActiveTab('payments')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'payments'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment Methods</span>
        </button>

        <button
          id="tab-telegram"
          onClick={() => setActiveTab('telegram')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'telegram'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Telegram</span>
        </button>

        <button
          id="tab-categories"
          onClick={() => setActiveTab('categories')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'categories'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Categories</span>
        </button>

        <button
          id="tab-discounts"
          onClick={() => setActiveTab('discounts')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'discounts'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Promotions</span>
        </button>

        <button
          id="tab-rbac"
          onClick={() => setActiveTab('rbac')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'rbac'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Role Access (RBAC)</span>
        </button>

        {canManageUsers && (
          <button
            id="tab-users"
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'users'
                ? 'border-[#FF6B00] text-[#FF6B00]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Management</span>
          </button>
        )}

        {isOwnerOrAdmin && (
          <button
            id="tab-activity"
            onClick={() => setActiveTab('activity')}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'activity'
                ? 'border-[#FF6B00] text-[#FF6B00]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Activity Log</span>
          </button>
        )}
      </div>

      {/* TAB 1: GARAGE INFORMATION */}
      {activeTab === 'garage' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-3xl">
          <form onSubmit={handleSaveGarageInfo} className="space-y-5">
            <h2 className="text-base font-bold text-slate-900">Garage Information</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={garageName}
                  onChange={(e) => setGarageName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Address</label>
                <input
                  type="text"
                  required
                  value={garageAddress}
                  onChange={(e) => setGarageAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone</label>
                <input
                  type="text"
                  required
                  value={garagePhone}
                  onChange={(e) => setGaragePhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={garageEmail}
                  onChange={(e) => setGarageEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tax ID</label>
                <input
                  type="text"
                  value={garageTaxId}
                  onChange={(e) => setGarageTaxId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>

              {/* Logo Upload Section */}
              <div className="sm:col-span-2 space-y-2 pt-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">Logo</label>
                <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    <img
                      src={(garageLogoUrl && !garageLogoUrl.includes('unsplash.com')) ? garageLogoUrl : logoImg}
                      alt="Garage Logo Preview"
                      className="w-full h-full object-contain p-1"
                    />
                  </div>

                  <div className="space-y-2 flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Logo</span>
                      </button>

                      {garageLogoUrl && (
                        <button
                          type="button"
                          onClick={() => setGarageLogoUrl('')}
                          className="px-3 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-xs transition"
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                id="save-garage-info-btn"
                className="px-5 py-2.5 bg-[#FF6B00] hover:bg-[#E56000] text-white rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: INVOICE SETTINGS */}
      {activeTab === 'invoice' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-3xl">
          <form onSubmit={handleSaveInvoiceSettings} className="space-y-5">
            <h2 className="text-base font-bold text-slate-900">Invoice Settings</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Invoice Number Prefix
                </label>
                <input
                  type="text"
                  required
                  value={invPrefix}
                  onChange={(e) => setInvPrefix(e.target.value)}
                  placeholder="INV-"
                  className="w-full max-w-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#FF6B00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Payment Terms
                </label>
                <input
                  type="text"
                  required
                  value={invTerms}
                  onChange={(e) => setInvTerms(e.target.value)}
                  placeholder="Due Upon Collection"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#FF6B00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Invoice Footer / Terms Text
                </label>
                <textarea
                  rows={4}
                  value={invFooterDisclaimer}
                  onChange={(e) => setInvFooterDisclaimer(e.target.value)}
                  placeholder="Terms & Conditions text rendered on every invoice..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#FF6B00]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                id="save-invoice-settings-btn"
                className="px-5 py-2.5 bg-[#FF6B00] hover:bg-[#E56000] text-white rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: PAYMENT METHODS */}
      {activeTab === 'payments' && (
        <div className="space-y-4 max-w-3xl">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">Payment Methods</h2>

              <form onSubmit={handleAddPaymentMethod} className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Method Name"
                  value={newMethodName}
                  onChange={(e) => setNewMethodName(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#FF6B00] w-full sm:w-48"
                />
                <button
                  type="submit"
                  id="add-payment-method-btn"
                  className="px-4 py-2 bg-[#FF6B00] hover:bg-[#E56000] text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </form>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              {paymentMethods.map((method) => {
                const isCash = method.name.toLowerCase() === 'cash' || method.isDefault;
                const isActive = method.status === 'active';
                const isEditing = editingMethodId === method.id;

                return (
                  <div
                    key={method.id}
                    className="p-3.5 bg-white hover:bg-slate-50/60 transition flex items-center justify-between gap-4"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingMethodName}
                          onChange={(e) => setEditingMethodName(e.target.value)}
                          className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold w-full focus:outline-hidden focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                        />
                        <button
                          type="button"
                          onClick={() => handleSavePaymentMethodEdit(method.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingMethodId(null)}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="font-bold text-xs text-slate-900">{method.name}</div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMethodId(method.id);
                              setEditingMethodName(method.name);
                            }}
                            className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {/* Toggle Active/Inactive (Disabled for Cash) */}
                          <button
                            type="button"
                            disabled={isCash}
                            onClick={() => togglePaymentMethodStatus(method.id)}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
                              isCash
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : isActive
                                ? 'bg-slate-100 text-slate-700 hover:bg-rose-100 hover:text-rose-700'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                            title={isCash ? 'Cash cannot be deactivated' : undefined}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>{isActive ? 'Deactivate' : 'Activate'}</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TELEGRAM (READ-ONLY) */}
      {activeTab === 'telegram' && (
        <div className="space-y-4 max-w-3xl">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">Telegram</h2>

              {/* Status Indicator */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Connected</span>
              </div>
            </div>

            {/* Delivery Stats Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Sent
                </div>
                <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                  {telegramSentCount}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Failed
                </div>
                <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                  {telegramFailedCount}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg col-span-2 sm:col-span-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Bot Channel
                </div>
                <div className="text-sm font-bold text-slate-900 mt-1 font-mono">
                  @ApexGarageBot
                </div>
              </div>
            </div>

            {/* Recent Notification Logs (Read-Only) */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Recent Notification Activity
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                      <th className="py-2.5 px-4">Recipient</th>
                      <th className="py-2.5 px-4">Event Type</th>
                      <th className="py-2.5 px-4">Time</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {notificationLogs.slice(0, 8).map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-mono font-medium text-slate-900">
                          {log.telegramHandle || log.customerName}
                        </td>
                        <td className="py-2.5 px-4 text-slate-700">{log.notificationType}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-500">{log.timestamp}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              log.deliveryStatus === 'Sent'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {log.deliveryStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CATEGORIES (TWO SEPARATE TABS) */}
      {activeTab === 'categories' && (
        <div className="space-y-4 max-w-3xl">
          {/* Sub-tab Navigation */}
          <div className="flex border-b border-slate-200 gap-4">
            <button
              id="subtab-item-categories"
              onClick={() => setCategorySubTab('item')}
              className={`pb-2 text-xs font-bold border-b-2 transition ${
                categorySubTab === 'item'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Item Categories
            </button>

            <button
              id="subtab-service-categories"
              onClick={() => setCategorySubTab('service')}
              className={`pb-2 text-xs font-bold border-b-2 transition ${
                categorySubTab === 'service'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Service Categories
            </button>
          </div>

          {/* SUB-TAB 1: ITEM CATEGORIES */}
          {categorySubTab === 'item' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={itemCatSearch}
                    onChange={(e) => setItemCatSearch(e.target.value)}
                    placeholder="Search item categories..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                  />
                </div>

                {/* Add Form */}
                <form onSubmit={handleAddItemCat} className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="New Item Category"
                    value={newItemCat}
                    onChange={(e) => setNewItemCat(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] w-full sm:w-48"
                  />
                  <button
                    type="submit"
                    id="add-item-cat-btn"
                    className="px-4 py-2 bg-[#FF6B00] hover:bg-[#E56000] text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </form>
              </div>

              {/* Item Categories List */}
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {filteredItemCategories.length > 0 ? (
                  filteredItemCategories.map((cat) => (
                    <div
                      key={cat}
                      className="p-3 bg-white hover:bg-slate-50/60 transition flex items-center justify-between gap-3"
                    >
                      {editingItemCat === cat ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editingItemCatName}
                            onChange={(e) => setEditingItemCatName(e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold w-full focus:outline-hidden focus:border-[#FF6B00]"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveItemCatEdit(cat)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingItemCat(null)}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="text-xs font-bold text-slate-900">{cat}</div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingItemCat(cat);
                                setEditingItemCatName(cat);
                              }}
                              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md text-xs font-semibold flex items-center gap-1 transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItemCategory(cat)}
                              className="px-2.5 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md text-xs font-semibold transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No item categories found.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-TAB 2: SERVICE CATEGORIES */}
          {categorySubTab === 'service' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={serviceCatSearch}
                    onChange={(e) => setServiceCatSearch(e.target.value)}
                    placeholder="Search service categories..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#FF6B00]"
                  />
                </div>

                {/* Add Form */}
                <form onSubmit={handleAddServiceCat} className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="New Service Category"
                    value={newServiceCat}
                    onChange={(e) => setNewServiceCat(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#FF6B00] w-full sm:w-48"
                  />
                  <button
                    type="submit"
                    id="add-service-cat-btn"
                    className="px-4 py-2 bg-[#FF6B00] hover:bg-[#E56000] text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </form>
              </div>

              {/* Service Categories List */}
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {filteredServiceCategories.length > 0 ? (
                  filteredServiceCategories.map((cat) => (
                    <div
                      key={cat}
                      className="p-3 bg-white hover:bg-slate-50/60 transition flex items-center justify-between gap-3"
                    >
                      {editingServiceCat === cat ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editingServiceCatName}
                            onChange={(e) => setEditingServiceCatName(e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold w-full focus:outline-hidden focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveServiceCatEdit(cat)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingServiceCat(null)}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="text-xs font-bold text-slate-900">{cat}</div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingServiceCat(cat);
                                setEditingServiceCatName(cat);
                              }}
                              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md text-xs font-semibold flex items-center gap-1 transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => removeRepairCategory(cat)}
                              className="px-2.5 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md text-xs font-semibold transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No service categories found.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: PROMOTIONS & CAMPAIGNS */}
      {activeTab === 'discounts' && (
        <div className="space-y-6 max-w-5xl">
          {/* Promotions Header & List View */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">Promotions</h2>

              <button
                id="create-promotion-btn"
                type="button"
                onClick={handleOpenCreatePromotion}
                className="px-4 py-2 bg-[#FF6B00] hover:bg-[#E56000] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Promotion</span>
              </button>
            </div>

            {/* Promotions Table List View */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Value</th>
                    <th className="py-3 px-4">Date Range</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unifiedPromotions.length > 0 ? (
                    unifiedPromotions.map((promo) => {
                      const isActive = promo.status === 'active';

                      return (
                        <tr key={promo.id} className="hover:bg-slate-50/60 transition">
                          {/* Name */}
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {promo.name}
                          </td>

                          {/* Type */}
                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
                                {promo.typeLabel}
                              </span>
                              {promo.targetName && (
                                <div className="text-[11px] font-medium text-slate-500 truncate max-w-xs">
                                  {promo.targetName}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Value */}
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {promo.discountType === 'percentage'
                              ? `${promo.discountValue}%`
                              : `$${promo.discountValue.toFixed(2)}`}
                          </td>

                          {/* Date Range */}
                          <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap text-[11px]">
                            {promo.startDate} – {promo.endDate}
                          </td>

                          {/* Status Badge (Clear, Polished Badge Style) */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                                <span>Active</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                <span>Inactive</span>
                              </span>
                            )}
                          </td>

                          {/* Actions (Edit / Delete Soft-Delete Deactivate) */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1 justify-end">
                              <button
                                type="button"
                                onClick={() => handleOpenEditPromotion(promo)}
                                className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleTogglePromoStatus(promo)}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                                  isActive
                                    ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
                                    : 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{isActive ? 'Delete' : 'Activate'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                        No promotions created yet. Click "Create Promotion" above to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Discount Reasons Section */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">Discount Reasons</h2>

              <form onSubmit={handleAddDiscountReason} className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="New Reason"
                  value={newReasonText}
                  onChange={(e) => setNewReasonText(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#FF6B00] w-full sm:w-56"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FF6B00] hover:bg-[#E56000] text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </form>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              {discountReasons.map((dr, idx) => {
                const isActive = dr.status === 'active';
                return (
                  <div
                    key={dr.id}
                    className="p-3 bg-white hover:bg-slate-50/60 transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                        {dr.displayOrder}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{dr.reason}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveReason(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-slate-900 disabled:opacity-30 transition"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveReason(idx, 'down')}
                        disabled={idx === discountReasons.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-900 disabled:opacity-30 transition"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateDiscountReason(dr.id, {
                            status: isActive ? 'deactivated' : 'active',
                          });
                          showToast(`Discount reason ${isActive ? 'deactivated' : 'activated'}.`);
                        }}
                        className={`p-1 rounded-md text-xs font-bold transition ${
                          isActive
                            ? 'text-slate-400 hover:text-rose-600'
                            : 'text-slate-400 hover:text-emerald-600'
                        }`}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: ROLE PERMISSIONS (RBAC) - PURE MODULE/SCREEN ACCESS */}
      {activeTab === 'rbac' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-4xl space-y-6">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Role Permissions</h2>
              <p className="text-xs text-slate-500 mt-1">Configure access for the Advisor and Mechanic roles. Admin access remains unchanged.</p>
            </div>
          </div>

          {rbacError && (
            <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-medium">
              {rbacError}
            </div>
          )}

          <div className="space-y-4">
            {editableRoleDefs.map((roleDef) => (
              <div key={roleDef.role} className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-4 bg-slate-50/80 flex items-center justify-between border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-xs text-slate-900">{roleDef.label}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${roleDef.badge}`}>
                      {roleDef.role}
                    </span>
                  </div>
                </div>

                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {MODULE_DEFINITIONS.map((mod) => {
                    const isPermitted = rbacDraft[roleDef.role]?.includes(mod.id) ?? false;

                    return (
                      <label
                        key={`${roleDef.role}-${mod.id}`}
                        className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                          isPermitted
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isPermitted}
                          onChange={() => handleRbacToggle(roleDef.role as 'advisor' | 'mechanic', mod.id)}
                          className="w-4 h-4 accent-[#FF6B00] rounded"
                        />
                        <span>{mod.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: ACTIVITY LOG (OWNER/ADMIN) */}
      {activeTab === 'activity' && isOwnerOrAdmin && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Activity Log</h2>

            <div className="w-64">
              <input
                type="text"
                placeholder="Search audit records..."
                value={activitySearchQuery}
                onChange={(e) => setActivitySearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                  <th className="py-2.5 px-4">Event</th>
                  <th className="py-2.5 px-4">Actor</th>
                  <th className="py-2.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {repairJobs.slice(0, 10).map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-medium text-slate-900">
                      Job #{job.jobNumber}: Status updated to{' '}
                      <span className="font-bold">{job.status}</span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {job.assignedMechanicId || 'System'}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-500">
                      {job.entryDate || 'Today'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PROMOTION MODAL */}
      {activeTab === 'users' && canManageUsers && <UserManagement />}

      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                {promoStep === 2 && !editingPromoId && (
                  <button
                    type="button"
                    onClick={() => setPromoStep(1)}
                    className="p-1 hover:bg-slate-200 rounded-md text-slate-600 transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <h3 className="text-base font-bold text-slate-900">
                  {editingPromoId
                    ? 'Edit Promotion'
                    : promoStep === 1
                    ? 'Select Promotion Type'
                    : 'Create Promotion'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPromoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: PICK PROMOTION TYPE */}
            {promoStep === 1 && !editingPromoId && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Whole Order Campaign Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setPromoSourceType('campaign');
                      setPromoStep(2);
                    }}
                    className="p-5 border-2 border-slate-200 hover:border-[#FF6B00] hover:bg-[#FFF1E8]/30 rounded-xl text-left transition group flex flex-col justify-between space-y-3 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-[#FF6B00] group-hover:text-white text-slate-800 flex items-center justify-center transition">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">Whole Order Campaign</div>
                    </div>
                  </button>

                  {/* Item / Service Discount Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setPromoSourceType('item_service');
                      setPromoStep(2);
                    }}
                    className="p-5 border-2 border-slate-200 hover:border-[#FF6B00] hover:bg-[#FFF1E8]/30 rounded-xl text-left transition group flex flex-col justify-between space-y-3 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-[#FF6B00] group-hover:text-white text-slate-800 flex items-center justify-center transition">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">Item / Service Discount</div>
                    </div>
                  </button>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsPromoModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: TYPE-SPECIFIC FIELDS FORM */}
            {(promoStep === 2 || editingPromoId) && (
              <form onSubmit={handleSavePromotion} className="p-6 space-y-4">
                {/* Type Indicator Pill */}
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Type:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FF6B00] text-white">
                    {promoSourceType === 'campaign' ? 'Whole Order Campaign' : 'Item / Service Discount'}
                  </span>
                </div>

                {/* Field: Promotion Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Promotion Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      promoSourceType === 'campaign'
                        ? 'e.g. Grand Opening 10% Off'
                        : 'e.g. Brake Pad Maintenance Promo'
                    }
                    value={promoName}
                    onChange={(e) => setPromoName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#FF6B00]"
                  />
                </div>

                {/* TARGET FIELDS (FOR ITEM / SERVICE DISCOUNTS ONLY) */}
                {promoSourceType === 'item_service' && (
                  <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Target Level
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPromoTargetType('item');
                            setPromoTargetId(inventory[0]?.id || '');
                          }}
                          className={`py-1.5 text-xs font-bold rounded-md border transition cursor-pointer ${
                            promoTargetType === 'item'
                              ? 'bg-[#FF6B00] text-white border-[#FF6B00]'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Part Item
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPromoTargetType('service');
                            setPromoTargetId(services[0]?.id || '');
                          }}
                          className={`py-1.5 text-xs font-bold rounded-md border transition cursor-pointer ${
                            promoTargetType === 'service'
                              ? 'bg-[#FF6B00] text-white border-[#FF6B00]'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Service Labor
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPromoTargetType('category');
                            setPromoTargetId(systemSettings.itemCategories[0] || '');
                          }}
                          className={`py-1.5 text-xs font-bold rounded-md border transition cursor-pointer ${
                            promoTargetType === 'category'
                              ? 'bg-[#FF6B00] text-white border-[#FF6B00]'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Category
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        {promoTargetType === 'item'
                          ? 'Select Part'
                          : promoTargetType === 'service'
                          ? 'Select Service'
                          : 'Select Category'}
                      </label>
                      <select
                        value={promoTargetId}
                        onChange={(e) => setPromoTargetId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#FF6B00]"
                      >
                        {promoTargetType === 'item' &&
                          inventory.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              {inv.name} {inv.sku ? `(${inv.sku})` : ''} - ${(inv.sellingPrice ?? inv.unitPrice ?? 0).toFixed(2)}
                            </option>
                          ))}

                        {promoTargetType === 'service' &&
                          services.map((srv) => (
                            <option key={srv.id} value={srv.id}>
                              {srv.name} - ${srv.basePrice.toFixed(2)}
                            </option>
                          ))}

                        {promoTargetType === 'category' &&
                          Array.from(
                            new Set([...systemSettings.itemCategories, ...systemSettings.repairCategories])
                          ).map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Field: Value & Discount Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Discount Value
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={promoDiscountValue}
                        onChange={(e) =>
                          setPromoDiscountValue(e.target.value === '' ? '' : parseFloat(e.target.value))
                        }
                        className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold font-mono focus:outline-hidden focus:border-[#FF6B00]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                        {promoDiscountType === 'percentage' ? '%' : '$'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Value Type
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 h-[38px] p-1 bg-slate-100 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setPromoDiscountType('percentage')}
                        className={`text-xs font-bold rounded flex items-center justify-center gap-1 transition cursor-pointer ${
                          promoDiscountType === 'percentage'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Percent className="w-3.5 h-3.5" />
                        <span>%</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPromoDiscountType('fixed')}
                        className={`text-xs font-bold rounded flex items-center justify-center gap-1 transition cursor-pointer ${
                          promoDiscountType === 'fixed'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>$ Fixed</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Field: Start Date & End Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={promoStartDate}
                      onChange={(e) => setPromoStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#FF6B00]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      required
                      value={promoEndDate}
                      onChange={(e) => setPromoEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#FF6B00]"
                    />
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPromoModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#FF6B00] hover:bg-[#E56000] text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingPromoId ? 'Update Promotion' : 'Save Promotion'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
