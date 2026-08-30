export type UserRole = 'admin' | 'advisor' | 'mechanic' | 'parts_manager' | 'customer' | 'owner' | 'staff';

export type DashboardDateFilterPreset = 'today' | 'week' | 'month' | 'custom';

export interface DashboardDateRange {
  date_preset?: DashboardDateFilterPreset;
  date_from?: string;
  date_to?: string;
}

export interface DashboardOverview {
  newCustomers: number;
  newVehicles: number;
  statusCounts: Record<string, number>;
  revenue: number;
  lowStockItems: Array<{ name: string; stock: number }>;
}

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'deactivated';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  permissions?: ModulePermissionId[];
  avatarUrl?: string;
  phone: string;
  telegramHandle?: string;
  department?: string;
  status: UserStatus;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Customer {
  id: string; // e.g. CUST-1001
  fullName: string;
  phone: string;
  address?: string;
  telegramChatId?: string;
  telegramChatIdMasked?: string;
  telegramHandle?: string;
  telegramLinked: boolean;
  telegramConnectedAt?: string;
  isDeactivated?: boolean;
  status?: 'active' | 'deactivated';
  deletedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Vehicle {
  id: string; // e.g. VEH-2001
  customerId: string;
  customerName: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  mileage: number;
  vin?: string;
  createdAt: string;
}

export interface VehicleChangeLog {
  id: string;
  vehicleId: string;
  field: 'mileage' | 'vin' | string;
  oldValue: string | number;
  newValue: string | number;
  changedBy: string;
  timestamp: string;
}

export interface InspectionRecord {
  id: string;
  jobId: string;
  inspectionResult?: string;
  diagnosticNotes: string;
  recommendedRepairs?: string;
  mileageAtInspection?: number;
  photos?: string[];
  warrantyInfo?: string;
  partsUsed: Array<{ partId: string; partName: string; quantity: number; unitPrice: number }>;
  laborHours: number;
  laborCost: number;
  mechanicNotes: string;
  recordedBy: string;
  recordedAt: string;
}

export interface MechanicAssignmentHistory {
  id: string;
  jobId: string;
  oldMechanicId?: string;
  oldMechanicName?: string;
  newMechanicId: string;
  newMechanicName: string;
  changedBy: string;
  reason: string;
  timestamp: string;
}

export interface RepairStatusHistory {
  id: string;
  jobId: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  timestamp: string;
  note?: string;
}

export interface UsedPart {
  partId: string;
  partNumber: string;
  partName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isCustomerProvided?: boolean;
  customerPartRef?: string; // e.g. CP-2026-000123
  brand?: string;
  condition?: 'New' | 'Used';
  notes?: string;
  dateReceived?: string;
  recordedBy?: string;
  confirmedByCustomer?: boolean;
  itemDiscountAmount?: number;
  manualDiscountAmount?: number;
  manualDiscountType?: 'fixed' | 'percentage';
  manualDiscountValue?: number;
  manualDiscountReason?: string;
}

export interface EmbeddedRepair {
  id: string;
  jobId?: string;
  inspectionFindings: string;
  recommendedRepair: string;
  estimatedCost: number;
  status: 'waiting_approval' | 'approved' | 'in_progress' | 'declined';
  notes?: string;
  createdAt: string;
  createdBy?: string;
  approvedAt?: string;
  declinedAt?: string;
}

export interface GarageService {
  id: string;
  name: string;
  category?: string;
  basePrice: number;
}

export interface PerformedService {
  serviceId?: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemDiscountAmount?: number;
  manualDiscountAmount?: number;
  manualDiscountType?: 'fixed' | 'percentage';
  manualDiscountValue?: number;
  manualDiscountReason?: string;
}

export interface EstimateRevisionHistory {
  id: string;
  jobId: string;
  oldEstimate: number;
  newEstimate: number;
  reason: string;
  changedBy: string;
  reApprovalRequired: boolean;
  reApprovalObtained: boolean;
  timestamp: string;
}

export interface NotificationLog {
  id: string;
  jobId?: string;
  invoiceId?: string;
  customerName: string;
  telegramHandle?: string;
  notificationType: string;
  messageSnippet: string;
  timestamp: string;
  deliveryStatus: 'Sent' | 'Failed';
}

export interface GarageInfoSettings {
  garageName: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  currency: string;
  logoUrl?: string;
  businessHours: string;
}

export interface InvoiceSettings {
  prefix: string;
  taxRatePercent: number;
  paymentTerms: string;
  headerNote: string;
  footerDisclaimer: string;
}

export interface TelegramBotSettings {
  botToken: string;
  chatId: string;
  autoNotifyInspection: boolean;
  autoNotifyJobComplete: boolean;
  autoNotifyPayment: boolean;
  enabled: boolean;
}

export interface SystemSettings {
  garageInfo: GarageInfoSettings;
  invoiceSettings: InvoiceSettings;
  telegramBot: TelegramBotSettings;
  itemCategories: string[];
  repairCategories: string[];
  warrantyPeriodOptions: string[];
}

export interface PaymentRecord {
  id: string; // e.g. PAY-1001
  repairJobId: string;
  invoiceId?: string;
  amount: number;
  date: string; // YYYY-MM-DD
  method: string; // 'Cash', 'ABA', 'Acleda', 'Credit Card', 'Bank Transfer', etc.
  type: 'deposit' | 'partial' | 'final';
  notes?: string;
  recordedBy: string;
  recordedAt: string;
}

export interface PaymentMethodConfig {
  id: string;
  name: string;
  isDefault?: boolean;
  status: 'active' | 'deactivated';
}

export interface DiscountReason {
  id: string;
  reason: string;
  status: 'active' | 'deactivated';
  displayOrder: number;
}

export interface ItemServiceDiscount {
  id: string;
  name: string;
  targetType: 'item' | 'service' | 'category';
  targetId: string; // part SKU / service name / category name
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'deactivated';
}

export interface DiscountCampaign {
  id: string;
  name: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'deactivated';
}

export type JobType = 'service' | 'repair';

export interface RepairJob {
  id: string;
  jobNumber: string;
  jobType?: JobType; // 'service' | 'repair'
  serviceDate?: string; // Service Date YYYY-MM-DD
  linkedRepairJobId?: string; // If created as linked job from Service Job
  vehicleId?: string;
  vehicleMake: string;
  vehicleModel: string;
  licensePlate: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  assignedMechanicId?: string;
  assignedMechanicName?: string;
  status:
    | 'pending_inspection'
    | 'waiting_approval'
    | 'in_progress'
    | 'completed'
    | 'delivered'
    | 'declined';
  receivedDate?: string;
  customerComplaint?: string;
  inspectionResult?: string;
  repairDetails?: string;
  recommendedRepairs?: string;
  inspectionNotes?: string;
  servicesPerformed?: PerformedService[];
  partsUsed?: UsedPart[];
  inspectionFee?: number;
  laborHours?: number;
  laborCost?: number;
  totalRepairCost?: number;
  completionDate?: string;
  deliveredAt?: string;
  declinedAt?: string;
  declineReason?: string;
  estimatedCost: number;
  entryDate: string;
  estimatedCompletion: string;
  description: string;
  telegramNotified: boolean;
  telegramNotifiedAt?: string;
  telegramNotificationStatus?: 'Sent' | 'Failed';
  embeddedRepairs?: EmbeddedRepair[];
  inspectionRecords?: InspectionRecord[];
  mechanicAssignmentHistory?: MechanicAssignmentHistory[];
  statusHistory?: RepairStatusHistory[];
  estimateRevisions?: EstimateRevisionHistory[];
}

export interface Invoice {
  id: string; // e.g. INV-3001
  repairJobId: string;
  repairJobNumber: string;
  customerId: string;
  customerName: string;
  vehicleInfo: string;
  repairDetails?: string;
  servicesPerformed?: PerformedService[];
  partsUsed?: UsedPart[];
  laborHours?: number;
  laborCost?: number;
  inspectionFee?: number;

  // Amount breakdown
  subtotal: number;
  itemDiscountsTotal: number;
  manualDiscountsTotal: number;
  campaignDiscountTotal: number;
  totalDiscount: number;
  taxableAmount: number;
  tax: number;
  totalAmount: number;

  // Payment tracking
  totalPaid: number;
  balanceRemaining: number;
  status: 'unpaid' | 'partially_paid' | 'paid' | 'cancelled';
  paymentMethod?: string;

  // Discounts info
  campaignId?: string;
  campaignName?: string;
  manualDiscountAmount?: number;
  manualDiscountType?: 'fixed' | 'percentage';
  manualDiscountValue?: number;
  manualDiscountReason?: string;

  issuedAt: string;
  paidAt?: string;
  notes?: string;
}

export interface Warranty {
  id: string; // e.g. WAR-1001
  repairJobId: string;
  repairJobNumber: string;
  vehicleId?: string;
  vehicleInfo: string;
  customerName: string;
  startDate: string;
  endDate: string;
  period: string; // e.g. "12 Months / 12,000 Miles"
  status: 'active' | 'expired';
  notes?: string;
  assignedBy: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  partNumber: string; // Item Code
  name: string; // Item Name
  category: string;
  brand?: string; // Brand (Optional)
  unit?: string; // Unit e.g. Pcs, Set, Liter, Kit
  stock: number; // Current Stock
  minStock: number; // Minimum Stock Alert
  unitPrice: number; // Selling Price
  location: string;
  status?: 'active' | 'deactivated';
  sku?: string;
  sellingPrice?: number;
}

export interface StockTransaction {
  id: string;
  partId: string;
  partNumber: string;
  partName: string;
  type: 'stock_in' | 'adjustment' | 'usage';
  quantity: number;
  supplier?: string;
  reason?: string;
  performedBy: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  module: 'Customer' | 'Vehicle' | 'Repair Job' | 'Payment' | 'Telegram' | 'User' | 'System';
  reference?: string;
  previousValue?: string;
  newValue?: string;
  details?: string;
  ipAddress?: string;
}

export interface RoleDiscountPermission {
  can_apply_manual_discount: boolean;
  max_manual_discount_percent: number;
}

export type ModulePermissionId =
  | 'dashboard'
  | 'customers'
  | 'vehicles'
  | 'repairs'
  | 'invoices'
  | 'inventory'
  | 'stock_in'
  | 'stock'
  | 'reports'
  | 'telegram'
  | 'users'
  | 'settings'
  | 'audit';

export type RolePermissionsMap = Record<string, ModulePermissionId[]>;
export type RoleDiscountPermissionsMap = Record<string, RoleDiscountPermission>;

export interface RolePermissionSaveResult {
  success: boolean;
  error?: string;
}

export const ALL_MODULE_PERMISSION_IDS: ModulePermissionId[] = [
  'dashboard',
  'customers',
  'vehicles',
  'repairs',
  'invoices',
  'inventory',
  'stock_in',
  'stock',
  'reports',
  'telegram',
  'users',
  'settings',
  'audit',
];

/* ==========================================================================
   LARAVEL DATABASE SCHEMA TYPES (SNAKE_CASE FOR RESTFUL API)
   ========================================================================== */

export interface LaravelCustomerSchema {
  id: number;
  full_name: string;
  phone_number: string;
  address?: string | null;
  telegram_chat_id?: string | null;
  telegram_linked: boolean;
  created_at: string;
}

export interface LaravelVehicleSchema {
  id: number;
  customer_id: number;
  plate_number: string;
  brand: string;
  model: string;
  year: number;
  color?: string | null;
  mileage?: number;
  vin?: string | null;
  created_at: string;
}

export interface LaravelRepairJobSchema {
  id: number;
  job_type: 'repair' | 'service' | 'inspection';
  customer_id: number;
  vehicle_id: number;
  assigned_mechanic_id?: number | null;
  service_date: string;
  linked_from_job_id?: number | null;
  customer_complaint?: string | null;
  inspection_result?: string | null;
  recommended_repair?: string | null;
  estimated_cost?: number;
  mechanic_notes?: string | null;
  repair_details?: string | null;
  total_cost?: number;
  inspection_fee?: number;
  job_status: 'pending_inspection' | 'waiting_approval' | 'in_progress' | 'completed' | 'delivered' | 'declined';
  approval_status?: string | null;
  approval_date?: string | null;
  approved_by?: number | null;
  approval_note?: string | null;
  completion_date?: string | null;
  created_at: string;
}

export interface LaravelItemSchema {
  id: number;
  item_code: string;
  item_name: string;
  category_id?: number | null;
  brand?: string | null;
  unit?: string | null;
  selling_price: number;
  current_stock: number;
  minimum_stock_alert: number;
  status: string;
}

export interface LaravelInvoiceSchema {
  id: number;
  repair_job_id: number;
  invoice_number: string;
  subtotal: number;
  item_discount_total?: number;
  manual_discount_total?: number;
  whole_order_discount_total?: number;
  total_amount: number;
  payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded' | 'cancelled';
  created_at: string;
}
