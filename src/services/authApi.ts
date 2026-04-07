const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const ACCESS_TOKEN_KEY = 'novax-access-token';
const REFRESH_TOKEN_KEY = 'novax-refresh-token';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role?: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

interface RegisterResponse {
  message: string;
  email: string;
  requiresOtpVerification: boolean;
}

function buildUrl(path: string) {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const normalizedPath = path.replace(/^\/+/, '');
  // Nếu base là URL tương đối (ex: /api/v1), phải gắn window.location.origin
  if (base.startsWith('/')) {
    return `${window.location.origin}${base}/${normalizedPath}`;
  }
  return `${base}/${normalizedPath}`;
}

let memoryAccessToken: string | null = null;

export function getStoredAccessToken() {
  return memoryAccessToken || sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken() {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setStoredTokens(accessToken: string, refreshToken: string) {
  memoryAccessToken = accessToken;
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearStoredTokens() {
  memoryAccessToken = null;
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(buildUrl('auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message || 'Login failed');
  }

  return response.json() as Promise<LoginResponse>;
}

export async function register(email: string, password: string, fullName: string): Promise<RegisterResponse> {
  const response = await fetch(buildUrl('auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, fullName })
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message || 'Register failed');
  }

  return response.json() as Promise<RegisterResponse>;
}

export async function verifyOtp(email: string, otpCode: string) {
  const response = await fetch(buildUrl('auth/verify-otp'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otpCode })
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message || 'OTP verification failed');
  }

  return response.json() as Promise<{ message: string; verified: boolean }>;
}

export async function requestOtp(email: string) {
  const response = await fetch(buildUrl('auth/request-otp'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message || 'Request OTP failed');
  }

  return response.json() as Promise<{ message: string }>;
}

export async function requestPasswordReset(email: string) {
  const response = await fetch(buildUrl('auth/request-password-reset'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message || 'Request password reset failed');
  }

  return response.json() as Promise<{ message: string }>;
}

export async function resetPassword(email: string, otpCode: string, newPassword: string) {
  const response = await fetch(buildUrl('auth/reset-password'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otpCode, newPassword })
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message || 'Reset password failed');
  }

  return response.json() as Promise<{ message: string }>;
}

export async function refresh(): Promise<LoginResponse> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    throw new Error('Missing refresh token');
  }

  const response = await fetch(buildUrl('auth/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  if (!response.ok) {
    throw new Error('Refresh failed');
  }

  return response.json() as Promise<LoginResponse>;
}

export async function me(accessToken?: string): Promise<AuthUser> {
  const token = accessToken || getStoredAccessToken();
  if (!token) {
    throw new Error('Missing access token');
  }

  const response = await fetch(buildUrl('auth/me'), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Unauthorized');
  }

  return response.json() as Promise<AuthUser>;
}

export async function logout(accessToken?: string) {
  const token = accessToken || getStoredAccessToken();
  if (!token) {
    clearStoredTokens();
    return;
  }

  await fetch(buildUrl('auth/logout'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  clearStoredTokens();
}

export async function getAuthHeader() {
  let token = getStoredAccessToken();

  if (!token) {
    return {};
  }

  try {
    await me(token);
    return { Authorization: `Bearer ${token}` };
  } catch {
    try {
      const refreshed = await refresh();
      setStoredTokens(refreshed.accessToken, refreshed.refreshToken);
      token = refreshed.accessToken;
      return { Authorization: `Bearer ${token}` };
    } catch {
      clearStoredTokens();
      return {};
    }
  }
}
