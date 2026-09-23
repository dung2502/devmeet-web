import React from 'react';

export interface StatusBadgeProps {
  type: 'status' | 'transcript' | 'ai' | 'sheets' | 'source';
  value: string | null | undefined;
  compact?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value, compact = false }) => {
  if (!value) return null;

  const normalized = value.toUpperCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = value;
  let icon = '';

  switch (type) {
    case 'status':
      if (normalized === 'ACTIVE' || normalized === 'IN_PROGRESS') {
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        icon = '🟢';
        label = 'Đang diễn ra';
      } else if (normalized === 'MEETING_ENDED' || normalized === 'ENDED' || normalized === 'COMPLETED') {
        colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';
        icon = '⏹️';
        label = 'Đã kết thúc';
      }
      break;

    case 'transcript':
      if (normalized === 'COMPLETED' || normalized === 'FINALIZED' || normalized === 'CAPTURED') {
        colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
        icon = '📝';
        label = 'Đã có phụ đề';
      } else if (normalized === 'IN_PROGRESS' || normalized === 'CAPTURING') {
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        icon = '⏳';
        label = 'Đang ghi nhận...';
      }
      break;

    case 'source':
      if (normalized === 'OFFICIAL') {
        colorClasses = 'bg-purple-50 text-purple-700 border-purple-200 font-medium';
        icon = '☁️';
        label = 'Bản ghi Cloud';
      } else if (normalized === 'DOM') {
        colorClasses = 'bg-sky-50 text-sky-700 border-sky-200 font-medium';
        icon = '💬';
        label = 'Phụ đề Meet';
      } else if (normalized === 'NONE') {
        colorClasses = 'bg-slate-100 text-slate-500 border-slate-200';
        icon = '⚪';
        label = 'Chưa có phụ đề';
      }
      break;

    case 'ai':
      if (normalized === 'COMPLETED' || normalized === 'SUCCESS') {
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        icon = '✨';
        label = 'Đã phân tích';
      } else if (normalized === 'PROCESSING' || normalized === 'RUNNING') {
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
        icon = '⚡';
        label = 'Đang xử lý...';
      } else if (normalized === 'FAILED' || normalized === 'ERROR') {
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        icon = '⚠️';
        label = 'Lỗi phân tích';
      } else {
        colorClasses = 'bg-slate-100 text-slate-600 border-slate-200';
        icon = '⏳';
        label = 'Chưa phân tích';
      }
      break;

    case 'sheets':
      if (normalized === 'SYNCED' || normalized === 'COMPLETED' || normalized === 'SUCCESS') {
        colorClasses = 'bg-teal-50 text-teal-700 border-teal-200';
        icon = '📊';
        label = 'Đã lưu Sheets';
      } else if (normalized === 'FAILED' || normalized === 'ERROR') {
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        icon = '⚠️';
        label = 'Sheets lỗi';
      } else {
        colorClasses = 'bg-slate-100 text-slate-500 border-slate-200';
        icon = '📊';
        label = 'Chưa lưu Sheets';
      }
      break;
  }

  if (compact) {
    return (
      <span
        title={`${label}`}
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium border cursor-default ${colorClasses}`}
      >
        <span>{icon}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses}`}
    >
      {icon && <span className="text-[10px]">{icon}</span>}
      <span>{label}</span>
    </span>
  );
};
