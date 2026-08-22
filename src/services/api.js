import axios from 'axios';

/**
 * Axios instance configured for the Laravel RESTful API
 * Base URL defaults to VITE_API_URL or local Laravel standard port (http://localhost:8000)
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 10000,
});

// Request interceptor to attach Bearer token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error formatting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized session / token expiration
      console.warn('Unauthorized API request - session may have expired.');
    }
    return Promise.reject(error);
  }
);

/* ==========================================================================
   REALISTIC MOCK DATA (MATCHING LARAVEL DATABASE SCHEMA EXACTLY)
   ========================================================================== */

let mockCustomers = [
  {
    id: 1,
    full_name: 'Sokha Chan',
    phone_number: '012-345-678',
    address: 'Street 271, Sangkat Phsar Doeum Thkov, Phnom Penh',
    telegram_chat_id: '987654321',
    telegram_linked: true,
    created_at: '2026-01-15T08:30:00.000Z',
  },
  {
    id: 2,
    full_name: 'Rithy Kem',
    phone_number: '098-765-432',
    address: 'Russian Blvd, Tuol Kouk, Phnom Penh',
    telegram_chat_id: '876543210',
    telegram_linked: true,
    created_at: '2026-02-01T10:15:00.000Z',
  },
  {
    id: 3,
    full_name: 'Bopha Vong',
    phone_number: '017-889-900',
    address: 'National Road 1, Chbar Ampov, Phnom Penh',
    telegram_chat_id: null,
    telegram_linked: false,
    created_at: '2026-02-18T14:45:00.000Z',
  },
  {
    id: 4,
    full_name: 'Chanthou Sam',
    phone_number: '015-443-221',
    address: 'Norodom Blvd, Boeung Keng Kang 1, Phnom Penh',
    telegram_chat_id: '765432109',
    telegram_linked: true,
    created_at: '2026-03-05T09:00:00.000Z',
  },
  {
    id: 5,
    full_name: 'Vanna Heng',
    phone_number: '077-123-999',
    address: 'Monivong Blvd, Prampi Makara, Phnom Penh',
    telegram_chat_id: null,
    telegram_linked: false,
    created_at: '2026-03-20T11:20:00.000Z',
  },
];

let mockVehicles = [
  {
    id: 1,
    customer_id: 1,
    plate_number: '2AB-1234',
    brand: 'Toyota',
    model: 'Camry',
    year: 2018,
    color: 'Silver',
    mileage: 65400,
    vin: '4T1B11HK5JU123456',
    created_at: '2026-01-15T08:30:00.000Z',
  },
  {
    id: 2,
    customer_id: 2,
    plate_number: '2BC-5678',
    brand: 'Lexus',
    model: 'RX350',
    year: 2020,
    color: 'White Pearl',
    mileage: 42300,
    vin: '2T2BZMCA4KC789012',
    created_at: '2026-02-01T10:15:00.000Z',
  },
  {
    id: 3,
    customer_id: 3,
    plate_number: '2CD-9012',
    brand: 'Ford',
    model: 'Ranger Wildtrak',
    year: 2021,
    color: 'Sedona Orange',
    mileage: 38900,
    vin: 'MNBUMFF50LW345678',
    created_at: '2026-02-18T14:45:00.000Z',
  },
  {
    id: 4,
    customer_id: 4,
    plate_number: '2DE-3456',
    brand: 'Mazda',
    model: 'CX-5',
    year: 2019,
    color: 'Soul Red Crystal',
    mileage: 51200,
    vin: 'JM3KFBCM9K0567890',
    created_at: '2026-03-05T09:00:00.000Z',
  },
  {
    id: 5,
    customer_id: 5,
    plate_number: '2EF-7890',
    brand: 'Honda',
    model: 'CR-V',
    year: 2022,
    color: 'Crystal Black',
    mileage: 21500,
    vin: '7FARW1H86NE123789',
    created_at: '2026-03-20T11:20:00.000Z',
  },
];

