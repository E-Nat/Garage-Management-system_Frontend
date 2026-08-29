import React, { useState, useEffect, useId } from 'react';
import {
  Eye,
  EyeOff,
  AlertCircle,
  Mail,
  Lock,
  ShieldCheck,
  ClipboardList,
  Users,
  Package,
  Receipt,
  Wrench,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useGarage } from '../../context/GarageContext';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import logoImg from '../../assets/images/logo.png';
import workshopHeroImg from '../../assets/images/workshop-hero.jpg';

export const LoginForm: React.FC = () => {
  const { login, loginError, clearLoginError } = useAuth();
  const { systemSettings } = useGarage();
  const prefersReducedMotion = useReducedMotion();

  // Form State
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('apex_garage_remember_email') || '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return Boolean(localStorage.getItem('apex_garage_remember_email'));
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [activeField, setActiveField] = useState<'email' | 'password' | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  // Accessibility IDs
  const emailInputId = useId();
  const passwordInputId = useId();
  const rememberMeId = useId();
  const emailErrorId = useId();
  const passwordErrorId = useId();

  // Ensure login screen is ALWAYS pure clean white light mode
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  // Single Authentic Apex Garage Logo from project assets
  const logoUrl =
    systemSettings?.garageInfo?.logoUrl && !systemSettings.garageInfo.logoUrl.includes('unsplash.com')
      ? systemSettings.garageInfo.logoUrl
      : logoImg;

  // Form Validation
  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Please enter your password.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearLoginError();

    if (!validate()) return;

    // Handle Remember Me persistence
    if (rememberMe) {
      localStorage.setItem('apex_garage_remember_email', email.trim());
    } else {
      localStorage.removeItem('apex_garage_remember_email');
    }

    setIsLoading(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        setIsLoading(false);
      }
    } catch (_) {
      setIsLoading(false);
    }
  };

  // High-End Animation Variants & Curves (Dual Split-Slide Entrance)
  const smoothEase = [0.16, 1, 0.3, 1] as const;

  // Left Panel Slides in from the Left
  const leftSectionVariants = {
    hidden: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -80 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8, ease: smoothEase },
    },
  };

  // Right Panel Slides in from the Right
  const rightSectionVariants = {
    hidden: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 80 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8, ease: smoothEase, delay: 0.06 },
    },
  };

  const leftHeroVariants = {
    hidden: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.05 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.9, ease: smoothEase },
    },
  };

  const logoAnimation = {
    hidden: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: smoothEase, delay: 0.15 },
    },
  };

  const headlineParent = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.25,
      },
    },
  };

  const headlineChild = {
    hidden: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: smoothEase },
    },
  };

  const featureContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.09,
        delayChildren: 0.4,
      },
    },
  };

  const featureItemVariant = {
    hidden: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: smoothEase },
    },
  };

  const loginRightContainer = {
    hidden: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: smoothEase, delay: 0.15 },
    },
  };

  const formStagger = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.18,
      },
    },
  };

  const formItem = {
    hidden: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: smoothEase },
    },
  };

  const capabilities = [
    {
      id: 'jobs',
      icon: ClipboardList,
      title: 'Job Management',
    },
    {
      id: 'customers',
      icon: Users,
      title: 'Customer Management',
    },
    {
      id: 'inventory',
      icon: Package,
      title: 'Inventory Control',
    },
    {
      id: 'invoicing',
      icon: Receipt,
      title: 'Invoicing & Payments',
    },
  ];

  return (
    <div className="min-h-screen w-full flex bg-[#FAF9F6] text-slate-900 selection:bg-[#FF6B00] selection:text-white transition-colors duration-300 overflow-x-hidden">
      {/* ============================================================ */}
      {/* LEFT SIDE: Clean Bright Automotive Brand Experience (55%)   */}
      {/* ============================================================ */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={leftSectionVariants}
        aria-label="Apex Garage Platform"
        className="hidden lg:flex relative w-[55%] min-h-screen flex-col justify-between p-10 xl:p-14 2xl:p-16 overflow-hidden bg-slate-50 border-r border-slate-200/80 select-none"
      >
        {/* Modern Bright Photographic Workshop Hero Background */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={leftHeroVariants}
          className="absolute inset-0 z-0 overflow-hidden"
        >
          <img
            src={workshopHeroImg}
            alt="Apex Garage Modern Service Workshop"
            className="w-full h-full object-cover object-center"
          />

          {/* Luminous White/Light Overlay for Bright, Airy, Premium Feel */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/96 via-white/85 to-white/45" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-white/20" />

          {/* Ambient Warm Light Pulse Aura */}
          <motion.div
            animate={
              prefersReducedMotion
                ? {}
                : {
                    opacity: [0.35, 0.65, 0.35],
                    scale: [1, 1.04, 1],
                  }
            }
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FF6B00]/10 blur-3xl rounded-full pointer-events-none"
          />
        </motion.div>

        {/* 1. Top-Left: ONLY ONE Apex Garage Brand Logo */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={logoAnimation}
          className="relative z-10"
        >
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-3">
              <motion.img
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                src={logoUrl}
                alt="Apex Garage"
                className="h-14 sm:h-16 xl:h-18 w-auto max-w-[260px] object-contain object-left drop-shadow-xs"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector(
                    '.branding-logo-fallback'
                  );
                  if (fallback) (fallback as HTMLElement).style.display = 'flex';
                }}
              />
              <div
                className="branding-logo-fallback hidden w-14 h-14 rounded-2xl bg-[#FF6B00] text-white items-center justify-center font-bold shadow-xs"
                aria-hidden="true"
              >
                <Wrench className="w-7 h-7 stroke-[2.5]" />
              </div>
            </div>

            {/* Small Professional System Label under Logo */}
            <div className="pl-1 mt-1">
              <span className="font-mono text-[10px] font-bold tracking-[0.22em] text-slate-500 uppercase">
                APEX GARAGE // MANAGEMENT SYSTEM
              </span>
            </div>
          </div>
        </motion.div>

        {/* 2. Center: Headline & Brand Statement */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={headlineParent}
          className="relative z-10 my-auto max-w-xl pr-4 py-8"
        >
          <motion.h1
            variants={headlineChild}
            className="text-3xl sm:text-4xl xl:text-5xl 2xl:text-[3.25rem] font-extrabold text-slate-900 tracking-tight leading-[1.14] drop-shadow-xs"
          >
            Manage your garage.
            <br />
            Drive your{' '}
            <span className="relative inline-block text-[#FF6B00]">
              business.
              {/* Subtle Animated Underline Accent */}
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.7, delay: 0.6, ease: smoothEase }}
                className="absolute left-0 bottom-0.5 h-[3px] bg-[#FF6B00]/40 rounded-full"
              />
            </span>
          </motion.h1>

          <motion.p
            variants={headlineChild}
            className="mt-5 text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-lg"
          >
            Everything you need to manage jobs, customers, inventory, invoices and payments — in one place.
          </motion.p>
        </motion.div>

        {/* 3. Bottom-Left: Automotive Capability Strip */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={featureContainer}
          className="relative z-10 pt-4"
        >
          <div className="grid grid-cols-2 gap-3 max-w-lg">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.id}
                  variants={featureItemVariant}
                  whileHover={prefersReducedMotion ? {} : { y: -3, scale: 1.01 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="group flex items-center gap-3 p-3 rounded-xl bg-white/85 border border-slate-200/90 backdrop-blur-xs shadow-2xs hover:shadow-md hover:border-orange-300 hover:bg-white transition-all duration-200 cursor-default"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200/60 text-[#FF6B00] flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 shadow-2xs">
                    <Icon className="w-4 h-4 stroke-[2]" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-[#FF6B00] transition-colors leading-tight truncate">
                    {item.title}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </motion.section>

      {/* ============================================================ */}
      {/* RIGHT SIDE: Pure Clean White Professional Login (45%)        */}
      {/* ============================================================ */}
      <motion.main
        initial="hidden"
        animate="visible"
        variants={rightSectionVariants}
        className="w-full lg:w-[45%] min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-white transition-colors duration-300"
      >
        {/* Mobile Header Logo (Visible on mobile screens where left side is hidden) */}
        <div className="lg:hidden flex items-center gap-2 mb-4">
          <img
            src={logoUrl}
            alt="Apex Garage"
            className="h-10 w-auto max-w-[160px] object-contain object-left"
          />
        </div>

        {/* Center Login Workspace (Natural white background, centered, max-w-[460px]) */}
        <div className="my-auto w-full flex items-center justify-center py-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={loginRightContainer}
            className="w-full max-w-[460px]"
          >
            {/* Header: Starts DIRECTLY with "Welcome back" (No duplicate wrench/logo above it) */}
            <div className="mb-8">
              <h2 className="text-3xl sm:text-[2rem] font-extrabold tracking-tight text-slate-900 leading-tight">
                Welcome back
              </h2>
              <p className="text-sm text-slate-500 mt-1.5 font-normal leading-relaxed">
                Sign in to continue to your workspace.
              </p>
            </div>

            {/* Authentication Error Banner (Animated with subtle shake) */}
            <AnimatePresence>
              {loginError && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    x: [0, -4, 4, -3, 3, 0],
                  }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  role="alert"
                  aria-live="assertive"
                  className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 shadow-2xs"
                >
                  <AlertCircle
                    className="w-4 h-4 text-rose-600 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span className="leading-relaxed font-medium">{loginError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form with Staggered Entrance */}
            <motion.form
              onSubmit={handleSubmit}
              noValidate
              initial="hidden"
              animate="visible"
              variants={formStagger}
              className="space-y-4"
            >
              {/* Field 1: WORK EMAIL */}
              <motion.div variants={formItem}>
                <label
                  htmlFor={emailInputId}
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono mb-1.5"
                >
                  WORK EMAIL
                </label>

                <div className="relative">
                  <Mail
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-all duration-200 pointer-events-none ${
                      activeField === 'email'
                        ? 'text-[#FF6B00] scale-110'
                        : 'text-slate-400'
                    }`}
                  />
                  <input
                    id={emailInputId}
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      clearLoginError();
                      setEmail(e.target.value);
                      if (fieldErrors.email) {
                        setFieldErrors((prev) => ({ ...prev, email: undefined }));
                      }
                    }}
                    onFocus={() => setActiveField('email')}
                    onBlur={() => setActiveField(null)}
                    placeholder="Enter your work email"
                    aria-required="true"
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? emailErrorId : undefined}
                    className={`w-full h-[54px] pl-10 pr-4 bg-white border rounded-xl text-slate-900 text-sm placeholder-slate-400 transition-all duration-200 outline-none ${
                      fieldErrors.email
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15 bg-rose-50/20 shadow-xs'
                        : 'border-[#D9DEE7] hover:border-slate-400 focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/15 focus:shadow-xs'
                    }`}
                  />
                </div>

                {/* Inline Email Error */}
                <AnimatePresence>
                  {fieldErrors.email && (
                    <motion.p
                      id={emailErrorId}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      role="alert"
                      aria-live="assertive"
                      className="mt-1.5 text-xs text-rose-600 flex items-center gap-1.5 font-medium"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" aria-hidden="true" />
                      <span>{fieldErrors.email}</span>
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Field 2: PASSWORD */}
              <motion.div variants={formItem}>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor={passwordInputId}
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono"
                  >
                    PASSWORD
                  </label>

                  {/* Forgot Password Link */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-xs font-semibold text-[#FF6B00] hover:text-[#E56000] focus:outline-none transition-colors cursor-pointer"
                    aria-label="Forgot password?"
                  >
                    Forgot password?
                  </motion.button>
                </div>

                <div className="relative">
                  <Lock
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-all duration-200 pointer-events-none ${
                      activeField === 'password'
                        ? 'text-[#FF6B00] scale-110'
                        : 'text-slate-400'
                    }`}
                  />
                  <input
                    id={passwordInputId}
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      clearLoginError();
                      setPassword(e.target.value);
                      if (fieldErrors.password) {
                        setFieldErrors((prev) => ({ ...prev, password: undefined }));
                      }
                    }}
                    onFocus={() => setActiveField('password')}
                    onBlur={() => setActiveField(null)}
                    placeholder="Enter your password"
                    aria-required="true"
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? passwordErrorId : undefined}
                    className={`w-full h-[54px] pl-10 pr-11 bg-white border rounded-xl text-slate-900 text-sm placeholder-slate-400 transition-all duration-200 outline-none ${
                      fieldErrors.password
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15 bg-rose-50/20 shadow-xs'
                        : 'border-[#D9DEE7] hover:border-slate-400 focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/15 focus:shadow-xs'
                    }`}
                  />

                  {/* Password Visibility Toggle with Smooth Crossfade */}
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg focus:outline-none transition-colors cursor-pointer"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {showPassword ? (
                        <motion.span
                          key="eye-off"
                          initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
                          animate={{ opacity: 1, rotate: 0, scale: 1 }}
                          exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                          className="block"
                        >
                          <EyeOff className="w-4 h-4" />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="eye-on"
                          initial={{ opacity: 0, rotate: 45, scale: 0.8 }}
                          animate={{ opacity: 1, rotate: 0, scale: 1 }}
                          exit={{ opacity: 0, rotate: -45, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                          className="block"
                        >
                          <Eye className="w-4 h-4" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>

                {/* Inline Password Error */}
                <AnimatePresence>
                  {fieldErrors.password && (
                    <motion.p
                      id={passwordErrorId}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      role="alert"
                      aria-live="assertive"
                      className="mt-1.5 text-xs text-rose-600 flex items-center gap-1.5 font-medium"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" aria-hidden="true" />
                      <span>{fieldErrors.password}</span>
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Remember Me Checkbox */}
              <motion.div variants={formItem} className="pt-0.5">
                <label
                  htmlFor={rememberMeId}
                  className="inline-flex items-center gap-2.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer select-none transition-colors group"
                >
                  <div className="relative flex items-center justify-center">
                    <input
                      id={rememberMeId}
                      name="rememberMe"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#FF6B00] focus:ring-[#FF6B00] transition cursor-pointer accent-[#FF6B00]"
                    />
                  </div>
                  <span className="font-medium group-hover:text-slate-900 transition-colors">
                    Remember me
                  </span>
                </label>
              </motion.div>

              {/* Primary SIGN IN Button (Clean, centered, full-width, NO arrow icon) */}
              <motion.div variants={formItem} className="pt-2">
                <motion.button
                  id="sign-in-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  whileHover={
                    prefersReducedMotion || isLoading
                      ? {}
                      : { y: -1, scale: 1.006 }
                  }
                  whileTap={
                    prefersReducedMotion || isLoading
                      ? {}
                      : { scale: 0.985, y: 0 }
                  }
                  aria-label={isLoading ? 'Signing in...' : 'SIGN IN'}
                  className="relative w-full h-[54px] px-6 bg-[#FF6B00] hover:bg-[#E56000] text-white font-bold text-sm tracking-wider uppercase rounded-xl shadow-xs hover:shadow-lg hover:shadow-orange-500/25 flex items-center justify-center transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 overflow-hidden"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2.5">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        aria-hidden="true"
                      />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <span>SIGN IN</span>
                  )}
                </motion.button>
              </motion.div>

              {/* Security Indicator */}
              <motion.div
                variants={formItem}
                className="pt-5 border-t border-slate-100 flex flex-col items-center text-center select-none"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Your data is secure with us</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 font-normal">
                  Enterprise-grade security • 256-bit encryption
                </p>
              </motion.div>
            </motion.form>
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 pt-4">
          © 2025 Apex Garage Management System. All rights reserved.
        </footer>
      </motion.main>

      {/* Forgot Password Recovery Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />
    </div>
  );
};
export default LoginForm;
