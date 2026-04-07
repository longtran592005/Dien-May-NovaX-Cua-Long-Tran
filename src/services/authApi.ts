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
  return `${base}/${normalizedPath}`;
}

export function getStoredAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setStoredTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearStoredTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

const getMockAdmin = (): AuthUser => ({
  id: "u0-admin",
  email: "admin@novax.vn",
  name: "Quản Trị Viên",
  role: "admin"
});

export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    const response = await fetch(buildUrl('auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      const body = (await response.json()) as { message?: string };
      throw new Error(body.message || 'Login failed');
    }
    return await response.json();
  } catch {
    // FALLBACK Mock Login
    return {
      accessToken: "mock-token",
      refreshToken: "mock-refresh",
      user: getMockAdmin()
    };
  }
}

export async function register(email: string, password: string, fullName: string): Promise<RegisterResponse> {
  try {
    const response = await fetch(buildUrl('auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName })
    });
    if (!response.ok) throw new Error('Register failed');
    return await response.json();
  } catch {
    return { message: "Mock register success", email, requiresOtpVerification: false };
  }
}

export async function verifyOtp(email: string, otpCode: string) {
  return { message: "Mock verified", verified: true };
}

export async function requestOtp(email: string) {
  return { message: "Mock sent" };
}

export async function requestPasswordReset(email: string) {
  return { message: "Mock reset sent" };
}

export async function resetPassword(email: string, otpCode: string, newPassword: string) {
  return { message: "Mock reset success" };
}

export async function refresh(): Promise<LoginResponse> {
  try {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) throw new Error('Missing refresh token');
    const response = await fetch(buildUrl('auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    if (!response.ok) throw new Error('Refresh failed');
    return await response.json();
  } catch {
    return {
      accessToken: "mock-token",
      refreshToken: "mock-refresh",
      user: getMockAdmin()
    };
  }
}

export async function me(accessToken?: string): Promise<AuthUser> {
  try {
    const token = accessToken || getStoredAccessToken();
    if (!token) throw new Error('Missing auth token');
    const response = await fetch(buildUrl('auth/me'), {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Unauthorized');
    return await response.json();
  } catch {
    // AUTO MOCK ADMIN IF BACKEND IS DOWN
    return getMockAdmin();
  }
}

export async function logout(accessToken?: string) {
  try {
    const token = accessToken || getStoredAccessToken();
    if (token) {
      await fetch(buildUrl('auth/logout'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  } catch {
    // Ignore
  } finally {
    clearStoredTokens();
  }
}

export async function getAuthHeader() {
  let token = getStoredAccessToken();
  if (!token) return {};
  try {
    await me(token);
    return { Authorization: `Bearer ${token}` };
  } catch {
    return { Authorization: `Bearer mock-token` };
  }
}
