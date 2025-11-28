// src/lib/api/vcenter.ts
import axios from "axios";

const VCENTER_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const vcenterClient = axios.create({
  baseURL: VCENTER_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// 🔹 BE 요약 응답 DTO랑 1:1로 맞추기
//  totalVms, poweredOn, poweredOff, suspended, unknown
export interface VCenterSummary {
  totalVms: number;
  poweredOn: number;
  poweredOff: number;
  suspended: number;
  unknown: number;
}

// 🔹 VM 리스트는 camelCase 기준 (지금 BE DTO에 맞게)
export interface VCenterVm {
  vmId: string;
  name: string;
  powerState: string;
  cpuCount: number;
  memorySizeMiB: number;
}

export const vcenterApi = {
  getAllVms: async () => {
    const res = await vcenterClient.get<ApiResponse<VCenterVm[]>>(
      "/monitor/vcenter/vms"
    );
    return res.data;
  },

  getSummary: async () => {
    const res = await vcenterClient.get<ApiResponse<VCenterSummary>>(
      "/monitor/vcenter/summary"
    );
    return res.data;
  },
};
