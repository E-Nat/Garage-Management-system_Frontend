import { AxiosInstance } from 'axios';

export interface LaravelCustomer {
  id: number;
  full_name: string;
  phone_number: string;
  address?: string | null;
  telegram_chat_id?: string | null;
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
  selling_price: number;
  current_stock: number;
  minimum_stock_alert: number;
  status: string;
}

export interface LaravelInvoice {
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

export declare function getCustomers(params?: Record<string, any>): Promise<{ data: LaravelCustomer[] }>;
export declare function createCustomer(data: Partial<LaravelCustomer>): Promise<{ data: LaravelCustomer }>;
export declare function getCustomer(id: number | string): Promise<{ data: LaravelCustomer }>;

export declare function getRepairJobs(params?: Record<string, any>): Promise<{ data: LaravelRepairJob[] }>;
export declare function createRepairJob(data: Partial<LaravelRepairJob>): Promise<{ data: LaravelRepairJob }>;
export declare function updateRepairJob(id: number | string, data: Partial<LaravelRepairJob>): Promise<{ data: LaravelRepairJob }>;
export declare function getRepairJob(id: number | string): Promise<{ data: LaravelRepairJob }>;

export declare function getInvoices(params?: Record<string, any>): Promise<{ data: LaravelInvoice[] }>;
export declare function getInvoice(id: number | string): Promise<{ data: LaravelInvoice }>;
export declare function createInvoice(data: Partial<LaravelInvoice>): Promise<{ data: LaravelInvoice }>;

export declare function getItems(params?: Record<string, any>): Promise<{ data: LaravelItem[] }>;
export declare function getItem(id: number | string): Promise<{ data: LaravelItem }>;

export declare function getVehicles(params?: Record<string, any>): Promise<{ data: LaravelVehicle[] }>;
export declare function createVehicle(data: Partial<LaravelVehicle>): Promise<{ data: LaravelVehicle }>;

declare const api: AxiosInstance;
export default api;
