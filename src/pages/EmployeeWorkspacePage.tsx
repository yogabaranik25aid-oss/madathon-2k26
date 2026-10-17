import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { 
  TaskAssignment, 
  Bug, 
  TimeEntry, 
  EmployeeSummary, 
  DateFilterOption, 
  WorkSession,
  TimeCorrectionRequest,
  Project,
  Module
} from '../../types';
import { 
  Play, 
  Pause, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Layers, 
  Bug as BugIcon, 
  Send, 
  RotateCcw, 
  Calendar, 
  DollarSign, 
  Edit3, 
  ArrowUpRight,
  ShieldAlert,
  Info,
  Check,
  Timer,
  Code2,
  FolderGit2,
  CheckSquare,
  Sparkles
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../components/common/Toast';
import { DevelopmentWorkspace } from '../components/workspace/DevelopmentWorkspace';
import { DeadlineBadge, formatDeadline } from '../utils/deadline';

export const EmployeeWorkspacePage: React.FC = () => {
  const { 
    currentUser, 
    navigateToBug, 
    activeSession, 
    refreshActiveSession,
    selectedBugId,
    setSelectedBugId,
    employeeSubTab,
    setEmployeeSubTab
  } = useApp();
  const { addToast } = useToast();

  const [dateFilter, setDateFilter] = useState<DateFilterOption>('30days');
  const [summary, setSummary] = useState<EmployeeSummary | null>(null);
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [reworkBugs, setReworkBugs] = useState<Bug[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [correctionRequests, setCorrectionRequests] = useState<TimeCorrectionRequest[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignedModules, setAssignedModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  // Active IDE development workspace
  const [workspaceTask, setWorkspaceTask] = useState<TaskAssignment | null>(null);
  const [workspaceBug, setWorkspaceBug] = useState<Bug | null>(null);

  // Live timer ticks for active work session
  const [liveElapsed, setLiveElapsed] = useState<number>(0);

  // Modals state
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedTaskToSubmit, setSelectedTaskToSubmit] = useState<TaskAssignment | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submittingTask, setSubmittingTask] = useState(false);

  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [selectedEntryForCorrection, setSelectedEntryForCorrection] = useState<TimeEntry | null>(null);
  const [correctionHours, setCorrectionHours] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [submittingCorrection, setSubmittingCorrection] = useState(false);

  const [activeTabSubSection, setActiveTabSubSection] = useState<'assigned' | 'projects' | 'submissions' | 'rework' | 'history'>(employeeSubTab || 'assigned');

  // Keep subtab in sync with AppContext navigation
  useEffect(() => {
    if (employeeSubTab) {
      setActiveTabSubSection(employeeSubTab);
    }
  }, [employeeSubTab]);

  // Keep ref to activeSession for unmount and window pagehide/beforeunload auto-pause
  const activeSessionRef = useRef(activeSession);
  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  useEffect(() => {
    const handlePageLeave = () => {
      const session = activeSessionRef.current;
      if (session && session.status === 'active') {
        const token = localStorage.getItem('reworkguard_token') || sessionStorage.getItem('reworkguard_token');
        const url = `/api/work-sessions/${session.id}/pause${token ? `?token=${encodeURIComponent(token)}` : ''}`;
        try {
          fetch(url, {
            method: 'POST',
            keepalive: true,
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
          }).catch(() => {});
        } catch (e) {
          if (navigator.sendBeacon) {
            navigator.sendBeacon(url);
          }
        }
      }
    };

    window.addEventListener('beforeunload', handlePageLeave);
    window.addEventListener('pagehide', handlePageLeave);

    return () => {
      window.removeEventListener('beforeunload', handlePageLeave);
      window.removeEventListener('pagehide', handlePageLeave);
      const session = activeSessionRef.current;
      if (session && session.status === 'active') {
        api.pauseWorkSession(session.id).catch(() => {});
      }
    };
  }, []);

  // Open Bug in IDE with linked task & previous work context
  // Stage B: Automatic & Idempotent Timer Start for Authorized Assigned Developer
  const handleOpenBugWorkspace = useCallback(async (bug: Bug) => {
    const linkedTaskId = bug.original_task_id || bug.task_id;
    let linkedTask = linkedTaskId ? tasks.find(t => t.id === linkedTaskId) : null;
    if (!linkedTask && bug.module_id) {
      linkedTask = tasks.find(t => t.module_id === bug.module_id) || null;
    }
    setWorkspaceTask(linkedTask || null);
    setWorkspaceBug(bug);

    // Automatic timer start rule:
    // Start only for authorized assigned developer, not manager or viewing client
    const isAssignedDev = 
      currentUser?.role !== 'manager' && 
      currentUser?.role !== 'client' && 
      (!bug.assigned_to_id || bug.assigned_to_id === currentUser?.id);
    const isApprovedRework = 
      bug.status !== 'closed' && 
      (bug.classification_status === 'confirmed_defect' || 
       bug.status === 'open' || 
       bug.status === 'reopened');

    if (isAssignedDev && isApprovedRework) {
      // Idempotency: If a timer is already active for this defect, do not start duplicates or reset
      if (activeSession && activeSession.bug_id === bug.id && activeSession.status === 'active') {
        return;
      }
      try {
        await api.startWorkSession({
          target_id: bug.id,
          target_title: bug.title,
          work_type: 'corrective_rework',
          bug_id: bug.id,
          task_id: linkedTaskId || undefined,
        });
        await refreshActiveSession();
      } catch (err: any) {
        console.warn('Rework workspace auto-timer notice:', err.message);
      }
    }
  }, [tasks, currentUser, activeSession, refreshActiveSession]);

  // Automatically activate rework tab and launch IDE when selectedBugId is present
  useEffect(() => {
    if (selectedBugId && reworkBugs.length > 0) {
      const targetBug = reworkBugs.find(b => b.id === selectedBugId);
      if (targetBug) {
        setActiveTabSubSection('rework');
        handleOpenBugWorkspace(targetBug);
      }
    }
  }, [selectedBugId, reworkBugs, handleOpenBugWorkspace]);

  // Load employee data
  const loadWorkspaceData = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const [sumData, tasksData, bugsData, mySessions, corrections, projectsData, modulesData] = await Promise.all([
        api.getEmployeeSummary(dateFilter, currentUser.id),
        api.getTasks({ assigned_to_id: currentUser.id }),
        api.getBugs({ assigned_to_id: currentUser.id }),
        api.getMyWorkSessions(),
        api.getTimeCorrections({ user_id: currentUser.id }),
        api.getProjects().catch(() => []),
        api.getModules().catch(() => []),
      ]);

      setSummary(sumData);
      setTasks(tasksData);
      setReworkBugs(bugsData);
      setCorrectionRequests(corrections);
      setProjects(projectsData);
      setAssignedModules(modulesData);

      // Collect user time entries across bugs and tasks
      const allBugEntries = await Promise.all(
        bugsData.slice(0, 10).map(b => api.getTimeEntries(b.id).catch(() => []))
      );
      const flattened = allBugEntries.flat().filter(te => te.user_id === currentUser.id);
      setTimeEntries(flattened);
    } catch (err: any) {
      addToast({
        title: 'Failed to load workspace data',
        description: err.message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser, dateFilter, addToast]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  // Synchronize live elapsed timer
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

  // Format seconds to HH:MM:SS
  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Work session controls
  const handleStartSession = async (
    targetId: string, 
    targetTitle: string, 
    workType: 'original_development' | 'corrective_rework',
    taskId?: string,
    bugId?: string
  ) => {
    try {
      await api.startWorkSession({
        target_id: targetId,
        target_title: targetTitle,
        work_type: workType,
        task_id: taskId,
        bug_id: bugId,
      });
      await refreshActiveSession();
      loadWorkspaceData();
      addToast({
        title: 'Work session started',
        description: `Server-backed timer active for "${targetTitle}".`,
        type: 'success',
      });
    } catch (err: any) {
      addToast({
        title: 'Cannot start session',
        description: err.message,
        type: 'error',
      });
    }
  };

  const handlePauseSession = async () => {
    if (!activeSession) return;
    try {
      await api.pauseWorkSession(activeSession.id);
      await refreshActiveSession();
      addToast({
        title: 'Session paused',
        description: 'Timer stopped accumulating working time.',
        type: 'info',
      });
    } catch (err: any) {
      addToast({
        title: 'Error pausing session',
        description: err.message,
        type: 'error',
      });
    }
  };

  const handleResumeSession = async () => {
    if (!activeSession) return;
    try {
      await api.resumeWorkSession(activeSession.id);
      await refreshActiveSession();
      addToast({
        title: 'Session resumed',
        description: 'Timer is now accumulating working time.',
        type: 'success',
      });
    } catch (err: any) {
      addToast({
        title: 'Error resuming session',
        description: err.message,
        type: 'error',
      });
    }
  };

  const handleStopSession = async (notes?: string) => {
    if (!activeSession) return;
    try {
      const res = await api.stopWorkSession(activeSession.id, notes || 'Task completed & submitted');
      await refreshActiveSession();
      loadWorkspaceData();
      addToast({
        title: 'Work session duration recorded',
        description: `Logged ${res.timeEntry.hours_spent}h duration in shared database.`,
        type: 'success',
      });
    } catch (err: any) {
      console.error('Error logging work session:', err);
    }
  };

  // Submit task for review
  const openSubmitModal = (task: TaskAssignment) => {
    setSelectedTaskToSubmit(task);
    setSubmissionNotes(task.submission_notes || '');
    setSubmitModalOpen(true);
  };

  const handleSubmitTask = async () => {
    if (!selectedTaskToSubmit) return;
    if (!submissionNotes.trim()) {
      addToast({
        title: 'Notes required',
        description: 'Please describe the changes and completed requirements before submitting.',
        type: 'error',
      });
      return;
    }

    try {
      setSubmittingTask(true);
      await api.submitTask(selectedTaskToSubmit.id, submissionNotes.trim());
      // If there is an active session on this task, automatically finalize and log the session
      if (activeSession && activeSession.task_id === selectedTaskToSubmit.id) {
        await api.stopWorkSession(activeSession.id, submissionNotes.trim());
        await refreshActiveSession();
      }
      setSubmitModalOpen(false);
      setSelectedTaskToSubmit(null);
      setSubmissionNotes('');
      loadWorkspaceData();
      addToast({
        title: 'Submitted for Manager Review',
        description: `Task "${selectedTaskToSubmit.title}" submitted to manager queue.`,
        type: 'success',
      });
    } catch (err: any) {
      addToast({
        title: 'Submission failed',
        description: err.message,
        type: 'error',
      });
    } finally {
      setSubmittingTask(false);
    }
  };

  // Request time correction
  const openCorrectionModal = (entry: TimeEntry) => {
    setSelectedEntryForCorrection(entry);
    setCorrectionHours(entry.hours_spent.toString());
    setCorrectionReason('');
    setCorrectionModalOpen(true);
  };

  const handleRequestCorrection = async () => {
    if (!selectedEntryForCorrection) return;
    const hoursNum = parseFloat(correctionHours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      addToast({ title: 'Invalid hours', description: 'Please enter a valid positive number of hours.', type: 'error' });
      return;
    }
    if (!correctionReason.trim()) {
      addToast({ title: 'Justification required', description: 'Please explain why the recorded duration was inaccurate.', type: 'error' });
      return;
    }

    try {
      setSubmittingCorrection(true);
      await api.createTimeCorrection({
        time_entry_id: selectedEntryForCorrection.id,
        requested_hours: hoursNum,
        reason: correctionReason.trim(),
      });
      setCorrectionModalOpen(false);
      setSelectedEntryForCorrection(null);
      loadWorkspaceData();
      addToast({
        title: 'Correction requested',
        description: 'Correction request submitted for manager review and audit logging.',
        type: 'success',
      });
    } catch (err: any) {
      addToast({ title: 'Correction request failed', description: err.message, type: 'error' });
    } finally {
      setSubmittingCorrection(false);
    }
  };

  // Submissions categorized
  const submittedTasks = useMemo(() => {
    return tasks.filter(t => t.status === 'submitted' || t.status === 'approved' || t.status === 'changes_requested' || t.status === 'reopened' || t.status === 'under_fix');
  }, [tasks]);

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-zinc-500 font-medium mt-3">Loading employee workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Greeting & Profile Banner */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight text-zinc-950">
              Welcome back, {currentUser?.name || 'Engineer'}
            </h1>
            <span className="text-[11px] font-mono font-bold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded border border-zinc-200">
              {currentUser?.employee_id || currentUser?.id}
            </span>
            {currentUser?.engineering_role && (
              <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2.5 py-0.5 rounded-full capitalize">
                {currentUser.engineering_role.replace(/_/g, ' ')}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-1 flex items-center gap-2 flex-wrap">
            <span>Project: <strong className="text-zinc-800">PRJ-LLM (LLM Application Platform)</strong></span>
            <span>•</span>
            <span>Role: <strong className="text-zinc-800 capitalize">{(currentUser?.engineering_role || currentUser?.role)?.replace(/_/g, ' ')}</strong></span>
            <span>•</span>
            <span className="text-emerald-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Automated work tracking active
            </span>
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200 self-start md:self-auto">
          {(['today', 'yesterday', '7days', '30days'] as DateFilterOption[]).map((range) => {
            const labels: Record<DateFilterOption, string> = {
              today: 'Today',
              yesterday: 'Yesterday',
              '7days': 'Last 7 Days',
              '30days': 'Last 30 Days',
            };
            const isSelected = dateFilter === range;
            return (
              <button
                key={range}
                onClick={() => setDateFilter(range)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isSelected
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
                }`}
              >
                {labels[range]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Key Performance Metrics Row (5 KPI Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Card className="p-4 bg-white border-zinc-200/80">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Total Hours</span>
            <Clock className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-950 mt-2">
            {summary?.total_hours || 0}
            <span className="text-xs text-zinc-400 font-sans font-normal ml-1">hrs</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Logged in selected period</div>
        </Card>

        <Card className="p-4 bg-white border-zinc-200/80">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Completed Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-950 mt-2">
            {summary?.completed_tasks || 0}
            <span className="text-xs text-zinc-400 font-sans font-normal ml-1">/ {summary?.assigned_tasks_count || 0}</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Approved by manager</div>
        </Card>

        <Card className="p-4 bg-white border-zinc-200/80">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Original Dev</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-950 mt-2">
            {summary?.original_dev_hours || 0}
            <span className="text-xs text-zinc-400 font-sans font-normal ml-1">hrs</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">New feature implementation</div>
        </Card>

        <Card className="p-4 bg-white border-zinc-200/80">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Corrective Rework</span>
            <BugIcon className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-950 mt-2">
            {summary?.corrective_hours || 0}
            <span className="text-xs text-zinc-400 font-sans font-normal ml-1">hrs</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Post-delivery bug fixes</div>
        </Card>

        <Card className="p-4 bg-white border-zinc-200/80 col-span-2 lg:col-span-1">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Active Defects</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-950 mt-2">
            {summary?.active_rework_count || 0}
            <span className="text-xs text-zinc-400 font-sans font-normal ml-1">assigned</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Requiring corrective fix</div>
        </Card>
      </div>

      {/* 3. My Active Work Widget (Live Timer Section) */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${activeSession && activeSession.status === 'active' ? 'bg-emerald-500 text-white animate-pulse' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
              <Timer className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-950">My Active Work Session</h2>
              <p className="text-[11px] text-zinc-500">Live server-backed timer. Paused time is never counted as working time.</p>
            </div>
          </div>
          {activeSession && (
            <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
              activeSession.status === 'active' 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}>
              {activeSession.status === 'active' ? '● Recording Live' : '❚❚ Paused'}
            </span>
          )}
        </div>

        {activeSession ? (
          <div className="bg-zinc-50/80 border border-zinc-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                  activeSession.work_type === 'corrective_rework' 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {activeSession.work_type === 'corrective_rework' ? 'Corrective Rework Defect' : 'Original Development Task'}
                </span>
                <span className="text-[11px] text-zinc-400">
                  Started at {new Date(activeSession.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h3 className="text-base font-bold text-zinc-950 truncate">{activeSession.target_title}</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Target ID: <span className="font-mono text-zinc-700">{activeSession.target_id}</span> • User: <span className="text-zinc-700 font-medium">{currentUser?.name}</span>
              </p>
            </div>

            {/* Timer Counter & Reopen IDE Action (No manual Stop/End controls) */}
            <div className="flex items-center gap-4 self-end md:self-auto shrink-0">
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5 mb-0.5">
                  <span className={`w-2 h-2 rounded-full ${activeSession.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    activeSession.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {activeSession.status === 'active' ? 'Active in IDE' : 'Paused (Outside IDE)'}
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-zinc-950">
                  {formatTimer(liveElapsed)}
                </div>
                <div className="text-[10px] text-zinc-400 font-medium">Accumulated Working Time</div>
              </div>

              <div>
                <button 
                  onClick={() => {
                    if (activeSession.work_type === 'corrective_rework' || activeSession.bug_id) {
                      const b = reworkBugs.find(x => x.id === (activeSession.bug_id || activeSession.target_id));
                      if (b) {
                        handleOpenBugWorkspace(b);
                        return;
                      }
                    }
                    if (activeSession.task_id) {
                      const t = tasks.find(x => x.id === activeSession.task_id);
                      if (t) setWorkspaceTask(t);
                    } else if (activeSession.bug_id) {
                      const b = reworkBugs.find(x => x.id === activeSession.bug_id);
                      if (b) handleOpenBugWorkspace(b);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <Code2 className="w-4 h-4 text-zinc-300" />
                  <span>{activeSession.work_type === 'corrective_rework' ? 'Open Rework IDE' : 'Open Workspace IDE'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-50 border border-dashed border-zinc-300 rounded-xl p-5 text-center">
            <Clock className="w-6 h-6 text-zinc-400 mx-auto mb-1.5" />
            <h4 className="text-xs font-bold text-zinc-700">No active work session running</h4>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Select an assigned module task below or a rework defect to launch the in-browser IDE and track time automatically.
            </p>
          </div>
        )}
      </div>

      {/* 4. Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
        <button
          onClick={() => setActiveTabSubSection('assigned')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTabSubSection === 'assigned'
              ? 'bg-zinc-950 text-white shadow-xs'
              : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>My Tasks & Development Work</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200/50 text-current">
            {tasks.filter(t => t.status === 'assigned' || t.status === 'in_progress' || t.status === 'reopened' || t.status === 'under_fix' || t.status === 'changes_requested').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTabSubSection('projects')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTabSubSection === 'projects'
              ? 'bg-zinc-950 text-white shadow-xs'
              : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
          }`}
        >
          <FolderGit2 className="w-3.5 h-3.5" />
          <span>My Projects & Modules</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200/50 text-current">
            {assignedModules.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTabSubSection('submissions')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTabSubSection === 'submissions'
              ? 'bg-zinc-950 text-white shadow-xs'
              : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>My Submissions & Approvals</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200/50 text-current">
            {submittedTasks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTabSubSection('rework')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTabSubSection === 'rework'
              ? 'bg-zinc-950 text-white shadow-xs'
              : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
          }`}
        >
          <BugIcon className="w-3.5 h-3.5" />
          <span>My Rework & Defects</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200/50 text-current">
            {reworkBugs.filter(b => b.status !== 'closed').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTabSubSection('history')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTabSubSection === 'history'
              ? 'bg-zinc-950 text-white shadow-xs'
              : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Time History & Corrections</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200/50 text-current">
            {timeEntries.length}
          </span>
        </button>
      </div>

      {/* 5. Tab Content: Assigned Tasks */}
      {activeTabSubSection === 'assigned' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-950">Assigned Modules & Development Work</h3>
              <p className="text-xs text-zinc-500">Tasks assigned by your manager requiring initial development or feature completion.</p>
            </div>
          </div>

          {tasks.length === 0 ? (
            <EmptyState
              title="No tasks assigned"
              description="You have no active task assignments. Check back later or review your assigned defects."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.map((task) => {
                const isOverdue = new Date(task.deadline).getTime() < Date.now() && task.status !== 'approved';
                const isCurrentActive = activeSession?.target_id === task.id;

                return (
                  <Card key={task.id} className="p-5 flex flex-col justify-between border-zinc-200/90 hover:border-zinc-300 transition-all">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-mono font-bold bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded border border-zinc-200">
                            {task.module_code || 'MODULE'}
                          </span>
                          <span className="text-xs text-zinc-500 font-medium">{task.module_version}</span>
                          {task.assigned_role && (
                            <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded capitalize">
                              {task.assigned_role.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            task.priority === 'p0' ? 'bg-red-100 text-red-800' :
                            task.priority === 'p1' ? 'bg-orange-100 text-orange-800' : 'bg-zinc-100 text-zinc-700'
                          }`}>
                            {task.priority.toUpperCase()}
                          </span>
                          <StatusBadge status={task.status} />
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-zinc-950 mb-1">{task.title}</h4>
                      <p className="text-xs text-zinc-600 line-clamp-3 mb-3 leading-relaxed">
                        {task.description}
                      </p>

                      <div className="text-[11px] text-zinc-500 space-y-1.5 mb-3 bg-zinc-50 p-2.5 rounded-lg border border-zinc-150">
                        <div className="flex items-center justify-between">
                          <span>Manager:</span>
                          <strong className="text-zinc-800 font-medium">{task.assigned_by_name || 'Engineering Lead'}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Assigned Deadline:</span>
                          <DeadlineBadge deadline={task.deadline} showDate />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Assigned Date:</span>
                          <span className="text-zinc-700">{new Date(task.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {task.acceptance_criteria && task.acceptance_criteria.length > 0 && (
                        <div className="mb-3 p-2.5 rounded-lg bg-zinc-50/70 border border-zinc-200 text-xs">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1 flex items-center gap-1">
                            <CheckSquare className="w-3 h-3 text-indigo-600" />
                            Acceptance Criteria ({task.acceptance_criteria.length} items)
                          </div>
                          <ul className="space-y-0.5 text-[11px] text-zinc-700">
                            {task.acceptance_criteria.slice(0, 2).map((ac, idx) => (
                              <li key={idx} className="flex items-start gap-1.5 truncate">
                                <span className="text-indigo-600 font-bold">•</span>
                                <span className="truncate">{ac}</span>
                              </li>
                            ))}
                            {task.acceptance_criteria.length > 2 && (
                              <li className="text-[10px] text-zinc-400 italic">
                                +{task.acceptance_criteria.length - 2} more in IDE workspace
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      {task.reviewer_feedback && (
                        <div className="mb-4 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                          <div className="font-bold flex items-center gap-1 text-[11px] text-amber-800 mb-0.5">
                            <Info className="w-3.5 h-3.5" />
                            Manager Feedback:
                          </div>
                          <p className="italic">{task.reviewer_feedback}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {isCurrentActive ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setWorkspaceTask(task)}
                            className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                          >
                            <Code2 className="w-3.5 h-3.5" />
                            <span>Open IDE Workspace</span>
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setWorkspaceTask(task)}
                            className="flex items-center gap-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                            disabled={task.status === 'approved'}
                          >
                            <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Open in IDE</span>
                          </Button>
                        )}
                      </div>

                      {task.status !== 'approved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openSubmitModal(task)}
                          className="flex items-center gap-1.5 text-xs"
                        >
                          <Send className="w-3 h-3 text-zinc-600" />
                          <span>{task.status === 'changes_requested' || task.status === 'reopened' || task.status === 'under_fix' ? 'Resubmit Work' : 'Submit for Review'}</span>
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5b. Tab Content: My Projects & Assigned Modules */}
      {activeTabSubSection === 'projects' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-zinc-950">My Projects & Assigned Modules</h3>
            <p className="text-xs text-zinc-500">Corporate projects and functional software modules configured by engineering management and assigned to your role.</p>
          </div>

          {/* Project Overview Card (e.g. LLM Platform) */}
          <div className="grid grid-cols-1 gap-4">
            {projects.map((proj) => {
              const projModules = assignedModules.filter(m => m.project_id === proj.id || m.project_name === proj.name);
              return (
                <Card key={proj.id} className="p-5 border-zinc-200/90 bg-white">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded border border-indigo-200">
                          {proj.code}
                        </span>
                        <h4 className="text-base font-bold text-zinc-950">{proj.name}</h4>
                      </div>
                      <p className="text-xs text-zinc-600 mt-1 max-w-2xl leading-relaxed">
                        {proj.description || 'Enterprise generative AI platform featuring streaming inference, Redis token rate limiting, and evaluation suites.'}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-500" />
                      Active Project
                    </span>
                  </div>

                  <div className="pt-3 border-t border-zinc-100">
                    <h5 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-3">
                      Assigned Modules in this Project ({projModules.length})
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {projModules.map((mod) => (
                        <div key={mod.id} className="p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/70 hover:bg-zinc-50 transition-colors">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[11px] font-mono font-bold text-zinc-800 bg-white px-2 py-0.5 rounded border border-zinc-200">
                              {mod.code}
                            </span>
                            <span className="text-xs text-zinc-500 font-mono">{mod.version}</span>
                          </div>
                          <h6 className="text-xs font-bold text-zinc-900 mb-1">{mod.name}</h6>
                          <p className="text-[11px] text-zinc-600 line-clamp-2 mb-2 leading-relaxed">
                            {mod.description}
                          </p>
                          <div className="text-[10px] text-zinc-500 flex items-center justify-between pt-2 border-t border-zinc-200/60">
                            <span className="capitalize px-1.5 py-0.5 rounded bg-zinc-200/60 text-zinc-700 font-medium">
                              Status: {mod.status}
                            </span>
                            <span className="font-mono text-zinc-500">{mod.total_lines_of_code?.toLocaleString() || 12000} LOC</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Tab Content: My Submissions */}
      {activeTabSubSection === 'submissions' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-950">My Submissions & Approval Workflow</h3>
            <p className="text-xs text-zinc-500">Review status: Assigned → In Progress → Submitted for Review → Approved (or Changes Requested).</p>
          </div>

          {submittedTasks.length === 0 ? (
            <EmptyState
              title="No submissions yet"
              description="When you submit tasks for manager sign-off, approval logs and manager feedback will appear here."
            />
          ) : (
            <div className="space-y-3">
              {submittedTasks.map((task) => (
                <div key={task.id} className="bg-white border border-zinc-200/90 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono font-bold bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded border border-zinc-200">
                        {task.module_code}
                      </span>
                      <StatusBadge status={task.status} />
                      {task.resubmission_count > 0 && (
                        <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                          Resubmission #{task.resubmission_count}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-zinc-950">{task.title}</h4>
                    {task.submission_notes && (
                      <p className="text-xs text-zinc-600 mt-1 bg-zinc-50 p-2 rounded border border-zinc-150">
                        <strong className="text-zinc-800">My Notes:</strong> {task.submission_notes}
                      </p>
                    )}
                    {task.reviewer_feedback && (
                      <p className="text-xs text-amber-900 mt-1.5 bg-amber-50 p-2 rounded border border-amber-200">
                        <strong className="text-amber-950">Reviewer ({task.reviewed_by_name || 'Manager'}):</strong> {task.reviewer_feedback}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-2 flex-shrink-0">
                    <span className="text-[11px] text-zinc-400">
                      {task.submitted_at ? `Submitted ${new Date(task.submitted_at).toLocaleDateString()}` : 'In Review'}
                    </span>

                    {task.status === 'changes_requested' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openSubmitModal(task)}
                        className="flex items-center gap-1.5 text-xs bg-amber-600 hover:bg-amber-700"
                      >
                        <RotateCcw className="w-3 h-3 text-white" />
                        <span>Resume Work & Resubmit</span>
                      </Button>
                    )}

                    {task.status === 'approved' && (
                      <div className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Approved by {task.reviewed_by_name || 'Manager'}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. Tab Content: My Rework & Defects */}
      {activeTabSubSection === 'rework' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-950">Assigned Defects & Corrective Maintenance</h3>
            <p className="text-xs text-zinc-500">Defects linked to delivered modules. Time logged here is tagged as corrective rework and tracked for accounting.</p>
          </div>

          {reworkBugs.length === 0 ? (
            <EmptyState
              title="No defects assigned"
              description="Great job! You have zero open defect fixes assigned to you."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reworkBugs.map((bug) => {
                const isCurrentActive = activeSession?.bug_id === bug.id;

                return (
                  <Card key={bug.id} className="p-5 flex flex-col justify-between border-zinc-200/90 hover:border-zinc-300 transition-all">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono font-bold bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded border border-zinc-200">
                            {bug.module_code || 'MOD'}
                          </span>
                          <span className="text-xs text-zinc-500 font-medium">{bug.module_version || 'v1.0.0'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <SeverityBadge severity={bug.severity} />
                          <StatusBadge status={bug.status} />
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-zinc-950 mb-1">{bug.title}</h4>
                      <p className="text-xs text-zinc-600 line-clamp-3 mb-3 leading-relaxed">
                        {bug.description}
                      </p>

                      {bug.reproduction_steps && (
                        <div className="text-[11px] text-zinc-700 bg-zinc-50 p-2 rounded mb-3 border border-zinc-200">
                          <strong className="block text-zinc-900 mb-0.5">Reproduction Steps:</strong>
                          <span className="line-clamp-2">{bug.reproduction_steps}</span>
                        </div>
                      )}

                      <div className="text-[11px] text-zinc-500 space-y-1.5 bg-zinc-50 p-2.5 rounded-lg border border-zinc-150 mb-4">
                        <div className="flex items-center justify-between">
                          <span>Assigned Deadline:</span>
                          <DeadlineBadge deadline={bug.deadline} showDate />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Tracked Corrective Duration:</span>
                          <strong className="font-mono text-zinc-900">{bug.corrective_hours} hrs</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>QA Verification:</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            bug.qa_verification_status === 'passed' ? 'bg-emerald-100 text-emerald-800' :
                            bug.qa_verification_status === 'failed' ? 'bg-rose-100 text-rose-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {bug.qa_verification_status || 'Pending'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Work Status:</span>
                          <strong className="capitalize text-zinc-800">{bug.status.replace(/_/g, ' ')}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenBugWorkspace(bug)}
                        className="text-xs text-zinc-600 hover:text-zinc-950 flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Bug & Code</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Button>

                      {isCurrentActive ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenBugWorkspace(bug)}
                          className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          <span>Open IDE</span>
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenBugWorkspace(bug)}
                          className="flex items-center gap-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 border-indigo-600 cursor-pointer shadow-xs"
                          disabled={bug.status === 'closed'}
                        >
                          <Code2 className="w-3.5 h-3.5 text-white" />
                          <span>Open IDE</span>
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 8. Tab Content: Time History & Corrections */}
      {activeTabSubSection === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-950">Logged Time Entries & Correction Requests</h3>
              <p className="text-xs text-zinc-500">Every recorded work session is permanently preserved. You can submit correction requests if a recorded timer was inaccurate.</p>
            </div>
          </div>

          {timeEntries.length === 0 ? (
            <EmptyState
              title="No time entries logged"
              description="Complete a work session on an assigned task or defect to generate time records."
            />
          ) : (
            <div className="overflow-x-auto bg-white border border-zinc-200/90 rounded-xl shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Work Item / Title</th>
                    <th className="py-3 px-4">Work Category</th>
                    <th className="py-3 px-4">Recorded Duration</th>
                    <th className="py-3 px-4">Work Description</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {timeEntries.map((te) => {
                    const hasCorrection = correctionRequests.find(c => c.time_entry_id === te.id);

                    return (
                      <tr key={te.id} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono text-zinc-600 whitespace-nowrap">
                          {te.date || te.created_at.split('T')[0]}
                        </td>
                        <td className="py-3 px-4 font-medium text-zinc-900 max-w-[200px] truncate">
                          {te.bug_title || te.target_title || te.bug_id || 'Task Session'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            te.work_type === 'original_development'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {te.work_type === 'original_development' ? 'Original Dev' : 'Corrective Rework'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-zinc-950 whitespace-nowrap">
                          {te.hours_spent} hrs
                        </td>
                        <td className="py-3 px-4 text-zinc-600 max-w-[320px] truncate">
                          {te.work_description}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {hasCorrection ? (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              hasCorrection.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                              hasCorrection.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              Correction: {hasCorrection.status} ({hasCorrection.requested_hours}h)
                            </span>
                          ) : (
                            <button
                              onClick={() => openCorrectionModal(te)}
                              className="text-xs text-zinc-600 hover:text-zinc-950 font-semibold underline underline-offset-2"
                            >
                              Request Correction
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}


      {/* MODAL 2: Task Submission Modal */}
      <Modal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        title={`Submit Work: ${selectedTaskToSubmit?.title}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-600 leading-relaxed">
            Submit your work for formal manager sign-off. If changes are requested by your manager, you will be notified with their explanation and can resubmit anytime.
          </p>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
              Completion Notes & PR Link (Required)
            </label>
            <textarea
              rows={4}
              value={submissionNotes}
              onChange={(e) => setSubmissionNotes(e.target.value)}
              placeholder="Detail your solution, unit test coverage, GitHub pull request link, or deployment instructions..."
              className="w-full text-xs p-3 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-950 text-zinc-900 font-medium"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setSubmitModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              isLoading={submittingTask}
              disabled={submittingTask}
              onClick={handleSubmitTask}
            >
              Submit for Review
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: Time Correction Request Modal */}
      <Modal
        isOpen={correctionModalOpen}
        onClose={() => setCorrectionModalOpen(false)}
        title="Request Time Correction"
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-600 leading-relaxed">
            If recorded time was inaccurate (e.g. system timeout or interrupted session), submit a correction request. The original entry is preserved in the audit trail.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                Original Recorded Hours
              </label>
              <input
                type="text"
                disabled
                value={`${selectedEntryForCorrection?.hours_spent || 0} hrs`}
                className="w-full text-xs p-2 bg-zinc-100 border border-zinc-200 rounded-lg font-mono text-zinc-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                Corrected Hours
              </label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                value={correctionHours}
                onChange={(e) => setCorrectionHours(e.target.value)}
                className="w-full text-xs p-2 bg-zinc-50 border border-zinc-300 rounded-lg font-mono text-zinc-900 focus:outline-none focus:border-zinc-950"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
              Reason for Adjustment
            </label>
            <textarea
              rows={3}
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              placeholder="Explain why the recorded duration should be adjusted..."
              className="w-full text-xs p-3 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:outline-none focus:border-zinc-950 text-zinc-900"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setCorrectionModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              isLoading={submittingCorrection}
              disabled={submittingCorrection}
              onClick={handleRequestCorrection}
            >
              Submit Correction Request
            </Button>
          </div>
        </div>
      </Modal>

      {/* 9. REAL-TIME DEVELOPMENT WORKSPACE IDE (Full-screen Overlay) */}
      {(workspaceTask || workspaceBug) && (
        <DevelopmentWorkspace
          task={workspaceTask}
          bug={workspaceBug}
          activeSession={activeSession}
          onPauseSession={handlePauseSession}
          onResumeSession={handleResumeSession}
          onStopSession={async (sessionId, notes) => {
            await handleStopSession(notes);
          }}
          onSubmitTask={async (taskId, notes) => {
            await api.submitTask(taskId, notes);
            await loadWorkspaceData();
          }}
          onClose={() => {
            setWorkspaceTask(null);
            setWorkspaceBug(null);
          }}
          onRefreshData={loadWorkspaceData}
        />
      )}
    </div>
  );
};
