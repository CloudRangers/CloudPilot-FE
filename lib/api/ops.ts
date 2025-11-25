import axios from 'axios';
import { useAuthStore } from '@/lib/hooks/use-auth';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/ops/v1';

const opsClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

opsClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
}

/** 🔍 이상징후 분석 DTO */
export interface AnomalyDetectionRequestDto {
  vmId: string;
  metricNames: string[];
  metrics: Record<string, number[]>; // ex) { cpu_usage: [0.3, 0.8, ...] }
}

export interface AnomalyDetectionResultDto {
  vmId: string;
  anomaly: boolean;
  score: number;
  summary: string;
  explanation?: string;
  severity: string;
}

/** ✅ ops API 클라이언트 */
export const opsApi = {
  getMetricsForRecharts: async (
    vmId: string,
    metricName: string,
    rangeMinutes: number = 5,
    stepSeconds: number = 15
  ) => {
    const response = await opsClient.get<ApiResponse<RechartsDataResponse>>(
      `/vms/${vmId}/metrics/recharts`,
      {
        params: { metricName, rangeMinutes, stepSeconds },
      }
    );
    return response.data;
  },

  getMetricAggregation: async (
    vmId: string,
    metricName: string,
    rangeMinutes: number = 5
  ) => {
    const response = await opsClient.get<ApiResponse<MetricAggregation>>(
      `/vms/${vmId}/metrics/aggregation`,
      {
        params: { metricName, rangeMinutes },
      }
    );
    return response.data;
  },

  getMultipleMetrics: async (
    vmId: string,
    metricNames: string[],
    rangeMinutes: number = 5,
    stepSeconds: number = 15
  ) => {
    const response = await opsClient.get('/vms/' + vmId + '/metrics/multiple', {
      params: {
        metricNames: metricNames.join(','),
        rangeMinutes,
        stepSeconds,
      },
    });
    return response.data;
  },

  getAlertRules: async () => {
    const response = await opsClient.get<ApiResponse<AlertRule[]>>(
      '/alert-rules'
    );
    return response.data;
  },

  createAlertRule: async (data: AlertRuleRequest) => {
    const response = await opsClient.post<ApiResponse<AlertRule>>(
      '/alert-rules',
      data
    );
    return response.data;
  },

  updateAlertRule: async (id: number, data: AlertRuleRequest) => {
    const response = await opsClient.put<ApiResponse<AlertRule>>(
      `/alert-rules/${id}`,
      data
    );
    return response.data;
  },

  deleteAlertRule: async (id: number) => {
    const response = await opsClient.delete<ApiResponse<void>>(
      `/alert-rules/${id}`
    );
    return response.data;
  },

  toggleAlertRule: async (id: number, enabled: boolean) => {
    const response = await opsClient.patch<ApiResponse<AlertRule>>(
      `/alert-rules/${id}/toggle`,
      null,
      { params: { enabled } }
    );
    return response.data;
  },

  getAlertRulesByVm: async (vmId: string) => {
    const response = await opsClient.get<ApiResponse<AlertRule[]>>(
      `/alert-rules/vm/${vmId}`
    );
    return response.data;
  },

  /** 🔍 AI 이상징후 분석 호출 (BE: /ops/v1/anomaly-detection) */
  detectAnomaly: async (payload: AnomalyDetectionRequestDto) => {
    const response =
      await opsClient.post<ApiResponse<AnomalyDetectionResultDto>>(
        `/anomaly-detection`,
        payload
      );
    return response.data;
  },
};
