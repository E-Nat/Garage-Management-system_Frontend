import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, UserRole, UserStatus } from '../../types';
import {
  Users,
  UserPlus,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Edit2,
  Trash2,
  Lock,
  Mail,
  Phone,
  MessageSquare,
  X,
  ShieldCheck,
  UserCheck,
  Key,
  Ban,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Cambodian and International Phone Validator & Normalizer
export function validateAndNormalizePhone(phoneInput: string): { isValid: boolean; normalized: string; error?: string } {
  const trimmed = phoneInput.trim();
  if (!trimmed) {
    return { isValid: true, normalized: '' };
  }

  // Check valid characters
  if (!/^[+0-9\s\-().]{7,20}$/.test(trimmed)) {
    return { isValid: false, normalized: '', error: 'Phone number contains invalid characters.' };
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) {
    return { isValid: false, normalized: '', error: 'Phone number must have between 7 and 15 digits.' };
  }

  // Cambodian phone numbers: starts with 855 or domestic 0
  if (digits.startsWith('855')) {
    const national = digits.substring(3).replace(/^0+/, '');
    if (national.length >= 7 && national.length <= 9) {
      return { isValid: true, normalized: `0${national}` };
    }
  } else if (digits.startsWith('0')) {
    const national = digits.replace(/^0+/, '');
    if (national.length >= 7 && national.length <= 9) {
      return { isValid: true, normalized: `0${national}` };
    }
  } else if (digits.length >= 7 && digits.length <= 9 && !digits.startsWith('1')) {
    return { isValid: true, normalized: `0${digits}` };
  }

  // North American numbers
  if (digits.startsWith('1') && digits.length === 11) {
    return { isValid: true, normalized: `+1${digits.substring(1)}` };
  }

  // International format with leading +
  if (trimmed.startsWith('+')) {
    return { isValid: true, normalized: `+${digits}` };
  }

  return { isValid: true, normalized: trimmed };
}

export const UserManagement: React.FC = () => {
  const { users, currentUser, addUser, updateUser, updateUserRole, updateUserStatus, deleteUser, adminResetUserPassword } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToResetPass, setUserToResetPass] = useState<User | null>(null);
  const [userToConfirmStatus, setUserToConfirmStatus] = useState<{ user: User; targetStatus: UserStatus } | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state for Add/Edit User
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'advisor' as UserRole,
    phone: '',
    telegramHandle: '',
    department: 'Customer Service',
    status: 'active' as UserStatus,
  });
  const [formError, setFormError] = useState('');

  // Admin Password Reset Form State
  const [resetPassData, setResetPassData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [resetPassError, setResetPassError] = useState('');
  const [showInitialPassword, setShowInitialPassword] = useState(false);
  const [showAdminNewPassword, setShowAdminNewPassword] = useState(false);
  const [showAdminConfirmPassword, setShowAdminConfirmPassword] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setShowInitialPassword(false);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'advisor',
      phone: '',
      telegramHandle: '',
      department: 'Customer Service',
      status: 'active',
    });
    setFormError('');
    setIsAddUserModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setShowInitialPassword(false);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      phone: user.phone,
      telegramHandle: user.telegramHandle || '',
      department: user.department || 'Staff',
      status: user.status,
    });
    setFormError('');
    setIsAddUserModalOpen(true);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenResetPassModal = (user: User) => {
    setUserToResetPass(user);
    setResetPassData({ newPassword: '', confirmPassword: '' });
    setResetPassError('');
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanName = formData.name.trim();
    const cleanEmail = formData.email.trim().toLowerCase();

    if (!cleanName) {
      setFormError('Full Name is required.');
      return;
    }

    if (cleanName.includes('@') || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanName)) {
      setFormError('Full Name must be a person\'s name, not an email address.');
      return;
    }

    if (cleanName.length < 2) {
      setFormError('Full Name must be at least 2 characters long.');
      return;
    }

    if (!cleanEmail) {
      setFormError('Email address is required.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFormError('Please enter a valid email address (e.g. user@gmail.com).');
      return;
    }

    // Phone validation & normalization
    let normalizedPhone = formData.phone.trim();
    if (normalizedPhone) {
      const phoneCheck = validateAndNormalizePhone(normalizedPhone);
      if (!phoneCheck.isValid) {
        setFormError(phoneCheck.error || 'Please enter a valid phone number (e.g. 086401600, 0971234567, or +85586401600).');
        return;
      }
      normalizedPhone = phoneCheck.normalized;
    }

    let cleanHandle = formData.telegramHandle.trim();
    if (cleanHandle && !cleanHandle.startsWith('@')) {
      cleanHandle = `@${cleanHandle}`;
    }

    setIsSubmitting(true);

    if (!editingUser) {
      if (!formData.password) {
        setFormError('Initial password is required for new accounts.');
        setIsSubmitting(false);
        return;
      }

      if (formData.password.length < 6) {
        setFormError('Initial password must be at least 6 characters long.');
        setIsSubmitting(false);
        return;
      }

      const res = await addUser({
        name: cleanName,
        email: cleanEmail,
        password: formData.password,
        role: formData.role,
        phone: normalizedPhone,
        telegramHandle: cleanHandle,
        department: formData.department.trim(),
        status: formData.status,
      });

      setIsSubmitting(false);

      if (!res.success) {
        setFormError(res.error || 'Failed to create user account.');
        return;
      }
      showToast(`User account for ${cleanName} created successfully in database!`);
    } else {
      const updates: Partial<User> = {
        name: cleanName,
        email: cleanEmail,
        role: formData.role,
        phone: normalizedPhone,
        telegramHandle: cleanHandle,
        department: formData.department.trim(),
        status: formData.status,
      };

      const res = await updateUser(editingUser.id, updates);
      setIsSubmitting(false);

      if (!res.success) {
        setFormError(res.error || 'Failed to update user account.');
        return;
      }
      showToast(`Account details for ${cleanName} updated successfully!`);
    }

    setIsAddUserModalOpen(false);
  };

  const handleAdminResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetPassError('');

    if (!userToResetPass) return;

    if (!resetPassData.newPassword || resetPassData.newPassword.length < 6) {
      setResetPassError('New password must be at least 6 characters long.');
      return;
    }

    if (resetPassData.newPassword !== resetPassData.confirmPassword) {
      setResetPassError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const res = await adminResetUserPassword(userToResetPass.id, resetPassData.newPassword);
    setIsSubmitting(false);

    if (!res.success) {
      setResetPassError(res.error || 'Failed to reset password.');
      return;
    }

    showToast(`Password for ${userToResetPass.name} reset successfully!`);
    setUserToResetPass(null);
  };

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      setIsSubmitting(true);
      const res = await deleteUser(userToDelete.id);
      setIsSubmitting(false);
      if (res && res.error) {
        showToast(res.error);
      } else {
        showToast(`User account ${userToDelete.name} deleted.`);
      }
      setUserToDelete(null);
    }
  };

  const handleConfirmStatusChange = async () => {
    if (userToConfirmStatus) {
      setIsSubmitting(true);
      const res = await updateUserStatus(userToConfirmStatus.user.id, userToConfirmStatus.targetStatus);
      setIsSubmitting(false);
      if (res && res.error) {
        showToast(res.error);
      } else {
        showToast(
          userToConfirmStatus.targetStatus === 'deactivated'
            ? `Deactivated account for ${userToConfirmStatus.user.name}`
            : `Reactivated account for ${userToConfirmStatus.user.name}`
        );
      }
      setUserToConfirmStatus(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-slate-100 text-slate-900 border-slate-300';
      case 'advisor':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'mechanic':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'parts_manager':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200';
      case 'customer':
        return 'bg-purple-50 text-purple-800 border-purple-200';
    }
  };

  const getStatusBadgeStyle = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'deactivated':
        return 'bg-slate-200 text-slate-700 border-slate-300';
      case 'inactive':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'suspended':
        return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-slate-900 text-white border border-slate-700 rounded-2xl shadow-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 text-slate-900 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-900" />
            User Account & Staff Access Administration
          </div>
          <h1 className="text-2xl font-bold">User Management & Permissions</h1>
          <p className="text-xs text-slate-500 mt-1">
            Provision staff/mechanic accounts, edit user roles, reset passwords, and activate/deactivate access while preserving history.
          </p>
        </div>

        <button
          id="add-user-btn"
          onClick={handleOpenAddModal}
          className="px-5 py-3 bg-[#FF6B00] hover:bg-[#E56000] text-white font-semibold rounded-2xl text-xs flex items-center gap-2 shadow-xs transition shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" />
          <span>Provision New User</span>
        </button>
      </div>

      {/* Filters & Search Control Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search Bar */}
          <div className="sm:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="search-users-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-hidden"
            />
          </div>

          {/* Role Filter */}
          <div className="sm:col-span-3">
            <select
              id="filter-role-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-hidden"
            >
              <option value="all">Filter: All System Roles</option>
              <option value="admin">Admin / Garage Owner</option>
              <option value="advisor">Service Advisor</option>
              <option value="mechanic">Mechanic</option>
              <option value="parts_manager">Parts Manager</option>
              <option value="customer">Customer</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-4 flex items-center gap-2">
            <select
              id="filter-status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-hidden"
            >
              <option value="all">Filter: All Account Statuses</option>
              <option value="active">Active Only</option>
              <option value="deactivated">Deactivated Only</option>
              <option value="suspended">Suspended Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <span className="text-xs text-slate-500 font-mono shrink-0">
              {filteredUsers.length} Users
            </span>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">User Profile</th>
                <th className="py-3 px-3">Assigned Role</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Telegram / Contact</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Last Session</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => {
                const isProtected = user.id === 'usr-1' || user.email.toLowerCase() === 'owner@gmail.com' || user.email.toLowerCase() === 'apexgarage.owner@gmail.com' || (currentUser && currentUser.id === user.id);

                return (
                  <tr key={user.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#FF6B00] text-white font-bold flex items-center justify-center text-sm shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{user.name}</span>
                            {isProtected && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                                <ShieldCheck className="w-3 h-3 text-indigo-600" /> Owner / Active Session
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getRoleBadgeStyle(user.role)}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {user.department || 'General Staff'}
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-slate-800 font-medium">{user.phone}</div>
                      {user.telegramHandle && (
                        <div className="text-[10px] text-sky-600 font-mono">{user.telegramHandle}</div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusBadgeStyle(user.status)}`}>
                        {user.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right text-[11px] text-slate-500">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never logged in'}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1">
                        {/* Edit Button */}
                        <button
                          id={`edit-user-${user.id}`}
                          onClick={() => handleOpenEditModal(user)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
                          title="Edit Account Details & Role"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Reset Password Button (Admin/Owner Criteria) */}
                        <button
                          id={`reset-pass-user-${user.id}`}
                          onClick={() => handleOpenResetPassModal(user)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
                          title="Reset User Password (Admin)"
                        >
                          <Key className="w-4 h-4" />
                        </button>

                        {/* Deactivate / Activate Button with Safeguards */}
                        {isProtected ? (
                          <button
                            disabled
                            className="p-1.5 text-slate-300 cursor-not-allowed rounded-lg"
                            title="Primary Owner & Active Session cannot be deactivated to prevent system lockout."
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : user.status === 'active' ? (
                          <button
                            id={`deactivate-user-${user.id}`}
                            onClick={() => setUserToConfirmStatus({ user, targetStatus: 'deactivated' })}
                            className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                            title="Deactivate User Access"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            id={`activate-user-${user.id}`}
                            onClick={() => setUserToConfirmStatus({ user, targetStatus: 'active' })}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition"
                            title="Activate Account"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Button with Safeguards */}
                        {isProtected ? (
                          <button
                            disabled
                            className="p-1.5 text-slate-300 cursor-not-allowed rounded-lg"
                            title="Primary Garage Owner account cannot be deleted."
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            id={`delete-user-${user.id}`}
                            onClick={() => setUserToDelete(user)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-3xl shadow-xl max-w-lg w-full overflow-hidden text-slate-900"
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-white" />
                {editingUser ? `Edit Account: ${editingUser.name}` : 'Provision New Staff/User Account'}
              </h3>
              <button
                id="close-user-modal-btn"
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  id="user-modal-name-input"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. David Miller"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={editingUser ? "col-span-2" : "col-span-1"}>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    id="user-modal-email-input"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@gmail.com"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-hidden"
                    required
                  />
                </div>

                {/* Password field only rendered during new account creation */}
                {!editingUser && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Initial Password
                    </label>
                    <div className="relative">
                      <input
                        id="user-modal-pass-input"
                        type={showInitialPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-hidden"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowInitialPassword(!showInitialPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 focus:outline-none transition cursor-pointer"
                        title={showInitialPassword ? 'Hide password' : 'Show password'}
                        aria-label={showInitialPassword ? 'Hide password' : 'Show password'}
                      >
                        {showInitialPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {editingUser && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>To change or reset this user's password, use the <strong>Key icon</strong> in the user roster.</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Security Role
                  </label>
                  <select
                    id="user-modal-role-select"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-hidden"
                  >
                    <option value="admin">Admin / Garage Owner</option>
                    <option value="advisor">Service Advisor</option>
                    <option value="mechanic">Chief Mechanic</option>
                    <option value="parts_manager">Parts Manager</option>
                    <option value="customer">Customer Portal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Account Status
                  </label>
                  {editingUser && (editingUser.id === 'usr-1' || editingUser.email.toLowerCase() === 'owner@gmail.com' || editingUser.email.toLowerCase() === 'apexgarage.owner@gmail.com' || editingUser.id === currentUser?.id) ? (
                    <div>
                      <input
                        type="text"
                        disabled
                        value="Active (Protected Session)"
                        className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-indigo-700 font-bold outline-hidden cursor-not-allowed"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Garage Owner & active session status is locked to Active to prevent self-lockouts.
                      </span>
                    </div>
                  ) : (
                    <select
                      id="user-modal-status-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-hidden"
                    >
                      <option value="active">Active</option>
                      <option value="deactivated">Deactivated</option>
                      <option value="suspended">Suspended</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    id="user-modal-phone-input"
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 086401600 or +85586401600"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Supports 086401600, 0123456789, +855...
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Telegram Handle (Optional)
                  </label>
                  <input
                    id="user-modal-telegram-input"
                    type="text"
                    value={formData.telegramHandle}
                    onChange={(e) => setFormData({ ...formData, telegramHandle: e.target.value })}
                    placeholder="@handle (optional)"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    User can connect Telegram later via bot.
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  id="cancel-user-modal-btn"
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  id="submit-user-modal-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#FF6B00] hover:bg-[#E56000] rounded-xl shadow-xs transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{editingUser ? 'Saving...' : 'Provisioning...'}</span>
                    </>
                  ) : (
                    <span>{editingUser ? 'Save Updates' : 'Provision Account'}</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Admin Password Reset Modal (Owner Reset Story Criteria) */}
      {userToResetPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-3xl shadow-xl max-w-md w-full overflow-hidden text-slate-900"
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-400" />
                Admin Password Reset
              </h3>
              <button
                id="close-admin-reset-modal-btn"
                onClick={() => setUserToResetPass(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminResetPasswordSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div className="font-bold text-slate-900">{userToResetPass.name}</div>
                <div className="text-[11px] text-slate-500 font-mono">{userToResetPass.email}</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  As Garage Owner/Admin, you can set a new password without knowing their current password.
                </div>
              </div>

              {resetPassError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
                  {resetPassError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="admin-reset-new-pass-input"
                    type={showAdminNewPassword ? 'text' : 'password'}
                    value={resetPassData.newPassword}
                    onChange={(e) => setResetPassData({ ...resetPassData, newPassword: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-[#FF6B00] outline-hidden"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminNewPassword(!showAdminNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 focus:outline-none transition cursor-pointer"
                    title={showAdminNewPassword ? 'Hide password' : 'Show password'}
                    aria-label={showAdminNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showAdminNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="admin-reset-confirm-pass-input"
                    type={showAdminConfirmPassword ? 'text' : 'password'}
                    value={resetPassData.confirmPassword}
                    onChange={(e) => setResetPassData({ ...resetPassData, confirmPassword: e.target.value })}
                    placeholder="Re-enter password"
                    className="w-full px-3 py-2 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-[#FF6B00] outline-hidden"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminConfirmPassword(!showAdminConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 focus:outline-none transition cursor-pointer"
                    title={showAdminConfirmPassword ? 'Hide password' : 'Show password'}
                    aria-label={showAdminConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showAdminConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  id="cancel-admin-reset-btn"
                  type="button"
                  onClick={() => setUserToResetPass(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  id="submit-admin-reset-btn"
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#FF6B00] hover:bg-[#E56000] rounded-xl shadow-xs transition cursor-pointer"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Account Deactivation / Activation Confirmation Modal */}
      {userToConfirmStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full space-y-4 text-slate-900 shadow-xl">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
              userToConfirmStatus.targetStatus === 'deactivated' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {userToConfirmStatus.targetStatus === 'deactivated' ? (
                <Ban className="w-6 h-6" />
              ) : (
                <UserCheck className="w-6 h-6" />
              )}
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                Confirm {userToConfirmStatus.targetStatus === 'deactivated' ? 'Account Deactivation' : 'Account Activation'}?
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Are you sure you want to {userToConfirmStatus.targetStatus === 'deactivated' ? 'deactivate' : 'reactivate'} the account for{' '}
                <strong className="text-slate-900">{userToConfirmStatus.user.name}</strong> ({userToConfirmStatus.user.email})?
                {userToConfirmStatus.targetStatus === 'deactivated' && (
                  <span className="block mt-1 text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 font-medium text-[11px]">
                    This will block their access to the workshop portal until reactivated by an admin.
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                id="cancel-status-confirm-btn"
                onClick={() => setUserToConfirmStatus(null)}
                className="w-1/2 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                id="confirm-status-action-btn"
                onClick={handleConfirmStatusChange}
                className={`w-1/2 py-2.5 text-xs font-semibold text-white rounded-xl shadow-xs transition ${
                  userToConfirmStatus.targetStatus === 'deactivated'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Yes, {userToConfirmStatus.targetStatus === 'deactivated' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full space-y-4 text-slate-900 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Delete User Account?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently remove <strong className="text-slate-900">{userToDelete.name}</strong> ({userToDelete.email})?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                id="cancel-delete-user-btn"
                onClick={() => setUserToDelete(null)}
                className="w-1/2 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-user-btn"
                onClick={handleDeleteConfirm}
                className="w-1/2 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
