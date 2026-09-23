import React from 'react';
import { AIOutput, ObservabilityInfo } from '../types/ai';

export interface SummaryOverviewProps {
  aiOutput?: AIOutput | null;
  observability?: ObservabilityInfo | null;
  onSelectTimestamp?: (timestamp: string) => void;
}

export const SummaryOverview: React.FC<SummaryOverviewProps> = ({
  aiOutput,
  observability,
  onSelectTimestamp,
}) => {
  if (!aiOutput || (!aiOutput.summary && (!aiOutput.key_points || aiOutput.key_points.length === 0))) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
        Chưa có tóm tắt cuộc họp. Nhấn "Phân tích AI" để Gemini tạo tóm tắt.
      </div>
    );
  }

  const renderTextWithTimestamps = (text: string) => {
    if (!onSelectTimestamp) return text;
    // Match [09:12] or [09:12:00] or 09:12:00
    const regex = /(\[\d{1,2}:\d{2}(?::\d{2})?\]|\b\d{1,2}:\d{2}:\d{2}\b)/g;
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) => {
          if (regex.test(part)) {
            const rawTs = part.replace(/[\[\]]/g, '');
            return (
              <button
                key={i}
                type="button"
                onClick={() => onSelectTimestamp(rawTs)}
                className="inline-flex items-center space-x-0.5 px-1.5 py-0.2 rounded font-mono text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors mx-1 cursor-pointer"
                title="Nhảy tới đoạn hội thoại"
              >
                <span>⏱️</span>
                <span>{part}</span>
              </button>
            );
          }
          return part;
        })}
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Observability pill banner */}
      {observability && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900">
          <div className="flex items-center space-x-1.5 font-medium">
            <span>🤖</span>
            <span>Mô hình:</span>
            <span className="font-mono bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-700 font-semibold">
              {observability.model || 'gemini-3.6-flash'}
            </span>
          </div>
          {observability.execution_time_ms > 0 && (
            <div className="flex items-center space-x-1.5 text-indigo-700">
              <span>⚡</span>
              <span>Thời gian phản hồi: {observability.execution_time_ms}ms</span>
            </div>
          )}
        </div>
      )}

      {/* Summary Content */}
      {aiOutput.summary && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
            <span>📋</span>
            <span>Tóm tắt tổng quan</span>
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {renderTextWithTimestamps(aiOutput.summary)}
          </p>
        </div>
      )}

      {/* Key Points */}
      {aiOutput.key_points && aiOutput.key_points.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
            <span>🎯</span>
            <span>Các điểm chính ({aiOutput.key_points.length})</span>
          </h4>
          <ul className="space-y-2.5">
            {aiOutput.key_points.map((point, idx) => (
              <li key={idx} className="flex items-start space-x-2.5 text-sm text-slate-700">
                <span className="text-indigo-500 font-bold mt-0.5">•</span>
                <span className="leading-relaxed">{renderTextWithTimestamps(point)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
