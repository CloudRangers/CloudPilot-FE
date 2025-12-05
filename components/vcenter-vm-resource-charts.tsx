"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { AlertTriangle, Cpu, MemoryStick } from "lucide-react";
import { apiClient } from "@/lib/api/base-client";
import type { ApiResponse } from "@/lib/api/monitoring";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type ChartPoint = {
  timestamp: string;
  value: number;
};

// 🔹 /ops/v1/vms/{vmId}/metrics/recharts 응답 형태
type VmMetricRechartsResponse = {
  vmId: string;
  metricName: string;
  data: ChartPoint[];
};

type VmResourceChartResponse = {
  vmName: string;
  cpuSeries: ChartPoint[];
  memorySeries: ChartPoint[];
};

type Props = {
  vmName: string;
  rangeMinutes?: number;
  stepSeconds?: number;
};

export function VcenterVmResourceCharts({
  vmName,
  rangeMinutes = 60,
  stepSeconds = 60,
}: Props) {
  const [data, setData] = useState<VmResourceChartResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vmName) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ 한 방짜리 (/monitor/...) 대신, 정상 동작 중인 recharts API 두 번 호출
        const [cpuRes, memRes] = await Promise.all([
          apiClient.get<ApiResponse<VmMetricRechartsResponse>>(
            `/ops/v1/vms/${encodeURIComponent(
              vmName,
            )}/metrics/recharts`,
            {
              params: {
                metricName: "vm_cpu_usage_percent",
                rangeMinutes,
                stepSeconds,
              },
            },
          ),
          apiClient.get<ApiResponse<VmMetricRechartsResponse>>(
            `/ops/v1/vms/${encodeURIComponent(
              vmName,
            )}/metrics/recharts`,
            {
              params: {
                metricName: "vm_memory_usage_percent",
                rangeMinutes,
                stepSeconds,
              },
            },
          ),
        ]);

        const cpuBody = cpuRes.data;
        const memBody = memRes.data;

        if (
          !cpuBody.success ||
          !cpuBody.data ||
          !Array.isArray(cpuBody.data.data)
        ) {
          throw new Error(cpuBody.message ?? "invalid cpu response");
        }

        if (
          !memBody.success ||
          !memBody.data ||
          !Array.isArray(memBody.data.data)
        ) {
          throw new Error(memBody.message ?? "invalid memory response");
        }

        const cpuSeries = cpuBody.data.data.map((p) => ({
          timestamp: p.timestamp,
          value: p.value, // 이미 % 값 (BE에서 *100 완료)
        }));

        const memorySeries = memBody.data.data.map((p) => ({
          timestamp: p.timestamp,
          value: p.value,
        }));

        const combined: VmResourceChartResponse = {
          vmName,
          cpuSeries,
          memorySeries,
        };

        setData(combined);
      } catch (e) {
        console.error("[VcenterVmResourceCharts] fetch error", e);
        setError("VM 리소스 메트릭을 불러오지 못했습니다.");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [vmName, rangeMinutes, stepSeconds]);

  const cpuSeries = data?.cpuSeries ?? [];
  const memorySeries = data?.memorySeries ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">
            VM 리소스 사용률 (CPU / 메모리)
          </h3>
          <p className="text-[11px] text-muted-foreground">
            대상 VM: <span className="font-mono">{vmName}</span> · 최근{" "}
            {rangeMinutes}분
          </p>
        </div>
        {loading && (
          <p className="text-[11px] text-muted-foreground">
            메트릭 조회 중...
          </p>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* 🔹 CPU / 메모리 그래프를 가로 2열로 배치 */}
      <div className="grid gap-3 md:grid-cols-2">
        {/* CPU 그래프 */}
        <Card className="p-3">
          <div className="mb-2 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold text-muted-foreground">
              CPU 사용률 (%)
            </p>
          </div>

          {cpuSeries.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              표시할 CPU 데이터가 없습니다.
            </p>
          ) : (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cpuSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    minTickGap={16}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(v) => `${Math.round(v)}%`}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(1)} %`}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    dot={false}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* 메모리 그래프 */}
        <Card className="p-3">
          <div className="mb-2 flex items-center gap-2">
            <MemoryStick className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold text-muted-foreground">
              메모리 사용률 (%)
            </p>
          </div>

          {memorySeries.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              표시할 메모리 데이터가 없습니다.
            </p>
          ) : (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={memorySeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    minTickGap={16}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(v) => `${Math.round(v)}%`}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(1)} %`}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    dot={false}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
