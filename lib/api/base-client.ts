// src/lib/api/base-client.ts
import axios, { AxiosError, AxiosInstance } from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

let isRefreshing = false;
let pendingQueue: Array<(tokenRefreshed: boolean) => void> = [];

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ★ JWT 쿠키 포함
  headers: {
    "Content-Type": "application/json",
  },
});

// 401 응답 인터셉터 → /auth/refresh 후 재시도
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // 401이 아니거나 이미 재시도한 요청이면 그냥 에러 반환
    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    // 다른 요청이 이미 refresh 중이면 큐에 넣고 기다리기
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((tokenRefreshed) => {
          if (tokenRefreshed) {
            resolve(apiClient(originalRequest));
          } else {
            reject(error);
          }
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // 🔥 /auth/refresh 호출 (refresh_token 쿠키 사용)
      await apiClient.post<ApiResponse<void>>("/auth/refresh", null, {
        withCredentials: true,
      });

      isRefreshing = false;
      pendingQueue.forEach((cb) => cb(true));
      pendingQueue = [];

      // 새 access_token 쿠키로 원래 요청 다시 실행
      return apiClient(originalRequest);
    } catch (refreshErr) {
      isRefreshing = false;
      pendingQueue.forEach((cb) => cb(false));
      pendingQueue = [];

      if (typeof window !== "undefined") {
        localStorage.removeItem("cloudpilot:user");
      }

      return Promise.reject(refreshErr);
    }
  }
);
