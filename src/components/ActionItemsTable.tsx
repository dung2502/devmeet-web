import React, { useState } from 'react';
import { ActionItem } from '../types/ai';

export interface ActionItemsTableProps {
  actionItems?: ActionItem[] | null;
  onSelectTimestamp?: (timestamp: string) => void;
}

export const ActionItemsTable: React.FC<ActionItemsTableProps> = ({ actionItems, onSelectTimestamp }) => {
  const [copied, setCopied] = useState(false);

  if (!actionItems || actionItems.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
        Không có đầu việc (Action Items) nào được trích xuất từ cuộc họp này.
      </div>
    );
  }

  const handleCopyMarkdown = async () => {
    const lines = actionItems.map((item) => {
      const parts: string[] = [];
      if (item.assignee) parts.push(`Phụ trách: ${item.assignee}`);
      if (item.deadline || item.due_date) parts.push(`Hạn chót: ${item.deadline || item.due_date}`);
      if (item.priority) parts.push(`Ưu tiên: ${item.priority}`);
      if (item.evidence_timestamp) parts.push(`[${item.evidence_timestamp}]`);
      const meta = parts.length > 0 ? ` (${parts.join(', ')})` : '';
      return `- [ ] **${item.task}**${meta}`;
    });

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy action items:', err);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">
          Tổng cộng: <strong>{actionItems.length}</strong> nhiệm vụ
        </span>
        <button
          type="button"
          onClick={handleCopyMarkdown}
          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer ${
            copied
              ? 'bg-emerald-600 text-white'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
          title="Sao chép toàn bộ danh sách theo định dạng Markdown Task List"
        >
          <span>{copied ? '✅' : '📋'}</span>
          <span>{copied ? 'Đã sao chép Markdown!' : 'Sao chép việc cần làm'}</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50/60 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">
            <tr>
              <th className="px-5 py-3">Công việc / Nhiệm vụ</th>
              <th className="px-4 py-3">Người phụ trách</th>
              <th className="px-4 py-3">Hạn chót</th>
              <th className="px-4 py-3">Độ ưu tiên</th>
              <th className="px-4 py-3">Thời điểm</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {actionItems.map((item, idx) => {
              const priority = (item.priority || '').toUpperCase();
              let priorityBadge = 'bg-slate-100 text-slate-600 border-slate-200';
              if (priority === 'HIGH' || priority === 'CAO') {
                priorityBadge = 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
              } else if (priority === 'MEDIUM' || priority === 'TRUNG BÌNH') {
                priorityBadge = 'bg-amber-50 text-amber-700 border-amber-200';
              } else if (priority === 'LOW' || priority === 'THẤP') {
                priorityBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
              }

              return (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-800">
                    {item.task}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">
                    {item.assignee ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium text-xs">
                        <span>👤</span>
                        <span>{item.assignee}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Chưa chỉ định</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 font-mono text-xs">
                    {item.deadline || item.due_date || (
                      <span className="text-slate-400 italic font-sans">Không rõ</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {item.priority ? (
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] border ${priorityBadge}`}>
                        {item.priority}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 font-mono text-xs">
                    {item.evidence_timestamp ? (
                      <button
                        type="button"
                        onClick={() => onSelectTimestamp?.(item.evidence_timestamp!)}
                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer group"
                        title="Xem trong Transcript"
                      >
                        <span>⏱️</span>
                        <span className="group-hover:underline font-mono">{item.evidence_timestamp}</span>
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