let mockRepairJobs = [
  {
    id: 1,
    job_type: 'repair',
    customer_id: 1,
    vehicle_id: 1,
    assigned_mechanic_id: 2,
    service_date: '2026-03-10',
    linked_from_job_id: null,
    customer_complaint: 'Squeaking noise coming from front brakes during moderate stopping.',
    inspection_result: 'Front brake pads worn down to 2mm. Brake rotors slightly grooved.',
    recommended_repair: 'Replace front ceramic brake pads and resurface both front rotors.',
    estimated_cost: 135.0,
    mechanic_notes: 'Caliper pins lubricated and cleaned. Brake fluid test passed at 1% moisture.',
    repair_details: 'Replaced front ceramic brake pads, cleaned rotors, bled brake lines.',
    total_cost: 135.0,
    inspection_fee: 15.0,
    job_status: 'completed',
    approval_status: 'approved',
    approval_date: '2026-03-10T09:15:00.000Z',
    approved_by: 1,
    approval_note: 'Customer confirmed via Telegram call.',
    completion_date: '2026-03-10T15:30:00.000Z',
    created_at: '2026-03-10T08:00:00.000Z',
  },
  {
    id: 2,
    job_type: 'service',
    customer_id: 2,
    vehicle_id: 2,
    assigned_mechanic_id: 3,
    service_date: '2026-03-12',
    linked_from_job_id: null,
    customer_complaint: 'Periodic 40,000km scheduled maintenance inspection.',
    inspection_result: 'Engine oil dark, cabin air filter clogged. Coolant level optimal.',
    recommended_repair: 'Full synthetic 5W-30 oil change, OEM oil filter, OEM cabin air filter replacement.',
    estimated_cost: 85.0,
    mechanic_notes: 'All fluid levels topped up. Tire pressure set to 33 PSI.',
    repair_details: 'Replaced 0W-20 synthetic oil, OEM oil filter, OEM air and cabin filters.',
    total_cost: 85.0,
    inspection_fee: 0.0,
    job_status: 'in_progress',
    approval_status: 'approved',
    approval_date: '2026-03-12T10:00:00.000Z',
    approved_by: 2,
    approval_note: 'Approved via Telegram WebApp instant confirmation.',
    completion_date: null,
    created_at: '2026-03-12T09:30:00.000Z',
  },
  {
    id: 3,
    job_type: 'inspection',
    customer_id: 3,
    vehicle_id: 3,
    assigned_mechanic_id: 2,
    service_date: '2026-03-14',
    linked_from_job_id: null,
    customer_complaint: 'Check engine light illuminated on dashboard; slight hesitation on acceleration.',
    inspection_result: 'OBD-II error code P0301 (Cylinder 1 Misfire). Spark plug #1 fouled.',
    recommended_repair: 'Replace 4x Iridium spark plugs and test ignition coil #1.',
    estimated_cost: 110.0,
    mechanic_notes: 'Pending customer approval before ordering NGK Laser Iridium plugs.',
    repair_details: null,
    total_cost: 0.0,
    inspection_fee: 20.0,
    job_status: 'waiting_approval',
    approval_status: 'pending',
    approval_date: null,
    approved_by: null,
    approval_note: null,
    completion_date: null,
    created_at: '2026-03-14T11:00:00.000Z',
  },
  {
    id: 4,
    job_type: 'repair',
    customer_id: 4,
    vehicle_id: 4,
    assigned_mechanic_id: 4,
    service_date: '2026-03-15',
    linked_from_job_id: null,
    customer_complaint: 'Air conditioning blowing warm air when idling in traffic.',
    inspection_result: 'A/C refrigerant pressure low (18 PSI). Small leak detected on high-pressure O-ring.',
    recommended_repair: 'Replace A/C condenser O-rings, vacuum system, and recharge R134a refrigerant.',
    estimated_cost: 95.0,
    mechanic_notes: 'System vacuum held at 29 inHg for 20 mins. Cold air measured at 6.8°C at center vent.',
    repair_details: 'Replaced O-rings, vacuum evacuated, recharged 550g R134a refrigerant.',
    total_cost: 95.0,
    inspection_fee: 10.0,
    job_status: 'delivered',
    approval_status: 'approved',
    approval_date: '2026-03-15T13:00:00.000Z',
    approved_by: 4,
    approval_note: 'Approved on site.',
    completion_date: '2026-03-15T16:45:00.000Z',
    created_at: '2026-03-15T11:30:00.000Z',
  },
  {
    id: 5,
    job_type: 'repair',
    customer_id: 5,
    vehicle_id: 5,
    assigned_mechanic_id: 2,
    service_date: '2026-03-16',
    linked_from_job_id: null,
    customer_complaint: 'Vehicle pulling slightly to the left at highway speeds.',
    inspection_result: 'Front left lower control arm bushing torn. Front wheel alignment toe-in off by 1.2 degrees.',
    recommended_repair: 'Replace left lower control arm and perform 4-wheel computer laser alignment.',
    estimated_cost: 160.0,
    mechanic_notes: 'Awaiting customer review of repair quotation.',
    repair_details: null,
    total_cost: 0.0,
    inspection_fee: 15.0,
    job_status: 'pending_inspection',
    approval_status: 'pending',
    approval_date: null,
    approved_by: null,
    approval_note: null,
    completion_date: null,
    created_at: '2026-03-16T08:45:00.000Z',
  },
];

