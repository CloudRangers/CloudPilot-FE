"use client";

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * AccessToken 재발급 함수
 */
async function tryRefreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;

  // async promise executor 제거
  refreshPromise = (async () => {
    try {
      const res = await fetch("/api/backend/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      const json = await res.json().catch(() => null);
      return json?.success === true;
    } catch (e) {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * 인증된 Fetch
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  let isRetry = false;

  let res = await fetch(url, {
    ...options,
    credentials: "include",
  });

  // ---- 401 : AccessToken 만료 ----
  if (res.status === 401) {
    if (isRetry) {
      // 이미 retry했던 요청이면 무한루프 방지
      throw new Error("UNAUTHORIZED_AFTER_REFRESH");
    }

    console.warn("⚠️ Access Token expired → Refreshing...");

    const ok = await tryRefreshToken();

    if (!ok) {
      console.error("❌ Refresh failed → Throwing error");
      throw new Error("UNAUTHORIZED_TOKEN_REFRESH_FAILED");
    }

    console.log("🔄 Refresh success → retry original request");

    // retry 플래그 ON
    isRetry = true;

    const retryRes = await fetch(url, {
      ...options,
      credentials: "include",
    });

    if (retryRes.status === 401) {
      throw new Error("UNAUTHORIZED_AFTER_REFRESH");
    }

    return retryRes;
  }

  // ---- 403 : 권한 없음 ----
  if (res.status === 403) {
    console.warn("🚫 403 Forbidden");
  }

  return res;
}
