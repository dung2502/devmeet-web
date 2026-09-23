import React, { useState, useMemo, useEffect, useRef } from 'react';
import { TranscriptViewResponse } from '../types/transcript';
import { StatusBadge } from './StatusBadge';

export interface TranscriptViewerProps {
  transcriptView: TranscriptViewResponse | null;
  loading?: boolean;
  targetTimestamp?: string | null;
  onClearTargetTimestamp?: () => void;
  onDeleteMeeting?: () => void;
  userRole?: string;
}

function parseTimestampToSeconds(ts?: string | null): number | null {
  if (!ts) return null;
  const cleaned = ts.replace(/[\[\]]/g, '').trim();
  const parts = cleaned.split(':').map((p) => parseInt(p, 10));
  if (parts.some((p) => isNaN(p))) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0];
}

interface GroupedBlock {
  speaker: string;
  startTime: string;
  items: {
    rawIndex: number;
    text: string;
    timestamp: string;
  }[];
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-amber-200 text-amber-950 font-medium px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  transcriptView,
  loading = false,
  targetTimestamp,
  onClearTargetTimestamp,
  onDeleteMeeting,
  userRole,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const entryRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Speaker statistics for chips
  const speakerStats = useMemo(() => {
    if (!transcriptView?.entries) return { list: [], counts: {} as Record<string, number> };
    const counts: Record<string, number> = {};
    transcriptView.entries.forEach((e) => {
      const spk = e.speaker?.trim() || 'Người nói';
      counts[spk] = (counts[spk] || 0) + 1;
    });
    return { list: Object.keys(counts), counts };
  }, [transcriptView]);

