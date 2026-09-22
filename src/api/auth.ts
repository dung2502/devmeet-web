import { apiClient, setAuthToken } from './client';

export interface UserProfile {
  id: string;
  google_user_id: string;
  email: string;
  display_name: string | null;
  picture: string | null;
}

export interface GoogleAuthResponse {
  success: boolean;
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string | null;
  user: UserProfile;
}

export interface RefreshTokenResponse {
  success: boolean;
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string | null;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export async function loginWithGoogle(idToken: string, clientType = 'WEB'): Promise<GoogleAuthResponse> {
  const response = await apiClient<GoogleAuthResponse>('/api/v1/auth/google', {
    method: 'POST',
    body: JSON.stringify({
      credential_type: 'google_id_token',
      credential: idToken,
      client_type: clientType,
    }),
  });

  if (response.access_token) {
    setAuthToken(response.access_token);
  }
  return response;
}

export async function getCurrentUser(): Promise<UserProfile> {
  return apiClient<UserProfile>('/api/v1/users/me');
}

export async function refreshSession(): Promise<RefreshTokenResponse> {
  const response = await apiClient<RefreshTokenResponse>('/api/v1/auth/refresh', {
    method: 'POST',
  });
  if (response.access_token) {
    setAuthToken(response.access_token);
  }
  return response;
}

export async function logoutUser(allSessions = false): Promise<LogoutResponse> {
  try {
    return await apiClient<LogoutResponse>('/api/v1/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ all_sessions: allSessions }),
    });
  } finally {
    setAuthToken(null);
  }
}

export async function createExtensionSession(): Promise<GoogleAuthResponse> {
  return apiClient<GoogleAuthResponse>('/api/v1/auth/extension-session', {
    method: 'POST',
  });
}

