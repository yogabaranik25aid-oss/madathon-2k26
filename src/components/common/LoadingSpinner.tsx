import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | string;
  color?: 'current' | 'dark' | 'light';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message, 
  className = '',
  size = 'md',
  color = 'current'
}) => {
  const isSm = size === 'sm';
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }[size] || 'w-8 h-8';

  const trackBorder = isSm ? 'border-[1.5px]' : 'border-2';
  const spinBorder = isSm ? 'border-[1.5px]' : 'border-2';

  const spinnerColorClass = color === 'light' 
    ? 'border-white border-t-transparent' 
    : color === 'dark' 
      ? 'border-zinc-950 border-t-transparent' 
      : 'border-current border-t-transparent';

  const trackColorClass = color === 'light'
    ? 'border-white/20'
    : 'border-zinc-200';

  if (isSm) {
    return (
      <span className={`inline-flex items-center justify-center ${className}`}>
        <span className={`relative inline-block ${sizeClasses} flex-shrink-0`}>
          <span className={`block ${sizeClasses} rounded-full ${trackBorder} ${trackColorClass}`}></span>
          <span className={`absolute top-0 left-0 block ${sizeClasses} rounded-full ${spinBorder} ${spinnerColorClass} animate-spin`}></span>
        </span>
        {message && <span className="ml-2 text-xs font-medium">{message}</span>}
      </span>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-6 text-center ${className}`}>
      <div className={`relative ${sizeClasses} flex-shrink-0`}>
        <div className={`${sizeClasses} rounded-full ${trackBorder} ${trackColorClass}`}></div>
        <div className={`absolute top-0 left-0 ${sizeClasses} rounded-full ${spinBorder} ${spinnerColorClass} animate-spin`}></div>
      </div>
      {message && <p className="mt-3 text-xs font-medium text-zinc-500 leading-normal">{message}</p>}
    </div>
  );
};
