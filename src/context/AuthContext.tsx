import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, UserStatus, AuditLog, RolePermissionsMap, ModulePermissionId } from '../types';
import { INITIAL_USERS } from '../data/mockUsers';
import { DEFAULT_ROLE_PERMISSIONS, INITIAL_AUDIT_LOGS } from '../data/mockData';
import api from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  auditLogs: AuditLog[];
  loginError: string | null;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
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
  return /[A-Za-z]/.test(value) && /\d/.test(value);
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
      if (u.id === 'usr-1' || u.email.toLowerCase() === 'owner@apexgarage.com') {
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
        if (parsed.id === 'usr-1' || parsed.email?.toLowerCase() === 'owner@apexgarage.com') {
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
      if (token && currentUser) {
        try {
          const res = await api.get('/api/auth/me');
          if (res.data && res.data.success && res.data.data) {
            const backendUser = res.data.data;
            const updatedUser: User = hydrateUserPermissions({
              id: backendUser.id ? String(backendUser.id) : currentUser.id,
              name: backendUser.name || currentUser.name,
              email: backendUser.email || currentUser.email,
              role: (backendUser.role?.slug || backendUser.role || currentUser.role) as UserRole,
              status: (backendUser.status || currentUser.status) as UserStatus,
              phone: backendUser.phone || currentUser.phone || '+1 (555) 019-2834',
              avatarUrl: backendUser.avatar_url || currentUser.avatarUrl,
              lastLoginAt: currentUser.lastLoginAt || new Date().toISOString(),
              createdAt: backendUser.created_at || currentUser.createdAt,
            });
            setCurrentUser(updatedUser);
            localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updatedUser));
          }
        } catch (err: any) {
          // If token was revoked/expired on backend (401), clear and redirect to login
          if (err.response && err.response.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
            setCurrentUser(null);
            navigate('/login', true);
          }
        }
      }
    };

    verifySession();
  }, []);

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

    if (!cleanEmail || !pass) {
      const err = 'Please enter both email and password.';
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

        const backendUser = response.data.data;
        const mappedUser: User = hydrateUserPermissions({
          id: backendUser.id ? String(backendUser.id) : `usr-${Date.now()}`,
          name: backendUser.name || backendUser.full_name || 'User',
          email: backendUser.email || cleanEmail,
          password: pass,
          role: (backendUser.role?.slug || backendUser.role || 'admin') as UserRole,
          status: (backendUser.status || 'active') as UserStatus,
          phone: backendUser.phone || backendUser.phone_number || '+1 (555) 019-2834',
          avatarUrl: backendUser.avatar_url,
          lastLoginAt: new Date().toISOString(),
          createdAt: backendUser.created_at || new Date().toISOString(),
        });

        setCurrentUser(mappedUser);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mappedUser));
        setActiveTabState('dashboard');
        navigate('/dashboard');

        addAuditLog('User Login', 'User', mappedUser.id, `Authenticated via API as ${mappedUser.role}`, undefined, undefined, mappedUser.name);
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

        const finalMsg = errorMessage || 'Invalid email address or password.';
        setLoginError(finalMsg);
        return { success: false, error: finalMsg };
      }

      // If backend network error / unavailable:
      // Check local user database fallback for offline demo development
      const foundUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (foundUser) {
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
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updatedUser));
        setActiveTabState('dashboard');
        navigate('/dashboard');
        addAuditLog('User Login', 'User', updatedUser.id, `Logged in locally as ${updatedUser.role}`, undefined, undefined, updatedUser.name);
        return { success: true };
      }

      const networkMsg = 'Unable to connect to garage authentication server. Please check that backend server is running.';
      setLoginError(networkMsg);
      return { success: false, error: networkMsg };
    }

    const genericErr = 'Invalid email address or password. Please check your credentials.';
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

    const newUser: User = hydrateUserPermissions({
      ...userData,
      email,
      password,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: userData.status || 'active',
      phone: userData.phone || '+1 (555) 019-2834',
    });

    setUsers((prev) => [newUser, ...prev]);

    if (currentUser) {
      addAuditLog(currentUser.id, currentUser.name, 'CREATE_USER', `Created user account for ${newUser.name} (${newUser.role})`);
    }

    return { success: true };
  };

  const updateUser = (userId: string, updates: Partial<User>): { success: boolean; error?: string } => {
    if (updates.email) {
      const emailTaken = users.some(
        (u) => u.id !== userId && u.email.toLowerCase() === updates.email!.toLowerCase()
      );
      if (emailTaken) {
        return { success: false, error: 'That email address is already in use by another user profile.' };
      }
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = hydrateUserPermissions({ ...u, ...updates });
          if (currentUser && currentUser.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );

    addAuditLog('Update User', 'User', userId, `Updated user profile attributes for ID: ${userId}`);
    return { success: true };
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    if (userId === 'usr-1' && newRole !== 'admin') {
      return;
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? hydrateUserPermissions({ ...u, role: newRole }) : hydrateUserPermissions(u)))
    );
    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) => (prev ? hydrateUserPermissions({ ...prev, role: newRole }) : null));
    }
    if (currentUser) {
      addAuditLog(currentUser.id, currentUser.name, 'UPDATE_USER_ROLE', `Updated role for user ${userId} to ${newRole}`);
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
          currentUser.id,
          currentUser.name,
          'SECURITY_PREVENTION',
          `Blocked attempt to deactivate active administrator session for ${targetUser?.name || userId}.`
        );
      }
      return;
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, status: newStatus };
          if (currentUser && currentUser.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
    addAuditLog('Status Change', 'User', userId, `Changed user status to ${newStatus}`);
  };

  const deleteUser = (userId: string) => {
    if (userId === 'usr-1') return;
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    addAuditLog('Delete User', 'User', userId, `Deleted user account ID: ${userId}`);
  };

  const updateProfile = (userId: string, updates: Partial<User>) => {
    updateUser(userId, updates);
  };

  const changeOwnPassword = (currentPass: string, newPass: string, confirmPass: string): { success: boolean; error?: string } => {
    if (!currentUser) return { success: false, error: 'No active session.' };
    if (currentUser.password !== currentPass) {
      return { success: false, error: 'Current password does not match our records.' };
    }
    if (!passwordMeetsRequirements(newPass)) {
      return { success: false, error: 'New password must be at least 6 characters and include both letters and numbers.' };
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
    addAuditLog('Admin Password Reset', 'User', targetUserId, `Administrator reset password for user ${targetUserId}`);
    return { success: true };
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
