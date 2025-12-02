// src/lib/api/vcenter.ts
import { apiClient } from "./base-client";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// 🔹 BE 요약 응답 DTO랑 1:1로 맞추기
export interface VCenterSummary {
  totalVms: number;
  poweredOn: number;
  poweredOff: number;
  suspended: number;
  unknown: number;
}

// 🔹 VM 리스트 DTO
export interface VCenterVm {
  vmId: string;
  name: string;
  powerState: string;
  cpuCount: number;
  memorySizeMiB: number;
}

export const vcenterApi = {
  // ✅ teamId 옵션 추가
  getAllVms: async (teamId?: number) => {
    const res = await apiClient.get<ApiResponse<VCenterVm[]>>(
      "/monitor/vcenter/vms",
      teamId != null ? { params: { teamId } } : undefined,
    );
    return res.data; // { success, data, message }
  },

  // ✅ teamId 옵션 추가
  getSummary: async (teamId?: number) => {
    const res = await apiClient.get<ApiResponse<VCenterSummary>>(
      "/monitor/vcenter/summary",
      teamId != null ? { params: { teamId } } : undefined,
    );
    return res.data; // { success, data, message }
  },
};
