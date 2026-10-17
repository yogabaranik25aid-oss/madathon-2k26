import React from 'react';
import { BugStatus, ReviewStatus, ModuleStatus } from '../../../types';

interface StatusBadgeProps {
  status: BugStatus | ReviewStatus | ModuleStatus | string;
  type?: 'bug' | 'review' | 'module' | 'task';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'bug', className = '' }) => {
  let label = status.replace(/_/g, ' ');
  let style = 'bg-zinc-100 text-zinc-800 border-zinc-200';

  if (type === 'bug') {
    switch (status) {
      case 'open':
        style = 'bg-amber-50 text-amber-800 border-amber-200';
        label = 'Open';
        break;
      case 'in_progress':
        style = 'bg-blue-50 text-blue-800 border-blue-200';
        label = 'In Progress';
        break;
      case 'under_fix':
        style = 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse';
        label = 'Under Fix';
        break;
      case 'fixed':
        style = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        label = 'Fixed';
        break;
      case 'review_pending':
        style = 'bg-purple-50 text-purple-800 border-purple-200';
        label = 'Review Pending';
        break;
      case 'reopened':
        style = 'bg-rose-50 text-rose-800 border-rose-200';
        label = 'Reopened';
        break;
      case 'closed':
        style = 'bg-zinc-100 text-zinc-700 border-zinc-300';
        label = 'Closed';
        break;
    }
  } else if (type === 'review') {
    switch (status) {
      case 'pending':
        style = 'bg-amber-50 text-amber-800 border-amber-200';
        label = 'Pending Review';
        break;
      case 'approved_for_accounting':
        style = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        label = 'Approved for Accounting';
        break;
      case 'approved':
        style = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        label = 'Approved';
        break;
      case 'waived':
        style = 'bg-indigo-50 text-indigo-800 border-indigo-200';
        label = 'Waived';
        break;
      case 'disputed':
        style = 'bg-red-50 text-red-800 border-red-200';
        label = 'Disputed';
        break;
      case 'rejected':
        style = 'bg-rose-50 text-rose-800 border-rose-200';
        label = 'Rejected';
        break;
      case 'changes_requested':
        style = 'bg-orange-50 text-orange-800 border-orange-200';
        label = 'Changes Requested';
        break;
      case 'not_submitted':
        style = 'bg-zinc-50 text-zinc-500 border-zinc-200';
        label = 'Not Submitted';
        break;
    }
  } else if (type === 'task') {
    switch (status) {
      case 'assigned':
        style = 'bg-blue-50 text-blue-800 border-blue-200';
        label = 'Assigned';
        break;
      case 'in_progress':
        style = 'bg-indigo-50 text-indigo-800 border-indigo-200';
        label = 'In Progress';
        break;
      case 'under_fix':
        style = 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse';
        label = 'Under Fix';
        break;
      case 'reopened':
        style = 'bg-rose-50 text-rose-800 border-rose-200';
        label = 'Reopened';
        break;
      case 'submitted':
        style = 'bg-purple-50 text-purple-800 border-purple-200';
        label = 'Submitted';
        break;
      case 'changes_requested':
        style = 'bg-orange-50 text-orange-800 border-orange-200';
        label = 'Changes Requested';
        break;
      case 'approved':
        style = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        label = 'Approved';
        break;
      case 'completed':
        style = 'bg-teal-50 text-teal-800 border-teal-200';
        label = 'Completed';
        break;
    }
  } else if (type === 'module') {
    switch (status) {
      case 'assigned':
        style = 'bg-blue-50 text-blue-800 border-blue-200';
        label = 'Assigned';
        break;
      case 'in_progress':
        style = 'bg-amber-50 text-amber-800 border-amber-200';
        label = 'In Progress';
        break;
      case 'completed':
        style = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        label = 'Completed';
        break;
      case 'reopened':
        style = 'bg-rose-50 text-rose-800 border-rose-200';
        label = 'Reopened';
        break;
      case 'closed':
        style = 'bg-zinc-100 text-zinc-700 border-zinc-300';
        label = 'Closed';
        break;
      case 'active':
        style = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        label = 'Active';
        break;
      case 'maintenance':
        style = 'bg-amber-50 text-amber-800 border-amber-200';
        label = 'Maintenance';
        break;
      case 'deprecated':
        style = 'bg-zinc-100 text-zinc-600 border-zinc-300';
        label = 'Deprecated';
        break;
    }
  }

  // General fallback for reopened or under_fix across any context
  if (status === 'reopened') {
    style = 'bg-rose-50 text-rose-800 border-rose-200';
    label = 'Reopened';
  } else if (status === 'under_fix') {
    style = 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse';
    label = 'Under Fix';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70"></span>
      {label}
    </span>
  );
};
