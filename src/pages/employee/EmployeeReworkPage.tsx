import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { EmployeeAssignedTask, Bug } from '../../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { 
  Timer, 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Layers, 
  FileText, 
  ShieldAlert, 
  DollarSign, 
  Sparkles,
  Info,
  Briefcase,
  Code2
} from 'lucide-react';

export const EmployeeReworkPage: React.FC = () => {
  const { 
    currentUser, 
    selectedBugId, 
    setSelectedBugId,
    setActiveTab,
    openReworkBug,
    activeTimerSession, 
    startActiveTimer, 
    pauseActiveTimer, 
    resumeActiveTimer, 
    stopActiveTimer, 
    cancelActiveTimer, 
    refreshActiveTimerSession 
  } = useApp();

  const [assignedTasks, setAssignedTasks] = useState<EmployeeAssignedTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<EmployeeAssignedTask | null>(null);
  const [selectedBugDetails, setSelectedBugDetails] = useState<Bug | null>(null);
  const [workDescription, setWorkDescription] = useState<string>('');
  const [workCategory, setWorkCategory] = useState<'corrective_maintenance' | 'regular_development' | 'approved_new_feature'>('corrective_maintenance');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  
  const [liveSeconds, setLiveSeconds] = useState<number>(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load user's assigned tasks
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        const tasks = await api.getEmployeeTasks();
        setAssignedTasks(tasks);

        // If there is an active session, automatically select that bug
        if (activeTimerSession) {
          const matching = tasks.find(t => t.id === activeTimerSession.bug_id);
          if (matching) {
            setSelectedTask(matching);
            setWorkDescription(activeTimerSession.work_description || '');
          }
        } else if (selectedBugId) {
          const matching = tasks.find(t => t.id === selectedBugId);
          if (matching) setSelectedTask(matching);
        } else if (tasks.length > 0) {
          setSelectedTask(tasks[0]);
        }
      } catch (err: any) {
        console.error('Failed to load tasks for rework:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [activeTimerSession?.bug_id]);

  // Load detailed bug information when selectedTask changes
  useEffect(() => {
    if (!selectedTask) {
      setSelectedBugDetails(null);
      return;
    }
    const loadBugDetails = async () => {
      try {
        const bug = await api.getBug(selectedTask.id);
        setSelectedBugDetails(bug);
      } catch {
        // Fallback
      }
    };
    loadBugDetails();
  }, [selectedTask]);

  // Sync live timer counter
  useEffect(() => {
    if (!activeTimerSession) {
      setLiveSeconds(0);
      return;
    }

    setLiveSeconds(activeTimerSession.elapsed_active_seconds || 0);

    if (activeTimerSession.is_paused) return;

    const interval = setInterval(() => {
      setLiveSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimerSession]);

  const formatTimer = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = async () => {
    if (!selectedTask) return;
    try {
      setActionMessage(null);
      await startActiveTimer(selectedTask.id, workDescription);
      setActionMessage({ type: 'success', text: `Timer started on server for ${selectedTask.id}` });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to start active timer.' });
    }
  };

  const handlePauseTimer = async () => {
    try {
      setActionMessage(null);
      await pauseActiveTimer();
      setActionMessage({ type: 'success', text: 'Timer paused. Active seconds preserved on server.' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to pause timer.' });
    }
  };

  const handleResumeTimer = async () => {
    try {
      setActionMessage(null);
      await resumeActiveTimer();
      setActionMessage({ type: 'success', text: 'Timer resumed.' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to resume timer.' });
    }
  };

  const handleStopTimer = async () => {
    try {
      setActionMessage(null);
      const res = await stopActiveTimer(workDescription);
      setActionMessage({
        type: 'success',
        text: `Logged ${res.timeEntry.hours_spent}h corrective time (₹${res.reworkCost}). Ready for review.`,
      });
      // Refresh task details
      if (selectedTask) {
        const bug = await api.getBug(selectedTask.id);
        setSelectedBugDetails(bug);
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to stop timer.' });
    }
  };

  const handleCancelTimer = async () => {
    if (!window.confirm('Are you sure you want to discard this timer session? No time entry will be recorded.')) {
      return;
    }
    try {
      await cancelActiveTimer();
      setActionMessage({ type: 'success', text: 'Timer session discarded.' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to discard session.' });
    }
  };

  const handleSubmitForReview = async () => {
    if (!selectedTask) return;
    try {
      setIsSubmittingReview(true);
      setActionMessage(null);
      await api.submitEmployeeWorkForReview(selectedTask.id, reviewNotes || workDescription);
      setActionMessage({
        type: 'success',
        text: `Defect ${selectedTask.id} submitted to Manager review queue!`,
      });
      // Refresh bug details
      const bug = await api.getBug(selectedTask.id);
      setSelectedBugDetails(bug);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to submit work for review.' });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const isCurrentTaskTracking = activeTimerSession && activeTimerSession.bug_id === selectedTask?.id;
  const isAnotherTaskTracking = activeTimerSession && activeTimerSession.bug_id !== selectedTask?.id;

  const hourlyRate = currentUser?.hourly_rate || 500;
  const estimatedCost = ((liveSeconds / 3600) * hourlyRate).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Page Title & Context */}
      <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-zinc-950 flex items-center gap-2">
            <Timer className="w-5 h-5 text-zinc-900" />
            <span>Rework & Time Tracking</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Server-calculated timer for corrective rework. Times are recorded with snapshot hourly rates.
          </p>
        </div>

        {/* Current user rate snapshot */}
        <div className="flex items-center gap-2 text-xs bg-zinc-50 border border-zinc-200 px-3.5 py-1.5 rounded-lg text-zinc-700">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span>Authorized Rate Snapshot:</span>
          <strong className="text-zinc-950 font-mono">₹{hourlyRate}/hr</strong>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in ${
          actionMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Main Grid: Task Verifier (Left) & Server Timer Controls (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Work Item / Defect Verification (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-zinc-600" />
                <span>Defect Verification & Specification</span>
              </h3>
              <span className="text-[11px] text-zinc-400">Step 1 of 2</span>
            </div>

            {/* Select Assigned Task Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Select Assigned Work Item
              </label>
              <select
                value={selectedTask?.id || ''}
                onChange={(e) => {
                  const t = assignedTasks.find(item => item.id === e.target.value);
                  if (t) {
                    setSelectedTask(t);
                    setSelectedBugId(t.id);
                  }
                }}
                disabled={Boolean(activeTimerSession)}
                className="w-full text-xs rounded-lg border border-zinc-300 p-2.5 bg-white font-medium text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-500"
              >
                {assignedTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id}: {t.title} ({t.module_name} - {t.severity.toUpperCase()})
                  </option>
                ))}
              </select>
              {activeTimerSession && (
                <p className="text-[10px] text-amber-700 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Timer is currently active. Stop or cancel the session to switch work items.
                </p>
              )}
            </div>

            {/* Defect Details Card */}
            {selectedBugDetails ? (
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-zinc-500">
                    {selectedBugDetails.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-zinc-200 text-zinc-800 uppercase">
                      {selectedBugDetails.severity}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-zinc-950 text-white uppercase font-mono">
                      {selectedBugDetails.priority}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-zinc-950 text-sm">
                    {selectedBugDetails.title}
                  </h4>
                  <p className="text-zinc-600 mt-1 leading-relaxed">
                    {selectedBugDetails.description || 'No additional description provided.'}
                  </p>
                </div>

                {selectedBugDetails.reproduction_steps && (
                  <div className="pt-2 border-t border-zinc-200/60">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-0.5">
                      Reproduction Steps
                    </span>
                    <p className="text-zinc-600 whitespace-pre-wrap font-mono text-[11px] bg-white p-2.5 rounded-lg border border-zinc-200">
                      {selectedBugDetails.reproduction_steps}
                    </p>
                  </div>
                )}

                {/* Module & Historical Effort Snapshot */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-200/60">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block font-medium">
                      Linked Module
                    </span>
                    <p className="font-semibold text-zinc-900 mt-0.5 truncate">
                      {selectedTask?.module_name} ({selectedTask?.module_code})
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block font-medium">
                      Cumulative Rework Effort
                    </span>
                    <p className="font-semibold text-zinc-900 mt-0.5">
                      {selectedBugDetails.corrective_hours} hrs logged (₹{selectedBugDetails.rework_cost})
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-zinc-400">
                Select a task above to inspect defect parameters.
              </div>
            )}

            {/* Work Category Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Work Category
              </label>
              <select
                value={workCategory}
                onChange={(e) => setWorkCategory(e.target.value as any)}
                className="w-full text-xs rounded-lg border border-zinc-300 p-2.5 bg-white font-medium text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="corrective_maintenance">Corrective Maintenance (Tracked for Rework Analysis)</option>
                <option value="regular_development">Regular Development (Excluded from Rework Adjustment)</option>
                <option value="approved_new_feature">Approved New Feature (Excluded from Rework Adjustment)</option>
              </select>
              <p className="text-[10px] text-zinc-500 mt-1">
                {workCategory === 'corrective_maintenance' 
                  ? 'Hours logged are evaluated for defect rework retrospectives.' 
                  : 'Protected: Regular development and approved new features are excluded from rework adjustment previews.'}
              </p>
            </div>

            {/* Corrective Work Description Input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Work Description & Evidence
              </label>
              <textarea
                rows={3}
                placeholder="Detail the technical fix applied, unit test cases added, or refactoring performed..."
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                className="w-full text-xs rounded-lg border border-zinc-300 p-2.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Server-Backed Active Timer (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-xs flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-zinc-600" />
                  <span>Active Timer Session</span>
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  Server Synced
                </span>
              </div>

              {isAnotherTaskTracking && (
                <div className="p-3 mb-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <p className="font-semibold">Another timer is already running</p>
                  <p className="text-[11px] mt-0.5 text-amber-700">
                    Timer is currently tracking {activeTimerSession?.bug_id}: {activeTimerSession?.bug_title}.
                  </p>
                </div>
              )}

              {/* Big Digital Clock Display */}
              <div className="bg-zinc-950 text-white rounded-2xl p-6 text-center shadow-inner my-2">
                <div className="text-[11px] font-semibold tracking-widest text-zinc-400 uppercase mb-1">
                  {activeTimerSession ? (activeTimerSession.is_paused ? 'Session Paused' : 'Tracking Active') : 'Timer Idle'}
                </div>
                <div className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-white my-1">
                  {formatTimer(liveSeconds)}
                </div>
                <div className="text-xs text-zinc-400 mt-2 flex items-center justify-center gap-1 font-mono">
                  <span>Accrued Cost:</span>
                  <span className="text-emerald-400 font-bold">₹{estimatedCost}</span>
                </div>
              </div>

              {/* Timer Control Action Buttons */}
              <div className="space-y-2 mt-5">
                {!isCurrentTaskTracking ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => selectedTask && openReworkBug(selectedTask.id)}
                      disabled={!selectedTask}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-all shadow-xs disabled:opacity-40 cursor-pointer"
                    >
                      <Code2 className="w-4 h-4 text-white" />
                      <span>Open IDE</span>
                    </button>
                    <button
                      onClick={handleStartTimer}
                      disabled={!selectedTask || Boolean(isAnotherTaskTracking)}
                      className="flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs rounded-xl transition-all shadow-xs disabled:opacity-40 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Start Timer</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-center">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-800 mb-1">
                        <span className={`w-2 h-2 rounded-full ${activeTimerSession?.is_paused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                        <span>{activeTimerSession?.is_paused ? 'Session Paused (Outside IDE)' : 'Session Active in IDE'}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Official rework duration is automatically tracked in the Rework IDE. Manual stop controls are disabled for fairness and audit integrity.
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab('employee/dashboard')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      <Briefcase className="w-4 h-4 text-zinc-300" />
                      <span>Return to IDE Workspace</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Submission Section */}
            <div className="mt-6 pt-5 border-t border-zinc-100">
              <h4 className="text-xs font-bold text-zinc-900 mb-1 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-zinc-600" />
                <span>Submit Corrective Fix for Manager Review</span>
              </h4>
              <p className="text-[11px] text-zinc-500 mb-2.5">
                Once testing passes, submit to Manager Sarah Connor for sign-off and root cause verification.
              </p>

              <button
                onClick={handleSubmitForReview}
                disabled={!selectedTask || isSubmittingReview || Boolean(isCurrentTaskTracking)}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-zinc-300 hover:border-zinc-950 bg-white hover:bg-zinc-50 text-zinc-900 font-semibold text-xs rounded-xl transition-all disabled:opacity-40 cursor-pointer shadow-2xs"
              >
                {isSubmittingReview ? (
                  <>
                    <LoadingSpinner size="sm" color="dark" />
                    <span>Submitting for Review...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit for Review</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
