import React from 'react';
import { StatusBadge } from './StatusBadge';

export interface GoogleSheetsViewProps {
  sheetsUrl?: string | null;
  syncStatus?: string;
  errorMessage?: string | null;
  onRetrySync?: () => void;
}

export const GoogleSheetsView: React.FC<GoogleSheetsViewProps> = ({
  sheetsUrl,
  syncStatus = 'PENDING',
  errorMessage,
  onRetrySync,
}) => {
  const isFailed = syncStatus?.toUpperCase() === 'FAILED' || syncStatus?.toUpperCase() === 'ERROR';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-bold text-slate-800 flex items-center space-x-2">
            <span>📊</span>
            <span>Đồng bộ Google Sheets</span>
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Toàn bộ thông tin cuộc họp, quyết định, việc cần làm và email được lưu trữ tự động trên Google Drive.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
          <StatusBadge type="sheets" value={syncStatus} />
          {sheetsUrl && (
            <a
              href={sheetsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              <span>Mở Google Sheets trên Drive</span>
              <span>↗</span>
            </a>
          )}
          {isFailed && onRetrySync && (
            <button
              onClick={onRetrySync}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <span>🔄</span>
              <span>Thử lại đồng bộ</span>
            </button>
          )}
        </div>
      </div>

      {(errorMessage || isFailed) && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1.5">
          <div className="flex items-center space-x-2 font-semibold">
            <span>⚠️</span>
            <span>Không thể đồng bộ dữ liệu vào Google Sheets</span>
          </div>
          <p className="text-rose-700 leading-relaxed">
            {errorMessage ||
              'Đã xảy ra sự cố khi gọi Google Sheets API hoặc Google Drive token đã hết hạn. Hãy bấm nút "Thử lại đồng bộ" để kích hoạt lại tiến trình.'}
          </p>
        </div>
      )}

      {/* Tabs description cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
            <span>📑</span>
            <span>Tab: Meetings</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Lưu trữ thông tin metadata cuộc họp, ngày giờ, số người tham gia, tóm tắt và link cuộc họp.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
            <span>⚖️</span>
            <span>Tab: Decisions</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Danh sách toàn bộ các quyết định chốt trong cuộc họp, bối cảnh và người chịu trách nhiệm.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
            <span>✅</span>
            <span>Tab: Action Items</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Các đầu việc (Action Items), phân công người nhận, thời hạn (due date) và mức độ ưu tiên.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
            <span>📧</span>
            <span>Tab: Follow-up Emails</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Tiêu đề và nội dung email follow-up đầy đủ được lưu trữ để tham chiếu và gửi cho các bên liên quan.
          </p>
        </div>
      </div>
    </div>
  );
};
