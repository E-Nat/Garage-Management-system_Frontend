import React, { useState, useEffect } from 'react';
import { useGarage } from '../../context/GarageContext';
import { useAuth } from '../../context/AuthContext';
import { JobType, PerformedService, RepairJob } from '../../types';
import {
  X,
  Search,
  Check,
  AlertCircle,
  Calendar,
  Plus,
  Trash2,
} from 'lucide-react';

interface NewRepairJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (createdJob: RepairJob) => void;
  initialJobType?: JobType;
  initialCustomerId?: string;
  initialVehicleId?: string;
  initialFindingNote?: string;
}

export const NewRepairJobModal: React.FC<NewRepairJobModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialJobType = 'service',
  initialCustomerId,
  initialVehicleId,
  initialFindingNote,
}) => {
  const { customers, vehicles, services, createRepairJob } = useGarage();
  const { currentUser, users } = useAuth();

  // Job Type State - required first choice
  const [jobType, setJobType] = useState<JobType>(initialJobType);

  // Search and Select state for Customer
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId || '');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  // Vehicle state
  const [selectedVehicleId, setSelectedVehicleId] = useState(initialVehicleId || '');

  // Service Date (Default today YYYY-MM-DD)
  const [serviceDate, setServiceDate] = useState(() => {
    return new Date().toISOString().substring(0, 10);
  });

  // Repair Complaint Issue (Repair Jobs only)
  const [customerComplaint, setCustomerComplaint] = useState(initialFindingNote || '');

  // Service Job Services Selection (Service Jobs only)
  const [selectedServices, setSelectedServices] = useState<PerformedService[]>([]);
  const [serviceToAddId, setServiceToAddId] = useState('');

  // Assigned Mechanic (Optional initial picker, defaults to unassigned or selectable)
  const mechanicsList = users.filter((u) => u.role === 'mechanic');
  const [assignedMechanicId, setAssignedMechanicId] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset/Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      setJobType(initialJobType);
      setCustomerSearch('');
      setSelectedCustomerId(initialCustomerId || '');
      setSelectedVehicleId(initialVehicleId || '');
      setCustomerComplaint(initialFindingNote || '');
      setSelectedServices([]);
      setServiceToAddId('');
      setAssignedMechanicId('');
      setServiceDate(new Date().toISOString().substring(0, 10));
      setErrorMessage(null);
      setIsCustomerDropdownOpen(false);
    }
  }, [isOpen, initialJobType, initialCustomerId, initialVehicleId, initialFindingNote]);

  // Filter customers by search term (Name or Phone)
  const filteredCustomers = customers.filter((c) => {
    if (!customerSearch.trim()) return true;
    const term = customerSearch.toLowerCase();
    const name = (c.fullName || (c as any).name || '').toLowerCase();
    const phone = (c.phone || '').toLowerCase();
    return name.includes(term) || phone.includes(term);
  });

  // Selected customer object
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Filter vehicles belonging strictly to selected customer
  const customerVehicles = vehicles.filter(
    (v) => selectedCustomerId && v.customerId === selectedCustomerId
  );

  // Auto select first vehicle when customer changes if none explicitly selected
  useEffect(() => {
    if (selectedCustomerId) {
      const available = vehicles.filter((v) => v.customerId === selectedCustomerId);
      if (available.length > 0 && !available.some((v) => v.id === selectedVehicleId)) {
        setSelectedVehicleId(available[0].id);
      } else if (available.length === 0) {
        setSelectedVehicleId('');
      }
    } else {
      setSelectedVehicleId('');
    }
  }, [selectedCustomerId, vehicles]);

  if (!isOpen) return null;

  const handleAddService = () => {
    if (!serviceToAddId) return;
    const sObj = services.find((s) => s.id === serviceToAddId);
    if (!sObj) return;

    if (selectedServices.some((s) => s.serviceId === sObj.id)) {
      setErrorMessage('Service already added to list.');
      return;
    }

    const newSvc: PerformedService = {
      serviceId: sObj.id,
      serviceName: sObj.name,
      quantity: 1,
      unitPrice: sObj.basePrice,
      totalPrice: sObj.basePrice,
    };

    setSelectedServices([...selectedServices, newSvc]);
    setServiceToAddId('');
    setErrorMessage(null);
  };

  const handleRemoveService = (index: number) => {
    setSelectedServices(selectedServices.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cust = customers.find((c) => c.id === selectedCustomerId);
    const veh = vehicles.find((v) => v.id === selectedVehicleId);

    if (!cust) {
      setErrorMessage('Please search and select a customer.');
      return;
    }
    if (!veh) {
      setErrorMessage('Please select a vehicle belonging to the selected customer.');
      return;
    }

    if (jobType === 'repair' && !customerComplaint.trim()) {
      setErrorMessage("Please enter the customer's complained issue.");
      return;
    }

    if (jobType === 'service' && selectedServices.length === 0) {
      setErrorMessage('Please add at least one service from the catalog for this Service Job.');
      return;
    }

    const selectedMechObj = mechanicsList.find((m) => m.id === assignedMechanicId);

    const result = createRepairJob({
      jobType,
      customerId: cust.id,
      customerName: cust.fullName || (cust as any).name || 'Customer',
      customerPhone: cust.phone,
      vehicleId: veh.id,
      vehicleMake: veh.brand,
      vehicleModel: veh.model,
      licensePlate: veh.plateNumber,
      serviceDate,
      customerComplaint: jobType === 'repair' ? customerComplaint.trim() : 'Scheduled Service',
      servicesPerformed: jobType === 'service' ? selectedServices : [],
      manualMechanicId: assignedMechanicId || undefined,
      manualMechanicName: selectedMechObj ? selectedMechObj.name : undefined,
      createdByName: currentUser?.name || 'Staff User',
    });

    if (result.success && result.job) {
      if (onSuccess) {
        onSuccess(result.job);
      }
      onClose();
    } else {
      setErrorMessage(result.error || 'Failed to create job.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-lg w-full overflow-hidden text-slate-900 my-8">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <h2 className="text-base font-bold tracking-tight">Create Job</h2>
          <button
            id="close-create-job-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. TOP LARGE BUTTONS: Service and Repair (Label text only, no subtitle or description) */}
          <div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="job-type-service-btn"
                onClick={() => setJobType('service')}
                className={`py-3.5 px-4 rounded-xl font-bold text-sm text-center transition cursor-pointer ${
                  jobType === 'service'
                    ? 'bg-[#FF6B00] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Service
              </button>

              <button
                type="button"
                id="job-type-repair-btn"
                onClick={() => setJobType('repair')}
                className={`py-3.5 px-4 rounded-xl font-bold text-sm text-center transition cursor-pointer ${
                  jobType === 'repair'
                    ? 'bg-[#FF6B00] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Repair
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-4">
            {/* Customer Searchable Select */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer <span className="text-rose-500">*</span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  value={
                    isCustomerDropdownOpen
                      ? customerSearch
                      : selectedCustomer
                      ? `${selectedCustomer.fullName} (${selectedCustomer.phone})`
                      : customerSearch
                  }
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setIsCustomerDropdownOpen(true);
                  }}
                  onFocus={() => {
                    setIsCustomerDropdownOpen(true);
                    if (selectedCustomer) {
                      setCustomerSearch('');
                    }
                  }}
                  placeholder="Type to search by name or phone..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-hidden"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              {isCustomerDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomerId(c.id);
                          setCustomerSearch('');
                          setIsCustomerDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between transition cursor-pointer ${
                          selectedCustomerId === c.id ? 'bg-slate-100 font-bold' : ''
                        }`}
                      >
                        <div>
                          <span className="font-semibold text-slate-900">{c.fullName}</span>
                          <span className="text-slate-500 text-[11px] block">{c.phone}</span>
                        </div>
                        {selectedCustomerId === c.id && (
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-xs text-slate-500 italic text-center">
                      No customers found matching "{customerSearch}".
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Vehicle Select - Restricted strictly to selected Customer */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vehicle <span className="text-rose-500">*</span>
              </label>

              {selectedCustomerId ? (
                customerVehicles.length > 0 ? (
                  <select
                    id="select-vehicle-dropdown"
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-hidden"
                    required
                  >
                    {customerVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.brand} {v.model} ({v.plateNumber})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                    No vehicles registered for this customer.
                  </div>
                )
              ) : (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-400 italic">
                  Select a customer above to view their vehicles.
                </div>
              )}
            </div>

            {/* Service Date Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Service Date</span>
              </label>
              <input
                id="service-date-input"
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-hidden"
                required
              />
            </div>

            {/* Assigned Mechanic Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Mechanic
              </label>
              <select
                id="select-mechanic-dropdown"
                value={assignedMechanicId}
                onChange={(e) => setAssignedMechanicId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-hidden"
              >
                <option value="">-- Select Mechanic (Optional) --</option>
                {mechanicsList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* JOB TYPE SPECIFIC FIELDS */}
            {jobType === 'service' ? (
              /* SERVICES SECTION FOR SERVICE JOB ONLY (Repeatable row picker from catalog) */
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800">
                  Services <span className="text-rose-500">*</span>
                </label>

                {selectedServices.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {selectedServices.map((svc, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-slate-900">{svc.serviceName}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-slate-900 font-bold">
                            ${svc.unitPrice.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveService(idx)}
                            className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <select
                    value={serviceToAddId}
                    onChange={(e) => setServiceToAddId(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-hidden"
                  >
                    <option value="">-- Pick Service from Catalog --</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (${s.basePrice.toFixed(2)})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddService}
                    className="px-3 py-2 bg-[#FF6B00] hover:bg-[#E56000] text-white text-xs font-semibold rounded-lg transition shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-white" />
                    <span>Add Service</span>
                  </button>
                </div>
              </div>
            ) : (
              /* COMPLAINED ISSUE FOR REPAIR JOB ONLY */
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Complained Issue <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="customer-complaint-textarea"
                  rows={3}
                  value={customerComplaint}
                  onChange={(e) => setCustomerComplaint(e.target.value)}
                  placeholder="Enter vehicle complaint or issue described by customer..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#FF6B00] outline-hidden resize-none"
                  required
                />
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              id="cancel-create-job-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-create-job-btn"
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-[#FF6B00] hover:bg-[#E56000] rounded-lg shadow-xs transition cursor-pointer"
            >
              Create Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
