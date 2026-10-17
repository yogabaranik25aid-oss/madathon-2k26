import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Bug, Module, User, TimeEntry, BugSeverity, BugStatus, TaskAssignment } from '../../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { FormField, Input, Textarea, Select } from '../components/common/FormControls';
import { StatusBadge } from '../components/common/StatusBadge';
import { SeverityBadge, PriorityBadge } from '../components/common/SeverityBadge';
import { RootCauseBadge } from '../components/common/RootCauseBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { useToast } from '../components/common/Toast';
import { useApp } from '../context/AppContext';
import { 
  Bug as BugIcon, 
  Plus, 
  Clock, 
  Search, 
  Filter, 
  CheckCircle2, 
  ArrowLeft,
  Calendar, 
  User as UserIcon, 
  DollarSign, 
  History, 
  RefreshCw, 
  Layers, 
  Send, 
  FileText,
  AlertTriangle,
  RotateCcw,
  Check,
  ShieldCheck,
  Info
} from 'lucide-react';

// INR Currency Formatter
export const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val || 0);
};

// Valid Bug Workflow Transitions matching backend
const VALID_WORKFLOW_TRANSITIONS: Record<string, BugStatus[]> = {
  open: ['in_progress', 'closed'],
  in_progress: ['fixed', 'open'],
  fixed: ['closed', 'reopened'],
  reopened: ['in_progress', 'fixed', 'closed'],
  closed: ['reopened'],
  review_pending: ['fixed', 'closed', 'reopened', 'in_progress'],
};

