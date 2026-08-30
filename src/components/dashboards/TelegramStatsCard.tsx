import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTelegramStats, TelegramCustomerStats } from '../../services/api';
import {
  Send,
  Users,
  CheckCircle2,
  XCircle,
  TrendingUp,
  RotateCw,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const TelegramStatsCard: React.FC = () => {
  const { setActiveTab } = useAuth();

  const [stats, setStats] = useState<TelegramCustomerStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchStats = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const response = await getTelegramStats();
      if (response && response.success && response.data) {
        setStats(response.data);
      } else {
        setErrorMessage('Unable to load Telegram statistics.');
      }
    } catch (err) {
      // Safe user-facing error message without exposing internals
      setErrorMessage('Unable to load Telegram statistics.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div
        id="widget-telegram-stats-loading"
        className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4 animate-pulse"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <div className="h-3 w-28 bg-slate-200 rounded"></div>
              <div className="h-2.5 w-44 bg-slate-100 rounded mt-1.5"></div>
            </div>
          </div>
          <div className="h-6 w-16 bg-slate-100 rounded-full"></div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100/80">
              <div className="h-2.5 w-20 bg-slate-200 rounded"></div>
              <div className="h-6 w-12 bg-slate-200 rounded mt-2 font-mono">———</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error State with Retry
  if (errorMessage || !stats) {
    return (
      <div
        id="widget-telegram-stats-error"
        className="bg-rose-50/40 p-5 rounded-xl border border-rose-200/70 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="text-rose-500 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Telegram Connection Statistics
            </h4>
            <p className="text-xs text-rose-600 mt-0.5">
              {errorMessage || 'Unable to load Telegram statistics.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchStats(true)}
          className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer w-fit"
        >
          <RotateCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const totalCustomers = stats.total_customers ?? 0;
  const telegramConnected = stats.telegram_connected ?? 0;
  const telegramNotConnected = stats.telegram_not_connected ?? 0;
  const connectionRate = typeof stats.connection_rate === 'number' ? stats.connection_rate : 0.0;

  return (
    <div
      id="widget-telegram-customer-stats"
      className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                CUSTOMERS
              </h3>
              <span className="text-[10px] font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/60 flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5" />
                Telegram Integration
              </span>
            </div>
            <h2 className="text-sm font-semibold text-slate-900 mt-0.5">
              Telegram Customer Connections
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => fetchStats(true)}
            disabled={isRefreshing}
            title="Refresh Telegram statistics"
            className={`p-1.5 text-xs text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200/60 flex items-center gap-1 ${
              isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline text-[11px] font-medium">Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            className="text-xs text-slate-500 hover:text-[#FF6B00] font-medium flex items-center gap-1 transition-colors cursor-pointer ml-1"
          >
            <span>Customers</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main 4-Column Statistics Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Total Customers */}
        <div
          id="stat-telegram-total-customers"
          className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium text-slate-600 block">Total Customers</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            {totalCustomers.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Registered in garage</div>
        </div>

        {/* 2. Telegram Connected */}
        <div
          id="stat-telegram-connected"
          className="p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-100/70 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium text-emerald-800 block">Telegram Connected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2 font-mono">
            {telegramConnected.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-1">Live bot subscribers</div>
        </div>

        {/* 3. Telegram Not Connected */}
        <div
          id="stat-telegram-not-connected"
          className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium text-slate-600 block">Telegram Not Connected</span>
            <XCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-700 mt-2 font-mono">
            {telegramNotConnected.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Pending connection</div>
        </div>

        {/* 4. Connection Rate */}
        <div
          id="stat-telegram-connection-rate"
          className="p-3.5 bg-sky-50/40 rounded-xl border border-sky-100/70 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium text-sky-900 block">Connection Rate</span>
            <TrendingUp className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-sky-700 mt-2 font-mono">
            {connectionRate.toFixed(1)}%
          </div>
          <div className="text-[11px] text-sky-600/80 mt-1">
            {telegramConnected} of {totalCustomers} connected
          </div>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            Connected Rate
          </span>
          <span className="font-mono text-slate-700 font-semibold">{connectionRate.toFixed(1)}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, connectionRate))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