let mockItems = [
  {
    id: 1,
    item_code: 'OIL-5W30-SYN',
    item_name: 'Mobil 1 Full Synthetic 5W-30 (4L)',
    category_id: 1,
    brand: 'Mobil 1',
    unit: 'Bottle',
    selling_price: 38.0,
    current_stock: 45,
    minimum_stock_alert: 10,
    status: 'active',
  },
  {
    id: 2,
    item_code: 'OIL-0W20-SYN',
    item_name: 'Castrol EDGE 0W-20 Advanced Full Synthetic (4L)',
    category_id: 1,
    brand: 'Castrol',
    unit: 'Bottle',
    selling_price: 42.0,
    current_stock: 32,
    minimum_stock_alert: 8,
    status: 'active',
  },
  {
    id: 3,
    item_code: 'FLT-OIL-TOY',
    item_name: 'Toyota OEM Oil Filter (04152-YZZA1)',
    category_id: 2,
    brand: 'Toyota Genuine',
    unit: 'Piece',
    selling_price: 9.5,
    current_stock: 58,
    minimum_stock_alert: 15,
    status: 'active',
  },
  {
    id: 4,
    item_code: 'BRK-PAD-CER-F',
    item_name: 'Brembo Ceramic Front Brake Pads',
    category_id: 3,
    brand: 'Brembo',
    unit: 'Set',
    selling_price: 65.0,
    current_stock: 14,
    minimum_stock_alert: 6,
    status: 'active',
  },
  {
    id: 5,
    item_code: 'BRK-PAD-CER-R',
    item_name: 'Brembo Ceramic Rear Brake Pads',
    category_id: 3,
    brand: 'Brembo',
    unit: 'Set',
    selling_price: 52.0,
    current_stock: 9,
    minimum_stock_alert: 5,
    status: 'active',
  },
  {
    id: 6,
    item_code: 'SPK-PLG-IRID',
    item_name: 'NGK Laser Iridium Spark Plug (ILKAR7B11)',
    category_id: 4,
    brand: 'NGK',
    unit: 'Piece',
    selling_price: 14.0,
    current_stock: 4,
    minimum_stock_alert: 12,
    status: 'low_stock',
  },
  {
    id: 7,
    item_code: 'FLT-CABIN-LEX',
    item_name: 'Lexus Activated Carbon Cabin Air Filter',
    category_id: 2,
    brand: 'Denso',
    unit: 'Piece',
    selling_price: 22.0,
    current_stock: 3,
    minimum_stock_alert: 8,
    status: 'low_stock',
  },
  {
    id: 8,
    item_code: 'GAS-R134A-13KG',
    item_name: 'DuPont Suva R134a Refrigerant Canister (13.6kg)',
    category_id: 5,
    brand: 'DuPont',
    unit: 'Tank',
    selling_price: 165.0,
    current_stock: 2,
    minimum_stock_alert: 3,
    status: 'low_stock',
  },
];

