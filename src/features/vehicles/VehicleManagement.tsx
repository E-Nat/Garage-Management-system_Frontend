import React, { useState } from 'react';
import { useGarage } from '../../context/GarageContext';
import { useAuth } from '../../context/AuthContext';
import { Vehicle } from '../../types';
import {
  Car,
  Plus,
  Search,
  Edit2,
  History,
  Wrench,
  User,
  Hash,
  CheckCircle2,
  X,
  AlertCircle,
  FileText,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { motion } from 'motion/react';

export const VehicleManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const { customers, vehicles, vehicleChangeLogs, repairJobs, invoices, addVehicle, updateVehicle } = useGarage();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Modal States
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

  const handleOpenEditModal = (v: Vehicle) => {
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

    // Find selected customer name if customerId changes
    const targetCust = customers.find((c) => c.id === formData.customerId);
    const custName = targetCust ? targetCust.fullName : formData.customerName;

    if (!editingVehicle) {
      // Register New Vehicle
      const res = addVehicle({
        customerId: formData.customerId,
        customerName: custName,
        plateNumber: formData.plateNumber,
        brand: formData.brand,
        model: formData.model,
        year: Number(formData.year),
        color: formData.color,
        mileage: Number(formData.mileage),
        vin: formData.vin,
      });

      if (!res.success) {
        setFormError(res.error || 'Failed to register vehicle.');
        return;
      }

      showToast(`Vehicle ${res.vehicle?.id} (${formData.plateNumber}) registered!`);
    } else {
      // Update Existing Vehicle
      const res = updateVehicle(
        editingVehicle.id,
        {
          customerId: formData.customerId,
          customerName: custName,
          plateNumber: formData.plateNumber,
          brand: formData.brand,
          model: formData.model,
          year: Number(formData.year),
          color: formData.color,
          mileage: Number(formData.mileage),
          vin: formData.vin,
        },
        currentUser?.name || 'Staff User'
      );

      if (!res.success) {
        setFormError(res.error || 'Failed to update vehicle details.');
        return;
      }

      showToast(`Vehicle details for ${formData.plateNumber} updated!`);
      if (selectedVehicle?.id === editingVehicle.id) {
        setSelectedVehicle((prev) => (prev ? { ...prev, ...formData, customerName: custName } : null));
      }
    }

    setIsAddModalOpen(false);
  };

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-slate-900 text-white border border-slate-700 rounded-2xl shadow-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 text-slate-900 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Vehicle Management</h1>
        </div>

        <button
          id="register-vehicle-btn"
          onClick={handleOpenRegisterModal}
          className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl text-xs flex items-center gap-2 shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Register New Vehicle</span>
        </button>
      </div>

      {/* Search Bar & Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="search-vehicle-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by license plate or owner name..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-slate-900 outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span>Tracked Vehicles:</span>
            <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-900 font-bold rounded-lg">
              {filteredVehicles.length}
            </span>
          </div>
        </div>

        {/* Vehicles Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Vehicle ID</th>
                <th className="py-3 px-3">License Plate</th>
                <th className="py-3 px-3">Make / Model / Year</th>
                <th className="py-3 px-3">Owner Name</th>
                <th className="py-3 px-3">Mileage (km)</th>
                <th className="py-3 px-3">VIN</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVehicles.map((v) => {
                return (
                  <tr key={v.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                      {v.id}
                    </td>

                    <td className="py-3.5 px-3 font-mono font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 w-fit inline-block my-2">
                      {v.plateNumber}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900">
                        {v.brand} {v.model} ({v.year})
                      </div>
                      <div className="text-[10px] text-slate-500">Color: {v.color}</div>
                    </td>

                    <td className="py-3.5 px-3 font-semibold text-slate-800">
                      {v.customerName}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 font-mono">
                        {v.mileage.toLocaleString()} km
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-mono text-slate-500 text-[11px]">
                      {v.vin || '—'}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          id={`view-vehicle-${v.id}`}
                          onClick={() => setSelectedVehicle(v)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold rounded-lg transition flex items-center gap-1"
                        >
                          <History className="w-3.5 h-3.5 text-slate-500" />
                          <span>Service History</span>
                        </button>

                        <button
                          id={`edit-vehicle-${v.id}`}
                          onClick={() => handleOpenEditModal(v)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
                          title="Edit Vehicle & Record Mileage Change Log"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vehicle Detail View Modal (Includes Mileage/VIN Audit Change Log + Repair Service History) */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-3xl shadow-xl max-w-2xl w-full overflow-hidden text-slate-900"
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400">
                  License Plate: {selectedVehicle.plateNumber} • ID: {selectedVehicle.id}
                </span>
                <h3 className="text-lg font-bold">
                  {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.year})
                </h3>
              </div>
              <button
                id="close-vehicle-detail-modal"
                onClick={() => setSelectedVehicle(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Specs Header */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold">Registered Owner</span>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedVehicle.customerName}</div>
                </div>

                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold">Mileage (km)</span>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    {selectedVehicle.mileage.toLocaleString()} km
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold">VIN</span>
                  <div className="font-mono font-semibold text-slate-700 text-[11px] mt-0.5 truncate">
                    {selectedVehicle.vin || 'Not specified'}
                  </div>
                </div>
              </div>

              {/* Service History Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-slate-700" />
                    Service History ({repairJobs.filter((j) => j.licensePlate.toUpperCase() === selectedVehicle.plateNumber.toUpperCase() || j.vehicleId === selectedVehicle.id).length})
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Vehicle Plate: {selectedVehicle.plateNumber}</span>
                </div>

                <div className="space-y-3">
                  {repairJobs
                    .filter((j) => j.licensePlate.toUpperCase() === selectedVehicle.plateNumber.toUpperCase() || j.vehicleId === selectedVehicle.id)
                    .map((job) => {
                      const invoice = invoices.find((inv) => inv.repairJobId === job.id);

                      return (
                        <div
                          key={job.id}
                          className="p-4 bg-white border border-slate-200 rounded-2xl text-xs space-y-2 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{job.jobNumber}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                                {job.status.replace('_', ' ')}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                1 Year / 20,000 km Warranty
                              </span>
                            </div>

                            <div className="text-right">
                              <div className="font-bold text-slate-900">${job.estimatedCost || job.totalRepairCost}</div>
                              <div className="text-[10px] text-slate-400">{job.entryDate}</div>
                            </div>
                          </div>

                          <div className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                            <strong className="text-slate-900">Complaint:</strong> {job.customerComplaint || job.description}
                          </div>

                          {job.repairDetails && (
                            <div className="text-slate-600 text-[11px]">
                              <strong className="text-slate-800">Repair Scope:</strong> {job.repairDetails}
                            </div>
                          )}

                          {job.partsUsed && job.partsUsed.length > 0 && (
                            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase block">Parts Used:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {job.partsUsed.map((p, idx) => (
                                  <span key={idx} className="bg-white px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200 text-slate-800">
                                    {p.partName} (x{p.quantity}) — ${p.unitPrice * p.quantity}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {invoice && (
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                              <span className="text-slate-500">
                                Invoice: <strong className="font-mono text-slate-900">{invoice.id}</strong> ({invoice.status.toUpperCase()})
                              </span>
                              <span className="font-mono font-bold text-slate-900">${invoice.totalAmount}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                  {repairJobs.filter((j) => j.licensePlate.toUpperCase() === selectedVehicle.plateNumber.toUpperCase() || j.vehicleId === selectedVehicle.id).length === 0 && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center italic">
                      No repair service records logged yet for this vehicle.
                    </div>
                  )}
                </div>
              </div>

              {/* Inspection History Section */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-700" />
                    Inspection History
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Past Visit Records</span>
                </div>

                <div className="space-y-3">
                  {repairJobs
                    .filter((j) => j.licensePlate.toUpperCase() === selectedVehicle.plateNumber.toUpperCase() || j.vehicleId === selectedVehicle.id)
                    .flatMap((j) => (j.inspectionRecords || []).map((rec) => ({ ...rec, jobNum: j.jobNumber, plate: j.licensePlate })))
                    .map((rec) => (
                      <div key={rec.id} className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-2xl text-xs space-y-2">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200">
                              ID: {rec.id}
                            </span>
                            <span className="text-slate-600">Job: {rec.jobNum}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{rec.recordedAt}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-xl border border-indigo-100">
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold">Mechanic Inspector:</span>
                            <span className="font-semibold text-slate-800">{rec.recordedBy}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold">Mileage (km):</span>
                            <span className="font-mono font-semibold text-slate-800">
                              {rec.mileageAtInspection ? `${rec.mileageAtInspection.toLocaleString()} km` : `${selectedVehicle.mileage.toLocaleString()} km`}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-500 block text-[10px] font-bold uppercase">Diagnostic Findings / Notes:</span>
                          <p className="text-slate-900 font-medium bg-white p-2 rounded-xl border border-indigo-100">{rec.diagnosticNotes}</p>
                        </div>

                        {rec.recommendedRepairs && (
                          <div>
                            <span className="text-slate-500 block text-[10px] font-bold uppercase">Recommended Repairs:</span>
                            <p className="text-indigo-900 font-medium bg-white p-2 rounded-xl border border-indigo-100">{rec.recommendedRepairs}</p>
                          </div>
                        )}

                        {rec.photos && rec.photos.length > 0 && (
                          <div className="pt-1">
                            <span className="text-slate-500 block text-[10px] font-bold uppercase mb-1">Inspection Photos:</span>
                            <div className="flex gap-2">
                              {rec.photos.map((photo, pIdx) => (
                                <a
                                  key={pIdx}
                                  href={photo}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-indigo-600 underline font-mono truncate max-w-xs block"
                                >
                                  📷 View Inspection Photo #{pIdx + 1}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                  {repairJobs
                    .filter((j) => j.licensePlate.toUpperCase() === selectedVehicle.plateNumber.toUpperCase() || j.vehicleId === selectedVehicle.id)
                    .flatMap((j) => j.inspectionRecords || []).length === 0 && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center italic">
                      No inspection history records stored for past visits.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add / Edit Vehicle Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-3xl shadow-xl max-w-lg w-full overflow-hidden text-slate-900"
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Car className="w-5 h-5 text-white" />
                {editingVehicle ? `Update Vehicle: ${editingVehicle.id}` : 'Register New Vehicle'}
              </h3>
              <button
                id="close-vehicle-form-modal"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Vehicle Owner <span className="text-rose-500">*</span>
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
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-slate-900 outline-hidden"
                  required
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.id} • {c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Plate Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="vehicle-plate-input"
                    type="text"
                    value={formData.plateNumber}
                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
                    placeholder="e.g. 7XYZ890"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:border-slate-900 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    VIN <span className="text-slate-400">(Optional)</span>
                  </label>
                  <input
                    id="vehicle-vin-input"
                    type="text"
                    value={formData.vin}
                    onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                    placeholder="17-Digit VIN"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:border-slate-900 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Brand / Make <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="vehicle-brand-input"
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Porsche"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-slate-900 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Model <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="vehicle-model-input"
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="911 Carrera S"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-slate-900 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Year
                  </label>
                  <input
                    id="vehicle-year-input"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-slate-900 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Color
                  </label>
                  <input
                    id="vehicle-color-input"
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="GT Silver"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-slate-900 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Current Mileage (km) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="vehicle-mileage-input"
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:border-slate-900 outline-hidden"
                    required
                  />
                </div>
              </div>

              {editingVehicle && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs">
                  <div className="font-bold flex items-center gap-1">
                    <History className="w-3.5 h-3.5 text-amber-700" />
                    <span>Automated Audit Entry</span>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Modifying mileage or VIN will automatically create a system audit entry attributed to <span className="font-bold">{currentUser?.name}</span>.
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  id="cancel-vehicle-form-btn"
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  id="submit-vehicle-form-btn"
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition"
                >
                  {editingVehicle ? 'Save Changes' : 'Complete Registration'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
