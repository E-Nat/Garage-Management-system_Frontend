import React, { useState } from 'react';
import { X, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid work email address.');
      return;
    }
    setError('');
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setEmail('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 transition-all">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#FF6B00]" />
              Reset Account Password
            </h3>
            <button
              id="close-forgot-pass-modal"
              type="button"
              onClick={handleReset}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-slate-600 font-normal leading-relaxed">
                  Enter your registered work email address below. We will send you instructions to reset your password.
                </p>

                {error && (
                  <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      id="forgot-password-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="user@gmail.com"
                      className="w-full pl-10 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    id="cancel-forgot-pass-btn"
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="submit-forgot-pass-btn"
                    type="submit"
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-[#FF6B00] hover:bg-[#E56000] active:scale-[0.99] rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-3 space-y-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-2xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    Reset Link Sent
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    We have dispatched password recovery instructions to{' '}
                    <strong className="font-semibold text-slate-900">{email}</strong>.
                  </p>
                </div>
                <button
                  id="done-forgot-pass-btn"
                  type="button"
                  onClick={handleReset}
                  className="w-full py-3 text-xs font-semibold text-white bg-[#FF6B00] hover:bg-[#E56000] active:scale-[0.99] rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
