import React from 'react';
import { Link } from 'react-router-dom';
import { MeetingListItem } from '../types/meeting';
import { StatusBadge } from './StatusBadge';

interface MeetingCardProps {
  meeting: MeetingListItem;
  onDelete?: (meeting: MeetingListItem) => void;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({ meeting, onDelete }) => {
  const formatDateWithSeconds = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const pad = (n: number) => n.toString().padStart(2, '0');
      const hours = pad(d.getHours());
      const minutes = pad(d.getMinutes());
      const seconds = pad(d.getSeconds());
      const day = pad(d.getDate());
      const month = pad(d.getMonth() + 1);
      const year = d.getFullYear();
      return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
    } catch {
      return '';
    }
  };

  const formattedDate = formatDateWithSeconds(meeting.start_time) || formatDateWithSeconds(meeting.created_at);

  return (
    <Link
      to={`/meetings/${meeting.id}`}
      className="block bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all group"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate text-base">
              {meeting.title || `Cuộc họp ${meeting.meeting_code || meeting.id.substring(0, 8)}`}
            </h3>
            {meeting.meeting_code && !(meeting.title && meeting.title.includes(meeting.meeting_code)) && (
              <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                {meeting.meeting_code}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-500 flex-wrap gap-y-1">
            <span className="flex items-center space-x-1" title="Thời gian bắt đầu / khởi tạo">
              <span>📅</span>
              <span>{formattedDate}</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <span>👥</span>
              <span>{meeting.participant_count} người tham gia</span>
            </span>
            <span>•</span>
            <span
              className={`inline-flex items-center space-x-1 font-medium px-2 py-0.5 rounded-full text-[11px] ${
                (meeting.transcript_entry_count ?? 0) > 0
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
              title="Số câu thoại ghi nhận được"
            >
              <span>💬</span>
              <span>{meeting.transcript_entry_count ?? 0} câu thoại</span>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-1.5 self-start md:self-center">
          {meeting.user_role === 'OWNER' ? (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span>📝</span>
              <span>Tôi chủ trì</span>
            </span>
          ) : (
            <span
              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200"
              title={meeting.host_name ? `Chủ phòng: ${meeting.host_name}` : 'Cuộc họp tham gia'}
            >
              <span>👥</span>
              <span>Tôi tham gia{meeting.host_name ? ` (${meeting.host_name})` : ''}</span>
            </span>
          )}

          <StatusBadge type="status" value={meeting.status} />
          <StatusBadge type="ai" value={meeting.ai_status} compact />
          {meeting.sheets_sync_status === 'COMPLETED' && (
            <StatusBadge type="sheets" value={meeting.sheets_sync_status} compact />
          )}
          {onDelete && (
            meeting.user_role === 'OWNER' && meeting.status === 'in_progress' ? (
              <button
                type="button"
                disabled
                className="p-1.5 text-slate-300 cursor-not-allowed rounded-lg ml-1"
                title="Không thể xóa cuộc họp đang diễn ra"
                aria-label="Không thể xóa cuộc họp đang diễn ra"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(meeting);
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                title={meeting.user_role === 'PARTICIPANT' ? 'Ẩn khỏi danh sách của tôi' : 'Xóa cuộc họp'}
                aria-label={meeting.user_role === 'PARTICIPANT' ? 'Ẩn khỏi danh sách của tôi' : 'Xóa cuộc họp'}
              >
                {meeting.user_role === 'PARTICIPANT' ? (
                  <span className="text-xs" title="Ẩn khỏi danh sách">✕</span>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            )
          )}
        </div>
      </div>
    </Link>
  );
};
