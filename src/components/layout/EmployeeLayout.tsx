import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Briefcase, 
  Timer, 
  ClipboardCheck, 
  LogOut, 
  Clock, 
  ChevronRight, 
  Menu, 
  X, 
  Play, 
  Pause, 
  CheckCircle, 
  ShieldCheck, 
  AlertCircle,
  Receipt
} from 'lucide-react';
import { NotificationBell } from '../common/NotificationBell';

interface EmployeeLayoutProps {
  children: React.ReactNode;
}

export const EmployeeLayout: React.FC<EmployeeLayoutProps> = ({ children }) => {
  const { 
    currentUser, 
    activeTab, 
    setActiveTab, 
    logout, 
    activeSession, 
    refreshActiveSession 
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [liveElapsed, setLiveElapsed] = useState<number>(0);

  // Maintain live second counter if session is active
  useEffect(() => {
    if (!activeSession) {
      setLiveElapsed(0);
      return;
    }

    setLiveElapsed(activeSession.elapsed_seconds || 0);

    if (activeSession.status === 'active') {
      const interval = setInterval(() => {
        setLiveElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeSession]);

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  interface NavItem {
    id: string;
    label: string;
    icon: any;
    description: string;
    badge?: string;
  }

  const navItems: NavItem[] = [
    {
      id: 'employee/dashboard',
      label: 'My Workspace & Tasks',
      icon: LayoutDashboard,
      description: 'IDE, Tasks & Live Sessions',
    },
    {
      id: 'employee/modules',
      label: 'My Work & Modules',
      icon: Briefcase,
      description: 'Assigned Fixes & Priorities',
    },
    {
      id: 'employee/status',
      label: 'Work Status & Reviews',
      icon: ClipboardCheck,
      description: 'Feedback & Review History',
    },
    {
      id: 'employee/payroll',
      label: 'Project Salary & Deductions',
      icon: Receipt,
      description: 'Wages & Rework Impact',
    },
  ];

  const getPageTitle = () => {
    switch (activeTab) {
      case 'employee/dashboard':
        return 'Employee Workspace & Productivity Dashboard';
      case 'employee/modules':
        return 'My Assigned Modules & Corrective Tasks';
      case 'employee/status':
        return 'Work Item Review Status & Manager Feedback';
      case 'employee/payroll':
        return 'Project Salary & Next Month Rework Deductions';
      default:
        return 'Employee Portal';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row text-zinc-950 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-zinc-200 flex flex-col md:min-h-screen">
        {/* Brand Header */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-950 text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-zinc-950 leading-none">
                ReworkGuard
              </h1>
              <p className="text-[11px] font-semibold text-blue-600 mt-1 uppercase tracking-wider">
                Employee Portal
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-500 hover:text-zinc-900"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className={`p-3 space-y-1 flex-1 ${mobileMenuOpen ? 'block' : 'hidden md:block'}`}>
          {/* If Manager is viewing employee portal, provide return button */}
          {(currentUser?.role === 'manager' || currentUser?.role === 'admin') && (
            <div className="px-1 pb-2">
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-zinc-950 text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer shadow-xs"
              >
                <span>← Return to Manager Portal</span>
              </button>
            </div>
          )}

          <div className="px-3 py-2 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-zinc-950 text-white shadow-sm font-semibold'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-950'
                    }`}
                  />
                  <div className="text-left truncate">
                    <span className="block truncate">{item.label}</span>
                  </div>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-500 text-white animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Active Work Session Widget in Sidebar if running or paused */}
          {activeSession && (
            <div className="pt-4 px-2">
              <div 
                onClick={() => setActiveTab('employee/dashboard')} 
                className={`border rounded-xl p-3 cursor-pointer transition-colors ${
                  activeSession.status === 'active' 
                    ? 'bg-emerald-50/90 border-emerald-200 hover:bg-emerald-100/70 text-emerald-950' 
                    : 'bg-amber-50/90 border-amber-200 hover:bg-amber-100/70 text-amber-950'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${activeSession.status === 'active' ? 'bg-emerald-600 animate-ping' : 'bg-amber-500'}`} />
                    {activeSession.status === 'active' ? 'IDE Active' : 'IDE Paused'}
                  </span>
                  <span className="font-mono">{formatTimer(liveElapsed)}</span>
                </div>
                <p className="text-[11px] truncate font-medium">
                  {activeSession.target_title || 'Assigned Work Item'}
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Automated Presence Tracking
                </p>
              </div>
            </div>
          )}

          {/* Helpful Transparency Callout */}
          <div className="pt-6 px-3">
            <div className="bg-zinc-50 rounded-lg p-3.5 border border-zinc-200 text-xs space-y-1.5">
              <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Fair Quality Tracking
              </div>
              <p className="text-zinc-600 leading-relaxed text-[11px]">
                Time logged is reviewed for engineering metrics and retrospectives. No salary deductions are ever applied.
              </p>
            </div>
          </div>
        </nav>

        {/* User Profile & Sign Out Footer */}
        <div className="p-4 border-t border-zinc-100 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-zinc-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-700">
                  {currentUser?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-900 truncate">{currentUser?.name}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-medium">
                  {currentUser?.role} • ₹{currentUser?.hourly_rate}/hr
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-md transition-colors border border-zinc-200 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-zinc-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-zinc-200 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
              <span>ReworkGuard</span>
              <ChevronRight className="w-3 h-3 text-zinc-400" />
              <span className="text-zinc-700 capitalize font-medium">
                {activeTab.replace('employee/', 'Employee / ')}
              </span>
            </div>
            <h2 className="text-lg font-bold text-zinc-950">{getPageTitle()}</h2>
          </div>

          {/* Right Header Controls & Live Timer Pill */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {activeSession ? (
              <button
                onClick={() => setActiveTab('employee/dashboard')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs ${
                  activeSession.status === 'paused'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${activeSession.status === 'paused' ? 'bg-amber-500' : 'bg-emerald-600'}`} />
                <span>
                  {activeSession.status === 'paused' ? 'IDE Paused:' : 'IDE Active:'}
                </span>
                <span className="font-mono text-zinc-950 bg-white px-1.5 py-0.5 rounded border border-zinc-200">
                  {formatTimer(liveElapsed)}
                </span>
              </button>
            ) : (
            <div className="hidden sm:flex items-center gap-2 text-xs bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-full text-zinc-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium text-zinc-900">Demo Mode: Local Environment</span>
            </div>
            )}

            <NotificationBell />

            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200 sm:hidden"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Content View */}
        <main className="p-6 flex-1 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
