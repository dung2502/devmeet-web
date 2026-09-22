import React, { useState } from 'react';
import { FollowUpEmail as FollowUpEmailType } from '../types/ai';

export const FollowUpEmail: React.FC<{ email?: FollowUpEmailType | null }> = ({ email }) => {
  const [copied, setCopied] = useState(false);

  if (!email || (!email.subject && !email.body)) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
        Chưa có bản thảo email follow-up cho cuộc họp này.
      </div>
    );
  }

  const handleCopyFull = async () => {
    const fullText = `Tiêu đề: ${email.subject || ''}\n\n${email.body || ''}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-lg">✉️</span>
          <h4 className="font-semibold text-slate-800 text-sm">Bản thảo Follow-up Email</h4>
        </div>
        <button
          onClick={handleCopyFull}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all shadow-sm ${
            copied
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          <span>{copied ? '✅ Đã sao chép!' : '📋 Sao chép Email'}</span>
        </button>
      </div>

      <div className="p-6 space-y-4">
        {/* Subject */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Tiêu đề (Subject)
          </label>
          <div className="text-sm font-semibold text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200">
            {email.subject || <span className="text-slate-400 italic font-normal">Không có tiêu đề</span>}
          </div>
        </div>

        {/* Body */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Nội dung (Body)
          </label>
          <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
            {email.body}
          </div>
        </div>
      </div>
    </div>
  );
};
