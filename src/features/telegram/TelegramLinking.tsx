import React, { useState } from 'react';
import { useGarage } from '../../context/GarageContext';
import {
  Send,
  Search,
  CheckCircle2,
  XCircle,
  Link2,
  Bell,
  QrCode,
  ExternalLink,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';

export const TelegramLinking: React.FC = () => {
  const { customers, updateCustomer } = useGarage();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingHandle, setEditingHandle] = useState<{ id: string; handle: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const BOT_USERNAME = 'apex_garage_management_bot';
  const BOT_URL = `https://t.me/${BOT_USERNAME}`;
  // Standard high-contrast QR code image via qrserver
  const QR_CODE_URL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(BOT_URL)}&margin=10`;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveHandle = (customerId: string, newHandle: string) => {
    updateCustomer(customerId, { telegramHandle: newHandle });
    showToast(`Telegram handle updated to ${newHandle || 'Unlinked'}!`);
    setEditingHandle(null);
  };

  const handleSendTestNotification = (customerName: string, handle: string) => {
    showToast(`Test Telegram Bot alert sent to ${handle || customerName}!`);
  };

  const filtered = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.telegramHandle && c.telegramHandle.toLowerCase().includes(searchTerm.toLowerCase()))
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

      {/* Header Banner & Onboarding QR Code Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 text-slate-900 shadow-xs flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold mb-2">
              <Send className="w-3.5 h-3.5 text-sky-600" />
              Telegram Automated Bot Messaging & Account Pairing
            </div>
            <h1 className="text-2xl font-bold">Telegram Customer Onboarding</h1>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Pair customer accounts with Telegram handles (@username) to dispatch real-time repair status updates, diagnostic findings, payment receipts, and PDF e-Invoices.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-100 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <span className="w-5 h-5 rounded-full bg-[#FF6B00] text-white flex items-center justify-center text-[10px]">1</span>
                Scan QR Code
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Customer scans bot QR code or opens @{BOT_USERNAME}.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <span className="w-5 h-5 rounded-full bg-[#FF6B00] text-white flex items-center justify-center text-[10px]">2</span>
                Tap START
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Telegram opens and welcomes the customer automatically.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
                Share Phone
              </div>
              <p className="text-[11px] text-slate-500 mt-1">1-tap contact sharing connects customer profile instantly.</p>
            </div>
          </div>
        </div>

        {/* Telegram Onboarding QR Display */}
        <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-6 rounded-3xl text-white shadow-md flex flex-col items-center text-center justify-between">
          <div className="w-full flex items-center justify-between mb-3 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 rounded-full">
              <QrCode className="w-3.5 h-3.5" />
              Bot Quick Connect
            </span>
            <span className="text-white/80 font-mono text-[10px]">@{BOT_USERNAME}</span>
          </div>

          <div className="bg-white p-3 rounded-2xl shadow-inner my-2">
            <img
              src={QR_CODE_URL}
              alt="Apex Garage Telegram Bot QR Code"
              className="w-36 h-36 rounded-lg object-contain"
              loading="lazy"
            />
          </div>

          <div className="mt-3 w-full">
            <a
              href={BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-white text-sky-700 hover:bg-sky-50 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>Open in Telegram</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Table & Search */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="search-telegram-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customer name, phone, or @handle..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-hidden"
            />
          </div>

          <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
            <span>Linked Telegram Bots:</span>
            <span className="px-2.5 py-1 bg-sky-50 text-sky-800 border border-sky-200 font-bold rounded-lg">
              {customers.filter((c) => c.telegramLinked).length} / {customers.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Customer Name</th>
                <th className="py-3 px-3">Phone</th>
                <th className="py-3 px-3">Telegram Username</th>
                <th className="py-3 px-3 text-center">Connection Status</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-3 font-bold text-slate-900">
                    {cust.fullName}
                  </td>

                  <td className="py-3.5 px-3 font-medium text-slate-700">
                    {cust.phone}
                  </td>

                  <td className="py-3.5 px-3">
                    {editingHandle?.id === cust.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingHandle.handle}
                          onChange={(e) => setEditingHandle({ ...editingHandle, handle: e.target.value })}
                          placeholder="@username"
                          className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-hidden font-mono"
                        />
                        <button
                          onClick={() => handleSaveHandle(cust.id, editingHandle.handle)}
                          className="px-2.5 py-1 bg-[#FF6B00] hover:bg-[#E56000] text-white font-bold rounded-lg text-[10px] cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <span className="font-mono text-slate-800 font-semibold">
                        {cust.telegramHandle || '—'}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    {cust.telegramLinked ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                        Connected & Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                        Unlinked
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        id={`edit-telegram-${cust.id}`}
                        onClick={() => setEditingHandle({ id: cust.id, handle: cust.telegramHandle || '' })}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold rounded-lg transition flex items-center gap-1"
                      >
                        <Link2 className="w-3.5 h-3.5 text-slate-600" />
                        <span>{cust.telegramHandle ? 'Edit Link' : 'Pair Handle'}</span>
                      </button>

                      <button
                        id={`test-bot-alert-${cust.id}`}
                        onClick={() => handleSendTestNotification(cust.fullName, cust.telegramHandle || '')}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-semibold rounded-lg transition shadow-xs flex items-center gap-1"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>Send Test Alert</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
