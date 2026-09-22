import React from 'react';
import { StatusBadge } from './StatusBadge';

interface GoogleSheetsViewProps {
  sheetsUrl?: string | null;
  syncStatus?: string;
  errorMessage?: string | null;
}

export const GoogleSheetsView: React.FC<GoogleSheetsViewProps> = ({
  sheetsUrl,
  syncStatus = 'PENDING',
  errorMessage,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-semibold text-slate-800 flex items-center space-x-2">
            <span>📊</span>
            <span>Google Sheets Sync</span>
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Dữ liệu cuộc họp, quyết định, việc cần làm và email được đồng bộ tự động vào Google Sheets.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <StatusBadge type="sheets" value={syncStatus} />
          {sheetsUrl && (
            <a
              href={sheetsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <span>Mở Google Sheets</span>
              <span>↗</span>
            </a>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
          <p className="font-semibold">⚠️ Cảnh báo lỗi đồng bộ Sheets:</p>
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Tabs description cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
            <span>📑</span>
            <span>Tab: Meetings</span>
          </div>
          <p className="text-xs text-slate-600">
            Lưu trữ thông tin metadata cuộc họp, ngày giờ, số người tham gia, tóm tắt và link cuộc họp.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
            <span>⚖️</span>
            <span>Tab: Decisions</span>
          </div>
          <p className="text-xs text-slate-600">
            Danh sách toàn bộ các quyết định chốt trong cuộc họp, bối cảnh và người chịu trách nhiệm.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
            <span>✅</span>
            <span>Tab: Action Items</span>
          </div>
          <p className="text-xs text-slate-600">
            Các đầu việc (Action Items), phân công người nhận, thời hạn (due date) và mức độ ưu tiên.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
            <span>📧</span>
            <span>Tab: Follow-up Emails</span>
          </div>
          <p className="text-xs text-slate-600">
            Tiêu đề và nội dung email follow-up đầy đủ được lưu trữ để tham chiếu và gửi cho các bên liên quan.
          </p>
        </div>
      </div>
    </div>
  );
};