let mockInvoices = [
  {
    id: 1,
    repair_job_id: 1,
    invoice_number: 'INV-202603-0001',
    subtotal: 135.0,
    item_discount_total: 0.0,
    manual_discount_total: 10.0,
    whole_order_discount_total: 0.0,
    total_amount: 125.0,
    payment_status: 'paid',
    created_at: '2026-03-10T16:00:00.000Z',
  },
  {
    id: 2,
    repair_job_id: 4,
    invoice_number: 'INV-202603-0002',
    subtotal: 95.0,
    item_discount_total: 5.0,
    manual_discount_total: 0.0,
    whole_order_discount_total: 0.0,
    total_amount: 90.0,
    payment_status: 'paid',
    created_at: '2026-03-15T17:00:00.000Z',
  },
  {
    id: 3,
    repair_job_id: 2,
    invoice_number: 'INV-202603-0003',
    subtotal: 85.0,
    item_discount_total: 0.0,
    manual_discount_total: 0.0,
    whole_order_discount_total: 0.0,
    total_amount: 85.0,
    payment_status: 'unpaid',
    created_at: '2026-03-16T09:00:00.000Z',
  },
];

/* ==========================================================================
   STANDARD LARAVEL RESTFUL API SERVICE FUNCTIONS
   ========================================================================== */

/**
 * 1. CUSTOMERS API
 * --------------------------------------------------------------------------
 * GET  /api/customers
 * POST /api/customers
 */

/**
 * Fetch all customers
 * @param {Object} [params] Query filters (search, page, limit)
 * @returns {Promise<{ data: Array }>}
 */
export async function getCustomers(params = {}) {
  // --- REALISTIC MOCK RETURN ---
  let results = [...mockCustomers];
  if (params.search) {
    const s = params.search.toLowerCase();
    results = results.filter(
      (c) =>
        c.full_name.toLowerCase().includes(s) ||
        c.phone_number.toLowerCase().includes(s) ||
        (c.address && c.address.toLowerCase().includes(s))
    );
  }
  return Promise.resolve({ data: results });

  /*
  // --- LIVE LARAVEL AXIOS CALL ---
  // const response = await api.get('/api/customers', { params });
  // return response.data;
  */
}

/**
 * Create a new customer in Laravel backend
 * @param {Object} customerData Payload matching 'customers' DB schema
 * @param {string} customerData.full_name
 * @param {string} customerData.phone_number
 * @param {string} [customerData.address]
 * @param {string} [customerData.telegram_chat_id]
 * @param {boolean} [customerData.telegram_linked]
 * @returns {Promise<{ data: Object }>}
 */
export async function createCustomer(customerData) {
  // --- REALISTIC MOCK RETURN ---
  const newCustomer = {
    id: mockCustomers.length > 0 ? Math.max(...mockCustomers.map((c) => c.id)) + 1 : 1,
    full_name: customerData.full_name || '',
    phone_number: customerData.phone_number || '',
    address: customerData.address || '',
    telegram_chat_id: customerData.telegram_chat_id || null,
    telegram_linked: Boolean(customerData.telegram_linked),
    created_at: new Date().toISOString(),
  };
  mockCustomers.unshift(newCustomer);
  return Promise.resolve({ data: newCustomer });

  /*
  // --- LIVE LARAVEL AXIOS CALL ---
  // const response = await api.post('/api/customers', customerData);
  // return response.data;
  */
}

/**
 * Get a single customer by ID
 * @param {number|string} id
 */
export async function getCustomer(id) {
  // --- REALISTIC MOCK RETURN ---
  const customer = mockCustomers.find((c) => c.id === Number(id));
  if (!customer) return Promise.reject(new Error(`Customer #${id} not found`));
  return Promise.resolve({ data: customer });

  /*
  // --- LIVE LARAVEL AXIOS CALL ---
  // const response = await api.get(`/api/customers/${id}`);
  // return response.data;
  */
}