export const BugsPage: React.FC = () => {
  const { 
    currentUser, 
    users, 
    selectedBugId, 
    navigateToBug, 
    navigateBackToBugs, 
    refreshReviewCount 
  } = useApp();
  const { addToast } = useToast();

  const [bugs, setBugs] = useState<Bug[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters for Bug List
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Report Bug Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSubmittingBug, setIsSubmittingBug] = useState(false);
  const [bugFormError, setBugFormError] = useState<string | null>(null);
  const [reportFormData, setReportFormData] = useState({
    module_id: '',
    original_task_id: '',
    description: '',
    severity: 'major' as BugSeverity,
    assigned_to_id: '',
    reproduction_steps: '',
  });

  // Selected module lookup preview for Report Bug Form
  const selectedModulePreview = modules.find(m => m.id === reportFormData.module_id);
  const selectedTaskPreview = tasks.find(t => t.id === reportFormData.original_task_id);

  // Quick Log Time Modal State (accessible from bug list)
  const [quickLogBug, setQuickLogBug] = useState<Bug | null>(null);
  const [quickTimeForm, setQuickTimeForm] = useState({
    hours: 2.0,
    work_description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [isLoggingQuickTime, setIsLoggingQuickTime] = useState(false);
  const [quickTimeError, setQuickTimeError] = useState<string | null>(null);

  // Bug Details View State (/bugs/:id)
  const [detailBug, setDetailBug] = useState<Bug | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Corrective Time Form on Details Page
  const [detailTimeForm, setDetailTimeForm] = useState({
    hours: 3.0,
    work_description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [isSubmittingDetailTime, setIsSubmittingDetailTime] = useState(false);
  const [detailTimeError, setDetailTimeError] = useState<string | null>(null);

  // Status transition state on Details Page
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusTransitionError, setStatusTransitionError] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState('');

  // Fetch all bugs and modules
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bugsData, modulesData, tasksData] = await Promise.all([
        api.getBugs(),
        api.getModules(),
        api.getTasks().catch(() => []),
      ]);
      setBugs(bugsData);
      setModules(modulesData);
      setTasks(tasksData);
    } catch (err: any) {
      setError(err.message || 'Failed to load bugs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch individual bug details when selectedBugId changes
  const fetchBugDetails = async (id: string) => {
    setLoadingDetail(true);
    setDetailError(null);
    try {
      const [bugData, entries] = await Promise.all([
        api.getBug(id),
        api.getTimeEntries(id),
      ]);
      setDetailBug(bugData);
      setTimeEntries(entries);
    } catch (err: any) {
      setDetailError(err.message || 'Failed to load bug details.');
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (selectedBugId) {
      fetchBugDetails(selectedBugId);
    } else {
      setDetailBug(null);
      setTimeEntries([]);
    }
  }, [selectedBugId]);

  // Handle module change in Report Bug Modal
  const handleModuleSelectChange = (moduleId: string) => {
    setReportFormData(prev => ({
      ...prev,
      module_id: moduleId,
      // If no assigned developer is selected yet, default to current user or a developer
      assigned_to_id: prev.assigned_to_id || (users.find(u => u.role === 'developer')?.id || users[0]?.id || ''),
    }));
  };

  // Handle linking task in Report Bug Modal
  const handleTaskSelectChange = (taskId: string) => {
    const selectedTask = tasks.find(t => t.id === taskId);
    if (selectedTask) {
      setReportFormData(prev => ({
        ...prev,
        original_task_id: taskId,
        module_id: selectedTask.module_id || prev.module_id,
        assigned_to_id: selectedTask.assigned_to_id || prev.assigned_to_id,
      }));
    } else {
      setReportFormData(prev => ({
        ...prev,
        original_task_id: '',
      }));
    }
  };

  // Open Report Bug Modal
  const openReportModal = () => {
    const initialMod = modules[0]?.id || '';
    setReportFormData({
      module_id: initialMod,
      original_task_id: '',
      description: '',
      severity: 'major',
      assigned_to_id: currentUser?.id || users.find(u => u.role === 'developer')?.id || users[0]?.id || '',
      reproduction_steps: '',
    });
    setBugFormError(null);
    setIsReportModalOpen(true);
  };

  // Submit Report Bug
  const handleReportBugSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBugFormError(null);

    if (!reportFormData.module_id) {
      setBugFormError('Please select a valid software module.');
      return;
    }
    if (!reportFormData.description.trim()) {
      setBugFormError('Bug description is required.');
      return;
    }
    if (!reportFormData.assigned_to_id) {
      setBugFormError('Please assign a developer to fix this defect.');
      return;
    }

    setIsSubmittingBug(true);
    try {
      const created = await api.createBug({
        description: reportFormData.description.trim(),
        module_id: reportFormData.module_id,
        original_task_id: reportFormData.original_task_id || undefined,
        severity: reportFormData.severity,
        assigned_to_id: reportFormData.assigned_to_id,
        reproduction_steps: reportFormData.reproduction_steps.trim(),
      });

      addToast({
        type: 'success',
        title: 'Bug Reported Successfully',
        message: `${created.id} was created and linked to module "${created.module_name || selectedModulePreview?.name}".${
          reportFormData.original_task_id ? ' Original task reopened for rework.' : ''
        }`,
      });

      setIsReportModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setBugFormError(err.message || 'Failed to report bug.');
    } finally {
      setIsSubmittingBug(false);
    }
  };

  // Handle Quick Time Log Submission (Modal from table)
  const handleQuickLogTimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLogBug) return;
    setQuickTimeError(null);

    const hours = Number(quickTimeForm.hours);
    if (isNaN(hours) || hours <= 0) {
      setQuickTimeError('Hours must be a positive number greater than 0.');
      return;
    }
    if (!quickTimeForm.work_description.trim()) {
      setQuickTimeError('Work description explaining the corrective action is required.');
      return;
    }

    setIsLoggingQuickTime(true);
    try {
      const entry = await api.logTimeEntry(quickLogBug.id, {
        hours_spent: hours,
        work_description: quickTimeForm.work_description.trim(),
        user_id: currentUser?.id || 'usr-2',
        date: quickTimeForm.date,
      });

      addToast({
        type: 'success',
        title: 'Corrective Hours Logged',
        message: `Logged ${entry.hours_spent}h (${formatINR(entry.cost)} rework cost) on ${quickLogBug.id}.`,
      });

      setQuickLogBug(null);
      setQuickTimeForm({
        hours: 2.0,
        work_description: '',
        date: new Date().toISOString().split('T')[0],
      });
      await fetchData();
      if (selectedBugId === quickLogBug.id) {
        await fetchBugDetails(quickLogBug.id);
      }
    } catch (err: any) {
      setQuickTimeError(err.message || 'Failed to log corrective time.');
    } finally {
      setIsLoggingQuickTime(false);
    }
  };

  // Handle Detail Page Time Log Submission
  const handleDetailTimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailBug) return;
    setDetailTimeError(null);

    const hours = Number(detailTimeForm.hours);
    if (isNaN(hours) || hours <= 0) {
      setDetailTimeError('Hours must be a positive number greater than 0.');
      return;
    }
    if (!detailTimeForm.work_description.trim()) {
      setDetailTimeError('Work description explaining the corrective action is required.');
      return;
    }

    setIsSubmittingDetailTime(true);
    try {
      const entry = await api.logTimeEntry(detailBug.id, {
        hours_spent: hours,
        work_description: detailTimeForm.work_description.trim(),
        user_id: currentUser?.id || 'usr-2',
        date: detailTimeForm.date,
      });

      addToast({
        type: 'success',
        title: 'Corrective Hours Logged',
        message: `Added ${entry.hours_spent}h (${formatINR(entry.cost)} rework cost) to ${detailBug.id}.`,
      });

      setDetailTimeForm({
        hours: 2.0,
        work_description: '',
        date: new Date().toISOString().split('T')[0],
      });

      // Refresh bug details and global bugs list
      await Promise.all([
        fetchBugDetails(detailBug.id),
        fetchData(),
      ]);
    } catch (err: any) {
      setDetailTimeError(err.message || 'Failed to log corrective time.');
    } finally {
      setIsSubmittingDetailTime(false);
    }
  };

  // Handle Status Transition
  const handleStatusTransition = async (newStatus: BugStatus) => {
    if (!detailBug) return;
    setStatusTransitionError(null);
    setIsUpdatingStatus(true);

    try {
      const updated = await api.updateBug(detailBug.id, {
        status: newStatus,
        user_id: currentUser?.id || 'usr-1',
        status_notes: statusNote.trim() || undefined,
      });

      addToast({
        type: 'success',
        title: 'Bug Status Updated',
        message: `${detailBug.id} transitioned to "${newStatus.replace('_', ' ').toUpperCase()}".`,
      });

      setStatusNote('');
      setDetailBug(updated);
      await fetchData();
    } catch (err: any) {
      setStatusTransitionError(err.message || 'Failed to transition status.');
      addToast({
        type: 'error',
        title: 'Transition Failed',
        message: err.message || 'Status transition was rejected.',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Filtered bugs for bug list table
  const filteredBugs = bugs.filter((b) => {
    const matchesSearch =
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.title && b.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.module_name && b.module_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.original_module_owner_name && b.original_module_owner_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.assigned_to_name && b.assigned_to_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesModule = moduleFilter === 'all' || b.module_id === moduleFilter;
    const matchesSeverity = severityFilter === 'all' || b.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;

    return matchesSearch && matchesModule && matchesSeverity && matchesStatus;
  });

  const totalFilteredHours = filteredBugs.reduce((sum, b) => sum + (b.corrective_hours || 0), 0);
  const totalFilteredCost = filteredBugs.reduce((sum, b) => sum + (b.rework_cost || 0), 0);

  // Active user rate snapshot for previews
  const activeUserHourlyRate = currentUser?.hourly_rate || 500;

  // ==========================================
  // VIEW: BUG DETAILS PAGE (/bugs/:id)
  // ==========================================
  if (selectedBugId) {
    if (loadingDetail) {
      return (
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={navigateBackToBugs}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="text-xs text-zinc-600 hover:text-zinc-950"
          >
            Back to Bug List
          </Button>
          <LoadingSpinner message={`Loading bug details for ${selectedBugId}...`} />
        </div>
      );
    }

    if (detailError || !detailBug) {
      return (
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={navigateBackToBugs}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="text-xs text-zinc-600 hover:text-zinc-950"
          >
            Back to Bug List
          </Button>
          <ErrorAlert
            message={detailError || `Bug ${selectedBugId} was not found.`}
            onDismiss={navigateBackToBugs}
          />
        </div>
      );
    }

    const allowedTransitions = VALID_WORKFLOW_TRANSITIONS[detailBug.status] || [];
    const isQAOrManager = currentUser?.role === 'qa' || currentUser?.role === 'manager' || currentUser?.role === 'admin';

    return (
      <div className="space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={navigateBackToBugs}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Back to Bugs
            </Button>
            <span className="text-zinc-300">/</span>
            <span className="font-mono font-bold text-zinc-900 text-sm">{detailBug.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={detailBug.status} type="bug" />
            <SeverityBadge severity={detailBug.severity} />
          </div>
        </div>

        {statusTransitionError && (
          <ErrorAlert message={statusTransitionError} onDismiss={() => setStatusTransitionError(null)} />
        )}

        {/* 3 Metric Cards: Hours, Cost, Rate */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 border-l-4 border-l-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Corrective Hours</p>
                <h3 className="text-2xl font-bold font-mono text-zinc-950 mt-1">
                  {detailBug.corrective_hours} <span className="text-sm font-normal text-zinc-500">hrs</span>
                </h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-700 rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 mt-2">Sum of logged rework time entries</p>
          </Card>

          <Card className="p-4 border-l-4 border-l-emerald-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Rework Cost</p>
                <h3 className="text-2xl font-bold font-mono text-zinc-950 mt-1">
                  {formatINR(detailBug.rework_cost)}
                </h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
                <span className="font-bold text-lg leading-none">₹</span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 mt-2">Hours × authorized hourly rate snapshots</p>
          </Card>

          <Card className="p-4 border-l-4 border-l-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Assigned Fixer Rate</p>
                <h3 className="text-2xl font-bold font-mono text-zinc-950 mt-1">
                  {formatINR(detailBug.hourly_rate)}<span className="text-xs font-normal text-zinc-500">/hr</span>
                </h3>
              </div>
              <div className="p-3 bg-purple-50 text-purple-700 rounded-lg">
                <UserIcon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 mt-2">Base rate snapshot for corrective calculations</p>
          </Card>
        </div>

        {/* Bug Details & Provenance Card */}
        <Card className="p-5 space-y-4">
          <div className="border-b border-zinc-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-zinc-950">{detailBug.title || detailBug.id}</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Reported on {new Date(detailBug.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Priority:</span>
              <PriorityBadge priority={detailBug.priority} />
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">Bug Description</h4>
            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs text-zinc-800 whitespace-pre-wrap leading-relaxed">
              {detailBug.description}
            </div>
          </div>

          {/* Reproduction Steps (if any) */}
          {detailBug.reproduction_steps && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">Reproduction Steps</h4>
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs text-zinc-700 whitespace-pre-wrap font-mono">
                {detailBug.reproduction_steps}
              </div>
            </div>
          )}

          {/* Automatic Linking & Separation of Owner vs Fixer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Linked Module */}
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs space-y-1">
              <span className="text-[11px] font-semibold uppercase text-zinc-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-zinc-600" />
                Linked Module
              </span>
              <div className="font-bold text-zinc-900 text-sm">
                {detailBug.module_name || detailBug.module_code}
              </div>
              <div className="text-[11px] text-zinc-500 font-mono">
                Version: <span className="font-semibold text-zinc-800">{detailBug.module_version || 'v1.0.0'}</span> ({detailBug.module_code})
              </div>
            </div>

            {/* Original Module Owner */}
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs space-y-1">
              <span className="text-[11px] font-semibold uppercase text-zinc-500 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-zinc-600" />
                Original Module Owner
              </span>
              <div className="font-bold text-zinc-900 text-sm">
                {detailBug.original_module_owner_name || detailBug.original_author_name || 'Unassigned'}
              </div>
              <div className="text-[10px] text-zinc-500 italic">
                *Code provenance link (does not imply sole defect liability)
              </div>
            </div>

            {/* Assigned Developer (Fixer) */}
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs space-y-1">
              <span className="text-[11px] font-semibold uppercase text-zinc-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-600" />
                Assigned Developer (Fixer)
              </span>
              <div className="font-bold text-zinc-900 text-sm">
                {detailBug.assigned_to_name || 'Unassigned'}
              </div>
              <div className="text-[11px] text-zinc-500">
                Rate: <span className="font-mono font-semibold text-zinc-800">{formatINR(detailBug.hourly_rate)}/hr</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Status Workflow Action Bar */}
        <Card className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-950">Status Workflow Actions</h3>
              <p className="text-xs text-zinc-500">
                Current status: <strong className="uppercase text-zinc-800">{detailBug.status.replace('_', ' ')}</strong>. Standard progression: Open → In Progress → Fixed → Closed.
              </p>
            </div>
            {detailBug.status === 'fixed' && (
              <span className="text-[11px] bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded">
                Pending QA Verification
              </span>
            )}
          </div>

          <div className="pt-4 space-y-3">
            {/* Optional note input */}
            <div className="max-w-md">
              <FormField label="Status Transition Note (Optional)">
                <Input
                  placeholder="e.g. Unit tests verified; ready for staging deployment"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="text-xs"
                />
              </FormField>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* Transition to In Progress */}
              {allowedTransitions.includes('in_progress') && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleStatusTransition('in_progress')}
                  isLoading={isUpdatingStatus}
                >
                  Start Work (In Progress)
                </Button>
              )}

              {/* Transition to Fixed */}
              {allowedTransitions.includes('fixed') && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleStatusTransition('fixed')}
                  isLoading={isUpdatingStatus}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Mark as Fixed
                </Button>
              )}

              {/* Transition to Closed */}
              {allowedTransitions.includes('closed') && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleStatusTransition('closed')}
                  isLoading={isUpdatingStatus}
                  leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                >
                  Close Bug (Verified)
                </Button>
              )}

              {/* QA Reopen Button */}
              {(allowedTransitions.includes('reopened') || detailBug.status === 'fixed' || detailBug.status === 'closed') && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusTransition('reopened')}
                    isLoading={isUpdatingStatus}
                    className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
                    leftIcon={<RotateCcw className="w-4 h-4" />}
                    disabled={!isQAOrManager}
                    title={!isQAOrManager ? 'Reopening is restricted to authorized QA engineers or managers' : 'Reopen if verification failed'}
                  >
                    Reopen Bug (QA Verification Failed)
                  </Button>
                  {!isQAOrManager && (
                    <span className="text-[11px] text-zinc-400 italic">
                      (QA / Manager authorization required to reopen)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Log Corrective Maintenance Time Form */}
        <Card className="p-5">
          <div className="border-b border-zinc-100 pb-3">
            <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Log Corrective Maintenance Time
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Record hours spent fixing this bug. Rework cost is automatically calculated on the server using authorized hourly rate snapshots.
            </p>
          </div>

          <form onSubmit={handleDetailTimeSubmit} className="pt-4 space-y-4">
            {detailTimeError && <ErrorAlert message={detailTimeError} />}

            {/* Developer Session Pill */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 flex flex-wrap items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">Authenticated Developer:</span>
                <strong className="text-zinc-950 font-medium">{currentUser?.name || 'Developer'}</strong>
                <span className="px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700 font-mono text-[10px] uppercase">
                  {currentUser?.role || 'dev'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">Authorized Hourly Rate:</span>
                <strong className="text-zinc-950 font-mono">{formatINR(activeUserHourlyRate)}/hr</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField 
                label="Corrective Hours" 
                required 
                hint="Positive number of hours (e.g. 1.5, 3.0)"
              >
                <Input
                  type="number"
                  step="0.25"
                  min="0.25"
                  placeholder="e.g. 3.0"
                  value={detailTimeForm.hours}
                  onChange={(e) => setDetailTimeForm({ ...detailTimeForm, hours: Number(e.target.value) })}
                  required
                />
              </FormField>

              <FormField label="Date of Work" required>
                <Input
                  type="date"
                  value={detailTimeForm.date}
                  onChange={(e) => setDetailTimeForm({ ...detailTimeForm, date: e.target.value })}
                  required
                />
              </FormField>
            </div>

            <FormField 
              label="Work Description" 
              required 
              hint="Explain the root cause fix, code modifications, and test validations performed"
            >
              <Textarea
                placeholder="e.g. Patched JWT expiration validation in authMiddleware.ts, added unit test suite coverage..."
                value={detailTimeForm.work_description}
                onChange={(e) => setDetailTimeForm({ ...detailTimeForm, work_description: e.target.value })}
                rows={3}
                required
              />
            </FormField>

            {/* Live Computed Financial Rework Cost Preview */}
            <div className="bg-zinc-950 text-white rounded-lg p-3 text-xs flex items-center justify-between">
              <div>
                <span className="text-zinc-400">Calculated Rework Cost Impact: </span>
                <span className="font-mono text-zinc-300">
                  {Number(detailTimeForm.hours) || 0} hrs × {formatINR(activeUserHourlyRate)}/hr
                </span>
              </div>
              <span className="font-mono font-bold text-base text-emerald-400">
                +{formatINR((Number(detailTimeForm.hours) || 0) * activeUserHourlyRate)}
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmittingDetailTime}
                leftIcon={<Clock className="w-4 h-4" />}
              >
                Log Corrective Time Entry
              </Button>
            </div>
          </form>
        </Card>

        {/* Time Entries History Table */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-950">Logged Corrective Time Entries</h3>
              <p className="text-xs text-zinc-500">Historical ledger of work performed and rate snapshots</p>
            </div>
            <span className="text-xs font-mono font-semibold text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded">
              {timeEntries.length} {timeEntries.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          {timeEntries.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-500 border border-dashed border-zinc-200 rounded-lg">
              No corrective maintenance time entries logged for this bug yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Developer</th>
                    <th className="py-2.5 px-3">Work Description</th>
                    <th className="py-2.5 px-3 text-right">Hours</th>
                    <th className="py-2.5 px-3 text-right">Rate Snapshot</th>
                    <th className="py-2.5 px-3 text-right">Rework Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {timeEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-zinc-50/60">
                      <td className="py-2.5 px-3 font-mono text-zinc-600 whitespace-nowrap">
                        {entry.date}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-zinc-900 whitespace-nowrap">
                        {entry.user_name || 'Developer'}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-700 max-w-md">
                        {entry.work_description}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-zinc-800 whitespace-nowrap">
                        {entry.hours_spent} hrs
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-zinc-500 whitespace-nowrap">
                        {formatINR(entry.hourly_rate)}/hr
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-950 whitespace-nowrap">
                        {formatINR(entry.cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Status Transition Audit History */}
        {detailBug.status_history && detailBug.status_history.length > 0 && (
          <Card className="p-5 space-y-3">
            <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2 border-b border-zinc-100 pb-3">
              <History className="w-4 h-4 text-zinc-600" />
              Status Transition Audit History
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pt-1">
              {detailBug.status_history.map((hist) => (
                <div key={hist.id} className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold uppercase text-zinc-700">{hist.from_status.replace('_', ' ')}</span>
                      <span className="text-zinc-400">→</span>
                      <span className="font-bold uppercase text-zinc-950">{hist.to_status.replace('_', ' ')}</span>
                      <span className="text-zinc-400 text-[10px]">by {hist.changed_by_name || 'User'}</span>
                    </div>
                    {hist.notes && (
                      <p className="text-zinc-600 italic">"{hist.notes}"</p>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400 whitespace-nowrap">
                    {new Date(hist.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW: BUG LIST (/bugs)
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Top Header & Report Bug Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-zinc-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-zinc-950">Bug Tracking & Accountability</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Track defects, module provenance, corrective maintenance hours, and computed rework financial impact in INR (₹).
          </p>
        </div>
        <Button
          onClick={openReportModal}
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Report Bug
        </Button>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Summary Filter Strip */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <Input
              placeholder="Search bug ID, description, fixer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {/* Module Filter */}
          <Select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="text-xs"
          >
            <option value="all">All Linked Modules</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} - {m.name}
              </option>
            ))}
          </Select>

          {/* Severity Filter */}
          <Select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="major">Major</option>
            <option value="minor">Minor</option>
          </Select>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="fixed">Fixed</option>
            <option value="reopened">Reopened</option>
            <option value="closed">Closed</option>
          </Select>
        </div>

        {/* Filtered Tally */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-zinc-100 text-xs text-zinc-500">
          <span>
            Showing <strong>{filteredBugs.length}</strong> of <strong>{bugs.length}</strong> registered bugs
          </span>
          <div className="flex items-center gap-4">
            <span>
              Total Filtered Corrective Hours: <strong className="text-zinc-950 font-mono">{totalFilteredHours.toFixed(1)} hrs</strong>
            </span>
            <span>
              Total Filtered Rework Cost: <strong className="text-zinc-950 font-mono">{formatINR(totalFilteredCost)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Bugs Table with exact 9 required columns */}
      {loading ? (
        <LoadingSpinner message="Loading bug registry and calculating corrective maintenance rework..." />
      ) : filteredBugs.length === 0 ? (
        <EmptyState
          icon={BugIcon}
          title="No Bugs Found"
          description="There are currently no bugs matching your active filters. You can report a new defect or clear filters."
          actionLabel="Report Bug"
          onAction={openReportModal}
        />
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3.5">Bug ID</th>
                  <th className="py-3 px-3.5">Description</th>
                  <th className="py-3 px-3.5">Linked Module</th>
                  <th className="py-3 px-3.5">Original Module Owner</th>
                  <th className="py-3 px-3.5">Assigned Developer</th>
                  <th className="py-3 px-3.5">Severity</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5 text-right">Corrective Hours</th>
                  <th className="py-3 px-3.5 text-right">Rework Cost</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredBugs.map((bug) => (
                  <tr 
                    key={bug.id} 
                    className="hover:bg-zinc-50/80 transition-colors cursor-pointer"
                    onClick={() => navigateToBug(bug.id)}
                  >
                    {/* 1. Bug ID */}
                    <td className="py-3 px-3.5 whitespace-nowrap font-mono font-bold text-zinc-900">
                      {bug.id}
                    </td>

                    {/* 2. Description */}
                    <td className="py-3 px-3.5 max-w-xs">
                      <div className="font-medium text-zinc-950 line-clamp-2 hover:underline">
                        {bug.description}
                      </div>
                    </td>

                    {/* 3. Linked Module */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-900">
                          {bug.module_name || bug.module_code}
                        </span>
                        <span className="text-[11px] text-zinc-500 font-mono">
                          {bug.module_version || 'v1.0.0'} ({bug.module_code})
                        </span>
                      </div>
                    </td>

                    {/* 4. Original Module Owner */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="text-zinc-900 font-medium">
                        {bug.original_module_owner_name || bug.original_author_name || 'N/A'}
                      </div>
                      <span className="text-[10px] text-zinc-400">Provenance Owner</span>
                    </td>

                    {/* 5. Assigned Developer */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="text-zinc-900 font-medium">
                        {bug.assigned_to_name || 'Unassigned'}
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {formatINR(bug.hourly_rate)}/hr
                      </span>
                    </td>

                    {/* 6. Severity */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <SeverityBadge severity={bug.severity} showIcon={false} />
                    </td>

                    {/* 7. Status */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <StatusBadge status={bug.status} type="bug" />
                    </td>

                    {/* 8. Corrective Hours */}
                    <td className="py-3 px-3.5 text-right font-mono font-medium text-zinc-800 whitespace-nowrap">
                      {bug.corrective_hours} hrs
                    </td>

                    {/* 9. Rework Cost */}
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-zinc-950 whitespace-nowrap">
                      {formatINR(bug.rework_cost)}
                    </td>

                    {/* Actions */}
                    <td 
                      className="py-3 px-3.5 text-right whitespace-nowrap space-x-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setQuickLogBug(bug);
                          setQuickTimeForm({
                            hours: 2.0,
                            work_description: '',
                            date: new Date().toISOString().split('T')[0],
                          });
                        }}
                        className="text-[11px] py-1 px-2"
                        leftIcon={<Clock className="w-3 h-3" />}
                      >
                        Log Hours
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigateToBug(bug.id)}
                        className="text-[11px] py-1 px-2 text-zinc-600 hover:text-zinc-950"
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Report Bug */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Report New Bug"
        subtitle="Link defect to software module, assign developer, and initialize rework accountability"
        maxWidth="xl"
      >
        <form onSubmit={handleReportBugSubmit} className="space-y-4">
          {bugFormError && <ErrorAlert message={bugFormError} />}

          {/* Optional Linked Completed Task selection */}
          <FormField label="Link Completed Task (Optional)" hint="Select task to automatically link author, module, and reopen task for rework">
            <Select
              value={reportFormData.original_task_id}
              onChange={(e) => handleTaskSelectChange(e.target.value)}
            >
              <option value="">None (Standalone Defect / Module Level)</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} [{t.status.toUpperCase()}] ({t.assigned_to_name || 'Unassigned'})
                </option>
              ))}
            </Select>
          </FormField>

          {selectedTaskPreview && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-amber-900 flex items-center justify-between">
                <span>Task: <strong>{selectedTaskPreview.title}</strong></span>
                <span className="capitalize px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-medium">
                  {selectedTaskPreview.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-amber-800 text-[11px]">
                Assignee: <strong>{selectedTaskPreview.assigned_to_name}</strong> | Module: {selectedTaskPreview.module_name}
              </p>
              <p className="text-[11px] text-amber-700 italic">
                Reporting this defect will link the original task and author for accountability and reopen the task for corrective rework.
              </p>
            </div>
          )}

          {/* Module selection */}
          <FormField label="Target Module" required hint="Module containing the defect">
            <Select
              value={reportFormData.module_id}
              onChange={(e) => handleModuleSelectChange(e.target.value)}
              required
            >
              <option value="">Select Module...</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code} - {m.name} ({m.version})
                </option>
              ))}
            </Select>
          </FormField>

          {/* Automatic Linking Preview */}
          {selectedModulePreview && (
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs space-y-1.5">
              <div className="font-semibold text-zinc-900 flex items-center justify-between">
                <span>Module ID: <strong className="font-mono">{selectedModulePreview.id}</strong></span>
                <span>Version: <strong className="font-mono">{selectedModulePreview.version}</strong></span>
              </div>
              <div className="flex items-center justify-between text-zinc-600">
                <span>Original Module Owner: <strong className="text-zinc-900">{selectedModulePreview.owner_name}</strong></span>
                <span className="text-zinc-400">({selectedModulePreview.code})</span>
              </div>
              <div className="text-[11px] text-zinc-500 pt-1 border-t border-zinc-200/60 flex items-start gap-1">
                <Info className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
                <span>
                  The original module owner is recorded for code provenance. Defect cause will be investigated objectively without assuming sole liability.
                </span>
              </div>
            </div>
          )}

          {/* Bug Description */}
          <FormField label="Bug Description" required hint="Detailed explanation of the defect and symptoms">
            <Textarea
              placeholder="e.g. In authentication service, token validation fails intermittently on concurrent requests due to race condition in cache lookup..."
              value={reportFormData.description}
              onChange={(e) => setReportFormData({ ...reportFormData, description: e.target.value })}
              rows={3}
              required
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Severity: Minor, Major, Critical */}
            <FormField label="Severity" required>
              <Select
                value={reportFormData.severity}
                onChange={(e) => setReportFormData({ ...reportFormData, severity: e.target.value as BugSeverity })}
              >
                <option value="minor">Minor (Low impact, cosmetic or minor inconvenience)</option>
                <option value="major">Major (Primary function disrupted with workaround)</option>
                <option value="critical">Critical (System crash, data loss, or blocking outage)</option>
              </Select>
            </FormField>

            {/* Assigned Developer */}
            <FormField label="Assigned Developer (Fixer)" required hint="Developer assigned to resolve defect">
              <Select
                value={reportFormData.assigned_to_id}
                onChange={(e) => setReportFormData({ ...reportFormData, assigned_to_id: e.target.value })}
                required
              >
                <option value="">Select Developer...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role} - {formatINR(u.hourly_rate)}/hr)
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          {/* Optional Reproduction Steps */}
          <FormField label="Reproduction Steps (Optional)" hint="Step-by-step instructions to reproduce the issue">
            <Textarea
              placeholder="1. Login with demo user&#10;2. Open profile settings and click save twice rapidly&#10;3. Observe 500 internal server error in console"
              value={reportFormData.reproduction_steps}
              onChange={(e) => setReportFormData({ ...reportFormData, reproduction_steps: e.target.value })}
              rows={2}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReportModalOpen(false)}
              disabled={isSubmittingBug}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingBug}>
              Report Bug
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Quick Log Time from Table */}
      {quickLogBug && (
        <Modal
          isOpen={!!quickLogBug}
          onClose={() => setQuickLogBug(null)}
          title="Log Corrective Maintenance Time"
          subtitle={`Adding corrective rework time to ${quickLogBug.id}`}
        >
          <form onSubmit={handleQuickLogTimeSubmit} className="space-y-4">
            {quickTimeError && <ErrorAlert message={quickTimeError} />}

            {/* Cost Preview Pill */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 flex items-center justify-between text-xs">
              <div>
                <span className="text-zinc-500">Current Bug Rework: </span>
                <strong className="text-zinc-950 font-mono">
                  {quickLogBug.corrective_hours}h ({formatINR(quickLogBug.rework_cost)})
                </strong>
              </div>
              <div>
                <span className="text-zinc-500">Active Rate: </span>
                <strong className="text-zinc-950 font-mono">{formatINR(activeUserHourlyRate)}/hr</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Hours Spent" required hint="e.g. 1.5, 3.0">
                <Input
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={quickTimeForm.hours}
                  onChange={(e) => setQuickTimeForm({ ...quickTimeForm, hours: Number(e.target.value) })}
                  required
                />
              </FormField>

              <FormField label="Date" required>
                <Input
                  type="date"
                  value={quickTimeForm.date}
                  onChange={(e) => setQuickTimeForm({ ...quickTimeForm, date: e.target.value })}
                  required
                />
              </FormField>
            </div>

            <FormField label="Work Description" required hint="Summary of code modifications and validation">
              <Textarea
                placeholder="Identified root cause, patched edge condition, added regression unit test..."
                value={quickTimeForm.work_description}
                onChange={(e) => setQuickTimeForm({ ...quickTimeForm, work_description: e.target.value })}
                rows={3}
                required
              />
            </FormField>

            {/* Real-time Computed Entry Impact */}
            <div className="bg-zinc-950 text-white rounded-lg p-3 text-xs flex items-center justify-between">
              <span>This Entry Rework Cost Impact:</span>
              <span className="font-mono font-bold text-sm text-emerald-400">
                +{formatINR((Number(quickTimeForm.hours) || 0) * activeUserHourlyRate)}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setQuickLogBug(null)}
                disabled={isLoggingQuickTime}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoggingQuickTime}>
                Submit Time Entry
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
