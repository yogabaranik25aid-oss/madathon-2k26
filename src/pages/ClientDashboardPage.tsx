import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Module, Bug, BugSeverity } from '../../types';
import { useToast } from '../components/common/Toast';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { 
  ShieldCheck, 
  PackageCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  PlusCircle, 
  Star, 
  ExternalLink, 
  LogOut, 
  Building2, 
  Calendar, 
  User, 
  Check, 
  X,
  FileText,
  AlertCircle,
  RefreshCw,
  Search,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

export const ClientDashboardPage: React.FC = () => {
  const { currentUser, logout } = useApp();
  const { addToast } = useToast();

  const [modules, setModules] = useState<Module[]>([]);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab: 'modules' | 'defects'
  const [activeView, setActiveView] = useState<'modules' | 'defects'>('modules');
  const [searchQuery, setSearchQuery] = useState('');

  // Report Defect Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [defectTitle, setDefectTitle] = useState('');
  const [defectSeverity, setDefectSeverity] = useState<BugSeverity>('medium');
  const [defectDescription, setDefectDescription] = useState('');
  const [defectSteps, setDefectSteps] = useState('');
  const [defectEvidence, setDefectEvidence] = useState('');
  const [defectDate, setDefectDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmittingDefect, setIsSubmittingDefect] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Verify Fix Modal State
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [selectedBugForVerification, setSelectedBugForVerification] = useState<Bug | null>(null);
  const [starRating, setStarRating] = useState(5);
  const [verifyFeedback, setVerifyFeedback] = useState('');
  const [isSubmittingVerify, setIsSubmittingVerify] = useState(false);

  // Reopen Defect Modal State
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [selectedBugForReopen, setSelectedBugForReopen] = useState<Bug | null>(null);
  const [reopenReason, setReopenReason] = useState('');
  const [isSubmittingReopen, setIsSubmittingReopen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [modulesData, bugsData] = await Promise.all([
        api.getClientModules(),
        api.getClientBugs(),
      ]);
      setModules(modulesData);
      setBugs(bugsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load client deliverables.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenReportModal = (moduleId?: string) => {
    if (moduleId) {
      setSelectedModuleId(moduleId);
    } else if (modules.length > 0) {
      setSelectedModuleId(modules[0].id);
    }
    setDefectTitle('');
    setDefectSeverity('medium');
    setDefectDescription('');
    setDefectSteps('');
    setDefectEvidence('');
    setDefectDate(new Date().toISOString().split('T')[0]);
    setReportError(null);
    setIsReportModalOpen(true);
  };

  const handleSubmitDefect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModuleId) {
      setReportError('Please select a delivered module.');
      return;
    }
    if (!defectTitle.trim()) {
      setReportError('Please provide a descriptive defect title.');
      return;
    }
    if (!defectDescription.trim()) {
      setReportError('Please provide description of the defect.');
      return;
    }

    setIsSubmittingDefect(true);
    setReportError(null);
    try {
      let safeBugFoundDate = new Date().toISOString();
      try {
        const d = new Date(defectDate);
        if (!isNaN(d.getTime())) {
          safeBugFoundDate = d.toISOString();
        }
      } catch {
        // fallback to current timestamp
      }

      const newDefect = await api.reportClientDefect({
        module_id: selectedModuleId,
        title: defectTitle.trim(),
        severity: defectSeverity,
        description: defectDescription.trim(),
        reproduction_steps: defectSteps.trim(),
        evidence_urls: defectEvidence.trim(),
        bug_found_date: safeBugFoundDate,
      });

      addToast({
        type: 'success',
        title: 'Defect Submitted to Manager',
        message: `Report ${newDefect.id} queued for Manager Review. Lifecycle state: Pending Manager Review.`,
      });

      setIsReportModalOpen(false);
      fetchData().catch((e) => console.warn('Background refresh note:', e));
    } catch (err: any) {
      setReportError(err.message || 'Failed to submit defect report. Please try again.');
    } finally {
      setIsSubmittingDefect(false);
    }
  };

  const handleOpenVerifyModal = (bug: Bug) => {
    setSelectedBugForVerification(bug);
    setStarRating(5);
    setVerifyFeedback('Fix verified successfully in production staging environment.');
    setIsVerifyModalOpen(true);
  };

  const handleSubmitVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBugForVerification) return;

    setIsSubmittingVerify(true);
    try {
      await api.verifyClientDefectFix(selectedBugForVerification.id, {
        rating: starRating,
        feedback: verifyFeedback.trim(),
      });

      addToast({
        type: 'success',
        title: 'Fix Verified & Closed',
        message: `Defect ${selectedBugForVerification.id} confirmed resolved with ${starRating}★ rating. Status set to CLOSED.`,
      });

      setIsVerifyModalOpen(false);
      setSelectedBugForVerification(null);
      fetchData().catch((e) => console.warn('Background refresh note:', e));
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Verification Failed',
        message: err.message || 'Could not verify fix.',
      });
    } finally {
      setIsSubmittingVerify(false);
    }
  };

  const handleOpenReopenModal = (bug: Bug) => {
    setSelectedBugForReopen(bug);
    setReopenReason('');
    setIsReopenModalOpen(true);
  };

  const handleSubmitReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBugForReopen || !reopenReason.trim()) return;

    setIsSubmittingReopen(true);
    try {
      await api.clientRequestReopen(selectedBugForReopen.id, {
        reason: reopenReason.trim(),
      });

      addToast({
        type: 'warning',
        title: 'Defect Reopened',
        message: `Defect ${selectedBugForReopen.id} reopened. Engineering lead and developer re-notified.`,
      });

      setIsReopenModalOpen(false);
      setSelectedBugForReopen(null);
      fetchData().catch((e) => console.warn('Background refresh note:', e));
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Reopen Request Failed',
        message: err.message || 'Could not request reopening.',
      });
    } finally {
      setIsSubmittingReopen(false);
    }
  };

  const deliveredCount = modules.length;

  const activeBugsCount = bugs.filter(b => b.status !== 'closed').length;
  const closedBugsCount = bugs.filter(b => b.status === 'closed' || b.client_verified).length;
  const totalReopens = modules.reduce((sum, m) => sum + (m.reopen_count || 0), 0);

  const filteredModules = modules.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.project_name && m.project_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredBugs = bugs.filter(b =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.module_name && b.module_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 pb-16">
      {/* Top Client Navbar */}
      <header className="sticky top-0 z-30 bg-white border-b border-zinc-200/80 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center shadow-md shadow-zinc-950/20">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-zinc-950">ReworkGuard</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  Client Portal
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-medium">
                {currentUser?.name || 'Authorized Client'} • Account: {currentUser?.client_id || 'CLI-001'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenReportModal()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-teal-400" />
              <span>Report Defect</span>
            </button>
            <button
              onClick={logout}
              className="p-2 rounded-xl border border-zinc-200 text-zinc-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-zinc-950/10 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-teal-400">
              <Building2 className="w-3.5 h-3.5" />
              <span>Client Deliverables & Defect SLA Tracking</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {currentUser?.name || 'Acme Enterprise'}
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Track your production modules, inspect completed delivery timestamps, raise defects with direct Manager Review routing, and verify engineering resolutions.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Records</span>
            </button>
            <button
              onClick={() => handleOpenReportModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 text-xs font-bold shadow-md shadow-teal-500/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Raise Bug Report</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Delivered Modules</div>
              <div className="text-2xl font-black text-zinc-950 mt-1">{deliveredCount}</div>
              <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1 font-medium">
                <PackageCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Production releases</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
              <PackageCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Active Defects</div>
              <div className="text-2xl font-black text-zinc-950 mt-1">{activeBugsCount}</div>
              <div className="text-[11px] text-amber-600 mt-1 flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>Under Review / Fixing</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Verified & Closed</div>
              <div className="text-2xl font-black text-zinc-950 mt-1">{closedBugsCount}</div>
              <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Client signed off</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Reopen Events</div>
              <div className="text-2xl font-black text-zinc-950 mt-1">{totalReopens}</div>
              <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1 font-medium">
                <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
                <span>Accredited reopenings</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
              <RefreshCw className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* View Switcher & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-zinc-200/80 shadow-sm">
          <div className="inline-flex rounded-xl bg-zinc-100 p-1 w-full sm:w-auto">
            <button
              onClick={() => setActiveView('modules')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === 'modules'
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Delivered Modules ({modules.length})
            </button>
            <button
              onClick={() => setActiveView('defects')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === 'defects'
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Defects & Fix Verification ({bugs.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search modules or bugs..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-zinc-950"
            />
          </div>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-zinc-200/80">
            <LoadingSpinner size="lg" />
            <span className="text-xs font-semibold text-zinc-500">Loading authoritative client records...</span>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : activeView === 'modules' ? (
          /* Delivered Modules View */
          <div className="space-y-4">
            {filteredModules.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-zinc-200/80">
                <PackageCheck className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-zinc-800">No delivered modules found</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  Modules delivered by the engineering team to Acme Enterprise will appear here once approved for release.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredModules.map((m) => {
                  const moduleBugs = bugs.filter(b => b.module_id === m.id);
                  const openDefects = moduleBugs.filter(b => b.status !== 'closed').length;
                  const closedDefects = moduleBugs.filter(b => b.status === 'closed').length;

                  return (
                    <div
                      key={m.id}
                      className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-sm hover:border-zinc-300 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700">
                                {m.code}
                              </span>
                              <span className="text-xs font-semibold text-zinc-500">{m.version}</span>
                              <span className="text-[11px] text-zinc-400">• {m.project_name || 'Core Platform'}</span>
                            </div>
                            <h3 className="text-base font-bold text-zinc-950 mt-1.5">{m.name}</h3>
                          </div>
                          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                            m.status === 'completed' || m.status === 'closed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : m.status === 'reopened'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {m.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed mb-4">
                          {m.description}
                        </p>

                        <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-50 rounded-xl text-xs mb-4">
                          <div>
                            <span className="text-[11px] text-zinc-400 block">Original Developer</span>
                            <span className="font-semibold text-zinc-800 flex items-center gap-1 mt-0.5">
                              <User className="w-3.5 h-3.5 text-zinc-400" />
                              {m.owner_name || 'Assigned Lead'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[11px] text-zinc-400 block">Delivered On</span>
                            <span className="font-semibold text-zinc-800 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                              {m.delivered_at ? new Date(m.delivered_at).toLocaleDateString() : 'Delivered'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[11px] text-zinc-400 block">Committed Deadline</span>
                            <span className="font-medium text-zinc-700 mt-0.5 block">
                              {m.committed_deadline ? new Date(m.committed_deadline).toLocaleDateString() : 'On Schedule'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[11px] text-zinc-400 block">Reopen Count</span>
                            <span className={`font-bold mt-0.5 block ${m.reopen_count ? 'text-amber-600' : 'text-zinc-600'}`}>
                              {m.reopen_count || 0} times
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                        <div className="text-xs text-zinc-500 font-medium">
                          {openDefects > 0 ? (
                            <span className="text-amber-600 font-semibold">{openDefects} active defects</span>
                          ) : (
                            <span className="text-emerald-600 font-semibold">0 active defects</span>
                          )}
                          <span className="mx-1.5">•</span>
                          <span>{closedDefects} resolved</span>
                        </div>

                        <button
                          onClick={() => handleOpenReportModal(m.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition-all cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-teal-400" />
                          <span>Raise Defect</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Defects & Fix Verification View */
          <div className="space-y-4">
            {filteredBugs.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-zinc-200/80">
                <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-zinc-800">No reported defects</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  All delivered modules are operating cleanly without active bug reports.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBugs.map((bug) => {
                  const isPendingManager = bug.classification_status === 'pending_manager_review';
                  const isFixed = bug.status === 'fixed' || bug.status === 'review_pending';
                  const isClosed = bug.status === 'closed';

                  return (
                    <div
                      key={bug.id}
                      className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm hover:border-zinc-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-zinc-500">{bug.id}</span>
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                            bug.severity === 'critical'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : bug.severity === 'high'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {bug.severity}
                          </span>
                          <span className="text-xs font-medium text-zinc-400">
                            Module: <strong>{bug.module_name || bug.module_id}</strong>
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-zinc-950">{bug.title}</h4>
                        <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                          {bug.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 pt-1">
                          <span>Reported: {new Date(bug.created_at).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Assigned Engineer: <strong>{bug.assigned_to_name || 'Engineering Lead'}</strong></span>
                          {bug.client_rating && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-amber-600 font-bold">
                                <Star className="w-3.5 h-3.5 fill-amber-500" />
                                {bug.client_rating}/5 Client Rating
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-end md:items-center gap-3 flex-shrink-0">
                        {isPendingManager ? (
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              <span>Pending Manager Review</span>
                            </span>
                            <span className="block text-[10px] text-zinc-400 mt-0.5">Under evaluation by Team Lead</span>
                          </div>
                        ) : bug.status === 'reopened' ? (
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                              <RotateCcw className="w-3 h-3 text-rose-600" />
                              <span>Reopened (Cycle {bug.reopen_count || 1})</span>
                            </span>
                            <span className="block text-[10px] text-zinc-400 mt-0.5">Under corrective rework</span>
                          </div>
                        ) : isClosed ? (
                          <div className="flex flex-col items-end gap-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Verified & Closed</span>
                            </span>
                            <button
                              onClick={() => handleOpenReopenModal(bug)}
                              className="text-[11px] text-zinc-400 hover:text-rose-600 font-medium transition-colors cursor-pointer"
                            >
                              Issue recurred? Reopen
                            </button>
                          </div>
                        ) : isFixed ? (
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="text-[10px] font-semibold text-emerald-600">Fix ready in staging</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenVerifyModal(bug)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Verify & Close Fix</span>
                              </button>
                              <button
                                onClick={() => handleOpenReopenModal(bug)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                                title="If defect persists in testing"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Request Reopening</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                              <RefreshCw className="w-3 h-3 text-blue-600" />
                              <span>In Progress ({bug.classification_status?.replace(/_/g, ' ') || 'Defect'})</span>
                            </span>
                            <span className="block text-[10px] text-zinc-400 mt-0.5">Corrective rework active</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal: Report Defect / Raise Bug */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-zinc-200 shadow-2xl p-6 sm:p-7 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-zinc-950">Report Defect / Raise Bug</h3>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{reportError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitDefect} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Delivered Module</label>
                <select
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:outline-none focus:border-zinc-950 font-medium"
                  required
                >
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} — {m.name} ({m.version})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Defect Title</label>
                <input
                  type="text"
                  value={defectTitle}
                  onChange={(e) => setDefectTitle(e.target.value)}
                  placeholder="e.g. Session invalidation failure on concurrent logout"
                  className="w-full text-xs py-2 px-3 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:outline-none focus:border-zinc-950 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Severity</label>
                  <select
                    value={defectSeverity}
                    onChange={(e) => setDefectSeverity(e.target.value as BugSeverity)}
                    className="w-full text-xs py-2 px-3 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:outline-none focus:border-zinc-950 font-medium"
                  >
                    <option value="low">Low (Cosmetic / Minor)</option>
                    <option value="medium">Medium (Standard Bug)</option>
                    <option value="high">High (Major Feature Failure)</option>
                    <option value="critical">Critical (System Blocker / Data Issue)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Date Discovered</label>
                  <input
                    type="date"
                    value={defectDate}
                    onChange={(e) => setDefectDate(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:outline-none focus:border-zinc-950 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Description & Expected vs Actual Behavior</label>
                <textarea
                  value={defectDescription}
                  onChange={(e) => setDefectDescription(e.target.value)}
                  rows={3}
                  placeholder="Explain the unexpected behavior encountered..."
                  className="w-full text-xs py-2 px-3 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:outline-none focus:border-zinc-950 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Steps to Reproduce</label>
                <textarea
                  value={defectSteps}
                  onChange={(e) => setDefectSteps(e.target.value)}
                  rows={2}
                  placeholder="1. Log in to dashboard&#10;2. Click export button&#10;3. Observe 500 error"
                  className="w-full text-xs py-2 px-3 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:outline-none focus:border-zinc-950 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Evidence / Screenshot / Log URL (Optional)</label>
                <input
                  type="text"
                  value={defectEvidence}
                  onChange={(e) => setDefectEvidence(e.target.value)}
                  placeholder="https://acmecorp.s3.amazonaws.com/logs/error.log"
                  className="w-full text-xs py-2 px-3 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:outline-none focus:border-zinc-950 font-medium"
                />
              </div>

              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[11px] text-zinc-500 leading-relaxed">
                ℹ️ <strong>Workflow Notice:</strong> Submitting this report assigns initial state <em>Pending Manager Review</em>. The Engineering Lead evaluates responsibility before task reopening.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDefect}
                  className="px-5 py-2 text-xs font-bold bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmittingDefect ? (
                    <>
                      <LoadingSpinner size="sm" color="light" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Defect Report</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Verify Fix & Close */}
      {isVerifyModalOpen && selectedBugForVerification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-zinc-200 shadow-2xl p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-zinc-950">Verify & Approve Fix</h3>
              </div>
              <button
                onClick={() => setIsVerifyModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl text-xs space-y-1">
              <div className="font-bold text-zinc-900">{selectedBugForVerification.title}</div>
              <div className="text-zinc-500">ID: {selectedBugForVerification.id} • Module: {selectedBugForVerification.module_name}</div>
            </div>

            <form onSubmit={handleSubmitVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Quality Star Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setStarRating(star)}
                      className="p-1 text-zinc-300 hover:text-amber-500 transition-colors cursor-pointer"
                    >
                      <Star className={`w-6 h-6 ${star <= starRating ? 'text-amber-500 fill-amber-500' : 'text-zinc-300'}`} />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-zinc-700 ml-2">{starRating} of 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Client Feedback / Sign-off Notes</label>
                <textarea
                  value={verifyFeedback}
                  onChange={(e) => setVerifyFeedback(e.target.value)}
                  rows={3}
                  className="w-full text-xs py-2 px-3 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:outline-none focus:border-zinc-950 font-medium"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsVerifyModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVerify}
                  className="px-5 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmittingVerify ? (
                    <>
                      <LoadingSpinner size="sm" color="light" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <span>Sign Off & Close Defect</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Request Reopening */}
      {isReopenModalOpen && selectedBugForReopen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-zinc-200 shadow-2xl p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-zinc-950">Request Defect Reopening</h3>
              </div>
              <button
                onClick={() => setIsReopenModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-xs space-y-1">
              <div className="font-bold text-zinc-900">{selectedBugForReopen.title}</div>
              <div className="text-zinc-500">ID: {selectedBugForReopen.id} • Module: {selectedBugForReopen.module_name || selectedBugForReopen.module_id}</div>
              <div className="text-[11px] text-rose-700 font-medium pt-1 leading-relaxed">
                Reopening indicates the defect persists or has regressed. The defect status returns to <strong>Reopened</strong>, module reopen count increments, and engineering is alerted.
              </div>
            </div>

            <form onSubmit={handleSubmitReopen} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Reason for Reopening / Defect Persistence Details *
                </label>
                <textarea
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  rows={4}
                  placeholder="Explain why the fix does not resolve the issue in your testing..."
                  className="w-full text-xs py-2 px-3 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:outline-none focus:border-zinc-950 font-medium"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReopenModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReopen || !reopenReason.trim()}
                  className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmittingReopen ? (
                    <>
                      <LoadingSpinner size="sm" color="light" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Confirm Reopen Request</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

