import React from 'react';
import { BugSeverity } from '../../../types';
import { AlertCircle, AlertTriangle, Info, ShieldAlert } from 'lucide-react';

interface SeverityBadgeProps {
  severity: BugSeverity | string;
  showIcon?: boolean;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, showIcon = true }) => {
  let style = 'bg-zinc-100 text-zinc-700 border-zinc-200';
  let Icon = Info;
  let label = severity;

  switch (severity?.toLowerCase()) {
    case 'critical':
      style = 'bg-red-50 text-red-700 border-red-200';
      Icon = ShieldAlert;
      label = 'Critical';
      break;
    case 'major':
    case 'high':
      style = 'bg-orange-50 text-orange-700 border-orange-200';
      Icon = AlertCircle;
      label = severity?.toLowerCase() === 'major' ? 'Major' : 'High';
      break;
    case 'medium':
      style = 'bg-amber-50 text-amber-700 border-amber-200';
      Icon = AlertTriangle;
      label = 'Medium';
      break;
    case 'minor':
    case 'low':
      style = 'bg-slate-50 text-slate-700 border-slate-200';
      Icon = Info;
      label = severity?.toLowerCase() === 'minor' ? 'Minor' : 'Low';
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${style}`}>
      {showIcon && <Icon className="w-3 h-3" />}
      {label}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  let style = 'bg-zinc-100 text-zinc-700 border-zinc-200';
  switch (priority?.toLowerCase()) {
    case 'p0':
      style = 'bg-red-600 text-white border-red-700 font-bold';
      break;
    case 'p1':
      style = 'bg-orange-500 text-white border-orange-600 font-medium';
      break;
    case 'p2':
      style = 'bg-amber-50 text-amber-900 border-amber-200 font-medium';
      break;
    case 'p3':
      style = 'bg-zinc-100 text-zinc-700 border-zinc-200 font-medium';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${style}`}>
      {priority?.toUpperCase()}
    </span>
  );
};
