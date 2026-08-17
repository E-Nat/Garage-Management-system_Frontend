import React, { useState, useMemo } from 'react';
import { useGarage } from '../../context/GarageContext';
import { useAuth } from '../../context/AuthContext';
import { Customer, Vehicle } from '../../types';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Phone,
  MapPin,
  Send,
  Car,
  CheckCircle2,
  X,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  ExternalLink,
  Link2,
  QrCode,
  ArrowLeft,
  Plus,
  Check,
  UserCheck,
  Hash,
  Shield,
  Sparkles,
  Info,
} from 'lucide-react';

export const CustomerManagement: React.FC = () => {
  const { customers, vehicles, addCustomer, updateCustomer, addVehicle, updateVehicle } = useGarage();
  const { currentUser } = useAuth();

  // Navigation / View State
  // 'list' | 'customer_details' | 'vehicle_details'
  const [activeView, setActiveView] = useState<'list' | 'customer_details' | 'vehicle_details'>('list');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // Unified Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [isEditVehicleModalOpen, setIsEditVehicleModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);

  // Customer Edit State
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editCustomerFullName, setEditCustomerFullName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editCustomerAddress, setEditCustomerAddress] = useState('');
  const [editCustomerError, setEditCustomerError] = useState('');

  // Vehicle Edit State
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editVehiclePlate, setEditVehiclePlate] = useState('');
  const [editVehicleBrand, setEditVehicleBrand] = useState('');
  const [editVehicleModel, setEditVehicleModel] = useState('');
  const [editVehicleYear, setEditVehicleYear] = useState<number | string>('');
  const [editVehicleColor, setEditVehicleColor] = useState('');
  const [editVehicleMileage, setEditVehicleMileage] = useState<number | string>('');
  const [editVehicleVin, setEditVehicleVin] = useState('');
  const [editVehicleError, setEditVehicleError] = useState('');

  // Register Form State (Customer + Vehicle)
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  
  const [regPlate, setRegPlate] = useState('');
  const [regBrand, setRegBrand] = useState('');
  const [regModel, setRegModel] = useState('');
  const [regYear, setRegYear] = useState<string>(new Date().getFullYear().toString());
  const [regColor, setRegColor] = useState('');
  const [regMileage, setRegMileage] = useState('');
  const [regVin, setRegVin] = useState('');

  // Form Validation Errors
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});
  const [selectedExistingCustomer, setSelectedExistingCustomer] = useState<Customer | null>(null);

  // Add Vehicle to Existing Customer Modal State
  const [addVehCustomer, setAddVehCustomer] = useState<Customer | null>(null);
  const [addVehPlate, setAddVehPlate] = useState('');
  const [addVehBrand, setAddVehBrand] = useState('');
  const [addVehModel, setAddVehModel] = useState('');
  const [addVehYear, setAddVehYear] = useState<string>(new Date().getFullYear().toString());
  const [addVehColor, setAddVehColor] = useState('');
  const [addVehMileage, setAddVehMileage] = useState('');
  const [addVehVin, setAddVehVin] = useState('');
  const [addVehErrors, setAddVehErrors] = useState<Record<string, string>>({});

  // Telegram Linking Modal State
  const [telegramCustomer, setTelegramCustomer] = useState<Customer | null>(null);
  const [telegramSimulatedStep, setTelegramSimulatedStep] = useState<number>(1);

  // Helper to get selected customer & vehicle objects
  const activeCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const activeVehicle = useMemo(() => {
    if (!selectedVehicleId) return null;
    return vehicles.find((v) => v.id === selectedVehicleId) || null;
  }, [vehicles, selectedVehicleId]);

  // Real-time Existing Customer Detection when registering
  const detectedExistingCustomer = useMemo(() => {
    if (!regPhone.trim() || regPhone.trim().length < 3) return null;
    const cleanInput = regPhone.replace(/\D/g, '');
    if (!cleanInput) return null;
    return customers.find((c) => c.phone.replace(/\D/g, '') === cleanInput) || null;
  }, [regPhone, customers]);

  // Handle Search Filtering
  const cleanSearch = searchTerm.trim().toLowerCase();
  
  const searchMatchingVehicles = useMemo(() => {
    if (!cleanSearch) return [];
    return vehicles.filter(
      (v) =>
        v.plateNumber.toLowerCase().includes(cleanSearch) ||
        v.brand.toLowerCase().includes(cleanSearch) ||
        v.model.toLowerCase().includes(cleanSearch) ||
        (v.vin && v.vin.toLowerCase().includes(cleanSearch))
    );
  }, [vehicles, cleanSearch]);

  const filteredCustomers = useMemo(() => {
    if (!cleanSearch) return customers;

    return customers.filter((c) => {
      const nameMatch = c.fullName.toLowerCase().includes(cleanSearch);
      const phoneMatch = c.phone.toLowerCase().includes(cleanSearch);
      const addressMatch = Boolean(c.address && c.address.toLowerCase().includes(cleanSearch));
      
      // Match if customer owns a vehicle with matching plate number
      const ownsMatchingVehicle = vehicles.some(
        (v) =>
          (v.customerId === c.id || v.customerName.toLowerCase() === c.fullName.toLowerCase()) &&
          (v.plateNumber.toLowerCase().includes(cleanSearch) ||
            v.brand.toLowerCase().includes(cleanSearch) ||
            v.model.toLowerCase().includes(cleanSearch))
      );

      return nameMatch || phoneMatch || addressMatch || ownsMatchingVehicle;
    });
  }, [customers, vehicles, cleanSearch]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Open Register Customer & Vehicle Modal
  const handleOpenRegisterModal = () => {
    setRegFullName('');
    setRegPhone('');
    setRegAddress('');
    setRegPlate('');
    setRegBrand('');
    setRegModel('');
    setRegYear(new Date().getFullYear().toString());
    setRegColor('');
    setRegMileage('');
    setRegVin('');
    setRegErrors({});
    setSelectedExistingCustomer(null);
    setIsRegisterModalOpen(true);
  };

  // Submit Register Customer & Vehicle Form
  const handleSubmitRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!selectedExistingCustomer) {
      if (!regFullName.trim()) errors.fullName = 'Full name is required.';
      if (!regPhone.trim()) errors.phone = 'Phone number is required.';
    }

    if (!regPlate.trim()) errors.plateNumber = 'Plate number is required.';
    if (!regBrand.trim()) errors.brand = 'Brand is required.';
    if (!regModel.trim()) errors.model = 'Model is required.';
    if (!regYear || isNaN(Number(regYear))) errors.year = 'Valid year is required.';
    if (!regColor.trim()) errors.color = 'Color is required.';

    if (Object.keys(errors).length > 0) {
      setRegErrors(errors);
      return;
    }

    if (selectedExistingCustomer) {
      // Adding new vehicle to existing customer
      const resVeh = addVehicle({
        customerId: selectedExistingCustomer.id,
        customerName: selectedExistingCustomer.fullName,
        plateNumber: regPlate.trim().toUpperCase(),
        brand: regBrand.trim(),
        model: regModel.trim(),
        year: Number(regYear),
        color: regColor.trim(),
        mileage: regMileage ? Number(regMileage) : 0,
        vin: regVin.trim().toUpperCase(),
      });

      if (!resVeh.success) {
        setRegErrors({ general: resVeh.error || 'Failed to add vehicle.' });
        return;
      }

      showToast('Vehicle added successfully.');
      setIsRegisterModalOpen(false);
      
      // If currently viewing details, refresh view
      if (selectedCustomerId === selectedExistingCustomer.id) {
        setActiveView('customer_details');
      }
    } else {
      // Register New Customer & Vehicle
      const resCust = addCustomer({
        fullName: regFullName.trim(),
        phone: regPhone.trim(),
        address: regAddress.trim(),
      });

      if (!resCust.success || !resCust.customer) {
        setRegErrors({ general: resCust.error || 'Failed to register customer.' });
        return;
      }

      const resVeh = addVehicle({
        customerId: resCust.customer.id,
        customerName: resCust.customer.fullName,
        plateNumber: regPlate.trim().toUpperCase(),
        brand: regBrand.trim(),
        model: regModel.trim(),
        year: Number(regYear),
        color: regColor.trim(),
        mileage: regMileage ? Number(regMileage) : 0,
        vin: regVin.trim().toUpperCase(),
      });

      if (!resVeh.success) {
        setRegErrors({ general: `Customer created, but vehicle failed: ${resVeh.error}` });
        return;
      }

      showToast('Customer and vehicle registered successfully.');
      setIsRegisterModalOpen(false);
    }
  };

  // Open Add Vehicle Modal for an existing customer
  const handleOpenAddVehicleModal = (cust: Customer) => {
    setAddVehCustomer(cust);
    setAddVehPlate('');
    setAddVehBrand('');
    setAddVehModel('');
    setAddVehYear(new Date().getFullYear().toString());
    setAddVehColor('');
    setAddVehMileage('');
    setAddVehVin('');
    setAddVehErrors({});
    setIsAddVehicleModalOpen(true);
  };

  // Submit Add Vehicle Modal
  const handleSubmitAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addVehCustomer) return;

    const errors: Record<string, string> = {};
    if (!addVehPlate.trim()) errors.plateNumber = 'Plate number is required.';
    if (!addVehBrand.trim()) errors.brand = 'Brand is required.';
    if (!addVehModel.trim()) errors.model = 'Model is required.';
    if (!addVehYear || isNaN(Number(addVehYear))) errors.year = 'Valid year is required.';
    if (!addVehColor.trim()) errors.color = 'Color is required.';

    if (Object.keys(errors).length > 0) {
      setAddVehErrors(errors);
      return;
    }

    const res = addVehicle({
      customerId: addVehCustomer.id,
      customerName: addVehCustomer.fullName,
      plateNumber: addVehPlate.trim().toUpperCase(),
      brand: addVehBrand.trim(),
      model: addVehModel.trim(),
      year: Number(addVehYear),
      color: addVehColor.trim(),
      mileage: addVehMileage ? Number(addVehMileage) : 0,
      vin: addVehVin.trim().toUpperCase(),
    });

    if (!res.success) {
      setAddVehErrors({ general: res.error || 'Failed to add vehicle.' });
      return;
    }

    showToast('Vehicle added successfully.');
    setIsAddVehicleModalOpen(false);
  };

  // Open Edit Customer Modal
  const handleOpenEditCustomerModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setEditCustomerFullName(cust.fullName);
    setEditCustomerPhone(cust.phone);
    setEditCustomerAddress(cust.address || '');
    setEditCustomerError('');
    setIsEditCustomerModalOpen(true);
  };

  // Submit Edit Customer Form
  const handleSubmitEditCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    if (!editCustomerFullName.trim()) {
      setEditCustomerError('Full name is required.');
      return;
    }
    if (!editCustomerPhone.trim()) {
      setEditCustomerError('Phone number is required.');
      return;
    }

    const res = updateCustomer(editingCustomer.id, {
      fullName: editCustomerFullName.trim(),
      phone: editCustomerPhone.trim(),
      address: editCustomerAddress.trim(),
    });

    if (!res.success) {
      setEditCustomerError(res.error || 'Failed to update customer.');
      return;
    }

    showToast('Customer information updated successfully.');
    setIsEditCustomerModalOpen(false);
  };

  // Open Edit Vehicle Modal
  const handleOpenEditVehicleModal = (veh: Vehicle) => {
    setEditingVehicle(veh);
    setEditVehiclePlate(veh.plateNumber);
    setEditVehicleBrand(veh.brand);
    setEditVehicleModel(veh.model);
    setEditVehicleYear(veh.year);
    setEditVehicleColor(veh.color);
    setEditVehicleMileage(veh.mileage || '');
    setEditVehicleVin(veh.vin || '');
    setEditVehicleError('');
    setIsEditVehicleModalOpen(true);
  };

  // Submit Edit Vehicle Form
  const handleSubmitEditVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;

    if (!editVehiclePlate.trim()) {
      setEditVehicleError('Plate number is required.');
      return;
    }
    if (!editVehicleBrand.trim()) {
      setEditVehicleError('Brand is required.');
      return;
    }
    if (!editVehicleModel.trim()) {
      setEditVehicleError('Model is required.');
      return;
    }
    if (!editVehicleYear || isNaN(Number(editVehicleYear))) {
      setEditVehicleError('Valid year is required.');
      return;
    }
    if (!editVehicleColor.trim()) {
      setEditVehicleError('Color is required.');
      return;
    }

    const res = updateVehicle(
      editingVehicle.id,
      {
        plateNumber: editVehiclePlate.trim().toUpperCase(),
        brand: editVehicleBrand.trim(),
        model: editVehicleModel.trim(),
        year: Number(editVehicleYear),
        color: editVehicleColor.trim(),
        mileage: editVehicleMileage ? Number(editVehicleMileage) : 0,
        vin: editVehicleVin.trim().toUpperCase(),
      },
      currentUser?.name || 'Staff'
    );

    if (!res.success) {
      setEditVehicleError(res.error || 'Failed to update vehicle.');
      return;
    }

    showToast('Vehicle information updated successfully.');
    setIsEditVehicleModalOpen(false);
  };

  // Open Telegram Linking Modal
  const handleOpenTelegramModal = (cust: Customer) => {
    setTelegramCustomer(cust);
    setTelegramSimulatedStep(1);
    setIsTelegramModalOpen(true);
  };

  // Complete Telegram Linking
  const handleSimulateTelegramLink = () => {
    if (!telegramCustomer) return;
    const cleanHandle = `@${telegramCustomer.fullName.toLowerCase().replace(/\s+/g, '_')}`;
    const res = updateCustomer(telegramCustomer.id, {
      telegramHandle: cleanHandle,
      telegramLinked: true,
    });

    if (res.success) {
      showToast('Telegram linked successfully.');
      setIsTelegramModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 text-white border border-slate-700 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* VIEW 1: MAIN CUSTOMER & VEHICLES LIST PAGE */}
      {activeView === 'list' && (
        <>
          {/* Header Bar */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Customers</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage customers and their vehicles
              </p>
            </div>

            <button
              id="add-customer-btn"
              type="button"
              onClick={handleOpenRegisterModal}
              className="px-4 py-2.5 bg-[#FF6B00] hover:bg-[#E56000] text-white font-semibold rounded-lg text-xs flex items-center gap-2 shadow-xs transition shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          </div>

          {/* Unified Search Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="search-customer-vehicle-input"
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by customer name, phone number, or plate number..."
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-none transition-colors"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Vehicle Search Matching Results Card (if searching by plate/brand) */}
            {cleanSearch && searchMatchingVehicles.length > 0 && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-slate-700" />
                  Matching Vehicles ({searchMatchingVehicles.length})
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {searchMatchingVehicles.slice(0, 4).map((v) => {
                    const owner = customers.find(
                      (c) => c.id === v.customerId || c.fullName.toLowerCase() === v.customerName.toLowerCase()
                    );

                    return (
                      <div
                        key={v.id}
                        onClick={() => {
                          if (owner) {
                            setSelectedCustomerId(owner.id);
                            setActiveView('customer_details');
                          } else {
                            setSelectedVehicleId(v.id);
                            setActiveView('vehicle_details');
                          }
                        }}
                        className="p-3 bg-white border border-slate-200 hover:border-slate-400 rounded-lg shadow-2xs transition cursor-pointer flex justify-between items-center"
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900">
                            {v.brand} {v.model} — <span className="font-mono text-slate-800">{v.plateNumber}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Owner: <span className="font-semibold text-slate-700">{v.customerName}</span> {owner ? `(${owner.phone})` : ''}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Customer List Table or Empty States */}
            {filteredCustomers.length === 0 ? (
              <div className="py-12 px-4 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                  <Users className="w-6 h-6" />
                </div>
                {searchTerm ? (
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">No customers or vehicles found</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Try searching by customer name, phone number, or vehicle plate number.
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">No customers registered yet</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Register your first customer and vehicle to get started.
                    </p>
                    <button
                      id="empty-add-customer-btn"
                      type="button"
                      onClick={handleOpenRegisterModal}
                      className="mt-4 px-4 py-2 bg-[#FF6B00] hover:bg-[#E56000] text-white font-semibold text-xs rounded-lg transition inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Customer</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Phone Number</th>
                        <th className="py-3 px-4 text-right">Vehicles</th>
                        <th className="py-3 px-4">Telegram</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedCustomers.map((cust) => {
                        const custVehicles = vehicles.filter(
                          (v) =>
                            v.customerId === cust.id ||
                            v.customerName.toLowerCase() === cust.fullName.toLowerCase()
                        );
                        const vehCount = custVehicles.length;

                        return (
                          <tr
                            key={cust.id}
                            onClick={() => {
                              setSelectedCustomerId(cust.id);
                              setActiveView('customer_details');
                            }}
                            className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                          >
                            {/* Customer Column */}
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              <button
                                id={`customer-row-link-${cust.id}`}
                                type="button"
                                onClick={() => {
                                  setSelectedCustomerId(cust.id);
                                  setActiveView('customer_details');
                                }}
                                className="hover:underline text-left text-slate-900 font-bold"
                              >
                                {cust.fullName}
                              </button>
                            </td>

                            {/* Phone Number Column */}
                            <td className="py-3.5 px-4 text-slate-700 font-medium">
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{cust.phone}</span>
                              </div>
                            </td>

                            {/* Vehicles Column */}
                            <td className="py-3.5 px-4 text-right">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md font-semibold text-xs border border-slate-200">
                                <Car className="w-3.5 h-3.5 text-slate-500" />
                                <span>{vehCount} {vehCount === 1 ? 'Vehicle' : 'Vehicles'}</span>
                              </span>
                            </td>

                            {/* Telegram Column */}
                            <td className="py-3.5 px-4">
                              {cust.telegramLinked ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <Send className="w-3 h-3 text-emerald-600" />
                                  <span>Linked</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                  <span>Not Linked</span>
                                </span>
                              )}
                            </td>

                            {/* Actions Column */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  id={`view-customer-btn-${cust.id}`}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCustomerId(cust.id);
                                    setActiveView('customer_details');
                                  }}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md transition-colors"
                                >
                                  View
                                </button>
                                <button
                                  id={`edit-customer-btn-${cust.id}`}
                                  type="button"
                                  onClick={() => handleOpenEditCustomerModal(cust)}
                                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md transition-colors"
                                >
                                  Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <span className="text-xs text-slate-500">
                    Showing <span className="font-semibold text-slate-800">{startIndex + 1}</span> to{' '}
                    <span className="font-semibold text-slate-800">
                      {Math.min(startIndex + ITEMS_PER_PAGE, filteredCustomers.length)}
                    </span>{' '}
                    of <span className="font-semibold text-slate-800">{filteredCustomers.length}</span> customers
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      id="pagination-prev-btn"
                      type="button"
                      disabled={validPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <span className="px-3 py-1 text-xs font-medium text-slate-700">
                      Page {validPage} of {totalPages}
                    </span>

                    <button
                      id="pagination-next-btn"
                      type="button"
                      disabled={validPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* VIEW 2: CUSTOMER DETAILS PAGE */}
      {activeView === 'customer_details' && activeCustomer && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                id="back-to-customer-list-btn"
                type="button"
                onClick={() => {
                  setActiveView('list');
                  setSelectedCustomerId(null);
                }}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                title="Back to list"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Customer Details</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed profile for <span className="font-semibold text-slate-800">{activeCustomer.fullName}</span>
                </p>
              </div>
            </div>

            <button
              id="edit-customer-details-btn"
              type="button"
              onClick={() => handleOpenEditCustomerModal(activeCustomer)}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-semibold text-xs rounded-lg transition shadow-xs flex items-center gap-2"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-600" />
              <span>Edit Customer</span>
            </button>
          </div>

          {/* Customer Information Card & Telegram Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer Contact Details */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Customer Information
                </h2>
                <button
                  id="edit-customer-card-btn"
                  type="button"
                  onClick={() => handleOpenEditCustomerModal(activeCustomer)}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-md transition shadow-2xs flex items-center gap-1.5"
                >
                  <Edit2 className="w-3 h-3 text-slate-500" />
                  <span>Edit Customer</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 font-medium block">Full Name</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {activeCustomer.fullName}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-medium block">Phone Number</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {activeCustomer.phone}
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-slate-500 font-medium block">Address</span>
                  <span className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {activeCustomer.address || 'No address registered'}
                  </span>
                </div>
              </div>
            </div>

            {/* Telegram Status Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center justify-between">
                  <span>Telegram Status</span>
                  <Send className="w-3.5 h-3.5 text-sky-600" />
                </h2>

                <div className="mt-3 space-y-2">
                  {activeCustomer.telegramLinked ? (
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Linked</span>
                      </span>
                      {activeCustomer.telegramHandle && (
                        <p className="text-xs font-mono font-semibold text-slate-700 mt-2">
                          Handle: {activeCustomer.telegramHandle}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Automated repair updates and invoices will be delivered directly via Telegram.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        <AlertCircle className="w-4 h-4 text-slate-500" />
                        <span>Not Linked</span>
                      </span>
                      <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                        Customer has not linked their Telegram bot yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {!activeCustomer.telegramLinked && (
                <button
                  id="link-telegram-action-btn"
                  type="button"
                  onClick={() => handleOpenTelegramModal(activeCustomer)}
                  className="w-full mt-3 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Link Telegram</span>
                </button>
              )}
            </div>
          </div>

          {/* Customer Vehicles Section */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Vehicles</h2>
                <p className="text-xs text-slate-500">
                  Registered vehicles owned by {activeCustomer.fullName}
                </p>
              </div>

              <button
                id="add-vehicle-to-customer-btn"
                type="button"
                onClick={() => handleOpenAddVehicleModal(activeCustomer)}
                className="px-3.5 py-2 bg-[#FF6B00] hover:bg-[#E56000] text-white font-semibold text-xs rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Vehicle</span>
              </button>
            </div>

            {/* Vehicles Table or Empty State */}
            {(() => {
              const custVehicles = vehicles.filter(
                (v) =>
                  v.customerId === activeCustomer.id ||
                  v.customerName.toLowerCase() === activeCustomer.fullName.toLowerCase()
              );

              if (custVehicles.length === 0) {
                return (
                  <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50 space-y-3">
                    <Car className="w-8 h-8 text-slate-400 mx-auto" />
                    <h3 className="text-xs font-bold text-slate-800">No vehicles registered</h3>
                    <button
                      id="empty-add-vehicle-btn"
                      type="button"
                      onClick={() => handleOpenAddVehicleModal(activeCustomer)}
                      className="px-3.5 py-2 bg-[#FF6B00] hover:bg-[#E56000] text-white font-semibold text-xs rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Vehicle</span>
                    </button>
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                        <th className="py-3 px-4">Vehicle</th>
                        <th className="py-3 px-4">Plate Number</th>
                        <th className="py-3 px-4 text-right">Year</th>
                        <th className="py-3 px-4">Color</th>
                        <th className="py-3 px-4 text-right">Mileage</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {custVehicles.map((veh) => (
                        <tr key={veh.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {veh.brand} {veh.model}
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            {veh.plateNumber}
                          </td>

                          <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                            {veh.year}
                          </td>

                          <td className="py-3.5 px-4 text-slate-700 font-medium">
                            {veh.color}
                          </td>

                          <td className="py-3.5 px-4 text-right text-slate-700 font-medium">
                            {veh.mileage ? `${veh.mileage.toLocaleString()} km` : '—'}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                id={`view-veh-btn-${veh.id}`}
                                type="button"
                                onClick={() => {
                                  setSelectedVehicleId(veh.id);
                                  setActiveView('vehicle_details');
                                }}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md transition-colors"
                              >
                                View
                              </button>

                              <button
                                id={`edit-veh-btn-${veh.id}`}
                                type="button"
                                onClick={() => handleOpenEditVehicleModal(veh)}
                                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-1"
                              >
                                <Edit2 className="w-3 h-3 text-slate-500" />
                                <span>Edit Vehicle</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* VIEW 3: VEHICLE DETAILS PAGE */}
      {activeView === 'vehicle_details' && activeVehicle && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                id="back-from-vehicle-details-btn"
                type="button"
                onClick={() => {
                  if (selectedCustomerId) {
                    setActiveView('customer_details');
                  } else {
                    setActiveView('list');
                  }
                  setSelectedVehicleId(null);
                }}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Vehicle Details</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeVehicle.brand} {activeVehicle.model} —{' '}
                  <span className="font-mono font-bold text-slate-800">{activeVehicle.plateNumber}</span>
                </p>
              </div>
            </div>

            <button
              id="edit-vehicle-details-btn"
              type="button"
              onClick={() => handleOpenEditVehicleModal(activeVehicle)}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-semibold text-xs rounded-lg transition shadow-xs flex items-center gap-2"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-600" />
              <span>Edit Vehicle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Vehicle Specs & Info */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                Vehicle Information
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 font-medium block">Plate Number</span>
                  <span className="font-bold text-slate-900 text-sm font-mono mt-0.5 block">
                    {activeVehicle.plateNumber}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-medium block">Brand</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {activeVehicle.brand}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-medium block">Model</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {activeVehicle.model}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-medium block">Year</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {activeVehicle.year}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-medium block">Color</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {activeVehicle.color}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-medium block">Mileage</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {activeVehicle.mileage ? `${activeVehicle.mileage.toLocaleString()} km` : 'N/A'}
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-100">
                  <span className="text-slate-500 font-medium block">VIN (Vehicle Identification Number)</span>
                  <span className="font-mono font-semibold text-slate-800 text-xs mt-0.5 block">
                    {activeVehicle.vin || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Owner Info Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                Vehicle Owner
              </h2>

              {(() => {
                const owner = customers.find(
                  (c) =>
                    c.id === activeVehicle.customerId ||
                    c.fullName.toLowerCase() === activeVehicle.customerName.toLowerCase()
                );

                return (
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium block">Owner Name</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (owner) {
                            setSelectedCustomerId(owner.id);
                            setActiveView('customer_details');
                          }
                        }}
                        className="font-bold text-slate-900 text-sm mt-0.5 hover:underline flex items-center gap-1"
                      >
                        <span>{activeVehicle.customerName}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>

                    {owner && (
                      <>
                        <div>
                          <span className="text-slate-500 font-medium block">Phone Number</span>
                          <span className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {owner.phone}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-500 font-medium block">Telegram Status</span>
                          <span
                            className={`inline-block mt-1 px-2.5 py-1 rounded text-xs font-semibold ${
                              owner.telegramLinked
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {owner.telegramLinked ? 'Linked' : 'Not Linked'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: REGISTER CUSTOMER & VEHICLE FORM (Single Page Form) */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden text-slate-900 my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Register Customer & Vehicle</h3>
                <p className="text-xs text-slate-300">
                  Enter customer details and vehicle specifications
                </p>
              </div>
              <button
                id="close-register-modal-btn"
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRegister} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {regErrors.general && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{regErrors.general}</span>
                </div>
              )}

              {/* Customer Information Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-800" />
                    Customer Information
                  </h4>
                  {selectedExistingCustomer && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Existing Customer Selected
                    </span>
                  )}
                </div>

                {/* Inline Existing Customer Detection Notification */}
                {detectedExistingCustomer && !selectedExistingCustomer && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Existing Customer Found</span>
                      </div>
                    </div>
                    <div className="text-xs text-amber-800 space-y-0.5">
                      <p className="font-bold text-slate-900 text-sm">{detectedExistingCustomer.fullName}</p>
                      <p className="font-mono text-slate-700">{detectedExistingCustomer.phone}</p>
                      <p className="text-slate-600 text-[11px]">
                        Has{' '}
                        {vehicles.filter(
                          (v) =>
                            v.customerId === detectedExistingCustomer.id ||
                            v.customerName.toLowerCase() === detectedExistingCustomer.fullName.toLowerCase()
                        ).length}{' '}
                        vehicle(s) registered.
                      </p>
                    </div>

                    <button
                      id="use-existing-customer-btn"
                      type="button"
                      onClick={() => {
                        setSelectedExistingCustomer(detectedExistingCustomer);
                        setRegFullName(detectedExistingCustomer.fullName);
                        setRegAddress(detectedExistingCustomer.address || '');
                      }}
                      className="mt-2 px-3.5 py-1.5 bg-[#FF6B00] hover:bg-[#E56000] text-white text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Use Existing Customer</span>
                    </button>
                  </div>
                )}

                {selectedExistingCustomer ? (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{selectedExistingCustomer.fullName}</span>
                      <span className="text-slate-600 font-mono">{selectedExistingCustomer.phone}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedExistingCustomer(null)}
                      className="text-xs text-rose-600 hover:underline font-semibold"
                    >
                      Change / Register New
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="reg-fullname" className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="reg-fullname"
                        type="text"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="e.g. Sok Dara"
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-none"
                      />
                      {regErrors.fullName && <p className="text-[11px] text-rose-600 mt-1">{regErrors.fullName}</p>}
                    </div>

                    <div>
                      <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                        Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="reg-phone"
                        type="text"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="e.g. 012 345 678"
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-none"
                      />
                      {regErrors.phone && <p className="text-[11px] text-rose-600 mt-1">{regErrors.phone}</p>}
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="reg-address" className="block text-xs font-semibold text-slate-700 mb-1">
                        Address <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        id="reg-address"
                        type="text"
                        value={regAddress}
                        onChange={(e) => setRegAddress(e.target.value)}
                        placeholder="e.g. Phnom Penh, Cambodia"
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Vehicle Information Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-slate-800" />
                  Vehicle Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reg-plate" className="block text-xs font-semibold text-slate-700 mb-1">
                      Plate Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="reg-plate"
                      type="text"
                      value={regPlate}
                      onChange={(e) => setRegPlate(e.target.value)}
                      placeholder="e.g. 2AB-1234"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-none uppercase font-mono font-bold"
                    />
                    {regErrors.plateNumber && <p className="text-[11px] text-rose-600 mt-1">{regErrors.plateNumber}</p>}
                  </div>

                  <div>
                    <label htmlFor="reg-brand" className="block text-xs font-semibold text-slate-700 mb-1">
                      Brand <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="reg-brand"
                      type="text"
                      value={regBrand}
                      onChange={(e) => setRegBrand(e.target.value)}
                      placeholder="e.g. Toyota"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-none"
                    />
                    {regErrors.brand && <p className="text-[11px] text-rose-600 mt-1">{regErrors.brand}</p>}
                  </div>

                  <div>
                    <label htmlFor="reg-model" className="block text-xs font-semibold text-slate-700 mb-1">
                      Model <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="reg-model"
                      type="text"
                      value={regModel}
                      onChange={(e) => setRegModel(e.target.value)}
                      placeholder="e.g. Camry"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-none"
                    />
                    {regErrors.model && <p className="text-[11px] text-rose-600 mt-1">{regErrors.model}</p>}
                  </div>

                  <div>
                    <label htmlFor="reg-year" className="block text-xs font-semibold text-slate-700 mb-1">
                      Year <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="reg-year"
                      type="number"
                      value={regYear}
                      onChange={(e) => setRegYear(e.target.value)}
                      placeholder="e.g. 2022"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-none"
                    />
                    {regErrors.year && <p className="text-[11px] text-rose-600 mt-1">{regErrors.year}</p>}
                  </div>

                  <div>
                    <label htmlFor="reg-color" className="block text-xs font-semibold text-slate-700 mb-1">
                      Color <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="reg-color"
                      type="text"
                      value={regColor}
                      onChange={(e) => setRegColor(e.target.value)}
                      placeholder="e.g. White"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-none"
                    />
                    {regErrors.color && <p className="text-[11px] text-rose-600 mt-1">{regErrors.color}</p>}
                  </div>

                  <div>
                    <label htmlFor="reg-mileage" className="block text-xs font-semibold text-slate-700 mb-1">
                      Mileage (km) <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      id="reg-mileage"
                      type="number"
                      value={regMileage}
                      onChange={(e) => setRegMileage(e.target.value)}
                      placeholder="e.g. 45000"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="reg-vin" className="block text-xs font-semibold text-slate-700 mb-1">
                      VIN (Vehicle Identification Number) <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      id="reg-vin"
                      type="text"
                      value={regVin}
                      onChange={(e) => setRegVin(e.target.value)}
                      placeholder="e.g. 4T1B11HK5JU123456"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  id="cancel-register-btn"
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>

                <button
                  id="submit-register-btn"
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#FF6B00] hover:bg-[#E56000] rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  {selectedExistingCustomer ? 'Add Vehicle to Existing Customer' : 'Register Customer & Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD VEHICLE TO EXISTING CUSTOMER */}
      {isAddVehicleModalOpen && addVehCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-900">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Add Vehicle</h3>
                <p className="text-xs text-slate-300">
                  Register vehicle for <span className="font-semibold text-white">{addVehCustomer.fullName}</span>
                </p>
              </div>
              <button
                id="close-add-veh-modal-btn"
                type="button"
                onClick={() => setIsAddVehicleModalOpen(false)}
                className="text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAddVehicle} className="p-6 space-y-4">
              {addVehErrors.general && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{addVehErrors.general}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="add-veh-plate" className="block text-xs font-semibold text-slate-700 mb-1">
                    Plate Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="add-veh-plate"
                    type="text"
                    value={addVehPlate}
                    onChange={(e) => setAddVehPlate(e.target.value)}
                    placeholder="e.g. 2AC-5678"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] outline-none uppercase font-mono font-bold"
                  />
                  {addVehErrors.plateNumber && <p className="text-[11px] text-rose-600 mt-1">{addVehErrors.plateNumber}</p>}
                </div>

                <div>
                  <label htmlFor="add-veh-brand" className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="add-veh-brand"
                    type="text"
                    value={addVehBrand}
                    onChange={(e) => setAddVehBrand(e.target.value)}
                    placeholder="e.g. Honda"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] outline-none"
                  />
                  {addVehErrors.brand && <p className="text-[11px] text-rose-600 mt-1">{addVehErrors.brand}</p>}
                </div>

                <div>
                  <label htmlFor="add-veh-model" className="block text-xs font-semibold text-slate-700 mb-1">
                    Model <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="add-veh-model"
                    type="text"
                    value={addVehModel}
                    onChange={(e) => setAddVehModel(e.target.value)}
                    placeholder="e.g. Civic"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] outline-none"
                  />
                  {addVehErrors.model && <p className="text-[11px] text-rose-600 mt-1">{addVehErrors.model}</p>}
                </div>

                <div>
                  <label htmlFor="add-veh-year" className="block text-xs font-semibold text-slate-700 mb-1">
                    Year <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="add-veh-year"
                    type="number"
                    value={addVehYear}
                    onChange={(e) => setAddVehYear(e.target.value)}
                    placeholder="e.g. 2020"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] outline-none"
                  />
                  {addVehErrors.year && <p className="text-[11px] text-rose-600 mt-1">{addVehErrors.year}</p>}
                </div>

                <div>
                  <label htmlFor="add-veh-color" className="block text-xs font-semibold text-slate-700 mb-1">
                    Color <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="add-veh-color"
                    type="text"
                    value={addVehColor}
                    onChange={(e) => setAddVehColor(e.target.value)}
                    placeholder="e.g. Black"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] outline-none"
                  />
                  {addVehErrors.color && <p className="text-[11px] text-rose-600 mt-1">{addVehErrors.color}</p>}
                </div>

                <div>
                  <label htmlFor="add-veh-mileage" className="block text-xs font-semibold text-slate-700 mb-1">
                    Mileage (km) <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="add-veh-mileage"
                    type="number"
                    value={addVehMileage}
                    onChange={(e) => setAddVehMileage(e.target.value)}
                    placeholder="e.g. 62000"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="add-veh-vin" className="block text-xs font-semibold text-slate-700 mb-1">
                    VIN <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="add-veh-vin"
                    type="text"
                    value={addVehVin}
                    onChange={(e) => setAddVehVin(e.target.value)}
                    placeholder="e.g. 1HGCR2F83HA123456"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  id="cancel-add-veh-btn"
                  type="button"
                  onClick={() => setIsAddVehicleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="submit-add-veh-btn"
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#FF6B00] hover:bg-[#E56000] rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Add Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT CUSTOMER */}
      {isEditCustomerModalOpen && editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-slate-900">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">Edit Customer</h3>
              <button
                id="close-edit-cust-modal-btn"
                type="button"
                onClick={() => setIsEditCustomerModalOpen(false)}
                className="text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEditCustomer} className="p-6 space-y-4">
              {editCustomerError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{editCustomerError}</span>
                </div>
              )}

              <div>
                <label htmlFor="edit-cust-fullname" className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="edit-cust-fullname"
                  type="text"
                  value={editCustomerFullName}
                  onChange={(e) => setEditCustomerFullName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-cust-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  id="edit-cust-phone"
                  type="text"
                  value={editCustomerPhone}
                  onChange={(e) => setEditCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-cust-address" className="block text-xs font-semibold text-slate-700 mb-1">
                  Address
                </label>
                <input
                  id="edit-cust-address"
                  type="text"
                  value={editCustomerAddress}
                  onChange={(e) => setEditCustomerAddress(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  id="cancel-edit-cust-btn"
                  type="button"
                  onClick={() => setIsEditCustomerModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>

                <button
                  id="save-edit-cust-btn"
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#FF6B00] hover:bg-[#E56000] rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT VEHICLE */}
      {isEditVehicleModalOpen && editingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-slate-900">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">Edit Vehicle</h3>
              <button
                id="close-edit-veh-modal-btn"
                type="button"
                onClick={() => setIsEditVehicleModalOpen(false)}
                className="text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEditVehicle} className="p-6 space-y-4">
              {editVehicleError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{editVehicleError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label htmlFor="edit-veh-plate" className="block text-xs font-semibold text-slate-700 mb-1">
                    Plate Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="edit-veh-plate"
                    type="text"
                    value={editVehiclePlate}
                    onChange={(e) => setEditVehiclePlate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] outline-none uppercase font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-veh-brand" className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="edit-veh-brand"
                    type="text"
                    value={editVehicleBrand}
                    onChange={(e) => setEditVehicleBrand(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-veh-model" className="block text-xs font-semibold text-slate-700 mb-1">
                    Model <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="edit-veh-model"
                    type="text"
                    value={editVehicleModel}
                    onChange={(e) => setEditVehicleModel(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-veh-year" className="block text-xs font-semibold text-slate-700 mb-1">
                    Year <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="edit-veh-year"
                    type="number"
                    value={editVehicleYear}
                    onChange={(e) => setEditVehicleYear(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-veh-color" className="block text-xs font-semibold text-slate-700 mb-1">
                    Color <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="edit-veh-color"
                    type="text"
                    value={editVehicleColor}
                    onChange={(e) => setEditVehicleColor(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-veh-mileage" className="block text-xs font-semibold text-slate-700 mb-1">
                    Mileage (km)
                  </label>
                  <input
                    id="edit-veh-mileage"
                    type="number"
                    value={editVehicleMileage}
                    onChange={(e) => setEditVehicleMileage(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label htmlFor="edit-veh-vin" className="block text-xs font-semibold text-slate-700 mb-1">
                    VIN
                  </label>
                  <input
                    id="edit-veh-vin"
                    type="text"
                    value={editVehicleVin}
                    onChange={(e) => setEditVehicleVin(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#FF6B00] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  id="cancel-edit-veh-btn"
                  type="button"
                  onClick={() => setIsEditVehicleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>

                <button
                  id="save-edit-veh-btn"
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#FF6B00] hover:bg-[#E56000] rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: TELEGRAM QR LINKING INTERFACE */}
      {isTelegramModalOpen && telegramCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-slate-900">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-400" />
                Link Telegram Account
              </h3>
              <button
                id="close-telegram-linking-modal-btn"
                type="button"
                onClick={() => setIsTelegramModalOpen(false)}
                className="text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-center">
              {/* Telegram Linking Flow Diagram / Steps */}
              <div className="space-y-2 text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Telegram Bot Flow Process:
                </span>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#FF6B00] text-white flex items-center justify-center text-[10px] font-bold">1</span>
                    <span>Customer Registration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#FF6B00] text-white flex items-center justify-center text-[10px] font-bold">2</span>
                    <span>Scan Telegram QR Code</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#FF6B00] text-white flex items-center justify-center text-[10px] font-bold">3</span>
                    <span>Start Telegram Bot</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#FF6B00] text-white flex items-center justify-center text-[10px] font-bold">4</span>
                    <span>Share Phone Number ({telegramCustomer.phone})</span>
                  </div>
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">5</span>
                    <span>System Matches Phone Number → Chat ID Automatically Linked</span>
                  </div>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl inline-block mx-auto">
                <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-2xs flex flex-col items-center justify-center">
                  <div className="w-36 h-36 bg-slate-900 p-2 rounded flex items-center justify-center text-white relative">
                    <QrCode className="w-32 h-32 text-white" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-sky-500 border-2 border-white flex items-center justify-center text-white shadow-md">
                        <Send className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 mt-2">
                    https://t.me/ApexGarageBot?start=LINK_{telegramCustomer.id}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-900">
                  Ask customer to scan QR code or start bot
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                  When the customer shares their phone number with the bot, the system automatically matches <span className="font-semibold text-slate-800">{telegramCustomer.phone}</span> and stores their Telegram Chat ID.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
                <button
                  id="simulate-phone-match-btn"
                  type="button"
                  onClick={handleSimulateTelegramLink}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition shadow-2xs flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simulate Customer Phone Match (Link Account)</span>
                </button>

                <button
                  id="cancel-telegram-linking-btn"
                  type="button"
                  onClick={() => setIsTelegramModalOpen(false)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
