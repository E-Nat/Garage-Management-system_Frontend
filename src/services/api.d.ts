import { AxiosInstance } from 'axios';

export interface LaravelCustomer {
  id: number;
  full_name: string;
  phone_number: string;
  address?: string | null;
  telegram_chat_id?: string | null;
  telegram_handle?: string | null;
  telegram_linked: boolean;
  created_at: string;
}

export interface LaravelVehicle {
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

export interface LaravelRepairJob {
  id: number;
  job_number?: string;
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

export interface LaravelItem {
  id: number;
  item_code: string;
  item_name: string;
  category_id?: number | null;
  brand?: string | null;
  unit?: string | null;
  purchase_price?: number;
  selling_price: number;
  current_stock: number;
  minimum_stock_alert: number;
  location?: string | null;
  status: string;
}

export interface LaravelInvoice {
  id: number;
  repair_job_id: number;
  customer_id?: number;
  invoice_number: string;
  subtotal: number;
  item_discount_total?: number;
  manual_discount_total?: number;
  manual_discount_type?: 'fixed' | 'percentage';
  manual_discount_value?: number;
  manual_discount_reason?: string;
  whole_order_discount_total?: number;
  taxable_amount?: number;
  tax_rate?: number;
  tax_amount?: number;
  total_amount: number;
  total_paid?: number;
  balance_remaining?: number;
  payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded' | 'cancelled';
  created_at: string;
}

export interface LaravelPayment {
  id: number;
  payment_number?: string;
  repair_job_id?: number;
  invoice_id: number;
  payment_method_id?: number;
  payment_method: string;
  amount: number;
  payment_date: string;
  payment_type?: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  reference_number?: string;
  created_at: string;
}

export interface LaravelNotificationLog {
  id: number;
  customer_id?: number;
  user_id?: number;
  repair_job_id?: number;
  invoice_id?: number;
  recipient_name: string;
  recipient_chat_id: string;
  notification_type: string;
  title: string;
  message_snippet: string;
  delivery_status: 'sent' | 'failed';
  error_details?: string | null;
  sent_at?: string;
  created_at: string;
}

export interface LaravelSystemSettings {
  garage_info: {
    garage_name: string;
    address: string;
    phone: string;
    email: string;
    tax_id?: string;
    currency?: string;
    business_hours?: string;
    logo_url?: string;
  };
  invoice_settings: {
    prefix: string;
    tax_rate_percent: number;
    payment_terms?: string;
    header_note?: string;
    footer_disclaimer?: string;
  };
  telegram_settings: {
    bot_token?: string;
    bot_token_masked?: string;
    chat_id?: string;
    notifications_enabled: boolean;
    events?: Record<string, boolean>;
  };
}

// 1. Customers API
export declare function getCustomers(params?: Record<string, any>): Promise<{ data: LaravelCustomer[] }>;
export declare function createCustomer(data: Partial<LaravelCustomer>): Promise<{ data: LaravelCustomer }>;
export declare function getCustomer(id: number | string): Promise<{ data: LaravelCustomer }>;
export declare function updateCustomer(id: number | string, data: Partial<LaravelCustomer>): Promise<{ data: LaravelCustomer }>;

// 2. Vehicles API
export declare function getVehicles(params?: Record<string, any>): Promise<{ data: LaravelVehicle[] }>;
export declare function createVehicle(data: Partial<LaravelVehicle>): Promise<{ data: LaravelVehicle }>;
export declare function getVehicle(id: number | string): Promise<{ data: LaravelVehicle }>;
export declare function updateVehicle(id: number | string, data: Partial<LaravelVehicle>): Promise<{ data: LaravelVehicle }>;

// 3. Repair Jobs API
export declare function getRepairJobs(params?: Record<string, any>): Promise<{ data: LaravelRepairJob[] }>;
export declare function createRepairJob(data: Partial<LaravelRepairJob>): Promise<{ data: LaravelRepairJob }>;
export declare function updateRepairJob(id: number | string, data: Partial<LaravelRepairJob>): Promise<{ data: LaravelRepairJob }>;
export declare function getRepairJob(id: number | string): Promise<{ data: LaravelRepairJob }>;
export declare function addRepairJobPart(jobId: number | string, data: Record<string, any>): Promise<{ data: any }>;

// 4. Invoices & Payments API
export declare function getInvoices(params?: Record<string, any>): Promise<{ data: LaravelInvoice[] }>;
export declare function getInvoice(id: number | string): Promise<{ data: LaravelInvoice }>;
export declare function createInvoice(data: Partial<LaravelInvoice>): Promise<{ data: LaravelInvoice }>;
export declare function applyInvoiceDiscounts(id: number | string, data: Record<string, any>): Promise<{ data: LaravelInvoice }>;
export declare function getPayments(params?: Record<string, any>): Promise<{ data: LaravelPayment[] }>;
export declare function createPayment(data: Partial<LaravelPayment>): Promise<{ data: LaravelPayment }>;

// 5. Inventory Items API
export declare function getItems(params?: Record<string, any>): Promise<{ data: LaravelItem[] }>;
export declare function getItem(id: number | string): Promise<{ data: LaravelItem }>;
export declare function createItem(data: Partial<LaravelItem>): Promise<{ data: LaravelItem }>;
export declare function updateItem(id: number | string, data: Partial<LaravelItem>): Promise<{ data: LaravelItem }>;
export declare function deleteItem(id: number | string): Promise<{ success: boolean }>;

// 6. Telegram API
export declare function getTelegramStatus(): Promise<{ success: boolean; data: any }>;
export declare function linkTelegramCustomer(customerId: number | string, data: { telegram_chat_id?: string; telegram_handle?: string }): Promise<{ success: boolean; data: LaravelCustomer }>;
export declare function unlinkTelegramCustomer(customerId: number | string): Promise<{ success: boolean; data: LaravelCustomer }>;
export declare function sendTelegramTestAlert(customerId: number | string): Promise<{ success: boolean; data: LaravelNotificationLog }>;
export declare function getNotificationLogs(params?: Record<string, any>): Promise<{ data: LaravelNotificationLog[]; meta?: any }>;

// 7. Dashboard API (Phase 8)
export declare function getDashboardOverview(params?: { date_preset?: string; date_from?: string; date_to?: string }): Promise<{ success: boolean; data: any }>;
export declare function getAdvisorDashboard(): Promise<{ success: boolean; data: any }>;
export declare function getMechanicDashboard(): Promise<{ success: boolean; data: any }>;
export declare function getPartsDashboard(): Promise<{ success: boolean; data: any }>;
export declare function getCustomerDashboard(): Promise<{ success: boolean; data: any }>;

// 8. Reports API (Phase 8)
export declare function getRevenueReport(params?: Record<string, any>): Promise<{ success: boolean; data: any }>;
export declare function getRepairsReport(params?: Record<string, any>): Promise<{ success: boolean; data: any }>;
export declare function getMechanicsReport(params?: Record<string, any>): Promise<{ success: boolean; data: any }>;
export declare function getInventoryReport(params?: Record<string, any>): Promise<{ success: boolean; data: any }>;
export declare function getReportExportUrl(type: 'revenue' | 'repairs' | 'inventory', params?: Record<string, any>): string;

// 9. System Settings API (Phase 8)
export declare function getSystemSettings(): Promise<{ success: boolean; data: LaravelSystemSettings }>;
export declare function updateSystemSettings(group: 'garage' | 'invoice' | 'telegram', data: Record<string, any>): Promise<{ success: boolean; message: string; data: any }>;

declare const api: AxiosInstance;
export default api;
