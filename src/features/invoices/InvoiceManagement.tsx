import React, { useState } from 'react';
import { useGarage } from '../../context/GarageContext';
import { useAuth } from '../../context/AuthContext';
import { Invoice, PaymentRecord } from '../../types';
import {
  Receipt,
  Plus,
  Search,
  DollarSign,
  CheckCircle2,
  Clock,
  Printer,
  CreditCard,
  Building2,
  Banknote,
  Send,
  X,
  FileText,
  Tag,
  Gift,
  History,
  AlertCircle,
  Percent,
} from 'lucide-react';
import { motion } from 'motion/react';

export const InvoiceManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    invoices,
    repairJobs,
    createInvoiceFromJob,
    recordPayment,
    paymentRecords,
    paymentMethods,
    discountReasons,
    discountCampaigns,
    updateInvoiceDiscounts,
  } = useGarage();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Generate Invoice Modal State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(repairJobs[0]?.id || '');
  const [genManualType, setGenManualType] = useState<'fixed' | 'percentage'>('fixed');
  const [genManualVal, setGenManualVal] = useState<number>(0);
  const [genManualReason, setGenManualReason] = useState<string>('');
  const [genCampaignId, setGenCampaignId] = useState<string>('');

  // Record Payment Modal State
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [paymentType, setPaymentType] = useState<'deposit' | 'partial' | 'final'>('partial');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // Discount Modal State
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discManualType, setDiscManualType] = useState<'fixed' | 'percentage'>('fixed');
  const [discManualVal, setDiscManualVal] = useState<number>(0);
  const [discManualReason, setDiscManualReason] = useState<string>('');
  const [discCampaignId, setDiscCampaignId] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const activePaymentMethods = paymentMethods.filter((m) => m.status === 'active');
  const activeDiscountReasons = discountReasons.filter((r) => r.status === 'active');
  const activeCampaigns = discountCampaigns.filter((c) => c.status === 'active');

  const handleGenerateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId) return;

    const res = createInvoiceFromJob(
      selectedJobId,
      undefined,
      genManualVal,
      genManualType,
      genManualReason,
      genCampaignId || undefined
    );

    if (res.success && res.invoice) {
      showToast(`Invoice ${res.invoice.id} created for ${res.invoice.customerName}!`);
      setIsGenerateModalOpen(false);
      setSelectedInvoice(res.invoice);
    } else {
      alert(res.error || 'Failed to create invoice');
    }
  };

  const handleOpenRecordPayment = (inv: Invoice) => {
    setSelectedInvoice(inv);
    const remaining = inv.balanceRemaining ?? (inv.totalAmount - (inv.totalPaid || 0));
    setPaymentAmount(remaining > 0 ? remaining : inv.totalAmount);
    setPaymentType(remaining >= inv.totalAmount ? 'deposit' : remaining <= 0 ? 'final' : 'partial');
    setPaymentMethod(activePaymentMethods[0]?.name || 'Cash');
    setIsRecordPaymentOpen(true);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const res = recordPayment({
      repairJobId: selectedInvoice.repairJobId,
      invoiceId: selectedInvoice.id,
      amount: Number(paymentAmount),
      date: paymentDate,
      method: paymentMethod,
      type: paymentType,
      notes: paymentNotes,
      recordedBy: currentUser?.name || 'Service Staff',
    });

    if (res.success) {
      showToast(`Payment of $${paymentAmount} recorded via ${paymentMethod}!`);
      setIsRecordPaymentOpen(false);
      // Refresh selected invoice view
      const updatedInv = invoices.find((i) => i.id === selectedInvoice.id);
      if (updatedInv) setSelectedInvoice(updatedInv);
    } else {
      alert(res.error || 'Failed to record payment');
    }
  };

  const handleOpenDiscountModal = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setDiscManualType(inv.manualDiscountType || 'fixed');
    setDiscManualVal(inv.manualDiscountValue || 0);
    setDiscManualReason(inv.manualDiscountReason || activeDiscountReasons[0]?.reason || '');
    setDiscCampaignId(inv.campaignId || '');
    setIsDiscountModalOpen(true);
  };

  const handleSubmitDiscounts = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    if (discManualVal > 0 && !discManualReason) {
      alert('A discount reason is required for manual discounts.');
      return;
    }

    const res = updateInvoiceDiscounts({
      invoiceId: selectedInvoice.id,
      manualDiscountType: discManualType,
      manualDiscountValue: Number(discManualVal),
      manualDiscountReason: discManualReason,
      campaignId: discCampaignId || undefined,
    });

    if (res.success && res.invoice) {
      showToast(`Discounts updated for Invoice ${selectedInvoice.id}!`);
      setIsDiscountModalOpen(false);
      setSelectedInvoice(res.invoice);
    } else {
      alert(res.error || 'Failed to update discounts');
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleSendTelegramPDF = (inv: Invoice) => {
    showToast(`PDF Invoice ${inv.id} sent to Telegram chat for ${inv.customerName}!`);
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.repairJobNumber.toLowerCase().includes(searchTerm.toLowerCase())
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold mb-2">
            <Receipt className="w-3.5 h-3.5 text-slate-900" />
            Billing, Invoicing & Payment Processing
          </div>
          <h1 className="text-2xl font-bold">Invoices & Payments</h1>
          <p className="text-xs text-slate-500 mt-1">
            Auto-generate invoices, apply multi-tier discounts, record deposit/partial/final payments, and export/send PDF receipts via Telegram.
          </p>
        </div>

        <button
          id="generate-invoice-btn"
          onClick={() => {
            if (repairJobs.length > 0) setSelectedJobId(repairJobs[0].id);
            setIsGenerateModalOpen(true);
          }}
          className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl text-xs flex items-center gap-2 shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Generate New Invoice</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="search-invoice-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by invoice ID, customer, order #..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-slate-900 outline-hidden"
            />
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Total Unpaid Balance:</span>
              <span className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-lg font-mono">
                ${invoices.reduce((sum, i) => sum + (i.balanceRemaining ?? (i.status === 'paid' ? 0 : i.totalAmount)), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Invoice ID</th>
                <th className="py-3 px-3">RO #</th>
                <th className="py-3 px-3">Customer & Vehicle</th>
                <th className="py-3 px-3 text-right">Total Cost</th>
                <th className="py-3 px-3 text-right">Paid</th>
                <th className="py-3 px-3 text-right">Balance</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => {
                const paidAmt = inv.totalPaid || 0;
                const bal = inv.balanceRemaining !== undefined ? inv.balanceRemaining : inv.totalAmount - paidAmt;

                return (
                  <tr key={inv.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                      {inv.id}
                    </td>

                    <td className="py-3.5 px-3 font-mono text-slate-700 font-semibold">
                      {inv.repairJobNumber}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900">{inv.customerName}</div>
                      <div className="text-[10px] text-slate-500">{inv.vehicleInfo}</div>
                    </td>

                    <td className="py-3.5 px-3 text-right font-bold text-slate-900 font-mono text-xs">
                      ${(inv.totalAmount || 0).toFixed(2)}
                    </td>

                    <td className="py-3.5 px-3 text-right font-bold text-emerald-700 font-mono text-xs">
                      ${(paidAmt || 0).toFixed(2)}
                    </td>

                    <td className="py-3.5 px-3 text-right font-bold text-rose-700 font-mono text-xs">
                      ${(bal || 0).toFixed(2)}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          inv.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : inv.status === 'partially_paid'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          id={`view-invoice-${inv.id}`}
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-semibold rounded-lg transition shadow-xs flex items-center gap-1"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>View</span>
                        </button>

                        <button
                          id={`record-pay-${inv.id}`}
                          onClick={() => handleOpenRecordPayment(inv)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition shadow-xs flex items-center gap-1"
                        >
                          <DollarSign className="w-3 h-3" />
                          <span>Pay</span>
                        </button>

                        <button
                          id={`send-telegram-${inv.id}`}
                          onClick={() => handleSendTelegramPDF(inv)}
                          className="p-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg transition"
                          title="Send PDF Invoice via Telegram"
                        >
                          <Send className="w-3.5 h-3.5" />
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

      {/* Invoice Detail / Print Receipt Modal */}
      {selectedInvoice && !isRecordPaymentOpen && !isDiscountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-3xl shadow-xl max-w-2xl w-full overflow-hidden text-slate-900 my-8"
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    Official Tax Invoice
                  </span>
                  <h3 className="text-base font-bold">{selectedInvoice.id}</h3>
                </div>
              </div>
              <button
                id="close-invoice-modal"
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Header Info */}
              <div className="flex justify-between items-start pb-4 border-b border-slate-200 text-xs">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">APEX AUTOMOTIVE GARAGE</h4>
                  <p className="text-slate-500">100 Service Lane, San Francisco, CA</p>
                  <p className="text-slate-500">Phone: +1 (555) 019-2831</p>
                </div>

                <div className="text-right font-mono">
                  <div className="font-bold text-slate-900">Date: {selectedInvoice.issuedAt}</div>
                  <div className="text-slate-500 text-[11px]">RO #: {selectedInvoice.repairJobNumber}</div>
                </div>
              </div>

              {/* Billed To */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Billed Customer</span>
                <div className="font-bold text-slate-900 text-sm">{selectedInvoice.customerName}</div>
                <div className="text-slate-600 font-mono text-[11px]">{selectedInvoice.vehicleInfo}</div>
              </div>

              {/* Parts & Services Breakdown Table */}
              <div className="space-y-2">
                <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Parts & Service Line Items</h5>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-mono">
                      <tr>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3">Part Source</th>
                        <th className="py-2 px-3 text-right">Qty</th>
                        <th className="py-2 px-3 text-right">Unit Price</th>
                        <th className="py-2 px-3 text-right">Discount</th>
                        <th className="py-2 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="bg-slate-50/50 font-semibold">
                        <td className="py-2.5 px-3">Labor Services & Diagnostics</td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">Garage Labor</td>
                        <td className="py-2.5 px-3 text-right font-mono">{selectedInvoice.laborHours || 1.5} hrs</td>
                        <td className="py-2.5 px-3 text-right font-mono">${selectedInvoice.laborCost || 135}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400">$0.00</td>
                        <td className="py-2.5 px-3 text-right font-mono">${selectedInvoice.laborCost || 135}</td>
                      </tr>

                      <tr className="bg-slate-50/50 font-semibold">
                        <td className="py-2.5 px-3">Standard Vehicle Inspection Fee</td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">Inspection</td>
                        <td className="py-2.5 px-3 text-right font-mono">1</td>
                        <td className="py-2.5 px-3 text-right font-mono">${selectedInvoice.inspectionFee ?? 50}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400">$0.00</td>
                        <td className="py-2.5 px-3 text-right font-mono">${selectedInvoice.inspectionFee ?? 50}</td>
                      </tr>

                      {(selectedInvoice.partsUsed || []).map((p, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{p.partName}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${p.isCustomerProvided ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                              {p.isCustomerProvided ? 'Customer Provided' : 'Garage Stock'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">{p.quantity}</td>
                          <td className="py-2.5 px-3 text-right font-mono">${p.isCustomerProvided ? '0.00' : (p.unitPrice || 0).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-rose-600">
                            {p.itemDiscountAmount && p.itemDiscountAmount > 0 ? `-$${p.itemDiscountAmount.toFixed(2)}` : '$0.00'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">${p.isCustomerProvided ? '0.00' : ((p.unitPrice || 0) * (p.quantity || 0)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Discounts & Financial Summary */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Subtotal (Labor + Parts + Inspection)</span>
                  <span className="font-bold font-mono text-slate-900">${(selectedInvoice.subtotal || 0).toFixed(2)}</span>
                </div>

                {selectedInvoice.itemDiscountsTotal !== undefined && selectedInvoice.itemDiscountsTotal > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-200 text-indigo-700">
                    <span className="flex items-center gap-1 font-semibold">
                      <Percent className="w-3.5 h-3.5" /> Item / Service Discounts (Auto)
                    </span>
                    <span className="font-bold font-mono">-${(selectedInvoice.itemDiscountsTotal || 0).toFixed(2)}</span>
                  </div>
                )}

                {selectedInvoice.manualDiscountAmount !== undefined && selectedInvoice.manualDiscountAmount > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-200 text-indigo-700">
                    <span className="flex items-center gap-1 font-semibold">
                      <Tag className="w-3.5 h-3.5" /> Manual Discount ({selectedInvoice.manualDiscountReason})
                    </span>
                    <span className="font-bold font-mono">-${(selectedInvoice.manualDiscountAmount || 0).toFixed(2)}</span>
                  </div>
                )}

                {selectedInvoice.campaignDiscountTotal !== undefined && selectedInvoice.campaignDiscountTotal > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-200 text-emerald-700">
                    <span className="flex items-center gap-1 font-semibold">
                      <Gift className="w-3.5 h-3.5" /> Campaign: {selectedInvoice.campaignName}
                    </span>
                    <span className="font-bold font-mono">-${(selectedInvoice.campaignDiscountTotal || 0).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Sales Tax (8%)</span>
                  <span className="font-bold font-mono text-slate-900">${(selectedInvoice.tax || 0).toFixed(2)}</span>
                </div>

                <div className="flex justify-between py-2 border-t-2 border-slate-900 font-extrabold text-base text-slate-900">
                  <span>Total Cost</span>
                  <span className="font-mono">${(selectedInvoice.totalAmount || 0).toFixed(2)}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 text-xs border-t border-slate-200">
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="text-[10px] text-emerald-700 font-bold block">TOTAL PAID</span>
                    <span className="font-mono font-bold text-emerald-800 text-sm">${(selectedInvoice.totalPaid || 0).toFixed(2)}</span>
                  </div>
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl">
                    <span className="text-[10px] text-rose-700 font-bold block">BALANCE REMAINING</span>
                    <span className="font-mono font-bold text-rose-800 text-sm">${((selectedInvoice.balanceRemaining ?? selectedInvoice.totalAmount) || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment History Log */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-4 h-4 text-indigo-600" />
                    Payment History
                  </h5>
                  <button
                    id="open-record-payment-from-detail"
                    onClick={() => handleOpenRecordPayment(selectedInvoice)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition"
                  >
                    + Record Payment
                  </button>
                </div>

                {paymentRecords.filter((p) => p.invoiceId === selectedInvoice.id || p.repairJobId === selectedInvoice.repairJobId).length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">No payments recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {paymentRecords
                      .filter((p) => p.invoiceId === selectedInvoice.id || p.repairJobId === selectedInvoice.repairJobId)
                      .map((p) => (
                        <div key={p.id} className="p-3 bg-white border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>${(p.amount || 0).toFixed(2)}</span>
                              <span className="px-2 py-0.5 bg-slate-100 border text-[9px] font-bold uppercase rounded-md">
                                {p.type}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Method: {p.method} • Date: {p.date} • By: {p.recordedBy}
                            </div>
                          </div>
                          <span className="font-mono text-[10px] text-slate-400">{p.id}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                <button
                  id="open-discounts-modal-btn"
                  onClick={() => handleOpenDiscountModal(selectedInvoice)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-2"
                >
                  <Tag className="w-4 h-4 text-indigo-600" />
                  <span>Apply / Edit Discounts</span>
                </button>

                <div className="flex gap-2">
                  <button
                    id="print-invoice-btn"
                    onClick={handlePrintPDF}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print / Export PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isRecordPaymentOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 rounded-3xl shadow-xl max-w-md w-full overflow-hidden text-slate-900">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                Record Payment for {selectedInvoice.id}
              </h3>
              <button id="close-record-payment-modal" onClick={() => setIsRecordPaymentOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Total Cost:</span>
                  <span className="font-bold text-slate-900">${(selectedInvoice.totalAmount || 0).toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-sans">Balance Remaining:</span>
                  <span className="font-bold text-rose-700">${((selectedInvoice.balanceRemaining ?? selectedInvoice.totalAmount) || 0).toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Payment Type</label>
                <select value={paymentType} onChange={(e) => setPaymentType(e.target.value as any)} className="w-full p-2.5 bg-slate-50 border rounded-xl">
                  <option value="deposit">Deposit</option>
                  <option value="partial">Partial Payment</option>
                  <option value="final">Final Settlement</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Amount ($)</label>
                <input type="number" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(Number(e.target.value))} required className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono text-sm font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Payment Method</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl">
                    {activePaymentMethods.map((m) => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Date</label>
                  <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required className="w-full p-2.5 bg-slate-50 border rounded-xl" />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Payment Notes (Optional)</label>
                <input type="text" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="e.g., Deposit received via ABA Mobile App..." className="w-full p-2.5 bg-slate-50 border rounded-xl" />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button type="button" onClick={() => setIsRecordPaymentOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs">Submit Payment</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Apply Discounts Modal */}
      {isDiscountModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 rounded-3xl shadow-xl max-w-md w-full overflow-hidden text-slate-900">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-400" />
                Discounts for {selectedInvoice.id}
              </h3>
              <button id="close-discounts-modal" onClick={() => setIsDiscountModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDiscounts} className="p-6 space-y-4 text-xs">
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 border-b pb-1">1. Manual Discount</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold mb-1">Type</label>
                    <select value={discManualType} onChange={(e) => setDiscManualType(e.target.value as any)} className="w-full p-2.5 bg-slate-50 border rounded-xl">
                      <option value="fixed">Fixed Amount ($)</option>
                      <option value="percentage">Percentage (%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Value</label>
                    <input type="number" step="0.1" value={discManualVal} onChange={(e) => setDiscManualVal(Number(e.target.value))} className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono font-bold" />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Discount Reason (Required for Manual)</label>
                  <select value={discManualReason} onChange={(e) => setDiscManualReason(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl">
                    {activeDiscountReasons.map((r) => (
                      <option key={r.id} value={r.reason}>{r.reason}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-slate-900 border-b pb-1">2. Whole Order Campaign</h4>
                <div>
                  <label className="block font-semibold mb-1">Active Campaign</label>
                  <select value={discCampaignId} onChange={(e) => setDiscCampaignId(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl">
                    <option value="">-- No Campaign Selected --</option>
                    {activeCampaigns.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.discountType === 'percentage' ? `${c.discountValue}%` : `$${c.discountValue}`})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button type="button" onClick={() => setIsDiscountModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl shadow-xs">Recalculate Invoice</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Generate Invoice Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 rounded-3xl shadow-xl max-w-md w-full overflow-hidden text-slate-900">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Generate Repair Invoice
              </h3>
              <button id="close-gen-inv-modal" onClick={() => setIsGenerateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateInvoice} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase text-slate-500 mb-1">Select Active Repair Order</label>
                <select id="select-job-for-invoice" value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl font-medium">
                  {repairJobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.jobNumber} — {j.customerName} ({j.vehicleMake} {j.vehicleModel}) [Est: ${j.estimatedCost}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Initial Discount Type</label>
                  <select value={genManualType} onChange={(e) => setGenManualType(e.target.value as any)} className="w-full p-2.5 bg-slate-50 border rounded-xl font-medium">
                    <option value="fixed">Fixed ($)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Discount Value</label>
                  <input type="number" value={genManualVal} onChange={(e) => setGenManualVal(Number(e.target.value))} className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono" />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Discount Reason</label>
                <select value={genManualReason} onChange={(e) => setGenManualReason(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl">
                  <option value="">-- None --</option>
                  {activeDiscountReasons.map((r) => (
                    <option key={r.id} value={r.reason}>{r.reason}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setIsGenerateModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-slate-900 text-white font-semibold rounded-xl">Generate Invoice</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
