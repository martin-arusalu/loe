/**
 * Auth + authenticated fetch.
 *
 * Mirrors the web `src/lib/auth.ts` API surface so screens are unaware of the
 * storage swap. Tokens live in SecureStore (Keychain / Keystore), the user
 * profile in AsyncStorage. Both are mirrored into an in-memory cache that is
 * hydrated once at startup, which keeps `loadAuthUser()` synchronous like on web.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { API_BASE } from "./constants";

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

let cachedUser: AuthUser | null = null;
let cachedTokens: AuthTokens | null = null;

// The web app used `window.dispatchEvent` for session expiry; RN has no window.
type Listener = () => void;
const sessionExpiredListeners = new Set<Listener>();
const authChangeListeners = new Set<Listener>();

export function onSessionExpired(listener: Listener): () => void {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

function emitSessionExpired(): void {
  sessionExpiredListeners.forEach((l) => l());
}

/** Fires whenever the signed-in user is set or cleared, from any screen. */
export function onAuthChange(listener: Listener): () => void {
  authChangeListeners.add(listener);
  return () => {
    authChangeListeners.delete(listener);
  };
}

function emitAuthChange(): void {
  authChangeListeners.forEach((l) => l());
}

/** Must be awaited once before the first render. */
export async function hydrateAuth(): Promise<void> {
  try {
    const rawUser = await AsyncStorage.getItem(AUTH_KEY);
    cachedUser = rawUser ? (JSON.parse(rawUser) as AuthUser) : null;
  } catch {
    cachedUser = null;
  }
  try {
    const rawTokens = await SecureStore.getItemAsync(TOKENS_KEY);
    cachedTokens = rawTokens ? (JSON.parse(rawTokens) as AuthTokens) : null;
  } catch {
    cachedTokens = null;
  }
}

export function loadAuthUser(): AuthUser | null {
  return cachedUser;
}

export async function saveAuthUser(user: AuthUser): Promise<void> {
  cachedUser = user;
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
  emitAuthChange();
}

export function loadAuthTokens(): AuthTokens | null {
  return cachedTokens;
}

export async function saveAuthTokens(tokens: AuthTokens): Promise<void> {
  cachedTokens = tokens;
  await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(tokens));
}

export async function clearAuthUser(): Promise<void> {
  cachedUser = null;
  cachedTokens = null;
  await AsyncStorage.removeItem(AUTH_KEY);
  await SecureStore.deleteItemAsync(TOKENS_KEY);
  emitAuthChange();
}

let refreshPromise: Promise<AuthTokens | null> | null = null;

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
        await clearAuthUser();
        emitSessionExpired();
      }
      return null;
    }
    const data = await res.json();
    const newTokens: AuthTokens = {
      accessToken: data.accessToken ?? data.access_token,
      refreshToken: data.refreshToken ?? data.refresh_token ??
        tokens.refreshToken,
    };
    await saveAuthTokens(newTokens);
    return newTokens;
  } catch {
    return null;
  }
}

/** fetch wrapper that attaches the Bearer token and retries once after a refresh. */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const makeRequest = (accessToken: string | undefined): Promise<Response> => {
    const headers = new Headers(init.headers);
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    return fetch(`${API_BASE}${path}`, { ...init, headers });
  };

  const tokens = loadAuthTokens();
  let res = await makeRequest(tokens?.accessToken);

  if (res.status === 401 && tokens?.refreshToken) {
    if (!refreshPromise) {
      refreshPromise = refreshTokens().finally(() => {
        refreshPromise = null;
      });
    }
    const newTokens = await refreshPromise;
    if (newTokens) res = await makeRequest(newTokens.accessToken);
  }

  return res;
}

async function exchangeToken(
  path: string,
  body: Record<string, unknown>,
): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
  const data = await res.json();
  const user: AuthUser = data.user ?? data;
  await saveAuthUser(user);
  await saveAuthTokens({
    accessToken: data.accessToken ?? data.access_token,
    refreshToken: data.refreshToken ?? data.refresh_token,
  });
  return user;
}

export function loginWithGoogle(idToken: string): Promise<AuthUser> {
  return exchangeToken("/auth/google", { idToken });
}

/**
 * Required by App Store Guideline 4.8 whenever a third-party login is offered.
 * Blocked on the backend implementing `POST /auth/apple`.
 */
export function loginWithApple(
  identityToken: string,
  fullName?: string,
): Promise<AuthUser> {
  return exchangeToken("/auth/apple", { identityToken, fullName });
}

/** Required by App Store Guideline 5.1.1(v) — in-app account deletion. */
export async function deleteAccount(): Promise<void> {
  const res = await apiFetch("/auth/account", {
    method: "DELETE",
    body: JSON.stringify({ confirmation: "DELETE" }),
  });
  if (!res.ok) throw new Error(`DELETE /auth/account failed: ${res.status}`);
  await clearAuthUser();
}
