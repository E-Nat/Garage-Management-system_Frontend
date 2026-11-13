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
  const [resetTokenFromUrl, setResetTokenFromUrl] = useState('');
  const [identifierFromUrl, setIdentifierFromUrl] = useState('');
  const [activeField, setActiveField] = useState<'email' | 'password' | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  // Accessibility IDs
  const emailInputId = useId();
  const passwordInputId = useId();
  const rememberMeId = useId();
  const emailErrorId = useId();
  const passwordErrorId = useId();

  // Ensure login screen is ALWAYS pure clean white light mode & detect reset tokens in URL
  useEffect(() => {
    document.documentElement.classList.remove('dark');

    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const fullUrl = hash.includes('?') ? hash : search;

    if (fullUrl.includes('token=')) {
      const queryPart = fullUrl.includes('?') ? fullUrl.split('?')[1] : fullUrl;
      const params = new URLSearchParams(queryPart);
      const token = params.get('token');
      const ident = params.get('identifier') || params.get('phone') || params.get('email') || '';

      if (token) {
        setResetTokenFromUrl(token);
        setIdentifierFromUrl(ident);
        setIsForgotModalOpen(true);
      }
    }
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
    <div
      className="relative isolate min-h-screen w-full flex flex-col items-center justify-center gap-4 bg-[#F3F5F8] p-4 sm:p-6 lg:h-screen lg:min-h-0 lg:gap-3 lg:overflow-hidden lg:p-8 text-slate-900 selection:bg-[#FF6B00] selection:text-white overflow-x-hidden"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 12% 18%, rgba(255,255,255,0.98), transparent 42%), radial-gradient(ellipse at 88% 82%, rgba(255,107,0,0.08), transparent 34%), linear-gradient(135deg, #F8FAFD 0%, #EDF2F8 100%)',
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-40 h-[480px] w-[480px] rounded-full border border-white/80" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-32 h-[440px] w-[440px] rounded-full border border-slate-300/35" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-[360px] -left-40 h-[600px] w-[600px] rounded-full border border-white/80 shadow-[0_0_0_22px_rgba(255,255,255,0.18),0_0_0_44px_rgba(255,255,255,0.12)]" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-8 top-8 h-24 w-24 opacity-35"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(100,116,139,0.55) 1px, transparent 1.5px)',
          backgroundSize: '12px 12px',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-8 left-8 h-20 w-20 opacity-25"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(100,116,139,0.55) 1px, transparent 1.5px)',
          backgroundSize: '12px 12px',
        }}
      />
      <div className="relative z-10 w-full max-w-[1100px] flex flex-col lg:h-[min(672px,calc(100vh-96px))] lg:flex-row overflow-hidden rounded-[24px] border-2 border-[#AEBBCC] bg-white shadow-[0_24px_80px_-28px_rgba(15,23,42,0.28)] ring-2 ring-slate-900/5">
      {/* ============================================================ */}
      {/* LEFT SIDE: Compact workshop brand panel                     */}
      {/* ============================================================ */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={leftSectionVariants}
        aria-label="Apex Garage Platform"
        className="hidden lg:flex relative w-[42%] min-h-[620px] flex-col justify-between p-8 xl:p-10 overflow-hidden bg-[#101C35] select-none lg:min-h-0"
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

          <div className="absolute inset-0 bg-gradient-to-b from-[#101C35]/15 via-[#101C35]/55 to-[#101C35]/95" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#101C35]/35 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_48%_36%_at_18%_8%,rgba(255,255,255,0.82)_0%,rgba(255,255,255,0.22)_55%,transparent_100%)]" />

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
            className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#FF6B00]/15 blur-3xl rounded-full pointer-events-none"
          />
        </motion.div>

        {/* 1. Top-Left: ONLY ONE Apex Garage Brand Logo */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={logoAnimation}
          className="relative z-10"
        >
          <div className="flex flex-col items-start gap-3">
            <div className="flex items-center">
              <motion.img
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.2 }}
                src={logoUrl}
                alt="Apex Garage"
                className="h-[104px] w-[180px] object-contain drop-shadow-[0_4px_12px_rgba(15,23,42,0.35)]"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector(
                    '.branding-logo-fallback'
                  );
                  if (fallback) (fallback as HTMLElement).style.display = 'flex';
                }}
              />
              <div className="branding-logo-fallback hidden h-14 w-14 rounded-xl bg-[#FF6B00] text-white items-center justify-center font-bold">
                <Wrench className="w-7 h-7" aria-hidden="true" />
              </div>
            </div>

            <div className="pl-1">
              <span className="font-mono text-[11px] font-bold tracking-[0.18em] text-white drop-shadow-[0_1px_3px_rgba(15,23,42,0.9)] uppercase">
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
          className="relative z-10 my-auto max-w-sm py-5"
        >
          <motion.h1
            variants={headlineChild}
            className="text-2xl sm:text-3xl xl:text-[1.9rem] font-extrabold text-white tracking-tight leading-[1.14]"
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
            className="mt-3 text-[13px] text-white/75 font-normal leading-relaxed max-w-sm"
          >
            Everything you need to manage jobs, customers, inventory, invoices and payments — in one place.
          </motion.p>
        </motion.div>

        {/* 3. Bottom-Left: Automotive Capability Strip */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={featureContainer}
          className="relative z-10 pt-2"
        >
          <div className="grid grid-cols-2 gap-2 max-w-sm">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.id}
                  variants={featureItemVariant}
                  whileHover={prefersReducedMotion ? {} : { y: -3, scale: 1.01 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="group flex min-w-0 items-center gap-2 p-2 rounded-lg bg-slate-950/30 border border-white/15 backdrop-blur-xs hover:border-orange-300/50 transition-colors duration-200 cursor-default"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#FF6B00]/15 text-orange-300 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 stroke-[2]" />
                  </div>
                  <span className="text-[10px] font-semibold text-white/85 leading-tight truncate">
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
        className="w-full lg:w-[58%] min-h-[580px] lg:min-h-0 flex flex-col justify-center p-6 sm:p-10 lg:px-14 lg:py-8 xl:px-16 bg-white transition-colors duration-300"
      >
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <img
            src={logoUrl}
            alt="Apex Garage"
            className="h-12 w-[80px] rounded-lg bg-white object-contain p-1"
          />
          <span className="text-[11px] font-bold tracking-[0.16em] text-slate-500 uppercase">Garage Management</span>
        </div>

        <div className="w-full flex items-center justify-center py-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={loginRightContainer}
            className="w-full max-w-[410px]"
          >
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF1E8] text-[#FF6B00]">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="text-3xl sm:text-[2rem] font-extrabold tracking-tight text-slate-900 leading-tight">
                Welcome back
              </h2>
              <p className="text-sm text-slate-500 mt-2 font-normal leading-relaxed">
                Sign in to continue to your account.
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
                  className="block text-xs font-semibold text-slate-700 mb-2"
                >
                  Email
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
                <div className="mb-2">
                  <label
                    htmlFor={passwordInputId}
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Password
                  </label>
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
              <motion.div variants={formItem} className="flex items-center justify-between gap-4 pt-0.5">
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
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs font-semibold text-[#FF6B00] hover:text-[#E56000] focus:outline-none transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
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
                  className="relative w-full h-[54px] px-6 bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-bold text-sm tracking-wider uppercase rounded-xl shadow-sm hover:shadow-lg hover:shadow-orange-500/25 flex items-center justify-center transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 overflow-hidden"
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

      </motion.main>
      </div>

      <footer className="relative z-10 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Apex Garage Management System. All rights reserved.
      </footer>

      {/* Forgot Password Recovery Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => {
          setIsForgotModalOpen(false);
          setResetTokenFromUrl('');
          setIdentifierFromUrl('');
        }}
        initialToken={resetTokenFromUrl}
        initialIdentifier={identifierFromUrl}
      />
    </div>
  );
};
export default LoginForm;
