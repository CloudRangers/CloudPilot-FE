// src/lib/api/monitoring.ts
import { apiClient } from "./base-client";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PrometheusSummary {
  totalTargets: number;
  upTargets: number;
  downTargets: number;
}

export const monitoringApi = {
  // ✅ 반환 타입을 명시적으로 ApiResponse<PrometheusSummary>로 지정
  getPrometheusSummary: async (): Promise<ApiResponse<PrometheusSummary>> => {
    const res = await apiClient.get<ApiResponse<PrometheusSummary>>(
      "/api/monitoring/prometheus/summary",
    );
    return res.data;
  },
};
