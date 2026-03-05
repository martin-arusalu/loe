export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

const AUTH_KEY = "lauselt_auth_user";
const TOKENS_KEY = "lauselt_auth_tokens";

export function loadAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function saveAuthUser(user: AuthUser): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function loadAuthTokens(): AuthTokens | null {
  try {
    const raw = localStorage.getItem(TOKENS_KEY);
    return raw ? (JSON.parse(raw) as AuthTokens) : null;
  } catch {
    return null;
  }
}

export function saveAuthTokens(tokens: AuthTokens): void {
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

export function clearAuthUser(): void {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(TOKENS_KEY);
}

const API_BASE = "http://localhost:3000";

/**
 * Wrapper around fetch that automatically attaches the stored Bearer token
 * for requests to the API. Falls back to a normal fetch for external URLs.
 */
export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const tokens = loadAuthTokens();
  const headers = new Headers(init.headers);
  if (tokens?.accessToken) {
    headers.set("Authorization", `Bearer ${tokens.accessToken}`);
  }
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}

export async function loginWithGoogle(idToken: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    throw new Error(`Auth failed: ${res.status}`);
  }
  const data = await res.json();
  // Accept either a nested user object or a flat response
  const user: AuthUser = data.user ?? data;
  const tokens: AuthTokens = {
    accessToken: data.accessToken ?? data.access_token,
    refreshToken: data.refreshToken ?? data.refresh_token,
  };
  saveAuthUser(user);
  saveAuthTokens(tokens);
  return user;
}
