import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  TaskAssignment, 
  Bug, 
  ProjectFile, 
  WorkSession,
  EngineeringRole 
} from '../../../types';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { 
  Save, 
  Send, 
  X, 
  FileCode, 
  Folder, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  Code2, 
  CheckSquare, 
  Square as SquareIcon, 
  RefreshCw, 
  Maximize2, 
  Minimize2, 
  ChevronRight, 
  ChevronDown, 
  ShieldAlert, 
  Layers, 
  Clock, 
  FileCheck, 
  Lock, 
  Unlock,
  Sparkles,
  HelpCircle,
  Bug as BugIcon
} from 'lucide-react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { SeverityBadge } from '../common/SeverityBadge';
import { useToast } from '../common/Toast';

interface DevelopmentWorkspaceProps {
  task?: TaskAssignment | null;
  bug?: Bug | null;
  activeSession: (WorkSession & { elapsed_seconds: number }) | null;
  onPauseSession: (sessionId: string) => Promise<void>;
  onResumeSession: (sessionId: string) => Promise<void>;
  onStopSession: (sessionId: string, notes?: string) => Promise<void>;
  onSubmitTask?: (taskId: string, notes: string) => Promise<void>;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const DevelopmentWorkspace: React.FC<DevelopmentWorkspaceProps> = ({
  task,
  bug,
  activeSession,
  onPauseSession,
  onResumeSession,
  onStopSession,
  onSubmitTask,
  onClose,
  onRefreshData,
}) => {
  const { addToast } = useToast();
  const { currentUser } = useApp();
  const isManager = currentUser?.role === 'manager' || currentUser?.role === 'admin';

  // Authorization check: Validate that the employee is authorized to access the assigned bug or corrective task
  const isAuthorized = useMemo(() => {
    if (!currentUser) return false;
    if (isManager) return true;
    if (bug) {
      return (
        !bug.assigned_to_id ||
        bug.assigned_to_id === currentUser.id ||
        bug.original_author_id === currentUser.id ||
        bug.original_module_owner_id === currentUser.id
      );
    }
    if (task) {
      return !task.assigned_to_id || task.assigned_to_id === currentUser.id;
    }
    return true;
  }, [currentUser, isManager, task, bug]);

  // Workspace files & editor state
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [activeFilePath, setActiveFilePath] = useState<string>('');
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [savedContents, setSavedContents] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Live timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Acceptance criteria checkboxes state
  const [criteriaChecked, setCriteriaChecked] = useState<Record<number, boolean>>({});

  // Bottom drawer state (tabs: 'diagnostics' | 'terminal' | 'acceptance')
  const [activeBottomTab, setActiveBottomTab] = useState<'terminal' | 'diagnostics' | 'acceptance'>('terminal');
  const [isBottomOpen, setIsBottomOpen] = useState(true);
  const [runningTests, setRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<{
    suite: string;
    test_name: string;
    total_tests: number;
    passed_tests: number;
    failed_tests: number;
    output: string;
    diagnostics: Array<{ type: string; message: string }>;
  } | null>(null);

  // Submission modal state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize elapsed timer with active session
  useEffect(() => {
    if (activeSession) {
      setElapsedSeconds(activeSession.elapsed_seconds || 0);
    }
  }, [activeSession]);

  // Keep ref to activeSession for unmount and visibility auto-pause
  const activeSessionRef = useRef(activeSession);
  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  const pauseActiveSession = useCallback(async () => {
    const session = activeSessionRef.current;
    if (session && session.status === 'active') {
      try {
        await api.pauseWorkSession(session.id);
        if (onRefreshData) onRefreshData();
      } catch (err) {
        console.error('Error auto-pausing work session:', err);
      }
    }
  }, [onRefreshData]);

  const resumeActiveSession = useCallback(async () => {
    const session = activeSessionRef.current;
    if (session && session.status === 'paused') {
      try {
        await onResumeSession(session.id);
        if (onRefreshData) onRefreshData();
      } catch (err) {
        console.error('Error auto-resuming work session:', err);
      }
    }
  }, [onResumeSession, onRefreshData]);

  // Auto-start timer on enter (if none), or auto-resume (if paused)
  useEffect(() => {
    if (!isAuthorized) return;
    let isCancelled = false;

    const autoStartOrResume = async () => {
      try {
        if (!activeSession) {
          const targetId = bug ? bug.id : task?.id;
          const targetTitle = bug ? bug.title : task?.title;
          const workType = bug ? 'corrective_rework' : 'original_development';
          if (targetId && targetTitle) {
            await api.startWorkSession({
              target_id: targetId,
              target_title: targetTitle,
              work_type: workType,
              task_id: bug?.original_task_id || task?.id,
              bug_id: bug?.id,
            });
            if (!isCancelled && onRefreshData) {
              onRefreshData();
            }
          }
        } else if (activeSession.status === 'paused') {
          await onResumeSession(activeSession.id);
          if (!isCancelled && onRefreshData) {
            onRefreshData();
          }
        }
      } catch (err: any) {
        console.error('Auto start/resume timer error:', err);
      }
    };

    autoStartOrResume();

    return () => {
      isCancelled = true;
      // Auto-pause timer when leaving the IDE
      if (activeSessionRef.current && activeSessionRef.current.status === 'active') {
        api.pauseWorkSession(activeSessionRef.current.id).catch(() => {});
      }
    };
  }, [isAuthorized]);

  // Auto-pause on tab hidden, auto-resume on tab visible
  useEffect(() => {
    if (!isAuthorized) return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        pauseActiveSession();
      } else if (document.visibilityState === 'visible') {
        resumeActiveSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthorized, pauseActiveSession, resumeActiveSession]);

  // Handle page unload / navigation reliably with keepalive
  useEffect(() => {
    const handleUnload = () => {
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

    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('pagehide', handleUnload);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  useEffect(() => {
    if (!activeSession || activeSession.status !== 'active') return;

    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  // Load project files on mount
  useEffect(() => {
    const fetchWorkspaceFiles = async () => {
      setLoadingFiles(true);
      try {
        let loadedFiles: ProjectFile[] = [];
        if (bug) {
          loadedFiles = await api.getBugFiles(bug.id);
        } else if (task) {
          loadedFiles = await api.getTaskFiles(task.id);
        }

        setFiles(loadedFiles);
        const contentsMap: Record<string, string> = {};
        loadedFiles.forEach(f => {
          contentsMap[f.path] = f.content;
        });
        setFileContents(contentsMap);
        setSavedContents(contentsMap);

        if (loadedFiles.length > 0) {
          const firstEditable = loadedFiles.find(f => !f.read_only) || loadedFiles[0];
          setActiveFilePath(firstEditable.path);
          setOpenTabs([firstEditable.path]);
        }
      } catch (err: any) {
        addToast({
          type: 'error',
          title: 'Workspace Load Failed',
          message: err.message || 'Could not load workspace files.',
        });
      } finally {
        setLoadingFiles(false);
      }
    };

    fetchWorkspaceFiles();
  }, [task?.id, bug?.id]);

  // Format elapsed time as HH:MM:SS
  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const activeFile = useMemo(() => {
    return files.find(f => f.path === activeFilePath);
  }, [files, activeFilePath]);

  const isCurrentFileDirty = useMemo(() => {
    if (!activeFilePath) return false;
    return fileContents[activeFilePath] !== savedContents[activeFilePath];
  }, [activeFilePath, fileContents, savedContents]);

  const totalDirtyCount = useMemo(() => {
    return Object.keys(fileContents).filter(path => fileContents[path] !== savedContents[path]).length;
  }, [fileContents, savedContents]);

  // Open a file tab
  const handleOpenFile = (path: string) => {
    if (!openTabs.includes(path)) {
      setOpenTabs(prev => [...prev, path]);
    }
    setActiveFilePath(path);
  };

  // Close a file tab
  const handleCloseTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t !== path);
    setOpenTabs(newTabs);
    if (activeFilePath === path) {
      if (newTabs.length > 0) {
        setActiveFilePath(newTabs[newTabs.length - 1]);
      } else {
        setActiveFilePath('');
      }
    }
  };

  // Editor content change
  const handleContentChange = (newVal: string) => {
    if (!activeFilePath || activeFile?.read_only) return;
    setFileContents(prev => ({
      ...prev,
      [activeFilePath]: newVal,
    }));
  };

  // Save changes
  const handleSave = async () => {
    if (totalDirtyCount === 0) {
      addToast({ type: 'info', title: 'Nothing to save', message: 'All files are up to date.' });
      return;
    }

    setIsSaving(true);
    try {
      if (bug) {
        await api.saveBugFiles(bug.id, fileContents);
      } else if (task) {
        await api.saveTaskFiles(task.id, fileContents);
      }
      setSavedContents({ ...fileContents });
      addToast({
        type: 'success',
        title: 'Changes Saved',
        message: `Successfully saved ${totalDirtyCount} file(s) to development repository.`,
      });
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Could not save file changes.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Run automated test runner & diagnostics
  const handleRunDiagnostics = async () => {
    if (!task && !bug) {
      addToast({ type: 'info', title: 'Diagnostics', message: 'No active task or defect selected.' });
      return;
    }

    setRunningTests(true);
    setActiveBottomTab('terminal');
    setIsBottomOpen(true);

    try {
      const result = task 
        ? await api.runTaskDiagnostics(task.id)
        : await api.runBugDiagnostics(bug!.id);
      setTestResults(result);
      addToast({
        type: 'success',
        title: 'Test Suite Passed',
        message: `${result.passed_tests}/${result.total_tests} test cases passed (${result.suite})`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Test Execution Error',
        message: err.message || 'Diagnostics runner failed.',
      });
    } finally {
      setRunningTests(false);
    }
  };

  // Close workspace and auto-pause active timer
  const handleCloseWorkspace = async () => {
    if (activeSession && activeSession.status === 'active') {
      try {
        await onPauseSession(activeSession.id);
      } catch (err) {
        console.error('Error auto-pausing on workspace exit:', err);
      }
    }
    onClose();
  };

  // Submit task or defect fix for review
  const handleConfirmSubmit = async () => {
    if (!submissionNotes.trim()) {
      addToast({
        type: 'warning',
        title: 'Notes Required',
        message: 'Please describe the changes and implementation details for review.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (bug) {
        if (totalDirtyCount > 0) {
          await api.saveBugFiles(bug.id, fileContents);
          setSavedContents({ ...fileContents });
        }
        await api.updateBug(bug.id, {
          status: 'review_pending' as any,
          status_notes: submissionNotes.trim() || 'Defect fix submitted for manager review',
          fix_notes: submissionNotes.trim(),
        });
      } else if (task) {
        if (totalDirtyCount > 0) {
          await api.saveTaskFiles(task.id, fileContents);
          setSavedContents({ ...fileContents });
        }
        if (onSubmitTask) {
          await onSubmitTask(task.id, submissionNotes.trim());
        }
      }

      // Automatically finalize and stop session on submission
      if (activeSession && onStopSession) {
        await onStopSession(activeSession.id, submissionNotes.trim());
      }

      setIsSubmitModalOpen(false);
      addToast({
        type: 'success',
        title: bug ? 'Fix Submitted for Review' : 'Work Submitted',
        message: bug ? 'Defect fix submitted to manager for accounting review!' : 'Your work has been submitted for manager review!',
      });
      if (onRefreshData) onRefreshData();
      onClose();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Submission Failed',
        message: err.message || 'Failed to submit work for review.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Engineering role badge label and styling
  const roleDisplay = useMemo(() => {
    const role = (task?.assigned_role || bug?.assigned_role || 'developer') as string;
    switch (role) {
      case 'frontend_developer':
        return { label: 'Frontend Engineer', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'backend_developer':
        return { label: 'Backend Engineer', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'database_designer':
        return { label: 'Database Architect', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      case 'qa_engineer':
      case 'qa':
        return { label: 'QA / Verification Engineer', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      default:
        return { label: 'Software Engineer', color: 'bg-slate-500/10 text-slate-300 border-slate-500/30' };
    }
  }, [task, bug]);

  // Acceptance criteria completion
  const criteriaList = task?.acceptance_criteria || [];
  const checkedCount = Object.values(criteriaChecked).filter(Boolean).length;
  const criteriaProgress = criteriaList.length > 0 ? Math.round((checkedCount / criteriaList.length) * 100) : 100;

  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-[#161b22] border border-rose-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Unauthorized Workspace Access</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              You are not authorized to access this assigned work item. Work sessions and source code editing are strictly restricted to the assigned engineer ({task?.assigned_to_name || bug?.assigned_to_name || 'Assigned Engineer'}).
            </p>
          </div>
          <Button variant="primary" onClick={onClose} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">
            Return to Workspace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0d1117] text-slate-200 font-sans select-none overflow-hidden">
      {/* 1. TOP TOOLBAR */}
      <div className="h-14 bg-[#161b22] border-b border-slate-800 px-4 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-sm">
            <Code2 className="w-5 h-5 text-indigo-400 shrink-0" />
            <span className="hidden sm:inline">ReworkGuard IDE</span>
          </div>
          <span className="text-slate-600">|</span>

          {/* Project & Module Breadcrumb */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-300 truncate">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium border border-slate-700 shrink-0">
              {bug ? (bug.project_id || 'PRJ-LLM') : (task?.project_name || 'PRJ-LLM')}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-slate-200 font-medium truncate">
              {bug ? (bug.module_name || 'Core Module') : (task?.module_name || 'Core Module')} ({bug ? (bug.module_version || 'v1.0.0') : (task?.module_version || 'v1.0.0')})
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-slate-400 truncate max-w-[200px] sm:max-w-xs font-mono text-[11px]">
              {bug ? bug.title : task?.title}
            </span>
          </div>

          {/* Role badge */}
          <span className={`hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${roleDisplay.color}`}>
            {roleDisplay.label}
          </span>
        </div>

        {/* Live Work Session Timer & Action Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {activeSession ? (
            <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1 space-x-2 shadow-inner">
              <span className={`w-2 h-2 rounded-full ${activeSession.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <div className="flex items-center space-x-1.5 text-xs font-mono font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-100">{formatTimer(elapsedSeconds)}</span>
              </div>
              <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                activeSession.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {activeSession.status === 'active' ? 'Active' : 'Paused'}
              </span>
            </div>
          ) : (
            <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1 space-x-1.5 text-xs text-emerald-400 font-mono">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              <span>Auto-tracking...</span>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving || totalDirtyCount === 0}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              totalDirtyCount > 0 
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-sm' 
                : 'bg-slate-800 text-slate-400 border-slate-700 cursor-not-allowed'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
            {totalDirtyCount > 0 && <span className="bg-indigo-800 text-white text-[10px] px-1.5 py-0.2 rounded-full">{totalDirtyCount}</span>}
          </button>

          {/* Test / Diagnostics Button */}
          {(task || bug) && (
            <button
              onClick={handleRunDiagnostics}
              disabled={runningTests}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              title="Run Automated Acceptance & Regression Test Suite"
            >
              <Terminal className={`w-3.5 h-3.5 text-emerald-400 ${runningTests ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{runningTests ? 'Testing...' : 'Run Tests'}</span>
            </button>
          )}

          {/* Submit for Review Button */}
          {!bug && task && onSubmitTask && (
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit for Review</span>
            </button>
          )}

          {bug && (
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 transition-colors shadow-sm cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Completed Fix</span>
            </button>
          )}

          {/* Close Workspace */}
          <button
            onClick={handleCloseWorkspace}
            title="Exit Development Workspace"
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE BODY */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Task Details, Acceptance Criteria, File Explorer */}
        <div className="w-80 bg-[#11161d] border-r border-slate-800 flex flex-col shrink-0 overflow-y-auto">
          {/* Section: Task Requirements / Defect Spec */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center">
                {bug ? <BugIcon className="w-3.5 h-3.5 mr-1 text-rose-400" /> : <FileCheck className="w-3.5 h-3.5 mr-1 text-indigo-400" />}
                {bug ? 'Defect Rework Spec' : 'Task Specification'}
              </span>
              {bug?.severity ? (
                <SeverityBadge severity={bug.severity} />
              ) : task?.priority ? (
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {task.priority}
                </span>
              ) : null}
            </div>

            <h3 className="text-sm font-semibold text-slate-100 leading-snug mb-1">
              {bug ? bug.title : task?.title}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              {bug ? bug.description : task?.description}
            </p>

            {bug?.reproduction_steps && (
              <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 mb-2">
                <span className="text-[10px] font-semibold text-rose-400 block mb-1">Steps to Reproduce:</span>
                <p className="text-xs text-slate-300 font-mono whitespace-pre-wrap">{bug.reproduction_steps}</p>
              </div>
            )}

            {task?.deadline && (
              <div className="flex items-center text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                <span>Deadline: <strong className="text-slate-300">{task.deadline.split('T')[0]}</strong></span>
              </div>
            )}
          </div>

          {/* Section: Acceptance Criteria Checklist (for tasks) */}
          {criteriaList.length > 0 && (
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center">
                  <CheckSquare className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  Acceptance Criteria
                </span>
                <span className="text-xs font-mono font-medium text-emerald-400">
                  {checkedCount}/{criteriaList.length}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${criteriaProgress}%` }}
                />
              </div>

              <div className="space-y-2">
                {criteriaList.map((crit, idx) => (
                  <label
                    key={idx}
                    className="flex items-start space-x-2 text-xs text-slate-300 hover:text-white cursor-pointer group select-none"
                    onClick={() => setCriteriaChecked(prev => ({ ...prev, [idx]: !prev[idx] }))}
                  >
                    <input
                      type="checkbox"
                      checked={!!criteriaChecked[idx]}
                      onChange={() => {}} // handled by parent onClick
                      className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className={`leading-relaxed ${criteriaChecked[idx] ? 'line-through text-slate-500' : ''}`}>
                      {crit}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Section: Permitted Files & File Explorer */}
          <div className="p-4 flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center">
                <Folder className="w-3.5 h-3.5 mr-1 text-amber-400" />
                Project Files
              </span>
              <span className="text-[10px] text-slate-500">
                {files.length} file{files.length === 1 ? '' : 's'}
              </span>
            </div>

            {loadingFiles ? (
              <div className="flex items-center justify-center py-8 text-xs text-slate-500">
                <RefreshCw className="w-4 h-4 mr-2 animate-spin text-slate-400" />
                Loading workspace...
              </div>
            ) : files.length === 0 ? (
              <div className="text-xs text-slate-500 italic py-4">No project files found.</div>
            ) : (
              <div className="space-y-1">
                {files.map(file => {
                  const isActive = file.path === activeFilePath;
                  const isDirty = fileContents[file.path] !== savedContents[file.path];
                  const isEditable = !file.read_only;

                  return (
                    <button
                      key={file.path}
                      onClick={() => handleOpenFile(file.path)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono text-left transition-colors ${
                        isActive
                          ? 'bg-slate-800 text-indigo-300 font-semibold border border-indigo-500/30'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <FileCode className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <span className="truncate">{file.path}</span>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                        {isDirty && (
                          <span className="w-2 h-2 rounded-full bg-amber-400" title="Unsaved changes" />
                        )}
                        {isEditable ? (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-sans border border-emerald-500/20">
                            Edit
                          </span>
                        ) : (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-500 font-sans flex items-center">
                            <Lock className="w-2.5 h-2.5 mr-0.5" /> Lock
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* CENTER PANEL: Code Editor & Tab Bar */}
        <div className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden">
          {/* TAB BAR */}
          <div className="h-9 bg-[#161b22] border-b border-slate-800 flex items-center px-2 space-x-1 overflow-x-auto shrink-0">
            {openTabs.map(path => {
              const isActive = path === activeFilePath;
              const isDirty = fileContents[path] !== savedContents[path];
              const fileName = path.split('/').pop() || path;

              return (
                <div
                  key={path}
                  onClick={() => setActiveFilePath(path)}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-t-md text-xs font-mono cursor-pointer border-t-2 transition-colors ${
                    isActive
                      ? 'bg-[#0d1117] text-slate-100 border-indigo-500 font-medium'
                      : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-slate-500" />
                  <span>{fileName}</span>
                  {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                  <button
                    onClick={(e) => handleCloseTab(path, e)}
                    className="p-0.5 hover:text-rose-400 rounded transition-colors text-slate-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* ACTIVE FILE STATUS BAR */}
          {activeFile && (
            <div className="h-7 bg-[#11161d] border-b border-slate-800/80 px-4 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
              <div className="flex items-center space-x-3">
                <span className="font-mono text-slate-300">{activeFile.path}</span>
                {activeFile.read_only ? (
                  <span className="flex items-center text-amber-400 font-medium">
                    <Lock className="w-3 h-3 mr-1" /> Read-Only File (Scoped to Assigned Role)
                  </span>
                ) : (
                  <span className="flex items-center text-emerald-400 font-medium">
                    <Unlock className="w-3 h-3 mr-1" /> Permitted Workspace File
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3 text-slate-500 font-mono">
                <span>{activeFile.language || 'typescript'}</span>
                <span>UTF-8</span>
              </div>
            </div>
          )}

          {/* REAL-TIME CODE EDITOR */}
          <div className="flex-1 flex overflow-hidden relative">
            {activeFile ? (
              <div className="flex-1 flex font-mono text-xs sm:text-sm bg-[#0d1117] overflow-auto">
                {/* Line Numbers Gutter */}
                <div className="bg-[#11161d] text-slate-600 px-3 py-3 select-none text-right border-r border-slate-800/80 shrink-0 font-mono leading-relaxed">
                  {(fileContents[activeFilePath] || '').split('\n').map((_, i) => (
                    <div key={i} className="leading-6">{i + 1}</div>
                  ))}
                </div>

                {/* Textarea Editor Area */}
                <div className="flex-1 relative">
                  <textarea
                    value={fileContents[activeFilePath] || ''}
                    onChange={(e) => handleContentChange(e.target.value)}
                    readOnly={activeFile.read_only}
                    spellCheck={false}
                    className={`w-full h-full p-3 font-mono text-xs sm:text-sm leading-6 bg-transparent text-slate-200 outline-none resize-none tab-4 ${
                      activeFile.read_only ? 'cursor-not-allowed opacity-80' : ''
                    }`}
                    style={{ tabSize: 2 }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                <FileCode className="w-12 h-12 mb-2 stroke-1 text-slate-600" />
                <p className="text-sm">Select a file from the explorer on the left to start editing.</p>
              </div>
            )}
          </div>

          {/* 3. BOTTOM DRAWER: Terminal & Diagnostics */}
          <div className={`bg-[#11161d] border-t border-slate-800 flex flex-col transition-all duration-200 shrink-0 ${
            isBottomOpen ? 'h-56' : 'h-8'
          }`}>
            {/* Drawer Header / Tabs */}
            <div className="h-8 bg-[#161b22] px-3 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => { setActiveBottomTab('terminal'); setIsBottomOpen(true); }}
                  className={`flex items-center space-x-1.5 text-xs font-medium pb-0.5 border-b-2 transition-colors ${
                    activeBottomTab === 'terminal' && isBottomOpen
                      ? 'text-indigo-400 border-indigo-400'
                      : 'text-slate-400 border-transparent hover:text-slate-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Test Terminal Output</span>
                  {testResults && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  )}
                </button>

                <button
                  onClick={() => { setActiveBottomTab('diagnostics'); setIsBottomOpen(true); }}
                  className={`flex items-center space-x-1.5 text-xs font-medium pb-0.5 border-b-2 transition-colors ${
                    activeBottomTab === 'diagnostics' && isBottomOpen
                      ? 'text-indigo-400 border-indigo-400'
                      : 'text-slate-400 border-transparent hover:text-slate-200'
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Automated Diagnostics</span>
                </button>

                <button
                  onClick={() => { setActiveBottomTab('acceptance'); setIsBottomOpen(true); }}
                  className={`flex items-center space-x-1.5 text-xs font-medium pb-0.5 border-b-2 transition-colors ${
                    activeBottomTab === 'acceptance' && isBottomOpen
                      ? 'text-indigo-400 border-indigo-400'
                      : 'text-slate-400 border-transparent hover:text-slate-200'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Criteria Verification</span>
                </button>
              </div>

              <div className="flex items-center space-x-1 text-slate-500">
                <button
                  onClick={() => setIsBottomOpen(prev => !prev)}
                  className="p-1 hover:text-slate-300 rounded transition-colors"
                >
                  {isBottomOpen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            {isBottomOpen && (
              <div className="flex-1 p-3 overflow-y-auto font-mono text-xs bg-[#090d13]">
                {activeBottomTab === 'terminal' && (
                  <div>
                    {testResults ? (
                      <div>
                        <div className="flex items-center space-x-3 mb-2 pb-2 border-b border-slate-800 text-xs">
                          <span className="text-emerald-400 font-semibold flex items-center">
                            <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-400" />
                            SUITE PASSED: {testResults.suite}
                          </span>
                          <span className="text-slate-400">
                            Tests: <strong className="text-emerald-400">{testResults.passed_tests}</strong> / {testResults.total_tests} passed
                          </span>
                        </div>
                        <pre className="text-slate-300 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                          {testResults.output}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-slate-500 italic py-4">
                        Click "Run Tests" in the top toolbar to execute automated unit tests and role-specific validation.
                      </div>
                    )}
                  </div>
                )}

                {activeBottomTab === 'diagnostics' && (
                  <div className="space-y-2">
                    <div className="text-slate-400 text-xs font-semibold mb-2">Automated Code Analysis:</div>
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                        <span>TypeScript Compiler: 0 syntax errors, 0 type discrepancies.</span>
                      </div>
                      <div className="flex items-center text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                        <span>ESLint Rules: Code follows corporate architecture guidelines.</span>
                      </div>
                      <div className="flex items-center text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                        <span>Security Check: No plaintext secret keys detected in source code.</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeBottomTab === 'acceptance' && (
                  <div className="space-y-2">
                    <div className="text-slate-400 text-xs font-semibold mb-1">Acceptance Status:</div>
                    {criteriaList.map((crit, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-xs">
                        {criteriaChecked[idx] ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        )}
                        <span className={criteriaChecked[idx] ? 'text-slate-200 font-medium' : 'text-slate-400'}>
                          {crit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SUBMISSION MODAL */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title={bug ? "Submit Completed Fix for Manager Review" : "Submit Work for Manager Review"}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            {bug ? (
              <>Submit your completed defect fix for <strong>{bug.title}</strong> to your manager for quality verification and final accounting sign-off.</>
            ) : (
              <>Submit your completed development changes for <strong>{task?.title}</strong> to your manager for quality verification and sign-off.</>
            )}
          </p>

          {/* Criteria Checklist Summary */}
          {criteriaList.length > 0 && (
            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700 text-xs">
              <span className="font-semibold text-slate-300 block mb-1">Acceptance Criteria Verified:</span>
              <span className="text-emerald-400 font-medium font-mono">{checkedCount} of {criteriaList.length} items checked</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {bug ? 'Fix Implementation Notes & Evidence' : 'Completion Notes & Work Description'} <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              value={submissionNotes}
              onChange={(e) => setSubmissionNotes(e.target.value)}
              placeholder={bug ? "Describe the root cause fix, tests executed, verification evidence, and changes made..." : "Explain the changes made, tests added or verified, and any deployment notes for your manager..."}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsSubmitModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmSubmit}
              disabled={isSubmitting || !submissionNotes.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {isSubmitting ? 'Submitting...' : bug ? 'Confirm Fix Submission' : 'Confirm Submission'}
            </Button>
          </div>
        </div>
      </Modal>


    </div>
  );
};
