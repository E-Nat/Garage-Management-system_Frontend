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
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      clearLoginError();
                      setEmail(e.target.value);
                    }}
                    placeholder="name@apexgarage.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 rounded-xl text-slate-900 text-sm placeholder-slate-400 outline-hidden transition"
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
                    className="text-xs font-medium text-slate-700 hover:text-slate-900 hover:underline transition"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      clearLoginError();
                      setPassword(e.target.value);
                    }}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 rounded-xl text-slate-900 text-sm placeholder-slate-400 outline-hidden transition"
                  />
                  <button
                    id="toggle-password-visibility-btn"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    id="remember-me-checkbox"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span>Remember me</span>
                </label>

                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>256-bit Encrypted</span>
                </div>
              </div>

              <button
                id="submit-login-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Garage Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 text-xs text-slate-400 text-center">
            <span>Secure Role-Based Garage Management System</span>
          </div>
        </motion.div>

        {/* Right Side: Demo Persona Quick Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm uppercase tracking-wider">
                <UserCheck className="w-4 h-4 text-slate-700" />
                Demo Credentials & Testing
              </div>
              <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 font-medium">
                5 Roles Configured
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Click any role below to sign in instantly or copy credentials to test authentication rules.
            </p>

            {/* List of Demo Accounts */}
            <div className="space-y-2.5">
              {demoRoles.map((demo) => (
                <div
                  key={demo.role}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between hover:border-slate-300 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${demo.badgeColor}`}>
                      {demo.role.replace('_', ' ')}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {demo.title}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {demo.email} • <span className="text-slate-400">{demo.pass}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id={`fill-demo-${demo.role}`}
                      type="button"
                      onClick={() => handleSelectDemoUser(demo.email, demo.pass)}
                      className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition"
                      title="Fill into form"
                    >
                      Fill
                    </button>
                    <button
                      id={`login-demo-${demo.role}`}
                      type="button"
                      onClick={() => handleQuickLogin(demo.email, demo.pass)}
                      className="px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-xs flex items-center gap-1"
                    >
                      <span>Sign In</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Test Edge Cases Section */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-700" />
                Test Security Scenarios
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="test-invalid-credentials-btn"
                  type="button"
                  onClick={() => handleQuickLogin('owner@apexgarage.com', 'wrongpassword123')}
                  className="p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs text-rose-800 text-left transition"
                >
                  <div className="font-bold text-rose-900">Test Wrong Pass</div>
                  <div className="text-[10px] text-rose-600">Triggers error message</div>
                </button>

                <button
                  id="test-suspended-account-btn"
                  type="button"
                  onClick={() => handleQuickLogin('chloe.suspended@apexgarage.com', 'password123')}
                  className="p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs text-amber-800 text-left transition"
                >
                  <div className="font-bold text-amber-900">Test Suspended/Deactivated</div>
                  <div className="text-[10px] text-amber-700">Triggers account lockout</div>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Staff administration?</span>
            <span className="text-slate-900 font-bold">Manage inside Owner Dashboard</span>
          </div>
        </motion.div>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />
    </div>
  );
};
