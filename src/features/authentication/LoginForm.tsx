import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Wrench, Lock, Mail, Eye, EyeOff, AlertTriangle, ShieldCheck, ArrowRight, UserCheck, KeyRound } from 'lucide-react';
import { motion } from 'motion/react';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { UserRole } from '../../types';

export const LoginForm: React.FC = () => {
  const { login, loginError, clearLoginError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      login(email, password);
      setIsLoading(false);
    }, 300);
  };

  const handleSelectDemoUser = (demoEmail: string, demoPass: string) => {
    clearLoginError();
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    clearLoginError();
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsLoading(true);
    setTimeout(() => {
      login(demoEmail, demoPass);
      setIsLoading(false);
    }, 250);
  };

  const demoRoles: { role: UserRole; title: string; email: string; pass: string; badgeColor: string }[] = [
    { role: 'admin', title: 'Garage Owner / Admin', email: 'owner@apexgarage.com', pass: 'admin123', badgeColor: 'bg-slate-100 text-slate-800 border-slate-200' },
    { role: 'advisor', title: 'Service Advisor', email: 'advisor@apexgarage.com', pass: 'advisor123', badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    { role: 'mechanic', title: 'Chief Mechanic', email: 'mechanic@apexgarage.com', pass: 'mechanic123', badgeColor: 'bg-amber-50 text-amber-800 border-amber-200' },
    { role: 'parts_manager', title: 'Parts Manager', email: 'parts@apexgarage.com', pass: 'parts123', badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
    { role: 'customer', title: 'Customer Portal', email: 'customer@apexgarage.com', pass: 'customer123', badgeColor: 'bg-purple-50 text-purple-800 border-purple-200' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 p-4 relative">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
        {/* Left Side: Login Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between"
        >
          <div>
            {/* Header / Logo */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-extrabold shadow-xs">
                <Wrench className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">APEX GARAGE</h1>
                <span className="text-xs font-medium text-slate-500">Service & Operations Platform</span>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome to Garage Management System</h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Sign in to manage repair orders, vehicles, inventory, and customer communications.
              </p>
            </div>

            {/* Error Banner if Invalid Credentials */}
            {loginError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3"
                id="login-error-banner"
              >
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-rose-900 mb-0.5">Authentication Failed</div>
                  <div className="text-xs text-rose-700 leading-relaxed">{loginError}</div>
                </div>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (loginError) clearLoginError();
                    }}
                    placeholder="e.g. owner@apexgarage.com"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:border-slate-900 transition font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    id="forgot-password-link"
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-xs text-slate-600 hover:text-slate-900 font-medium transition flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3 text-slate-400" />
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (loginError) clearLoginError();
                    }}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:border-slate-900 transition font-medium"
                  />
                  <button
                    id="toggle-password-visibility"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                  <input
                    id="remember-me-checkbox"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <button
                id="login-submit-button"
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl shadow-xs transition duration-200 flex items-center justify-center gap-2 text-sm mt-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  <>
                    <span>Sign In to System</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Role-Based Access Control Active
            </span>
          </div>
        </motion.div>

        {/* Right Side: Demo Quick-Access Accounts Panel */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-slate-900" />
                <h3 className="text-base font-bold text-slate-900">Demo Accounts & Quick Access</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                1-Click Login Enabled
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Select any pre-configured role below to test specific permissions, workflows, and dashboard capabilities.
            </p>

            <div className="space-y-2.5">
              {demoRoles.map((user) => (
                <div
                  key={user.email}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between hover:border-slate-300 transition group"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{user.title}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${user.badgeColor}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">{user.email}</div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      id={`fill-demo-${user.role}`}
                      type="button"
                      onClick={() => handleSelectDemoUser(user.email, user.pass)}
                      className="px-2.5 py-1.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 rounded-xl text-[11px] font-semibold transition"
                    >
                      Fill
                    </button>
                    <button
                      id={`quick-login-${user.role}`}
                      type="button"
                      onClick={() => handleQuickLogin(user.email, user.pass)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold transition shadow-xs flex items-center gap-1"
                    >
                      <span>Login</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-3.5 bg-amber-50/60 border border-amber-200 rounded-2xl text-[11px] text-amber-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Tip:</strong> Logging in as <span className="font-bold">Owner/Admin</span> unlocks full control over System Settings, User Roles, Telegram Bot settings, and Audit Logs.
            </p>
          </div>
        </motion.div>
      </div>

      <ForgotPasswordModal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} />
    </div>
  );
};
