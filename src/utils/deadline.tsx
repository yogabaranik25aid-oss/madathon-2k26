import React from 'react';

export interface DeadlineInfo {
  label: string;
  isOverdue: boolean;
  isDueToday: boolean;
  isDueTomorrow: boolean;
  badgeClass: string;
  formattedDate: string;
  diffDays: number | null;
}

/**
 * Calculates human-readable deadline label, urgency class, and formatted date.
 * Does not fabricate a deadline if none was assigned.
 */
export function formatDeadline(deadline?: string | null): DeadlineInfo {
  if (!deadline) {
    return {
      label: 'No Deadline Set',
      isOverdue: false,
      isDueToday: false,
      isDueTomorrow: false,
      badgeClass: 'bg-zinc-100 text-zinc-500 border-zinc-200',
      formattedDate: 'No deadline assigned',
      diffDays: null,
    };
  }

  const d = new Date(deadline);
  if (isNaN(d.getTime())) {
    return {
      label: 'No Deadline Set',
      isOverdue: false,
      isDueToday: false,
      isDueTomorrow: false,
      badgeClass: 'bg-zinc-100 text-zinc-500 border-zinc-200',
      formattedDate: 'No deadline assigned',
      diffDays: null,
    };
  }

  const now = new Date();
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.round((dDay - nowDay) / (1000 * 60 * 60 * 24));

  const formattedDate = d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      label: overdueDays === 1 ? 'Overdue (1 day)' : `Overdue (${overdueDays} days)`,
      isOverdue: true,
      isDueToday: false,
      isDueTomorrow: false,
      badgeClass: 'bg-red-50 text-red-700 border-red-200 font-bold',
      formattedDate,
      diffDays,
    };
  } else if (diffDays === 0) {
    return {
      label: 'Due Today',
      isOverdue: false,
      isDueToday: true,
      isDueTomorrow: false,
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
      formattedDate,
      diffDays,
    };
  } else if (diffDays === 1) {
    return {
      label: 'Due Tomorrow',
      isOverdue: false,
      isDueToday: false,
      isDueTomorrow: true,
      badgeClass: 'bg-orange-50 text-orange-800 border-orange-200 font-semibold',
      formattedDate,
      diffDays,
    };
  } else if (diffDays <= 3) {
    return {
      label: `Due in ${diffDays} Days`,
      isOverdue: false,
      isDueToday: false,
      isDueTomorrow: false,
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 font-medium',
      formattedDate,
      diffDays,
    };
  } else if (diffDays <= 7) {
    return {
      label: `Due in ${diffDays} Days`,
      isOverdue: false,
      isDueToday: false,
      isDueTomorrow: false,
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 font-medium',
      formattedDate,
      diffDays,
    };
  } else {
    return {
      label: `Due in ${diffDays} Days`,
      isOverdue: false,
      isDueToday: false,
      isDueTomorrow: false,
      badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200 font-medium',
      formattedDate,
      diffDays,
    };
  }
}

interface DeadlineBadgeProps {
  deadline?: string | null;
  className?: string;
  showDate?: boolean;
}

export const DeadlineBadge: React.FC<DeadlineBadgeProps> = ({
  deadline,
  className = '',
  showDate = false,
}) => {
  const info = formatDeadline(deadline);

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${info.badgeClass} ${className}`}
      title={info.formattedDate}
    >
      <span>{info.label}</span>
      {showDate && deadline && (
        <span className="font-mono text-[9px] opacity-80">({info.formattedDate})</span>
      )}
    </span>
  );
};
