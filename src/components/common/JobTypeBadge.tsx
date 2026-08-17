import React from 'react';

export type JobType = 'service' | 'Service' | 'repair' | 'Repair' | string;

interface JobTypeBadgeProps {
  type: JobType;
  className?: string;
}

export const JobTypeBadge: React.FC<JobTypeBadgeProps> = ({ type, className = '' }) => {
  const norm = (type || '').toString().toLowerCase().trim();

  let colorClasses = 'bg-slate-50 text-slate-600 border border-slate-200/60';
  let label = 'Repair';

  if (norm === 'service') {
    colorClasses = 'bg-teal-50 text-teal-700 border border-teal-200/50';
    label = 'Service';
  } else if (norm === 'repair') {
    colorClasses = 'bg-indigo-50 text-indigo-700 border border-indigo-200/50';
    label = 'Repair';
  } else {
    label = type.replace(/\b\w/g, (l) => l.toUpperCase());
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses} ${className}`}
    >
      {label}
    </span>
  );
};

