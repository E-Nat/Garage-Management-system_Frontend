import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Customer,
  Vehicle,
  VehicleChangeLog,
  RepairJob,
  InspectionRecord,
  Invoice,
  InventoryItem,
  StockTransaction,
  Warranty,
  RolePermissionsMap,
  RoleDiscountPermissionsMap,
  RoleDiscountPermission,
  UserRole,
  ModulePermissionId,
  MechanicAssignmentHistory,
  RepairStatusHistory,
  UsedPart,
  PerformedService,
  PaymentRecord,
  PaymentMethodConfig,
  DiscountReason,
  ItemServiceDiscount,
  DiscountCampaign,
  GarageService,
  SystemSettings,
  GarageInfoSettings,
  InvoiceSettings,
  TelegramBotSettings,
  EstimateRevisionHistory,
  NotificationLog,
  EmbeddedRepair,
  AppNotification,
} from '../types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_VEHICLES,
  INITIAL_VEHICLE_CHANGE_LOGS,
  INITIAL_REPAIR_JOBS,
  INITIAL_INVOICES,
  INITIAL_INVENTORY,
  INITIAL_WARRANTIES,
  DEFAULT_ROLE_PERMISSIONS,
  DEFAULT_ROLE_DISCOUNT_PERMISSIONS,
  INITIAL_PAYMENT_RECORDS,
  INITIAL_PAYMENT_METHODS,
  INITIAL_DISCOUNT_REASONS,
  INITIAL_ITEM_DISCOUNTS,
  INITIAL_DISCOUNT_CAMPAIGNS,
  INITIAL_SERVICES,
  INITIAL_SYSTEM_SETTINGS,
  INITIAL_ESTIMATE_REVISIONS,
  INITIAL_NOTIFICATION_LOGS,
  INITIAL_REPAIR_STATUS_HISTORY,
  INITIAL_APP_NOTIFICATIONS,
} from '../data/mockData';
import { useAuth } from './AuthContext';
import {
  getCustomers,
  createCustomer as createCustomerApi,
  updateCustomer as updateCustomerApi,
  deleteCustomer as deleteCustomerApi,
  restoreCustomer as restoreCustomerApi,
  getNotificationsApi,
  getUnreadNotificationsCountApi,
  markNotificationAsReadApi,
  markAllNotificationsAsReadApi,
  linkTelegramCustomer as linkTelegramCustomerApi,
  unlinkTelegramCustomer as unlinkTelegramCustomerApi,
} from '../services/api';

function mapBackendCustomerToCustomer(c: any): Customer {
  const rawEmail = c.email || c.user_account?.email || null;
  const isRealEmail = Boolean(rawEmail && !String(rawEmail).endsWith('@portal.apexgarage.local') && !String(rawEmail).includes('@apexgarage.com'));
  const hasTg = Boolean(c.telegram_linked ?? c.telegramLinked);

  return {
    id: c.id ? (typeof c.id === 'number' ? `CUST-${c.id}` : String(c.id)) : `CUST-${Date.now()}`,
    fullName: c.full_name || c.fullName || '',
    phone: c.phone_number || c.phone || '',
    email: isRealEmail ? rawEmail : null,
    has_email: isRealEmail,
    has_telegram: hasTg,
    recovery_methods: c.recovery_methods || (isRealEmail && hasTg ? ['email', 'telegram'] : isRealEmail ? ['email'] : hasTg ? ['telegram'] : []),
    address: c.address || '',
    telegramChatId: c.telegram_chat_id || c.telegramChatId || undefined,
    telegramChatIdMasked: c.telegram_chat_id_masked || c.telegramChatIdMasked || undefined,
    telegramHandle: c.telegram_handle || c.telegramHandle || undefined,
    telegramLinked: hasTg,
    telegramConnectedAt: c.telegram_connected_at || c.telegramConnectedAt || undefined,
    isDeactivated: Boolean(c.is_deactivated ?? (c.deleted_at != null) ?? (c.status === 'deactivated')),
    status: (c.is_deactivated || c.deleted_at != null || c.status === 'deactivated') ? 'deactivated' : 'active',
    userAccount: c.user_account ? {
      id: c.user_account.id,
      email: isRealEmail ? rawEmail : null,
      name: c.user_account.name,
      status: c.user_account.status,
      is_password_protected: true,
    } : null,
    deletedAt: c.deleted_at || c.deletedAt || null,
    createdAt: c.created_at || c.createdAt || new Date().toISOString(),
    updatedAt: c.updated_at || c.updatedAt || undefined,
  };
}

function mapBackendNotificationToAppNotification(n: any): AppNotification {
  const rawCustId = n.customer_id ?? n.customerId ?? n.data?.customer_id ?? n.data?.customerId;
  return {
    id: n.id,
    userId: n.user_id ?? n.userId,
    type: n.type || 'telegram_connected',
    title: n.title || 'Telegram Connected',
    message: n.message || '',
    customerId: rawCustId ? (typeof rawCustId === 'number' ? `CUST-${rawCustId}` : String(rawCustId)) : undefined,
    customerName: n.customer_name ?? n.customerName ?? n.data?.customer_name ?? n.data?.customerName ?? undefined,
    customerPhone: n.customer_phone ?? n.customerPhone ?? n.data?.customer_phone ?? n.data?.customerPhone ?? n.data?.phone ?? undefined,
    telegramUsername: n.telegram_username ?? n.telegramUsername ?? n.data?.telegram_username ?? n.data?.telegramUsername ?? n.data?.telegram_handle ?? undefined,
    actionUrl: n.action_url ?? n.actionUrl ?? 'customers',
    data: n.data || {},
    readAt: n.read_at ?? n.readAt ?? null,
    isRead: Boolean(n.is_read ?? n.isRead ?? n.read ?? (n.read_at != null) ?? (n.readAt != null)),
    createdAt: n.created_at ?? n.createdAt ?? new Date().toISOString(),
    updatedAt: n.updated_at ?? n.updatedAt ?? undefined,
  };
}

interface GarageContextType {
  customers: Customer[];
  vehicles: Vehicle[];
  vehicleChangeLogs: VehicleChangeLog[];
  repairJobs: RepairJob[];
  repairStatusHistory: RepairStatusHistory[];
  invoices: Invoice[];
  inventory: InventoryItem[];
  stockTransactions: StockTransaction[];
  warranties: Warranty[];
  rolePermissions: RolePermissionsMap;
  roleDiscountPermissions: RoleDiscountPermissionsMap;
  paymentRecords: PaymentRecord[];
  paymentMethods: PaymentMethodConfig[];
  discountReasons: DiscountReason[];
  itemDiscounts: ItemServiceDiscount[];
  discountCampaigns: DiscountCampaign[];
  systemSettings: SystemSettings;
  estimateRevisions: EstimateRevisionHistory[];
  notificationLogs: NotificationLog[];
  appNotifications: AppNotification[];
  unreadNotificationsCount: number;
  targetCustomerId: string | null;
  services: GarageService[];

  // Notification Actions
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string | number) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  createTelegramConnectedNotification: (customer: Customer, handle?: string) => Promise<void>;
  linkCustomerTelegram: (customerId: string | number, telegramHandle?: string, telegramChatId?: string) => Promise<{ success: boolean; customer?: Customer; error?: string }>;
  unlinkCustomerTelegram: (customerId: string | number) => Promise<{ success: boolean; customer?: Customer; error?: string }>;
  setTargetCustomerId: (id: string | null) => void;
  navigateToCustomer: (customerId: string | number) => void;

  // System Settings Actions
  updateGarageInfoSettings: (updates: Partial<GarageInfoSettings>) => void;
  updateInvoiceSettings: (updates: Partial<InvoiceSettings>) => void;
  updateTelegramBotSettings: (updates: Partial<TelegramBotSettings>) => void;
  addItemCategory: (category: string) => { success: boolean; error?: string };
  updateItemCategory: (oldCategory: string, newCategory: string) => { success: boolean; error?: string };
  removeItemCategory: (category: string) => void;
  addRepairCategory: (category: string) => { success: boolean; error?: string };
  updateRepairCategory: (oldCategory: string, newCategory: string) => { success: boolean; error?: string };
  removeRepairCategory: (category: string) => void;
  addWarrantyPeriodOption: (option: string) => { success: boolean; error?: string };
  removeWarrantyPeriodOption: (option: string) => void;

  // History Actions
  reviseEstimate: (
    jobId: string,
    newEstimate: number,
    reason: string,
    changedBy: string,
    reApprovalRequired: boolean,
    reApprovalObtained: boolean
  ) => { success: boolean; error?: string };
  logNotification: (logData: Omit<NotificationLog, 'id' | 'timestamp'>) => void;

  // Customer Actions
  fetchCustomers: () => Promise<void>;
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'telegramLinked'>) => {
    success: boolean;
    customer?: Customer;
    error?: string;
  };
  updateCustomer: (
    id: string,
    updates: Partial<Omit<Customer, 'id' | 'createdAt'>>
  ) => { success: boolean; error?: string };
  deactivateCustomer: (id: string, actorName?: string) => Promise<{ success: boolean; error?: string }>;
  restoreCustomer: (id: string, actorName?: string) => Promise<{ success: boolean; error?: string }>;

  // Vehicle Actions
  addVehicle: (data: Omit<Vehicle, 'id' | 'createdAt'>) => {
    success: boolean;
    vehicle?: Vehicle;
    error?: string;
  };
  updateVehicle: (
    id: string,
    updates: Partial<Omit<Vehicle, 'id' | 'createdAt'>>,
    changedByName: string
  ) => { success: boolean; error?: string };

  // Repair Job Actions
  addRepairJob: (data: Omit<RepairJob, 'id' | 'jobNumber' | 'entryDate'>) => {
    success: boolean;
    job?: RepairJob;
    error?: string;
  };
  createRepairJob: (params: {
    customerId: string;
    customerName: string;
    customerPhone: string;
    vehicleId: string;
    vehicleMake: string;
    vehicleModel: string;
    licensePlate: string;
    receivedDate?: string;
    customerComplaint: string;
    inspectionFee?: number;
    manualMechanicId?: string;
    manualMechanicName?: string;
    createdByName?: string;
    estimatedCost?: number;
  }) => { success: boolean; job?: RepairJob; error?: string };
  getLeastLoadedMechanic: () => { id: string; name: string } | null;
  reassignMechanic: (
    jobId: string,
    newMechanicId: string,
    newMechanicName: string,
    changedBy: string,
    reason: string
  ) => { success: boolean; error?: string };
  updateRepairJobStatus: (
    jobId: string,
    status: RepairJob['status'],
    changedBy?: string,
    note?: string
  ) => void;
  updateRepairJobDetails: (
    jobId: string,
    updates: Partial<RepairJob>,
    changedBy?: string
  ) => void;
  addInspectionRecord: (
    jobId: string,
    record: Omit<InspectionRecord, 'id' | 'recordedAt'>
  ) => void;
  addPartsToJob: (
    jobId: string,
    parts: UsedPart[],
    laborHours?: number,
    laborCost?: number,
    recordedBy?: string
  ) => void;
  addEmbeddedRepair: (
    jobId: string,
    repair: {
      inspectionFindings: string;
      recommendedRepair: string;
      estimatedCost: number;
      notes?: string;
    },
    recordedBy?: string
  ) => { success: boolean; repair?: any };
  updateEmbeddedRepairStatus: (
    jobId: string,
    repairId: string,
    status: 'approved' | 'declined',
    changedBy?: string
  ) => void;
  addCustomerProvidedPartToJob: (
    jobId: string,
    partData: {
      partName: string;
      quantity: number;
      brand?: string;
      partNumber?: string;
      condition?: string;
      notes?: string;
    },
    recordedBy?: string
  ) => { success: boolean; part?: any; refCode?: string };

  // Payment & Discount Actions
  recordPayment: (data: {
    repairJobId: string;
    invoiceId?: string;
    amount: number;
    date: string;
    method: string;
    type: 'deposit' | 'partial' | 'final';
    notes?: string;
    recordedBy?: string;
  }) => { success: boolean; paymentRecord?: PaymentRecord; error?: string };

  simulatePayment: (invoiceId: string) => Promise<{ success: boolean; telegramConnected?: boolean; message?: string; error?: string }>;

  addPaymentMethod: (name: string) => { success: boolean; method?: PaymentMethodConfig; error?: string };
  updatePaymentMethod: (id: string, name: string) => { success: boolean; error?: string };
  togglePaymentMethodStatus: (id: string) => void;

  addDiscountReason: (reason: string) => { success: boolean; reasonItem?: DiscountReason; error?: string };
  updateDiscountReason: (id: string, updates: Partial<DiscountReason>) => void;
  reorderDiscountReasons: (reordered: DiscountReason[]) => void;

  addItemDiscount: (discount: Omit<ItemServiceDiscount, 'id'>) => { success: boolean; discountItem?: ItemServiceDiscount; error?: string };
  updateItemDiscount: (id: string, updates: Partial<ItemServiceDiscount>) => void;

  addDiscountCampaign: (campaign: Omit<DiscountCampaign, 'id'>) => { success: boolean; campaignItem?: DiscountCampaign; error?: string };
  updateDiscountCampaign: (id: string, updates: Partial<DiscountCampaign>) => void;

  updateInvoiceDiscounts: (params: {
    invoiceId: string;
    manualDiscountType?: 'fixed' | 'percentage';
    manualDiscountValue?: number;
    manualDiscountReason?: string;
    campaignId?: string;
    lineItemDiscount?: {
      targetType: 'service' | 'part';
      targetIndex: number;
      discountType: 'fixed' | 'percentage';
      discountValue: number;
      discountReason: string;
    };
  }) => { success: boolean; invoice?: Invoice; error?: string };

  // Invoice Actions
  createInvoiceFromJob: (
    jobId: string,
    tax?: number,
    manualDiscountVal?: number,
    manualDiscountType?: 'fixed' | 'percentage',
    manualDiscountReason?: string,
    campaignId?: string
  ) => { success: boolean; invoice?: Invoice; error?: string };
  updateInvoiceStatus: (
    invoiceId: string,
    status: Invoice['status'],
    paymentMethod?: string
  ) => void;

  // Warranty Actions
  assignWarranty: (data: Omit<Warranty, 'id' | 'createdAt'>) => {
    success: boolean;
    warranty?: Warranty;
    error?: string;
  };
  updateWarranty: (id: string, updates: Partial<Warranty>) => void;

  // Inventory & Stock Actions
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => {
    success: boolean;
    item?: InventoryItem;
    error?: string;
  };
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  adjustStockQuantity: (
    partId: string,
    qtyDelta: number,
    type: 'stock_in' | 'adjustment' | 'usage',
    reason: string,
    performedBy: string,
    supplier?: string
  ) => { success: boolean; error?: string };

  // Role Permissions Configuration Actions (Owner feature)
  updateRolePermissions: (role: UserRole, permissions: ModulePermissionId[]) => void;
  toggleRolePermission: (role: UserRole, permission: ModulePermissionId) => void;
  updateRoleDiscountPermission: (role: string, canApply: boolean, maxPercent: number) => void;
  resetRolePermissions: () => void;
}