/**
 * 2. REPAIR JOBS API
 * --------------------------------------------------------------------------
 * GET  /api/repair-jobs
 * POST /api/repair-jobs
 * PUT  /api/repair-jobs/{id}
 */

/**
 * Fetch all repair jobs
 * @param {Object} [params] Query filters (status, job_type, customer_id, date_from, date_to)
 * @returns {Promise<{ data: Array }>}
 */
export async function getRepairJobs(params = {}) {
  // --- REALISTIC MOCK RETURN ---
  let results = [...mockRepairJobs];
  if (params.job_status) {
    results = results.filter((j) => j.job_status === params.job_status);
  }
  if (params.job_type) {
    results = results.filter((j) => j.job_type === params.job_type);
  }
  if (params.customer_id) {
    results = results.filter((j) => j.customer_id === Number(params.customer_id));
  }
  if (params.vehicle_id) {
    results = results.filter((j) => j.vehicle_id === Number(params.vehicle_id));
  }
  return Promise.resolve({ data: results });

  /*
  // --- LIVE LARAVEL AXIOS CALL ---
  // const response = await api.get('/api/repair-jobs', { params });
  // return response.data;
  */
}

/**
 * Create a new repair job
 * @param {Object} jobData Payload matching 'repair_jobs' DB schema
 * @param {('repair'|'service'|'inspection')} jobData.job_type
 * @param {number} jobData.customer_id
 * @param {number} jobData.vehicle_id
 * @param {number} [jobData.assigned_mechanic_id]
 * @param {string} jobData.service_date (YYYY-MM-DD)
 * @param {number} [jobData.linked_from_job_id]
 * @param {string} [jobData.customer_complaint]
 * @param {string} [jobData.inspection_result]
 * @param {string} [jobData.recommended_repair]
 * @param {number} [jobData.estimated_cost]
 * @param {string} [jobData.mechanic_notes]
 * @param {string} [jobData.repair_details]
 * @param {number} [jobData.total_cost]
 * @param {number} [jobData.inspection_fee]
 * @param {string} [jobData.job_status] ('pending_inspection'|'waiting_approval'|'in_progress'|'completed'|'delivered'|'declined')
 * @param {string} [jobData.approval_status] ('pending'|'approved'|'declined')
 * @param {string} [jobData.approval_date]
 * @param {number} [jobData.approved_by]
 * @param {string} [jobData.approval_note]
 * @param {string} [jobData.completion_date]
 * @returns {Promise<{ data: Object }>}
 */
export async function createRepairJob(jobData) {
  // --- REALISTIC MOCK RETURN ---
  const newJob = {
    id: mockRepairJobs.length > 0 ? Math.max(...mockRepairJobs.map((j) => j.id)) + 1 : 1,
    job_type: jobData.job_type || 'repair',
    customer_id: Number(jobData.customer_id),
    vehicle_id: Number(jobData.vehicle_id),
    assigned_mechanic_id: jobData.assigned_mechanic_id ? Number(jobData.assigned_mechanic_id) : null,
    service_date: jobData.service_date || new Date().toISOString().substring(0, 10),
    linked_from_job_id: jobData.linked_from_job_id ? Number(jobData.linked_from_job_id) : null,
    customer_complaint: jobData.customer_complaint || null,
    inspection_result: jobData.inspection_result || null,
    recommended_repair: jobData.recommended_repair || null,
    estimated_cost: jobData.estimated_cost !== undefined ? Number(jobData.estimated_cost) : 0.0,
    mechanic_notes: jobData.mechanic_notes || null,
    repair_details: jobData.repair_details || null,
    total_cost: jobData.total_cost !== undefined ? Number(jobData.total_cost) : 0.0,
    inspection_fee: jobData.inspection_fee !== undefined ? Number(jobData.inspection_fee) : 0.0,
    job_status: jobData.job_status || 'pending_inspection',
    approval_status: jobData.approval_status || 'pending',
    approval_date: jobData.approval_date || null,
    approved_by: jobData.approved_by ? Number(jobData.approved_by) : null,
    approval_note: jobData.approval_note || null,
    completion_date: jobData.completion_date || null,
    created_at: new Date().toISOString(),
  };
  mockRepairJobs.unshift(newJob);
  return Promise.resolve({ data: newJob });

  /*
  // --- LIVE LARAVEL AXIOS CALL ---
  // const response = await api.post('/api/repair-jobs', jobData);
  // return response.data;
  */
}

