import React from 'react';

interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  bodyClassName = '',
}) => {
  return (
    <div className={`bg-white border border-zinc-200 rounded-lg shadow-sm hover:border-zinc-300 transition-colors ${className}`}>
      {(title || subtitle || action) && (
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between gap-4">
          <div>
            {title && <h3 className="text-base font-semibold text-zinc-950">{title}</h3>}
            {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
};