const GarageContext = createContext<GarageContextType | undefined>(undefined);

const KEYS = {
  CUSTOMERS: 'apex_garage_customers',
  VEHICLES: 'apex_garage_vehicles',
  CHANGE_LOGS: 'apex_garage_vehicle_change_logs',
  REPAIR_JOBS: 'apex_garage_repair_jobs',
  REPAIR_STATUS_HISTORY: 'apex_garage_repair_status_history',
  INVOICES: 'apex_garage_invoices',
  INVENTORY: 'apex_garage_inventory',
  STOCK_TX: 'apex_garage_stock_transactions',
  WARRANTIES: 'apex_garage_warranties',
  PERMISSIONS: 'apex_garage_role_permissions',
  ROLE_DISCOUNTS: 'apex_garage_role_discounts',
  PAYMENT_RECORDS: 'apex_garage_payment_records',
  PAYMENT_METHODS: 'apex_garage_payment_methods',
  DISCOUNT_REASONS: 'apex_garage_discount_reasons',
  ITEM_DISCOUNTS: 'apex_garage_item_discounts',
  DISCOUNT_CAMPAIGNS: 'apex_garage_discount_campaigns',
  SYSTEM_SETTINGS: 'apex_garage_system_settings',
  ESTIMATE_REVISIONS: 'apex_garage_estimate_revisions',
  NOTIFICATION_LOGS: 'apex_garage_notification_logs',
  APP_NOTIFICATIONS: 'apex_garage_app_notifications',
};