/**
 * Update an existing repair job
 * @param {number|string} id
 * @param {Object} updates Partial or full fields from 'repair_jobs' schema
 * @returns {Promise<{ data: Object }>}
 */
export async function updateRepairJob(id, updates) {
  // --- REALISTIC MOCK RETURN ---
  const index = mockRepairJobs.findIndex((j) => j.id === Number(id));
  if (index === -1) return Promise.reject(new Error(`Repair Job #${id} not found`));

  const updatedJob = {
    ...mockRepairJobs[index],
    ...updates,
    id: Number(id), // ensure ID is preserved
  };
  mockRepairJobs[index] = updatedJob;
  return Promise.resolve({ data: updatedJob });

  /*
  // --- LIVE LARAVEL AXIOS CALL ---
  // const response = await api.put(`/api/repair-jobs/${id}`, updates);
  // return response.data;
  */
}

/**
 * Get a single repair job by ID
 * @param {number|string} id
 */
export async function getRepairJob(id) {
  // --- REALISTIC MOCK RETURN ---
  const job = mockRepairJobs.find((j) => j.id === Number(id));
  if (!job) return Promise.reject(new Error(`Repair Job #${id} not found`));
  return Promise.resolve({ data: job });

  /*
  // --- LIVE LARAVEL AXIOS CALL ---
  // const response = await api.get(`/api/repair-jobs/${id}`);
  // return response.data;
  */
}

/**
 * 3. INVOICES API
 * --------------------------------------------------------------------------
 * GET /api/invoices
 * GET /api/invoices/{id}
 */

/**
 * Fetch all invoices
 * @param {Object} [params] Query filters (payment_status, date_from, date_to)
 * @returns {Promise<{ data: Array }>}
 */
export async function getInvoices(params = {}) {
  // --- REALISTIC MOCK RETURN ---
  let results = [...mockInvoices];
  if (params.payment_status) {
    results = results.filter((inv) => inv.payment_status === params.payment_status);
  }
  return Promise.resolve({ data: results });

  /*
  // --- LIVE LARAVEL AXIOS CALL ---
  // const response = await api.get('/api/invoices', { params });
  // return response.data;
  */
}

/**
 * Get a single invoice by ID
 * @param {number|string} id
 * @returns {Promise<{ data: Object }>}
 */
export async function getInvoice(id) {
  // --- REALISTIC MOCK RETURN ---
  const invoice = mockInvoices.find((inv) => inv.id === Number(id));
  if (!invoice) return Promise.reject(new Error(`Invoice #${id} not found`));
  return Promise.resolve({ data: invoice });

  /*
  // --- LIVE LARAVEL AXIOS CALL ---
  // const response = await api.get(`/api/invoices/${id}`);
  // return response.data;
  */
}

/**
 * Create a new invoice
 * @param {Object} invoiceData Payload matching 'invoices' DB schema
 * @param {number} invoiceData.repair_job_id
 * @param {string} invoiceData.invoice_number
 * @param {number} invoiceData.subtotal
 * @param {number} [invoiceData.item_discount_total]
 * @param {number} [invoiceData.manual_discount_total]
 * @param {number} [invoiceData.whole_order_discount_total]
 * @param {number} invoiceData.total_amount
 * @param {('unpaid'|'partial'|'paid'|'refunded'|'cancelled')} [invoiceData.payment_status]
 * @returns {Promise<{ data: Object }>}
 */
