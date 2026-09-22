import React, { useState, useMemo } from 'react';
import { TranscriptViewResponse } from '../types/transcript';
import { StatusBadge } from './StatusBadge';

export const TranscriptViewer: React.FC<{ transcriptView: TranscriptViewResponse | null; loading?: boolean }> = ({
  transcriptView,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = useMemo(() => {
    if (!transcriptView || !transcriptView.entries) return [];
    if (!searchTerm.trim()) return transcriptView.entries;
    const term = searchTerm.toLowerCase();
    return transcriptView.entries.filter(
      (e) =>
        e.speaker.toLowerCase().includes(term) ||
        e.text.toLowerCase().includes(term) ||
        e.timestamp.toLowerCase().includes(term)
    );
  }, [transcriptView, searchTerm]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
        <p className="text-sm font-medium">Đang tải transcript...</p>
      </div>
    );
  }

  if (!transcriptView || transcriptView.total_entries === 0 || transcriptView.source === 'NONE') {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-2">
        <div className="text-4xl">📝</div>
        <h4 className="text-base font-semibold text-slate-700">Chưa có Transcript cho cuộc họp này</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {transcriptView?.reason || 'Chưa nhận được dữ liệu transcript từ Google Meet REST API hoặc DOM Captions Extension.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Source header banner */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nguồn dữ liệu:</span>
          <StatusBadge type="source" value={transcriptView.source} />
          <span className="text-xs text-slate-500">
            ({transcriptView.total_entries} đoạn hội thoại)
          </span>
          {transcriptView.cross_session_coverage !== undefined && transcriptView.cross_session_coverage !== null && (
            <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              ⚡ Độ phủ: {transcriptView.cross_session_coverage}%
            </span>
          )}
          {transcriptView.active_capture_sessions !== undefined && transcriptView.active_capture_sessions !== null && transcriptView.active_capture_sessions > 0 && (
            <span className="inline-flex items-center text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              🟢 {transcriptView.active_capture_sessions} client đang ghi
            </span>
          )}
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Tìm theo người nói hoặc nội dung..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs w-full sm:w-64 pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <span className="absolute left-2.5 top-2 text-xs text-slate-400">🔍</span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Transcript entries list */}
      <div className="p-5 space-y-4 max-h-[600px] overflow-y-auto divide-y divide-slate-100">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            Không tìm thấy đoạn hội thoại nào phù hợp với từ khóa "{searchTerm}".
          </div>
        ) : (
          filteredEntries.map((entry, idx) => (
            <div key={idx} className={`pt-3 first:pt-0 flex items-start space-x-3 group`}>
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                {entry.speaker ? entry.speaker.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-semibold text-slate-800">{entry.speaker || 'Unknown'}</span>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {entry.timestamp}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed break-words whitespace-pre-wrap">
                  {entry.text}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
