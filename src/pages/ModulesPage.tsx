import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { Module, User, Bug, ModuleStatusHistoryItem } from '../../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { FormField, Input, Textarea, Select } from '../components/common/FormControls';
import { StatusBadge } from '../components/common/StatusBadge';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { useToast } from '../components/common/Toast';
import { useApp } from '../context/AppContext';
import { 
  Layers, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  User as UserIcon, 
  Tag, 
  History, 
  Bug as BugIcon, 
  AlertTriangle,
  Lock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

// Transition rules definition matching backend
const VALID_TRANSITIONS: Record<string, string[]> = {
  assigned: ['in_progress', 'closed'],
  in_progress: ['completed', 'assigned'],
  completed: ['reopened', 'closed'],
  reopened: ['in_progress', 'completed'],
  closed: ['reopened'],
  // Legacy mappings
  active: ['in_progress', 'completed', 'maintenance', 'deprecated'],
  maintenance: ['in_progress', 'completed', 'active', 'deprecated'],
  deprecated: ['reopened', 'closed'],
};

const ALL_STATUS_OPTIONS = [
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'reopened', label: 'Reopened' },
  { value: 'closed', label: 'Closed' },
];

export const ModulesPage: React.FC = () => {
  const { currentUser, users } = useApp();
  const { addToast } = useToast();

  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localUsers, setLocalUsers] = useState<User[]>(users || []);

  useEffect(() => {
    if (users && users.length > 0) {
      setLocalUsers(users);
    } else {
      api.getUsers().then(u => {
        if (Array.isArray(u) && u.length > 0) setLocalUsers(u);
      }).catch(() => {});
    }
  }, [users]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Add Module Modal Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    version: 'v1.0.0',
    owner_id: '',
    description: '',
  });

  // Module Details View & Status History State
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [linkedBugs, setLinkedBugs] = useState<Bug[]>([]);
  const [loadingBugs, setLoadingBugs] = useState(false);
  
  // Status transition state inside details modal
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusActionError, setStatusActionError] = useState<string | null>(null);

  // Fetch modules
  const fetchModules = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getModules();
      setModules(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch software modules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  // Check authorization for modifying a module
  // "Developers can modify only modules they are authorized to manage; managers can review all modules."
  const isAuthorizedToModify = (mod: Module): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'manager' || currentUser.role === 'admin') return true;
    return mod.owner_id === currentUser.id;
  };

  // Open Module Details Modal
  const handleOpenDetails = async (mod: Module) => {
    setSelectedModule(mod);
    setStatusActionError(null);
    setStatusNotes('');
    setLoadingBugs(true);
    try {
      const bugs = await api.getBugs({ module_id: mod.id });
      setLinkedBugs(bugs);
    } catch {
      setLinkedBugs([]);
    } finally {
      setLoadingBugs(false);
    }
  };

  // Handle Create Module
  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.name.trim()) {
      setFormError('Module Name is required.');
      return;
    }
    if (!formData.version.trim()) {
      setFormError('Version is required (e.g. v1.0.0).');
      return;
    }
    if (!formData.owner_id) {
      setFormError('Owner must be a valid user.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newMod = await api.createModule({
        name: formData.name.trim(),
        version: formData.version.trim(),
        owner_id: formData.owner_id,
        description: formData.description.trim(),
      });

      addToast({
        type: 'success',
        title: 'Module Created',
        message: `${newMod.name} (${newMod.version}) added successfully.`,
      });

      setIsAddModalOpen(false);
      setFormData({
        name: '',
        version: 'v1.0.0',
        owner_id: '',
        description: '',
      });
      await fetchModules();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create module.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Status Transition
  const handleTransitionStatus = async (targetStatus: string) => {
    if (!selectedModule) return;
    setStatusActionError(null);

    // Authorization check
    if (!isAuthorizedToModify(selectedModule)) {
      setStatusActionError(
        `Unauthorized: Developer ${currentUser?.name || 'User'} is not authorized to modify "${selectedModule.name}". Developers can modify only modules they own.`
      );
      return;
    }

    // Status transition validation
    const currentStatus = selectedModule.status.toLowerCase();
    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      setStatusActionError(
        `Invalid status transition from "${currentStatus}" to "${targetStatus}". Allowed transitions are: ${allowed.join(', ') || 'None'}.`
      );
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const updated = await api.updateModule(selectedModule.id, {
        status: targetStatus as any,
        user_id: currentUser?.id,
        status_notes: statusNotes.trim() || undefined,
      });

      addToast({
        type: 'success',
        title: 'Status Updated',
        message: `Module "${updated.name}" moved to ${targetStatus.toUpperCase()}.`,
      });

      setSelectedModule(updated);
      setStatusNotes('');
      await fetchModules();
    } catch (err: any) {
      setStatusActionError(err.message || 'Failed to transition status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Filtered Modules
  const filteredModules = useMemo(() => {
    return modules.filter((m) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        m.name.toLowerCase().includes(query) ||
        m.id.toLowerCase().includes(query) ||
        m.version.toLowerCase().includes(query) ||
        (m.code && m.code.toLowerCase().includes(query)) ||
        (m.description && m.description.toLowerCase().includes(query));

      const matchesOwner = ownerFilter === 'all' || m.owner_id === ownerFilter;
      const matchesStatus = statusFilter === 'all' || m.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesOwner && matchesStatus;
    });
  }, [modules, searchQuery, ownerFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner and Add Module Action */}
      <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-zinc-950">Module Management</h2>
            <span className="text-xs bg-zinc-100 text-zinc-800 font-semibold px-2 py-0.5 rounded border border-zinc-200">
              Lifecycle Tracking
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Create, view and track software modules, versioning, ownership and lifecycle state transitions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => {
              setFormData({
                name: '',
                version: 'v1.0.0',
                owner_id: currentUser?.id || users[0]?.id || '',
                description: '',
              });
              setFormError(null);
              setIsAddModalOpen(true);
            }}
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Module
          </Button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <Input
            placeholder="Search by module ID, name, version..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Owner Filter */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-medium">Owner:</span>
            <Select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="text-xs py-1.5"
            >
              <option value="all">All Owners</option>
              {(localUsers.length > 0 ? localUsers : users).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </Select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-medium">Status:</span>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-1.5"
            >
              <option value="all">All Statuses</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="reopened">Reopened</option>
              <option value="closed">Closed</option>
            </Select>
          </div>

          {(searchQuery || ownerFilter !== 'all' || statusFilter !== 'all') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSearchQuery('');
                setOwnerFilter('all');
                setStatusFilter('all');
              }}
              className="text-xs text-zinc-500 hover:text-zinc-900"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* 1. MODULES TABLE */}
      {loading ? (
        <LoadingSpinner message="Loading software modules and lifecycle statuses..." />
      ) : filteredModules.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No Software Modules Found"
          description={
            searchQuery || ownerFilter !== 'all' || statusFilter !== 'all'
              ? 'No modules match your current search and filter criteria.'
              : 'Start by creating your first module to track ownership and lifecycle status.'
          }
          actionLabel="Add Module"
          onAction={() => {
            setFormData({
              name: '',
              version: 'v1.0.0',
              owner_id: currentUser?.id || users[0]?.id || '',
              description: '',
            });
            setIsAddModalOpen(true);
          }}
        />
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3.5">Module ID</th>
                  <th className="py-3 px-3.5">Module Name</th>
                  <th className="py-3 px-3.5">Version</th>
                  <th className="py-3 px-3.5">Owner</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5">Created Date</th>
                  <th className="py-3 px-3.5">Completion Date</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredModules.map((mod) => {
                  const authorized = isAuthorizedToModify(mod);
                  return (
                    <tr key={mod.id} className="hover:bg-zinc-50/80 transition-colors">
                      {/* Module ID */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-zinc-900 flex items-center gap-1.5">
                          <span>{mod.id}</span>
                          {mod.code && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 font-semibold">
                              {mod.code}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Module Name */}
                      <td className="py-3 px-3.5 max-w-xs">
                        <button
                          onClick={() => handleOpenDetails(mod)}
                          className="font-bold text-zinc-950 hover:underline text-left block truncate"
                        >
                          {mod.name}
                        </button>
                        {mod.description && (
                          <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                            {mod.description}
                          </p>
                        )}
                      </td>

                      {/* Version */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-bold text-xs bg-zinc-100 text-zinc-800 border border-zinc-200">
                          <Tag className="w-3 h-3 text-zinc-400" />
                          {mod.version || 'v1.0.0'}
                        </span>
                      </td>

                      {/* Owner */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center font-bold text-zinc-700 text-[11px]">
                            {mod.owner_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <span className="font-semibold text-zinc-900 block">{mod.owner_name}</span>
                            <span className="text-[10px] text-zinc-400 block font-mono">{mod.owner_id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <StatusBadge status={mod.status} type="module" />
                      </td>

                      {/* Created Date */}
                      <td className="py-3 px-3.5 whitespace-nowrap font-mono text-zinc-600">
                        {new Date(mod.created_at).toLocaleDateString([], {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Completion Date */}
                      <td className="py-3 px-3.5 whitespace-nowrap font-mono text-zinc-600">
                        {mod.completion_date ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            {new Date(mod.completion_date).toLocaleDateString([], {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap space-x-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDetails(mod)}
                          rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                          className="text-xs"
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. ADD MODULE MODAL / FORM */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Software Module"
        subtitle="Register a new software module, version, owner and description"
        maxWidth="md"
      >
        <form onSubmit={handleCreateModule} className="space-y-4">
          {formError && <ErrorAlert message={formError} />}

          <FormField label="Module Name" required hint="e.g. Identity & Authentication">
            <Input
              placeholder="e.g. Payment Gateway Orchestrator"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Version" required hint="Semantic versioning (e.g. v1.0.0, v2.1.0)">
            <Input
              placeholder="v1.0.0"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Module Owner" required hint="User responsible for managing this module">
            <Select
              value={formData.owner_id}
              onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
              required
            >
              <option value="">Select Module Owner...</option>
              {(localUsers.length > 0 ? localUsers : users).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role.toUpperCase()} - {u.email})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Description" hint="Summary of responsibilities and codebase boundary">
            <Textarea
              placeholder="Describe what services, APIs, and business domain this module covers..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create Module
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. MODULE DETAILS MODAL: Status Actions, History, and Linked Bugs */}
      {selectedModule && (
        <Modal
          isOpen={!!selectedModule}
          onClose={() => setSelectedModule(null)}
          title={`${selectedModule.name} (${selectedModule.version})`}
          subtitle={`Module ID: ${selectedModule.id} • Owner: ${selectedModule.owner_name}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {statusActionError && <ErrorAlert message={statusActionError} onDismiss={() => setStatusActionError(null)} />}

            {/* Quick Metadata Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Current Status</span>
                <div className="mt-1">
                  <StatusBadge status={selectedModule.status} type="module" />
                </div>
              </div>

              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Version</span>
                <span className="font-mono font-bold text-zinc-900 text-sm mt-1 block">
                  {selectedModule.version}
                </span>
              </div>

              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Created Date</span>
                <span className="font-mono font-medium text-zinc-800 text-xs mt-1 block">
                  {new Date(selectedModule.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Completion Date</span>
                <span className="font-mono font-medium text-zinc-800 text-xs mt-1 block">
                  {selectedModule.completion_date
                    ? new Date(selectedModule.completion_date).toLocaleDateString()
                    : 'Not Completed'}
                </span>
              </div>
            </div>

            {/* Module Description */}
            {selectedModule.description && (
              <div className="bg-white p-3.5 rounded-lg border border-zinc-200 text-xs">
                <strong className="text-zinc-900 block mb-1">Description & Scope:</strong>
                <p className="text-zinc-600 leading-relaxed">{selectedModule.description}</p>
              </div>
            )}

            {/* 6. STATUS ACTIONS (Assigned, In Progress, Completed, Reopened, Closed) */}
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-zinc-900" />
                    Lifecycle Status Transition Actions
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Transition module status subject to valid lifecycle state rules.
                  </p>
                </div>

                {!isAuthorizedToModify(selectedModule) && (
                  <div className="flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                    <Lock className="w-3 h-3" />
                    Read-only: Owned by {selectedModule.owner_name}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {ALL_STATUS_OPTIONS.map((opt) => {
                  const isCurrent = selectedModule.status.toLowerCase() === opt.value;
                  const allowed = (VALID_TRANSITIONS[selectedModule.status.toLowerCase()] || []).includes(opt.value);
                  const isAuthorized = isAuthorizedToModify(selectedModule);
                  const canTransition = allowed && isAuthorized && !isUpdatingStatus;

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={isCurrent || !canTransition}
                      onClick={() => handleTransitionStatus(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isCurrent
                          ? 'bg-zinc-950 text-white font-bold cursor-default shadow-xs'
                          : canTransition
                          ? 'bg-white border border-zinc-300 text-zinc-800 hover:bg-zinc-100 hover:border-zinc-400 shadow-2xs'
                          : 'bg-zinc-100/70 border border-zinc-200 text-zinc-400 cursor-not-allowed opacity-60'
                      }`}
                    >
                      {opt.label}
                      {isCurrent && <span className="text-[10px] font-normal opacity-80">(Current)</span>}
                    </button>
                  );
                })}
              </div>

              {/* Optional Rationale / Notes for transition */}
              {isAuthorizedToModify(selectedModule) && (
                <div className="pt-2">
                  <Input
                    placeholder="Optional transition notes / audit rationale..."
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    className="text-xs"
                  />
                </div>
              )}
            </div>

            {/* 5a. STATUS HISTORY TIMELINE */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-950 mb-3 flex items-center gap-1.5">
                <History className="w-4 h-4 text-zinc-700" />
                Status History Audit Trail
              </h4>

              {(!selectedModule.status_history || selectedModule.status_history.length === 0) ? (
                <div className="p-4 text-center text-xs text-zinc-500 border border-dashed border-zinc-200 rounded-lg">
                  No status transition history recorded yet.
                </div>
              ) : (
                <div className="border border-zinc-200 rounded-lg overflow-hidden divide-y divide-zinc-100 max-h-52 overflow-y-auto">
                  {selectedModule.status_history.map((hist) => (
                    <div key={hist.id} className="p-3 text-xs bg-white hover:bg-zinc-50/70 flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-900 capitalize font-mono text-[11px]">
                            {hist.from_status.replace(/_/g, ' ')}
                          </span>
                          <ArrowRight className="w-3 h-3 text-zinc-400" />
                          <StatusBadge status={hist.to_status} type="module" className="text-[10px]" />
                        </div>
                        {hist.notes && (
                          <p className="text-zinc-600 text-xs leading-relaxed">{hist.notes}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0 font-mono text-[11px] text-zinc-400">
                        <div className="text-zinc-700 font-sans font-medium">{hist.changed_by_name || 'System'}</div>
                        <div>{new Date(hist.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5b. LINKED BUGS */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-1.5">
                  <BugIcon className="w-4 h-4 text-zinc-700" />
                  Linked Defects & Bugs ({linkedBugs.length})
                </h4>
                <span className="text-[11px] text-zinc-500">
                  Bugs remain linked regardless of module status transitions
                </span>
              </div>

              {loadingBugs ? (
                <LoadingSpinner message="Loading linked bugs..." />
              ) : linkedBugs.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-500 border border-dashed border-zinc-200 rounded-lg">
                  No defects linked to this module.
                </div>
              ) : (
                <div className="border border-zinc-200 rounded-lg overflow-x-auto max-h-52">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-2 px-3">Bug ID</th>
                        <th className="py-2 px-3">Title</th>
                        <th className="py-2 px-3">Severity</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-right">Fix Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {linkedBugs.map((b) => (
                        <tr key={b.id} className="hover:bg-zinc-50">
                          <td className="py-2 px-3 font-mono font-bold text-zinc-900">{b.id}</td>
                          <td className="py-2 px-3 font-medium text-zinc-950 max-w-xs truncate">{b.title}</td>
                          <td className="py-2 px-3"><SeverityBadge severity={b.severity} showIcon={false} /></td>
                          <td className="py-2 px-3"><StatusBadge status={b.status} type="bug" /></td>
                          <td className="py-2 px-3 text-right font-mono font-medium text-zinc-700">{b.corrective_hours} hrs</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-100">
              <Button variant="outline" onClick={() => setSelectedModule(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