export async function createInvoice(invoiceData) {
  // --- REALISTIC MOCK RETURN ---
  const newInvoice = {
    id: mockInvoices.length > 0 ? Math.max(...mockInvoices.map((i) => i.id)) + 1 : 1,
    repair_job_id: Number(invoiceData.repair_job_id),
    invoice_number: invoiceData.invoice_number || `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(mockInvoices.length + 1).padStart(4, '0')}`,
    subtotal: Number(invoiceData.subtotal || 0),
    item_discount_total: Number(invoiceData.item_discount_total || 0),
    manual_discount_total: Number(invoiceData.manual_discount_total || 0),
    whole_order_discount_total: Number(invoiceData.whole_order_discount_total || 0),
    total_amount: Number(invoiceData.total_amount || 0),
    payment_status: invoiceData.payment_status || 'unpaid',
    created_at: new Date().toISOString(),
  };
  mockInvoices.unshift(newInvoice);
  return Promise.resolve({ data: newInvoice });

  /*
  // --- LIVE LARAVEL AXIOS CALL ---
  // const response = await api.post('/api/invoices', invoiceData);
  // return response.data;
  */
}

/**
 * 4. ITEMS (INVENTORY) API
 * --------------------------------------------------------------------------
 * GET /api/items
 */

/**
 * Fetch all inventory items
 * @param {Object} [params] Query filters (search, category_id, status)
 * @returns {Promise<{ data: Array }>}
 */
export async function getItems(params = {}) {
  // --- REALISTIC MOCK RETURN ---
  let results = [...mockItems];
  if (params.search) {
    const s = params.search.toLowerCase();
    results = results.filter(
      (item) =>
        item.item_name.toLowerCase().includes(s) ||
        item.item_code.toLowerCase().includes(s) ||
        item.brand.toLowerCase().includes(s)
    );
  }
  if (params.category_id) {
    results = results.filter((item) => item.category_id === Number(params.category_id));
  }
  if (params.status) {
    results = results.filter((item) => item.status === params.status);
  }
  return Promise.resolve({ data: results });

  /*
  // --- LIVE LARAVEL AXIOS CALL ---
  // const response = await api.get('/api/items', { params });
  // return response.data;
  */
}

/**
 * Get a single inventory item by ID
 * @param {number|string} id
 */
export async function getItem(id) {
  // --- REALISTIC MOCK RETURN ---
  const item = mockItems.find((i) => i.id === Number(id));
  if (!item) return Promise.reject(new Error(`Item #${id} not found`));
  return Promise.resolve({ data: item });

  /*
  // --- LIVE LARAVEL AXIOS CALL ---
  // const response = await api.get(`/api/items/${id}`);
  // return response.data;
  */
}

/**
 * 5. VEHICLES API (Companion resource for customers & repair jobs)
 * --------------------------------------------------------------------------
 * GET  /api/vehicles
 * POST /api/vehicles
 */

/**
 * Fetch all vehicles
 * @param {Object} [params] (customer_id, search)
 */
export async function getVehicles(params = {}) {
  // --- REALISTIC MOCK RETURN ---
  let results = [...mockVehicles];
  if (params.customer_id) {
    results = results.filter((v) => v.customer_id === Number(params.customer_id));
  }
  if (params.search) {
    const s = params.search.toLowerCase();
    results = results.filter(
      (v) =>
        v.plate_number.toLowerCase().includes(s) ||
        v.brand.toLowerCase().includes(s) ||
        v.model.toLowerCase().includes(s) ||
        v.vin.toLowerCase().includes(s)
    );
  }
  return Promise.resolve({ data: results });

  /*
  // --- LIVE LARAVEL AXIOS CALL ---
  // const response = await api.get('/api/vehicles', { params });
  // return response.data;
  */
}

/**
 * Create a new vehicle
 * @param {Object} vehicleData Payload matching 'vehicles' DB schema
 * @param {number} vehicleData.customer_id
 * @param {string} vehicleData.plate_number
 * @param {string} vehicleData.brand
 * @param {string} vehicleData.model
 * @param {number} vehicleData.year
 * @param {string} [vehicleData.color]
 * @param {number} [vehicleData.mileage]
 * @param {string} [vehicleData.vin]
 */
