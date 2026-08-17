import React from 'react';

export type StatusType =
  | 'pending_inspection'
  | 'Pending Inspection'
  | 'waiting_approval'
  | 'Waiting Approval'
  | 'in_progress'
  | 'In Progress'
  | 'completed'
  | 'Completed'
  | 'delivered'
  | 'Delivered'
  | 'declined'
  | 'Declined'
  | 'unpaid'
  | 'Unpaid'
  | 'pending'
  | 'paid'
  | 'Paid'
  | string;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const norm = (status || '').toString().toLowerCase().replace(/_/g, ' ').trim();

  let colorClasses = 'bg-slate-50 text-slate-600 border border-slate-200/60';
  let label = status;

  if (norm === 'pending inspection') {
    colorClasses = 'bg-amber-50 text-amber-700 border border-amber-200/50';
    label = 'Pending Inspection';
  } else if (norm === 'waiting approval') {
    colorClasses = 'bg-orange-50 text-orange-700 border border-orange-200/50';
    label = 'Waiting Approval';
  } else if (norm === 'in progress') {
    colorClasses = 'bg-blue-50 text-blue-700 border border-blue-200/50';
    label = 'In Progress';
  } else if (norm === 'completed') {
    colorClasses = 'bg-emerald-50 text-emerald-700 border border-emerald-200/50';
    label = 'Completed';
  } else if (norm === 'delivered') {
    colorClasses = 'bg-purple-50 text-purple-700 border border-purple-200/50';
    label = 'Delivered';
  } else if (norm === 'declined') {
    colorClasses = 'bg-rose-50 text-rose-700 border border-rose-200/50';
    label = 'Declined';
  } else if (norm === 'unpaid' || norm === 'pending') {
    colorClasses = 'bg-slate-100 text-slate-600 border border-slate-200/60';
    label = 'Unpaid';
  } else if (norm === 'paid') {
    colorClasses = 'bg-emerald-50 text-emerald-700 border border-emerald-200/50';
    label = 'Paid';
  } else {
    // Capitalize fallback words
    label = status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses} ${className}`}
    >
      {label}
    </span>
  );
};

