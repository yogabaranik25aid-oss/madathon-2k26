import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { MonthlyFinanceSummary, PayrollAdjustmentItem, AuditLog } from '../../types';
import { 
  Receipt, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Scale, 
  Clock, 
  IndianRupee, 
  RefreshCw, 
  Download, 
  ShieldCheck, 
  User, 
  Filter, 
  X,
  FileCheck,
  Ban,
  History,
  Eye,
  FileText,
  UserCheck,
  Building2,
  AlertCircle
} from 'lucide-react';

export const PayrollFinancePage: React.FC = () => {
  const { currentUser } = useApp();
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [financeSummary, setFinanceSummary] = useState<MonthlyFinanceSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal states
  const [selectedAdjustment, setSelectedAdjustment] = useState<PayrollAdjustmentItem | null>(null);
  const [waiveModalOpen, setWaiveModalOpen] = useState<boolean>(false);
  const [waiverReason, setWaiverReason] = useState<string>('');
  
  // View Reason Modal
  const [reasonModalOpen, setReasonModalOpen] = useState<boolean>(false);

  // View Audit History Modal
  const [auditModalOpen, setAuditModalOpen] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState<boolean>(false);

  // HR Authorization Modal
  const [hrModalOpen, setHrModalOpen] = useState<boolean>(false);
  const [hrDecision, setHrDecision] = useState<'authorized' | 'rejected' | 'disputed'>('authorized');
  const [hrNotes, setHrNotes] = useState<string>('');

  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchFinanceData = async (month: string) => {
    try {
      setRefreshing(true);
      setError(null);
      const data = await api.getFinanceSummary(month);
      setFinanceSummary(data);
    } catch (err: any) {
      console.error('Failed to load finance summary:', err);
      setError(err.message || 'Unable to load finance and payroll adjustments.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFinanceData(selectedMonth);
  }, [selectedMonth]);

  const handleUpdateStatus = async (
    id: string, 
    status: 'under_review' | 'finance_approved' | 'waived' | 'disputed',
    notes?: string
  ) => {
    try {
      setActionLoading(true);
      await api.updatePayrollAdjustmentStatus(id, { status, notes });
      setActionSuccess(`Adjustment marked as ${status.replace('_', ' ').toUpperCase()}`);
      setTimeout(() => setActionSuccess(null), 3500);
      setWaiveModalOpen(false);
      setSelectedAdjustment(null);
      setWaiverReason('');
      await fetchFinanceData(selectedMonth);
    } catch (err: any) {
      alert(`Failed to update status: ${err.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const isHrUser = currentUser?.role === 'hr';
  const isManagerUser = currentUser?.role === 'manager' || currentUser?.role === 'admin';

  const handleManagerSubmitForHrReview = async () => {
    if (!selectedAdjustment) return;
    try {
      setActionLoading(true);
      await api.submitForHrReview(selectedAdjustment.id, {
        notes: hrNotes || 'Submitted by manager for independent HR statutory compliance review',
      });
      setActionSuccess('Adjustment submitted to HR review queue. Status is Pending HR Review.');
      setTimeout(() => setActionSuccess(null), 3500);
      setHrModalOpen(false);
      setSelectedAdjustment(null);
      setHrNotes('');
      await fetchFinanceData(selectedMonth);
    } catch (err: any) {
      alert(`Failed to submit for HR review: ${err.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleHRAuthorize = async () => {
    if (!selectedAdjustment) return;
    if (!isHrUser) {
      alert('Statutory payroll authorizations strictly require an authorized HR role. Please sign in with an HR Officer account.');
      return;
    }
    if (!hrNotes.trim()) {
      alert('Statutory compliance audit notes are required to record a formal HR decision.');
      return;
    }
    try {
      setActionLoading(true);
      await api.hrAuthorizePayrollAdjustment(selectedAdjustment.id, {
        decision: hrDecision,
        notes: hrNotes.trim(),
      });
      setActionSuccess(`HR Authorization recorded successfully: ${hrDecision.toUpperCase()}`);
      setTimeout(() => setActionSuccess(null), 3500);
      setHrModalOpen(false);
      setSelectedAdjustment(null);
      setHrNotes('');
      await fetchFinanceData(selectedMonth);
    } catch (err: any) {
      alert(`HR Authorization failed: ${err.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewAuditHistory = async (item: PayrollAdjustmentItem) => {
    setSelectedAdjustment(item);
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const logs = await api.getAdjustmentAuditHistory(item.id);
      setAuditLogs(logs);
    } catch (err: any) {
      console.error('Failed to load audit history:', err);
      alert('Unable to load audit history trail.');
    } finally {
      setAuditLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!financeSummary || !financeSummary.items.length) {
      alert('No adjustments to export for this month.');
      return;
    }
    const headers = [
      'Adjustment ID',
      'Employee Name',
      'Original Delivery Author',
      'Rework Assignee',
      'Bug ID',
      'Bug Title',
      'Module',
      'Approved Hours',
      'Hourly Rate (INR)',
      'Total Rework Cost (INR)',
      'Proposed Adjustment Preview (INR)',
      'Waiver Amount (INR)',
      'Chargeable',
      'Finance Review Status',
      'Finance Reviewer',
      'HR Authorization Status',
      'HR Reviewer',
      'Waiver / Notes'
    ];
    const rows = financeSummary.items.map((a: PayrollAdjustmentItem) => [
      a.id,
      `"${a.employee_name}"`,
      `"${a.original_author_name || a.employee_name}"`,
      `"${a.rework_assignee_name || a.employee_name}"`,
      a.bug_id,
      `"${a.bug_title?.replace(/"/g, '""') || ''}"`,
      `"${a.module_name}"`,
      a.approved_hours,
      a.hourly_rate,
      a.rework_cost || (a.approved_hours * a.hourly_rate),
      a.proposed_adjustment_amount,
      a.waiver_amount || 0,
      a.is_chargeable ? 'YES' : 'NO',
      a.status,
      `"${a.finance_reviewer_name || ''}"`,
      a.hr_authorization_status,
      `"${a.hr_reviewer_name || ''}"`,
      `"${(a.waiver_reason || a.review_notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reworkguard-payroll-finance-${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const monthOptions = [
    { value: '2026-10', label: 'October 2026' },
    { value: '2026-09', label: 'September 2026' },
    { value: '2026-08', label: 'August 2026' },
  ];

  const filteredAdjustments = (financeSummary?.items || []).filter((item: PayrollAdjustmentItem) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending_hr') return item.hr_authorization_status === 'pending_hr_review';
    if (statusFilter === 'hr_authorized') return item.hr_authorization_status === 'authorized';
    return item.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Month Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-zinc-950">
              Monthly Payroll Adjustments & Finance Review
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 uppercase">
              Manager & Finance Portal
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Demo Mode: Local Environment
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Audit proposed rework cost offsets, apply fairness waivers, record HR authorization decisions, and enforce wage protection safeguards.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg text-xs font-medium">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-zinc-900 font-semibold focus:outline-none cursor-pointer"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-zinc-200 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 rounded-lg transition-colors cursor-pointer"
            title="Export payroll preview to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => fetchFinanceData(selectedMonth)}
            disabled={refreshing}
            className="p-2 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200 cursor-pointer"
            title="Refresh finance summary"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* STATUTORY SAFEGUARD BANNER */}
      <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-xl flex items-start gap-3.5 shadow-xs">
        <Scale className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
              Critical Statutory Safeguard & Wage Protection Guidelines
            </h4>
            <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-mono font-bold">
              NON-AUTOMATED DEDUCTION
            </span>
          </div>
          <p className="text-xs text-amber-900/90 leading-relaxed font-medium">
            <strong>Finance Approved</strong> denotes approval within the internal finance-review workflow only and <strong>never executes an automatic deduction from an employee's salary</strong>. Corrective rework costs are tracked as engineering quality intelligence. Any proposed offset remains a prospective preview until independent HR authorization, applicable legal compliance checks, and formal sign-offs are completed.
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Finance KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Rework Cost */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Total Rework Incurred
            </span>
            <IndianRupee className="w-4 h-4 text-zinc-600" />
          </div>
          <p className="text-2xl font-bold text-zinc-950">
            ₹{financeSummary?.total_rework_cost?.toLocaleString() ?? 0}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">Engineering rework cost baseline</p>
        </div>

        {/* Proposed Adjustments (Preview) */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
              Proposed Adjustments
            </span>
            <Receipt className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-700">
            ₹{financeSummary?.total_proposed_adjustments?.toLocaleString() ?? 0}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">Internal preview (non-deducted)</p>
        </div>

        {/* Formally HR Authorized */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-600">
              HR Authorized Total
            </span>
            <UserCheck className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-700">
            ₹{financeSummary?.authorized_adjustments_cost?.toLocaleString() ?? 0}
          </p>
          <p className="text-[10px] text-purple-600 mt-1">
            {financeSummary?.authorized_hr_count ?? 0} items sign-off complete
          </p>
        </div>

        {/* Waived / Non-Deductible */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
              Waived Rework Cost
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">
            ₹{financeSummary?.waived_rework_cost?.toLocaleString() ?? 0}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">Fairness waivers applied (₹0)</p>
        </div>

        {/* Affected Employees & HR Queue */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">
              Pending HR Review
            </span>
            <Building2 className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700">
            {financeSummary?.pending_hr_count ?? 0}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">
            Across {financeSummary?.affected_employees_count ?? 0} contributors
          </p>
        </div>
      </div>

      {/* STAGE E: FINANCIAL REPORTING BREAKDOWN (HOURS & PROPOSED COST) */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
          <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-zinc-700" />
            <span>Rework Hours Ledger & Cost Breakdown</span>
          </span>
          <span className="text-[11px] font-mono text-zinc-500">
            Eligible Proposed Cost: <strong className="text-zinc-950 font-bold">₹{(financeSummary?.eligible_proposed_rework_cost ?? financeSummary?.total_proposed_adjustments ?? 0).toLocaleString()}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-medium">Total Rework Hours</span>
            <span className="text-base font-bold font-mono text-zinc-950 mt-0.5 block">{financeSummary?.total_rework_hours ?? 0} hrs</span>
            <span className="text-[10px] text-zinc-400">All logged rework</span>
          </div>

          <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-200/80">
            <span className="text-[10px] text-blue-700 uppercase tracking-wider block font-semibold">Submitted Hours</span>
            <span className="text-base font-bold font-mono text-blue-900 mt-0.5 block">{financeSummary?.submitted_hours ?? 0} hrs</span>
            <span className="text-[10px] text-blue-600">Fixes submitted</span>
          </div>

          <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-200/80">
            <span className="text-[10px] text-emerald-700 uppercase tracking-wider block font-semibold">Approved Hours</span>
            <span className="text-base font-bold font-mono text-emerald-900 mt-0.5 block">{financeSummary?.approved_hours ?? 0} hrs</span>
            <span className="text-[10px] text-emerald-600">Accounting approved</span>
          </div>

          <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-200/80">
            <span className="text-[10px] text-amber-700 uppercase tracking-wider block font-semibold">Pending Hours</span>
            <span className="text-base font-bold font-mono text-amber-900 mt-0.5 block">{financeSummary?.pending_hours ?? 0} hrs</span>
            <span className="text-[10px] text-amber-600">Awaiting sign-off</span>
          </div>

          <div className="p-2.5 bg-rose-50/60 rounded-lg border border-rose-200/80">
            <span className="text-[10px] text-rose-700 uppercase tracking-wider block font-semibold">Disputed Hours</span>
            <span className="text-base font-bold font-mono text-rose-900 mt-0.5 block">{financeSummary?.disputed_hours ?? 0} hrs</span>
            <span className="text-[10px] text-rose-600">Under dispute</span>
          </div>

          <div className="p-2.5 bg-purple-50/60 rounded-lg border border-purple-200/80">
            <span className="text-[10px] text-purple-700 uppercase tracking-wider block font-semibold">Waived Hours</span>
            <span className="text-base font-bold font-mono text-purple-900 mt-0.5 block">{financeSummary?.waived_hours ?? 0} hrs</span>
            <span className="text-[10px] text-purple-600">Charges excused</span>
          </div>
        </div>
      </div>

      {/* Adjustments Review Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/50">
          <div>
            <h3 className="text-sm font-bold text-zinc-950">Itemized Adjustment Queue & Governance Actions</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Review and sign off on defect rework assessments. Separate rework metrics from proposed payroll previews.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-700 focus:outline-none"
            >
              <option value="all">All Adjustments ({financeSummary?.items?.length || 0})</option>
              <option value="under_review">Under Finance Review</option>
              <option value="finance_approved">Finance Approved</option>
              <option value="pending_hr">Pending HR Authorization</option>
              <option value="hr_authorized">HR Authorized</option>
              <option value="waived">Waived</option>
              <option value="disputed">Disputed</option>
            </select>
          </div>
        </div>

        {filteredAdjustments.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <table className="min-w-[1150px] w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-50 text-zinc-600 font-semibold border-b border-zinc-200">
                <tr>
                  <th className="py-3 px-4 w-40">Contributor</th>
                  <th className="py-3 px-4 w-52">Bug & Module</th>
                  <th className="py-3 px-4 w-48">Accountability Trail</th>
                  <th className="py-3 px-4 text-right w-20">Hours</th>
                  <th className="py-3 px-4 text-right w-20">Rate</th>
                  <th className="py-3 px-4 text-right w-28">Rework Cost</th>
                  <th className="py-3 px-4 text-right w-28">Proposed Offset</th>
                  <th className="py-3 px-4 w-36">Finance Review</th>
                  <th className="py-3 px-4 w-36">HR Authorization</th>
                  <th className="py-3 px-4 text-right w-44">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredAdjustments.map((item: PayrollAdjustmentItem) => {
                  const itemCost = item.rework_cost || (item.approved_hours * item.hourly_rate);
                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                      {/* Contributor */}
                      <td className="py-3.5 px-4 font-semibold text-zinc-900 align-top">
                        <div className="text-xs font-bold text-zinc-950">{item.employee_name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5">ID: {item.employee_id}</div>
                      </td>

                      {/* Bug & Module */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-mono font-bold text-zinc-900 text-[11px]">{item.bug_id}</div>
                        <div className="text-[11px] text-zinc-700 font-medium line-clamp-1" title={item.bug_title}>
                          {item.bug_title}
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">{item.module_name}</div>
                      </td>

                      {/* Accountability: Original Delivery Author vs Rework Assignee */}
                      <td className="py-3.5 px-4 align-top text-[11px] text-zinc-600">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-zinc-400 uppercase w-10">Author:</span>
                          <span className="font-medium text-zinc-900">{item.original_author_name || item.employee_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-semibold text-zinc-400 uppercase w-10">Fixer:</span>
                          <span className="font-medium text-zinc-800">{item.rework_assignee_name || item.employee_name}</span>
                        </div>
                        {item.waiver_reason && (
                          <button
                            onClick={() => {
                              setSelectedAdjustment(item);
                              setReasonModalOpen(true);
                            }}
                            className="mt-1 text-[10px] text-emerald-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Reason</span>
                          </button>
                        )}
                      </td>

                      {/* Approved Hours */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-zinc-900 align-top">
                        {item.approved_hours.toFixed(1)}h
                      </td>

                      {/* Hourly Rate */}
                      <td className="py-3.5 px-4 text-right font-mono text-zinc-600 align-top">
                        ₹{item.hourly_rate}/h
                      </td>

                      {/* Total Rework Cost */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-zinc-950 align-top">
                        ₹{itemCost.toLocaleString()}
                      </td>

                      {/* Proposed Adjustment (Preview) */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold align-top">
                        {item.is_chargeable && item.proposed_adjustment_amount > 0 ? (
                          <div>
                            <span className="text-blue-700">₹{item.proposed_adjustment_amount.toLocaleString()}</span>
                            {item.cap_applied && (
                              <div className="mt-0.5">
                                <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-mono font-bold uppercase inline-block" title={item.calculation_explanation}>
                                  Capped (Excl: ₹{item.excluded_amount?.toLocaleString()})
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-emerald-700 font-semibold">₹0 (Waived)</span>
                        )}
                      </td>

                      {/* Finance Review Status */}
                      <td className="py-3.5 px-4 align-top">
                        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          item.status === 'finance_approved'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : item.status === 'waived'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : item.status === 'disputed'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                        }`}>
                          {item.status.replace('_', ' ')}
                        </span>
                        {item.finance_reviewer_name && (
                          <div className="text-[10px] text-zinc-500 mt-1">
                            By {item.finance_reviewer_name}
                          </div>
                        )}
                      </td>

                      {/* HR Authorization Status */}
                      <td className="py-3.5 px-4 align-top">
                        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          item.hr_authorization_status === 'authorized'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : item.hr_authorization_status === 'rejected'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : item.hr_authorization_status === 'disputed'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                        }`}>
                          {item.hr_authorization_status?.replace('_', ' ') || 'pending hr review'}
                        </span>
                        {item.hr_reviewer_name && (
                          <div className="text-[10px] text-zinc-500 mt-1">
                            By {item.hr_reviewer_name}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right align-top">
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            {item.status !== 'finance_approved' && item.is_chargeable && (
                              <button
                                onClick={() => handleUpdateStatus(item.id, 'finance_approved', 'Approved by finance/manager')}
                                disabled={actionLoading}
                                className="px-2 py-1 text-[11px] font-semibold bg-zinc-900 text-white rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                                title="Approve internal finance preview"
                              >
                                Finance Approve
                              </button>
                            )}

                            {item.status !== 'waived' && (
                              <button
                                onClick={() => {
                                  setSelectedAdjustment(item);
                                  setWaiverReason('');
                                  setWaiveModalOpen(true);
                                }}
                                disabled={actionLoading}
                                className="px-2 py-1 text-[11px] font-semibold bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                                title="Waive rework adjustment"
                              >
                                Waive
                              </button>
                            )}

                            {/* HR Authorization Action Button */}
                            {item.hr_authorization_status === 'authorized' ? (
                              <button
                                onClick={() => {
                                  setSelectedAdjustment(item);
                                  setHrNotes(item.hr_notes || '');
                                  setHrModalOpen(true);
                                }}
                                className="px-2 py-1 text-[11px] font-semibold bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 rounded transition-colors cursor-pointer"
                                title="View recorded HR statutory decision"
                              >
                                View HR Decision
                              </button>
                            ) : isHrUser ? (
                              <button
                                onClick={() => {
                                  setSelectedAdjustment(item);
                                  setHrDecision('authorized');
                                  setHrNotes(item.hr_notes || '');
                                  setHrModalOpen(true);
                                }}
                                disabled={actionLoading}
                                className="px-2 py-1 text-[11px] font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors cursor-pointer shadow-xs"
                                title="Execute statutory HR compliance authorization"
                              >
                                HR Authorize
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedAdjustment(item);
                                  setHrNotes('');
                                  setHrModalOpen(true);
                                }}
                                disabled={actionLoading}
                                className="px-2 py-1 text-[11px] font-semibold bg-white border border-purple-300 text-purple-700 hover:bg-purple-50 rounded transition-colors cursor-pointer"
                                title="Submit adjustment for independent HR compliance review"
                              >
                                {item.hr_authorization_status === 'pending_hr_review' ? 'HR Pending' : 'Submit for HR'}
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-0.5">
                            <button
                              onClick={() => handleViewAuditHistory(item)}
                              className="hover:text-zinc-900 font-semibold underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <History className="w-3 h-3 text-zinc-400" />
                              <span>Audit Trail</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-sm font-bold text-zinc-900">No Adjustments Found</p>
            <p className="text-xs text-zinc-500">
              There are no payroll adjustments matching the selected filter for {selectedMonth}.
            </p>
          </div>
        )}
      </div>

      {/* Waive Modal */}
      {waiveModalOpen && selectedAdjustment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Ban className="w-4 h-4 text-emerald-600" />
                <span>Waive Proposed Adjustment</span>
              </h3>
              <button
                onClick={() => setWaiveModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-zinc-600 space-y-2">
              <p>
                Waiving proposed rework adjustment for bug{' '}
                <strong>{selectedAdjustment.bug_id}</strong> ({selectedAdjustment.employee_name}).
              </p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Applying a fairness waiver zeroes out any proposed adjustment (₹0) and protects developer compensation while maintaining corrective tracking hours for architectural quality retrospectives.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-900 mb-1">
                Mandatory Waiver Rationale <span className="text-red-500">*</span>
              </label>
              <textarea
                value={waiverReason}
                onChange={(e) => setWaiverReason(e.target.value)}
                placeholder="e.g. Defect caused by external dependency change or client specification amendment mid-sprint."
                rows={3}
                className="w-full text-xs p-2.5 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={() => setWaiveModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedAdjustment.id, 'waived', waiverReason || 'Fairness waiver applied')}
                disabled={actionLoading || !waiverReason.trim()}
                className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors cursor-pointer"
              >
                Confirm Full Waiver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Reason Modal */}
      {reasonModalOpen && selectedAdjustment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Waiver & Review Rationale Details</span>
              </h3>
              <button
                onClick={() => setReasonModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Work Item:</span>
                  <span className="font-bold text-zinc-900">{selectedAdjustment.bug_id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Module:</span>
                  <span className="font-medium text-zinc-800">{selectedAdjustment.module_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Contributor:</span>
                  <span className="font-medium text-zinc-900">{selectedAdjustment.employee_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Decision:</span>
                  <span className="font-semibold text-emerald-700">{selectedAdjustment.status.toUpperCase()}</span>
                </div>
              </div>

              <div>
                <h5 className="text-[11px] font-bold text-zinc-700 uppercase mb-1">Full Waiver Rationale:</h5>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 font-medium leading-relaxed whitespace-pre-wrap">
                  {selectedAdjustment.waiver_reason || 'No waiver text provided.'}
                </div>
              </div>

              {selectedAdjustment.review_notes && (
                <div>
                  <h5 className="text-[11px] font-bold text-zinc-700 uppercase mb-1">Internal Review Notes:</h5>
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 leading-relaxed whitespace-pre-wrap">
                    {selectedAdjustment.review_notes}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-zinc-100">
              <button
                onClick={() => setReasonModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HR Authorization / Manager Submission Modal */}
      {hrModalOpen && selectedAdjustment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-600" />
                <span>
                  {selectedAdjustment.hr_authorization_status === 'authorized'
                    ? 'HR Statutory Compliance Decision (Authorized)'
                    : isHrUser
                    ? 'HR Statutory Compliance Authorization'
                    : 'Submit Proposed Adjustment for HR Review'}
                </span>
              </h3>
              <button
                onClick={() => setHrModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* CASE 1: ALREADY AUTHORIZED */}
            {selectedAdjustment.hr_authorization_status === 'authorized' ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-950 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-purple-900">
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    <span>Statutory Compliance Formally Authorized</span>
                  </div>
                  <p className="text-[11px] text-purple-800 leading-relaxed">
                    This proposed adjustment has been formally evaluated and authorized under statutory wage protection compliance rules.
                  </p>
                </div>

                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Employee</span>
                      <span className="font-semibold text-zinc-900">{selectedAdjustment.employee_name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Authorized By</span>
                      <span className="font-semibold text-purple-800">{selectedAdjustment.hr_reviewer_name || 'Authorized HR Officer'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Decision Date</span>
                      <span className="font-mono text-zinc-700">
                        {selectedAdjustment.hr_decision_date ? new Date(selectedAdjustment.hr_decision_date).toLocaleDateString() : 'Recorded'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Proposed Offset Amount</span>
                      <span className="font-semibold font-mono text-zinc-900">₹{selectedAdjustment.proposed_adjustment_amount?.toLocaleString()}</span>
                    </div>
                  </div>

                  {selectedAdjustment.hr_notes && (
                    <div className="pt-2 border-t border-zinc-200 mt-2">
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold block mb-0.5">HR Compliance Justification / Audit Notes</span>
                      <p className="text-[11px] text-zinc-700 italic bg-white p-2 rounded border border-zinc-200">
                        "{selectedAdjustment.hr_notes}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-zinc-100">
                  <button
                    onClick={() => setHrModalOpen(false)}
                    className="px-4 py-1.5 text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : isHrUser ? (
              /* CASE 2: AUTHORIZED HR OFFICER FORM */
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-purple-950">
                    <ShieldCheck className="w-4 h-4 text-purple-700" />
                    <span>Authorized HR Officer Session: {currentUser?.name}</span>
                  </div>
                  <p className="text-[11px] text-purple-800 leading-relaxed">
                    As an authorized HR Officer, record a legally compliant statutory wage authorization decision for {selectedAdjustment.employee_name} (Bug: {selectedAdjustment.bug_id}).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-900 mb-1">
                    Statutory Compliance Decision <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setHrDecision('authorized')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                        hrDecision === 'authorized'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      Authorize Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setHrDecision('rejected')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                        hrDecision === 'rejected'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      Reject (Zero Out)
                    </button>
                    <button
                      type="button"
                      onClick={() => setHrDecision('disputed')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                        hrDecision === 'disputed'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      Flag Dispute
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-900 mb-1">
                    HR Compliance Notes / Statutory Justification <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={hrNotes}
                    onChange={(e) => setHrNotes(e.target.value)}
                    placeholder="Record employee notice verification, applicable statutory labor law compliance check, or reason."
                    rows={3}
                    className="w-full text-xs p-2.5 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                  <button
                    onClick={() => setHrModalOpen(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleHRAuthorize}
                    disabled={actionLoading}
                    className="px-4 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Record HR Decision
                  </button>
                </div>
              </div>
            ) : (
              /* CASE 3: MANAGER / TEAM LEAD SUBMISSION WORKFLOW */
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-950 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Scale className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <span>Statutory Wage Protection Safeguard</span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                    You are signed in as <strong>{currentUser?.name}</strong> (Role: <strong>{currentUser?.role?.toUpperCase()}</strong>). Under statutory labor and wage protection laws, <strong>managers cannot authorize formal compensation adjustments</strong>.
                  </p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    As a Manager, you can review this rework calculation and submit it to the HR queue with your justification. The item will remain in <strong>Pending HR Review</strong> until an authorized HR Officer reviews and authorizes it.
                  </p>
                </div>

                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-700">Target Employee:</span>
                    <span className="font-bold text-zinc-900">{selectedAdjustment.employee_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-700">Associated Defect:</span>
                    <span className="font-mono text-zinc-800">{selectedAdjustment.bug_id} ({selectedAdjustment.module_name})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-700">Proposed Offset:</span>
                    <span className="font-bold font-mono text-zinc-950">₹{selectedAdjustment.proposed_adjustment_amount?.toLocaleString()} ({selectedAdjustment.approved_hours}h @ ₹{selectedAdjustment.hourly_rate}/h)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-700">Current HR Status:</span>
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                      {selectedAdjustment.hr_authorization_status?.replace('_', ' ') || 'Pending HR Review'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-900 mb-1">
                    Manager Submission Notes & Justification for HR
                  </label>
                  <textarea
                    value={hrNotes}
                    onChange={(e) => setHrNotes(e.target.value)}
                    placeholder="Provide engineering context, defect confirmation rationale, and notes for the HR compliance officer..."
                    rows={3}
                    className="w-full text-xs p-2.5 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none"
                  />
                </div>

                <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded-lg text-[11px] text-purple-900 flex items-start gap-2">
                  <UserCheck className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>To execute statutory authorization:</strong> Log in with an authorized HR Officer account (e.g. <strong>Elena Rostova</strong>: <code className="bg-purple-100 px-1 py-0.5 rounded font-mono text-[10px]">elena.rostova@reworkguard.io</code> / <code className="bg-purple-100 px-1 py-0.5 rounded font-mono text-[10px]">hr123</code>).
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                  <button
                    onClick={() => setHrModalOpen(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleManagerSubmitForHrReview}
                    disabled={actionLoading}
                    className="px-4 py-1.5 text-xs font-semibold bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Submit for HR Review
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit History Modal */}
      {auditModalOpen && selectedAdjustment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-zinc-800" />
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">
                    Audit History & Accountability Trail
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Adjustment {selectedAdjustment.id} • Bug {selectedAdjustment.bug_id} ({selectedAdjustment.employee_name})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAuditModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {auditLoading ? (
                <div className="p-8 text-center text-zinc-500 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-zinc-400" />
                  <p>Loading historical audit records from server...</p>
                </div>
              ) : auditLogs.length > 0 ? (
                <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-lg overflow-hidden">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3 hover:bg-zinc-50 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 uppercase">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-800 font-medium">{log.details}</p>
                      <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                        <User className="w-3 h-3 text-zinc-400" />
                        <span>Actor: <strong>{log.user_name || log.user_id}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-zinc-500">
                  <CheckCircle2 className="w-6 h-6 text-zinc-400 mx-auto mb-1" />
                  <p>No audit trail events logged for this record yet.</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-zinc-100 flex-shrink-0">
              <button
                onClick={() => setAuditModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg cursor-pointer"
              >
                Close Audit History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
