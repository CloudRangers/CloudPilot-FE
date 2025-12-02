// lib/apiClient.ts
import axios, { AxiosRequestHeaders } from "axios"

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken")

    if (token) {
      // 헤더 객체를 AxiosRequestHeaders 타입으로 안전하게 준비
      const headers: AxiosRequestHeaders = (config.headers ??
        {}) as AxiosRequestHeaders

      headers.Authorization = `Bearer ${token}`

      config.headers = headers
    }
  }

  return config
})

export default apiClient
