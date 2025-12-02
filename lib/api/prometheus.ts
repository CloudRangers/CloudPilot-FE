// src/lib/api/prometheus.ts
import { apiClient } from "@/lib/api/base-client";
import type { ApiResponse } from "@/lib/api/ops";

// vCenter VM 테이블에서 기대하는 메트릭 구조
export interface VmMetricSummary {
  vmName?: string;
  vmId?: string;

  cpuUsage?: number | null;    // 0~1 이거나 0~100
  memoryUsage?: number | null; // 0~1 이거나 0~100

  metricsAvailable?: boolean;
}

// BE가 { "<vmName or vmId>": VmMetricSummary } 형태로 줄 걸 가정
export type VmMetricMap = Record<string, VmMetricSummary>;

export const prometheusApi = {
  // ✅ teamId 옵션 추가
  getVmMetrics: async (teamId?: number) => {
    const res = await apiClient.get<ApiResponse<VmMetricMap>>(
      "/monitor/vcenter/metrics",
      teamId != null ? { params: { teamId } } : undefined,
    );
    return res.data; // { success, data, message }
  },
};
