import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, UserStatus, AuditLog, RolePermissionsMap, ModulePermissionId } from '../types';
import { INITIAL_USERS } from '../data/mockUsers';
import { DEFAULT_ROLE_PERMISSIONS, INITIAL_AUDIT_LOGS } from '../data/mockData';
import api, {
  getUsers,
  createUser as createUserApi,
  updateUser as updateUserApi,
  updateUserStatus as updateUserStatusApi,
  resetUserPassword as resetUserPasswordApi,
  deleteUser as deleteUserApi,
} from '../services/api';

const ROLE_TO_ID_MAP: Record<UserRole, number> = {
  admin: 1,
  owner: 1,
  advisor: 2,
  staff: 2,
  mechanic: 3,
  parts_manager: 4,
  customer: 5,
};

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  auditLogs: AuditLog[];
  loginError: string | null;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  quickSwitchRole: (role: UserRole) => void;
  refreshCurrentUserPermissions: () => void;
  fetchUsers: () => Promise<void>;
  addUser: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<{ success: boolean; error?: string; user?: User }>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  updateUserRole: (userId: string, role: UserRole) => void;
  updateUserStatus: (userId: string, status: UserStatus) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (userId: string, updates: Partial<User>) => void;
  changeOwnPassword: (currentPass: string, newPass: string, confirmPass: string) => { success: boolean; error?: string };
  adminResetUserPassword: (targetUserId: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
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
  navigate: (path: string) => void;
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
  return true;
};

const mapBackendUserToUser = (backendUser: any): User => {
  const roleSlug = (backendUser.role?.slug || backendUser.role || 'advisor') as UserRole;
  return hydrateUserPermissions({
    id: String(backendUser.id),
    name: backendUser.name || 'User',
    email: backendUser.email || '',
    role: roleSlug,
    status: (backendUser.status || 'active') as UserStatus,
    phone: backendUser.phone || '',
    telegramHandle: backendUser.telegram_handle || '',
    department: backendUser.department || '',
    avatarUrl: backendUser.avatar_url,
    lastLoginAt: backendUser.last_login_at,
    createdAt: backendUser.created_at || new Date().toISOString(),
  });
};

const tabToPathMap: Record<string, string> = {
  dashboard: '/dashboard',
  customers: '/customers',
  vehicles: '/vehicles',
  jobs: '/jobs',
  repairs: '/jobs',
  items: '/items',
  stock: '/stock',
  invoices: '/invoices',
  reports: '/reports',
  settings: '/settings',
};

