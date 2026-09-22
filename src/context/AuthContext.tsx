import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAuthToken, setAuthToken } from '../api/client';
import {
  UserProfile,
  GoogleAuthResponse,
  getCurrentUser,
  loginWithGoogle,
  logoutUser,
  refreshSession,
  createExtensionSession,
} from '../api/auth';

const DEVMEET_EXTENSION_ID =
  (import.meta.env.VITE_CHROME_EXTENSION_ID as string) ||
  'ipgemiheiljmdfcidedhmjijnolicgak';

const notifyExtension = (message: unknown, callback?: (response: any) => void) => {
  if (typeof window !== 'undefined' && (window as any).chrome?.runtime?.sendMessage) {
    try {
      (window as any).chrome.runtime.sendMessage(DEVMEET_EXTENSION_ID, message, (response: any) => {
        if ((window as any).chrome.runtime.lastError) {
          if (callback) callback(null);
          return;
        }
        if (callback) callback(response);
      });
    } catch {
      if (callback) callback(null);
    }
  } else {
    if (callback) callback(null);
  }
};

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isExtensionConnected: boolean;
  login: (idToken: string, clientType?: string) => Promise<GoogleAuthResponse>;
  logout: (allSessions?: boolean) => Promise<void>;
  refresh: () => Promise<void>;
  updateToken: (newToken: string | null) => void;
  isTokenModalOpen: boolean;
  openTokenModal: () => void;
  closeTokenModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(() => getAuthToken());
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isExtensionConnected, setIsExtensionConnected] = useState(false);

  // Restore session on bootstrap
  const initAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      // Check Extension connection via silent ping
      notifyExtension({ type: 'EXTENSION_PING' }, (res) => {
        setIsExtensionConnected(Boolean(res && res.status === 'PONG'));
      });

      // 1. Try to fetch current user with existing access token
      if (getAuthToken()) {
        try {
          const profile = await getCurrentUser();
          setUser(profile);
          setIsLoading(false);
          return;
        } catch {
          // Token expired or invalid, fall through to refresh
        }
      }

      // 2. Try silent refresh with HttpOnly cookie
      try {
        const refreshRes = await refreshSession();
        if (refreshRes.access_token) {
          setTokenState(refreshRes.access_token);
          const profile = await getCurrentUser();
          setUser(profile);
          setIsLoading(false);
          return;
        }
      } catch {
        // No valid session cookie
      }

      // Unauthenticated
      setUser(null);
      setTokenState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();

    // Listen to unauthorized events from API client
    const handleUnauthorized = () => {
      setUser(null);
      setTokenState(null);
    };

    window.addEventListener('devmeet:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('devmeet:unauthorized', handleUnauthorized);
    };
  }, [initAuth]);

  const login = async (idToken: string, clientType = 'WEB'): Promise<GoogleAuthResponse> => {
    setIsLoading(true);
    try {
      const response = await loginWithGoogle(idToken, clientType);
      setTokenState(response.access_token);
      setUser(response.user);

      // Automatically create independent Extension session and sync via 2-way message
      createExtensionSession().then((extRes) => {
        if (extRes && extRes.access_token) {
          notifyExtension({
            type: 'WEB_AUTH_LOGIN',
            payload: {
              accessToken: extRes.access_token,
              refreshToken: extRes.refresh_token,
              user: extRes.user,
            },
          }, (res) => {
            if (res && res.success) {
              setIsExtensionConnected(true);
            }
          });
        }
      }).catch((err) => {
        console.warn('[Web AuthContext] Failed to create extension session:', err);
      });

      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (allSessions = false) => {
    setIsLoading(true);
    try {
      await logoutUser(allSessions);
      if (allSessions) {
        // Only revoke Extension if user explicitly chose all sessions logout
        notifyExtension({
          type: 'WEB_AUTH_LOGOUT',
          payload: { scope: 'ALL' },
        });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      setAuthToken(null);
      setTokenState(null);
      setUser(null);
      setIsLoading(false);
    }
  };

  const refresh = async () => {
    try {
      const refreshRes = await refreshSession();
      if (refreshRes.access_token) {
        setTokenState(refreshRes.access_token);
        const profile = await getCurrentUser();
        setUser(profile);
      }
    } catch {
      setUser(null);
      setTokenState(null);
    }
  };

  const updateToken = (newToken: string | null) => {
    setAuthToken(newToken);
    setTokenState(newToken);
    if (newToken) {
      getCurrentUser()
        .then(setUser)
        .catch(() => setUser(null));
    } else {
      setUser(null);
    }
  };

  const openTokenModal = () => setIsTokenModalOpen(true);
  const closeTokenModal = () => setIsTokenModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        isExtensionConnected,
        login,
        logout,
        refresh,
        updateToken,
        isTokenModalOpen,
        openTokenModal,
        closeTokenModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
