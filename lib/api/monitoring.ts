// src/lib/api/monitoring.ts
import { apiClient } from "./base-client";

/** 공통 API 응답 래퍼 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/** Prometheus 요약 */
export interface PrometheusSummary {
  totalTargets: number;
  upTargets: number;
  downTargets: number;
}

/** 관리자 대시보드 요약 (BE DTO에 맞게 필드 추가) */
export interface AdminOverview {
  dailyUserCount: number;
  dailyUserChange: number;
  systemLoadLevel: "LOW" | "MEDIUM" | "HIGH";
  avgResponseMs: number;
  avgResponseValid: boolean;
  errorCount24h: number;
  errorCountValid: boolean;
}

export const monitoringApi = {
  /**
   * Prometheus up() 요약 정보
   *  - GET /monitoring/prometheus/summary
   */
  getPrometheusSummary: async (): Promise<ApiResponse<PrometheusSummary>> => {
    const res = await apiClient.get<ApiResponse<PrometheusSummary>>(
      "/monitoring/prometheus/summary"   // ✅ /api 제거
    );
    return res.data;
  },

  getAdminOverview: async (): Promise<ApiResponse<AdminOverview>> => {
    const res = await apiClient.get<ApiResponse<AdminOverview>>(
      "/monitor/overview"
    );
    return res.data;
  },
};