  // Filter entries while tracking original rawIndex
  const filteredWithIndex = useMemo(() => {
    if (!transcriptView || !transcriptView.entries) return [];
    return transcriptView.entries
      .map((entry, rawIndex) => ({ ...entry, rawIndex }))
      .filter((entry) => {
        const spk = entry.speaker?.trim() || 'Người nói';
        if (selectedSpeaker && spk !== selectedSpeaker) {
          return false;
        }
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchSpeaker = spk.toLowerCase().includes(q);
          const matchText = entry.text?.toLowerCase().includes(q);
          const matchTime = entry.timestamp?.toLowerCase().includes(q);
          if (!matchSpeaker && !matchText && !matchTime) return false;
        }
        return true;
      });
  }, [transcriptView, selectedSpeaker, searchTerm]);

  // Group consecutive messages by the same speaker within 60s
  const groupedBlocks = useMemo(() => {
    const blocks: GroupedBlock[] = [];
    filteredWithIndex.forEach((entry) => {
      const spk = entry.speaker?.trim() || 'Người nói';
      const lastBlock = blocks[blocks.length - 1];

      let canGroup = false;
      if (lastBlock && lastBlock.speaker === spk) {
        const lastEntry = lastBlock.items[lastBlock.items.length - 1];
        const lastSec = parseTimestampToSeconds(lastEntry.timestamp);
        const currSec = parseTimestampToSeconds(entry.timestamp);
        if (lastSec !== null && currSec !== null) {
          canGroup = Math.abs(currSec - lastSec) <= 60;
        } else {
          canGroup = true;
        }
      }

      if (canGroup) {
        lastBlock.items.push({
          rawIndex: entry.rawIndex,
          text: entry.text,
          timestamp: entry.timestamp,
        });
      } else {
        blocks.push({
          speaker: spk,
          startTime: entry.timestamp,
          items: [
            {
              rawIndex: entry.rawIndex,
              text: entry.text,
              timestamp: entry.timestamp,
            },
          ],
        });
      }
    });
    return blocks;
  }, [filteredWithIndex]);

  // Deep-linking scroll & pulse effect
  useEffect(() => {
    if (!targetTimestamp || !transcriptView?.entries?.length) return;

    const targetSec = parseTimestampToSeconds(targetTimestamp);
    let bestIndex = -1;
    let bestDiff = Infinity;

    transcriptView.entries.forEach((e, idx) => {
      if (e.timestamp && (e.timestamp.includes(targetTimestamp) || targetTimestamp.includes(e.timestamp))) {
        bestIndex = idx;
        bestDiff = 0;
        return;
      }
      if (targetSec !== null) {
        const entrySec = parseTimestampToSeconds(e.timestamp);
        if (entrySec !== null) {
          const diff = Math.abs(entrySec - targetSec);
          if (diff < bestDiff && diff <= 15) {
            bestDiff = diff;
            bestIndex = idx;
          }
        }
      }
    });

    if (bestIndex !== -1) {
      const targetSpeaker = transcriptView.entries[bestIndex]?.speaker?.trim() || 'Người nói';
      if (selectedSpeaker && selectedSpeaker !== targetSpeaker) {
        setSelectedSpeaker(null);
      }

      setHighlightedIndex(bestIndex);

      setTimeout(() => {
        const el = entryRefs.current[bestIndex];
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      const timer = setTimeout(() => {
        setHighlightedIndex(null);
        onClearTargetTimestamp?.();
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [targetTimestamp, transcriptView, onClearTargetTimestamp, selectedSpeaker]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
        <p className="text-sm font-medium">Đang tải transcript...</p>
      </div>
    );
  }

  if (!transcriptView || transcriptView.total_entries === 0 || transcriptView.source === 'NONE') {
    return (
      <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-xl mx-auto my-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
          🎙️
        </div>
        <div className="space-y-1">
          <h4 className="text-base font-bold text-slate-800">Chưa có dữ liệu biên bản cuộc họp</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            {transcriptView?.reason || 'Chưa nhận được câu thoại nào từ cuộc họp này.'}
          </p>
        </div>

        <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 text-left space-y-1.5">
          <p className="font-semibold flex items-center space-x-1.5">
            <span>💡</span>
            <span>Mẹo ghi nhận phụ đề Google Meet:</span>
          </p>
          <p className="text-amber-800 leading-relaxed">
            Khi đang trong cuộc họp Google Meet, hãy đảm bảo tính năng phụ đề đang bật bằng cách bấm phím tắt{' '}
            <kbd className="px-1.5 py-0.5 bg-white border border-amber-300 rounded font-mono font-bold text-amber-950 shadow-xs">
              c
            </kbd>{' '}
            trên bàn phím.
          </p>
        </div>

        {onDeleteMeeting && (
          <div className="pt-2">
            <button
              onClick={onDeleteMeeting}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
            >
              <span>{userRole === 'PARTICIPANT' ? '👁️' : '🗑️'}</span>
              <span>{userRole === 'PARTICIPANT' ? 'Ẩn cuộc họp rỗng này' : 'Xóa cuộc họp rỗng này'}</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header bar with controls */}
      <div className="bg-slate-50/80 border-b border-slate-200 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nguồn:</span>
            <StatusBadge type="source" value={transcriptView.source} />
            <span className="text-xs text-slate-500 font-medium">
              ({transcriptView.total_entries} câu thoại)
            </span>
            {transcriptView.cross_session_coverage !== undefined && transcriptView.cross_session_coverage !== null && (
              <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                ⚡ {transcriptView.cross_session_coverage}%
              </span>
            )}
            {transcriptView.active_capture_sessions !== undefined && transcriptView.active_capture_sessions !== null && transcriptView.active_capture_sessions > 0 && (
              <span className="inline-flex items-center text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                🟢 {transcriptView.active_capture_sessions} client
              </span>
            )}
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Tìm câu thoại hoặc người nói..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs w-full pl-8 pr-7 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
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

        {/* Speaker filter chips */}
        {speakerStats.list.length > 1 && (
          <div className="flex items-center space-x-1.5 overflow-x-auto pt-1 pb-0.5 text-xs">
            <span className="text-slate-400 font-medium mr-1 text-[11px] whitespace-nowrap">Lọc người nói:</span>
            <button
              onClick={() => setSelectedSpeaker(null)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                selectedSpeaker === null
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Tất cả ({transcriptView.total_entries})
            </button>
            {speakerStats.list.map((spk) => (
              <button
                key={spk}
                onClick={() => setSelectedSpeaker(selectedSpeaker === spk ? null : spk)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  selectedSpeaker === spk
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {spk} ({speakerStats.counts[spk]})
              </button>
            ))}
          </div>
        )}

        {/* Active search filter feedback */}
        {searchTerm.trim() && (
          <div className="text-xs text-indigo-700 flex items-center justify-between bg-indigo-50/60 px-3 py-1.5 rounded-lg border border-indigo-100">
            <span>
              Tìm thấy <strong>{filteredWithIndex.length}</strong> câu thoại phù hợp với từ khóa "<strong>{searchTerm}</strong>"
            </span>
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-indigo-500 hover:text-indigo-800 underline font-medium"
            >
              Xóa lọc
            </button>
          </div>
        )}
      </div>

      {/* Transcript grouped conversation blocks */}
      <div className="p-5 space-y-4 max-h-[640px] overflow-y-auto">
        {groupedBlocks.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Không tìm thấy đoạn hội thoại nào phù hợp.
          </div>
        ) : (
          groupedBlocks.map((block, bIdx) => (
            <div
              key={bIdx}
              className="flex items-start space-x-3.5 group p-3 rounded-xl hover:bg-slate-50/60 transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white font-bold text-xs shadow-xs mt-0.5">
                {block.speaker ? block.speaker.charAt(0).toUpperCase() : '?'}
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-800">{block.speaker}</span>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {block.startTime}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {block.items.map((item) => {
                    const isTarget = highlightedIndex === item.rawIndex;
                    return (
                      <div
                        key={item.rawIndex}
                        ref={(el) => {
                          entryRefs.current[item.rawIndex] = el;
                        }}
                        className={`text-sm text-slate-700 leading-relaxed rounded-lg p-1.5 transition-all duration-300 ${
                          isTarget
                            ? 'ring-2 ring-indigo-500 bg-indigo-50/80 shadow-md font-medium text-slate-900'
                            : ''
                        }`}
                      >
                        <p className="break-words whitespace-pre-wrap">
                          {highlightText(item.text, searchTerm)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
