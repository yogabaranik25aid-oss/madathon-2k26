import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Review, Bug, User, RootCauseCategory, ReviewDecision, TimeEntry } from '../../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { FormField, Input, Textarea, Select } from '../components/common/FormControls';
import { StatusBadge } from '../components/common/StatusBadge';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { RootCauseBadge } from '../components/common/RootCauseBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { useToast } from '../components/common/Toast';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  RotateCcw,
  UserCheck,
  Search,
  Filter,
  History,
  Info,
  Scale,
  Send,
  FileCode,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

// INR Currency Formatter
export const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val || 0);
};

export const ManagerReviewsPage: React.FC = () => {
  const { currentUser, users, refreshReviewCount, selectedBugId, setSelectedBugId } = useApp();
  const { addToast } = useToast();

  const [pendingBugs, setPendingBugs] = useState<Bug[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active view tab: Stage A (Initial Review) vs Stage D (Accounting Review) vs History
  const [activeTab, setActiveTab] = useState<'stage_a' | 'stage_d' | 'history'>('stage_a');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Stage A Modal State (Initial Bug Review and Rework Assignment)
  const [stageABug, setStageABug] = useState<Bug | null>(null);
  const [stageARootCause, setStageARootCause] = useState<RootCauseCategory>('code_defect');
  const [stageAManagerReason, setStageAManagerReason] = useState<string>('');
  const [stageAAssignedDevId, setStageAAssignedDevId] = useState<string>('');
  const [stageAReassignmentReason, setStageAReassignmentReason] = useState<string>('');
  const [stageADecision, setStageADecision] = useState<'approve_assign' | 'reject_reopen' | 'request_info'>('approve_assign');
  const [isSubmittingStageA, setIsSubmittingStageA] = useState(false);
  const [stageAError, setStageAError] = useState<string | null>(null);

  // Stage D Modal State (Manager Accounting Review)
  const [stageDBug, setStageDBug] = useState<Bug | null>(null);
  const [stageDDecision, setStageDDecision] = useState<ReviewDecision>('approved_for_accounting');
  const [stageDExplanation, setStageDExplanation] = useState<string>('');
  const [stageDTimeEntries, setStageDTimeEntries] = useState<TimeEntry[]>([]);
  const [loadingTimeEntries, setLoadingTimeEntries] = useState(false);
  const [isSubmittingStageD, setIsSubmittingStageD] = useState(false);
  const [stageDError, setStageDError] = useState<string | null>(null);

  // Individual Bug History Modal State
  const [historyModalBug, setHistoryModalBug] = useState<Bug | null>(null);
  const [bugReviewHistory, setBugReviewHistory] = useState<Review[]>([]);
  const [loadingBugHistory, setLoadingBugHistory] = useState(false);

  // Authorization check: Only authorized managers can submit reviews
  const isAuthorizedManager = currentUser?.role === 'manager' || currentUser?.role === 'admin';

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pendingData, reviewsData] = await Promise.all([
        api.getPendingReviews(),
        api.getReviews(),
      ]);
      setPendingBugs(pendingData);
      setAllReviews(reviewsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load manager reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Stage A bugs: Newly reported bugs awaiting initial manager triage & rework assignment
  const stageABugs = pendingBugs.filter(b => 
    b.classification_status === 'pending_manager_review' || 
    (!b.initial_review_decision && b.status !== 'review_pending' && b.status !== 'fixed')
  );

  // Stage D bugs: Defect fixes submitted by developers awaiting managerial accounting review
  const stageDBugs = pendingBugs.filter(b => 
    b.status === 'review_pending' || 
    b.status === 'fixed' || 
    (b.classification_status === 'confirmed_defect' && b.initial_review_decision === 'approve_assign' && (Number(b.corrective_hours) > 0 || b.review_status === 'pending' || b.review_status === 'disputed'))
  );

  // Open Stage A Modal (Initial Review & Assignment)
  const handleOpenStageAModal = (bug: Bug) => {
    setStageABug(bug);
    setStageAError(null);
    setStageARootCause((bug.root_cause as RootCauseCategory) || 'code_defect');
    setStageAManagerReason(bug.manager_review_reason || bug.classification_notes || '');
    setStageAAssignedDevId(bug.assigned_to_id || bug.original_author_id || bug.original_module_owner_id || 'usr-2');
    setStageAReassignmentReason('');
    setStageADecision('approve_assign');
  };

  // Open Stage D Modal (Accounting Review)
  const handleOpenStageDModal = async (bug: Bug) => {
    setStageDBug(bug);
    setStageDError(null);
    if (bug.review_status === 'waived') {
      setStageDDecision('waived');
    } else if (bug.review_status === 'disputed') {
      setStageDDecision('disputed');
    } else {
      setStageDDecision('approved_for_accounting');
    }
    setStageDExplanation('');
    setLoadingTimeEntries(true);
    try {
      const entries = await api.getTimeEntries(bug.id);
      setStageDTimeEntries(entries);
    } catch {
      setStageDTimeEntries([]);
    } finally {
      setLoadingTimeEntries(false);
    }
  };

  // Open Bug Review History Modal
  const handleOpenBugHistory = async (bug: Bug) => {
    setHistoryModalBug(bug);
    setLoadingBugHistory(true);
    try {
      const history = await api.getBugReviews(bug.id);
      setBugReviewHistory(history);
    } catch {
      setBugReviewHistory([]);
    } finally {
      setLoadingBugHistory(false);
    }
  };

  // Auto-open modal when selectedBugId is passed from notification or other pages
  useEffect(() => {
    if (selectedBugId && pendingBugs.length > 0) {
      const targetBug = pendingBugs.find(b => b.id === selectedBugId);
      if (targetBug) {
        const isStageA = targetBug.classification_status === 'pending_manager_review' || 
          (!targetBug.initial_review_decision && targetBug.status !== 'review_pending' && targetBug.status !== 'fixed');
        if (isStageA) {
          setActiveTab('stage_a');
          handleOpenStageAModal(targetBug);
        } else {
          setActiveTab('stage_d');
          handleOpenStageDModal(targetBug);
        }
        if (setSelectedBugId) setSelectedBugId(null);
      }
    }
  }, [selectedBugId, pendingBugs, setSelectedBugId]);

  // Submit Stage A Initial Review
  const handleSubmitStageA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageABug) return;
    setStageAError(null);

    if (!isAuthorizedManager) {
      setStageAError('Unauthorized: Only authorized managers can review defects and assign rework.');
      return;
    }

    if (!stageAManagerReason.trim()) {
      setStageAError('Mandatory manager review reason is required.');
      return;
    }

    if (stageADecision === 'approve_assign' && stageAAssignedDevId && stageAAssignedDevId !== stageABug.original_author_id && !stageAReassignmentReason.trim()) {
      setStageAError('A justification is required when reassigning rework to a different engineer.');
      return;
    }

    setIsSubmittingStageA(true);
    try {
      await api.initialReviewBug(stageABug.id, {
        decision: stageADecision,
        root_cause: stageARootCause,
        reason: stageAManagerReason.trim(),
        assigned_to_id: stageAAssignedDevId || undefined,
        reassignment_reason: stageAReassignmentReason.trim() || undefined,
      });

      addToast({
        type: stageADecision === 'approve_assign' ? 'success' : 'info',
        title: stageADecision === 'approve_assign' ? 'Rework Approved & Assigned' : 'Initial Review Recorded',
        message: stageADecision === 'approve_assign' 
          ? `Defect ${stageABug.id} approved. Module reopened and assigned for corrective maintenance.` 
          : `Defect ${stageABug.id} review recorded with decision: ${stageADecision.replace('_', ' ')}.`,
      });

      setStageABug(null);
      await refreshReviewCount();
      await fetchData();
    } catch (err: any) {
      setStageAError(err.message || 'Failed to submit initial review.');
    } finally {
      setIsSubmittingStageA(false);
    }
  };

  // Submit Stage D Accounting Review
  const handleSubmitStageD = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageDBug) return;
    setStageDError(null);

    if (!isAuthorizedManager) {
      setStageDError('Unauthorized: Only authorized managers can submit accounting review decisions.');
      return;
    }

    if ((stageDDecision === 'waived' || stageDDecision === 'disputed') && !stageDExplanation.trim()) {
      setStageDError(`A detailed explanation is required when selecting "${stageDDecision === 'waived' ? 'Waived' : 'Disputed'}".`);
      return;
    }

    setIsSubmittingStageD(true);
    try {
      await api.submitBugReview(stageDBug.id, {
        manager_id: currentUser?.id || 'usr-1',
        root_cause: stageDBug.root_cause || 'code_defect',
        decision: stageDDecision,
        comments: stageDExplanation.trim(),
        explanation: stageDExplanation.trim(),
      });

      addToast({
        type: stageDDecision === 'approved_for_accounting' ? 'success' : stageDDecision === 'waived' ? 'info' : 'warning',
        title: 'Accounting Decision Recorded',
        message: `${stageDBug.id} accounting decision recorded as "${stageDDecision.replace(/_/g, ' ').toUpperCase()}".`,
      });

      setStageDBug(null);
      await refreshReviewCount();
      await fetchData();
    } catch (err: any) {
      setStageDError(err.message || 'Failed to submit accounting review decision.');
    } finally {
      setIsSubmittingStageD(false);
    }
  };

  // Filtered bugs
  const filterBugs = (bugs: Bug[]) => {
    return bugs.filter((b) => {
      const matchesSearch =
        b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.title && b.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.module_name && b.module_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.original_author_name && b.original_author_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.assigned_to_name && b.assigned_to_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' ||
        b.review_status === statusFilter ||
        b.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  };

  const filteredStageABugs = filterBugs(stageABugs);
  const filteredStageDBugs = filterBugs(stageDBugs);

  const filteredHistory = allReviews.filter((r) => {
    return (
      r.bug_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.bug_title && r.bug_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.manager_name && r.manager_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.comments && r.comments.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Two-Stage Tab Navigation */}
      <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-950">Manager Review & Accountability Ledger</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Two distinct stages: Stage A Initial Defect Triage & Assignment vs. Stage D Final Accounting Review.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 bg-zinc-100 p-1.5 rounded-lg border border-zinc-200 text-xs">
          <button
            onClick={() => setActiveTab('stage_a')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              activeTab === 'stage_a'
                ? 'bg-zinc-950 text-white font-semibold shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            Stage A: Initial Assignment ({stageABugs.length})
          </button>
          <button
            onClick={() => setActiveTab('stage_d')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              activeTab === 'stage_d'
                ? 'bg-zinc-950 text-white font-semibold shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            Stage D: Post-Fix Review ({stageDBugs.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-zinc-950 text-white font-semibold shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            Review History & Audit ({allReviews.length})
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Fairness & Governance Banner */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col sm:flex-row items-start gap-3.5 text-xs text-zinc-600">
        <Scale className="w-5 h-5 text-zinc-800 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-zinc-900 flex items-center gap-2">
            Two-Stage Engineering Accountability & Wage Protection Guidelines
          </div>
          <p className="text-zinc-600 leading-relaxed">
            • <strong>Stage A Separation:</strong> Initial review assigns rework without approving accounting deductions. Reopening increments module reopen count while preserving original delivery author provenance.<br />
            • <strong>Stage D Post-Fix Review:</strong> Accounting decisions (Approved for Accounting, Waived, Disputed, Pending) are evaluated strictly <em>after</em> the engineer submits the completed fix and logged hours.<br />
            • <strong>Cost Integrity:</strong> Waived rework items excuse financial deduction previews but permanently preserve logged engineering hours in quality metrics.<br />
            • <strong>Non-Chargeable Categories:</strong> Scope changes and third-party API outages are classified as non-chargeable.
          </p>
        </div>
      </div>

      {/* Role authorization warning if non-manager is active */}
      {!isAuthorizedManager && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              You are currently viewing as <strong>{currentUser?.name || 'Developer'}</strong> ({currentUser?.role}). 
              Review decision submissions require authorized Manager credentials.
            </span>
          </div>
          <span className="text-[11px] font-medium text-amber-700 underline">
            Switch persona to Sarah Connor (Manager) in top bar
          </span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <Input
            placeholder="Search bug ID, description, module, original author, fixer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingSpinner message="Loading review queue and defect history..." />
      ) : activeTab === 'stage_a' ? (
        /* ========================================================================= */
        /* STAGE A: INITIAL DEFECT REVIEW & REWORK ASSIGNMENT                       */
        /* ========================================================================= */
        filteredStageABugs.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No Defects Awaiting Initial Review"
            description="All client-reported bugs have been classified and assigned for corrective maintenance."
          />
        ) : (
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5">Defect ID</th>
                    <th className="py-3 px-3.5">Module & Severity</th>
                    <th className="py-3 px-3.5">Original Delivery Author</th>
                    <th className="py-3 px-3.5">Client Report</th>
                    <th className="py-3 px-3.5">Classification Status</th>
                    <th className="py-3 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredStageABugs.map((bug) => (
                    <tr key={bug.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3 px-3.5 whitespace-nowrap font-mono font-bold text-zinc-950">
                        {bug.id}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-semibold text-zinc-900">{bug.module_name || bug.module_code}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <SeverityBadge severity={bug.severity} />
                          <span className="text-[10px] text-zinc-400 font-mono">{bug.module_code}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-medium text-zinc-900">
                          {bug.original_author_name || bug.original_module_owner_name || 'N/A'}
                        </div>
                        <span className="text-[10px] text-zinc-400">Provenance Author</span>
                      </td>
                      <td className="py-3 px-3.5 max-w-xs truncate text-zinc-600">
                        <div className="font-medium text-zinc-900 truncate">{bug.title}</div>
                        <div className="text-[11px] text-zinc-500 truncate">{bug.description}</div>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Awaiting Initial Triage
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap space-x-1.5">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleOpenStageAModal(bug)}
                          className="text-[11px] py-1 px-2.5 bg-amber-600 hover:bg-amber-700 text-white"
                          leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                        >
                          Review & Assign Rework
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenBugHistory(bug)}
                          className="text-[11px] py-1 px-2 text-zinc-600"
                        >
                          History
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : activeTab === 'stage_d' ? (
        /* ========================================================================= */
        /* STAGE D: POST-FIX MANAGER ACCOUNTING REVIEW                              */
        /* ========================================================================= */
        filteredStageDBugs.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No Completed Fixes Awaiting Accounting Review"
            description="Submitted rework fixes have been reviewed and verified for accounting qualification."
          />
        ) : (
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5">Defect ID</th>
                    <th className="py-3 px-3.5">Module</th>
                    <th className="py-3 px-3.5">Original Owner</th>
                    <th className="py-3 px-3.5">Fixing Developer</th>
                    <th className="py-3 px-3.5 text-right">Corrective Hours</th>
                    <th className="py-3 px-3.5 text-right">Rework Cost</th>
                    <th className="py-3 px-3.5">Fix Status</th>
                    <th className="py-3 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredStageDBugs.map((bug) => (
                    <tr key={bug.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3 px-3.5 whitespace-nowrap font-mono font-bold text-zinc-950">
                        {bug.id}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-semibold text-zinc-900">{bug.module_name || bug.module_code}</div>
                        <div className="text-[11px] text-zinc-500 font-mono">{bug.module_code}</div>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-medium text-zinc-900">
                          {bug.original_author_name || bug.original_module_owner_name || 'N/A'}
                        </div>
                        <span className="text-[10px] text-zinc-400">Original Author</span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-medium text-zinc-900">
                          {bug.assigned_to_name || 'Unassigned'}
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {formatINR(bug.hourly_rate)}/hr
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-medium text-zinc-800 whitespace-nowrap">
                        {bug.corrective_hours} hrs
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-zinc-950 whitespace-nowrap">
                        {formatINR(bug.rework_cost)}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <StatusBadge status={bug.status === 'review_pending' ? 'review_pending' : bug.review_status} type="review" />
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap space-x-1.5">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleOpenStageDModal(bug)}
                          className="text-[11px] py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                          leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                        >
                          Accounting Review
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenBugHistory(bug)}
                          className="text-[11px] py-1 px-2 text-zinc-600"
                        >
                          History
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* ========================================================================= */
        /* TAB 3: REVIEW HISTORY & AUDIT TRAIL                                      */
        /* ========================================================================= */
        filteredHistory.length === 0 ? (
          <EmptyState
            icon={History}
            title="No Review History Found"
            description="There are no recorded review decisions matching your search query."
          />
        ) : (
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5">Reviewer</th>
                    <th className="py-3 px-3.5">Defect ID & Module</th>
                    <th className="py-3 px-3.5">Decision</th>
                    <th className="py-3 px-3.5">Root Cause</th>
                    <th className="py-3 px-3.5">Reason / Explanation</th>
                    <th className="py-3 px-3.5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredHistory.map((rev) => (
                    <tr key={rev.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-semibold text-zinc-950 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-zinc-600" />
                          {rev.manager_name || 'Manager'}
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono">Review ID: {rev.id}</span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-zinc-900">{rev.bug_id}</div>
                        <div className="text-[11px] text-zinc-500">{rev.module_name || 'Module'}</div>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <StatusBadge status={rev.decision || rev.status} type="review" />
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <RootCauseBadge cause={rev.root_cause || 'code_defect'} />
                      </td>
                      <td className="py-3 px-3.5 text-zinc-700 max-w-sm leading-relaxed">
                        {rev.comments || rev.explanation || rev.review_notes || (
                          <span className="text-zinc-400 italic">No notes recorded</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono text-zinc-500 whitespace-nowrap">
                        {new Date(rev.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ======================================================================= */}
      {/* STAGE A MODAL: INITIAL DEFECT REVIEW & REWORK ASSIGNMENT                */}
      {/* Strictly NO accounting options shown here!                              */}
      {/* ======================================================================= */}
      {stageABug && (
        <Modal
          isOpen={!!stageABug}
          onClose={() => setStageABug(null)}
          title={`Stage A: Initial Defect Review & Rework Assignment: ${stageABug.id}`}
          subtitle="Review client bug report, verify defect provenance, and assign corrective maintenance"
          maxWidth="xl"
        >
          <form onSubmit={handleSubmitStageA} className="space-y-4">
            {stageAError && <ErrorAlert message={stageAError} />}

            {/* Bug Metadata Header Card */}
            <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-2">
                <div>
                  <span className="font-bold text-zinc-950 text-sm">
                    {stageABug.title || stageABug.id}
                  </span>
                  <div className="text-zinc-500 text-[11px] mt-0.5">
                    Module: <strong>{stageABug.module_name || stageABug.module_code}</strong> ({stageABug.module_code})
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={stageABug.severity} />
                  <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    NEW CLIENT REPORT
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div>
                  <span className="text-zinc-400 block font-medium">Original Delivery Employee</span>
                  <strong className="text-zinc-900">{stageABug.original_author_name || stageABug.original_module_owner_name || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-zinc-400 block font-medium">Original Task Link</span>
                  <strong className="text-zinc-900">{stageABug.original_task_title || stageABug.original_task_id || 'Delivered Task'}</strong>
                </div>
              </div>

              <div className="text-[11px] text-zinc-600 bg-white p-2.5 rounded border border-zinc-200">
                <span className="font-semibold text-zinc-800 block mb-0.5">Reported Defect Description:</span>
                {stageABug.description}
              </div>
            </div>

            {/* 1. Root Cause Category */}
            <FormField 
              label="Root-Cause Category" 
              required 
              hint="Select the verified technical or business origin of this issue"
            >
              <Select
                value={stageARootCause}
                onChange={(e) => setStageARootCause(e.target.value as RootCauseCategory)}
                required
              >
                <option value="code_defect">Code Defect (Internal engineering error or logic omission)</option>
                <option value="requirement_change">Requirement Misunderstanding (Specification or requirement ambiguity)</option>
                <option value="unclear_specification">New Client Scope (Scope alteration requested post-delivery)</option>
                <option value="external_dependency">External Dependency / API Issue (Third-party library, API, or service failure)</option>
                <option value="other">Other (Process gap, operational mishap, or unclassified)</option>
              </Select>
            </FormField>

            {/* Non-chargeable explanation callout */}
            {(stageARootCause === 'requirement_change' || stageARootCause === 'unclear_specification' || stageARootCause === 'external_dependency') && (
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Exempt Business Classification:</strong> Issues stemming from requirement shifts, external vendor failures, or new scope are not automatically classified as employee fault.
                </span>
              </div>
            )}

            {/* 2. Mandatory Manager Review Reason */}
            <FormField 
              label="Mandatory Manager Review Reason" 
              required 
              hint="Document technical triage findings, scope analysis, and justification"
            >
              <Textarea
                rows={3}
                value={stageAManagerReason}
                onChange={(e) => setStageAManagerReason(e.target.value)}
                placeholder="Explain the defect triage, root-cause verification, and justification for this rework decision..."
                required
              />
            </FormField>

            {/* 3. Assigned Corrective Developer */}
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>Corrective Developer Assignment</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Assign an authorized developer to perform corrective rework. Original delivery employee attribution is permanently preserved.
              </p>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Assigned Developer</label>
                <Select
                  value={stageAAssignedDevId}
                  onChange={(e) => setStageAAssignedDevId(e.target.value)}
                >
                  {users.filter(u => u.role === 'developer').map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.employee_id || u.id}) — {u.engineering_role || u.role}
                    </option>
                  ))}
                </Select>
              </div>

              {stageAAssignedDevId && stageAAssignedDevId !== stageABug.original_author_id && (
                <div>
                  <label className="block text-xs font-semibold text-amber-800 mb-1">
                    * Reassignment Justification (Required)
                  </label>
                  <Input
                    type="text"
                    value={stageAReassignmentReason}
                    onChange={(e) => setStageAReassignmentReason(e.target.value)}
                    placeholder="e.g. Original developer on leave; senior backend engineer assigned for critical fix"
                    required
                  />
                </div>
              )}
            </div>

            {/* 4. Decision Selection */}
            <FormField 
              label="Managerial Decision" 
              required 
              hint="Approve rework to reopen module and task, or reject request with preserved history"
            >
              <div className="grid grid-cols-1 gap-2 pt-1">
                <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                  stageADecision === 'approve_assign' 
                    ? 'border-amber-500 bg-amber-50/50 text-amber-950 ring-1 ring-amber-500' 
                    : 'border-zinc-200 hover:border-zinc-300'
                }`}>
                  <input
                    type="radio"
                    name="stageADecision"
                    value="approve_assign"
                    checked={stageADecision === 'approve_assign'}
                    onChange={() => setStageADecision('approve_assign')}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold block text-zinc-900">Approve & Assign Rework</span>
                    <span className="text-[11px] text-zinc-500">
                      Confirms genuine defect, reopens module and task, and assigns developer for corrective maintenance.
                    </span>
                  </div>
                </label>

                <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                  stageADecision === 'reject_reopen' 
                    ? 'border-zinc-500 bg-zinc-50 text-zinc-950 ring-1 ring-zinc-500' 
                    : 'border-zinc-200 hover:border-zinc-300'
                }`}>
                  <input
                    type="radio"
                    name="stageADecision"
                    value="reject_reopen"
                    checked={stageADecision === 'reject_reopen'}
                    onChange={() => setStageADecision('reject_reopen')}
                    className="mt-0.5 text-zinc-600 focus:ring-zinc-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold block text-zinc-900">Reject Reopen Request</span>
                    <span className="text-[11px] text-zinc-500">
                      Reopen request rejected; bug report and review history preserved in permanent ledger.
                    </span>
                  </div>
                </label>

                <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                  stageADecision === 'request_info' 
                    ? 'border-blue-500 bg-blue-50 text-blue-950 ring-1 ring-blue-500' 
                    : 'border-zinc-200 hover:border-zinc-300'
                }`}>
                  <input
                    type="radio"
                    name="stageADecision"
                    value="request_info"
                    checked={stageADecision === 'request_info'}
                    onChange={() => setStageADecision('request_info')}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold block text-zinc-900">Request More Information</span>
                    <span className="text-[11px] text-zinc-500">
                      Keep defect pending client clarification without starting rework timer.
                    </span>
                  </div>
                </label>
              </div>
            </FormField>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 pt-3 border-t border-zinc-200">
              <Button
                variant="outline"
                onClick={() => setStageABug(null)}
                disabled={isSubmittingStageA}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmittingStageA || !stageAManagerReason.trim()}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              >
                {isSubmittingStageA ? 'Processing...' : stageADecision === 'approve_assign' ? 'Approve & Assign Rework' : stageADecision === 'reject_reopen' ? 'Reject Reopen Request' : 'Request More Information'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================================================================= */}
      {/* STAGE D MODAL: FINAL MANAGER ACCOUNTING REVIEW (POST-FIX REVIEW)        */}
      {/* Shows the 4 accounting decisions only after fix is submitted!           */}
      {/* ======================================================================= */}
      {stageDBug && (
        <Modal
          isOpen={!!stageDBug}
          onClose={() => setStageDBug(null)}
          title={`Stage D: Final Manager Accounting Review: ${stageDBug.id}`}
          subtitle="Verify submitted fix, inspect logged corrective hours, and decide accounting eligibility"
          maxWidth="xl"
        >
          <form onSubmit={handleSubmitStageD} className="space-y-4">
            {stageDError && <ErrorAlert message={stageDError} />}

            {/* Review Context Card */}
            <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-2">
                <div>
                  <span className="font-bold text-zinc-950 text-sm">
                    {stageDBug.title || stageDBug.id}
                  </span>
                  <div className="text-zinc-500 text-[11px] mt-0.5">
                    Module: <strong>{stageDBug.module_name || stageDBug.module_code}</strong>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={stageDBug.severity} />
                  <RootCauseBadge cause={stageDBug.root_cause || 'code_defect'} />
                </div>
              </div>

              {/* Attribution Separation */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                <div>
                  <span className="text-zinc-400 block font-medium">Original Delivery Author</span>
                  <strong className="text-zinc-900">{stageDBug.original_author_name || stageDBug.original_module_owner_name || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-zinc-400 block font-medium">Fixing Developer</span>
                  <strong className="text-zinc-900">{stageDBug.assigned_to_name || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-zinc-400 block font-medium">Corrective Rework Hours</span>
                  <strong className="text-zinc-950 font-mono">{stageDBug.corrective_hours} hrs</strong>
                </div>
                <div>
                  <span className="text-zinc-400 block font-medium">Calculated Cost</span>
                  <strong className="text-zinc-950 font-mono">{formatINR(stageDBug.rework_cost)}</strong>
                </div>
              </div>

              {/* Fix Notes from Developer */}
              <div className="text-[11px] text-zinc-700 bg-white p-2.5 rounded border border-zinc-200 space-y-1">
                <span className="font-semibold text-zinc-900 block">Developer Fix Notes & Evidence:</span>
                <p className="text-zinc-600 leading-relaxed font-sans">
                  {stageDBug.fix_notes || (stageDBug as any).status_notes || 'Defect fix submitted for managerial review.'}
                </p>
                {stageDBug.fix_submitted_at && (
                  <span className="text-[10px] text-zinc-400 block font-mono">
                    Submitted at: {new Date(stageDBug.fix_submitted_at).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Time Entries Breakdown */}
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs space-y-2">
              <span className="font-semibold text-zinc-900 block flex items-center justify-between">
                <span>Logged Rework Time Entries ({stageDTimeEntries.length})</span>
                <span className="font-mono text-zinc-950 font-bold">{stageDBug.corrective_hours} hrs total</span>
              </span>
              {loadingTimeEntries ? (
                <div className="text-[11px] text-zinc-400 py-2">Loading time entries...</div>
              ) : stageDTimeEntries.length === 0 ? (
                <div className="text-[11px] text-zinc-500 italic py-1">No itemized time entries logged.</div>
              ) : (
                <div className="max-h-36 overflow-y-auto divide-y divide-zinc-200 border border-zinc-200 rounded bg-white">
                  {stageDTimeEntries.map((te) => (
                    <div key={te.id} className="p-2 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="font-medium text-zinc-900">{te.work_description || 'Corrective rework'}</span>
                        <div className="text-[10px] text-zinc-400 font-mono">{te.date} • {te.user_name}</div>
                      </div>
                      <span className="font-mono font-bold text-zinc-800">{te.hours_spent} hrs</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stage D Decision: The Four Accounting Options */}
            <FormField 
              label="Final Accounting Review Decision" 
              required 
              hint="Determine accounting qualification for internal payroll preview"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                  stageDDecision === 'approved_for_accounting' 
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-500' 
                    : 'border-zinc-200 hover:border-zinc-300'
                }`}>
                  <input
                    type="radio"
                    name="stageDDecision"
                    value="approved_for_accounting"
                    checked={stageDDecision === 'approved_for_accounting'}
                    onChange={() => setStageDDecision('approved_for_accounting')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold block text-zinc-900">Approved for Accounting</span>
                    <span className="text-[11px] text-zinc-500">
                      Rework hours confirmed as genuine defect correction eligible for payroll preview subject to task cap.
                    </span>
                  </div>
                </label>

                <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                  stageDDecision === 'waived' 
                    ? 'border-indigo-500 bg-indigo-50/50 text-indigo-950 ring-1 ring-indigo-500' 
                    : 'border-zinc-200 hover:border-zinc-300'
                }`}>
                  <input
                    type="radio"
                    name="stageDDecision"
                    value="waived"
                    checked={stageDDecision === 'waived'}
                    onChange={() => setStageDDecision('waived')}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold block text-zinc-900">Waived</span>
                    <span className="text-[11px] text-zinc-500">
                      Charges excused as non-chargeable (goodwill or late scope change). Hours remain tracked.
                    </span>
                  </div>
                </label>

                <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                  stageDDecision === 'disputed' 
                    ? 'border-red-500 bg-red-50/50 text-red-950 ring-1 ring-red-500' 
                    : 'border-zinc-200 hover:border-zinc-300'
                }`}>
                  <input
                    type="radio"
                    name="stageDDecision"
                    value="disputed"
                    checked={stageDDecision === 'disputed'}
                    onChange={() => setStageDDecision('disputed')}
                    className="mt-0.5 text-red-600 focus:ring-red-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold block text-zinc-900">Disputed</span>
                    <span className="text-[11px] text-zinc-500">
                      Hours or liability contested; held for dispute resolution without deducting from employee.
                    </span>
                  </div>
                </label>

                <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                  stageDDecision === 'pending' 
                    ? 'border-amber-500 bg-amber-50/50 text-amber-950 ring-1 ring-amber-500' 
                    : 'border-zinc-200 hover:border-zinc-300'
                }`}>
                  <input
                    type="radio"
                    name="stageDDecision"
                    value="pending"
                    checked={stageDDecision === 'pending'}
                    onChange={() => setStageDDecision('pending')}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold block text-zinc-900">Pending</span>
                    <span className="text-[11px] text-zinc-500">
                      Keep in active review queue awaiting verification or further testing.
                    </span>
                  </div>
                </label>
              </div>
            </FormField>

            {/* Explanation / Notes */}
            <FormField 
              label={stageDDecision === 'waived' || stageDDecision === 'disputed' ? "Mandatory Explanation / Justification *" : "Review Comments & Findings"} 
              required={stageDDecision === 'waived' || stageDDecision === 'disputed'}
              hint="Document reasons for accounting approval, waiver, or dispute findings"
            >
              <Textarea
                rows={3}
                value={stageDExplanation}
                onChange={(e) => setStageDExplanation(e.target.value)}
                placeholder={stageDDecision === 'waived' ? "Explain why this defect rework is waived from payroll adjustment..." : stageDDecision === 'disputed' ? "Record grounds for dispute and pending resolution details..." : "Manager sign-off notes for finance audit..."}
                required={stageDDecision === 'waived' || stageDDecision === 'disputed'}
              />
            </FormField>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 pt-3 border-t border-zinc-200">
              <Button
                variant="outline"
                onClick={() => setStageDBug(null)}
                disabled={isSubmittingStageD}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmittingStageD || ((stageDDecision === 'waived' || stageDDecision === 'disputed') && !stageDExplanation.trim())}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {isSubmittingStageD ? 'Submitting...' : 'Submit Accounting Review'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================================================================= */}
      {/* INDIVIDUAL BUG REVIEW HISTORY MODAL                                     */}
      {/* ======================================================================= */}
      {historyModalBug && (
        <Modal
          isOpen={!!historyModalBug}
          onClose={() => setHistoryModalBug(null)}
          title={`Review & Decision History: ${historyModalBug.id}`}
          subtitle={`Audit trail of managerial decisions for ${historyModalBug.title || historyModalBug.id}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            {loadingBugHistory ? (
              <LoadingSpinner message="Loading audit history..." />
            ) : bugReviewHistory.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 italic">
                No formal review decisions recorded yet for this defect.
              </div>
            ) : (
              <div className="space-y-3">
                {bugReviewHistory.map((rev) => (
                  <div key={rev.id} className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-zinc-950 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-zinc-600" />
                        <span>{rev.manager_name || 'Manager'}</span>
                      </div>
                      <StatusBadge status={rev.decision || rev.status} type="review" />
                    </div>
                    <div className="text-zinc-600 font-sans">
                      {rev.comments || rev.explanation || rev.review_notes || 'No review notes recorded.'}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono pt-1 border-t border-zinc-200">
                      <span>Root cause: {rev.root_cause || 'code_defect'}</span>
                      <span>{new Date(rev.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setHistoryModalBug(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
