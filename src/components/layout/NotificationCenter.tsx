import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useGarage } from '../../context/GarageContext';
import { AppNotification } from '../../types';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  Phone,
  Send,
  User,
  Wrench,
  FileText,
  CreditCard,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Just now';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 45) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const {
    appNotifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    navigateToCustomer,
  } = useGarage();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        !target.closest('#notifications-bell-btn')
      ) {
        onClose();
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  const filteredNotifications = useMemo(() => {
    const list = activeFilter === 'unread'
      ? appNotifications.filter((n) => !n.isRead)
      : appNotifications;

    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [appNotifications, activeFilter]);

  const handleNotificationClick = async (notification: AppNotification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
    }

    // Close panel
    onClose();

    // Navigate to customer details page if customer-related
    const targetId = notification.customerId || notification.data?.customerId || notification.data?.customer_id;
    if (targetId) {
      navigateToCustomer(targetId);
    }
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (unreadNotificationsCount === 0 || isMarkingAll) return;

    setIsMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
    } finally {
      setIsMarkingAll(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-[340px] sm:w-[400px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-900"
      style={{ maxHeight: 'calc(100vh - 80px)' }}
    >
      {/* Header */}
      <div className="px-4 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FF6B00]/20 border border-[#FF6B00]/40 flex items-center justify-center text-[#FF6B00]">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Notifications</h3>
              {unreadNotificationsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#FF6B00] text-white text-[10px] font-bold">
                  {unreadNotificationsCount} unread
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">Customer & garage activity</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadNotificationsCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
              className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1 font-semibold transition-colors px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer disabled:opacity-50"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mark all read</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
            aria-label="Close notification center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
        <div className="inline-flex rounded-lg bg-slate-200/70 p-0.5">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({appNotifications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('unread')}
            className={`px-3 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
              activeFilter === 'unread'
                ? 'bg-white text-[#FF6B00] shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Unread ({unreadNotificationsCount})
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-medium">
          {filteredNotifications.length} update{filteredNotifications.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Notifications List Container */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
        {filteredNotifications.length === 0 ? (
          <div className="py-12 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
              <Sparkles className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                {activeFilter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
              <p className="text-[11px] text-slate-500 max-w-[260px] mx-auto mt-1 leading-normal">
                {activeFilter === 'unread'
                  ? "You're all caught up! Switch to 'All' to review previous updates."
                  : 'Customer Telegram connections and system updates will appear here in real-time.'}
              </p>
            </div>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isTelegramType = notif.type === 'telegram_connected';
            const isJobType = notif.type === 'repair_status' || notif.type === 'job';
            const isInvoiceType = notif.type === 'invoice_created' || notif.type === 'payment';

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 hover:bg-slate-50 transition cursor-pointer flex items-start gap-3 relative group ${
                  !notif.isRead ? 'bg-orange-50/40' : ''
                }`}
              >
                {/* Type Icon Badge */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                    isTelegramType
                      ? 'bg-sky-50 border-sky-200 text-sky-600'
                      : isJobType
                      ? 'bg-amber-50 border-amber-200 text-amber-600'
                      : isInvoiceType
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                      : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                >
                  {isTelegramType ? (
                    <Send className="w-4 h-4" />
                  ) : isJobType ? (
                    <Wrench className="w-4 h-4" />
                  ) : isInvoiceType ? (
                    <CreditCard className="w-4 h-4" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {notif.title}
                      </span>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#FF6B00] shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-300" />
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-snug break-words">
                    {notif.message}
                  </p>

                  {/* Customer Badges (Phone & Telegram Username) */}
                  {(notif.customerPhone || notif.telegramUsername) && (
                    <div className="pt-1 flex flex-wrap items-center gap-1.5">
                      {notif.customerPhone && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] border border-slate-200/60 font-medium">
                          <Phone className="w-2.5 h-2.5 text-slate-400" />
                          {notif.customerPhone}
                        </span>
                      )}
                      {notif.telegramUsername && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 font-mono text-[10px] border border-sky-200/80 font-medium">
                          <Send className="w-2.5 h-2.5 text-sky-500" />
                          {notif.telegramUsername}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Link Hint */}
                  {(notif.customerId || notif.data?.customerId || notif.data?.customer_id) && (
                    <div className="pt-0.5 text-[11px] text-[#FF6B00] group-hover:text-[#E56000] font-semibold flex items-center gap-1 transition-colors">
                      <span>View Customer Details</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Real-time Telegram notifications</span>
        </span>
        <span className="text-[10px] text-slate-400">Apex Garage</span>
      </div>
    </div>
  );
};
