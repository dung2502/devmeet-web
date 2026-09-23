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

  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(
    email.subject || ''
  )}&body=${encodeURIComponent(email.body || '')}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Top action header */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xl">📧</span>
          <h4 className="font-bold text-slate-800 text-sm">Bản thảo Follow-up Email</h4>
        </div>
        <div className="flex items-center space-x-2.5">
          <a
            href={gmailComposeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center space-x-1.5 transition-colors shadow-2xs"
            title="Mở trình soạn thư của Gmail với nội dung đã được điền sẵn"
          >
            <span>🚀</span>
            <span>Mở trên Gmail</span>
          </a>
          <button
            onClick={handleCopyFull}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            <span>{copied ? '✅ Đã sao chép!' : '📋 Sao chép Email'}</span>
          </button>
        </div>
      </div>

      {/* Email Client Simulated Container */}
      <div className="p-6 space-y-4">
        <div className="rounded-xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden bg-white">
          {/* Header Fields */}
          <div className="px-5 py-3 bg-slate-50/50 flex items-center text-xs">
            <span className="w-20 font-semibold text-slate-400 uppercase tracking-wider text-[11px]">Người nhận:</span>
            <span className="text-slate-600 italic">Tất cả thành viên tham gia cuộc họp</span>
          </div>

          <div className="px-5 py-3 bg-slate-50/50 flex items-center text-xs">
            <span className="w-20 font-semibold text-slate-400 uppercase tracking-wider text-[11px]">Tiêu đề:</span>
            <span className="font-bold text-slate-900 text-sm">
              {email.subject || <span className="text-slate-400 italic font-normal">Không có tiêu đề</span>}
            </span>
          </div>

          {/* Email Body */}
          <div className="p-5 text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-wrap bg-white min-h-[160px]">
            {email.body}
          </div>
        </div>
      </div>
    </div>
  );
};
