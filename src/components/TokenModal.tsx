import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const TokenModal: React.FC = () => {
  const { token, updateToken, isTokenModalOpen, closeTokenModal } = useAuth();
  const [inputValue, setInputValue] = useState(token || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isTokenModalOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    updateToken(trimmed || null);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      closeTokenModal();
    }, 600);
  };

  const handleClear = () => {
    setInputValue('');
    updateToken(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🔑</span>
            <h3 className="font-semibold text-slate-800 text-lg">Cấu hình Access Token (Bearer)</h3>
          </div>
          <button
            onClick={closeTokenModal}
            className="text-slate-400 hover:text-slate-600 transition-colors rounded-lg p-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Nhập Google OAuth access token hoặc Bearer token dùng để xác thực các request API tới Backend DevMeeting AI.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Bearer Token
            </label>
            <textarea
              rows={4}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="ya29.a0Ac... hoặc token phát triển"
              className="w-full text-sm font-mono p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-slate-300"
            />
          </div>

          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm flex items-center space-x-2">
              <span>✅</span>
              <span>Đã lưu token thành công! Đang tải lại...</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg font-medium transition-colors"
            >
              Xoá Token
            </button>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={closeTokenModal}
                className="px-4 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
              >
                Đóng
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors shadow-sm"
              >
                Lưu Token
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
