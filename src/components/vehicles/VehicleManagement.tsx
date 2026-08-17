import React, { useState } from 'react';
import { useGarage } from '../../context/GarageContext';
import { useAuth } from '../../context/AuthContext';
import { Vehicle, RepairJob } from '../../types';
import {
  Car,
  Plus,
  Search,
  Edit2,
  Calendar,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Wrench,
  Clock,
  User,
  Hash,
  Filter,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { JobTypeBadge } from '../common/JobTypeBadge';
import { RepairJobDetailModal } from '../repairs/RepairJobDetailModal';

export const VehicleManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const { customers, vehicles, repairJobs, invoices, addVehicle, updateVehicle } = useGarage();

  // Search & Navigation States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Job Detail Modal State (for clicking a visit history timeline row)
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<RepairJob | null>(null);

  // Timeline Filter States for Vehicle Detail
  const [timelineJobTypeFilter, setTimelineJobTypeFilter] = useState<string>('all');
  const [timelineStartDate, setTimelineStartDate] = useState<string>('');
  const [timelineEndDate, setTimelineEndDate] = useState<string>('');

  // Register / Update Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    plateNumber: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    mileage: 0,
    vin: '',
  });
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Open Register Form Modal
  const handleOpenRegisterModal = () => {
    setEditingVehicle(null);
    const defaultCust = customers[0];
    setFormData({
      customerId: defaultCust?.id || '',
      customerName: defaultCust?.fullName || '',
      plateNumber: '',
      brand: '',
      model: '',
      year: 2023,
      color: '',
      mileage: 10000,
      vin: '',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Open Update Form Modal
  const handleOpenEditModal = (v: Vehicle, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingVehicle(v);
    setFormData({
      customerId: v.customerId,
      customerName: v.customerName,
      plateNumber: v.plateNumber,
      brand: v.brand,
      model: v.model,
      year: v.year,
      color: v.color,
      mileage: v.mileage,
      vin: v.vin || '',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Submit Register or Update Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.plateNumber.trim()) {
      setFormError('Plate Number is required.');
      return;
    }

    if (!formData.brand.trim() || !formData.model.trim()) {
      setFormError('Vehicle Brand and Model are required.');
      return;
    }

    if (!formData.customerId) {
      setFormError('Please select a vehicle owner (customer).');
      return;
    }

    const targetCust = customers.find((c) => c.id === formData.customerId);
    const custName = targetCust ? targetCust.fullName : formData.customerName;

    if (!editingVehicle) {
      // Register New Vehicle
      const res = addVehicle({
        customerId: formData.customerId,
        customerName: custName,
        plateNumber: formData.plateNumber.trim().toUpperCase(),
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        year: Number(formData.year),
        color: formData.color.trim(),
        mileage: Number(formData.mileage) || 0,
        vin: formData.vin.trim().toUpperCase(),
      });

      if (!res.success) {
        setFormError(res.error || 'Failed to register vehicle.');
        return;
      }

      showToast(`Vehicle (${formData.plateNumber.toUpperCase()}) registered successfully!`);
    } else {
      // Update Existing Vehicle
      const res = updateVehicle(
        editingVehicle.id,
        {
          customerId: formData.customerId,
          customerName: custName,
          plateNumber: formData.plateNumber.trim().toUpperCase(),
          brand: formData.brand.trim(),
          model: formData.model.trim(),
          year: Number(formData.year),
          color: formData.color.trim(),
          mileage: Number(formData.mileage) || 0,
          vin: formData.vin.trim().toUpperCase(),
        },
        currentUser?.name || 'Staff User'
      );

      if (!res.success) {
        setFormError(res.error || 'Failed to update vehicle details.');
        return;
      }

      showToast(`Vehicle (${formData.plateNumber.toUpperCase()}) updated successfully!`);

      // Keep detail view updated if currently viewing this vehicle
      if (selectedVehicle?.id === editingVehicle.id) {
        setSelectedVehicle({
          ...editingVehicle,
          customerId: formData.customerId,
          customerName: custName,
          plateNumber: formData.plateNumber.trim().toUpperCase(),
          brand: formData.brand.trim(),
          model: formData.model.trim(),
          year: Number(formData.year),
          color: formData.color.trim(),
          mileage: Number(formData.mileage) || 0,
          vin: formData.vin.trim().toUpperCase(),
        });
      }
    }

    setIsAddModalOpen(false);
  };

  // Filtered vehicles for main list
  const filteredVehicles = vehicles.filter((v) => {
    const term = searchTerm.toLowerCase();
    return (
      !term ||
      v.plateNumber.toLowerCase().includes(term) ||
      v.brand.toLowerCase().includes(term) ||
      v.model.toLowerCase().includes(term) ||
      v.customerName.toLowerCase().includes(term) ||
      v.year.toString().includes(term)
    );
  });

  // Visit History Timeline for selected vehicle
  // Belongs permanently to the vehicle record by matching vehicleId or plateNumber
  const vehicleJobs = selectedVehicle
    ? repairJobs.filter(
        (j) =>
          j.vehicleId === selectedVehicle.id ||
          j.licensePlate.toUpperCase() === selectedVehicle.plateNumber.toUpperCase()
      )
    : [];

  // Filter & sort visit history timeline (most recent first)
  const filteredVehicleJobs = vehicleJobs
    .filter((j) => {
      // 1. Job Type Filter
      const matchesType =
        timelineJobTypeFilter === 'all' || j.jobType === timelineJobTypeFilter;

      // 2. Date Range Filter
      const jobDate = j.serviceDate || j.receivedDate || j.entryDate || '';
      const matchesStart = !timelineStartDate || jobDate >= timelineStartDate;
      const matchesEnd = !timelineEndDate || jobDate <= timelineEndDate;

      return matchesType && matchesStart && matchesEnd;
    })
    .sort((a, b) => {
      const dateA = a.serviceDate || a.receivedDate || a.entryDate || '';
      const dateB = b.serviceDate || b.receivedDate || b.entryDate || '';
      return dateB.localeCompare(dateA);
    });

  return (
    <div className="space-y-6 text-slate-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-medium flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Vehicles</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Register and manage customer vehicles and view complete lifelong visit histories.
          </p>
        </div>

        <button
          id="register-vehicle-btn"
          onClick={handleOpenRegisterModal}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs flex items-center gap-2 shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Register Vehicle</span>
        </button>
      </div>

      {/* MAIN VEHICLE LIST */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden space-y-4">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              id="search-vehicle-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by plate number, brand, model, owner..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-900"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{filteredVehicles.length}</strong> vehicles
          </div>
        </div>

        {/* VEHICLE LIST TABLE (Columns: Plate Number, Brand, Model, Year, Owner) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Plate Number</th>
                <th className="py-3 px-4">Brand</th>
                <th className="py-3 px-4">Model</th>
                <th className="py-3 px-4">Year</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => setSelectedVehicle(v)}
                    className="hover:bg-slate-50/80 transition cursor-pointer group"
                  >
                    {/* Plate Number */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-slate-900">
                        {v.plateNumber}
                      </span>
                    </td>

                    {/* Brand */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {v.brand}
                    </td>

                    {/* Model */}
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {v.model}
                    </td>

                    {/* Year */}
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {v.year}
                    </td>

                    {/* Owner */}
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {v.customerName}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          id={`edit-vehicle-btn-${v.id}`}
                          onClick={(e) => handleOpenEditModal(v, e)}
                          className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
                          title="Edit Vehicle Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Car className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-slate-600">No vehicles found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try adjusting search query or register a new vehicle.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VEHICLE DETAIL MODAL / VIEW */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-3xl w-full my-6 overflow-hidden text-slate-900">
            {/* Header Bar */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h2 className="text-base font-bold tracking-tight">
                    {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.year})
                  </h2>
                  <span className="text-xs font-mono text-emerald-400">
                    Plate: {selectedVehicle.plateNumber}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="edit-current-vehicle-btn"
                  onClick={() => handleOpenEditModal(selectedVehicle)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-300" />
                  <span>Edit Vehicle</span>
                </button>
                <button
                  id="close-vehicle-detail-btn"
                  onClick={() => setSelectedVehicle(null)}
                  className="text-slate-400 hover:text-white transition p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* VEHICLE HEADER INFO GRID (Plate Number, Brand, Model, Year, Color, Owner, Mileage, VIN) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                    Plate Number
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {selectedVehicle.plateNumber}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                    Brand
                  </span>
                  <span className="font-semibold text-slate-900">
                    {selectedVehicle.brand}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                    Model
                  </span>
                  <span className="font-semibold text-slate-900">
                    {selectedVehicle.model}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                    Year
                  </span>
                  <span className="font-mono font-semibold text-slate-900">
                    {selectedVehicle.year}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                    Color
                  </span>
                  <span className="font-semibold text-slate-900">
                    {selectedVehicle.color || 'N/A'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                    Owner
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedVehicle.customerName}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                    Mileage
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedVehicle.mileage.toLocaleString()} km
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                    VIN
                  </span>
                  <span className="font-mono text-slate-700 text-[11px] truncate block">
                    {selectedVehicle.vin || '—'}
                  </span>
                </div>
              </div>

              {/* VISIT HISTORY TIMELINE SECTION */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-700" />
                      <span>Visit History</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Permanent lifelong service record for vehicle #{selectedVehicle.plateNumber}
                    </p>
                  </div>

                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                    Total Visits: {vehicleJobs.length}
                  </span>
                </div>

                {/* Filter Controls for Visit History Timeline */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="font-bold text-slate-700 text-[11px] uppercase">Filters:</span>

                    {/* Job Type Filter Dropdown */}
                    <select
                      id="timeline-filter-job-type"
                      value={timelineJobTypeFilter}
                      onChange={(e) => setTimelineJobTypeFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium outline-hidden"
                    >
                      <option value="all">All Job Types</option>
                      <option value="service">Service Only</option>
                      <option value="repair">Repair Only</option>
                    </select>
                  </div>

                  {/* Date Range Inputs */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">Date Range:</span>
                    <input
                      type="date"
                      value={timelineStartDate}
                      onChange={(e) => setTimelineStartDate(e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-mono text-slate-900 outline-hidden"
                      title="Start Date"
                    />
                    <span className="text-slate-400 text-xs">-</span>
                    <input
                      type="date"
                      value={timelineEndDate}
                      onChange={(e) => setTimelineEndDate(e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-mono text-slate-900 outline-hidden"
                      title="End Date"
                    />
                  </div>
                </div>

                {/* Timeline List (Most Recent First) */}
                <div className="space-y-2.5">
                  {filteredVehicleJobs.length > 0 ? (
                    filteredVehicleJobs.map((job) => {
                      const isService = job.jobType === 'service';

                      // Description summary
                      let shortDescription = '';
                      if (isService) {
                        if (job.servicesPerformed && job.servicesPerformed.length > 0) {
                          shortDescription = job.servicesPerformed
                            .map((s) => s.serviceName)
                            .join(', ');
                        } else {
                          shortDescription = job.customerComplaint || 'Scheduled Maintenance Service';
                        }
                      } else {
                        shortDescription =
                          job.customerComplaint ||
                          job.recommendedRepairs ||
                          job.inspectionResult ||
                          'Diagnostic Repair';
                      }

                      // Total Cost Calculation
                      const totalCost =
                        job.totalRepairCost ||
                        (job.inspectionFee || 0) +
                          (job.partsUsed?.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0) || 0) +
                          (job.laborCost || 0) ||
                        job.estimatedCost ||
                        0;

                      return (
                        <div
                          key={job.id}
                          id={`timeline-job-row-${job.id}`}
                          onClick={() => setSelectedJobForDetail(job)}
                          className="p-3.5 bg-white border border-slate-200 hover:border-slate-400 rounded-xl transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:shadow-xs group"
                        >
                          {/* Date & Job Badges */}
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {job.serviceDate || job.receivedDate || job.entryDate}
                              </span>

                              <JobTypeBadge type={job.jobType || (isService ? 'Service' : 'Repair')} />
                              <StatusBadge status={job.status} />

                              <span className="font-mono text-[11px] text-slate-400">
                                #{job.jobNumber}
                              </span>
                            </div>

                            {/* Short Description */}
                            <p className="text-xs text-slate-700 font-medium line-clamp-2">
                              {shortDescription}
                            </p>
                          </div>

                          {/* Total Cost & Navigation Arrow */}
                          <div className="flex items-center gap-3 shrink-0 text-right">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                                Total
                              </span>
                              <span className="font-mono font-bold text-sm text-slate-900">
                                ${totalCost.toFixed(2)}
                              </span>
                            </div>

                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-800 transition" />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400">
                      <Clock className="w-6 h-6 mx-auto mb-1 opacity-40" />
                      <p className="text-xs font-semibold text-slate-600">No visit history found</p>
                      <p className="text-[11px] text-slate-400">
                        {vehicleJobs.length > 0
                          ? 'Try clearing or modifying the timeline filters above.'
                          : 'No service or repair jobs have been recorded for this vehicle yet.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER / UPDATE VEHICLE FORM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-lg w-full overflow-hidden text-slate-900 my-8">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Car className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold tracking-tight">
                  {editingVehicle ? `Update Vehicle (${editingVehicle.plateNumber})` : 'Register New Vehicle'}
                </h3>
              </div>
              <button
                id="close-vehicle-form-modal"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white transition p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Owner Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Owner (Customer) <span className="text-rose-500">*</span>
                </label>
                <select
                  id="vehicle-owner-select"
                  value={formData.customerId}
                  onChange={(e) => {
                    const cust = customers.find((c) => c.id === e.target.value);
                    setFormData({
                      ...formData,
                      customerId: e.target.value,
                      customerName: cust ? cust.fullName : '',
                    });
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:border-slate-900 outline-hidden"
                  required
                >
                  <option value="">-- Select Owner --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Plate Number & VIN */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plate Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="vehicle-plate-input"
                    type="text"
                    value={formData.plateNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. 7XYZ890"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:border-slate-900 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    VIN <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="vehicle-vin-input"
                    type="text"
                    value={formData.vin}
                    onChange={(e) =>
                      setFormData({ ...formData, vin: e.target.value.toUpperCase() })
                    }
                    placeholder="17-Digit VIN"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:bg-white focus:border-slate-900 outline-hidden"
                  />
                </div>
              </div>

              {/* Brand, Model, Year */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="vehicle-brand-input"
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Toyota"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-900 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Model <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="vehicle-model-input"
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Camry"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-900 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Year
                  </label>
                  <input
                    id="vehicle-year-input"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-900 outline-hidden"
                  />
                </div>
              </div>

              {/* Color & Mileage */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Color
                  </label>
                  <input
                    id="vehicle-color-input"
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Silver"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-900 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mileage (km) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="vehicle-mileage-input"
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:bg-white focus:border-slate-900 outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  id="cancel-vehicle-form-btn"
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  id="submit-vehicle-form-btn"
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition"
                >
                  {editingVehicle ? 'Save Changes' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL REPAIR / SERVICE JOB DETAIL MODAL (WHEN TIMELINE ROW IS CLICKED) */}
      {selectedJobForDetail && (
        <RepairJobDetailModal
          job={selectedJobForDetail}
          isOpen={!!selectedJobForDetail}
          onClose={() => setSelectedJobForDetail(null)}
        />
      )}
    </div>
  );
};
