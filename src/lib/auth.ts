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

// TODO: Move to env
const API_BASE = "http://localhost:3000";

/**
 * Calls POST /auth/refresh with the stored refresh token and persists the
 * new token pair. Returns the new tokens, or null if the refresh fails.
 * Concurrent callers share a single in-flight request via the module-level
 * promise so that multiple 401s only trigger one refresh.
 */
let _refreshPromise: Promise<AuthTokens | null> | null = null;

export async function refreshTokens(): Promise<AuthTokens | null> {
  const tokens = loadAuthTokens();
  if (!tokens?.refreshToken) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });
    if (!res.ok) {
      if (res.status === 401) {
        // Refresh token is invalid/expired — wipe local credentials and notify the app.
        clearAuthUser();
        window.dispatchEvent(new CustomEvent("auth:sessionExpired"));
      }
      return null;
    }
    const data = await res.json();
    const newTokens: AuthTokens = {
      accessToken: data.accessToken ?? data.access_token,
      // Keep the old refresh token if the server doesn't issue a new one
      refreshToken: data.refreshToken ?? data.refresh_token ??
        tokens.refreshToken,
    };
    saveAuthTokens(newTokens);
    return newTokens;
  } catch {
    return null;
  }
}

/**
 * Wrapper around fetch that automatically attaches the stored Bearer token.
 * On a 401 response it attempts a token refresh once and retries the original
 * request with the new access token.
 */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const makeRequest = (accessToken: string | undefined): Promise<Response> => {
    const headers = new Headers(init.headers);
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
    if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    return fetch(`${API_BASE}${path}`, { ...init, headers });
  };

  const tokens = loadAuthTokens();
  let res = await makeRequest(tokens?.accessToken);

  if (res.status === 401 && tokens?.refreshToken) {
    // Deduplicate concurrent refresh attempts into a single request
    if (!_refreshPromise) {
      _refreshPromise = refreshTokens().finally(() => {
        _refreshPromise = null;
      });
    }
    const newTokens = await _refreshPromise;
    if (newTokens) {
      res = await makeRequest(newTokens.accessToken);
    }
  }

  return res;
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
