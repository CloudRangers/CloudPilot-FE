// lib/api/ops.ts
import { apiClient } from "@/lib/api/base-client";

const OPS_PREFIX = "/ops/v1";

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
  label: string;
}

export interface MetricAggregation {
  metricName: string;
  vmId: string;
  average: number;
  min: number;
  max: number;
  current: number;
  dataPointCount: number;
}

export interface RechartsDataResponse {
  vmId: string;
  metricName: string;
  data: TimeSeriesPoint[];
}

export interface AlertRule {
  id: number;
  name: string;
  description?: string;
  metricName: string;
  vmId: string;
  operator: string;
  threshold: number;
  durationSeconds: number;
  severity: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AlertRuleRequest {
  name: string;
  description?: string;
  metricName: string;
  vmId: string;
  operator: string;
  threshold: number;
  durationSeconds: number;
  severity: string;
  enabled: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AnomalyDetectionRequestDto {
  vmId: string;
  metricNames: string[];
  metrics: Record<string, number[]>;
}

export interface AnomalyDetectionResultDto {
  vmId: string;
  anomaly: boolean;
  score: number;
  summary: string;
  explanation?: string;
  severity: string;
}

// 🔹 공통으로 vmId 인코딩
const vmPath = (vmId: string) =>
  `${OPS_PREFIX}/vms/${encodeURIComponent(vmId)}`;

export const opsApi = {
  /** 📊 단일 메트릭 (Recharts 용) */
  getMetricsForRecharts: async (
    vmId: string,
    metricName: string,
    rangeMinutes = 5,
    stepSeconds = 15
  ) => {
    const res = await apiClient.get<ApiResponse<RechartsDataResponse>>(
      `${vmPath(vmId)}/metrics/recharts`,
      {
        params: { metricName, rangeMinutes, stepSeconds },
      }
    );
    return res.data;
  },

  /** 📊 메트릭 통계치 */
  getMetricAggregation: async (
    vmId: string,
    metricName: string,
    rangeMinutes = 5
  ) => {
    const res = await apiClient.get<ApiResponse<MetricAggregation>>(
      `${vmPath(vmId)}/metrics/aggregation`,
      {
        params: { metricName, rangeMinutes },
      }
    );
    return res.data;
  },

  /** 📊 여러 메트릭 한번에 */
  getMultipleMetrics: async (
    vmId: string,
    metricNames: string[],
    rangeMinutes = 5,
    stepSeconds = 15
  ) => {
    const res = await apiClient.get<ApiResponse<any>>(
      `${vmPath(vmId)}/metrics/multiple`,
      {
        params: {
          metricNames: metricNames.join(","),
          rangeMinutes,
          stepSeconds,
        },
      }
    );
    return res.data;
  },

  /** 🚨 알람 규칙 전체 조회 */
  getAlertRules: async () => {
    const res = await apiClient.get<ApiResponse<AlertRule[]>>(
      `${OPS_PREFIX}/alert-rules`
    );
    return res.data;
  },

  /** 🚨 알람 생성 */
  createAlertRule: async (data: AlertRuleRequest) => {
    const res = await apiClient.post<ApiResponse<AlertRule>>(
      `${OPS_PREFIX}/alert-rules`,
      data
    );
    return res.data;
  },

  /** 🚨 알람 업데이트 */
  updateAlertRule: async (id: number, data: AlertRuleRequest) => {
    const res = await apiClient.put<ApiResponse<AlertRule>>(
      `${OPS_PREFIX}/alert-rules/${id}`,
      data
    );
    return res.data;
  },

  /** 🚨 알람 삭제 */
  deleteAlertRule: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<void>>(
      `${OPS_PREFIX}/alert-rules/${id}`
    );
    return res.data;
  },

  /** 🚨 알람 활성/비활성 토글 */
  toggleAlertRule: async (id: number, enabled: boolean) => {
    const res = await apiClient.patch<ApiResponse<AlertRule>>(
      `${OPS_PREFIX}/alert-rules/${id}/toggle`,
      null,
      { params: { enabled } }
    );
    return res.data;
  },

  /** 🚨 VM별 알람 조회 */
  getAlertRulesByVm: async (vmId: string) => {
    const res = await apiClient.get<ApiResponse<AlertRule[]>>(
      `${OPS_PREFIX}/alert-rules/vm/${encodeURIComponent(vmId)}`
    );
    return res.data;
  },

  /** 🤖 AI 이상징후 분석 */
  detectAnomaly: async (payload: AnomalyDetectionRequestDto) => {
    const res = await apiClient.post<
      ApiResponse<AnomalyDetectionResultDto>
    >(`${OPS_PREFIX}/anomaly-detection`, payload);
    return res.data;
  },
};
