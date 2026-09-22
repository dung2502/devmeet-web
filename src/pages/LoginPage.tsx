import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { createExtensionSession } from '../api/auth';

export const LoginPage: React.FC = () => {
  const { user, token, login, logout, isAuthenticated, isLoading, openTokenModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Read extension query params
  const searchParams = new URLSearchParams(location.search);
  const isFromExtension = searchParams.get('source') === 'extension';
  const extId = searchParams.get('ext_id');
  const [handshakeDone, setHandshakeDone] = useState(false);

  const sendHandshake = (targetExtId: string, accessToken: string, refreshToken?: string | null, userProfile?: any) => {
    if ((window as any).chrome?.runtime?.sendMessage) {
      try {
        (window as any).chrome.runtime.sendMessage(
          targetExtId,
          {
            type: 'AUTH_HANDSHAKE',
            payload: {
              accessToken,
              refreshToken: refreshToken || undefined,
              user: userProfile,
            },
          },
          (res: any) => {
            console.log('[DevMeeting Web] Handshake response from extension:', res);
            setHandshakeDone(true);
          }
        );
      } catch (err) {
        console.warn('[DevMeeting Web] Handshake error:', err);
        setHandshakeDone(true);
      }
    } else {
      setHandshakeDone(true);
    }
  };

  // If already authenticated: perform handshake immediately if from extension, or redirect
  useEffect(() => {
    let cancelled = false;
    if (isAuthenticated && !isLoading && isFromExtension && extId && token && !handshakeDone) {
      (async () => {
        try {
          const sessionRes = await createExtensionSession();
          if (cancelled) return;
          sendHandshake(extId, sessionRes.access_token, sessionRes.refresh_token, sessionRes.user);
          setHandshakeDone(true);
          setTimeout(() => {
            try { window.close(); } catch {}
          }, 1200);
        } catch (err) {
          console.warn('[DevMeeting Web] Failed to create extension session, falling back:', err);
          if (cancelled) return;
          sendHandshake(extId, token, null, user);
          setHandshakeDone(true);
          setTimeout(() => {
            try { window.close(); } catch {}
          }, 1200);
        }
      })();
    } else if (isAuthenticated && !isLoading && !isFromExtension) {
      const from = (location.state as any)?.from?.pathname || '/meetings';
      navigate(from, { replace: true });
    }
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, isFromExtension, extId, token, user, handshakeDone, location, navigate]);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setErrorMsg('Không nhận được credential từ Google.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const authRes = await login(
        credentialResponse.credential,
        'WEB'
      );
      if (isFromExtension && extId) {
        try {
          const sessionRes = await createExtensionSession();
          sendHandshake(extId, sessionRes.access_token, sessionRes.refresh_token, sessionRes.user);
        } catch (err) {
          console.warn('[DevMeeting Web] Failed to create extension session after login:', err);
          sendHandshake(extId, authRes.access_token, authRes.refresh_token, authRes.user);
        }
        setHandshakeDone(true);
        setTimeout(() => {
          try { window.close(); } catch {}
        }, 1200);
      } else {
        const from = (location.state as any)?.from?.pathname || '/meetings';
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setErrorMsg('Xác thực với tài khoản Google không thành công.');
  };

  const clientIdConfigured = !!(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  // If opened from Chrome Extension and handshake completed: show delightful success view!
  if (isFromExtension && handshakeDone && user) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 mb-1 border border-emerald-100 shadow-sm">
            <span className="text-4xl">🎉</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Kết nối Extension Thành Công!
          </h2>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-3 text-left">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              {(user.display_name || user.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {user.display_name || 'Người dùng DevMeeting'}
              </p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
              Đã kích hoạt
            </span>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            Chrome Extension trên Google Meet đã tự động nhận diện tài khoản này. Bạn có thể quay lại cuộc họp ngay bây giờ!
          </p>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => window.close()}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              Quay lại Google Meet (Đóng tab)
            </button>
            <button
              onClick={() => navigate('/meetings')}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
            >
              Xem Danh sách Cuộc họp Web Dashboard ↗
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={async () => {
                await logout(false);
                setHandshakeDone(false);
              }}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Đổi sang tài khoản Google khác
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg mb-4">
            <span className="text-3xl">🎙️</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            DevMeeting AI
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Đăng nhập để quản lý cuộc họp, xem transcript và kích hoạt phân tích AI thông minh
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-2">
            <span className="text-base font-bold">⚠️</span>
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center py-2">
            {clientIdConfigured ? (
              <div className={isSubmitting ? 'opacity-50 pointer-events-none' : ''}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap
                  theme="outline"
                  size="large"
                  text="signin_with"
                  shape="pill"
                  width="320"
                />
              </div>
            ) : (
              <div className="w-full p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-center space-y-2">
                <p className="font-semibold">⚠️ Chưa cấu hình VITE_GOOGLE_CLIENT_ID</p>
                <p>
                  Vui lòng thêm Client ID vào tệp <code className="bg-amber-100 px-1 py-0.5 rounded">.env</code> để hiển thị nút đăng nhập Google chính thức.
                </p>
                <button
                  type="button"
                  onClick={openTokenModal}
                  className="mt-2 inline-flex items-center px-3 py-1.5 border border-amber-300 text-xs font-medium rounded-lg text-amber-900 bg-amber-100 hover:bg-amber-200 transition-colors"
                >
                  🛠️ Sử dụng Developer Access Token
                </button>
              </div>
            )}
          </div>

          {isSubmitting && (
            <div className="flex items-center justify-center space-x-2 text-sm text-indigo-600 font-medium">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Đang thiết lập phiên làm việc...</span>
            </div>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-medium">Bảo mật & Phiên làm việc</span>
            </div>
          </div>

          <div className="text-xs text-slate-400 text-center space-y-1">
            <p>Phiên đăng nhập ứng dụng được mã hóa an toàn qua HttpOnly Cookie.</p>
            <p>Hỗ trợ bảo vệ chống đánh cắp token và xoay vòng phiên tự động.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
