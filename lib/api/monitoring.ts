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
  getPrometheusSummary: async () => {
    const res = await apiClient.get<ApiResponse<PrometheusSummary>>(
      "/api/monitoring/prometheus/summary",
    );
    return res.data;
  },
};
