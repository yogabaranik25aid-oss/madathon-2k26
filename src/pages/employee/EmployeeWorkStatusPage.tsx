import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { EmployeeWorkStatusItem } from '../../../types';
import { 
  ClipboardCheck, 
  Search, 
  MessageSquare, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RotateCcw, 
  Calendar, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  RefreshCw,
  UserCheck
} from 'lucide-react';

export const EmployeeWorkStatusPage: React.FC = () => {
  const { currentUser, setActiveTab, setSelectedBugId } = useApp();
  const [statusItems, setStatusItems] = useState<EmployeeWorkStatusItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [resubmittingId, setResubmittingId] = useState<string | null>(null);

  const fetchStatusItems = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const data = await api.getEmployeeStatus();
      setStatusItems(data);
    } catch (err: any) {
      console.error('Failed to load employee status:', err);
      setError(err.message || 'Failed to fetch work status records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatusItems();
  }, []);

  const handleResumeWork = (item: EmployeeWorkStatusItem) => {
    setSelectedBugId(item.work_item_id);
    setActiveTab('employee/rework');
  };

  const handleResubmit = async (item: EmployeeWorkStatusItem) => {
    try {
      setResubmittingId(item.work_item_id);
      await api.submitEmployeeWorkForReview(item.work_item_id, 'Resubmitted after addressing manager review comments.');
      await fetchStatusItems();
    } catch (err: any) {
      alert(err.message || 'Failed to resubmit work item.');
    } finally {
      setResubmittingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('approved')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (s.includes('changes') || s.includes('disputed')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    if (s.includes('review') || s.includes('pending')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    if (s.includes('progress')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (s.includes('fixed') || s.includes('closed')) {
      return 'bg-teal-100 text-teal-800 border-teal-200';
    }
    return 'bg-zinc-100 text-zinc-800 border-zinc-200';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-zinc-950 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-zinc-900" />
              <span>Work Status & Manager Reviews</span>
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-zinc-100 text-zinc-700">
              {statusItems.length} {statusItems.length === 1 ? 'record' : 'records'}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Track review outcomes, approvals, explanations, and change requests from managers.
          </p>
        </div>

        <button
          onClick={fetchStatusItems}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 text-zinc-700 hover:text-zinc-950 text-xs font-semibold rounded-lg hover:bg-zinc-100 transition-colors w-fit cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Status Table & Expanded History */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-400 animate-pulse">
            Loading work status items...
          </div>
        ) : statusItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-zinc-100 mx-auto flex items-center justify-center text-zinc-400">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">No work items submitted</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Once you log rework hours and submit a defect for review, manager evaluation notes and decision histories will be tracked here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Work Item & Module</th>
                  <th className="py-3 px-4 font-semibold">Logged Hours</th>
                  <th className="py-3 px-4 font-semibold">Current Status</th>
                  <th className="py-3 px-4 font-semibold">Reviewer & Feedback</th>
                  <th className="py-3 px-4 font-semibold">Last Updated</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {statusItems.map((item) => {
                  const isExpanded = expandedItemId === item.work_item_id;
                  const hasHistory = item.review_history && item.review_history.length > 0;
                  const canResubmit = item.current_status === 'changes_requested' || item.current_status === 'in_progress';

                  return (
                    <React.Fragment key={item.work_item_id}>
                      <tr className="hover:bg-zinc-50/70 transition-colors">
                        {/* Work Item & Module */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-[11px] font-semibold text-zinc-400 block">
                            {item.work_item_id}
                          </span>
                          <span className="font-bold text-zinc-950 text-xs block">
                            {item.work_item_title}
                          </span>
                          <span className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                            <Layers className="w-3 h-3 text-zinc-400" />
                            {item.module_name}
                          </span>
                        </td>

                        {/* Logged Hours & Cost */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-bold text-zinc-950 block">
                            {item.recorded_hours}h
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            ₹{(item.recorded_hours * (currentUser?.hourly_rate || 500)).toFixed(2)} cost
                          </span>
                        </td>

                        {/* Current Status Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${getStatusBadge(item.current_status)} uppercase tracking-wider`}>
                            {item.current_status.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Reviewer & Feedback */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="flex items-center gap-1.5 font-semibold text-zinc-900 text-xs mb-0.5">
                            <UserCheck className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{item.reviewer_name}</span>
                          </div>
                          <p className="text-[11px] text-zinc-600 line-clamp-2 bg-zinc-50 p-1.5 rounded border border-zinc-200/80">
                            {item.review_comments}
                          </p>
                        </td>

                        {/* Last Updated */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-zinc-500 text-[11px] font-mono">
                          {new Date(item.last_updated).toLocaleDateString()}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                          {hasHistory && (
                            <button
                              onClick={() => setExpandedItemId(isExpanded ? null : item.work_item_id)}
                              className="px-2 py-1 text-zinc-600 hover:text-zinc-950 border border-zinc-200 rounded text-xs font-medium cursor-pointer"
                              title="Toggle review audit trail"
                            >
                              {isExpanded ? 'Hide History' : 'History'}
                            </button>
                          )}

                          <button
                            onClick={() => handleResumeWork(item)}
                            className="px-2.5 py-1 bg-zinc-950 text-white rounded text-xs font-semibold hover:bg-zinc-800 transition-colors shadow-2xs cursor-pointer"
                          >
                            Work
                          </button>

                          {canResubmit && (
                            <button
                              onClick={() => handleResubmit(item)}
                              disabled={resubmittingId === item.work_item_id}
                              className="px-2.5 py-1 bg-purple-700 text-white rounded text-xs font-semibold hover:bg-purple-800 transition-colors cursor-pointer"
                            >
                              {resubmittingId === item.work_item_id ? 'Submitting...' : 'Resubmit'}
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Review History Row */}
                      {isExpanded && hasHistory && (
                        <tr className="bg-zinc-50/90">
                          <td colSpan={6} className="p-4 pl-8 border-y border-zinc-200">
                            <h4 className="text-xs font-bold text-zinc-900 mb-2 flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-zinc-600" />
                              <span>Manager Review Audit Log for {item.work_item_id}</span>
                            </h4>
                            <div className="space-y-2">
                              {item.review_history!.map((rev, idx) => (
                                <div key={rev.id || idx} className="bg-white p-3 rounded-lg border border-zinc-200 text-xs">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-zinc-900">
                                        {rev.manager_name || 'Manager Sarah Connor'}
                                      </span>
                                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${getStatusBadge(rev.status)}`}>
                                        {rev.decision || rev.status}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-zinc-400 font-mono">
                                      {new Date(rev.created_at).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="text-zinc-700 leading-relaxed text-[11px] mt-1">
                                    {rev.review_notes || rev.comments || rev.explanation || 'No comments provided.'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
