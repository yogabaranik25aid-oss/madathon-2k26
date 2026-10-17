import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, ActiveTimeSession, NotificationItem, WorkSession } from '../../types';
import { api } from '../services/api';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  setCurrentUser: (user: User) => void;
  authToken: string | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; role?: string; redirect_to?: string; error?: string }>;
  logout: () => Promise<void>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedBugId: string | null;
  setSelectedBugId: (id: string | null) => void;
  employeeSubTab: 'assigned' | 'projects' | 'submissions' | 'rework' | 'history';
  setEmployeeSubTab: (tab: 'assigned' | 'projects' | 'submissions' | 'rework' | 'history') => void;
  openReworkBug: (bugId: string) => void;
  navigateToBug: (id: string) => void;
  navigateBackToBugs: () => void;
  pendingReviewsCount: number;
  refreshReviewCount: () => Promise<void>;
  activeTimerSession: ActiveTimeSession | null;
  refreshActiveTimerSession: () => Promise<ActiveTimeSession | null>;
  activeSession: (WorkSession & { elapsed_seconds: number }) | null;
  refreshActiveSession: () => Promise<void>;
  startActiveTimer: (bugId: string, desc?: string) => Promise<ActiveTimeSession>;
  pauseActiveTimer: () => Promise<ActiveTimeSession>;
  resumeActiveTimer: () => Promise<ActiveTimeSession>;
  stopActiveTimer: (desc?: string) => Promise<{ timeEntry: any; session: ActiveTimeSession; reworkCost: number }>;
  cancelActiveTimer: () => Promise<boolean>;
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('reworkguard_token') : null;
  });
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [activeTimerSession, setActiveTimerSession] = useState<ActiveTimeSession | null>(null);
  const [activeSession, setActiveSession] = useState<(WorkSession & { elapsed_seconds: number }) | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const getInitialTab = (): string => {
    if (typeof window === 'undefined') return 'login';
    const path = window.location.pathname.replace(/^\//, '');
    if (!path || path === 'login') return 'login';
    if (path.startsWith('employee/')) return path;
    if (path.includes('manager/reviews')) return 'manager/reviews';
    if (path.includes('manager/payroll') || path === 'payroll') return 'manager/payroll';
    if (path.includes('modules')) return 'modules';
    if (path.includes('bugs')) return 'bugs';
    if (path.includes('dashboard')) return 'dashboard';
    return 'login';
  };

  const [activeTab, setActiveTabState] = useState<string>(getInitialTab);
  const [selectedBugId, setSelectedBugId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname.replace(/^\//, '');
    if (path.startsWith('bugs/')) {
      const parts = path.split('/');
      return parts[1] || null;
    }
    return null;
  });
  const [pendingReviewsCount, setPendingReviewsCount] = useState<number>(2);
  const [employeeSubTab, setEmployeeSubTab] = useState<'assigned' | 'projects' | 'submissions' | 'rework' | 'history'>('assigned');

  // Sync with browser URL
  const setActiveTab = (tab: string) => {
    setSelectedBugId(null);
    setActiveTabState(tab);
    window.history.pushState(null, '', `/${tab}`);
  };

  const openReworkBug = (bugId: string) => {
    setSelectedBugId(bugId);
    setEmployeeSubTab('rework');
    setActiveTabState('employee/dashboard');
    window.history.pushState(null, '', `/employee/dashboard#rework`);
  };

  const navigateToBug = (id: string) => {
    setSelectedBugId(id);
    if (currentUser?.role === 'manager' || currentUser?.role === 'admin') {
      setActiveTabState('bugs');
      window.history.pushState(null, '', `/bugs/${id}`);
    } else {
      setEmployeeSubTab('rework');
      setActiveTabState('employee/dashboard');
      window.history.pushState(null, '', `/employee/dashboard#rework`);
    }
  };

  const navigateBackToBugs = () => {
    setSelectedBugId(null);
    setActiveTabState('bugs');
    window.history.pushState(null, '', '/bugs');
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\//, '');
      const isClient = currentUser?.role === 'client';
      const isManager = currentUser?.role === 'manager' || currentUser?.role === 'admin';
      const isHr = currentUser?.role === 'hr';
      const canAccessManagement = isManager || isHr;

      if (!path || path === 'login') {
        if (!currentUser) {
          setActiveTabState('login');
          window.history.replaceState(null, '', '/login');
        } else {
          const target = isClient ? 'client-dashboard' : isHr ? 'manager/payroll' : isManager ? 'dashboard' : 'employee/dashboard';
          setActiveTab(target);
        }
        setSelectedBugId(null);
      } else if (path === 'client-dashboard') {
        setActiveTabState('client-dashboard');
        setSelectedBugId(null);
      } else if (path.startsWith('employee/')) {
        setActiveTabState(path);
        setSelectedBugId(null);
      } else if (path.includes('manager/reviews')) {
        if (!canAccessManagement && currentUser) {
          setActiveTab('employee/dashboard');
        } else {
          setActiveTabState('manager/reviews');
          setSelectedBugId(null);
        }
      } else if (path.includes('manager/payroll') || path === 'payroll') {
        if (!canAccessManagement && currentUser) {
          setActiveTab('employee/dashboard');
        } else {
          setActiveTabState('manager/payroll');
          setSelectedBugId(null);
        }
      } else if (path.includes('modules')) {
        if (!canAccessManagement && currentUser) {
          setActiveTab('employee/dashboard');
        } else {
          setActiveTabState('modules');
          setSelectedBugId(null);
        }
      } else if (path.startsWith('bugs/')) {
        if (!canAccessManagement && currentUser) {
          setActiveTab('employee/dashboard');
        } else {
          setActiveTabState('bugs');
          const parts = path.split('/');
          setSelectedBugId(parts[1] || null);
        }
      } else if (path.includes('bugs')) {
        if (!canAccessManagement && currentUser) {
          setActiveTab('employee/dashboard');
        } else {
          setActiveTabState('bugs');
          setSelectedBugId(null);
        }
      } else {
        if (!canAccessManagement && currentUser) {
          setActiveTab('employee/dashboard');
        } else {
          setActiveTabState(isHr ? 'manager/payroll' : 'dashboard');
          setSelectedBugId(null);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser]);

  const refreshNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      const list = await api.getNotifications();
      setNotifications(list);
    } catch {
      // ignore
    }
  }, [currentUser]);

  const markNotificationRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {
      // ignore
    }
  };

  const refreshReviewCount = async () => {
    if (!currentUser || (currentUser.role !== 'manager' && currentUser.role !== 'admin')) {
      return;
    }
    try {
      const reviews = await api.getReviews();
      const pending = reviews.filter(r => r.status === 'pending').length;
      setPendingReviewsCount(pending);
    } catch {
      // fallback
    }
  };

  const refreshActiveTimerSession = useCallback(async (): Promise<ActiveTimeSession | null> => {
    if (!currentUser) return null;
    try {
      const session = await api.getActiveTimeSession();
      setActiveTimerSession(session);
      return session;
    } catch {
      setActiveTimerSession(null);
      return null;
    }
  }, [currentUser]);

  const refreshActiveSession = useCallback(async (): Promise<void> => {
    try {
      const session = await api.getActiveWorkSession();
      setActiveSession(session);
    } catch {
      setActiveSession(null);
    }
  }, []);

  // Login handler
  const login = async (identifier: string, password?: string): Promise<{ success: boolean; role?: string; redirect_to?: string; error?: string }> => {
    try {
      const res = await api.login({ identifier, password });
      setAuthToken(res.token);
      setCurrentUser(res.user);
      const isClient = res.user.role === 'client';
      const isManager = res.user.role === 'manager' || res.user.role === 'admin';
      const isHr = res.user.role === 'hr';
      const target = isClient ? 'client-dashboard' : isHr ? 'manager/payroll' : isManager ? 'dashboard' : 'employee/dashboard';
      setActiveTab(target);
      return { success: true, role: res.role, redirect_to: target };
    } catch (err: any) {
      return { success: false, error: err.message || 'Authentication failed' };
    }
  };

  // Logout handler
  const logout = async (): Promise<void> => {
    try {
      await api.logout();
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      setAuthToken(null);
      setCurrentUser(null);
      setActiveTimerSession(null);
      setActiveSession(null);
      setActiveTab('login');
    }
  };

  // Timer actions
  const startActiveTimer = async (bugId: string, desc?: string): Promise<ActiveTimeSession> => {
    const session = await api.startActiveTimeSession({ bug_id: bugId, work_description: desc });
    setActiveTimerSession(session);
    return session;
  };

  const pauseActiveTimer = async (): Promise<ActiveTimeSession> => {
    const session = await api.pauseActiveTimeSession();
    setActiveTimerSession(session);
    return session;
  };

  const resumeActiveTimer = async (): Promise<ActiveTimeSession> => {
    const session = await api.resumeActiveTimeSession();
    setActiveTimerSession(session);
    return session;
  };

  const stopActiveTimer = async (desc?: string) => {
    const res = await api.stopActiveTimeSession({ work_description: desc });
    setActiveTimerSession(null);
    return res;
  };

  const cancelActiveTimer = async (): Promise<boolean> => {
    const res = await api.cancelActiveTimeSession();
    setActiveTimerSession(null);
    return res.cancelled;
  };

  // Initialize users and session on mount only
  useEffect(() => {
    const initialize = async () => {
      try {
        const userList = await api.getUsers();
        setUsers(userList);

        // Check if token exists in localStorage
        const storedToken = localStorage.getItem('reworkguard_token');
        if (storedToken) {
          try {
            const me = await api.getCurrentUser();
            setCurrentUser(me);
            const isClient = me.role === 'client';
            const isManager = me.role === 'manager' || me.role === 'admin';
            const isHr = me.role === 'hr';
            const currentPath = window.location.pathname.replace(/^\//, '');

            if (!currentPath || currentPath === 'login') {
              const target = isClient ? 'client-dashboard' : isHr ? 'manager/payroll' : isManager ? 'dashboard' : 'employee/dashboard';
              setActiveTab(target);
            } else if (!isManager && !isHr && !isClient && !currentPath.startsWith('employee/')) {
              setActiveTab('employee/dashboard');
            } else {
              setActiveTabState(currentPath);
            }
          } catch {
            // Token expired or invalid
            localStorage.removeItem('reworkguard_token');
            setAuthToken(null);
            setCurrentUser(null);
            setActiveTab('login');
          }
        } else {
          const currentPath = window.location.pathname.replace(/^\//, '');
          if (!currentPath || currentPath !== 'login') {
            setActiveTab('login');
          } else {
            setActiveTabState('login');
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    initialize();
  }, []);

  // Poll active session & notifications when user is logged in
  useEffect(() => {
    if (!currentUser) return;
    refreshActiveTimerSession();
    refreshActiveSession();
    refreshNotifications();
    if (currentUser.role === 'manager' || currentUser.role === 'admin') {
      refreshReviewCount();
    }
    const interval = setInterval(() => {
      refreshActiveTimerSession();
      refreshActiveSession();
      refreshNotifications();
      if (currentUser.role === 'manager' || currentUser.role === 'admin') {
        refreshReviewCount();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);


  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        setCurrentUser,
        authToken,
        isAuthenticated: !!currentUser && !!authToken,
        isLoadingAuth,
        login,
        logout,
        activeTab,
        setActiveTab,
        selectedBugId,
        setSelectedBugId,
        employeeSubTab,
        setEmployeeSubTab,
        openReworkBug,
        navigateToBug,
        navigateBackToBugs,
        pendingReviewsCount,
        refreshReviewCount,
        activeTimerSession,
        refreshActiveTimerSession,
        activeSession,
        refreshActiveSession,
        startActiveTimer,
        pauseActiveTimer,
        resumeActiveTimer,
        stopActiveTimer,
        cancelActiveTimer,
        notifications,
        unreadNotificationsCount,
        refreshNotifications,
        markNotificationRead,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
