import React, { useState, useEffect } from 'react';
import { useGarage } from '../../context/GarageContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Wrench,
  User,
  Car,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Search,
  FileText,
} from 'lucide-react';

interface NewRepairJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (jobId: string) => void;
}

export const NewRepairJobModal: React.FC<NewRepairJobModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { customers, vehicles, createRepairJob } = useGarage();
  const { currentUser } = useAuth();

  // Form states
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  const [receivedDate, setReceivedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().substring(0, 10); // YYYY-MM-DD
  });

  const [customerComplaint, setCustomerComplaint] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter customers by search term (name or phone)
  const filteredCustomers = customers.filter((c) => {
    if (!customerSearchTerm.trim()) return true;
    const term = customerSearchTerm.toLowerCase();
    const name = (c.fullName || (c as any).name || '').toLowerCase();
    const phone = (c.phone || '').toLowerCase();
    return name.includes(term) || phone.includes(term);
  });

  // Filter vehicles belonging strictly to selected customer
  const customerVehicles = vehicles.filter(
    (v) => selectedCustomerId && v.customerId === selectedCustomerId
  );

  // Auto select vehicle if customer changes and has vehicles
  useEffect(() => {
    if (selectedCustomerId) {
      const match = vehicles.filter((v) => v.customerId === selectedCustomerId);
      if (match.length > 0) {
        if (!selectedVehicleId || !match.some((v) => v.id === selectedVehicleId)) {
          setSelectedVehicleId(match[0].id);
        }
      } else {
        setSelectedVehicleId('');
      }
    } else {
      setSelectedVehicleId('');
    }
  }, [selectedCustomerId, vehicles]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cust = customers.find((c) => c.id === selectedCustomerId);
    const veh = vehicles.find((v) => v.id === selectedVehicleId);

    if (!cust) {
      setErrorMessage('Please search and select a valid customer.');
      return;
    }
    if (!veh) {
      setErrorMessage('Please select a valid vehicle belonging to the selected customer.');
      return;
    }
    if (!customerComplaint.trim()) {
      setErrorMessage('Please enter the complained issue reported by the customer.');
      return;
    }

    const result = createRepairJob({
      customerId: cust.id,
      customerName: cust.fullName || (cust as any).name || 'Customer',
      customerPhone: cust.phone,
      vehicleId: veh.id,
      vehicleMake: veh.brand,
      vehicleModel: veh.model,
      licensePlate: veh.plateNumber,
      receivedDate,
      customerComplaint: customerComplaint.trim(),
      createdByName: currentUser?.name || 'Staff User',
    });

    if (result.success && result.job) {
      if (onSuccess) onSuccess(result.job.id);
      onClose();
    } else {
      setErrorMessage(result.error || 'Failed to create repair job.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full my-6 overflow-hidden text-slate-900 animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 text-emerald-400 rounded-xl">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Create Repair Job</h2>
              <p className="text-xs text-slate-400">
                Register a new job order (Status: Pending Inspection)
              </p>
            </div>
          </div>
          <button
            id="close-create-job-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Customer Selection */}
          <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-900" />
              1. Customer Information
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Search Customer <span className="text-rose-500">*</span>
              </label>

              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type customer name or phone number..."
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-slate-900"
                />
              </div>

              <select
                id="select-customer-dropdown"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:border-slate-900 outline-hidden"
                required
              >
                <option value="">-- Select Customer --</option>
                {filteredCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName || (c as any).name || 'Customer'} — {c.phone}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vehicle Selection */}
          <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-slate-900" />
              2. Vehicle Selection
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Vehicle belonging to customer <span className="text-rose-500">*</span>
              </label>

              {selectedCustomerId ? (
                customerVehicles.length > 0 ? (
                  <select
                    id="select-vehicle-dropdown"
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:border-slate-900 outline-hidden"
                    required
                  >
                    <option value="">-- Select Vehicle --</option>
                    {customerVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.brand} {v.model} — Plate: {v.plateNumber} ({v.color || 'Standard'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                    No vehicles found for this customer. Please register a vehicle for this customer first in the Vehicles menu.
                  </div>
                )
              ) : (
                <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-400 italic">
                  Select a customer above to see their registered vehicles.
                </div>
              )}
            </div>
          </div>

          {/* Issue & Date Information */}
          <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-900" />
              3. Issue & Intake Info
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Complained Issue <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="customer-complaint-textarea"
                rows={3}
                value={customerComplaint}
                onChange={(e) => setCustomerComplaint(e.target.value)}
                placeholder="Describe the vehicle symptoms or problems reported by the customer..."
                className="w-full p-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-slate-900 outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Created Date (Auto-Generated)
              </label>
              <input
                id="received-date-input"
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 font-mono focus:border-slate-900 outline-hidden"
                required
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              id="cancel-create-job-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              id="submit-create-job-btn"
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Create Repair Job</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
