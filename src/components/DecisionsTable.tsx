import React from 'react';
import { DecisionItem } from '../types/ai';

export const DecisionsTable: React.FC<{ decisions?: DecisionItem[] | null }> = ({ decisions }) => {
  if (!decisions || decisions.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
        Không có quyết định nào được ghi nhận trong cuộc họp này.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">
            <tr>
              <th className="px-5 py-3">Quyết định</th>
              <th className="px-4 py-3">Bối cảnh / Lý do</th>
              <th className="px-4 py-3">Người đưa ra / Chịu trách nhiệm</th>
              <th className="px-4 py-3">Thời điểm</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {decisions.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-3.5 font-medium text-slate-800">
                  {item.decision}
                </td>
                <td className="px-4 py-3.5 text-slate-600">
                  {item.context || <span className="text-slate-400 italic">—</span>}
                </td>
                <td className="px-4 py-3.5 text-slate-600">
                  {item.owner ? (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium text-xs">
                      <span>👤</span>
                      <span>{item.owner}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-slate-500 font-mono text-xs">
                  {item.evidence_timestamp || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
