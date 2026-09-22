import React, { useState, useRef, useEffect } from 'react';
import { exportMeetingTxt } from '../api/export';

interface ExportDropdownProps {
  meetingId: string;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({ meetingId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (type: 'transcript' | 'summary' | 'all') => {
    try {
      setIsExporting(true);
      setExportError(null);
      await exportMeetingTxt(meetingId, type);
      setIsOpen(false);
    } catch (err: any) {
      console.error('Export error:', err);
      setExportError(err.message || 'Lỗi khi tải file export');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
      >
        <span>{isExporting ? '⏳' : '📥'}</span>
        <span>{isExporting ? 'Đang xuất...' : 'Xuất File (.txt)'}</span>
        <span className="text-[10px] text-slate-400">▼</span>
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-slate-100 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="py-1">
            <button
              onClick={() => handleExport('all')}
              disabled={isExporting}
              className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center space-x-2.5 transition-colors"
            >
              <span>📑</span>
              <div>
                <div className="font-semibold">Xuất toàn bộ (.txt)</div>
                <div className="text-[10px] text-slate-400">Transcript + AI Summary + Actions</div>
              </div>
            </button>
            <button
              onClick={() => handleExport('transcript')}
              disabled={isExporting}
              className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center space-x-2.5 transition-colors"
            >
              <span>📝</span>
              <div>
                <div className="font-semibold">Chỉ Transcript (.txt)</div>
                <div className="text-[10px] text-slate-400">Nội dung hội thoại theo mốc thời gian</div>
              </div>
            </button>
            <button
              onClick={() => handleExport('summary')}
              disabled={isExporting}
              className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center space-x-2.5 transition-colors"
            >
              <span>✨</span>
              <div>
                <div className="font-semibold">Chỉ AI Summary (.txt)</div>
                <div className="text-[10px] text-slate-400">Tóm tắt, Quyết định, Việc cần làm</div>
              </div>
            </button>
          </div>

          {exportError && (
            <div className="p-2 text-[11px] text-rose-600 bg-rose-50 rounded-b-xl">
              {exportError}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
