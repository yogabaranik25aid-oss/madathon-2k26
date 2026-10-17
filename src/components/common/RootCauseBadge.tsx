import React from 'react';
import { RootCauseCategory } from '../../../types';

interface RootCauseBadgeProps {
  cause: RootCauseCategory | string;
}

export const RootCauseBadge: React.FC<RootCauseBadgeProps> = ({ cause }) => {
  const formatLabel = (c: string) => {
    switch (c) {
      case 'code_defect':
        return 'Code Defect';
      case 'requirement_change':
        return 'Requirement Change';
      case 'external_dependency':
        return 'External Dependency';
      case 'unclear_specification':
        return 'Unclear Specification';
      case 'logic_error':
        return 'Logic Error';
      case 'requirement_gap':
        return 'Requirement Gap';
      case 'regression':
        return 'Regression';
      case 'integration':
        return 'Integration';
      case 'edge_case':
        return 'Unhandled Edge Case';
      case 'security':
        return 'Security Flaw';
      case 'performance':
        return 'Performance / OOM';
      case 'other':
        return 'Other';
      default:
        return (c || '').replace(/_/g, ' ');
    }
  };

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-zinc-100 text-zinc-800 border border-zinc-200">
      {formatLabel(cause)}
    </span>
  );
};
