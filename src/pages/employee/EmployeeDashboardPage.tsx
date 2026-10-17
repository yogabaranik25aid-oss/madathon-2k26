import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { EmployeeDashboardData } from '../../../types';
import { 
  Briefcase, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Layers, 
  ArrowUpRight, 
  Calendar, 
  RefreshCw,
  Timer,
  ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

export const EmployeeDashboardPage: React.FC = () => {
  const { currentUser, setActiveTab } = useApp();
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | '7days' | '30days'>('7days');
  const [dashboardData, setDashboardData] = useState<EmployeeDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async (range: typeof dateRange) => {
    try {
      setRefreshing(true);
      setError(null);
      const data = await api.getEmployeeDashboard(range);
      setDashboardData(data);
    } catch (err: any) {
      console.error('Failed to load employee dashboard:', err);
      setError(err.message || 'Failed to fetch personal dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(dateRange);
  }, [dateRange]);

  const dateFilterOptions = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: '7days', label: 'Last 7 Days' },
    { id: '30days', label: 'Last 30 Days' },
  ] as const;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-zinc-200 rounded-lg w-1/3"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-white border border-zinc-200 rounded-xl p-4"></div>
          ))}
        </div>
        <div className="h-64 bg-white border border-zinc-200 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-zinc-950 flex items-center gap-2">
            <span>Welcome, {currentUser?.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 uppercase">
              {currentUser?.role}
            </span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Snapshot of your assigned software modules, active rework hours, and review progression.
          </p>
        </div>

        {/* Date Filter Chips & Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-zinc-100 p-1 rounded-lg border border-zinc-200">
            {dateFilterOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setDateRange(opt.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  dateRange === opt.id
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchDashboardData(dateRange)}
            disabled={refreshing}
            className="p-2 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200 cursor-pointer"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 6 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Assigned Modules */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Assigned Modules
            </span>
            <Layers className="w-4 h-4 text-zinc-700" />
          </div>
          <p className="text-2xl font-bold text-zinc-950">
            {dashboardData?.assigned_modules_count ?? 0}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">Active codebases</p>
        </div>

        {/* 2. New Assignments */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">
              New Tasks
            </span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-700">
            {dashboardData?.new_assignments_count ?? 0}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">Awaiting rework start</p>
        </div>

        {/* 3. Completed Work */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
              Completed
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">
            {dashboardData?.completed_work_count ?? 0}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">Resolved fixes</p>
        </div>

        {/* 4. Pending Reviews */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-600">
              In Review
            </span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-700">
            {dashboardData?.pending_reviews_count ?? 0}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">Awaiting sign-off</p>
        </div>

        {/* 5. Regular Work Hours */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
              Regular Hours
            </span>
            <Timer className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-zinc-950">
            {dashboardData?.regular_work_hours ?? 160}
            <span className="text-xs font-normal text-zinc-500 ml-1">hrs</span>
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">Standard monthly cycle</p>
        </div>

        {/* 6. Corrective Maintenance Hours */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
              Corrective Hours
            </span>
            <Briefcase className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-zinc-950">
            {dashboardData?.rework_hours ?? 0}
            <span className="text-xs font-normal text-zinc-500 ml-1">hrs</span>
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">Rework tracked</p>
        </div>
      </div>

      {/* Daily Work Hours Chart */}
      <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Daily Work Hours & Corrective Effort</h3>
            <p className="text-xs text-zinc-500">Hours recorded over the last 7 daily cycles</p>
          </div>
          <div className="text-xs text-zinc-500 flex items-center gap-2">
            <span className="w-3 h-3 rounded-xs bg-zinc-900 inline-block"></span>
            <span>Rework Hours Logged</span>
          </div>
        </div>

        <div className="h-60 w-full">
          {dashboardData?.daily_work_hours && dashboardData.daily_work_hours.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.daily_work_hours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  stroke="#a1a1aa" 
                  fontSize={11} 
                  tickFormatter={(val) => {
                    const parts = val.split('-');
                    return `${parts[1]}/${parts[2]}`;
                  }}
                />
                <YAxis tickLine={false} stroke="#a1a1aa" fontSize={11} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: '#f4f4f5' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-zinc-900 text-white text-xs p-2.5 rounded-lg shadow-md font-mono">
                          <p className="text-zinc-400 font-sans mb-1">{data.date}</p>
                          <p className="font-bold">{data.hours} hours logged</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="hours" fill="#18181b" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-zinc-400">
              No daily logged hours recorded in this range.
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Table & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Work Activity (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900">Recent Rework Activity</h3>
            <button
              onClick={() => setActiveTab('employee/status')}
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 flex items-center gap-1"
            >
              <span>View All Statuses</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            {dashboardData?.recent_activity && dashboardData.recent_activity.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Date</th>
                    <th className="py-2.5 px-4 font-semibold">Work Item</th>
                    <th className="py-2.5 px-4 font-semibold">Module</th>
                    <th className="py-2.5 px-4 font-semibold">Hours Logged</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {dashboardData.recent_activity.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-2.5 px-4 text-zinc-500 font-mono text-[11px] whitespace-nowrap">
                        {item.date}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-zinc-900 max-w-[200px] truncate">
                        {item.work_item_title}
                      </td>
                      <td className="py-2.5 px-4 text-zinc-600 whitespace-nowrap">
                        {item.module_name}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-zinc-900 whitespace-nowrap">
                        {item.hours_logged}h
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                          item.status === 'fixed' || item.status === 'closed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-zinc-100 text-zinc-800'
                        }`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-xs text-zinc-400">
                No corrective maintenance activity logged yet.
              </div>
            )}
          </div>
        </div>

        {/* Quick Action Navigation Cards (1 col) */}
        <div className="space-y-3.5">
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
              Quick Shortcuts
            </h4>

            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('employee/modules')}
                className="w-full text-left p-3 rounded-lg border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="text-xs font-bold text-zinc-900 group-hover:text-zinc-950">
                    My Work & Assigned Modules
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Review assigned tasks, deadlines & start work
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 transition-colors" />
              </button>

              <button
                onClick={() => setActiveTab('employee/rework')}
                className="w-full text-left p-3 rounded-lg border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="text-xs font-bold text-zinc-900 group-hover:text-zinc-950">
                    Rework & Time Tracker
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Track server-calculated hours on active defects
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 transition-colors" />
              </button>

              <button
                onClick={() => setActiveTab('employee/status')}
                className="w-full text-left p-3 rounded-lg border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-zinc-900 group-hover:text-zinc-950">
                    Work Status & Reviews
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Check manager feedback and submit revisions
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 transition-colors" />
              </button>

              <button
                onClick={() => setActiveTab('employee/payroll')}
                className="w-full text-left p-3 rounded-lg border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-zinc-900 group-hover:text-zinc-950">
                    Monthly Payroll & Safeguards
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    View itemized payslip preview and statutory protections
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 transition-colors" />
              </button>
            </div>
          </div>

          <div className="bg-zinc-950 text-white p-4 rounded-xl shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold mb-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Pro Tip: Server-Backed Timers</span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              When working on a defect, start the server timer on the Rework page. It stays synced even if you refresh or switch browsers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
