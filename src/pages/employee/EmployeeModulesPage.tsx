import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { EmployeeAssignedTask } from '../../../types';
import { 
  Briefcase, 
  Search, 
  Filter, 
  Sparkles, 
  Clock, 
  Calendar, 
  Play, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  ShieldAlert,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export const EmployeeModulesPage: React.FC = () => {
  const { currentUser, setActiveTab, setSelectedBugId } = useApp();
  const [tasks, setTasks] = useState<EmployeeAssignedTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchTasks = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const filterParam = statusFilter === 'all' ? undefined : statusFilter;
      const data = await api.getEmployeeTasks({
        status: filterParam,
        search: searchQuery.trim() || undefined,
      });
      setTasks(data);
    } catch (err: any) {
      console.error('Failed to load employee tasks:', err);
      setError(err.message || 'Failed to fetch assigned tasks.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTasks();
  };

  const handleStartRework = (task: EmployeeAssignedTask) => {
    // Navigate to /employee/rework with task preset
    setSelectedBugId(task.id);
    setActiveTab('employee/rework');
  };

  const filterTabs = [
    { id: 'all', label: 'All Tasks' },
    { id: 'new', label: 'New Assignments' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
    { id: 'changes_requested', label: 'Changes Requested' },
  ];

  const getSeverityBadge = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'major':
      case 'high':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'minor':
      case 'medium':
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-zinc-100 text-zinc-800 border-zinc-200';
    }
  };

  const getPriorityBadge = (pri: string) => {
    switch (pri.toLowerCase()) {
      case 'p0':
        return 'bg-rose-950 text-white';
      case 'p1':
        return 'bg-red-700 text-white';
      case 'p2':
        return 'bg-amber-700 text-white';
      default:
        return 'bg-zinc-700 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-zinc-950">
              My Work & Assigned Modules
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-zinc-100 text-zinc-700">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Software modules and corrective defect fixes assigned to your employee account ({currentUser?.name}).
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, ID, module..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs pl-8 pr-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 w-52 sm:w-64"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-zinc-950 text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 cursor-pointer"
          >
            Search
          </button>
          <button
            type="button"
            onClick={fetchTasks}
            disabled={refreshing}
            className="p-2 border border-zinc-200 text-zinc-500 hover:text-zinc-950 rounded-lg hover:bg-zinc-100"
            title="Refresh tasks"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === tab.id
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'bg-white text-zinc-600 hover:text-zinc-950 border border-zinc-200 hover:border-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Task List / Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-400 animate-pulse">
            Loading assigned tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-zinc-100 mx-auto flex items-center justify-center text-zinc-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">No tasks found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              There are no tasks matching the selected filter criteria. Check other filters or await new assignments from your manager.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Task ID & Title</th>
                  <th className="py-3 px-4 font-semibold">Module</th>
                  <th className="py-3 px-4 font-semibold">Severity & Priority</th>
                  <th className="py-3 px-4 font-semibold">Assignment Date</th>
                  <th className="py-3 px-4 font-semibold">Hours Logged</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-zinc-50/70 transition-colors">
                    {/* Task ID & Title */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-2">
                        {task.is_new && (
                          <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-extrabold bg-amber-500 text-white uppercase tracking-wider mt-0.5 flex-shrink-0 animate-pulse">
                            <Sparkles className="w-2.5 h-2.5" />
                            NEW
                          </span>
                        )}
                        <div>
                          <span className="font-mono text-[11px] font-semibold text-zinc-500 block">
                            {task.id}
                          </span>
                          <span className="font-bold text-zinc-950 text-xs line-clamp-1">
                            {task.title}
                          </span>
                          {task.description && (
                            <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5 max-w-md">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Module */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-zinc-900 font-medium">
                        <Layers className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{task.module_name}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {task.module_code}
                      </span>
                    </td>

                    {/* Severity & Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${getSeverityBadge(task.severity)} uppercase`}>
                          {task.severity}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${getPriorityBadge(task.priority)} uppercase`}>
                          {task.priority}
                        </span>
                      </div>
                    </td>

                    {/* Assignment & Due Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-zinc-700 font-medium">
                        {new Date(task.assignment_date).toLocaleDateString()}
                      </div>
                      {task.due_date && (
                        <div className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>Due: {task.due_date}</span>
                        </div>
                      )}
                    </td>

                    {/* Hours Logged */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-zinc-950">
                        {task.total_hours_recorded}h
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        ₹{(task.total_hours_recorded * (currentUser?.hourly_rate || 500)).toFixed(2)} rework cost
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                        task.status === 'fixed' || task.status === 'closed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : task.status === 'review_pending' || task.review_status === 'pending'
                          ? 'bg-purple-100 text-purple-800'
                          : task.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-zinc-100 text-zinc-800'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      {task.requires_changes && (
                        <span className="block text-[10px] font-bold text-red-600 mt-0.5">
                          Changes Requested
                        </span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleStartRework(task)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 transition-colors shadow-xs cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Start Rework</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
