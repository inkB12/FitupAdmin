export type ApiResult<T> = {
  data: T | null;
  error: string | null;
  status?: number;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

type FetchJsonInit = Omit<RequestInit, "body"> & { body?: unknown };

const TOKEN_STORAGE_KEY = "fitup.auth.token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

function buildAuthHeader() {
  const token = getAuthToken();
  if (!token) {
    return undefined;
  }
  if (token.toLowerCase().startsWith("bearer ")) {
    return token;
  }
  return `Bearer ${token}`;
}

async function fetchJson<T>(path: string, init: FetchJsonInit = {}): Promise<T> {
  const { body, headers, ...rest } = init;
  const authorization = buildAuthHeader();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      "Content-Type": "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
      ...(headers ?? {}),
    },
    credentials: "include",
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`${response.status} ${message || response.statusText}`);
  }

  return (await response.json()) as T;
}

async function safeRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<ApiResult<T>> {
  try {
    const data = await fetchJson<T>(path, { method, body });
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export const clientApi = {
  get: <T>(path: string) => safeRequest<T>("GET", path),
  post: <T>(path: string, body?: unknown) => safeRequest<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => safeRequest<T>("PATCH", path, body),
  put: <T>(path: string, body?: unknown) => safeRequest<T>("PUT", path, body),
  delete: <T>(path: string) => safeRequest<T>("DELETE", path),
};
