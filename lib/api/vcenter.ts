// src/lib/api/vcenter.ts
import { apiClient } from "./base-client";

/* 공통 API 응답 래퍼 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/* Summary는 안 쓰지만 그대로 둬도 됨 */
export interface VCenterSummary {
  totalVms: number;
  poweredOn: number;
  poweredOff: number;
  suspended: number;
  unknown: number;
}

/* vCenter + DB 공용 VM DTO */
export interface LiveVcenterVm {
  vmId?: string | null; // vCenter "vm-123" 같은 ID (지금은 안 써도 OK)

  name: string;
  powerState: string;

  cpuCores: number | null;
  memoryGb: number | null;
  diskGb: number | null;

  alarmStatus: string;

  teamId?: number | null;
  teamName?: string | null;
  clusterName?: string | null;
  // createdAt?: string | null;
}

export const vcenterApi = {
  async getSummary() {
    const res = await apiClient.get<ApiResponse<VCenterSummary>>(
      "/monitoring/prometheus/summary"
    );
    return res.data;
  },

  /** ✅ 우리 팀 기준 vCenter VM (실시간 + DB 매핑) */
  async getTeamVms(teamId?: number) {
    const res = await apiClient.get<ApiResponse<LiveVcenterVm[]>>(
      "/monitor/vcenter/vms",
      teamId != null
        ? {
            params: { teamId },
          }
        : undefined
    );
    return res.data;
  },

  /** 원하면 전체 실시간 raw */
  async getLiveVms(teamId?: number) {
    const res = await apiClient.get<ApiResponse<LiveVcenterVm[]>>(
      "/monitor/vcenter/live-vms",
      teamId != null
        ? {
            params: { teamId },
          }
        : undefined
    );
    return res.data;
  },
};
