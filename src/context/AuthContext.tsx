import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, UserStatus, AuditLog, RolePermissionsMap, ModulePermissionId } from '../types';
import { INITIAL_USERS } from '../data/mockUsers';
import { DEFAULT_ROLE_PERMISSIONS, INITIAL_AUDIT_LOGS } from '../data/mockData';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  auditLogs: AuditLog[];
  loginError: string | null;
  login: (email: string, pass: string) => { success: boolean; error?: string };
  logout: () => void;
  quickSwitchRole: (role: UserRole) => void;
  refreshCurrentUserPermissions: () => void;
  addUser: (userData: Omit<User, 'id' | 'createdAt'>) => { success: boolean; error?: string };
  updateUser: (userId: string, updates: Partial<User>) => { success: boolean; error?: string };
  updateUserRole: (userId: string, role: UserRole) => void;
  updateUserStatus: (userId: string, status: UserStatus) => void;
  deleteUser: (userId: string) => void;
  updateProfile: (userId: string, updates: Partial<User>) => void;
  changeOwnPassword: (currentPass: string, newPass: string, confirmPass: string) => { success: boolean; error?: string };
  adminResetUserPassword: (targetUserId: string, newPass: string) => { success: boolean; error?: string };
  clearLoginError: () => void;
  addAuditLog: (
    action: string,
    module: AuditLog['module'],
    reference?: string,
    details?: string,
    previousValue?: string,
    newValue?: string,
    userNameOverride?: string
  ) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'apex_garage_user';
const LOCAL_STORAGE_USERS_LIST_KEY = 'apex_garage_users_list';
const LOCAL_STORAGE_LOGS_KEY = 'apex_garage_audit_logs';
const PERMISSIONS_STORAGE_KEY = 'apex_garage_role_permissions';

const readStoredRolePermissions = (): RolePermissionsMap => {
  try {
    const raw = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
    if (!raw) return DEFAULT_ROLE_PERMISSIONS;
    const parsed = JSON.parse(raw) as Partial<RolePermissionsMap>;
    return {
      ...DEFAULT_ROLE_PERMISSIONS,
      ...parsed,
    };
  } catch (error) {
    console.error('Failed to read stored role permissions', error);
    return DEFAULT_ROLE_PERMISSIONS;
  }
};

const resolveUserPermissions = (role: UserRole): ModulePermissionId[] => {
  const storedRoles = readStoredRolePermissions();
  if (role === 'admin' || role === 'owner') {
    return [...new Set(DEFAULT_ROLE_PERMISSIONS.admin ?? [])];
  }
  const rolePermissions = storedRoles[role] ?? DEFAULT_ROLE_PERMISSIONS[role] ?? [];
  return [...new Set(rolePermissions)];
};

const hydrateUserPermissions = (user: User): User => ({
  ...user,
  permissions: resolveUserPermissions(user.role),
});

