// src/lib/api/base-client.ts
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios"

// ✅ 공통 API 응답 타입
export interface ApiResponse<T> {
  success?: boolean
  data: T
  message?: string
  code?: string | number
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"

// =======================
// axios 인스턴스
// =======================
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
})

// =======================
// Request Interceptor
// =======================
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

// =======================
// Response Interceptor
// =======================

let isRefreshing = false
let pendingQueue: Array<(tokenRefreshed: boolean) => void> = []

apiClient.interceptors.response.use(
  // ✅ 이제 다시 AxiosResponse 전체를 그대로 돌려줌
  (response: AxiosResponse) => response,

  async (error: AxiosError) => {
    const originalRequest: any = error.config
    const status = error.response?.status

    // 🔒 refresh 요청 자체가 실패한 경우는 여기서 바로 종료 (무한 루프 방지)
    const isRefreshRequest =
      originalRequest?.url?.includes("/auth/refresh") ?? false

    if (isRefreshRequest) {
      return Promise.reject(error)
    }

    // ⛔ 이미 한 번 재시도한 요청이면 더 이상 refresh 안 함
    if (originalRequest?._retry) {
      return Promise.reject(error)
    }

    // ❗ 401/403이 아닌 에러는 refresh 대상이 아님
    if (status !== 401 && status !== 403) {
      return Promise.reject(error)
    }

    // 여기부터는 401 또는 403 → access token 문제로 보고 refresh 시도

    if (isRefreshing) {
      // 이미 다른 요청이 refresh 중이면 큐에 넣었다가 성공 후 재요청
      return new Promise((resolve, reject) => {
        pendingQueue.push((tokenRefreshed) => {
          if (tokenRefreshed) {
            resolve(apiClient(originalRequest))
          } else {
            reject(error)
          }
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      // 🔁 refresh_token 쿠키 기반으로 access_token 재발급
      await apiClient.post<ApiResponse<void>>("/auth/refresh", null, {
        withCredentials: true,
      })

      isRefreshing = false
      pendingQueue.forEach((cb) => cb(true))
      pendingQueue = []

      // 🔁 새 access_token 쿠키로 원래 요청 재시도
      return apiClient(originalRequest)
    } catch (refreshErr) {
      isRefreshing = false
      pendingQueue.forEach((cb) => cb(false))
      pendingQueue = []

      if (typeof window !== "undefined") {
        // 로그인 정보 정리
        localStorage.removeItem("cloudpilot:user")
        localStorage.removeItem("isLoggedIn")
        localStorage.removeItem("userRole")
        localStorage.removeItem("teamId")
      }

      return Promise.reject(refreshErr)
    }
  }
)
