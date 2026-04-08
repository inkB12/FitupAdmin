import { headers } from "next/headers";

export type ApiResult<T> = {
  data: T | null;
  error: string | null;
  status?: number;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

type FetchJsonInit = Omit<RequestInit, "body"> & { body?: unknown };

async function resolveBaseUrl() {
  if (API_BASE_URL) {
    return API_BASE_URL;
  }

  if (typeof window !== "undefined") {
    return "";
  }

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "";
}

export async function fetchJson<T>(
  path: string,
  init: FetchJsonInit = {}
): Promise<T> {
  const baseUrl = await resolveBaseUrl();
  const { body, headers: requestHeaders, ...rest } = init;
  const response = await fetch(`${baseUrl}${path}`, {
    ...rest,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      "Content-Type": "application/json",
      ...(requestHeaders ?? {}),
    },
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`${response.status} ${message || response.statusText}`);
  }

  return (await response.json()) as T;
}

export async function safeGet<T>(path: string): Promise<ApiResult<T>> {
  try {
    const data = await fetchJson<T>(path, { method: "GET" });
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function safePost<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const data = await fetchJson<T>(path, { method: "POST", body });
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function safePatch<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const data = await fetchJson<T>(path, { method: "PATCH", body });
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function safePut<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const data = await fetchJson<T>(path, { method: "PUT", body });
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function safeDelete<T>(path: string): Promise<ApiResult<T>> {
  try {
    const data = await fetchJson<T>(path, { method: "DELETE" });
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export const api = {
  login: (payload: { email: string; password: string }) =>
    safePost<unknown>("/auth/login", payload),

  getAccounts: () => safeGet<unknown>("/api/admin/accounts"),
  getAccountById: (id: string) => safeGet<unknown>(`/api/admin/accounts/${id}`),
  banAccount: (id: string) => safePatch<unknown>(`/api/admin/accounts/${id}/ban`),
  unbanAccount: (id: string) => safePatch<unknown>(`/api/admin/accounts/${id}/unban`),
  updateAccountStatus: (id: string, status: string) =>
    safePatch<unknown>(`/api/admin/accounts/${id}/status`, { status }),

  getBookings: () => safeGet<unknown>("/api/Booking/admin/bookings"),
  forceCancelBooking: (bookingId: string) =>
    safePatch<unknown>(`/api/Booking/${bookingId}/force-cancel`),

  getConversionRates: () => safeGet<unknown>("/api/conversion-rates"),
  getConversionRateById: (id: string) =>
    safeGet<unknown>(`/api/conversion-rates/${id}`),
  updateConversionRate: (id: string, payload: unknown) =>
    safePut<unknown>(`/api/conversion-rates/${id}`, payload),

  getDashboard: () => safeGet<unknown>("/api/DashBoard"),

  getWorkoutTypes: () => safeGet<unknown>("/api/workout-types"),
  createWorkoutType: (payload: unknown) =>
    safePost<unknown>("/api/workout-types", payload),
  updateWorkoutType: (id: string, payload: unknown) =>
    safePut<unknown>(`/api/workout-types/${id}`, payload),
  deleteWorkoutType: (id: string) =>
    safeDelete<unknown>(`/api/workout-types/${id}`),

  getWorkouts: () => safeGet<unknown>("/api/workouts"),
  createWorkout: (payload: unknown) => safePost<unknown>("/api/workouts", payload),
  updateWorkout: (id: string, payload: unknown) =>
    safePut<unknown>(`/api/workouts/${id}`, payload),
  deleteWorkout: (id: string) =>
    safeDelete<unknown>(`/api/workouts/${id}`),
};
