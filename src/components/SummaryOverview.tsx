import React from 'react';
import { AIOutput, ObservabilityInfo } from '../types/ai';

interface SummaryOverviewProps {
  aiOutput?: AIOutput | null;
  observability?: ObservabilityInfo | null;
}

export const SummaryOverview: React.FC<SummaryOverviewProps> = ({ aiOutput, observability }) => {
  if (!aiOutput || (!aiOutput.summary && (!aiOutput.key_points || aiOutput.key_points.length === 0))) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
        Chưa có tóm tắt cuộc họp. Nhấn "Chạy AI Phân Tích" để Gemini tạo tóm tắt.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Observability pill banner */}
      {observability && (
        <div className="flex items-center space-x-4 px-4 py-2 bg-indigo-50/70 border border-indigo-100 rounded-lg text-xs text-indigo-900">
          <div className="flex items-center space-x-1.5 font-medium">
            <span>🤖</span>
            <span>AI Model:</span>
            <span className="font-mono bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-700">
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
            {aiOutput.summary}
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
          <ul className="space-y-2">
            {aiOutput.key_points.map((point, idx) => (
              <li key={idx} className="flex items-start space-x-2.5 text-sm text-slate-700">
                <span className="text-indigo-500 font-bold mt-0.5">•</span>
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
