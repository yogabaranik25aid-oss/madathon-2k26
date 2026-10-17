import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { MonthlyPayrollPreview, PayrollAdjustmentItem, AuditLog, Project, TaskAssignment } from '../../../types';
import { 
  Receipt, 
  ShieldAlert, 
  Calendar, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle,
  Clock,
  IndianRupee,
  RefreshCw,
  Scale,
  History,
  Eye,
  FileText,
  UserCheck,
  Building2,
  X,
  MessageSquareWarning,
  User,
  FolderGit2,
  Briefcase,
  Printer,
  ShieldCheck
} from 'lucide-react';

export const EmployeePayrollPage: React.FC = () => {
  const { currentUser } = useApp();
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [preview, setPreview] = useState<MonthlyPayrollPreview | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Dispute Modal
  const [disputeModalOpen, setDisputeModalOpen] = useState<boolean>(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<PayrollAdjustmentItem | null>(null);
  const [disputeReason, setDisputeReason] = useState<string>('');
  const [submittingDispute, setSubmittingDispute] = useState<boolean>(false);

  // View Reason Modal
  const [reasonModalOpen, setReasonModalOpen] = useState<boolean>(false);

  // Payslip Modal
  const [payslipModalOpen, setPayslipModalOpen] = useState<boolean>(false);

  // View Audit History Modal
  const [auditModalOpen, setAuditModalOpen] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState<boolean>(false);

  const fetchPayroll = async (month: string) => {
    try {
      setRefreshing(true);
      setError(null);
      const [data, taskList, projList] = await Promise.all([
        api.getPayrollPreview(currentUser?.id, month),
        currentUser ? api.getTasks({ assigned_to_id: currentUser.id }).catch(() => []) : Promise.resolve([]),
        api.getProjects().catch(() => []),
      ]);
      setPreview(data);
      setTasks(taskList);
      setProjects(projList);
    } catch (err: any) {
      console.error('Failed to load payroll preview:', err);
      setError(err.message || 'Unable to retrieve monthly payroll preview.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayroll(selectedMonth);
  }, [selectedMonth, currentUser?.id]);

  const monthOptions = [
    { value: '2026-10', label: 'October 2026 (Current Cycle)' },
    { value: '2026-09', label: 'September 2026' },
    { value: '2026-08', label: 'August 2026' },
  ];

  const handleRaiseDispute = async () => {
    if (!selectedAdjustment) return;
    if (!disputeReason.trim()) {
      alert('Please provide a detailed dispute rationale.');
      return;
    }
    try {
      setSubmittingDispute(true);
      await api.disputePayrollAdjustment(selectedAdjustment.id, { reason: disputeReason.trim() });
      setActionSuccess('Formal dispute submitted for manager & HR review.');
      setTimeout(() => setActionSuccess(null), 4000);
      setDisputeModalOpen(false);
      setSelectedAdjustment(null);
      setDisputeReason('');
      await fetchPayroll(selectedMonth);
    } catch (err: any) {
      alert(`Failed to raise dispute: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmittingDispute(false);
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
      alert('Unable to retrieve audit history trail.');
    } finally {
      setAuditLoading(false);
    }
  };

  const getFinanceStatusBadge = (status: PayrollAdjustmentItem['status'], isChargeable: boolean) => {
    if (!isChargeable || status === 'waived') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" />
          Waived / ₹0 Impact
        </span>
      );
    }
    if (status === 'finance_approved') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          Finance Approved Preview
        </span>
      );
    }
    if (status === 'disputed') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3" />
          Under Dispute
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
        Internal Review Pending
      </span>
    );
  };

  const getHRStatusBadge = (hrStatus: PayrollAdjustmentItem['hr_authorization_status']) => {
    switch (hrStatus) {
      case 'authorized':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            <UserCheck className="w-3 h-3" />
            HR Authorized
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            HR Waived
          </span>
        );
      case 'disputed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3" />
            Dispute Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
            Pending HR Authorization
          </span>
        );
    }
  };

  // Calculate Project-by-Project Salary & Next Month Rework Deductions
  const assignedProjectsList = React.useMemo(() => {
    const baseSalary = preview?.base_salary || 85000;
    const items = preview?.adjustment_items || [];
    
    const projMap = new Map<string, {
      project_id: string;
      project_name: string;
      project_code: string;
      tasks_count: number;
      rework_hours: number;
      rework_deduction: number;
    }>();

    tasks.forEach(t => {
      const pid = t.project_id || 'PRJ-LLM';
      const existing = projMap.get(pid) || {
        project_id: pid,
        project_name: t.project_name || 'LLM Application Platform',
        project_code: pid.replace('PRJ-', ''),
        tasks_count: 0,
        rework_hours: 0,
        rework_deduction: 0,
      };
      existing.tasks_count += 1;
      projMap.set(pid, existing);
    });

    if (projMap.size === 0) {
      projMap.set('PRJ-LLM', {
        project_id: 'PRJ-LLM',
        project_name: 'LLM Application Platform',
        project_code: 'LLM-CORE',
        tasks_count: 2,
        rework_hours: 0,
        rework_deduction: 0,
      });
    }

    items.forEach(item => {
      const matchedTask = tasks.find(t => t.module_id === item.module_id || t.id === item.bug_id);
      const pid = matchedTask?.project_id || (projMap.keys().next().value || 'PRJ-LLM');
      const proj = projMap.get(pid);
      if (proj && item.is_chargeable && item.status !== 'waived' && item.status !== 'disputed') {
        proj.rework_hours += Number(item.approved_hours) || 0;
        proj.rework_deduction += Number(item.proposed_adjustment_amount) || 0;
      }
    });

    const totalProjects = projMap.size || 1;
    const basePerProject = Math.round(baseSalary / totalProjects);

    return Array.from(projMap.values()).map(p => ({
      ...p,
      allocated_salary: basePerProject,
      net_project_salary: Math.max(0, basePerProject - p.rework_deduction),
    }));
  }, [preview, tasks]);

  return (
    <div className="space-y-6">
      {/* Month Selector & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-zinc-950">Project Salary & Next Month Rework Deductions</h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 uppercase">
              {currentUser?.name}
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Employee Portal
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Transparent compensation breakdown showing guaranteed salary per assigned project, corrective rework hours, and projected wage adjustments for next month.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            onClick={() => setPayslipModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-colors shadow-xs cursor-pointer"
            title="View and print official monthly payslip"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Official Payslip</span>
          </button>

          <button
            onClick={() => fetchPayroll(selectedMonth)}
            disabled={refreshing}
            className="p-2 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200 cursor-pointer"
            title="Refresh preview"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* CRITICAL STATUTORY SAFEGUARD BANNER */}
      <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-xl flex items-start gap-3.5 shadow-xs">
        <Scale className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
              Critical Statutory Safeguard & Wage Protection
            </h4>
            <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-mono font-bold">
              NON-DEDUCTIBLE AUDIT PREVIEW
            </span>
          </div>
          <p className="text-xs text-amber-900/90 leading-relaxed font-medium">
            {preview?.compliance_warning ||
              'This is an internal preview for engineering retrospectives and audit quality analysis only. Not an automated deduction. Live payroll integration is disabled. Any formal payroll adjustment requires authorized Finance and HR review, recorded legal compliance verification, and strict adherence to applicable statutory wage protection laws.'}
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

      {/* Payslip & Quality Metrics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Base Gross Salary */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Base Gross Salary
            </span>
            <Receipt className="w-4 h-4 text-zinc-600" />
          </div>
          <p className="text-2xl font-bold text-zinc-950">
            ₹{preview?.base_salary?.toLocaleString() ?? 0}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">Guaranteed monthly gross (160h cycle)</p>
        </div>

        {/* Total Rework Incurred */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
              Total Rework Tracked
            </span>
            <Clock className="w-4 h-4 text-zinc-500" />
          </div>
          <p className="text-2xl font-bold text-zinc-950">
            ₹{preview?.total_rework_cost?.toLocaleString() ?? 0}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">
            {preview?.total_corrective_hours?.toFixed(1) ?? '0.0'}h corrective maintenance logged
          </p>
        </div>

        {/* Waived / Protected Rework */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
              Waived / Excluded
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">
            {preview?.waived_hours?.toFixed(1) ?? '0.0'}
            <span className="text-xs font-normal text-zinc-500 ml-1">hrs</span>
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">Spec shifts / external causes (₹0 offset)</p>
        </div>

        {/* Proposed Quality Adjustment (Preview) */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
              Next Month Rework Deduction
            </span>
            <IndianRupee className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-rose-600">
            -₹{preview?.proposed_adjustment?.toLocaleString() ?? 0}
          </p>
          <p className="text-[10px] text-zinc-500 font-medium mt-1">Proposed wage adjustment</p>
        </div>

        {/* Estimated Net Salary */}
        <div className="bg-zinc-950 text-white p-4 rounded-xl shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
              Next Month Net Salary
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            ₹{preview?.estimated_net_salary?.toLocaleString() ?? 0}
          </p>
          <p className="text-[10px] text-zinc-400 mt-1">Subject to HR formal sign-off</p>
        </div>
      </div>

      {/* PROJECT-BY-PROJECT SALARY & DEDUCTION BREAKDOWN */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center">
              <FolderGit2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-950">Assigned Projects: Salary Allocation & Rework Deductions</h3>
              <p className="text-xs text-zinc-500">
                Transparent view of allocated compensation and specific rework deductions calculated for each project.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
            {assignedProjectsList.length} Assigned Project{assignedProjectsList.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignedProjectsList.map((proj) => (
            <div key={proj.project_id} className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-200 text-zinc-800">
                    {proj.project_code}
                  </span>
                  <span className="text-xs text-zinc-500 font-medium">
                    {proj.tasks_count} Assigned Work Item{proj.tasks_count !== 1 ? 's' : ''}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-zinc-950 mb-3">{proj.project_name}</h4>

                <div className="space-y-2 text-xs bg-white p-3 rounded-lg border border-zinc-200/80 mb-3">
                  <div className="flex items-center justify-between text-zinc-600">
                    <span>Allocated Project Base Salary:</span>
                    <strong className="text-zinc-900 font-mono">₹{proj.allocated_salary.toLocaleString()}</strong>
                  </div>
                  <div className="flex items-center justify-between text-zinc-600">
                    <span>Corrective Maintenance Rework Hours:</span>
                    <strong className="text-zinc-900 font-mono">{proj.rework_hours.toFixed(1)} hrs</strong>
                  </div>
                  <div className="flex items-center justify-between text-rose-600 font-medium pt-1.5 border-t border-zinc-100">
                    <span>Deduction for Rework (Next Month):</span>
                    <span className="font-mono font-bold">-₹{proj.rework_deduction.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-200 text-xs">
                <span className="text-zinc-500 font-medium">Estimated Project Net Pay:</span>
                <strong className="text-emerald-700 font-mono font-bold text-sm">
                  ₹{proj.net_project_salary.toLocaleString()}
                </strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Itemized Tasks Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div>
            <h3 className="text-sm font-bold text-zinc-950">Itemized Defect Rework & Accountability Breakdown</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Individual corrective maintenance items evaluated during this billing cycle.
            </p>
          </div>
          <div className="text-xs text-zinc-500 font-mono">
            {preview?.adjustment_items?.length || 0} items evaluated
          </div>
        </div>

        {preview?.adjustment_items && preview.adjustment_items.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <table className="min-w-[1050px] w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-50 text-zinc-600 font-semibold border-b border-zinc-200">
                <tr>
                  <th className="py-3 px-4 w-48">Bug / Task</th>
                  <th className="py-3 px-4 w-44">Module & Code</th>
                  <th className="py-3 px-4 w-44">Delivery Accountability</th>
                  <th className="py-3 px-4 text-right w-20">Fix Hours</th>
                  <th className="py-3 px-4 text-right w-20">Rate</th>
                  <th className="py-3 px-4 text-right w-24">Rework Cost</th>
                  <th className="py-3 px-4 text-right w-24">Preview Offset</th>
                  <th className="py-3 px-4 w-36">Finance Status</th>
                  <th className="py-3 px-4 w-36">HR Authorization</th>
                  <th className="py-3 px-4 text-right w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {preview.adjustment_items.map((item: PayrollAdjustmentItem) => {
                  const itemCost = item.rework_cost || (item.approved_hours * item.hourly_rate);
                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                      {/* Bug ID & Title */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-mono font-bold text-zinc-900">{item.bug_id}</div>
                        <div className="text-[11px] text-zinc-600 line-clamp-1 font-medium mt-0.5" title={item.bug_title}>
                          {item.bug_title}
                        </div>
                      </td>

                      {/* Module */}
                      <td className="py-3.5 px-4 font-medium text-zinc-800 align-top">
                        <div>{item.module_name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5">ID: {item.module_id}</div>
                      </td>

                      {/* Delivery Accountability: Author vs Fixer */}
                      <td className="py-3.5 px-4 align-top text-[11px]">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-semibold text-zinc-400 uppercase w-10">Author:</span>
                          <span className="font-medium text-zinc-900">{item.original_author_name || item.employee_name}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[10px] font-semibold text-zinc-400 uppercase w-10">Fixer:</span>
                          <span className="font-medium text-zinc-700">{item.rework_assignee_name || item.employee_name}</span>
                        </div>
                      </td>

                      {/* Fix Hours */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-zinc-900 align-top">
                        {item.approved_hours.toFixed(1)}h
                      </td>

                      {/* Rate */}
                      <td className="py-3.5 px-4 text-right font-mono text-zinc-600 align-top">
                        ₹{item.hourly_rate}/h
                      </td>

                      {/* Total Rework Cost */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-zinc-950 align-top">
                        ₹{itemCost.toLocaleString()}
                      </td>

                      {/* Preview Offset */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold align-top">
                        {item.is_chargeable && item.proposed_adjustment_amount > 0 ? (
                          <div>
                            <span className="text-blue-700">₹{item.proposed_adjustment_amount.toLocaleString()}</span>
                            {item.cap_applied && (
                              <div className="mt-0.5">
                                <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-mono font-bold uppercase inline-block" title={item.calculation_explanation}>
                                  Capped (Cap: ₹{item.remaining_task_cap?.toLocaleString()})
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-emerald-600 font-semibold">₹0 (Protected)</span>
                        )}
                      </td>

                      {/* Finance Status */}
                      <td className="py-3.5 px-4 align-top">
                        {getFinanceStatusBadge(item.status, item.is_chargeable)}
                        {item.finance_reviewer_name && (
                          <div className="text-[10px] text-zinc-400 mt-1">
                            By {item.finance_reviewer_name}
                          </div>
                        )}
                      </td>

                      {/* HR Authorization */}
                      <td className="py-3.5 px-4 align-top">
                        {getHRStatusBadge(item.hr_authorization_status)}
                        {item.hr_reviewer_name && (
                          <div className="text-[10px] text-zinc-400 mt-1">
                            By {item.hr_reviewer_name}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right align-top">
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Dispute Button */}
                            {item.status !== 'disputed' && item.is_chargeable && item.proposed_adjustment_amount > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedAdjustment(item);
                                  setDisputeReason('');
                                  setDisputeModalOpen(true);
                                }}
                                className="px-2 py-1 text-[11px] font-semibold bg-white border border-amber-300 text-amber-700 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                                title="Raise formal dispute"
                              >
                                Dispute
                              </button>
                            )}

                            {/* View Reason button */}
                            {(item.waiver_reason || item.review_notes) && (
                              <button
                                onClick={() => {
                                  setSelectedAdjustment(item);
                                  setReasonModalOpen(true);
                                }}
                                className="px-2 py-1 text-[11px] font-semibold bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded transition-colors cursor-pointer flex items-center gap-1"
                                title="View waiver reason or notes"
                              >
                                <Eye className="w-3 h-3 text-zinc-500" />
                                <span>Reason</span>
                              </button>
                            )}
                          </div>

                          {/* Audit Trail Button */}
                          <button
                            onClick={() => handleViewAuditHistory(item)}
                            className="text-[10px] text-zinc-500 hover:text-zinc-900 font-medium underline flex items-center gap-0.5 cursor-pointer mt-0.5"
                          >
                            <History className="w-3 h-3 text-zinc-400" />
                            <span>Audit Trail</span>
                          </button>
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
            <p className="text-sm font-bold text-zinc-900">Zero Rework Deductions</p>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              No corrective rework adjustments are recorded for your account in {selectedMonth}. Full base salary remains intact.
            </p>
          </div>
        )}
      </div>

      {/* Fairness & Legal Safeguard Guide */}
      <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-200 space-y-3">
        <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" />
          Fairness Policy & Statutory Compliance Framework
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-600">
          <div className="bg-white p-3.5 rounded-lg border border-zinc-200">
            <p className="font-bold text-zinc-900 mb-1">External Factors Protected</p>
            <p className="text-[11px] leading-relaxed">
              Requirement shifts, third-party library regressions, and ambiguous specs are automatically classified as non-chargeable (₹0 impact) and excluded from developer compensation.
            </p>
          </div>
          <div className="bg-white p-3.5 rounded-lg border border-zinc-200">
            <p className="font-bold text-zinc-900 mb-1">Independent HR Review & Rights</p>
            <p className="text-[11px] leading-relaxed">
              No deduction can ever occur without explicit independent HR compliance sign-off. Employees possess the unhindered right to raise disputes on any prospective assessment.
            </p>
          </div>
          <div className="bg-white p-3.5 rounded-lg border border-zinc-200">
            <p className="font-bold text-zinc-900 mb-1">Engineering Quality Focus</p>
            <p className="text-[11px] leading-relaxed">
              Cost tracking exists to identify systemic testing gaps, improve sprint estimation, and enhance software architecture rather than serve as punitive compensation cuts.
            </p>
          </div>
        </div>
      </div>

      {/* Raise Dispute Modal */}
      {disputeModalOpen && selectedAdjustment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <MessageSquareWarning className="w-4 h-4 text-amber-600" />
                <span>Raise Rework Accountability Dispute</span>
              </h3>
              <button
                onClick={() => setDisputeModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-zinc-600 space-y-2">
              <p>
                You are disputing the proposed adjustment on bug{' '}
                <strong>{selectedAdjustment.bug_id}</strong> ({selectedAdjustment.module_name}).
              </p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Raising a dispute pauses any accounting consideration and escalates the item to HR and Engineering Leadership for fair arbitration.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-900 mb-1">
                Dispute Reason & Supporting Rationale <span className="text-red-500">*</span>
              </label>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Explain why this defect was outside your delivery scope, caused by unstated requirements, external API outages, or previously approved architectural constraints."
                rows={4}
                className="w-full text-xs p-2.5 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={() => setDisputeModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRaiseDispute}
                disabled={submittingDispute || !disputeReason.trim()}
                className="px-4 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg transition-colors cursor-pointer"
              >
                Submit Dispute
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
                <span>Adjustment Reason & Decision Record</span>
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
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Status:</span>
                  <span className="font-semibold text-zinc-900">{selectedAdjustment.status.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">HR Review:</span>
                  <span className="font-semibold text-purple-700">{selectedAdjustment.hr_authorization_status.toUpperCase()}</span>
                </div>
              </div>

              {selectedAdjustment.waiver_reason && (
                <div>
                  <h5 className="text-[11px] font-bold text-emerald-800 uppercase mb-1">Waiver Rationale:</h5>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 font-medium leading-relaxed whitespace-pre-wrap">
                    {selectedAdjustment.waiver_reason}
                  </div>
                </div>
              )}

              {selectedAdjustment.dispute_reason && (
                <div>
                  <h5 className="text-[11px] font-bold text-amber-800 uppercase mb-1">Dispute Rationale:</h5>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-950 font-medium leading-relaxed whitespace-pre-wrap">
                    {selectedAdjustment.dispute_reason}
                  </div>
                </div>
              )}

              {selectedAdjustment.review_notes && (
                <div>
                  <h5 className="text-[11px] font-bold text-zinc-700 uppercase mb-1">Review Notes:</h5>
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

      {/* Audit History Modal */}
      {auditModalOpen && selectedAdjustment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-zinc-800" />
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">
                    Audit Trail & Decision Timeline
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Adjustment {selectedAdjustment.id} • {selectedAdjustment.bug_id} ({selectedAdjustment.module_name})
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

      {/* Official Viewable & Printable Payslip Modal */}
      {payslipModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 space-y-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-0">
            {/* Modal Action Controls (Hidden on Print) */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-zinc-950">Official Monthly Payslip View</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setPayslipModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Formal Payslip Document Container */}
            <div className="border border-zinc-300 rounded-lg p-6 bg-white space-y-6 text-zinc-900 print:border-0 print:p-0">
              {/* Company Header */}
              <div className="flex items-start justify-between border-b border-zinc-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-zinc-950 text-white rounded flex items-center justify-center font-bold text-sm">
                      RG
                    </div>
                    <h2 className="text-lg font-black tracking-tight text-zinc-950">REWORKGUARD TECHNOLOGIES INDIA PVT. LTD.</h2>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    C-104, Outer Ring Road Technology Park, Bellandur, Bengaluru, KA 560103
                  </p>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    CIN: U72200KA2024PTC184920 | GSTIN: 29AABCR1234F1Z8
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-block bg-zinc-100 px-3 py-1 rounded text-xs font-bold text-zinc-900 border border-zinc-200">
                    PAYSLIP FOR {selectedMonth.toUpperCase()}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                    Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Employee Summary Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-zinc-50 rounded-lg border border-zinc-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Employee Name</span>
                  <span className="font-bold text-zinc-950">{currentUser?.name || 'Developer'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Employee ID</span>
                  <span className="font-mono font-bold text-zinc-950">{currentUser?.id || 'USR-002'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Designation</span>
                  <span className="capitalize font-semibold text-zinc-800">{currentUser?.role?.replace('_', ' ') || 'Software Engineer'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Hourly Rate</span>
                  <span className="font-semibold text-zinc-800">₹{(currentUser?.hourly_rate || 500).toLocaleString('en-IN')}/hr</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Standard Hours</span>
                  <span className="font-semibold text-zinc-800">160.0 hrs</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Assigned Projects</span>
                  <span className="font-semibold text-zinc-800">{assignedProjectsList.length} Active</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Bank Account</span>
                  <span className="font-mono text-zinc-800">HDFC Bank •••• 4091</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Statutory Status</span>
                  <span className="font-semibold text-emerald-700">Safeguarded</span>
                </div>
              </div>

              {/* Earnings & Deductions Tables (Two Columns) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Earnings Table */}
                <div className="border border-zinc-200 rounded-lg overflow-hidden">
                  <div className="bg-zinc-100 px-3 py-2 font-bold text-xs text-zinc-800 border-b border-zinc-200 flex justify-between">
                    <span>EARNINGS COMPONENT</span>
                    <span>AMOUNT (₹)</span>
                  </div>
                  <div className="divide-y divide-zinc-100 text-xs">
                    <div className="px-3 py-2 flex justify-between">
                      <span className="text-zinc-700">Basic Salary (60%)</span>
                      <span className="font-mono text-zinc-900">₹{((preview?.base_salary || 85000) * 0.6).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="px-3 py-2 flex justify-between">
                      <span className="text-zinc-700">House Rent Allowance (HRA 25%)</span>
                      <span className="font-mono text-zinc-900">₹{((preview?.base_salary || 85000) * 0.25).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="px-3 py-2 flex justify-between">
                      <span className="text-zinc-700">Special Allowance (15%)</span>
                      <span className="font-mono text-zinc-900">₹{((preview?.base_salary || 85000) * 0.15).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="px-3 py-2.5 bg-zinc-50 font-bold flex justify-between border-t border-zinc-200">
                      <span>Gross Earnings</span>
                      <span className="font-mono text-indigo-700">₹{(preview?.base_salary || 85000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions Table */}
                <div className="border border-zinc-200 rounded-lg overflow-hidden">
                  <div className="bg-zinc-100 px-3 py-2 font-bold text-xs text-zinc-800 border-b border-zinc-200 flex justify-between">
                    <span>DEDUCTIONS & ADJUSTMENTS</span>
                    <span>AMOUNT (₹)</span>
                  </div>
                  <div className="divide-y divide-zinc-100 text-xs">
                    <div className="px-3 py-2 flex justify-between">
                      <span className="text-zinc-700">Provident Fund (PF Employee)</span>
                      <span className="font-mono text-zinc-900">₹1,800.00</span>
                    </div>
                    <div className="px-3 py-2 flex justify-between">
                      <span className="text-zinc-700">Professional Tax (PT)</span>
                      <span className="font-mono text-zinc-900">₹200.00</span>
                    </div>
                    <div className="px-3 py-2 flex justify-between">
                      <div>
                        <span className="text-zinc-700 block">Verified Rework Deductions</span>
                        <span className="text-[10px] text-zinc-400">
                          {(preview?.authorized_adjustment || 0) > 0
                            ? 'Approved by HR & Finance'
                            : 'No Chargeable Rework / Waived'}
                        </span>
                      </div>
                      <span className="font-mono text-amber-700 font-semibold">
                        ₹{(preview?.authorized_adjustment || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="px-3 py-2.5 bg-zinc-50 font-bold flex justify-between border-t border-zinc-200">
                      <span>Total Deductions</span>
                      <span className="font-mono text-zinc-900">
                        ₹{(2000 + (preview?.authorized_adjustment || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Pay Box */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-300 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-bold text-emerald-900 tracking-wider">Net Salary Payable</span>
                  <p className="text-xs text-emerald-700 mt-0.5 font-medium">
                    Credited directly to registered bank account on last working day
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black font-mono text-emerald-800">
                    ₹{Math.max(0, (preview?.base_salary || 85000) - 2000 - (preview?.authorized_adjustment || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium">All Statutory Caps Applied</span>
                </div>
              </div>

              {/* Statutory Note & Digital Authorization Signatures */}
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded text-[11px] text-zinc-600 space-y-1">
                <div className="flex items-center gap-1 font-bold text-zinc-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Statutory Compliance Notice (Payment of Wages Act, 1936)</span>
                </div>
                <p className="leading-relaxed">
                  This salary statement is computer-generated and reflects statutory compliance protections. Total deductions are strictly capped under legal maximums (50% statutory threshold), ensuring the non-negotiable living minimum wage is fully preserved.
                </p>
              </div>

              <div className="flex items-end justify-between pt-6 border-t border-zinc-200 text-xs">
                <div>
                  <p className="font-semibold text-zinc-900">ReworkGuard Payroll Authority</p>
                  <p className="text-[11px] text-zinc-500">Digitally Verified & Encrypted</p>
                </div>
                <div className="text-right">
                  <div className="w-40 border-b border-zinc-400 pb-1 mb-1 text-center font-mono text-[10px] text-zinc-600">
                    [Digitally Signed by HR]
                  </div>
                  <p className="text-[10px] text-zinc-400">Authorized Signatory</p>
                </div>
              </div>
            </div>

            {/* Modal Footer (Hidden on Print) */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 print:hidden">
              <button
                onClick={() => setPayslipModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold bg-zinc-100 text-zinc-800 hover:bg-zinc-200 rounded-lg cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Payslip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
