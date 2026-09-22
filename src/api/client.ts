const DEFAULT_API_BASE = 'http://127.0.0.1:8000';

export function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL as string) || DEFAULT_API_BASE;
}

export function getAuthToken(): string | null {
  return localStorage.getItem('devmeet_access_token');
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem('devmeet_access_token', token);
  } else {
    localStorage.removeItem('devmeet_access_token');
  }
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export async function silentRefreshToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
      const res = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) {
        setAuthToken(null);
        return null;
      }
      const data = await res.json();
      if (data && data.access_token) {
        setAuthToken(data.access_token);
        return data.access_token;
      }
      setAuthToken(null);
      return null;
    } catch {
      setAuthToken(null);
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Ensure cookies (devmeet_refresh_token) are transmitted across origins
  const fetchOptions: RequestInit = {
    ...options,
    credentials: 'include',
    headers,
  };

  let response = await fetch(url, fetchOptions);

  // 401 Unauthorized handling with transparent silent refresh retry
  const isAuthEndpoint = endpoint.includes('/auth/google') || endpoint.includes('/auth/refresh') || endpoint.includes('/auth/logout');
  if (response.status === 401 && !isAuthEndpoint) {
    const newToken = await silentRefreshToken();
    if (newToken) {
      // Retry original request with new token
      headers.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(url, {
        ...fetchOptions,
        headers,
      });
    } else {
      // Refresh failed, notify subscribers (e.g. AuthContext)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('devmeet:unauthorized'));
      }
    }
  }

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status} ${response.statusText}`;
    let errorData = null;
    try {
      errorData = await response.json();
      if (errorData && errorData.detail) {
        errorDetail = typeof errorData.detail === 'string'
          ? errorData.detail
          : JSON.stringify(errorData.detail);
      }
    } catch {
      // response is not JSON
    }
    throw new ApiError(errorDetail, response.status, errorData);
  }

  // If 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
