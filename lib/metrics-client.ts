// lib/api/metrics-client.ts
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export type RechartsPoint = {
  timestamp: string;
  value: number;
};

export type RechartsDataResponse = {
  vmId: string;
  metricName: string;
  data: RechartsPoint[];
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export async function fetchVmMetricRecharts(
  vmId: string,
  metricName: string,
  rangeMinutes = 60,
  stepSeconds = 60
): Promise<RechartsDataResponse> {
  const url = `${BASE_URL}/ops/v1/vms/${encodeURIComponent(
    vmId
  )}/metrics/recharts?metricName=${encodeURIComponent(
    metricName
  )}&rangeMinutes=${rangeMinutes}&stepSeconds=${stepSeconds}`;

  const res = await fetch(url, {
    // 세션/쿠키 쓰면 include, 아니면 omit
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Metrics API 실패: ${res.status}`);
  }

  const json = (await res.json()) as ApiResponse<RechartsDataResponse>;
  if (!json.success) {
    throw new Error(json.message ?? "Metrics API 실패");
  }
  return json.data;
}
