import React, { useState } from 'react';
import { useGarage } from '../../context/GarageContext';
import { Invoice, RepairJob } from '../../types';
import {
  Receipt,
  Search,
  Printer,
  X,
  ArrowLeft,
  Calendar,
  Building2,
  Phone,
  Mail,
  FileText,
  CreditCard,
  Download,
  CheckCircle2,
  Send,
  Plus,
  Wrench,
  Car,
  AlertCircle,
  Eye,
  Check,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import logoImg from '../../assets/images/logo.png';

export const InvoiceManagement: React.FC = () => {
  const {
    invoices,
    repairJobs,
    paymentRecords,
    paymentMethods,
    systemSettings,
    simulatePayment,
    createInvoiceFromJob,
  } = useGarage();

  const [searchTerm, setSearchTerm] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    success: boolean;
    message: string;
    telegramConnected: boolean;
  } | null>(null);

  // Create Invoice Modal State
  const [isCreateInvoiceModalOpen, setIsCreateInvoiceModalOpen] = useState(false);
  const [jobSearchTerm, setJobSearchTerm] = useState('');
  const [isConfirmDemoPaymentModalOpen, setIsConfirmDemoPaymentModalOpen] = useState(false);

  // Today's Date String YYYY-MM-DD
  const todayStr = new Date().toISOString().substring(0, 10);

  // Filter Invoices
  const filteredInvoices = invoices.filter((inv) => {
    // Search Term
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      inv.id.toLowerCase().includes(term) ||
      (inv.repairJobNumber && inv.repairJobNumber.toLowerCase().includes(term)) ||
      (inv.customerName && inv.customerName.toLowerCase().includes(term)) ||
      (inv.vehicleInfo && inv.vehicleInfo.toLowerCase().includes(term));

    // Date Filter
    let matchesDate = true;
    const invDate = (inv.issuedAt || '').substring(0, 10);
    if (dateRangeFilter === 'today') {
      matchesDate = invDate === todayStr;
    } else if (dateRangeFilter === 'past_7_days') {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 7);
      const past7Str = past7.toISOString().substring(0, 10);
      matchesDate = invDate >= past7Str;
    } else if (dateRangeFilter === 'this_month') {
      matchesDate = invDate.substring(0, 7) === todayStr.substring(0, 7);
    } else if (dateRangeFilter === 'custom') {
      if (customStartDate && invDate < customStartDate) matchesDate = false;
      if (customEndDate && invDate > customEndDate) matchesDate = false;
    }

    // Payment Method Filter
    let matchesMethod = true;
    if (paymentMethodFilter !== 'all') {
      matchesMethod = inv.paymentMethod === paymentMethodFilter;
    }

    // Status Filter
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      matchesStatus = inv.status === statusFilter;
    }

    return matchesSearch && matchesDate && matchesMethod && matchesStatus;
  });

  // Calculate Running Total of Filtered Invoices
  const runningTotal = filteredInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

  // Print / Download PDF Handler
  const handlePrintPDF = () => {
    window.print();
  };

  // Associated Payment Records for Selected Invoice
  const selectedInvoicePayments = selectedInvoice
    ? paymentRecords.filter(
        (p) =>
          p.invoiceId === selectedInvoice.id ||
          p.repairJobId === selectedInvoice.repairJobId
      )
    : [];

  const garageInfo = systemSettings.garageInfo;

  const handleSimulatePayment = async () => {
    if (!selectedInvoice) return;
    setIsSimulating(true);
    setSimulationResult(null);
    try {
      const res = await simulatePayment(selectedInvoice.id);
      if (res.success) {
        setSimulationResult({
          success: true,
          message: res.message || 'Payment successful. Your e-Invoice has been generated.',
          telegramConnected: Boolean(res.telegramConnected),
        });
        setSelectedInvoice((prev) =>
          prev
            ? {
                ...prev,
                status: 'paid',
                paymentMethod: 'Demo Payment',
                totalPaid: prev.totalAmount,
                balanceRemaining: 0,
                paidAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
              }
            : null
        );
      } else {
        alert(res.error || 'Failed to simulate payment');
      }
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* If Invoice Detail is Selected */}
      {selectedInvoice ? (
        <div className="space-y-4">
          {/* Top Actions Bar (Hidden in Print) */}
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs print:hidden">
            <button
              id="back-to-invoices-btn"
              onClick={() => {
                setSelectedInvoice(null);
                setSimulationResult(null);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Invoices</span>
            </button>

            <div className="flex items-center gap-2">
              {selectedInvoice.status !== 'paid' && (
                <button
                  id="simulate-payment-top-btn"
                  onClick={() => setIsConfirmDemoPaymentModalOpen(true)}
                  disabled={isSimulating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs flex items-center gap-2 transition shadow-xs cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{isSimulating ? 'Processing...' : 'Simulate Payment'}</span>
                </button>
              )}

              <button
                id="download-invoice-pdf-btn"
                onClick={handlePrintPDF}
                className="px-4 py-2 bg-[#FF6B00] hover:bg-[#E56000] text-white font-semibold rounded-lg text-xs flex items-center gap-2 transition shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          {/* Printable Invoice Sheet */}
          <div
            id="printed-invoice-sheet"
            className="bg-white p-8 sm:p-12 rounded-xl border border-slate-200 shadow-xs max-w-4xl mx-auto text-slate-900 space-y-8 print:p-0 print:border-none print:shadow-none"
          >
            {/* Header: Garage Info & Invoice Title */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-8">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <img
                    src={(garageInfo.logoUrl && !garageInfo.logoUrl.includes('unsplash.com')) ? garageInfo.logoUrl : logoImg}
                    alt={garageInfo.garageName || 'Garage Logo'}
                    className="h-10 max-w-32 object-contain rounded-lg border border-slate-200"
                  />
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    {garageInfo.garageName || 'Apex Performance Auto'}
                  </h1>
                </div>
                <div className="text-xs text-slate-600 space-y-0.5">
                  <p>{garageInfo.address || '742 Evergreen Terrace, Sector 4'}</p>
                  <p className="flex items-center gap-2">
                    <span>Phone: {garageInfo.phone || '+1 (555) 019-2834'}</span>
                    <span>•</span>
                    <span>Email: {garageInfo.email || 'service@apexgarage.com'}</span>
                  </p>
                  {garageInfo.taxId && (
                    <p className="font-mono text-slate-500">Tax ID: {garageInfo.taxId}</p>
                  )}
                </div>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                  INVOICE
                </div>
                <div className="text-xs font-mono font-bold text-slate-700">
                  {selectedInvoice.id}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Date: {selectedInvoice.issuedAt ? selectedInvoice.issuedAt.substring(0, 10) : todayStr}
                </div>
                {selectedInvoice.repairJobNumber && (
                  <div className="text-xs text-slate-500 font-mono">
                    Repair Job: {selectedInvoice.repairJobNumber}
                  </div>
                )}
                <div className="pt-1">
                  <StatusBadge status={selectedInvoice.status} size="sm" />
                </div>
              </div>
            </div>

            {/* Bill To & Vehicle Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-lg border border-slate-200 text-xs">
              <div className="space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Bill To
                </div>
                <div className="font-bold text-sm text-slate-900">
                  {selectedInvoice.customerName}
                </div>
                {selectedInvoice.customerId && (
                  <div className="font-mono text-slate-500">ID: {selectedInvoice.customerId}</div>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Vehicle Details
                </div>
                <div className="font-bold text-slate-900">
                  {selectedInvoice.vehicleInfo}
                </div>
                {selectedInvoice.repairDetails && (
                  <div className="text-slate-600 line-clamp-2">
                    {selectedInvoice.repairDetails}
                  </div>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Services & Parts Performed
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-center">Type</th>
                      <th className="py-3 px-4 text-center">Qty / Hrs</th>
                      <th className="py-3 px-4 text-right">Unit Price</th>
                      <th className="py-3 px-4 text-right">Discount</th>
                      <th className="py-3 px-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Services */}
                    {selectedInvoice.servicesPerformed && selectedInvoice.servicesPerformed.length > 0 ? (
                      selectedInvoice.servicesPerformed.map((svc, idx) => {
                        const netPrice = (svc.price || 0) - (svc.discountAmount || 0);
                        return (
                          <tr key={`svc-${idx}`} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-medium text-slate-900">
                              {svc.serviceName}
                            </td>
                            <td className="py-3 px-4 text-center text-slate-500">Service</td>
                            <td className="py-3 px-4 text-center font-mono">1</td>
                            <td className="py-3 px-4 text-right font-mono">
                              ${(svc.price || 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-emerald-700">
                              {svc.discountAmount && svc.discountAmount > 0
                                ? `-$${svc.discountAmount.toFixed(2)}`
                                : '—'}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                              ${Math.max(0, netPrice).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    ) : null}

                    {/* Parts */}
                    {selectedInvoice.partsUsed && selectedInvoice.partsUsed.length > 0 ? (
                      selectedInvoice.partsUsed.map((prt, idx) => {
                        const grossTotal = prt.totalPrice || (prt.quantity * prt.unitPrice);
                        const netTotal = grossTotal - (prt.discountAmount || 0);
                        return (
                          <tr key={`prt-${idx}`} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4">
                              <div className="font-medium text-slate-900">{prt.partName}</div>
                              {prt.partNumber && (
                                <div className="text-[10px] font-mono text-slate-500">
                                  {prt.partNumber}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center text-slate-500">Part</td>
                            <td className="py-3 px-4 text-center font-mono">{prt.quantity}</td>
                            <td className="py-3 px-4 text-right font-mono">
                              ${(prt.unitPrice || 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-emerald-700">
                              {prt.discountAmount && prt.discountAmount > 0
                                ? `-$${prt.discountAmount.toFixed(2)}`
                                : '—'}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                              ${Math.max(0, netTotal).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    ) : null}

                    {/* Inspection Fee if any */}
                    {selectedInvoice.inspectionFee && selectedInvoice.inspectionFee > 0 ? (
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-medium text-slate-900">
                          Diagnostic & Inspection Fee
                        </td>
                        <td className="py-3 px-4 text-center text-slate-500">Diagnostic</td>
                        <td className="py-3 px-4 text-center font-mono">1</td>
                        <td className="py-3 px-4 text-right font-mono">
                          ${selectedInvoice.inspectionFee.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-400">—</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          ${selectedInvoice.inspectionFee.toFixed(2)}
                        </td>
                      </tr>
                    ) : null}

                    {/* Labor if listed separately */}
                    {selectedInvoice.laborCost && selectedInvoice.laborCost > 0 ? (
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-medium text-slate-900">
                          Labor Charges ({selectedInvoice.laborHours || 0} hrs)
                        </td>
                        <td className="py-3 px-4 text-center text-slate-500">Labor</td>
                        <td className="py-3 px-4 text-center font-mono">
                          {selectedInvoice.laborHours || 1}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          ${selectedInvoice.laborCost.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-400">—</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          ${selectedInvoice.laborCost.toFixed(2)}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations & Totals */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t border-slate-200">
              {/* Payment & Terms Note */}
              <div className="w-full sm:w-1/2 space-y-3 text-xs text-slate-600">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Payment Information
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">Payment Status:</span>
                    {selectedInvoice.status === 'paid' ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 text-xs">
                        ✅ PAID
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200 uppercase text-xs">
                        {selectedInvoice.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <p>
                    Payment Method:{' '}
                    <span className="font-semibold text-slate-900">
                      {selectedInvoice.paymentMethod || (selectedInvoice.status === 'paid' ? 'Demo Payment' : '—')}
                    </span>
                  </p>
                  {selectedInvoice.paidAt && (
                    <p>
                      Paid At: <span className="font-mono text-slate-700">{selectedInvoice.paidAt}</span>
                    </p>
                  )}
                  {selectedInvoice.notes && (
                    <p className="text-slate-500 text-[11px] pt-0.5">Notes: {selectedInvoice.notes}</p>
                  )}
                </div>

                {/* Simulate Payment Card for Unpaid Invoices */}
                {selectedInvoice.status !== 'paid' && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 print:hidden">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 text-xs">Simulate Demo Payment</span>
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Competition Mode
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Process a simulated payment to test invoice settlement, PDF generation, and real-time Telegram delivery.
                    </p>
                    <button
                      type="button"
                      id="simulate-payment-action-btn"
                      onClick={() => setIsConfirmDemoPaymentModalOpen(true)}
                      disabled={isSimulating}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{isSimulating ? 'Processing Simulated Payment...' : 'Simulate Payment'}</span>
                    </button>
                  </div>
                )}

                {/* Simulation / Payment Feedback Banner */}
                {simulationResult && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-xs text-emerald-900 print:hidden">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Payment successful. Your e-Invoice has been generated.</span>
                    </div>
                    {simulationResult.telegramConnected ? (
                      <p className="text-[11px] text-emerald-700 font-medium pl-5.5 flex items-center gap-1.5">
                        <span>📱 Invoice sent to Telegram.</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-600 font-medium pl-5.5">
                        Telegram is not connected. You can still download the invoice.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Numerical Breakdown */}
              <div className="w-full sm:w-80 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium text-slate-900">
                    ${(selectedInvoice.subtotal || 0).toFixed(2)}
                  </span>
                </div>

                {selectedInvoice.itemDiscountsTotal && selectedInvoice.itemDiscountsTotal > 0 ? (
                  <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700">
                    <span>Item Discounts:</span>
                    <span className="font-mono font-medium">
                      -${selectedInvoice.itemDiscountsTotal.toFixed(2)}
                    </span>
                  </div>
                ) : null}

                {selectedInvoice.manualDiscountsTotal && selectedInvoice.manualDiscountsTotal > 0 ? (
                  <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700">
                    <span>
                      Order Discount {selectedInvoice.manualDiscountReason ? `(${selectedInvoice.manualDiscountReason})` : ''}:
                    </span>
                    <span className="font-mono font-medium">
                      -${selectedInvoice.manualDiscountsTotal.toFixed(2)}
                    </span>
                  </div>
                ) : null}

                {selectedInvoice.campaignDiscountTotal && selectedInvoice.campaignDiscountTotal > 0 ? (
                  <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700">
                    <span>
                      Campaign {selectedInvoice.campaignName ? `(${selectedInvoice.campaignName})` : ''}:
                    </span>
                    <span className="font-mono font-medium">
                      -${selectedInvoice.campaignDiscountTotal.toFixed(2)}
                    </span>
                  </div>
                ) : null}

                {selectedInvoice.tax && selectedInvoice.tax > 0 ? (
                  <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                    <span>Tax:</span>
                    <span className="font-mono font-medium text-slate-900">
                      ${selectedInvoice.tax.toFixed(2)}
                    </span>
                  </div>
                ) : null}

                <div className="flex justify-between py-2 border-b-2 border-slate-900 text-slate-900 font-bold text-sm">
                  <span>Grand Total:</span>
                  <span className="font-mono">
                    ${(selectedInvoice.totalAmount || 0).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between py-1 text-slate-700 font-medium">
                  <span>Total Paid:</span>
                  <span className="font-mono text-emerald-700 font-bold">
                    ${(selectedInvoice.totalPaid || 0).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between py-1 text-slate-900 font-bold">
                  <span>Balance Due:</span>
                  <span
                    className={`font-mono ${
                      (selectedInvoice.balanceRemaining ?? 0) > 0 ? 'text-rose-600' : 'text-slate-900'
                    }`}
                  >
                    ${(selectedInvoice.balanceRemaining ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment History Log (if any payments recorded) */}
            {selectedInvoicePayments.length > 0 && (
              <div className="pt-6 border-t border-slate-200 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Payment Transactions
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                        <th className="py-2.5 px-4">Receipt #</th>
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4">Method</th>
                        <th className="py-2.5 px-4">Type</th>
                        <th className="py-2.5 px-4 text-right">Amount</th>
                        <th className="py-2.5 px-4">Recorded By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedInvoicePayments.map((pay) => (
                        <tr key={pay.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-mono text-slate-700">{pay.id}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-600">{pay.date}</td>
                          <td className="py-2.5 px-4 text-slate-900 font-medium">{pay.method}</td>
                          <td className="py-2.5 px-4 uppercase text-[10px] text-slate-500 font-semibold">
                            {pay.type}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">
                            ${pay.amount.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600">{pay.recordedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Terms & Footer Disclaimer from Settings */}
            {(systemSettings.invoiceSettings.footerDisclaimer || systemSettings.invoiceSettings.paymentTerms) && (
              <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
                {systemSettings.invoiceSettings.paymentTerms && (
                  <p><span className="font-semibold text-slate-700">Terms:</span> {systemSettings.invoiceSettings.paymentTerms}</p>
                )}
                {systemSettings.invoiceSettings.footerDisclaimer && (
                  <p className="whitespace-pre-line">{systemSettings.invoiceSettings.footerDisclaimer}</p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Invoice List / Reporting Screen */
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-slate-700" />
                Invoices
              </h1>
              <button
                type="button"
                id="open-create-invoice-modal-btn"
                onClick={() => {
                  setJobSearchTerm('');
                  setIsCreateInvoiceModalOpen(true);
                }}
                className="px-3 py-1.5 bg-[#FF6B00] hover:bg-[#E56000] text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Invoice</span>
              </button>
            </div>

            {/* Running Total Summary Card */}
            <div className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-3 shadow-xs">
              <span className="text-xs text-slate-300 font-medium">Running Total:</span>
              <span className="text-base font-bold font-mono text-emerald-400">
                ${runningTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Filters and Table Container */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
              {/* Search */}
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="search-invoices-input"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search invoice, customer, vehicle..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-none transition-colors"
                />
              </div>

              {/* Date Range & Payment Method Filters */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                {/* Date Filter */}
                <select
                  id="invoice-date-filter-select"
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-none"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="past_7_days">Past 7 Days</option>
                  <option value="this_month">This Month</option>
                  <option value="custom">Custom Range</option>
                </select>

                {dateRangeFilter === 'custom' && (
                  <div className="flex items-center gap-1">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                    />
                    <span className="text-slate-400 text-xs">to</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>
                )}

                {/* Payment Method Filter */}
                <select
                  id="invoice-payment-method-filter-select"
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-none"
                >
                  <option value="all">All Payment Methods</option>
                  {paymentMethods.map((pm) => (
                    <option key={pm.id} value={pm.name}>
                      {pm.name}
                    </option>
                  ))}
                </select>

                {/* Payment Status Filter */}
                <select
                  id="invoice-status-filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Vehicle</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.length > 0 ? (
                    filteredInvoices.map((inv) => (
                      <tr
                        key={inv.id}
                        id={`invoice-row-${inv.id}`}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Invoice Number */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {inv.id}
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {inv.customerName}
                        </td>

                        {/* Vehicle */}
                        <td className="py-3.5 px-4 text-slate-700">
                          {inv.vehicleInfo}
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {inv.issuedAt ? inv.issuedAt.substring(0, 10) : '—'}
                        </td>

                        {/* Payment Method */}
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {inv.paymentMethod || '—'}
                        </td>

                        {/* Payment Status Badge */}
                        <td className="py-3.5 px-4 text-center">
                          <StatusBadge status={inv.status} size="sm" />
                        </td>

                        {/* Total */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                          ${(inv.totalAmount || 0).toFixed(2)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedInvoice(inv)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded transition flex items-center gap-1 cursor-pointer"
                              title="View Invoice"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setTimeout(() => window.print(), 100);
                              }}
                              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition cursor-pointer"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No invoices match your selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Create Invoice from Repair Job Modal */}
          {isCreateInvoiceModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-2xl w-full my-8 overflow-hidden text-slate-900 space-y-4 p-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-[#FF6B00]" />
                      <span>Create Invoice from Repair Job</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select a repair job to generate an electronic billing invoice
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCreateInvoiceModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Job Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={jobSearchTerm}
                    onChange={(e) => setJobSearchTerm(e.target.value)}
                    placeholder="Search by customer, vehicle, or job # (e.g. RO-2026-0481)..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-none"
                  />
                </div>

                {/* Repair Jobs List */}
                <div className="max-h-96 overflow-y-auto space-y-2.5">
                  {repairJobs
                    .filter((job) => {
                      if (!jobSearchTerm.trim()) return true;
                      const t = jobSearchTerm.toLowerCase();
                      return (
                        job.jobNumber.toLowerCase().includes(t) ||
                        job.customerName.toLowerCase().includes(t) ||
                        job.vehicleMake.toLowerCase().includes(t) ||
                        job.vehicleModel.toLowerCase().includes(t) ||
                        job.licensePlate.toLowerCase().includes(t)
                      );
                    })
                    .map((job) => {
                      const existingInv = invoices.find((inv) => inv.repairJobId === job.id);
                      const isComplete = job.status === 'completed' || job.status === 'delivered';

                      return (
                        <div
                          key={job.id}
                          className={`p-4 rounded-xl border transition ${
                            existingInv
                              ? 'bg-amber-50/50 border-amber-200'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-xs text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                                  #{job.jobNumber}
                                </span>
                                <span className="font-bold text-xs text-slate-900">
                                  {job.customerName}
                                </span>
                                <span className="text-xs text-slate-500">•</span>
                                <span className="text-xs text-slate-700">
                                  {job.vehicleMake} {job.vehicleModel} ({job.licensePlate})
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                <span>Status: <StatusBadge status={job.status} size="sm" /></span>
                                <span>•</span>
                                <span className="font-mono font-semibold text-slate-800">
                                  Est. Total: ${((job.totalRepairCost || job.estimatedCost || 0)).toFixed(2)}
                                </span>
                              </div>

                              {existingInv && (
                                <div className="text-[11px] text-amber-800 font-semibold flex items-center gap-1 mt-1">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>This repair already has an active invoice: <strong className="font-mono">{existingInv.id}</strong> ({existingInv.status.toUpperCase()})</span>
                                </div>
                              )}
                            </div>

                            <div className="shrink-0 flex items-center gap-2">
                              {existingInv ? (
                                <button
                                  type="button"
                                  id={`view-existing-inv-${job.id}`}
                                  onClick={() => {
                                    setIsCreateInvoiceModalOpen(false);
                                    setSelectedInvoice(existingInv);
                                  }}
                                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View Invoice</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  id={`create-invoice-for-job-${job.id}`}
                                  onClick={() => {
                                    const result = createInvoiceFromJob(job.id);
                                    if (result.success && result.invoice) {
                                      setIsCreateInvoiceModalOpen(false);
                                      setSelectedInvoice(result.invoice);
                                    } else {
                                      alert(result.error || 'Failed to create invoice.');
                                    }
                                  }}
                                  className="px-3.5 py-1.5 bg-[#FF6B00] hover:bg-[#E56000] text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Create Invoice</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateInvoiceModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirm Demo Payment Modal */}
      {isConfirmDemoPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden text-slate-900">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Confirm Demo Payment?</h3>
              </div>
              <button
                onClick={() => setIsConfirmDemoPaymentModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Invoice:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedInvoice.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Customer:</span>
                  <span className="font-bold text-slate-900">{selectedInvoice.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Vehicle:</span>
                  <span className="font-bold text-slate-900">{selectedInvoice.vehicleInfo}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                  <span className="text-slate-700 font-bold">Amount to Pay:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    ${(selectedInvoice.balanceRemaining ?? selectedInvoice.totalAmount ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-medium">Payment Method:</span>
                  <span className="font-semibold text-slate-900">Demo Payment</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Notice:</strong> This is a simulated demo payment for competition & demonstration purposes. No real bank transaction or credit card charge will occur.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsConfirmDemoPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="confirm-demo-payment-btn"
                  onClick={() => {
                    setIsConfirmDemoPaymentModalOpen(false);
                    handleSimulatePayment();
                  }}
                  disabled={isSimulating}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{isSimulating ? 'Processing...' : 'Confirm Demo Payment'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
