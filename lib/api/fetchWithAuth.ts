"use client";

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      const res = await fetch("/api/backend/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) return false;

      const json = await res.json().catch(() => null);
      return json?.success === true;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  authOptions: { redirectOnFail: boolean } = { redirectOnFail: true }
) {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
  });

  // 🍀 401 또는 403이 아니면 정상 응답으로 간주
  if (res.status !== 401 && res.status !== 403) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  // 🔥 401 또는 403 → refresh 진행
  const refreshed = await tryRefreshToken();

  if (!refreshed) {
    if (
      authOptions.redirectOnFail &&
      typeof window !== "undefined" &&
      window.location.pathname !== "/login"
    ) {
      window.location.href = "/login";
    }
    throw new Error("UNAUTHORIZED_TOKEN_REFRESH_FAILED");
  }

  // 🔁 retry
  const retry = await fetch(url, {
    ...options,
    credentials: "include",
  });

  if (retry.status === 401) {
    if (
      authOptions.redirectOnFail &&
      typeof window !== "undefined" &&
      window.location.pathname !== "/login"
    ) {
      window.location.href = "/login";
    }
    throw new Error("UNAUTHORIZED_AFTER_REFRESH");
  }

  try {
    return await retry.json();
  } catch {
    return null;
  }
}
