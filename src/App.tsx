import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ToastProvider } from './components/common/Toast';
import { Layout } from './components/layout/Layout';
import { EmployeeLayout } from './components/layout/EmployeeLayout';

// Manager Pages
import { DashboardPage } from './pages/DashboardPage';
import { ModulesPage } from './pages/ModulesPage';
import { BugsPage } from './pages/BugsPage';
import { ManagerReviewsPage } from './pages/ManagerReviewsPage';
import { PayrollFinancePage } from './pages/PayrollFinancePage';

// Shared Login Page
import { LoginPage } from './pages/LoginPage';

// Client Portal Page
import { ClientDashboardPage } from './pages/ClientDashboardPage';

// Employee Portal Pages
import { EmployeeWorkspacePage } from './pages/EmployeeWorkspacePage';
import { EmployeeDashboardPage } from './pages/employee/EmployeeDashboardPage';
import { EmployeeModulesPage } from './pages/employee/EmployeeModulesPage';
import { EmployeeReworkPage } from './pages/employee/EmployeeReworkPage';
import { EmployeeWorkStatusPage } from './pages/employee/EmployeeWorkStatusPage';
import { EmployeePayrollPage } from './pages/employee/EmployeePayrollPage';

import { ShieldAlert, ArrowLeft } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, currentUser, isAuthenticated, setActiveTab } = useApp();

  // If user is unauthenticated or on login route, show Login Page
  if (!isAuthenticated || activeTab === 'login') {
    return <LoginPage />;
  }

  // Client Portal: Authorized Client Stakeholder view
  if (currentUser?.role === 'client' || activeTab === 'client-dashboard') {
    return <ClientDashboardPage />;
  }

  const isAuthorizedManagementOrHr = currentUser?.role === 'manager' || currentUser?.role === 'admin' || currentUser?.role === 'hr';
  const isEmployeeTab = activeTab.startsWith('employee/') || activeTab === 'my-work';

  // Role-Based Access Control: Block employees from all manager & finance pages
  if (!isAuthorizedManagementOrHr && !isEmployeeTab) {
    return (
      <EmployeeLayout>
        <div className="max-w-md mx-auto my-12 bg-white p-6 rounded-xl border border-zinc-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-950">Manager Authorization Required</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Account <strong>{currentUser?.name}</strong> has role <strong>{currentUser?.role?.toUpperCase()}</strong>. Only authorized Managers or Administrators can access the Executive Dashboard, Software Modules, Bug Accountability, Manager Reviews, and Finance Previews.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('employee/dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-950 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Employee Workspace</span>
          </button>
        </div>
      </EmployeeLayout>
    );
  }

  // Render Employee Portal
  if (isEmployeeTab) {
    const renderEmployeePage = () => {
      switch (activeTab) {
        case 'employee/dashboard':
        case 'my-work':
          return <EmployeeWorkspacePage />;
        case 'employee/modules':
          return <EmployeeModulesPage />;
        case 'employee/rework':
          return <EmployeeReworkPage />;
        case 'employee/status':
          return <EmployeeWorkStatusPage />;
        case 'employee/payroll':
          return <EmployeePayrollPage />;
        default:
          return <EmployeeWorkspacePage />;
      }
    };

    return <EmployeeLayout>{renderEmployeePage()}</EmployeeLayout>;
  }

  // Render Manager Portal
  const renderManagerPage = () => {
    switch (activeTab) {
      case 'dashboard':
      case 'manager/dashboard':
        return <DashboardPage />;
      case 'modules':
      case 'manager/modules':
        return <ModulesPage />;
      case 'bugs':
      case 'manager/bugs':
        return <BugsPage />;
      case 'reviews':
      case 'manager/reviews':
        return <ManagerReviewsPage />;
      case 'payroll':
      case 'manager/payroll':
        return <PayrollFinancePage />;
      default:
        return <DashboardPage />;
    }
  };

  return <Layout>{renderManagerPage()}</Layout>;
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ToastProvider>
  );
};

export default App;
