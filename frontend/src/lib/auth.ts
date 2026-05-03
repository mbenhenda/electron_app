const API = "http://localhost:8000";

// Access token lives only in memory — wiped on page reload, safe from XSS.
// The refresh token is stored in an httpOnly cookie (not accessible from JS).
let accessToken: string | null = null;

export interface UserPublic {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/** POST /auth/login — stores access token in memory, refresh token set by server as httpOnly cookie */
export async function login(email: string, password: string): Promise<UserPublic> {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).detail ?? "Login failed");
  }
  const { access_token } = await res.json();
  accessToken = access_token;
  return getMe();
}

/**
 * POST /auth/refresh — silently exchange the httpOnly refresh cookie for a new access token.
 * Also rotates the refresh token cookie server-side.
 * Returns true on success, false if the session has expired.
 */
export async function refresh(): Promise<boolean> {
  const res = await fetch(`${API}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    accessToken = null;
    return false;
  }
  const { access_token } = await res.json();
  accessToken = access_token;
  return true;
}

/** POST /auth/logout — revokes the refresh token server-side and clears the cookie */
export async function logout(): Promise<void> {
  await fetch(`${API}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  accessToken = null;
}

/** GET /auth/me — returns the current authenticated user */
export async function getMe(): Promise<UserPublic> {
  const res = await authFetch(`${API}/auth/me`);
  if (!res.ok) throw new Error("Failed to get current user");
  return res.json();
}

/**
 * Authenticated fetch wrapper.
 * Attaches the Bearer token automatically.
 * On 401, attempts a silent token refresh and retries once.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const withAuth = (token: string | null): RequestInit => ({
    ...options,
    credentials: "include",
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  let res = await fetch(url, withAuth(accessToken));

  if (res.status === 401) {
    const ok = await refresh();
    if (ok) {
      res = await fetch(url, withAuth(accessToken));
    }
  }

  return res;
}
