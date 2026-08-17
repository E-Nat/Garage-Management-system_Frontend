import React, { useState } from 'react';
import { useGarage } from '../../context/GarageContext';
import {
  Send,
  Search,
  CheckCircle2,
  XCircle,
  Link2,
  Link2Off,
  Bell,
  Users,
} from 'lucide-react';

export const TelegramLinking: React.FC = () => {
  const { customers, updateCustomer } = useGarage();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingHandle, setEditingHandle] = useState<{ id: string; handle: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 text-slate-900 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold mb-2">
            <Send className="w-3.5 h-3.5 text-sky-600" />
            Telegram Automated Bot Messaging & Account Pairing
          </div>
          <h1 className="text-2xl font-bold">Telegram Account Linking</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pair customer accounts with Telegram handles (@username) to dispatch real-time repair status updates, diagnostic findings, and invoices.
          </p>
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
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-slate-900 outline-hidden"
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
                          className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:border-slate-900 outline-hidden font-mono"
                        />
                        <button
                          onClick={() => handleSaveHandle(cust.id, editingHandle.handle)}
                          className="px-2.5 py-1 bg-slate-900 text-white font-bold rounded-lg text-[10px]"
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