const passwordMeetsRequirements = (value: string): boolean => {
  if (!value || value.length < 6) return false;
  return /[A-Za-z]/.test(value) && /\d/.test(value);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_USERS_LIST_KEY);
    let loadedUsers = INITIAL_USERS;
    if (saved) {
      try {
        loadedUsers = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved users', e);
      }
    }
    return loadedUsers.map((u) => {
      if (u.id === 'usr-1' || u.email.toLowerCase() === 'owner@apexgarage.com') {
        return hydrateUserPermissions({ ...u, status: 'active', role: 'admin' });
      }
      return hydrateUserPermissions(u);
    });
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (savedUser) {
      try {
        const parsed: User = JSON.parse(savedUser);
        if (parsed.id === 'usr-1' || parsed.email.toLowerCase() === 'owner@apexgarage.com') {
          return hydrateUserPermissions({ ...parsed, status: 'active', role: 'admin' });
        }
        if (parsed.status === 'active') {
          return hydrateUserPermissions(parsed);
        }
      } catch (e) {
        console.error('Failed to parse saved current user', e);
      }
    }
    return hydrateUserPermissions(INITIAL_USERS[0]);
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const savedLogs = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
    if (savedLogs) {
      try {
        return JSON.parse(savedLogs);
      } catch (e) {
        console.error('Failed to parse saved logs', e);
      }
    }
    return INITIAL_AUDIT_LOGS;
  });

  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_USERS_LIST_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    const handleRolePermissionChange = () => {
      setCurrentUser((prev) => (prev ? hydrateUserPermissions({ ...prev }) : prev));
      setUsers((prev) => prev.map((user) => hydrateUserPermissions(user)));
    };

    window.addEventListener('garage-role-permissions-changed', handleRolePermissionChange);
    return () => {
      window.removeEventListener('garage-role-permissions-changed', handleRolePermissionChange);
    };
  }, []);

  const addAuditLog = (
    action: string,
    module: AuditLog['module'] = 'User',
    reference?: string,
    details?: string,
    previousValue?: string,
    newValue?: string,
    userNameOverride?: string
  ) => {
    const userName = userNameOverride || currentUser?.name || 'System';
    const userId = currentUser?.id || 'sys';

    const formattedDate =
      new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) +
      ', ' +
      new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      timestamp: formattedDate,
      userId,
      userName,
      action,
      module,
      reference,
      previousValue,
      newValue,
      details,
      ipAddress: '192.168.1.100',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const login = (email: string, pass: string): { success: boolean; error?: string } => {
    setLoginError(null);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !pass) {
      const err = 'Please enter both email and password.';
      setLoginError(err);
      return { success: false, error: err };
    }

    const foundUser = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!foundUser) {
      const err = 'Invalid email address or password. Please check your credentials.';
      setLoginError(err);
      return { success: false, error: err };
    }

    if (foundUser.password !== pass) {
      const err = 'Incorrect password. Access denied.';
      setLoginError(err);
      return { success: false, error: err };
    }

    if (foundUser.status === 'deactivated') {
      const err = 'Your account has been deactivated by the Garage Owner. Access denied.';
      setLoginError(err);
      return { success: false, error: err };
    }

    if (foundUser.status === 'suspended') {
      const err = 'Your account has been suspended by the Garage Administrator. Please contact management.';
      setLoginError(err);
      return { success: false, error: err };
    }

    if (foundUser.status === 'inactive') {
      const err = 'Account is currently inactive. Contact system administrator for activation.';
      setLoginError(err);
      return { success: false, error: err };
    }

    const updatedUser: User = hydrateUserPermissions({
      ...foundUser,
      lastLoginAt: new Date().toISOString(),
    });

    setCurrentUser(updatedUser);
    setActiveTab('dashboard');

    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );

    addAuditLog('User Login', 'User', updatedUser.id, `Logged in as ${updatedUser.role}`, undefined, undefined, updatedUser.name);

    return { success: true };
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog('User Logout', 'User', currentUser.id, 'Logged out of garage portal');
    }
    setCurrentUser(null);
    setLoginError(null);
    setActiveTab('dashboard');
  };

  const refreshCurrentUserPermissions = () => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      return hydrateUserPermissions({ ...prev, permissions: resolveUserPermissions(prev.role) });
    });
    setUsers((prev) => prev.map((user) => hydrateUserPermissions(user)));
  };

  const quickSwitchRole = (role: UserRole) => {
    const roleUser = users.find((u) => u.role === role && u.status === 'active');
    if (roleUser) {
      const hydratedUser = hydrateUserPermissions(roleUser);
      setCurrentUser(hydratedUser);
      setActiveTab('dashboard');
      addAuditLog('Role Switch', 'User', hydratedUser.id, `Switched context to ${role} role`, undefined, undefined, hydratedUser.name);
    }
  };

  const addUser = (userData: Omit<User, 'id' | 'createdAt'>): { success: boolean; error?: string } => {
    const email = userData.email?.trim();
    const password = userData.password?.trim() ?? '';

    if (!email) {
      return { success: false, error: 'Email address is required.' };
    }

    const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return { success: false, error: 'A user account with this email/username already exists. Duplicate credentials rejected.' };
    }

    if (!passwordMeetsRequirements(password)) {
      return {
        success: false,
        error: 'Initial password must be at least 6 characters and contain both letters and numbers.',
      };
    }

    const newUser: User = {
      ...userData,
      email,
      password,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: userData.status || 'active',
    };

    setUsers((prev) => [newUser, ...prev]);

    if (currentUser) {
      addAuditLog('CREATE_USER', 'User', newUser.id, `Created user account for ${newUser.name} (${newUser.role})`);
    }

    return { success: true };
  };

  const updateUser = (userId: string, updates: Partial<User>): { success: boolean; error?: string } => {
    if (updates.email) {
      const cleanEmail = updates.email.trim().toLowerCase();
      const duplicate = users.some((u) => u.id !== userId && u.email.toLowerCase() === cleanEmail);
      if (duplicate) {
        return { success: false, error: 'Another account is already using this email address.' };
      }
    }

    const targetUser = users.find((u) => u.id === userId);
    // Prevent setting self or owner status to non-active via edit modal
    if (
      (userId === 'usr-1' || targetUser?.email.toLowerCase() === 'owner@apexgarage.com' || (currentUser && currentUser.id === userId)) &&
      updates.status &&
      updates.status !== 'active'
    ) {
      updates.status = 'active';
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? hydrateUserPermissions({ ...u, ...updates }) : hydrateUserPermissions(u)))
    );

    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) => (prev ? hydrateUserPermissions({ ...prev, ...updates }) : null));
    }

    const updatedTarget = users.find((u) => u.id === userId);
    if (currentUser && updatedTarget) {
      addAuditLog(
        'UPDATE_USER_ACCOUNT',
        'User',
        updatedTarget.id,
        `Updated account profile/role for ${updatedTarget.name} without altering history.`
      );
    }

    return { success: true };
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? hydrateUserPermissions({ ...u, role: newRole }) : hydrateUserPermissions(u)))
    );
    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) => (prev ? hydrateUserPermissions({ ...prev, role: newRole }) : null));
    }
    if (currentUser) {
      addAuditLog('UPDATE_USER_ROLE', 'User', userId, `Updated role for user ${userId} to ${newRole}`);
    }
  };

  const updateUserStatus = (userId: string, newStatus: UserStatus) => {
    const targetUser = users.find((u) => u.id === userId);

    // Safeguard: Prevent self-deactivation or deactivation of primary Garage Owner
    const isSelf = currentUser?.id === userId;
    const isPrimaryOwner = userId === 'usr-1' || targetUser?.email.toLowerCase() === 'owner@apexgarage.com';

    if ((isSelf || isPrimaryOwner) && newStatus !== 'active') {
      if (currentUser) {
        addAuditLog(
          'SECURITY_PREVENTION',
          'User',
          userId,
          `Blocked attempt to deactivate active administrator session for ${targetUser?.name || userId}.`
        );
      }
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );
    if (currentUser && currentUser.id === userId && (newStatus === 'suspended' || newStatus === 'inactive' || newStatus === 'deactivated')) {
      logout();
    }
    if (currentUser) {
      addAuditLog('UPDATE_USER_STATUS', 'User', userId, `Set user status for ${userId} to ${newStatus}`);
    }
  };

  const deleteUser = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);

    // Safeguard: Prevent deletion of primary Garage Owner or currently logged-in account
    const isSelf = currentUser?.id === userId;
    const isPrimaryOwner = userId === 'usr-1' || targetUser?.email.toLowerCase() === 'owner@apexgarage.com';

    if (isSelf || isPrimaryOwner) {
      if (currentUser) {
        addAuditLog(
          'SECURITY_PREVENTION',
          'User',
          userId,
          `Blocked attempt to delete primary active administrator account ${targetUser?.name || userId}.`
        );
      }
      return;
    }

    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (currentUser && currentUser.id === userId) {
      logout();
    }
    if (currentUser && targetUser) {
      addAuditLog('DELETE_USER', 'User', userId, `Removed user ${targetUser.name}`);
    }
  };

  const updateProfile = (userId: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
    );
    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const changeOwnPassword = (currentPass: string, newPass: string, confirmPass: string): { success: boolean; error?: string } => {
    if (!currentUser) {
      return { success: false, error: 'No active session found.' };
    }

    if (!currentPass) {
      return { success: false, error: 'Current password is required.' };
    }

    if (currentUser.password !== currentPass) {
      return { success: false, error: 'Current password does not match.' };
    }

    if (!passwordMeetsRequirements(newPass)) {
      return { success: false, error: 'New password must be at least 6 characters and include both letters and numbers.' };
    }

    if (newPass !== confirmPass) {
      return { success: false, error: 'New password and confirmation do not match.' };
    }

    // Update password
    updateProfile(currentUser.id, { password: newPass });
    addAuditLog('SELF_CHANGE_PASSWORD', 'User', currentUser.id, 'Successfully changed account password.');

    return { success: true };
  };

  const adminResetUserPassword = (targetUserId: string, newPass: string): { success: boolean; error?: string } => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'owner')) {
      return { success: false, error: 'Only Garage Owner/Admin can reset user passwords.' };
    }

    const targetUser = users.find((u) => u.id === targetUserId);
    if (!targetUser) {
      return { success: false, error: 'User not found.' };
    }

    if (!passwordMeetsRequirements(newPass)) {
      return { success: false, error: 'Password must be at least 6 characters and include both letters and numbers.' };
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === targetUserId ? { ...u, password: newPass } : u))
    );

    addAuditLog(
      'ADMIN_RESET_PASSWORD',
      'User',
      targetUser.id,
      `Owner reset password for user ${targetUser.name} (${targetUser.email}) without requiring current password.`
    );

    return { success: true };
  };

  const clearLoginError = () => {
    setLoginError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        auditLogs,
        loginError,
        login,
        logout,
        quickSwitchRole,
        refreshCurrentUserPermissions,
        addUser,
        updateUser,
        updateUserRole,
        updateUserStatus,
        deleteUser,
        updateProfile,
        changeOwnPassword,
        adminResetUserPassword,
        clearLoginError,
        addAuditLog,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
