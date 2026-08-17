import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, User as UserIcon, Shield, Phone, MessageSquare, Key, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateProfile, changeOwnPassword } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Profile details state
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [telegramHandle, setTelegramHandle] = useState(currentUser?.telegramHandle || '');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !currentUser) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    updateProfile(currentUser.id, { name, phone, telegramHandle });
    setSuccessMsg('Profile details updated successfully!');
    setTimeout(() => {
      setSuccessMsg('');
    }, 2500);
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const result = changeOwnPassword(currentPassword, newPassword, confirmPassword);
    if (!result.success) {
      setErrorMsg(result.error || 'Failed to update password.');
      return;
    }

    setSuccessMsg('Your password has been changed successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');

    setTimeout(() => {
      setSuccessMsg('');
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-white border border-slate-200 rounded-3xl shadow-xl max-w-lg w-full overflow-hidden text-slate-900"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-slate-900 font-bold flex items-center justify-center text-lg">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-base text-white">{currentUser.name}</h3>
                <span className="text-xs text-slate-300 uppercase tracking-wider font-semibold">
                  {currentUser.role.replace('_', ' ')} • {currentUser.department || 'Staff'}
                </span>
              </div>
            </div>
            <button
              id="close-profile-modal-btn"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-4">
            <button
              id="profile-details-tab-btn"
              onClick={() => {
                setActiveTab('profile');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'profile'
                  ? 'border-[#FF6B00] text-[#FF6B00]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Profile Details</span>
            </button>
            <button
              id="security-password-tab-btn"
              onClick={() => {
                setActiveTab('password');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'password'
                  ? 'border-[#FF6B00] text-[#FF6B00]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Security & Password</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6">
            {/* Feedback Notifications */}
            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {activeTab === 'profile' ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="profile-name-input"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Email (Read-Only)
                    </label>
                    <input
                      type="email"
                      value={currentUser.email}
                      disabled
                      className="w-full px-3 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Role Access
                    </label>
                    <div className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 capitalize font-medium">
                      <Shield className="w-3.5 h-3.5 text-slate-600" />
                      <span>{currentUser.role.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="profile-phone-input"
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Telegram Bot Handle
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="profile-telegram-input"
                        type="text"
                        value={telegramHandle}
                        onChange={(e) => setTelegramHandle(e.target.value)}
                        placeholder="@username"
                        className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                  <button
                    id="cancel-profile-modal-btn"
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="save-profile-modal-btn"
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#FF6B00] hover:bg-[#E56000] rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              /* Password Change Form (Self Change Criteria) */
              <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                  <div className="font-bold text-slate-900 mb-0.5">Password Complexity Rules:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500">
                    <li>Minimum 6 characters in length</li>
                    <li>Must contain both letters and numbers</li>
                    <li>Requires current password verification</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="current-password-input"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-[#FF6B00] outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="new-password-input"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters with letters & numbers"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-[#FF6B00] outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="confirm-password-input"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-[#FF6B00] outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                  <button
                    id="cancel-password-modal-btn"
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="submit-change-password-btn"
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#FF6B00] hover:bg-[#E56000] rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
