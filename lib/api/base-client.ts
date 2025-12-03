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

// ✅ 환경 변수 기반 Base URL
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"

// ✅ axios 인스턴스
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ★ JWT 쿠키 포함
  headers: {
    "Content-Type": "application/json",
  },
})

/**
 * 요청 인터셉터
 * - 필요하면 여기서 Authorization 헤더 추가 가능
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 예: access token을 헤더로 넣고 싶으면 이런 식으로
    // const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
    // if (token && config.headers) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// =======================
// 🔁 401 처리 + 자동 refresh 로직
// =======================

let isRefreshing = false
let pendingQueue: Array<(tokenRefreshed: boolean) => void> = []

/**
 * 응답 인터셉터
 * - 401이면 /auth/refresh 호출해서 토큰 재발급
 * - 동시에 들어온 401 요청들은 큐에 넣어두었다가,
 *   refresh 끝난 뒤 한 번에 재시도
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest: any = error.config

    // 401이 아니거나 이미 재시도한 요청이면 그대로 에러 반환
    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error)
    }

    // 이미 다른 요청이 refresh 중이면 큐에 넣고 기다렸다가 재시도
    if (isRefreshing) {
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

    // 여기서부터는 내가 refresh를 담당
    originalRequest._retry = true
    isRefreshing = true

    try {
      // 🔥 /auth/refresh 호출 (refresh_token 쿠키 사용)
      await apiClient.post<ApiResponse<void>>("/auth/refresh", null, {
        withCredentials: true,
      })

      isRefreshing = false
      pendingQueue.forEach((cb) => cb(true))
      pendingQueue = []

      // 새 access_token 쿠키로 원래 요청 다시 실행
      return apiClient(originalRequest)
    } catch (refreshErr) {
      isRefreshing = false
      pendingQueue.forEach((cb) => cb(false))
      pendingQueue = []

      if (typeof window !== "undefined") {
        localStorage.removeItem("cloudpilot:user")
      }

      return Promise.reject(refreshErr)
    }
  }
)


