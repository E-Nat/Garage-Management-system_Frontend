import React, { useState } from 'react';
import {
  X,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageSquare,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Headphones,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  checkRecoveryOptionsApi,
  forgotPasswordApi,
  resetPasswordApi,
} from '../../services/api';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialToken?: string;
  initialIdentifier?: string;
}

type Step = 'lookup' | 'choose_channel' | 'no_recovery' | 'sent_confirmation' | 'enter_token';

interface RecoveryData {
  has_account: boolean;
  has_email: boolean;
  email?: string | null;
  masked_email?: string | null;
  has_telegram: boolean;
  telegram_handle?: string | null;
  customer_name?: string;
  phone?: string;
  garage_phones?: string[];
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialToken = '',
  initialIdentifier = '',
}) => {
  // Step State
  const [step, setStep] = useState<Step>(initialToken ? 'enter_token' : 'lookup');

  // Lookup State
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [isChecking, setIsChecking] = useState(false);
  const [recoveryData, setRecoveryData] = useState<RecoveryData | null>(null);

  // Sending State
  const [isSending, setIsSending] = useState(false);
  const [sentChannel, setSentChannel] = useState<'email' | 'telegram' | null>(null);

  // Password Reset State (Token + New Password)
  const [resetToken, setResetToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Feedback State
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleResetModal = () => {
    setStep('lookup');
    setIdentifier('');
    setIsChecking(false);
    setRecoveryData(null);
    setIsSending(false);
    setSentChannel(null);
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsSubmittingReset(false);
    setResetSuccess(false);
    setError(null);
    onClose();
  };

  // Step 1: Identifier Lookup
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = identifier.trim();
    if (!raw) {
      setError('Please enter your registered email address or phone number.');
      return;
    }

    setError(null);
    setIsChecking(true);

    try {
      const res = await checkRecoveryOptionsApi(raw);
      setIsChecking(false);

      if (res.data) {
        const data = res.data as RecoveryData;
        setRecoveryData(data);

        if (!data.has_account) {
          setError('We could not find an account matching that email or phone number.');
          return;
        }

        if (!data.has_email && !data.has_telegram) {
          setStep('no_recovery');
        } else {
          setStep('choose_channel');
        }
      } else {
        setError('Failed to check recovery options. Please try again.');
      }
    } catch (err: any) {
      setIsChecking(false);
      const msg = err.response?.data?.message || err.message || 'Failed to check recovery methods.';
      setError(msg);
    }
  };

  // Step 2: Dispatch Reset Link via Selected Channel
  const handleDispatchChannel = async (channel: 'email' | 'telegram') => {
    setError(null);
    setIsSending(true);

    try {
      const res = await forgotPasswordApi(identifier.trim(), channel);
      setIsSending(false);

      if (res.success || res.channel) {
        setSentChannel(channel);
        setStep('sent_confirmation');
      } else {
        setError(res.message || 'Failed to dispatch reset link.');
      }
    } catch (err: any) {
      setIsSending(false);
      const msg = err.response?.data?.message || err.message || 'Failed to dispatch reset link.';
      setError(msg);
    }
  };

  // Step 3: Complete Reset with Token & New Password
  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const tokenVal = resetToken.trim();

    if (!tokenVal) {
      setError('Please enter your 30-minute password reset token.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setIsSubmittingReset(true);

    try {
      const res = await resetPasswordApi({
        token: tokenVal,
        password: newPassword,
        passwordConfirmation: confirmPassword,
        identifier: identifier.trim() || undefined,
      });

      setIsSubmittingReset(false);
      if (res.success) {
        setResetSuccess(true);
      } else {
        setError(res.message || 'Failed to reset password.');
      }
    } catch (err: any) {
      setIsSubmittingReset(false);
      const msg = err.response?.data?.message || err.response?.data?.errors?.token?.[0] || 'Invalid or expired password reset token.';
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 transition-all">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-slate-900"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">
                {step === 'enter_token' ? 'Set New Password' : 'Password Recovery'}
              </h3>
            </div>
            <button
              id="close-forgot-pass-modal"
              type="button"
              onClick={handleResetModal}
              className="text-white/80 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/10"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {/* STEP 1: IDENTIFIER LOOKUP */}
            {step === 'lookup' && (
              <form onSubmit={handleLookup} className="space-y-4 text-xs">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your registered <strong className="text-slate-800">Email Address</strong> or{' '}
                  <strong className="text-slate-800">Phone Number</strong> to check your available password recovery channels.
                </p>

                <div>
                  <label htmlFor="recovery-identifier-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Phone Number or Email
                  </label>
                  <div className="relative">
                    <input
                      id="recovery-identifier-input"
                      type="text"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="e.g. 086 401 600 or customer@gmail.com"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-none font-medium"
                      required
                      autoFocus
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Cambodian phone formats (e.g. 086401600, +85586401600) or email.
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('enter_token')}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
                  >
                    Have a reset token? Enter it here
                  </button>

                  <div className="flex gap-2">
                    <button
                      id="cancel-forgot-pass-btn"
                      type="button"
                      onClick={handleResetModal}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      id="submit-forgot-pass-lookup-btn"
                      type="submit"
                      disabled={isChecking}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#FF6B00] hover:bg-[#E56000] rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isChecking ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Checking...</span>
                        </>
                      ) : (
                        <span>Continue</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* STEP 2: CHOOSE RECOVERY CHANNEL */}
            {step === 'choose_channel' && recoveryData && (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900 text-sm">
                    {recoveryData.customer_name || 'Account Identified'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Select your preferred recovery channel below to receive a secure 30-minute password reset link:
                  </div>
                </div>

                <div className="space-y-2.5">
                  {/* Channel: Telegram */}
                  {recoveryData.has_telegram && (
                    <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl flex items-center justify-between gap-3 hover:border-sky-300 transition">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-sky-600 shrink-0" />
                          <span>Connected Telegram</span>
                          <span className="px-1.5 py-0.2 bg-sky-200/80 text-sky-800 text-[10px] rounded font-semibold">
                            Fastest
                          </span>
                        </div>
                        <div className="text-[11px] text-sky-800 font-medium">
                          {recoveryData.telegram_handle || 'Verified Telegram chat'}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={isSending}
                        onClick={() => handleDispatchChannel('telegram')}
                        className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-lg transition shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {isSending && sentChannel === 'telegram' ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        <span>Send Telegram Link</span>
                      </button>
                    </div>
                  )}

                  {/* Channel: Email */}
                  {recoveryData.has_email && (
                    <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 hover:border-indigo-300 transition">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>Registered Email</span>
                        </div>
                        <div className="text-[11px] text-indigo-800 font-mono">
                          {recoveryData.masked_email || recoveryData.email}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={isSending}
                        onClick={() => handleDispatchChannel('email')}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {isSending && sentChannel === 'email' ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        <span>Send Email Link</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('lookup');
                      setError(null);
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('enter_token')}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
                  >
                    Already have a token?
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2-B: NO ONLINE RECOVERY METHOD */}
            {step === 'no_recovery' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                    <Headphones className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>Contact Service Advisor</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    We couldn't find an available online recovery method (email or Telegram) connected to this account.
                    To protect your garage records, please contact our Service Advisor to verify your identity.
                  </p>

                  <div className="p-3 bg-white/80 border border-amber-200 rounded-lg space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-500 uppercase">Garage Helpline Contacts:</div>
                    <div className="flex flex-col sm:flex-row gap-2 text-xs font-mono font-bold text-slate-800">
                      <a href="tel:+85523999888" className="inline-flex items-center gap-1 hover:text-[#FF6B00] transition">
                        <Phone className="w-3.5 h-3.5 text-amber-600" /> +855 23 999 888
                      </a>
                      <a href="tel:086401600" className="inline-flex items-center gap-1 hover:text-[#FF6B00] transition">
                        <Phone className="w-3.5 h-3.5 text-amber-600" /> 086 401 600
                      </a>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('lookup');
                      setError(null);
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <a
                    href="tel:+85523999888"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" /> Contact Service Advisor
                  </a>
                </div>
              </div>
            )}

            {/* STEP 3: LINK SENT CONFIRMATION */}
            {step === 'sent_confirmation' && (
              <div className="space-y-4 text-center py-2 text-xs">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    {sentChannel === 'telegram' ? 'Telegram Reset Link Sent' : 'Email Reset Link Sent'}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed max-w-sm mx-auto">
                    {sentChannel === 'telegram' ? (
                      <>
                        A secure password reset link with a 30-minute validity has been sent to your connected Telegram. Open the message from the Apex Garage Bot to reset your password.
                      </>
                    ) : (
                      <>
                        Password recovery instructions have been dispatched to your registered email address. This link is single-use and valid for 30 minutes.
                      </>
                    )}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('enter_token')}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition cursor-pointer shadow-xs"
                  >
                    Enter Reset Token & Set Password
                  </button>
                  <button
                    type="button"
                    onClick={handleResetModal}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                  >
                    Return to Sign In
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: ENTER RESET TOKEN & SET NEW PASSWORD */}
            {step === 'enter_token' && !resetSuccess && (
              <form onSubmit={handleCompleteReset} className="space-y-3 text-xs">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter the secure reset token received via Telegram or Email and choose your new password.
                </p>

                <div>
                  <label htmlFor="reset-token-input" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Reset Token <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="reset-token-input"
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Paste 64-character token"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:border-[#FF6B00] outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Valid for 30 minutes. Single-use only.
                  </span>
                </div>

                <div>
                  <label htmlFor="reset-new-password" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="reset-new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3 py-2 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#FF6B00] outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="reset-confirm-password" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Confirm New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="reset-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-3 py-2 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#FF6B00] outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setStep('lookup')}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button
                    id="submit-complete-reset-btn"
                    type="submit"
                    disabled={isSubmittingReset}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingReset ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4-B: RESET SUCCESS */}
            {resetSuccess && (
              <div className="text-center py-3 space-y-4 text-xs">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    Password Reset Complete!
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Your password has been successfully updated and all prior sessions were revoked. You can now sign in with your new credentials.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetModal}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-[#FF6B00] hover:bg-[#E56000] rounded-xl transition shadow-xs cursor-pointer"
                >
                  Sign In to Garage Account
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
