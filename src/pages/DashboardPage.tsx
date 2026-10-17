import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { 
  DashboardSummary, 
  RootCauseDistributionItem, 
  MonthlyReworkCostItem,
  WorkSession,
  ComprehensiveReport
} from '../../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { useApp } from '../context/AppContext';
import {
  Layers,
  Bug,
  Clock,
  IndianRupee,
  RefreshCw,
  Calendar,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  ArrowUpRight,
  Info,
  Timer,
  UserCheck,
  Printer,
  X,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// Helper for Indian Rupee Formatting (₹)
export const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val || 0);
};

export const formatCompactINR = (val: number): string => {
  return '₹' + (val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

export const DashboardPage: React.FC = () => {
  const { setActiveTab } = useApp();

  // State
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [rootCauses, setRootCauses] = useState<RootCauseDistributionItem[]>([]);
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyReworkCostItem[]>([]);
  const [liveSessions, setLiveSessions] = useState<(WorkSession & { elapsed_seconds: number; user_name: string })[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());

  // Date Range Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activeDatePreset, setActiveDatePreset] = useState<'all' | '30d' | '90d' | 'month'>('all');

  // Comprehensive Quality & Compliance Report Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [comprehensiveReport, setComprehensiveReport] = useState<ComprehensiveReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const handleOpenComprehensiveReport = async () => {
    setReportModalOpen(true);
    setLoadingReport(true);
    try {
      const rep = await api.getComprehensiveReport();
      setComprehensiveReport(rep);
    } catch (err: any) {
      console.error('Failed to load comprehensive report:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const filters = {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };

    try {
      const [summaryRes, rootCausesRes, monthlyCostsRes, activeSessionsRes] = await Promise.all([
        api.getDashboardSummary(filters),
        api.getDashboardRootCauses(filters),
        api.getDashboardMonthlyCosts(),
        api.getAllActiveWorkSessions().catch(() => []),
      ]);

      setSummary(summaryRes);
      setRootCauses(rootCausesRes);
      setMonthlyCosts(monthlyCostsRes);
      setLiveSessions(activeSessionsRes);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      setError(err.message || 'Failed to fetch dashboard metrics. Please check server connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle Preset Date Range Selection
  const handlePresetChange = (preset: 'all' | '30d' | '90d' | 'month') => {
    setActiveDatePreset(preset);
    const now = new Date();

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === '30d') {
      const past = new Date();
      past.setDate(now.getDate() - 30);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === '90d') {
      const past = new Date();
      past.setDate(now.getDate() - 90);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    }
  };

  const ROOT_CAUSE_COLORS: Record<string, string> = {
    'Code Defect': '#09090b',          // Dark Zinc
    'Requirement Change': '#ea580c',   // Orange
    'External Dependency': '#2563eb',  // Blue
    'Other': '#71717a',                // Muted Slate
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Action Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-zinc-950">Executive Rework Dashboard</h2>
            <span className="text-xs bg-zinc-100 text-zinc-800 font-semibold px-2 py-0.5 rounded border border-zinc-200">
              INR (₹) Standard
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Overview of software modules, bug accountability, corrective maintenance hours and financial rework costs.
          </p>
        </div>

        {/* Date Range Controls & Refresh Button */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Quick Presets */}
          <div className="flex items-center bg-zinc-100 p-1 rounded-lg border border-zinc-200 text-xs">
            <button
              onClick={() => handlePresetChange('all')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                activeDatePreset === 'all'
                  ? 'bg-white text-zinc-950 shadow-xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => handlePresetChange('month')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                activeDatePreset === 'month'
                  ? 'bg-white text-zinc-950 shadow-xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => handlePresetChange('30d')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                activeDatePreset === '30d'
                  ? 'bg-white text-zinc-950 shadow-xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Last 30 Days
            </button>
          </div>

          {/* Date Range Picker */}
          <div className="flex items-center gap-1.5 text-xs">
            <input
              type="date"
              aria-label="Start Date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActiveDatePreset('all');
              }}
              className="border border-zinc-300 rounded px-2 py-1 text-xs text-zinc-800 bg-white focus:outline-none focus:border-zinc-950"
            />
            <span className="text-zinc-400">to</span>
            <input
              type="date"
              aria-label="End Date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActiveDatePreset('all');
              }}
              className="border border-zinc-300 rounded px-2 py-1 text-xs text-zinc-800 bg-white focus:outline-none focus:border-zinc-950"
            />
          </div>

          {/* Comprehensive Report Button */}
          <Button
            size="sm"
            variant="primary"
            onClick={handleOpenComprehensiveReport}
            leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
            className="text-xs bg-zinc-950 text-white hover:bg-zinc-800"
          >
            Audit & Compliance Report
          </Button>

          {/* Refresh Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchDashboardData(true)}
            isLoading={refreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
            className="text-xs"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Dismissible Error Alert */}
      {error && (
        <ErrorAlert
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Informational Governance Callout */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-zinc-700">
          <Info className="w-4 h-4 text-zinc-900 flex-shrink-0" />
          <span>
            <strong>Calculation Policy:</strong> Rework cost = Corrective maintenance hours × hourly cost snapshot recorded with each entry.
            Manager waivers do not erase the actual cost of engineering rework.
          </span>
        </div>
        <span className="text-[11px] text-zinc-400 whitespace-nowrap hidden sm:inline">
          Refreshed: {lastRefreshed}
        </span>
      </div>

      {/* Quick Role Navigation Bar */}
      <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-zinc-500 uppercase tracking-wider text-[11px] px-1">
          Quick Workspace Navigation:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('modules')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-950 hover:bg-zinc-50 font-medium text-zinc-800 transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-zinc-600" />
            <span>Software Modules</span>
          </button>
          <button
            onClick={() => setActiveTab('bugs')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-950 hover:bg-zinc-50 font-medium text-zinc-800 transition-colors cursor-pointer"
          >
            <Bug className="w-3.5 h-3.5 text-zinc-600" />
            <span>Bugs & Fix Hours</span>
          </button>
          <button
            onClick={() => setActiveTab('manager/reviews')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-950 hover:bg-zinc-50 font-medium text-zinc-800 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>Manager Reviews</span>
          </button>
          <button
            onClick={() => setActiveTab('manager/payroll')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-950 hover:bg-zinc-50 font-medium text-zinc-800 transition-colors cursor-pointer"
          >
            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
            <span>Finance & Payroll Preview</span>
          </button>
        </div>
      </div>

      {/* 1. FOUR SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Modules */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold uppercase tracking-wider">
              <span>Total Modules</span>
              <div className="p-2 bg-zinc-100 text-zinc-900 rounded-lg">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            {loading ? (
              <div className="h-8 w-20 bg-zinc-200 animate-pulse rounded mt-3" />
            ) : (
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 font-mono">
                  {summary?.total_modules ?? 0}
                </span>
                <span className="text-xs text-zinc-500 font-medium">active codebases</span>
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span>Core Architecture</span>
            <button
              onClick={() => setActiveTab('modules')}
              className="text-zinc-950 font-semibold hover:underline flex items-center gap-1"
            >
              View Modules <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 2: Total Bugs */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold uppercase tracking-wider">
              <span>Total Bugs</span>
              <div className="p-2 bg-zinc-100 text-zinc-900 rounded-lg">
                <Bug className="w-4 h-4" />
              </div>
            </div>
            {loading ? (
              <div className="h-8 w-20 bg-zinc-200 animate-pulse rounded mt-3" />
            ) : (
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 font-mono">
                  {summary?.total_bugs ?? 0}
                </span>
                <span className="text-xs text-zinc-500 font-medium">recorded defects</span>
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
            <span className="text-zinc-500">
              Resolved: <strong className="text-zinc-900">{summary?.resolved_bugs_count ?? 0}</strong>
            </span>
            <span className="text-zinc-500">
              Reopen Rate: <strong className="text-amber-700 font-mono font-bold">{summary?.reopen_rate ?? 0}%</strong>
            </span>
          </div>
        </div>

        {/* Card 3: Total Corrective Hours */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold uppercase tracking-wider">
              <span>Total Corrective Hours</span>
              <div className="p-2 bg-zinc-100 text-zinc-900 rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            {loading ? (
              <div className="h-8 w-24 bg-zinc-200 animate-pulse rounded mt-3" />
            ) : (
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 font-mono">
                  {summary?.total_corrective_hours ?? 0}
                </span>
                <span className="text-xs text-zinc-500 font-medium">hrs logged</span>
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span>Maintenance Effort</span>
            <button
              onClick={() => setActiveTab('bugs')}
              className="text-zinc-950 font-semibold hover:underline flex items-center gap-1"
            >
              Log Fix Hours <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 4: Total Rework Cost in INR (₹) */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold uppercase tracking-wider">
              <span>Total Rework Cost (INR)</span>
              <div className="p-2 bg-zinc-950 text-white rounded-lg">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            {loading ? (
              <div className="h-8 w-32 bg-zinc-200 animate-pulse rounded mt-3" />
            ) : (
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 font-mono">
                  {formatINR(summary?.total_rework_cost || 0)}
                </span>
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
            <span className="text-zinc-500">
              Hours × Rate Snapshot
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              Waiver: {formatINR(summary?.manager_waiver_cost || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Live Engineer Work Sessions (Automated Presence) */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-950 text-white flex items-center justify-center">
              <Timer className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-950">Active Engineer Sessions (Automated Presence)</h3>
              <p className="text-[11px] text-zinc-500">Live monitoring of engineers active in the Rework IDE or paused outside.</p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
            {liveSessions.length} Active Session{liveSessions.length !== 1 ? 's' : ''}
          </span>
        </div>

        {liveSessions.length === 0 ? (
          <div className="py-3 px-4 bg-zinc-50 rounded-lg border border-dashed border-zinc-200 text-center text-xs text-zinc-500">
            All engineer work session timers are currently paused or outside the IDE. Sessions automatically activate when engineers enter the IDE.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {liveSessions.map((session) => (
              <div key={session.id} className="p-3 bg-zinc-50/80 rounded-lg border border-zinc-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-zinc-900 truncate">{session.user_name}</span>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      session.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {session.status === 'active' ? '● In IDE' : '❚❚ Paused'}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-zinc-700 truncate">{session.target_title}</p>
                </div>
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-zinc-200 text-xs">
                  <span className="text-[10px] text-zinc-500 capitalize">{session.work_type.replace(/_/g, ' ')}</span>
                  <span className="font-mono font-bold text-zinc-950">
                    {Math.floor(session.elapsed_seconds / 3600).toString().padStart(2, '0')}:
                    {Math.floor((session.elapsed_seconds % 3600) / 60).toString().padStart(2, '0')}:
                    {(session.elapsed_seconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. CHARTS SECTION: Row of Monthly Cost Line Chart & Root Cause Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Rework Cost Line Chart */}
        <Card
          title="Monthly Rework Cost Trend (INR)"
          subtitle="Corrective maintenance expenditure over time"
          className="lg:col-span-2"
        >
          {loading ? (
            <div className="h-72 w-full flex items-center justify-center">
              <div className="space-y-3 w-full px-6">
                <div className="h-4 bg-zinc-200 rounded animate-pulse w-1/4"></div>
                <div className="h-48 bg-zinc-100 rounded animate-pulse w-full"></div>
              </div>
            </div>
          ) : monthlyCosts.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-xs text-zinc-400">
              No historical rework cost data available.
            </div>
          ) : (
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyCosts}
                  margin={{ top: 15, right: 25, left: 20, bottom: 15 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#52525b' }}
                    axisLine={{ stroke: '#e4e4e7' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#52525b' }}
                    axisLine={{ stroke: '#e4e4e7' }}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val.toLocaleString('en-IN')}`}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatINR(Number(val)), 'Rework Cost']}
                    labelFormatter={(label) => `Release Period: ${label}`}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e4e4e7',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rework_cost"
                    stroke="#09090b"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#09090b', strokeWidth: 1, stroke: '#ffffff' }}
                    activeDot={{ r: 6, fill: '#09090b' }}
                    name="Rework Cost (INR)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* 3. Root Cause Distribution Chart */}
        <Card
          title="Root-Cause Distribution"
          subtitle="Classification across engineering categories"
        >
          {loading ? (
            <div className="h-72 w-full flex items-center justify-center">
              <div className="w-40 h-40 rounded-full border-4 border-zinc-200 border-t-zinc-950 animate-spin"></div>
            </div>
          ) : rootCauses.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-xs text-zinc-400">
              No root causes identified.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={rootCauses}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={68}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="category"
                    >
                      {rootCauses.map((entry, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={ROOT_CAUSE_COLORS[entry.category] || '#71717a'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any, item: any) => [
                        `${val} bugs (${item.payload.percentage}%) • ${formatINR(item.payload.rework_cost)}`,
                        name,
                      ]}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e4e4e7',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Breakdown List */}
              <div className="space-y-2 pt-2 border-t border-zinc-100 text-xs">
                {rootCauses.map((item) => (
                  <div
                    key={item.category}
                    className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: ROOT_CAUSE_COLORS[item.category] || '#71717a',
                        }}
                      />
                      <span className="font-semibold text-zinc-900">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-zinc-500">{item.count} defects ({item.percentage}%)</span>
                      <strong className="text-zinc-950">{formatINR(item.rework_cost)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* 4. RECENT BUGS TABLE */}
      <Card
        title="Recent Bugs & Corrective Rework Ledger"
        subtitle="Live snapshot of defect accountability, corrective hours, and calculated rework costs in INR"
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveTab('bugs')}
            className="text-xs"
            rightIcon={<ArrowUpRight className="w-3 h-3" />}
          >
            All Bugs
          </Button>
        }
      >
        {loading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-zinc-100 rounded animate-pulse w-full"></div>
            ))}
          </div>
        ) : !summary || summary.recent_bugs.length === 0 ? (
          <EmptyState
            icon={Bug}
            title="No Bugs in Selected Range"
            description="No bug records found for the chosen date filters. Clear filters or report a new bug."
            actionLabel="Reset Date Filters"
            onAction={() => handlePresetChange('all')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3.5">Bug ID</th>
                  <th className="py-3 px-3.5">Module</th>
                  <th className="py-3 px-3.5">Title</th>
                  <th className="py-3 px-3.5">Severity</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5 text-right">Fix Hours</th>
                  <th className="py-3 px-3.5 text-right">Rework Cost (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {summary.recent_bugs.map((bug) => (
                  <tr key={bug.id} className="hover:bg-zinc-50/80 transition-colors">
                    {/* Bug ID */}
                    <td className="py-3 px-3.5 font-mono font-bold text-zinc-900 whitespace-nowrap">
                      {bug.id}
                    </td>

                    {/* Module */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
                        {bug.module_code}
                      </span>
                    </td>

                    {/* Title */}
                    <td className="py-3 px-3.5 font-medium text-zinc-950 max-w-xs truncate">
                      {bug.title}
                    </td>

                    {/* Severity */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <SeverityBadge severity={bug.severity} showIcon={false} />
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <StatusBadge status={bug.status} type="bug" />
                    </td>

                    {/* Fix Hours */}
                    <td className="py-3 px-3.5 text-right font-medium text-zinc-800 font-mono whitespace-nowrap">
                      {bug.fix_hours.toFixed(1)} hrs
                    </td>

                    {/* Rework Cost in INR */}
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-zinc-950 whitespace-nowrap">
                      {formatINR(bug.rework_cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Comprehensive Quality & Compliance Audit Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 space-y-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-0">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 print:hidden">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-bold text-zinc-950">Quality, Rework & Wage Compliance Audit Report</h3>
                  <p className="text-xs text-zinc-500">Live comprehensive audit of delivery performance, rework hours, and payroll adjustments</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </button>
                <button
                  onClick={() => setReportModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {loadingReport ? (
              <div className="p-12 text-center text-zinc-500 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                <p className="text-sm font-medium">Generating comprehensive quality and wage compliance report...</p>
              </div>
            ) : comprehensiveReport ? (
              <div className="space-y-6 text-zinc-900">
                {/* Formal Corporate Sub-header for Print */}
                <div className="flex items-start justify-between border-b border-zinc-200 pb-3">
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-zinc-950">REWORKGUARD ENGINEERING AUDIT & COMPLIANCE</h2>
                    <p className="text-xs text-zinc-500">Generated: {new Date(comprehensiveReport.generated_at || Date.now()).toLocaleString('en-IN')}</p>
                  </div>
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-zinc-100 text-zinc-800 border border-zinc-200 uppercase">
                    AUDIT PERIOD: CURRENT CYCLE
                  </span>
                </div>

                {/* 1. Core Metrics Summary Grid (4 Cards) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Deliverables & Tasks</span>
                    <div className="text-xl font-black text-zinc-950 font-mono">
                      {comprehensiveReport.summary.total_tasks}
                    </div>
                    <div className="text-[11px] text-zinc-600 flex items-center justify-between">
                      <span>Reopened: <strong className="text-rose-600 font-mono">{comprehensiveReport.summary.reopened_tasks}</strong></span>
                      <span>Rate: <strong className="font-mono">
                        {(comprehensiveReport.summary.total_tasks > 0 
                          ? (comprehensiveReport.summary.reopened_tasks / comprehensiveReport.summary.total_tasks * 100).toFixed(1) 
                          : '0.0')}%
                      </strong></span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Defects & Bugs</span>
                    <div className="text-xl font-black text-zinc-950 font-mono">
                      {comprehensiveReport.summary.total_bugs}
                    </div>
                    <div className="text-[11px] text-zinc-600 flex items-center justify-between">
                      <span>Closed: <strong className="text-emerald-600 font-mono">{comprehensiveReport.summary.closed_bugs}</strong></span>
                      <span>Open: <strong className="text-amber-600 font-mono">{comprehensiveReport.summary.open_bugs}</strong></span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Working Hours Ratio</span>
                    <div className="text-xl font-black text-zinc-950 font-mono">
                      {(comprehensiveReport.summary.normal_development_hours + comprehensiveReport.summary.corrective_rework_hours).toFixed(1)} <span className="text-xs font-normal text-zinc-500">hrs</span>
                    </div>
                    <div className="text-[11px] text-zinc-600 flex items-center justify-between">
                      <span>Normal: <strong className="text-zinc-800 font-mono">{comprehensiveReport.summary.normal_development_hours.toFixed(1)}h</strong></span>
                      <span>Rework: <strong className="text-amber-700 font-mono">{comprehensiveReport.summary.corrective_rework_hours.toFixed(1)}h</strong></span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Proposed Adjustments</span>
                    <div className="text-xl font-black text-amber-700 font-mono">
                      {formatINR(comprehensiveReport.summary.total_proposed_deductions)}
                    </div>
                    <div className="text-[11px] text-zinc-600 flex items-center justify-between">
                      <span>Rework Cost: <strong className="text-zinc-800 font-mono">{formatINR(comprehensiveReport.summary.total_rework_cost)}</strong></span>
                      <span>Waived: <strong className="text-emerald-600 font-mono">{formatINR(comprehensiveReport.summary.total_waived_amount)}</strong></span>
                    </div>
                  </div>
                </div>

                {/* 2. Visual Hours Ratio Distribution Bar */}
                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-indigo-600" />
                      <span>Normal Production Hours: {comprehensiveReport.summary.normal_development_hours.toFixed(1)} hrs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500" />
                      <span>Corrective Rework Hours: {comprehensiveReport.summary.corrective_rework_hours.toFixed(1)} hrs ({comprehensiveReport.summary.rework_percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-zinc-200 rounded-full overflow-hidden flex">
                    <div
                      className="bg-indigo-600 h-full"
                      style={{ width: `${Math.max(5, 100 - comprehensiveReport.summary.rework_percentage)}%` }}
                    />
                    <div
                      className="bg-amber-500 h-full"
                      style={{ width: `${Math.min(95, comprehensiveReport.summary.rework_percentage)}%` }}
                    />
                  </div>
                </div>

                {/* 3. Developer Breakdown Table */}
                <div className="border border-zinc-200 rounded-lg overflow-hidden">
                  <div className="bg-zinc-100 px-4 py-2.5 font-bold text-xs text-zinc-800 border-b border-zinc-200 flex items-center justify-between">
                    <span>DEVELOPER ACCOUNTABILITY & PRODUCTIVITY BREAKDOWN</span>
                    <span className="text-[10px] text-zinc-500 font-normal">{comprehensiveReport.rework_hours_by_developer.length} Engineers Tracked</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50/50 text-zinc-500 text-[10px] uppercase font-bold">
                          <th className="py-2.5 px-3">Developer</th>
                          <th className="py-2.5 px-3 text-right">Hourly Rate</th>
                          <th className="py-2.5 px-3 text-right">Normal Hours</th>
                          <th className="py-2.5 px-3 text-right">Rework Hours</th>
                          <th className="py-2.5 px-3 text-right">Proposed Adjustment</th>
                          <th className="py-2.5 px-3 text-center">Statutory Safeguard</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-medium text-zinc-800">
                        {comprehensiveReport.rework_hours_by_developer.map((dev) => (
                          <tr key={dev.developer_id} className="hover:bg-zinc-50/80 transition-colors">
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-zinc-950 block">{dev.developer_name}</span>
                              <span className="text-[10px] text-zinc-400 font-mono">{dev.developer_id}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-zinc-600">₹{dev.hourly_rate}/hr</td>
                            <td className="py-2.5 px-3 text-right font-mono text-zinc-700">{dev.normal_hours.toFixed(1)}h</td>
                            <td className="py-2.5 px-3 text-right font-mono text-amber-700 font-semibold">{dev.rework_hours.toFixed(1)}h</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-950">
                              {formatINR(dev.proposed_deduction)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {dev.statutory_cap_applied ? 'Cap Applied (≤50%)' : 'Safeguarded (≤50%)'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. Reopened Deliverables Summary */}
                {comprehensiveReport.reopened_tasks && comprehensiveReport.reopened_tasks.length > 0 && (
                  <div className="border border-zinc-200 rounded-lg overflow-hidden">
                    <div className="bg-zinc-100 px-4 py-2.5 font-bold text-xs text-zinc-800 border-b border-zinc-200 flex items-center justify-between">
                      <span>REOPENED DELIVERABLES & CORRECTIVE ASSIGNMENTS</span>
                      <span className="text-[10px] text-zinc-500 font-normal">{comprehensiveReport.reopened_tasks.length} Deliverables</span>
                    </div>
                    <div className="divide-y divide-zinc-100 text-xs">
                      {comprehensiveReport.reopened_tasks.map((rt) => (
                        <div key={rt.task_id} className="p-3 flex items-center justify-between gap-3 hover:bg-zinc-50">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">
                                {rt.task_id}
                              </span>
                              <span className="font-bold text-zinc-950">{rt.title}</span>
                              <StatusBadge status={rt.status} type="task" />
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-0.5">
                              Module: {rt.module_name} • Assignee: <strong>{rt.assigned_to_name}</strong>
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] font-mono font-bold text-rose-700">
                              Reopened {rt.reopened_count}x
                            </span>
                            <span className="text-[10px] text-zinc-400 block">
                              {rt.linked_bugs_count} Linked Defects
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Statutory Compliance & Safeguards Notice */}
                <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Statutory Wage Protection Guarantee (Payment of Wages Act, 1936)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-900">
                    {comprehensiveReport.statutory_compliance_note}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-500">
                <AlertCircle className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
                <p>Unable to load comprehensive report. Please ensure server is running.</p>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 print:hidden">
              <button
                onClick={() => setReportModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold bg-zinc-100 text-zinc-800 hover:bg-zinc-200 rounded-lg cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Audit Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