export const GarageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, users, addAuditLog, setActiveTab } = useAuth();

  const [appNotifications, setAppNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(KEYS.APP_NOTIFICATIONS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out legacy mock/demo notifications
          return parsed.filter(
            (n: any) =>
              n.id !== 'notif-app-1' &&
              n.id !== 'notif-app-2' &&
              !(n.type === 'telegram_connected' && n.customerName === 'Alex Sterling' && String(n.id).startsWith('notif-app'))
          );
        }
      } catch {
        // ignore
      }
    }
    return INITIAL_APP_NOTIFICATIONS;
  });
  const [targetCustomerId, setTargetCustomerId] = useState<string | null>(null);

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(KEYS.CUSTOMERS);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem(KEYS.VEHICLES);
    return saved ? JSON.parse(saved) : INITIAL_VEHICLES;
  });

  const [vehicleChangeLogs, setVehicleChangeLogs] = useState<VehicleChangeLog[]>(() => {
    const saved = localStorage.getItem(KEYS.CHANGE_LOGS);
    return saved ? JSON.parse(saved) : INITIAL_VEHICLE_CHANGE_LOGS;
  });

  const [repairJobs, setRepairJobs] = useState<RepairJob[]>(() => {
    const saved = localStorage.getItem(KEYS.REPAIR_JOBS);
    return saved ? JSON.parse(saved) : INITIAL_REPAIR_JOBS;
  });

  const [repairStatusHistory, setRepairStatusHistory] = useState<RepairStatusHistory[]>(() => {
    const saved = localStorage.getItem(KEYS.REPAIR_STATUS_HISTORY);
    return saved ? JSON.parse(saved) : INITIAL_REPAIR_STATUS_HISTORY;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(KEYS.INVOICES);
    if (!saved) return INITIAL_INVOICES;
    try {
      const parsed: Invoice[] = JSON.parse(saved);
      const seen = new Set<string>();
      const unique: Invoice[] = [];
      for (const inv of parsed) {
        if (inv && inv.id && !seen.has(inv.id)) {
          seen.add(inv.id);
          unique.push(inv);
        }
      }
      return unique.length > 0 ? unique : INITIAL_INVOICES;
    } catch {
      return INITIAL_INVOICES;
    }
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem(KEYS.INVENTORY);
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>(() => {
    const saved = localStorage.getItem(KEYS.STOCK_TX);
    if (!saved) return [];
    try {
      const parsed: StockTransaction[] = JSON.parse(saved);
      const seen = new Set<string>();
      return parsed.map((st, idx) => {
        if (!st.id || seen.has(st.id)) {
          const uniqueId = `stx-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
          return { ...st, id: uniqueId };
        }
        seen.add(st.id);
        return st;
      });
    } catch {
      return [];
    }
  });

  const [warranties, setWarranties] = useState<Warranty[]>(() => {
    const saved = localStorage.getItem(KEYS.WARRANTIES);
    return saved ? JSON.parse(saved) : INITIAL_WARRANTIES;
  });

  const [rolePermissions, setRolePermissions] = useState<RolePermissionsMap>(() => {
    const saved = localStorage.getItem(KEYS.PERMISSIONS);
    return saved ? JSON.parse(saved) : DEFAULT_ROLE_PERMISSIONS;
  });

  const [roleDiscountPermissions, setRoleDiscountPermissions] = useState<RoleDiscountPermissionsMap>(() => {
    const saved = localStorage.getItem(KEYS.ROLE_DISCOUNTS);
    return saved ? JSON.parse(saved) : DEFAULT_ROLE_DISCOUNT_PERMISSIONS;
  });

  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem(KEYS.PAYMENT_RECORDS);
    return saved ? JSON.parse(saved) : INITIAL_PAYMENT_RECORDS;
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>(() => {
    const saved = localStorage.getItem(KEYS.PAYMENT_METHODS);
    return saved ? JSON.parse(saved) : INITIAL_PAYMENT_METHODS;
  });

  const [discountReasons, setDiscountReasons] = useState<DiscountReason[]>(() => {
    const saved = localStorage.getItem(KEYS.DISCOUNT_REASONS);
    return saved ? JSON.parse(saved) : INITIAL_DISCOUNT_REASONS;
  });

  const [itemDiscounts, setItemDiscounts] = useState<ItemServiceDiscount[]>(() => {
    const saved = localStorage.getItem(KEYS.ITEM_DISCOUNTS);
    return saved ? JSON.parse(saved) : INITIAL_ITEM_DISCOUNTS;
  });

  const [discountCampaigns, setDiscountCampaigns] = useState<DiscountCampaign[]>(() => {
    const saved = localStorage.getItem(KEYS.DISCOUNT_CAMPAIGNS);
    return saved ? JSON.parse(saved) : INITIAL_DISCOUNT_CAMPAIGNS;
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem(KEYS.SYSTEM_SETTINGS);
    return saved ? JSON.parse(saved) : INITIAL_SYSTEM_SETTINGS;
  });

  const [estimateRevisions, setEstimateRevisions] = useState<EstimateRevisionHistory[]>(() => {
    const saved = localStorage.getItem(KEYS.ESTIMATE_REVISIONS);
    return saved ? JSON.parse(saved) : INITIAL_ESTIMATE_REVISIONS;
  });

  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(() => {
    const saved = localStorage.getItem(KEYS.NOTIFICATION_LOGS);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATION_LOGS;
  });

  const [services] = useState<GarageService[]>(INITIAL_SERVICES);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(KEYS.VEHICLES, JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem(KEYS.CHANGE_LOGS, JSON.stringify(vehicleChangeLogs));
  }, [vehicleChangeLogs]);

  useEffect(() => {
    localStorage.setItem(KEYS.REPAIR_JOBS, JSON.stringify(repairJobs));
  }, [repairJobs]);

  useEffect(() => {
    localStorage.setItem(KEYS.REPAIR_STATUS_HISTORY, JSON.stringify(repairStatusHistory));
  }, [repairStatusHistory]);

  useEffect(() => {
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(KEYS.STOCK_TX, JSON.stringify(stockTransactions));
  }, [stockTransactions]);

  useEffect(() => {
    localStorage.setItem(KEYS.WARRANTIES, JSON.stringify(warranties));
  }, [warranties]);

  useEffect(() => {
    localStorage.setItem(KEYS.PERMISSIONS, JSON.stringify(rolePermissions));
  }, [rolePermissions]);

  useEffect(() => {
    localStorage.setItem(KEYS.ROLE_DISCOUNTS, JSON.stringify(roleDiscountPermissions));
  }, [roleDiscountPermissions]);

  useEffect(() => {
    localStorage.setItem(KEYS.PAYMENT_RECORDS, JSON.stringify(paymentRecords));
  }, [paymentRecords]);

  useEffect(() => {
    localStorage.setItem(KEYS.PAYMENT_METHODS, JSON.stringify(paymentMethods));
  }, [paymentMethods]);

  useEffect(() => {
    localStorage.setItem(KEYS.DISCOUNT_REASONS, JSON.stringify(discountReasons));
  }, [discountReasons]);

  useEffect(() => {
    localStorage.setItem(KEYS.ITEM_DISCOUNTS, JSON.stringify(itemDiscounts));
  }, [itemDiscounts]);

  useEffect(() => {
    localStorage.setItem(KEYS.DISCOUNT_CAMPAIGNS, JSON.stringify(discountCampaigns));
  }, [discountCampaigns]);

  useEffect(() => {
    localStorage.setItem(KEYS.SYSTEM_SETTINGS, JSON.stringify(systemSettings));
  }, [systemSettings]);

  useEffect(() => {
    localStorage.setItem(KEYS.ESTIMATE_REVISIONS, JSON.stringify(estimateRevisions));
  }, [estimateRevisions]);

  useEffect(() => {
    localStorage.setItem(KEYS.NOTIFICATION_LOGS, JSON.stringify(notificationLogs));
  }, [notificationLogs]);

  useEffect(() => {
    localStorage.setItem(KEYS.APP_NOTIFICATIONS, JSON.stringify(appNotifications));
  }, [appNotifications]);

  // Role-filtered notifications for RBAC compliance
  const userNotifications = useMemo(() => {
    if (!currentUser) return [];
    if (['admin', 'owner', 'advisor', 'staff'].includes(currentUser.role)) {
      return appNotifications;
    }
    if (currentUser.role === 'customer') {
      return appNotifications.filter(
        (n) =>
          String(n.userId) === String(currentUser.id) ||
          (n.customerId && String(n.customerId).replace(/\D/g, '') === String(currentUser.id).replace(/\D/g, '')) ||
          (n.customerPhone && currentUser.phone && n.customerPhone.replace(/\D/g, '') === currentUser.phone.replace(/\D/g, ''))
      );
    }
    return appNotifications.filter((n) => String(n.userId) === String(currentUser.id));
  }, [appNotifications, currentUser]);

  const unreadNotificationsCount = useMemo(() => {
    return userNotifications.filter((n) => !n.isRead).length;
  }, [userNotifications]);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await getCustomers({ status: 'all' });
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map(mapBackendCustomerToCustomer);
        setCustomers((prev) => {
          const idMap = new Map<string, Customer>();
          mapped.forEach((c) => idMap.set(c.id, c));
          prev.forEach((c) => {
            if (!idMap.has(c.id)) {
              idMap.set(c.id, c);
            }
          });
          return Array.from(idMap.values());
        });
      }
    } catch (err) {
      console.warn('Could not fetch customers from API:', err);
    }
  }, []);

  const createTelegramConnectedNotification = useCallback(async (customer: Customer, handle?: string) => {
    if (!customer || !customer.id) return;
    const rawHandle = handle || customer.telegramHandle;
    const cleanHandle = rawHandle ? (rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`) : undefined;
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: 'telegram_connected',
      title: 'Telegram Connected',
      message: `${customer.fullName} has connected their Telegram account.`,
      customerId: customer.id,
      customerName: customer.fullName,
      customerPhone: customer.phone,
      telegramUsername: cleanHandle,
      actionUrl: 'customers',
      data: {
        customerId: customer.id,
        customerName: customer.fullName,
        customerPhone: customer.phone,
        telegramUsername: cleanHandle,
        route: 'customer_details',
      },
      isRead: false,
      readAt: null,
      createdAt: new Date().toISOString(),
    };

    setAppNotifications((prev) => {
      // Prevent duplicate notification for the same customer
      const isDuplicate = prev.some(
        (n) =>
          n.type === 'telegram_connected' &&
          (n.customerId === customer.id || (n.customerPhone && customer.phone && n.customerPhone === customer.phone))
      );
      if (isDuplicate) return prev;
      return [newNotif, ...prev];
    });
  }, []);

  const linkCustomerTelegram = useCallback(async (
    customerId: string | number,
    telegramHandle?: string,
    telegramChatId?: string
  ): Promise<{ success: boolean; customer?: Customer; error?: string }> => {
    const formattedId = typeof customerId === 'number' ? `CUST-${customerId}` : String(customerId);
    const cleanHandle = telegramHandle ? (telegramHandle.startsWith('@') ? telegramHandle : `@${telegramHandle}`) : undefined;
    const cleanChatId = telegramChatId || (cleanHandle ? `tg-${Date.now()}` : undefined);

    let updatedTarget: Customer | undefined;
    let wasAlreadyLinked = false;

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === formattedId || c.id === String(customerId) || (typeof customerId === 'string' && c.id.replace(/\D/g, '') === customerId.replace(/\D/g, ''))) {
          wasAlreadyLinked = Boolean(c.telegramLinked && (!cleanHandle || c.telegramHandle === cleanHandle));
          const updated: Customer = {
            ...c,
            telegramLinked: true,
            telegramConnectedAt: c.telegramConnectedAt || new Date().toISOString(),
            telegramHandle: cleanHandle || c.telegramHandle,
            telegramChatId: cleanChatId || c.telegramChatId || `98765${Date.now().toString().slice(-4)}`,
            has_telegram: true,
            recovery_methods: Array.from(new Set([...(c.recovery_methods || []), 'telegram'])),
          };
          updatedTarget = updated;
          return updated;
        }
        return c;
      })
    );

    if (updatedTarget) {
      if (!wasAlreadyLinked) {
        await createTelegramConnectedNotification(updatedTarget, cleanHandle);
      }

      try {
        const numericId = typeof customerId === 'string' ? parseInt(customerId.replace(/\D/g, ''), 10) || customerId : customerId;
        await linkTelegramCustomerApi(numericId, {
          telegram_chat_id: cleanChatId || (updatedTarget as Customer).telegramChatId,
          telegram_handle: cleanHandle || (updatedTarget as Customer).telegramHandle,
        });
      } catch (err) {
        console.warn('API linkTelegramCustomer failed (saved locally):', err);
      }

      addAuditLog(
        'Telegram Linked',
        'Telegram',
        (updatedTarget as Customer).id,
        `Customer ${(updatedTarget as Customer).fullName} paired with Telegram (${cleanHandle || (updatedTarget as Customer).telegramChatId})`,
        undefined,
        cleanHandle
      );

      return { success: true, customer: updatedTarget };
    }

    return { success: false, error: 'Customer not found.' };
  }, [createTelegramConnectedNotification, addAuditLog]);

  const unlinkCustomerTelegram = useCallback(async (
    customerId: string | number
  ): Promise<{ success: boolean; customer?: Customer; error?: string }> => {
    const formattedId = typeof customerId === 'number' ? `CUST-${customerId}` : String(customerId);
    let targetCustomer: Customer | undefined;

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === formattedId || c.id === String(customerId) || (typeof customerId === 'string' && c.id.replace(/\D/g, '') === customerId.replace(/\D/g, ''))) {
          const updated: Customer = {
            ...c,
            telegramLinked: false,
            telegramConnectedAt: undefined,
            telegramHandle: undefined,
            telegramChatId: undefined,
            telegramChatIdMasked: undefined,
            has_telegram: false,
            recovery_methods: (c.recovery_methods || []).filter((m) => m !== 'telegram'),
          };
          targetCustomer = updated;
          return updated;
        }
        return c;
      })
    );

    if (targetCustomer) {
      try {
        const numericId = typeof customerId === 'string' ? parseInt(customerId.replace(/\D/g, ''), 10) || customerId : customerId;
        await unlinkTelegramCustomerApi(numericId);
      } catch (err) {
        console.warn('API unlinkTelegramCustomer failed:', err);
      }

      addAuditLog(
        'Telegram Unlinked',
        'Telegram',
        targetCustomer.id,
        `Unlinked customer ${targetCustomer.fullName} from Telegram`
      );

      return { success: true, customer: targetCustomer };
    }

    return { success: false, error: 'Customer not found.' };
  }, [addAuditLog]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await getNotificationsApi({ limit: 30 });
      if (res && res.data && Array.isArray(res.data)) {
        const mapped = res.data.map(mapBackendNotificationToAppNotification);
        setAppNotifications(mapped);
      }
    } catch (err) {
      // Ignore API errors when unauthenticated or offline
    }
  }, []);

  const markNotificationAsRead = useCallback(async (id: string | number) => {
    setAppNotifications((prev) =>
      prev.map((n) => (String(n.id) === String(id) ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
    );

    try {
      await markNotificationAsReadApi(id);
    } catch (err) {
      console.warn('Failed to mark notification as read via API:', err);
    }
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    setAppNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
    );

    try {
      await markAllNotificationsAsReadApi();
    } catch (err) {
      console.warn('Failed to mark all notifications as read via API:', err);
    }
  }, []);

  const navigateToCustomer = useCallback((customerId: string | number) => {
    const formattedId = typeof customerId === 'number' ? `CUST-${customerId}` : String(customerId);
    setTargetCustomerId(formattedId);
    setActiveTab('customers');
  }, [setActiveTab]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000);

    const handleFocus = () => {
      fetchNotifications();
      fetchCustomers();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchNotifications, fetchCustomers]);

  // Customer Management logic
  const deactivateCustomer = async (id: string, actorName?: string): Promise<{ success: boolean; error?: string }> => {
    const customer = customers.find((c) => c.id === id);
    if (!customer) return { success: false, error: 'Customer not found.' };

    try {
      const numericId = typeof id === 'string' ? parseInt(id.replace(/\D/g, ''), 10) || id : id;
      await deleteCustomerApi(numericId);
    } catch (err: any) {
      console.warn('API customer deactivation failed:', err);
    }

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              isDeactivated: true,
              status: 'deactivated',
              deletedAt: new Date().toISOString(),
            }
          : c
      )
    );

    addAuditLog(
      'Customer Deactivated',
      'Customer',
      id,
      `Customer '${customer.fullName}' deactivated by ${actorName || currentUser?.name || 'Owner'}.`,
      'Active',
      'Deactivated'
    );

    return { success: true };
  };

  const restoreCustomer = async (id: string, actorName?: string): Promise<{ success: boolean; error?: string }> => {
    const customer = customers.find((c) => c.id === id);
    if (!customer) return { success: false, error: 'Customer not found.' };

    try {
      const numericId = typeof id === 'string' ? parseInt(id.replace(/\D/g, ''), 10) || id : id;
      await restoreCustomerApi(numericId);
    } catch (err: any) {
      console.warn('API customer restore failed:', err);
    }

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              isDeactivated: false,
              status: 'active',
              deletedAt: null,
            }
          : c
      )
    );

    addAuditLog(
      'Customer Restored',
      'Customer',
      id,
      `Customer '${customer.fullName}' restored by ${actorName || currentUser?.name || 'Owner'}.`,
      'Deactivated',
      'Active'
    );

    return { success: true };
  };
  const addCustomer = (data: Omit<Customer, 'id' | 'createdAt' | 'telegramLinked'>) => {
    const cleanPhone = data.phone.trim();
    if (!cleanPhone) {
      return { success: false, error: 'Phone number is required.' };
    }

    // Phone uniqueness validation
    const existing = customers.find(
      (c) => c.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '')
    );
    if (existing) {
      return {
        success: false,
        error: `A customer with phone number ${data.phone} already exists (${existing.fullName}).`,
      };
    }

    const nextIdNumber = 1001 + customers.length;
    const cleanEmail = data.email?.trim() || null;
    const newCustomer: Customer = {
      id: `CUST-${nextIdNumber}`,
      fullName: data.fullName.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      has_email: Boolean(cleanEmail),
      has_telegram: Boolean(data.telegramHandle?.trim()),
      recovery_methods: cleanEmail ? ['email'] : [],
      address: data.address?.trim() || '',
      telegramHandle: data.telegramHandle?.trim() || '',
      telegramLinked: Boolean(data.telegramHandle?.trim()),
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    if (newCustomer.telegramLinked) {
      createTelegramConnectedNotification(newCustomer, newCustomer.telegramHandle);
    }
    addAuditLog(
      'Customer Created',
      'Customer',
      newCustomer.id,
      `Registered customer ${newCustomer.fullName} (${newCustomer.phone})`,
      undefined,
      newCustomer.fullName
    );
    return { success: true, customer: newCustomer };
  };

  const updateCustomer = (
    id: string,
    updates: Partial<Omit<Customer, 'id' | 'createdAt'>>
  ) => {
    if (updates.phone) {
      const cleanPhone = updates.phone.trim();
      const duplicate = customers.find(
        (c) =>
          c.id !== id &&
          c.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '')
      );
      if (duplicate) {
        return {
          success: false,
          error: `Phone number ${updates.phone} is already assigned to another customer (${duplicate.fullName}).`,
        };
      }
    }

    const prevCustomer = customers.find((c) => c.id === id);
    let updatedCustomerObj: Customer | undefined;

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...updates };
          if (updates.telegramHandle !== undefined) {
            updated.telegramLinked = Boolean(updates.telegramHandle.trim());
          }
          if (updates.telegramLinked !== undefined) {
            updated.telegramLinked = updates.telegramLinked;
          }
          updatedCustomerObj = updated;
          return updated;
        }
        return c;
      })
    );

    if (updatedCustomerObj && !prevCustomer?.telegramLinked && updatedCustomerObj.telegramLinked) {
      createTelegramConnectedNotification(updatedCustomerObj, updatedCustomerObj.telegramHandle);
    }

    addAuditLog(
      'Customer Updated',
      'Customer',
      id,
      `Updated profile/contact information for customer ${updates.fullName || id}`
    );

    return { success: true };
  };

  // Vehicle Management logic
  const addVehicle = (data: Omit<Vehicle, 'id' | 'createdAt'>) => {
    const cleanPlate = data.plateNumber.trim().toUpperCase();
    if (!cleanPlate) {
      return { success: false, error: 'Plate number is required.' };
    }

    // Unique plate validation
    const duplicate = vehicles.find((v) => v.plateNumber.toUpperCase() === cleanPlate);
    if (duplicate) {
      return {
        success: false,
        error: `Vehicle with license plate "${cleanPlate}" is already registered to ${duplicate.customerName}.`,
      };
    }

    const nextIdNum = 2001 + vehicles.length;
    const newVehicle: Vehicle = {
      id: `VEH-${nextIdNum}`,
      customerId: data.customerId,
      customerName: data.customerName,
      plateNumber: cleanPlate,
      brand: data.brand.trim(),
      model: data.model.trim(),
      year: Number(data.year),
      color: data.color.trim(),
      mileage: Number(data.mileage),
      vin: data.vin?.trim().toUpperCase() || '',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setVehicles((prev) => [newVehicle, ...prev]);
    addAuditLog(
      'Vehicle Created',
      'Vehicle',
      newVehicle.id,
      `Registered vehicle ${newVehicle.brand} ${newVehicle.model} (${newVehicle.plateNumber}) for ${newVehicle.customerName}`,
      undefined,
      newVehicle.plateNumber
    );
    return { success: true, vehicle: newVehicle };
  };

  const updateVehicle = (
    id: string,
    updates: Partial<Omit<Vehicle, 'id' | 'createdAt'>>,
    changedByName: string
  ) => {
    const existing = vehicles.find((v) => v.id === id);
    if (!existing) return { success: false, error: 'Vehicle not found' };

    if (updates.plateNumber && updates.plateNumber.toUpperCase() !== existing.plateNumber) {
      const cleanPlate = updates.plateNumber.toUpperCase().trim();
      const duplicate = vehicles.find((v) => v.id !== id && v.plateNumber.toUpperCase() === cleanPlate);
      if (duplicate) {
        return {
          success: false,
          error: `License plate "${cleanPlate}" belongs to another registered vehicle.`,
        };
      }
    }

    const logsToCreate: VehicleChangeLog[] = [];
    const nowStamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

    // Track mileage changes in log
    if (updates.mileage !== undefined && Number(updates.mileage) !== existing.mileage) {
      logsToCreate.push({
        id: `vlog-${Date.now()}-1-${Math.random().toString(36).substring(2, 7)}`,
        vehicleId: id,
        field: 'mileage',
        oldValue: existing.mileage,
        newValue: Number(updates.mileage),
        changedBy: changedByName || currentUser?.name || 'Staff User',
        timestamp: nowStamp,
      });
    }

    // Track VIN changes in log
    if (updates.vin !== undefined && updates.vin.trim().toUpperCase() !== (existing.vin || '')) {
      logsToCreate.push({
        id: `vlog-${Date.now()}-2-${Math.random().toString(36).substring(2, 7)}`,
        vehicleId: id,
        field: 'vin',
        oldValue: existing.vin || 'NONE',
        newValue: updates.vin.trim().toUpperCase() || 'NONE',
        changedBy: changedByName || currentUser?.name || 'Staff User',
        timestamp: nowStamp,
      });
    }

    if (logsToCreate.length > 0) {
      setVehicleChangeLogs((prev) => [...logsToCreate, ...prev]);
    }

    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
    );

    return { success: true };
  };

  // Repair Job logic
  const getLeastLoadedMechanic = (): { id: string; name: string } | null => {
    // List mechanics
    const activeMechanics = users.filter((u) => u.role === 'mechanic' && u.status === 'active');
    if (activeMechanics.length === 0) {
      return { id: 'usr-3', name: 'Dave Miller' };
    }

    const activeStatuses = ['pending_inspection', 'waiting_approval', 'in_progress'];

    let chosen = activeMechanics[0];
    let minCount = Infinity;

    activeMechanics.forEach((m) => {
      const activeCount = repairJobs.filter(
        (j) => j.assignedMechanicId === m.id && activeStatuses.includes(j.status)
      ).length;

      if (activeCount < minCount) {
        minCount = activeCount;
        chosen = m;
      }
    });

    return { id: chosen.id, name: chosen.name };
  };

  const createRepairJob = (params: {
    jobType?: 'service' | 'repair';
    customerId: string;
    customerName: string;
    customerPhone: string;
    vehicleId: string;
vehicleMake: string;
vehicleModel: string;
licensePlate: string;
receivedDate?: string;
serviceDate?: string;
customerComplaint?: string;
inspectionFee?: number;
manualMechanicId?: string;
manualMechanicName?: string;
createdByName?: string;
estimatedCost?: number;
servicesPerformed?: PerformedService[];
linkedRepairJobId?: string;
}) => {
  const nowStamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const nextNum = 485 + repairJobs.length;
  const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const jobNumber = `RO-2026-0${nextNum}`;
  const jobType = params.jobType || 'repair';
  const sDate =
    params.serviceDate ||
    params.receivedDate ||
    nowStamp.substring(0, 10);

  let assignedMechId: string = params.manualMechanicId || '';
  let assignedMechName: string = params.manualMechanicName || '';

  const isAutoAssign =
    !assignedMechId || assignedMechId === 'auto';

  if (isAutoAssign) {
    const autoMech = getLeastLoadedMechanic();

    // Always make sure these are strings
    assignedMechId = autoMech?.id || 'usr-3';
    assignedMechName = autoMech?.name || 'Dave Miller';
  }

  const initialStatus =
    jobType === 'service'
      ? 'in_progress'
      : 'pending_inspection';

  const createdBy =
    params.createdByName ||
    currentUser?.name ||
    'Staff User';

  const initialAssignmentHistory: MechanicAssignmentHistory = {
    id: `mah-${Date.now()}`,
    jobId,
    newMechanicId: assignedMechId,
    newMechanicName: assignedMechName || 'Mechanic',
    changedBy: createdBy,
    reason: isAutoAssign
      ? 'System Auto-Assign'
      : 'Manual Staff Override at intake',
    timestamp: nowStamp,
  };

  const initialServices =
    params.servicesPerformed || [];

  const servicesTotal = initialServices.reduce(
    (sum, s) =>
      sum +
      (s.totalPrice ||
        s.unitPrice * s.quantity),
    0
  );

  const initialStatusHistory: RepairStatusHistory = {
    id: `rsh-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 7)}`,
    jobId,
    fromStatus: 'Customer Intake',
    toStatus: initialStatus,
    changedBy: createdBy,
    timestamp: nowStamp,
    note:
      jobType === 'service'
        ? `Service Job created with ${initialServices.length} requested service(s).`
        : `Repair Job created with complaint: "${
            params.customerComplaint || ''
          }"`,
  };

    const newJob: RepairJob = {
      id: jobId,
      jobNumber,
      jobType,
      serviceDate: sDate,
      linkedRepairJobId: params.linkedRepairJobId,
      vehicleId: params.vehicleId,
      vehicleMake: params.vehicleMake,
      vehicleModel: params.vehicleModel,
      licensePlate: params.licensePlate,
      customerId: params.customerId,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      assignedMechanicId: assignedMechId,
      assignedMechanicName: assignedMechName,
      status: initialStatus,
      receivedDate: params.receivedDate || nowStamp,
      customerComplaint: params.customerComplaint || (jobType === 'service' ? 'Scheduled Service' : ''),
      inspectionFee: jobType === 'service' ? 0 : (params.inspectionFee ?? 20),
      totalRepairCost: jobType === 'service' ? servicesTotal : (params.estimatedCost || params.inspectionFee || 20),
      estimatedCost: jobType === 'service' ? servicesTotal : (params.estimatedCost || 20),
      entryDate: params.receivedDate || nowStamp,
      estimatedCompletion: new Date(Date.now() + 86400000 * 2).toISOString().replace('T', ' ').substring(0, 16),
      description: params.customerComplaint || (jobType === 'service' ? 'Scheduled Service' : 'Vehicle Repair'),
      telegramNotified: false,
      inspectionRecords: [],
      mechanicAssignmentHistory: [initialAssignmentHistory],
      statusHistory: [initialStatusHistory],
      servicesPerformed: initialServices,
      partsUsed: [],
    };

    setRepairJobs((prev) => [newJob, ...prev]);
    setRepairStatusHistory((prev) => [initialStatusHistory, ...prev]);
    addAuditLog(
      jobType === 'service' ? 'Service Job Created' : 'Repair Job Created',
      'Repair Job',
      jobNumber,
      `Created ${jobType} job for ${params.customerName} (${params.vehicleMake} ${params.vehicleModel})`,
      undefined,
      initialStatus,
      createdBy
    );
    return { success: true, job: newJob };
  };

  const reassignMechanic = (
    jobId: string,
    newMechanicId: string,
    newMechanicName: string,
    changedBy: string,
    reason: string
  ) => {
    const existingJob = repairJobs.find((j) => j.id === jobId);
    if (!existingJob) return { success: false, error: 'Repair job not found.' };

    const nowStamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const historyEntry: MechanicAssignmentHistory = {
      id: `mah-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      jobId,
      oldMechanicId: existingJob.assignedMechanicId,
      oldMechanicName: existingJob.assignedMechanicName,
      newMechanicId,
      newMechanicName,
      changedBy: changedBy || currentUser?.name || 'Staff User',
      reason: reason.trim() || 'Manual reassignment',
      timestamp: nowStamp,
    };

    setRepairJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          return {
            ...j,
            assignedMechanicId: newMechanicId,
            assignedMechanicName: newMechanicName,
            mechanicAssignmentHistory: [
              historyEntry,
              ...(j.mechanicAssignmentHistory || []),
            ],
          };
        }
        return j;
      })
    );

    addAuditLog(
      existingJob.assignedMechanicName ? 'Mechanic Reassigned' : 'Mechanic Assigned',
      'Repair Job',
      existingJob.jobNumber,
      `Assigned repair job to mechanic ${newMechanicName}. Reason: ${reason || 'Manual reassignment'}`,
      existingJob.assignedMechanicName || 'Unassigned',
      newMechanicName,
      changedBy || currentUser?.name || 'Staff User'
    );

    return { success: true };
  };

  const addRepairJob = (data: Omit<RepairJob, 'id' | 'jobNumber' | 'entryDate'>) => {
    let newJob: RepairJob | null = null;
    setRepairJobs((prev) => {
      const existingNumbers = new Set(prev.map((j) => j.jobNumber));
      let nextNum = 485 + prev.length;
      while (existingNumbers.has(`RO-2026-0${nextNum}`)) {
        nextNum++;
      }
      newJob = {
        ...data,
        id: `job-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        jobNumber: `RO-2026-0${nextNum}`,
        entryDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
        inspectionRecords: [],
      };
      return [newJob, ...prev];
    });
    return { success: true, job: newJob! };
  };

  const assignWarranty = (data: Omit<Warranty, 'id' | 'createdAt'>) => {
    let newWarranty: Warranty | null = null;
    setWarranties((prev) => {
      const existingIds = new Set(prev.map((w) => w.id));
      let nextNum = 1001 + prev.length;
      while (existingIds.has(`WAR-${nextNum}`)) {
        nextNum++;
      }
      newWarranty = {
        ...data,
        id: `WAR-${nextNum}`,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
      return [newWarranty, ...prev];
    });
    return { success: true, warranty: newWarranty! };
  };

  const updateWarranty = (id: string, updates: Partial<Warranty>) => {
    setWarranties((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates } : w))
    );
  };

  const updateRepairJobStatus = (
    jobId: string,
    status: RepairJob['status'],
    changedBy?: string,
    note?: string
  ) => {
    const targetJob = repairJobs.find((j) => j.id === jobId);
    if (!targetJob) return;

    const fromStatus = targetJob.status;

    // Requirement 5: Prevent duplicate history when status is unchanged
    if (fromStatus === status) {
      return;
    }

    // Requirement 4: Status Transition Validation
    const validTransitions: Record<string, string[]> = {
      pending_inspection: targetJob.jobType === 'service'
        ? ['pending_inspection', 'in_progress', 'waiting_approval', 'declined', 'cancelled']
        : ['pending_inspection', 'waiting_approval', 'declined', 'cancelled'],
      waiting_approval: ['waiting_approval', 'in_progress', 'declined', 'cancelled', 'pending_inspection'],
      in_progress: ['in_progress', 'completed', 'waiting_approval', 'declined', 'cancelled'],
      completed: ['completed', 'delivered', 'in_progress'],
      delivered: ['delivered'],
      declined: ['declined', 'pending_inspection'],
      cancelled: ['cancelled'],
    };

    if (validTransitions[fromStatus] && !validTransitions[fromStatus].includes(status)) {
      console.warn(`[GarageContext] Invalid status transition rejected: cannot transition from ${fromStatus} to ${status}`);
      return;
    }

    const nowStamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const staffName = changedBy || currentUser?.name || 'Staff User';

    const statusHistoryEntry: RepairStatusHistory = {
      id: `rsh-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      jobId,
      fromStatus,
      toStatus: status,
      changedBy: staffName,
      timestamp: nowStamp,
      note: note || `Status transitioned from ${fromStatus.replace('_', ' ')} to ${status.replace('_', ' ')}`,
    };

    setRepairStatusHistory((prev) => [statusHistoryEntry, ...prev]);

    setRepairJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          // If status moved to 'declined': Release pre-allocated parts back to inventory
          if (status === 'declined' && j.partsUsed && j.partsUsed.length > 0) {
            j.partsUsed.forEach((part) => {
              if (part.quantity > 0 && !part.isCustomerProvided) {
                adjustStockQuantity(
                  part.partId,
                  part.quantity,
                  'adjustment',
                  `Release Pre-Allocated Parts due to Declined Order ${j.jobNumber}`,
                  staffName
                );
              }
            });
          }

          // Auto-issue active warranty on completion if not already assigned
          if (status === 'completed' || status === 'delivered') {
            const existingWarranty = warranties.find((w) => w.repairJobId === jobId);
            if (!existingWarranty) {
              const todayStr = new Date().toISOString().substring(0, 10);
              const nextYear = new Date();
              nextYear.setFullYear(nextYear.getFullYear() + 1);
              const nextYearStr = nextYear.toISOString().substring(0, 10);

              assignWarranty({
                repairJobId: j.id,
                repairJobNumber: j.jobNumber,
                vehicleId: j.vehicleId,
                vehicleInfo: `${j.vehicleMake} ${j.vehicleModel} (${j.licensePlate})`,
                customerName: j.customerName,
                startDate: todayStr,
                endDate: nextYearStr,
                period: '12 Months / 12,000 Miles',
                status: 'active',
                notes: `Standard 1-Year service & parts warranty automatically assigned upon repair completion of ${j.jobNumber}.`,
                assignedBy: staffName,
              });
            }

            // Auto-issue draft invoice if not created yet so job is ready for invoicing
            createInvoiceFromJob(j.id);
          }

          addAuditLog(
            'Status Changed',
            'Repair Job',
            j.jobNumber,
            note ? `Status updated to ${status.replace('_', ' ')}. Note: ${note}` : `Status updated to ${status.replace('_', ' ')}`,
            fromStatus,
            status,
            staffName
          );

          return {
            ...j,
            status,
            completionDate: status === 'completed' || status === 'delivered' ? (j.completionDate || nowStamp) : j.completionDate,
            deliveredAt: status === 'delivered' ? (j.deliveredAt || nowStamp) : j.deliveredAt,
            declinedAt: status === 'declined' ? (j.declinedAt || nowStamp) : j.declinedAt,
            declineReason: status === 'declined' ? (note || j.declineReason || 'Customer declined repair proposal') : j.declineReason,
            telegramNotified: status === 'completed' || status === 'delivered' ? true : j.telegramNotified,
            telegramNotifiedAt: status === 'completed' || status === 'delivered' ? nowStamp : j.telegramNotifiedAt,
            telegramNotificationStatus: status === 'completed' || status === 'delivered' ? 'Sent' : j.telegramNotificationStatus,
            statusHistory: [statusHistoryEntry, ...(j.statusHistory || [])],
          };
        }
        return j;
      })
    );
  };

  const updateRepairJobDetails = (
    jobId: string,
    updates: Partial<RepairJob>,
    changedBy?: string
  ) => {
    setRepairJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          return { ...j, ...updates };
        }
        return j;
      })
    );
  };

  const addInspectionRecord = (
    jobId: string,
    record: Omit<InspectionRecord, 'id' | 'recordedAt'>
  ) => {
    const nowStamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newRecord: InspectionRecord = {
      ...record,
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      recordedAt: nowStamp,
    };

    // Deduct stock for parts used by mechanic (UNLESS customer provided)
    record.partsUsed.forEach((p) => {
      // Find if part is marked as customer provided in partsUsed
      if (p.unitPrice > 0) {
        adjustStockQuantity(
          p.partId,
          -p.quantity,
          'usage',
          `Used in Repair Order #${jobId}`,
          record.recordedBy
        );
      }
    });

    const staffName = record.recordedBy || currentUser?.name || 'Mechanic Technician';
    const targetJob = repairJobs.find((j) => j.id === jobId);
    const fromStatus = targetJob?.status ?? 'pending_inspection';
    const isStatusChanging = fromStatus !== 'waiting_approval';

    let statusHistoryEntry: RepairStatusHistory | null = null;
    if (isStatusChanging) {
      statusHistoryEntry = {
        id: `rsh-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        jobId,
        fromStatus,
        toStatus: 'waiting_approval',
        changedBy: staffName,
        timestamp: nowStamp,
        note: `Inspection findings & recommendations recorded: "${record.inspectionResult || record.diagnosticNotes}". Status moved to Waiting Approval.`,
      };

      setRepairStatusHistory((prev) => [statusHistoryEntry!, ...prev]);
    }

    setRepairJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          const records = j.inspectionRecords || [];

          const existingPartsUsed = j.partsUsed || [];
          const formattedNewParts: UsedPart[] = record.partsUsed.map((p) => ({
            partId: p.partId,
            partNumber: p.partId,
            partName: p.partName,
            quantity: p.quantity,
            unitPrice: p.unitPrice,
            totalPrice: p.quantity * p.unitPrice,
            isCustomerProvided: p.unitPrice === 0,
          }));

          // Calculate updated total cost: inspection fee + parts + labor
          const partsTotal = [...existingPartsUsed, ...formattedNewParts].reduce(
            (sum, p) => sum + (p.isCustomerProvided ? 0 : p.unitPrice * p.quantity),
            0
          );
          const laborTotal = record.laborCost || record.laborHours * 90;
          const updatedEstimatedCost = j.inspectionFee + partsTotal + laborTotal;

          const updatedJob: RepairJob = {
            ...j,
            status: 'waiting_approval',
            inspectionResult: record.inspectionResult || j.inspectionResult,
            diagnosticNotes: record.diagnosticNotes || j.diagnosticNotes,
            recommendedRepairs: record.recommendedRepairs || j.recommendedRepairs,
            inspectionNotes: record.mechanicNotes || j.inspectionNotes,
            inspectionRecords: [newRecord, ...records],
            partsUsed: [...existingPartsUsed, ...formattedNewParts],
            estimatedCost: updatedEstimatedCost,
            totalRepairCost: updatedEstimatedCost,
            statusHistory: statusHistoryEntry ? [statusHistoryEntry, ...(j.statusHistory || [])] : (j.statusHistory || []),
          };

          return updatedJob;
        }
        return j;
      })
    );
  };

  const addPartsToJob = (
    jobId: string,
    parts: UsedPart[],
    laborHours = 1.5,
    laborCost = 135,
    recordedBy?: string
  ) => {
    const staffName = recordedBy || currentUser?.name || 'Mechanic Technician';
    const nowStamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

    // Deduct stock for parts used (unless Customer Provided)
    parts.forEach((p) => {
      if (!p.isCustomerProvided) {
        adjustStockQuantity(
          p.partId,
          -p.quantity,
          'usage',
          `Repair Order #${jobId} parts allocation`,
          staffName
        );
      }
    });

    setRepairJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          const existingParts = j.partsUsed || [];
          const combinedParts = [...existingParts, ...parts];

          const partsTotal = combinedParts.reduce(
            (sum, pt) => sum + (pt.isCustomerProvided ? 0 : pt.unitPrice * pt.quantity),
            0
          );
          const totalCost = (j.inspectionFee ?? 50) + partsTotal + laborCost;

          return {
            ...j,
            partsUsed: combinedParts,
            estimatedCost: totalCost,
            totalRepairCost: totalCost,
          };
        }
        return j;
      })
    );
  };

  const addEmbeddedRepair = (
    jobId: string,
    repair: {
      inspectionFindings: string;
      recommendedRepair: string;
      estimatedCost: number;
      notes?: string;
    },
    recordedBy?: string
  ) => {
    const staffName = recordedBy || currentUser?.name || 'Staff User';
    const nowStamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const repairId = `REP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newEmbeddedRepair: EmbeddedRepair = {
      id: repairId,
      jobId,
      inspectionFindings: repair.inspectionFindings,
      recommendedRepair: repair.recommendedRepair,
      estimatedCost: repair.estimatedCost,
      status: 'waiting_approval',
      createdAt: nowStamp,
      createdBy: staffName,
      notes: repair.notes,
    };

    setRepairJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          const updatedRepairs = [...(j.embeddedRepairs || []), newEmbeddedRepair];
          return {
            ...j,
            embeddedRepairs: updatedRepairs,
          };
        }
        return j;
      })
    );

    addAuditLog(
      'Add Repair',
      'Repair Job',
      jobId,
      `Added repair finding: ${repair.recommendedRepair} ($${repair.estimatedCost}). Status: Waiting Approval`,
      undefined,
      'waiting_approval',
      staffName
    );

    return { success: true, repair: newEmbeddedRepair };
  };

  const updateEmbeddedRepairStatus = (
    jobId: string,
    repairId: string,
    status: 'approved' | 'declined',
    changedBy?: string
  ) => {
    const staffName = changedBy || currentUser?.name || 'Staff User';

    setRepairJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId && j.embeddedRepairs) {
          const updatedRepairs = j.embeddedRepairs.map((r) =>
            r.id === repairId ? { ...r, status } : r
          );
          return {
            ...j,
            embeddedRepairs: updatedRepairs,
          };
        }
        return j;
      })
    );

    addAuditLog(
      'Embedded Repair Status',
      'Repair Job',
      jobId,
      `Embedded repair ${repairId} status updated to ${status}`,
      'waiting_approval',
      status,
      staffName
    );
  };

  const addCustomerProvidedPartToJob = (
    jobId: string,
    partData: {
      partName: string;
      quantity: number;
      brand?: string;
      partNumber?: string;
      condition?: string;
      notes?: string;
    },
    recordedBy?: string
  ) => {
    const staffName = recordedBy || currentUser?.name || 'Staff User';
    const refCode = `CP-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const newPart: UsedPart = {
      partId: `cust-${Date.now()}`,
      partName: partData.partName,
      partNumber: partData.partNumber || refCode,
      quantity: partData.quantity,
      unitPrice: 0,
      totalPrice: 0,
      isCustomerProvided: true,
      customerPartRef: refCode,
      brand: partData.brand,
      condition: (partData.condition as 'New' | 'Used') || 'New',
      notes: partData.notes,
      dateReceived: new Date().toISOString().substring(0, 10),
      recordedBy: staffName,
      confirmedByCustomer: true,
    };

    setRepairJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          const combined = [...(j.partsUsed || []), newPart];
          return {
            ...j,
            partsUsed: combined,
          };
        }
        return j;
      })
    );

    addAuditLog(
      'Add Customer Part',
      'Repair Job',
      jobId,
      `Customer-provided part added: ${partData.partName} (Ref: ${refCode}, Qty: ${partData.quantity})`,
      undefined,
      refCode,
      staffName
    );

    return { success: true, part: newPart, refCode };
  };

  // Invoice & Calculation Logic
  const createInvoiceFromJob = (
    jobId: string,
    taxAmount?: number,
    manualDiscountVal = 0,
    manualDiscountType: 'fixed' | 'percentage' = 'fixed',
    manualDiscountReason?: string,
    campaignId?: string
  ) => {
    const job = repairJobs.find((j) => j.id === jobId);
    if (!job) return { success: false, error: 'Job not found' };

    const existingInv = invoices.find((inv) => inv.repairJobId === jobId);
    if (existingInv) {
      return { success: true, invoice: existingInv };
    }

    const todayStr = new Date().toISOString().substring(0, 10);
    const parts = job.partsUsed || [];
    const servicesList = job.servicesPerformed || [];

    // Process Services
    let grossServicesSubtotal = 0;
    const processedServices: PerformedService[] = servicesList.map((s) => {
      const lineGross = s.unitPrice * s.quantity;
      grossServicesSubtotal += lineGross;
      return {
        ...s,
        totalPrice: lineGross,
      };
    });

    // Step 1: Item / Service Discounts (automatic)
    let grossPartsSubtotal = 0;
    let itemDiscountsTotal = 0;

    const processedParts: UsedPart[] = parts.map((p) => {
      if (p.isCustomerProvided) {
        return { ...p, unitPrice: 0, totalPrice: 0, itemDiscountAmount: 0 };
      }

      const lineGross = p.unitPrice * p.quantity;
      grossPartsSubtotal += lineGross;

      const activeRules = itemDiscounts.filter(
        (d) => d.status === 'active' && todayStr >= d.startDate && todayStr <= d.endDate
      );

      const itemRule = activeRules.find((d) => d.targetType === 'item' && d.targetId === p.partId);
      const catRule = activeRules.find(
        (d) => d.targetType === 'category' && inventory.find((i) => i.id === p.partId)?.category === d.targetId
      );

      const rule = itemRule || catRule;
      let discAmount = 0;
      if (rule) {
        if (rule.discountType === 'percentage') {
          discAmount = lineGross * (rule.discountValue / 100);
        } else {
          discAmount = Math.min(lineGross, rule.discountValue * p.quantity);
        }
      }

      itemDiscountsTotal += discAmount;

      return {
        ...p,
        totalPrice: lineGross,
        itemDiscountAmount: discAmount,
      };
    });

    const isDeclined = job.status === 'declined';
    const inspectionFee = isDeclined ? (job.inspectionFee ?? 50) : 0;
    const subtotal = grossServicesSubtotal + grossPartsSubtotal + inspectionFee;
    const netAfterItemDiscount = Math.max(0, subtotal - itemDiscountsTotal);

    // Step 2: Manual Discount (stacks on top)
    let manualDiscountsTotal = 0;
    if (manualDiscountVal > 0) {
      if (manualDiscountType === 'percentage') {
        manualDiscountsTotal = netAfterItemDiscount * (manualDiscountVal / 100);
      } else {
        manualDiscountsTotal = Math.min(netAfterItemDiscount, manualDiscountVal);
      }
    }

    const netAfterManual = Math.max(0, netAfterItemDiscount - manualDiscountsTotal);

    // Step 3: Whole Order Discount Campaign (applied last)
    let campaignDiscountTotal = 0;
    let campaignName = '';
    if (campaignId) {
      const campaign = discountCampaigns.find(
        (c) => c.id === campaignId && c.status === 'active' && todayStr >= c.startDate && todayStr <= c.endDate
      );
      if (campaign) {
        campaignName = campaign.name;
        if (campaign.discountType === 'percentage') {
          campaignDiscountTotal = netAfterManual * (campaign.discountValue / 100);
        } else {
          campaignDiscountTotal = Math.min(netAfterManual, campaign.discountValue);
        }
      }
    }

    const totalDiscount = itemDiscountsTotal + manualDiscountsTotal + campaignDiscountTotal;
    const grandTotal = Math.max(0, subtotal - totalDiscount);

    const jobPayments = paymentRecords.filter((p) => p.repairJobId === job.id);
    const totalPaid = jobPayments.reduce((sum, p) => sum + p.amount, 0);

    let status: Invoice['status'] = 'unpaid';
    if (totalPaid >= grandTotal - 0.01 && grandTotal > 0) {
      status = 'paid';
    }

    const newInvoice: Invoice = {
      id: '', // Will be assigned inside setInvoices if creating new
      repairJobId: job.id,
      repairJobNumber: job.jobNumber,
      customerId: job.customerId || 'CUST-1001',
      customerName: job.customerName,
      vehicleInfo: `${job.vehicleMake} ${job.vehicleModel} (${job.licensePlate})`,
      repairDetails: job.repairDetails || job.description,
      servicesPerformed: processedServices,
      partsUsed: processedParts,
      laborHours: job.laborHours || 1.5,
      laborCost: 0,
      inspectionFee,
      subtotal,
      itemDiscountsTotal,
      manualDiscountsTotal,
      campaignDiscountTotal,
      totalDiscount,
      taxableAmount: grandTotal,
      tax: 0,
      totalAmount: grandTotal,
      totalPaid,
      balanceRemaining: Math.max(0, grandTotal - totalPaid),
      status,
      campaignId,
      campaignName,
      manualDiscountAmount: manualDiscountsTotal,
      manualDiscountType,
      manualDiscountValue: manualDiscountVal,
      manualDiscountReason,
      issuedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      notes: `Generated from Repair Order ${job.jobNumber}`,
    };

    let resultInvoice = newInvoice;

    setInvoices((prev) => {
      // 1. Clean up any existing duplicates in prev
      const uniquePrev = prev.filter((i, idx, self) => self.findIndex((x) => x.id === i.id) === idx);

      // 2. Check if an invoice for this repairJobId already exists
      const existingJobInvIndex = uniquePrev.findIndex((inv) => inv.repairJobId === job.id);
      if (existingJobInvIndex !== -1) {
        const existingId = uniquePrev[existingJobInvIndex].id;
        const updated = [...uniquePrev];
        resultInvoice = { ...newInvoice, id: existingId };
        updated[existingJobInvIndex] = resultInvoice;
        return updated;
      }

      // 3. Generate guaranteed unique ID
      const existingIds = new Set(uniquePrev.map((i) => i.id));
      const numericSuffixes = uniquePrev
        .map((i) => parseInt(i.id.replace(/\D/g, ''), 10))
        .filter((n) => !isNaN(n));
      let invNum = numericSuffixes.length > 0 ? Math.max(...numericSuffixes) + 1 : 3001;
      while (existingIds.has(`INV-${invNum}`)) {
        invNum++;
      }
      resultInvoice = { ...newInvoice, id: `INV-${invNum}` };
      return [resultInvoice, ...uniquePrev];
    });

    return { success: true, invoice: resultInvoice };
  };

  const updateInvoiceDiscounts = (params: {
    invoiceId: string;
    manualDiscountType?: 'fixed' | 'percentage';
    manualDiscountValue?: number;
    manualDiscountReason?: string;
    campaignId?: string;
    lineItemDiscount?: {
      targetType: 'service' | 'part';
      targetIndex: number;
      discountType: 'fixed' | 'percentage';
      discountValue: number;
      discountReason: string;
    };
  }) => {
    const inv = invoices.find((i) => i.id === params.invoiceId);
    if (!inv) return { success: false, error: 'Invoice not found' };

    const job = repairJobs.find((j) => j.id === inv.repairJobId);
    if (!job) return { success: false, error: 'Job not found' };

    const todayStr = new Date().toISOString().substring(0, 10);
    const servicesList = inv.servicesPerformed || job.servicesPerformed || [];
    const partsList = inv.partsUsed || job.partsUsed || [];

    let grossServicesSubtotal = 0;
    let lineManualDiscountsTotal = 0;

    const processedServices: PerformedService[] = servicesList.map((s, idx) => {
      const lineGross = s.unitPrice * s.quantity;
      grossServicesSubtotal += lineGross;

      let manDiscAmount = s.manualDiscountAmount || 0;
      let manDiscType = s.manualDiscountType || 'fixed';
      let manDiscVal = s.manualDiscountValue || 0;
      let manDiscReason = s.manualDiscountReason || '';

      if (params.lineItemDiscount && params.lineItemDiscount.targetType === 'service' && params.lineItemDiscount.targetIndex === idx) {
        manDiscType = params.lineItemDiscount.discountType;
        manDiscVal = params.lineItemDiscount.discountValue;
        manDiscReason = params.lineItemDiscount.discountReason;
        if (manDiscType === 'percentage') {
          manDiscAmount = lineGross * (manDiscVal / 100);
        } else {
          manDiscAmount = Math.min(lineGross, manDiscVal);
        }
      }

      lineManualDiscountsTotal += manDiscAmount;

      return {
        ...s,
        totalPrice: Math.max(0, lineGross - manDiscAmount),
        manualDiscountAmount: manDiscAmount,
        manualDiscountType: manDiscType,
        manualDiscountValue: manDiscVal,
        manualDiscountReason: manDiscReason,
      };
    });

    let grossPartsSubtotal = 0;
    let itemDiscountsTotal = 0;

    const processedParts: UsedPart[] = partsList.map((p, idx) => {
      if (p.isCustomerProvided) {
        return { ...p, unitPrice: 0, totalPrice: 0, itemDiscountAmount: 0 };
      }
      const lineGross = p.unitPrice * p.quantity;
      grossPartsSubtotal += lineGross;

      const activeRules = itemDiscounts.filter(
        (d) => d.status === 'active' && todayStr >= d.startDate && todayStr <= d.endDate
      );

      const itemRule = activeRules.find((d) => d.targetType === 'item' && d.targetId === p.partId);
      const catRule = activeRules.find(
        (d) => d.targetType === 'category' && inventory.find((i) => i.id === p.partId)?.category === d.targetId
      );

      const rule = itemRule || catRule;
      let discAmount = 0;
      if (rule) {
        if (rule.discountType === 'percentage') {
          discAmount = lineGross * (rule.discountValue / 100);
        } else {
          discAmount = Math.min(lineGross, rule.discountValue * p.quantity);
        }
      }

      itemDiscountsTotal += discAmount;

      const afterAutoDiscount = Math.max(0, lineGross - discAmount);
      let manDiscAmount = p.manualDiscountAmount || 0;
      let manDiscType = p.manualDiscountType || 'fixed';
      let manDiscVal = p.manualDiscountValue || 0;
      let manDiscReason = p.manualDiscountReason || '';

      if (params.lineItemDiscount && params.lineItemDiscount.targetType === 'part' && params.lineItemDiscount.targetIndex === idx) {
        manDiscType = params.lineItemDiscount.discountType;
        manDiscVal = params.lineItemDiscount.discountValue;
        manDiscReason = params.lineItemDiscount.discountReason;
        if (manDiscType === 'percentage') {
          manDiscAmount = afterAutoDiscount * (manDiscVal / 100);
        } else {
          manDiscAmount = Math.min(afterAutoDiscount, manDiscVal);
        }
      }

      lineManualDiscountsTotal += manDiscAmount;

      return {
        ...p,
        totalPrice: Math.max(0, afterAutoDiscount - manDiscAmount),
        itemDiscountAmount: discAmount,
        manualDiscountAmount: manDiscAmount,
        manualDiscountType: manDiscType,
        manualDiscountValue: manDiscVal,
        manualDiscountReason: manDiscReason,
      };
    });

    const isDeclined = job.status === 'declined';
    const inspectionFee = isDeclined ? (job.inspectionFee ?? 50) : 0;
    const subtotal = grossServicesSubtotal + grossPartsSubtotal + inspectionFee;
    const netAfterItemDiscount = Math.max(0, subtotal - itemDiscountsTotal - lineManualDiscountsTotal);

    const manualType = params.manualDiscountType !== undefined ? params.manualDiscountType : inv.manualDiscountType || 'fixed';
    const manualVal = params.manualDiscountValue !== undefined ? params.manualDiscountValue : inv.manualDiscountValue || 0;
    const manualReason = params.manualDiscountReason !== undefined ? params.manualDiscountReason : inv.manualDiscountReason;

    let wholeInvoiceManualDiscount = 0;
    if (manualVal > 0) {
      if (manualType === 'percentage') {
        wholeInvoiceManualDiscount = netAfterItemDiscount * (manualVal / 100);
      } else {
        wholeInvoiceManualDiscount = Math.min(netAfterItemDiscount, manualVal);
      }
    }

    const netAfterManual = Math.max(0, netAfterItemDiscount - wholeInvoiceManualDiscount);

    const cId = params.campaignId !== undefined ? params.campaignId : inv.campaignId;
    let campaignDiscountTotal = 0;
    let campaignName = '';
    if (cId) {
      const campaign = discountCampaigns.find(
        (c) => c.id === cId && c.status === 'active' && todayStr >= c.startDate && todayStr <= c.endDate
      );
      if (campaign) {
        campaignName = campaign.name;
        if (campaign.discountType === 'percentage') {
          campaignDiscountTotal = netAfterManual * (campaign.discountValue / 100);
        } else {
          campaignDiscountTotal = Math.min(netAfterManual, campaign.discountValue);
        }
      }
    }

    const totalManualDiscounts = lineManualDiscountsTotal + wholeInvoiceManualDiscount;
    const totalDiscount = itemDiscountsTotal + totalManualDiscounts + campaignDiscountTotal;
    const grandTotal = Math.max(0, subtotal - totalDiscount);

    const jobPayments = paymentRecords.filter((p) => p.invoiceId === inv.id || p.repairJobId === inv.repairJobId);
    const totalPaid = jobPayments.reduce((sum, p) => sum + p.amount, 0);

    let status: Invoice['status'] = 'unpaid';
    if (totalPaid >= grandTotal - 0.01 && grandTotal > 0) {
      status = 'paid';
    } else if (totalPaid > 0) {
      status = 'partially_paid';
    }

    const updatedInvoice: Invoice = {
      ...inv,
      servicesPerformed: processedServices,
      partsUsed: processedParts,
      subtotal,
      itemDiscountsTotal,
      manualDiscountsTotal: totalManualDiscounts,
      campaignDiscountTotal,
      totalDiscount,
      taxableAmount: grandTotal,
      tax: 0,
      totalAmount: grandTotal,
      totalPaid,
      balanceRemaining: Math.max(0, grandTotal - totalPaid),
      status,
      campaignId: cId,
      campaignName,
      manualDiscountAmount: wholeInvoiceManualDiscount,
      manualDiscountType: manualType,
      manualDiscountValue: manualVal,
      manualDiscountReason: manualReason,
    };

    setInvoices((prev) => prev.map((i) => (i.id === inv.id ? updatedInvoice : i)));
    return { success: true, invoice: updatedInvoice };
  };

  const updateInvoiceStatus = (
    invoiceId: string,
    status: Invoice['status'],
    paymentMethod?: string
  ) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          return {
            ...inv,
            status,
            paymentMethod: paymentMethod || inv.paymentMethod,
            paidAt: status === 'paid' ? new Date().toISOString().replace('T', ' ').substring(0, 16) : inv.paidAt,
          };
        }
        return inv;
      })
    );
  };

  const recordPayment = (data: {
    repairJobId: string;
    invoiceId?: string;
    amount: number;
    date: string;
    method: string;
    type: 'deposit' | 'partial' | 'final';
    notes?: string;
    recordedBy?: string;
  }) => {
    if (data.amount <= 0) {
      return { success: false, error: 'Payment amount must be greater than $0' };
    }

    const staffName = data.recordedBy || currentUser?.name || 'Staff User';
    const nowStamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newRecord: PaymentRecord = {
      id: `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      repairJobId: data.repairJobId,
      invoiceId: data.invoiceId,
      amount: Number(data.amount),
      date: data.date,
      method: data.method,
      type: data.type,
      notes: data.notes,
      recordedBy: staffName,
      recordedAt: nowStamp,
    };

    const updatedPayments = [newRecord, ...paymentRecords];
    setPaymentRecords(updatedPayments);

    // Sync payments to target invoice
    setInvoices((prevInvoices) =>
      prevInvoices.map((inv) => {
        if (inv.id === data.invoiceId || inv.repairJobId === data.repairJobId) {
          const invPayments = updatedPayments.filter(
            (p) => p.invoiceId === inv.id || p.repairJobId === inv.repairJobId
          );
          const totalPaid = invPayments.reduce((sum, p) => sum + p.amount, 0);
          const balanceRemaining = Math.max(0, inv.totalAmount - totalPaid);
          let status: Invoice['status'] = 'unpaid';
          if (balanceRemaining <= 0.01) {
            status = 'paid';
          } else if (totalPaid > 0) {
            status = 'partially_paid';
          }

          return {
            ...inv,
            totalPaid,
            balanceRemaining,
            status,
            paymentMethod: data.method,
            paidAt: status === 'paid' ? nowStamp : inv.paidAt,
          };
        }
        return inv;
      })
    );

    return { success: true, paymentRecord: newRecord };
  };

  const simulatePayment = async (invoiceId: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return { success: false, error: 'Invoice not found' };

    if (inv.status === 'paid' || (inv.balanceRemaining !== undefined && inv.balanceRemaining <= 0.01)) {
      return { success: false, error: 'Invoice has already been paid.' };
    }

    const staffName = currentUser?.name || 'Staff User';
    const nowStamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const amountToPay = (inv.balanceRemaining !== undefined && inv.balanceRemaining > 0) ? inv.balanceRemaining : inv.totalAmount;

    // Check customer Telegram status
    const customerObj = customers.find((c) => c.fullName === inv.customerName || c.phone === inv.customerPhone);
    let telegramConnected = Boolean(customerObj?.telegramLinked || customerObj?.telegramHandle);

    try {
      const invoiceNumericId = parseInt(inv.id.replace(/\D/g, ''), 10) || inv.id;
      const apiRes = await fetch(`/api/invoices/${invoiceNumericId}/simulate-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {}),
        },
      });

      if (apiRes.ok) {
        const resData = await apiRes.json();
        if (resData.data?.telegram_connected !== undefined) {
          telegramConnected = Boolean(resData.data.telegram_connected);
        }
      }
    } catch {
      // Local fallback
    }

    const newRecord: PaymentRecord = {
      id: `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      repairJobId: inv.repairJobId,
      invoiceId: inv.id,
      amount: amountToPay,
      date: new Date().toISOString().substring(0, 10),
      method: 'Demo Payment',
      type: 'final',
      notes: 'Simulated Demo Payment for Competition / Development Environment',
      recordedBy: staffName,
      recordedAt: nowStamp,
    };

    setPaymentRecords((prev) => [newRecord, ...prev]);

    setInvoices((prev) =>
      prev.map((i) =>
        i.id === inv.id
          ? {
              ...i,
              totalPaid: i.totalAmount,
              balanceRemaining: 0,
              status: 'paid',
              paymentMethod: 'Demo Payment',
              paidAt: nowStamp,
            }
          : i
      )
    );

    return {
      success: true,
      telegramConnected,
      message: 'Payment successful. Your e-Invoice has been generated.',
    };
  };

  const addPaymentMethod = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: 'Payment method name is required' };
    const existing = paymentMethods.find((m) => m.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return { success: false, error: 'Payment method already exists' };

    const newMethod: PaymentMethodConfig = {
      id: `pm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: trimmed,
      status: 'active',
    };
    setPaymentMethods((prev) => [...prev, newMethod]);
    return { success: true, method: newMethod };
  };

  const updatePaymentMethod = (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: 'Payment method name cannot be empty' };
    const existing = paymentMethods.find(
      (m) => m.id !== id && m.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) return { success: false, error: 'Another payment method with this name already exists' };

    setPaymentMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, name: trimmed } : m))
    );
    return { success: true };
  };

  const togglePaymentMethodStatus = (id: string) => {
    setPaymentMethods((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          if (m.isDefault) return m;
          return { ...m, status: m.status === 'active' ? 'deactivated' : 'active' };
        }
        return m;
      })
    );
  };

  const addDiscountReason = (reason: string) => {
    const trimmed = reason.trim();
    if (!trimmed) return { success: false, error: 'Reason description is required' };
    const newReason: DiscountReason = {
      id: `dr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      reason: trimmed,
      status: 'active',
      displayOrder: discountReasons.length + 1,
    };
    setDiscountReasons((prev) => [...prev, newReason]);
    return { success: true, reasonItem: newReason };
  };

  const updateDiscountReason = (id: string, updates: Partial<DiscountReason>) => {
    setDiscountReasons((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const reorderDiscountReasons = (reordered: DiscountReason[]) => {
    setDiscountReasons(reordered);
  };

  const addItemDiscount = (discount: Omit<ItemServiceDiscount, 'id'>) => {
    const newItem: ItemServiceDiscount = {
      ...discount,
      id: `isd-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    setItemDiscounts((prev) => [...prev, newItem]);
    return { success: true, discountItem: newItem };
  };

  const updateItemDiscount = (id: string, updates: Partial<ItemServiceDiscount>) => {
    setItemDiscounts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
  };

  const addDiscountCampaign = (campaign: Omit<DiscountCampaign, 'id'>) => {
    const newCmp: DiscountCampaign = {
      ...campaign,
      id: `cmp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    setDiscountCampaigns((prev) => [...prev, newCmp]);
    return { success: true, campaignItem: newCmp };
  };

  const updateDiscountCampaign = (id: string, updates: Partial<DiscountCampaign>) => {
    setDiscountCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  // Inventory & Stock Logic
  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: `prt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      status: item.status || 'active',
    };
    setInventory((prev) => [...prev, newItem]);
    return { success: true, item: newItem };
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteInventoryItem = (id: string) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'deactivated' } : item))
    );
  };

  const adjustStockQuantity = (
    partId: string,
    qtyDelta: number,
    type: 'stock_in' | 'adjustment' | 'usage',
    reason: string,
    performedBy: string,
    supplier?: string
  ) => {
    const part = inventory.find((p) => p.id === partId);
    if (!part) return { success: false, error: 'Part not found' };

    const newStock = part.stock + qtyDelta;
    if (newStock < 0) {
      return { success: false, error: `Insufficient stock for ${part.name}. Current stock: ${part.stock}` };
    }

    setInventory((prev) =>
      prev.map((p) => (p.id === partId ? { ...p, stock: newStock } : p))
    );

    const tx: StockTransaction = {
      id: `stx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      partId: part.id,
      partNumber: part.partNumber,
      partName: part.name,
      type,
      quantity: qtyDelta,
      reason,
      supplier,
      performedBy: performedBy || currentUser?.name || 'Staff User',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setStockTransactions((prev) => [tx, ...prev]);
    return { success: true };
  };

  // Role Permissions Logic
  const updateRolePermissions = (role: UserRole, permissions: ModulePermissionId[]) => {
    const normalized = Array.from(new Set((permissions || []).filter(Boolean))) as ModulePermissionId[];
    setRolePermissions((prev) => ({
      ...prev,
      [role]: normalized,
    }));
    window.dispatchEvent(new CustomEvent('garage-role-permissions-changed'));
  };

  const toggleRolePermission = (role: UserRole, permission: ModulePermissionId) => {
    setRolePermissions((prev) => {
      const currentPerms = prev[role] || [];
      const hasPerm = currentPerms.includes(permission);
      const newPerms = hasPerm
        ? currentPerms.filter((p) => p !== permission)
        : [...currentPerms, permission];
      const next = { ...prev, [role]: newPerms };
      window.dispatchEvent(new CustomEvent('garage-role-permissions-changed'));
      return next;
    });
  };

  const updateRoleDiscountPermission = (role: string, canApply: boolean, maxPercent: number) => {
    setRoleDiscountPermissions((prev) => ({
      ...prev,
      [role]: {
        can_apply_manual_discount: canApply,
        max_manual_discount_percent: Math.min(100, Math.max(0, maxPercent)),
      },
    }));
  };

  const resetRolePermissions = () => {
    setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    setRoleDiscountPermissions(DEFAULT_ROLE_DISCOUNT_PERMISSIONS);
    window.dispatchEvent(new CustomEvent('garage-role-permissions-changed'));
  };

  // System Settings Actions
  const updateGarageInfoSettings = (updates: Partial<GarageInfoSettings>) => {
    setSystemSettings((prev) => ({
      ...prev,
      garageInfo: { ...prev.garageInfo, ...updates },
    }));
  };

  const updateInvoiceSettings = (updates: Partial<InvoiceSettings>) => {
    setSystemSettings((prev) => ({
      ...prev,
      invoiceSettings: { ...prev.invoiceSettings, ...updates },
    }));
  };

  const updateTelegramBotSettings = (updates: Partial<TelegramBotSettings>) => {
    setSystemSettings((prev) => ({
      ...prev,
      telegramBot: { ...prev.telegramBot, ...updates },
    }));
  };

  const addItemCategory = (category: string) => {
    const trimmed = category.trim();
    if (!trimmed) return { success: false, error: 'Category name cannot be empty' };
    if (systemSettings.itemCategories.includes(trimmed)) {
      return { success: false, error: 'Category already exists' };
    }
    setSystemSettings((prev) => ({
      ...prev,
      itemCategories: [...prev.itemCategories, trimmed],
    }));
    return { success: true };
  };

  const updateItemCategory = (oldCategory: string, newCategory: string) => {
    const trimmed = newCategory.trim();
    if (!trimmed) return { success: false, error: 'Category name cannot be empty' };
    if (trimmed !== oldCategory && systemSettings.itemCategories.includes(trimmed)) {
      return { success: false, error: 'Category already exists' };
    }
    setSystemSettings((prev) => ({
      ...prev,
      itemCategories: prev.itemCategories.map((c) => (c === oldCategory ? trimmed : c)),
    }));
    // Also update any inventory items with old category
    setInventory((prev) =>
      prev.map((item) => (item.category === oldCategory ? { ...item, category: trimmed } : item))
    );
    return { success: true };
  };

  const removeItemCategory = (category: string) => {
    setSystemSettings((prev) => ({
      ...prev,
      itemCategories: prev.itemCategories.filter((c) => c !== category),
    }));
  };

  const addRepairCategory = (category: string) => {
    const trimmed = category.trim();
    if (!trimmed) return { success: false, error: 'Category name cannot be empty' };
    if (systemSettings.repairCategories.includes(trimmed)) {
      return { success: false, error: 'Category already exists' };
    }
    setSystemSettings((prev) => ({
      ...prev,
      repairCategories: [...prev.repairCategories, trimmed],
    }));
    return { success: true };
  };

  const updateRepairCategory = (oldCategory: string, newCategory: string) => {
    const trimmed = newCategory.trim();
    if (!trimmed) return { success: false, error: 'Category name cannot be empty' };
    if (trimmed !== oldCategory && systemSettings.repairCategories.includes(trimmed)) {
      return { success: false, error: 'Category already exists' };
    }
    setSystemSettings((prev) => ({
      ...prev,
      repairCategories: prev.repairCategories.map((c) => (c === oldCategory ? trimmed : c)),
    }));
    return { success: true };
  };

  const removeRepairCategory = (category: string) => {
    setSystemSettings((prev) => ({
      ...prev,
      repairCategories: prev.repairCategories.filter((c) => c !== category),
    }));
  };

  const addWarrantyPeriodOption = (option: string) => {
    const trimmed = option.trim();
    if (!trimmed) return { success: false, error: 'Warranty period option cannot be empty' };
    if (systemSettings.warrantyPeriodOptions.includes(trimmed)) {
      return { success: false, error: 'Warranty period option already exists' };
    }
    setSystemSettings((prev) => ({
      ...prev,
      warrantyPeriodOptions: [...prev.warrantyPeriodOptions, trimmed],
    }));
    return { success: true };
  };

  const removeWarrantyPeriodOption = (option: string) => {
    setSystemSettings((prev) => ({
      ...prev,
      warrantyPeriodOptions: prev.warrantyPeriodOptions.filter((o) => o !== option),
    }));
  };

  // History Actions
  const reviseEstimate = (
    jobId: string,
    newEstimate: number,
    reason: string,
    changedBy: string,
    reApprovalRequired: boolean,
    reApprovalObtained: boolean
  ) => {
    const job = repairJobs.find((j) => j.id === jobId);
    if (!job) return { success: false, error: 'Repair job not found' };

    const revision: EstimateRevisionHistory = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      jobId,
      oldEstimate: job.estimatedCost,
      newEstimate,
      reason,
      changedBy: changedBy || currentUser?.name || 'Staff User',
      reApprovalRequired,
      reApprovalObtained,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setEstimateRevisions((prev) => [revision, ...prev]);

    setRepairJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          return {
            ...j,
            estimatedCost: newEstimate,
            estimateRevisions: [revision, ...(j.estimateRevisions || [])],
          };
        }
        return j;
      })
    );

    return { success: true };
  };

  const logNotification = (logData: Omit<NotificationLog, 'id' | 'timestamp'>) => {
    const newLog: NotificationLog = {
      ...logData,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setNotificationLogs((prev) => [newLog, ...prev]);
  };

  return (
    <GarageContext.Provider
      value={{
        customers,
        vehicles,
        vehicleChangeLogs,
        repairJobs,
        repairStatusHistory,
        invoices,
        inventory,
        stockTransactions,
        warranties,
        rolePermissions,
        roleDiscountPermissions,
        paymentRecords,
        paymentMethods,
        addPaymentMethod,
        updatePaymentMethod,
        togglePaymentMethodStatus,
        discountReasons,
        itemDiscounts,
        discountCampaigns,
        systemSettings,
        estimateRevisions,
        notificationLogs,
        appNotifications: userNotifications,
        unreadNotificationsCount,
        targetCustomerId,
        services,
        fetchNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        createTelegramConnectedNotification,
        linkCustomerTelegram,
        unlinkCustomerTelegram,
        setTargetCustomerId,
        navigateToCustomer,
        updateGarageInfoSettings,
        updateInvoiceSettings,
        updateTelegramBotSettings,
        addItemCategory,
        updateItemCategory,
        removeItemCategory,
        addRepairCategory,
        updateRepairCategory,
        removeRepairCategory,
        addWarrantyPeriodOption,
        removeWarrantyPeriodOption,
        reviseEstimate,
        logNotification,
        fetchCustomers,
        addCustomer,
        updateCustomer,
        deactivateCustomer,
        restoreCustomer,
        addVehicle,
        updateVehicle,
        addRepairJob,
        createRepairJob,
        getLeastLoadedMechanic,
        reassignMechanic,
        updateRepairJobStatus,
        updateRepairJobDetails,
        addInspectionRecord,
        addPartsToJob,
        addEmbeddedRepair,
        updateEmbeddedRepairStatus,
        addCustomerProvidedPartToJob,
        createInvoiceFromJob,
        updateInvoiceStatus,
        updateInvoiceDiscounts,
        recordPayment,
        simulatePayment,
        addDiscountReason,
        updateDiscountReason,
        reorderDiscountReasons,
        addItemDiscount,
        updateItemDiscount,
        addDiscountCampaign,
        updateDiscountCampaign,
        assignWarranty,
        updateWarranty,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        adjustStockQuantity,
        updateRolePermissions,
        toggleRolePermission,
        updateRoleDiscountPermission,
        resetRolePermissions,
      }}
    >
      {children}
    </GarageContext.Provider>
  );
};

export const useGarage = () => {
  const context = useContext(GarageContext);
  if (!context) {
    throw new Error('useGarage must be used within a GarageProvider');
  }
  return context;
};
