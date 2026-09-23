import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, token, isAuthenticated, logout, openTokenModal, isExtensionConnected } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async (allSessions = false) => {
    setDropdownOpen(false);
    await logout(allSessions);
    navigate('/login');
  };

  const isDebugMode = location.search.includes('debug=true') || import.meta.env.DEV;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <span className="text-xl">🎙️</span>
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                DevMeeting AI
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                Dashboard
              </span>
            </div>
          </Link>

          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                to="/meetings"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/meetings')
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Danh sách cuộc họp
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {isAuthenticated && isExtensionConnected && (
            <div
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full text-xs font-semibold text-emerald-700 shadow-sm"
              title="Extension đã kết nối và tự động đồng bộ tài khoản"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Extension sẵn sàng</span>
            </div>
          )}

          {isAuthenticated && user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.display_name || user.email}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {(user.display_name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline-block text-sm font-medium text-slate-700 max-w-[140px] truncate">
                  {user.display_name || user.email}
                </span>
                <span className="text-xs text-slate-400">▼</span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {user.display_name || 'Người dùng DevMeeting'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        setShowConnectModal(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 flex items-center space-x-2 font-medium"
                    >
                      <span>🔗</span>
                      <span>Kết nối Chrome Extension</span>
                    </button>
                    <button
                      onClick={() => handleLogout(false)}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <span>🚪</span>
                      <span>Đăng xuất thiết bị này</span>
                    </button>
                    <button
                      onClick={() => handleLogout(true)}
                      className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center space-x-2"
                    >
                      <span>🔒</span>
                      <span>Đăng xuất tất cả thiết bị</span>
                    </button>
                  </div>

                  {isDebugMode && (
                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          openTokenModal();
                        }}
                        className="w-full text-left px-4 py-1.5 text-xs text-slate-400 hover:text-slate-600 flex items-center space-x-1.5"
                      >
                        <span>🛠️</span>
                        <span>Developer Token Override</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Đăng nhập
              </Link>
              {isDebugMode && (
                <button
                  onClick={openTokenModal}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg text-xs"
                  title="Developer Token"
                >
                  🛠️
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Extension Connect Modal */}
      {showConnectModal && user && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🔗</span>
                <h3 className="text-lg font-bold text-slate-900">Kết nối Chrome Extension</h3>
              </div>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-900 flex items-start space-x-2">
              <span className="text-base">🚀</span>
              <div className="flex-1 leading-relaxed">
                <p className="font-semibold text-indigo-950">Kết nối tự động 1-chạm:</p>
                <p className="text-indigo-800">
                  Khi mở Google Meet, bạn chỉ cần bấm nút <b>[ Đăng nhập với Google ]</b> trên Extension. Hệ thống sẽ tự động kết nối ngầm ngay lập tức!
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Hoặc nếu bạn muốn kết nối thủ công cho tài khoản <strong>{user.display_name || user.email}</strong>, hãy sao chép mã dự phòng dưới đây:
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Mã kết nối (Application Token):</label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={token || ''}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-2.5 pr-24 text-slate-700 select-all focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (token) {
                      navigator.clipboard.writeText(token);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 3000);
                    }
                  }}
                  className="absolute right-1.5 top-1.5 px-3 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  {copied ? '✅ Đã chép' : 'Sao chép'}
                </button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-1.5">
              <p className="font-semibold flex items-center space-x-1.5">
                <span>📌</span>
                <span>Cách dán mã vào Chrome Extension:</span>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-amber-800">
                <li>Mở Google Meet với Extension DevMeet AI.</li>
                <li>Bấm vào biểu tượng bánh răng <strong>Cài đặt (⚙️)</strong> ở góc trên bên phải của Side Panel.</li>
                <li>Dán mã này vào ô và bấm <strong>Lưu Token & Đồng bộ</strong>.</li>
              </ol>
            </div>

            <div className="text-right pt-2">
              <button
                onClick={() => setShowConnectModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