const pathToTabMap: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/customers': 'customers',
  '/vehicles': 'vehicles',
  '/jobs': 'jobs',
  '/repairs': 'jobs',
  '/items': 'items',
  '/stock': 'stock',
  '/invoices': 'invoices',
  '/reports': 'reports',
  '/settings': 'settings',
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
      if (u.id === 'usr-1' || u.email.toLowerCase() === 'owner@gmail.com' || u.email.toLowerCase() === 'apexgarage.owner@gmail.com') {
        return hydrateUserPermissions({ ...u, status: 'active', role: 'admin' });
      }
      return hydrateUserPermissions(u);
    });
  });

  // Default to null so /login is shown first when application starts unauthenticated
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (savedUser) {
      try {
        const parsed: User = JSON.parse(savedUser);
        if (parsed.id === 'usr-1' || parsed.email?.toLowerCase() === 'owner@gmail.com' || parsed.email?.toLowerCase() === 'apexgarage.owner@gmail.com') {
          return hydrateUserPermissions({ ...parsed, status: 'active', role: 'admin' });
        }
        if (parsed && parsed.status === 'active') {
          return hydrateUserPermissions(parsed);
        }
      } catch (e) {
        console.error('Failed to parse saved current user', e);
      }
    }
    return null;
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

  // Initialize active tab from current URL pathname if authenticated
  const [activeTab, setActiveTabState] = useState<string>(() => {
    const pathname = window.location.pathname.replace(/\/$/, '') || '/';
    return pathToTabMap[pathname] || 'dashboard';
  });

  // Safe navigation helper
  const navigate = useCallback((path: string, replace = false) => {
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    const targetPath = path.replace(/\/$/, '') || '/';

    if (currentPath !== targetPath) {
      if (replace) {
        window.history.replaceState(null, '', targetPath);
      } else {
        window.history.pushState(null, '', targetPath);
      }
    }

    const matchedTab = pathToTabMap[targetPath];
    if (matchedTab) {
      setActiveTabState(matchedTab);
    }
  }, []);

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab);
    const targetPath = tabToPathMap[tab] || `/${tab}`;
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    if (currentPath !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  }, []);

  // Fetch real users from Laravel API
  const fetchUsers = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const res = await getUsers();
      if (res && res.data && Array.isArray(res.data)) {
        const mappedUsers = res.data.map(mapBackendUserToUser);
        setUsers(mappedUsers);
      }
    } catch (err) {
      console.warn('Could not fetch users list from backend API:', err);
    }
  }, []);

  // Sync routing state on mount and on popstate (browser Back/Forward)
  useEffect(() => {
    const handleRouteSync = () => {
      const currentPath = window.location.pathname.replace(/\/$/, '') || '/';

      if (!currentUser) {
        // Unauthenticated: redirect any non-login route to /login
        if (currentPath !== '/login') {
          window.history.replaceState(null, '', '/login');
        }
      } else {
        // Authenticated: redirect /login or / to /dashboard
        if (currentPath === '/login' || currentPath === '' || currentPath === '/') {
          window.history.replaceState(null, '', '/dashboard');
          setActiveTabState('dashboard');
        } else {
          const tab = pathToTabMap[currentPath];
          if (tab) {
            setActiveTabState(tab);
          }
        }
      }
    };

    // Run initial route sync
    handleRouteSync();

    window.addEventListener('popstate', handleRouteSync);
    return () => window.removeEventListener('popstate', handleRouteSync);
  }, [currentUser]);

  // Session verification on app initialization if token exists
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const res = await api.get('/api/auth/me');
          if (res.data && res.data.success && res.data.data) {
            const backendUser = res.data.data;
            const updatedUser = mapBackendUserToUser(backendUser);
            setCurrentUser(updatedUser);
            localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updatedUser));

            // Fetch latest user list if admin
            if (updatedUser.role === 'admin' || updatedUser.role === 'owner') {
              fetchUsers();
            }
          }
        } catch (err: any) {
          // If token was revoked/expired on backend (401), clear and redirect to login
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
            setCurrentUser(null);
            setLoginError('Your session has expired. Please sign in again.');
            navigate('/login', true);
          }
        }
      }
    };

    verifySession();
  }, [fetchUsers, navigate]);

  // Global handler for token expiration dispatched from axios interceptors
  useEffect(() => {
    const handleSessionExpired = () => {
      setCurrentUser(null);
      setLoginError('Your session has expired. Please sign in again.');
      navigate('/login', true);
    };

    window.addEventListener('garage-session-expired', handleSessionExpired);
    return () => window.removeEventListener('garage-session-expired', handleSessionExpired);
  }, [navigate]);

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

  const login = async (emailInput: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setLoginError(null);
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanEmail) {
      const err = 'Please enter your email address.';
      setLoginError(err);
      return { success: false, error: err };
    }

    if (!pass) {
      const err = 'Please enter your password.';
      setLoginError(err);
      return { success: false, error: err };
    }

    // 1. Post credentials to Laravel backend API: POST /api/auth/login
    try {
      const response = await api.post('/api/auth/login', {
        email: cleanEmail,
        password: pass,
      });

      if (response.data && response.data.success) {
        const token = response.data.token;
        if (token) {
          localStorage.setItem('auth_token', token);
        }

        const backendUser = response.data.data || response.data.user;
        const mappedUser = mapBackendUserToUser(backendUser);

        setCurrentUser(mappedUser);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mappedUser));
        setActiveTabState('dashboard');
        navigate('/dashboard');

        addAuditLog('User Login', 'User', mappedUser.id, `Authenticated via API as ${mappedUser.role}`, undefined, undefined, mappedUser.name);

        // Load users from backend if admin
        if (mappedUser.role === 'admin' || mappedUser.role === 'owner') {
          fetchUsers();
        }

        return { success: true };
      }
    } catch (apiError: any) {
      // Handle 401, 403, 422, or server errors from Laravel backend
      if (apiError.response && apiError.response.data) {
        const errorData = apiError.response.data;
        let errorMessage = errorData.message;

        if (errorData.errors && typeof errorData.errors === 'object') {
          const firstKey = Object.keys(errorData.errors)[0];
          if (firstKey && Array.isArray(errorData.errors[firstKey])) {
            errorMessage = errorData.errors[firstKey][0];
          }
        }

        if (apiError.response.status === 422 || apiError.response.status === 401) {
          const finalMsg = errorMessage || 'Invalid email or password.';
          setLoginError(finalMsg);
          return { success: false, error: finalMsg };
        }

        if (apiError.response.status === 403) {
          const finalMsg = errorMessage || 'This account is currently inactive. Please contact the administrator.';
          setLoginError(finalMsg);
          return { success: false, error: finalMsg };
        }

        const finalMsg = errorMessage || 'Invalid email or password.';
        setLoginError(finalMsg);
        return { success: false, error: finalMsg };
      }

      // If backend network error / unavailable:
      const networkMsg = 'Unable to connect to the server. Please try again.';
      setLoginError(networkMsg);
      return { success: false, error: networkMsg };
    }

    const genericErr = 'Invalid email or password.';
    setLoginError(genericErr);
    return { success: false, error: genericErr };
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog('User Logout', 'User', currentUser.id, 'Logged out of garage portal');
    }

    // Gracefully notify Laravel backend if token exists
    try {
      api.post('/api/auth/logout').catch(() => {});
    } catch (_) {}

    localStorage.removeItem('auth_token');
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    setCurrentUser(null);
    setLoginError(null);
    setActiveTabState('dashboard');
    navigate('/login', true);
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
      setActiveTabState('dashboard');
      navigate('/dashboard');
      addAuditLog('Role Switch', 'User', hydratedUser.id, `Switched context to ${role} role`, undefined, undefined, hydratedUser.name);
    }
  };

  const addUser = async (userData: Omit<User, 'id' | 'createdAt'>): Promise<{ success: boolean; error?: string; user?: User }> => {
    const email = userData.email?.trim().toLowerCase();
    const password = userData.password?.trim() ?? '';

    if (!email) {
      return { success: false, error: 'Email address is required.' };
    }

    if (!password) {
      return { success: false, error: 'Initial password is required.' };
    }

    if (!passwordMeetsRequirements(password)) {
      return {
        success: false,
        error: 'Initial password must be at least 6 characters.',
      };
    }

    const roleId = ROLE_TO_ID_MAP[userData.role] || 2;

    try {
      const response = await createUserApi({
        name: userData.name?.trim(),
        email: email,
        password: password,
        role_id: roleId,
        phone: userData.phone?.trim() || null,
        telegram_handle: userData.telegramHandle?.trim() || null,
        department: userData.department?.trim() || null,
        status: userData.status || 'active',
      });

      if (response && (response.success || response.data)) {
        const createdLaravelUser = response.data;
        const mappedUser = mapBackendUserToUser(createdLaravelUser);
        setUsers((prev) => [mappedUser, ...prev.filter((u) => u.id !== mappedUser.id)]);

        if (currentUser) {
          addAuditLog('Create User', 'User', mappedUser.id, `Created user account for ${mappedUser.name} (${mappedUser.role})`);
        }

        return { success: true, user: mappedUser };
      }
      return { success: false, error: response?.message || 'Failed to create user account.' };
    } catch (err: any) {
      let errorMessage = 'Failed to create user account.';
      if (err.response?.data) {
        const data = err.response.data;
        if (data.errors && typeof data.errors === 'object') {
          const firstKey = Object.keys(data.errors)[0];
          if (firstKey && Array.isArray(data.errors[firstKey])) {
            errorMessage = data.errors[firstKey][0];
          }
        } else if (data.message) {
          errorMessage = data.message;
        }
      }
      return { success: false, error: errorMessage };
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      const payload: Record<string, any> = {};
      if (updates.name !== undefined) payload.name = updates.name.trim();
      if (updates.email !== undefined) payload.email = updates.email.trim().toLowerCase();
      if (updates.role !== undefined) payload.role_id = ROLE_TO_ID_MAP[updates.role] || 2;
      if (updates.phone !== undefined) payload.phone = updates.phone.trim();
      if (updates.telegramHandle !== undefined) payload.telegram_handle = updates.telegramHandle.trim();
      if (updates.department !== undefined) payload.department = updates.department.trim();
      if (updates.status !== undefined) payload.status = updates.status;

      const response = await updateUserApi(userId, payload);
      if (response && (response.success || response.data)) {
        const updated = mapBackendUserToUser(response.data);
        setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
        if (currentUser && currentUser.id === userId) {
          setCurrentUser(updated);
        }
        addAuditLog('Update User', 'User', userId, `Updated user profile attributes for ID: ${userId}`);
        return { success: true };
      }
      return { success: false, error: response?.message || 'Failed to update user account.' };
    } catch (err: any) {
      let errorMessage = 'Failed to update user account.';
      if (err.response?.data) {
        const data = err.response.data;
        if (data.errors && typeof data.errors === 'object') {
          const firstKey = Object.keys(data.errors)[0];
          if (firstKey && Array.isArray(data.errors[firstKey])) {
            errorMessage = data.errors[firstKey][0];
          }
        } else if (data.message) {
          errorMessage = data.message;
        }
      }
      return { success: false, error: errorMessage };
    }
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    if (userId === 'usr-1' && newRole !== 'admin') {
      return;
    }
    updateUser(userId, { role: newRole });
  };

  const updateUserStatus = async (userId: string, newStatus: UserStatus): Promise<{ success: boolean; error?: string }> => {
    const targetUser = users.find((u) => u.id === userId);

    // Safeguard: Prevent self-deactivation or deactivation of primary Garage Owner
    const isSelf = currentUser?.id === userId;
    const isPrimaryOwner = userId === 'usr-1' || targetUser?.email.toLowerCase() === 'owner@gmail.com' || targetUser?.email.toLowerCase() === 'apexgarage.owner@gmail.com';

    if ((isSelf || isPrimaryOwner) && newStatus !== 'active') {
      if (currentUser) {
        addAuditLog(
          'Security Prevention',
          'User',
          userId,
          `Blocked attempt to deactivate active administrator session for ${targetUser?.name || userId}.`
        );
      }
      return { success: false, error: 'Cannot deactivate primary administrator account.' };
    }

    try {
      const response = await updateUserStatusApi(userId, newStatus);
      if (response && (response.success || response.data)) {
        const updated = mapBackendUserToUser(response.data);
        setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
        if (currentUser && currentUser.id === userId) {
          setCurrentUser(updated);
        }
        addAuditLog('Status Change', 'User', userId, `Changed user status to ${newStatus}`);
        return { success: true };
      }
      return { success: false, error: response?.message || 'Failed to update user status.' };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to update user status.';
      return { success: false, error: errorMsg };
    }
  };

  const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (userId === 'usr-1') return { success: false, error: 'Cannot delete primary administrator account.' };

    try {
      const response = await deleteUserApi(userId);
      if (response && response.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        addAuditLog('Delete User', 'User', userId, `Deleted user account ID: ${userId}`);
        return { success: true };
      }
      return { success: false, error: response?.message || 'Failed to delete user account.' };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to delete user account.';
      return { success: false, error: errorMsg };
    }
  };

  const updateProfile = (userId: string, updates: Partial<User>) => {
    updateUser(userId, updates);
  };

  const changeOwnPassword = (currentPass: string, newPass: string, confirmPass: string): { success: boolean; error?: string } => {
    if (!currentUser) return { success: false, error: 'No active session.' };
    if (!passwordMeetsRequirements(newPass)) {
      return { success: false, error: 'New password must be at least 6 characters.' };
    }
    if (newPass !== confirmPass) {
      return { success: false, error: 'New passwords do not match.' };
    }

    const updated = { ...currentUser, password: newPass };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    addAuditLog('Password Changed', 'User', currentUser.id, 'User updated their personal account password');
    return { success: true };
  };

  const adminResetUserPassword = async (targetUserId: string, newPass: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'owner')) {
      return { success: false, error: 'Only Garage Owner/Admin can reset user passwords.' };
    }

    const targetUser = users.find((u) => u.id === targetUserId);
    if (!targetUser) {
      return { success: false, error: 'User not found.' };
    }

    if (!passwordMeetsRequirements(newPass)) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    try {
      const response = await resetUserPasswordApi(targetUserId, newPass, newPass);
      if (response && response.success) {
        addAuditLog('Admin Password Reset', 'User', targetUserId, `Administrator reset password for user ${targetUserId}`);
        return { success: true };
      }
      return { success: false, error: response?.message || 'Failed to reset password.' };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to reset password.';
      return { success: false, error: errorMsg };
    }
  };

  const clearLoginError = () => setLoginError(null);

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
        fetchUsers,
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
        navigate,
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
