import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, ShieldCheck, ArrowUpRight, UserPlus } from 'lucide-react';
import { OperationalDashboardWidgets } from './OperationalDashboardWidgets';

export const AdminDashboard: React.FC = () => {
  const { currentUser, users, auditLogs, setActiveTab } = useAuth();

  return (
    <div className="space-y-6 text-slate-900">
      {/* Welcome Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 text-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Welcome back, {currentUser?.name}!
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="admin-rbac-rules-btn"
            onClick={() => setActiveTab('settings')}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition"
          >
            <span>RBAC Rules</span>
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Embedded Operational Pipeline & Core Metrics */}
      <OperationalDashboardWidgets />

      {/* Lower Row: Staff Directory Summary & Security Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Staff Roster */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm uppercase tracking-wider">
                <Users className="w-4 h-4 text-slate-700" />
                Garage Staff Accounts
              </div>
              <button
                id="view-all-users-link"
                onClick={() => setActiveTab('users')}
                className="text-xs font-bold text-slate-900 hover:underline"
              >
                View Directory ({users.length})
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Registered users and assigned operational roles across departments.
            </p>

            <div className="space-y-2.5">
              {users.slice(0, 4).map((usr) => (
                <div
                  key={usr.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                      {usr.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{usr.name}</div>
                      <div className="text-[11px] text-slate-500">{usr.email}</div>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                    {usr.role.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Role RBAC Enforcement: Active</span>
            <button
              id="configure-rbac-link"
              onClick={() => setActiveTab('settings')}
              className="text-slate-900 font-bold hover:underline"
            >
              Configure Permissions →
            </button>
          </div>
        </div>

        {/* Security Audit Log Preview */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Recent Security Audit Logs
              </div>
              <button
                id="view-all-audit-logs-link"
                onClick={() => setActiveTab('audit')}
                className="text-xs font-bold text-slate-900 hover:underline"
              >
                View Audit Log ({auditLogs.length})
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Track authentication events, role changes, and administrative actions.
            </p>

            <div className="space-y-2.5">
              {auditLogs.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{log.action}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      <span className="font-semibold text-slate-700">{log.userName}</span> • {log.details}
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Security level: Production Grade</span>
            <span className="font-mono text-[10px] text-slate-400">IP Monitoring Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
};
