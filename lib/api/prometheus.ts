// src/lib/api/prometheus.ts
import axios from "axios";
import type { ApiResponse } from "@/lib/api/vcenter";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const prometheusClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export interface VmMetricSummary {
  vmId: string | null;
  vmName: string;
  cpuUsage: number | null;
  memoryUsage: number | null;
  metricsAvailable: boolean;
}

export const prometheusApi = {
  getVmMetrics: async () => {
    const res = await prometheusClient.get<
      ApiResponse<Record<string, VmMetricSummary>>
    >("/monitor/vcenter/metrics");
    return res.data;
  },
};