export async function createVehicle(vehicleData) {
  // --- REALISTIC MOCK RETURN ---
  const newVehicle = {
    id: mockVehicles.length > 0 ? Math.max(...mockVehicles.map((v) => v.id)) + 1 : 1,
    customer_id: Number(vehicleData.customer_id),
    plate_number: vehicleData.plate_number || '',
    brand: vehicleData.brand || '',
    model: vehicleData.model || '',
    year: Number(vehicleData.year || new Date().getFullYear()),
    color: vehicleData.color || '',
    mileage: Number(vehicleData.mileage || 0),
    vin: vehicleData.vin || '',
    created_at: new Date().toISOString(),
  };
  mockVehicles.unshift(newVehicle);
  return Promise.resolve({ data: newVehicle });

  /*
  // --- LIVE LARAVEL AXIOS CALL ---
  // const response = await api.post('/api/vehicles', vehicleData);
  // return response.data;
  */
}

/* ==========================================================================
   6. TELEGRAM NOTIFICATIONS & LINKING API (PHASE 7)
   ========================================================================== */

export async function getTelegramStatus() {
  const response = await api.get('/api/telegram/status');
  return response.data;
}

export async function linkTelegramCustomer(customerId, data) {
  const response = await api.post(`/api/customers/${customerId}/telegram-link`, data);
  return response.data;
}

export async function unlinkTelegramCustomer(customerId) {
  const response = await api.post(`/api/customers/${customerId}/telegram-unlink`);
  return response.data;
}

export async function sendTelegramTestAlert(customerId) {
  const response = await api.post('/api/telegram/test-alert', { customer_id: customerId });
  return response.data;
}

export async function getNotificationLogs(params = {}) {
  const response = await api.get('/api/notification-logs', { params });
  return response.data;
}

/* ==========================================================================
   7. DASHBOARD API (PHASE 8)
   ========================================================================== */

export async function getDashboardOverview(params = {}) {
  const response = await api.get('/api/dashboard/overview', { params });
  return response.data;
}

export async function getAdvisorDashboard() {
  const response = await api.get('/api/dashboard/advisor');
  return response.data;
}

export async function getMechanicDashboard() {
  const response = await api.get('/api/dashboard/mechanic');
  return response.data;
}

export async function getPartsDashboard() {
  const response = await api.get('/api/dashboard/parts');
  return response.data;
}

export async function getCustomerDashboard() {
  const response = await api.get('/api/dashboard/customer');
  return response.data;
}

/* ==========================================================================
   8. REPORTS & ANALYTICS API (PHASE 8)
   ========================================================================== */

export async function getRevenueReport(params = {}) {
  const response = await api.get('/api/reports/revenue', { params });
  return response.data;
}

export async function getRepairsReport(params = {}) {
  const response = await api.get('/api/reports/repairs', { params });
  return response.data;
}

export async function getMechanicsReport(params = {}) {
  const response = await api.get('/api/reports/mechanics', { params });
  return response.data;
}

export async function getInventoryReport(params = {}) {
  const response = await api.get('/api/reports/inventory', { params });
  return response.data;
}

export function getReportExportUrl(type = 'revenue', params = {}) {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const query = new URLSearchParams({ type, ...params }).toString();
  return `${baseUrl}/api/reports/export?${query}`;
}

/* ==========================================================================
   9. SYSTEM SETTINGS API (PHASE 8)
   ========================================================================== */

export async function getSystemSettings() {
  const response = await api.get('/api/settings');
  return response.data;
}

export async function updateSystemSettings(group, data) {
  const response = await api.put(`/api/settings/${group}`, data);
  return response.data;
}

/* ==========================================================================
   10. ROLE PERMISSIONS API (OWNER / ADMIN CONTROLLED)
   ========================================================================== */

export async function getRolePermissions() {
  const response = await api.get('/api/permissions/roles');
  return response.data;
}

export async function updateRolePermissions(role, permissions) {
  const response = await api.put(`/api/permissions/roles/${role}`, {
    permissions,
  });
  return response.data;
}

export async function saveRolePermissions(payload = {}) {
  const response = await api.put('/api/permissions/roles', payload);
  return response.data;
}

// Export the base axios instance for custom requests
export default api;

