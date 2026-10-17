import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Layers, 
  Bug, 
  ShieldCheck, 
  Clock, 
  DollarSign, 
  ChevronRight, 
  UserCircle2, 
  CheckCircle,
  Menu,
  X,
  LogOut,
  Receipt
} from 'lucide-react';
import { NotificationBell } from '../common/NotificationBell';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { 
    currentUser, 
    users, 
    setCurrentUser, 
    logout,
    activeTab, 
    setActiveTab, 
    pendingReviewsCount 
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'KPIs & Rework Metrics',
    },
    {
      id: 'modules',
      label: 'Software Modules',
      icon: Layers,
      description: 'Defect Density & Codebase',
    },
    {
      id: 'bugs',
      label: 'Bugs & Accountability',
      icon: Bug,
      description: 'Corrective Hours & Costs',
    },
    {
      id: 'manager/reviews',
      label: 'Manager Reviews',
      icon: ShieldCheck,
      description: 'Sign-offs & Cost Approval',
      badge: pendingReviewsCount > 0 ? pendingReviewsCount : undefined,
    },
    {
      id: 'manager/payroll',
      label: 'Payroll & Finance',
      icon: Receipt,
      description: 'Audit & Wage Safeguards',
    },
  ];

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Executive Dashboard & Quality Overview';
      case 'modules':
        return 'Software Modules & Defect Density';
      case 'bugs':
        return 'Bug Tracking & Corrective Rework Hours';
      case 'manager/reviews':
        return 'Manager Accountability & Rework Sign-offs';
      case 'manager/payroll':
        return 'Monthly Payroll Adjustments & Finance Review';
      default:
        return 'ReworkGuard';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row text-zinc-950 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-zinc-200 flex flex-col md:min-h-screen">
        {/* App Brand Header */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-950 text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-zinc-950 leading-none">
                ReworkGuard
              </h1>
              <p className="text-[11px] font-medium text-zinc-500 mt-1 uppercase tracking-wider">
                Cost & Accountability
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
          <div className="px-3 py-2 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Main Navigation
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
                {item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold transition-colors ${
                      isActive
                        ? 'bg-red-500 text-white'
                        : 'bg-red-100 text-red-700 group-hover:bg-red-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick Rework Formula Callout */}
          <div className="pt-6 px-3">
            <div className="bg-zinc-50 rounded-lg p-3.5 border border-zinc-200 text-xs space-y-2">
              <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-zinc-700" />
                Rework Formula
              </div>
              <p className="text-zinc-600 leading-relaxed text-[11px]">
                <code className="bg-zinc-200/70 px-1 py-0.5 rounded font-mono text-zinc-900 font-medium">
                  Cost = Hours × Rate
                </code>
                <br />
                Reported for accountability & retrospectives (no salary deduction).
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
                <div className="w-8 h-8 rounded-full bg-zinc-950 text-white flex items-center justify-center text-xs font-bold">
                  {currentUser?.name?.charAt(0) || 'M'}
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
                {activeTab.replace('/', ' / ')}
              </span>
            </div>
            <h2 className="text-lg font-bold text-zinc-950">{getPageTitle()}</h2>
          </div>

          {/* Right Header Status Badges */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-full text-zinc-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium text-zinc-900">Demo Mode: Local Environment</span>
            </div>

            <div className="flex items-center gap-2 text-xs bg-zinc-100 text-zinc-800 px-3 py-1.5 rounded-md font-medium">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>Corrective Tracking Active</span>
            </div>

            <NotificationBell />
          </div>
        </header>

        {/* Page Content View */}
        <main className="p-6 flex-1 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
