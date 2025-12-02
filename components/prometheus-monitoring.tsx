// src/components/prometheus-monitoring.tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { RefreshCw, Settings } from "lucide-react";

import { monitoringApi } from "@/lib/api/monitoring";
import { opsApi } from "@/lib/api/ops";

interface MetricData {
  timestamp: string;
  value: number;
}

interface WeeklyUsageData {
  day: string;
  usage: number;
  cost: number;
  users: number;
}

interface CombinedVmMetricPoint {
  timestamp: string;
  cpu: number | null;
  memory: number | null;
}

const VM_TARGETS = [
  { id: "172.16.5.112:9100", name: "worker-node1 (112)" },
  { id: "172.16.5.117:9100", name: "worker-node2 (117)" },
] as const;

export function PrometheusMonitoring() {
  const [prometheusUrl, setPrometheusUrl] = useState("http://localhost:9090");
  const [isConfigured, setIsConfigured] = useState(false);

  const [cpuData, setCpuData] = useState<MetricData[]>([]);
  const [memoryData, setMemoryData] = useState<MetricData[]>([]);
  const [vmCharts, setVmCharts] = useState<
    Record<string, CombinedVmMetricPoint[]>
  >({});
  const [weeklyData, setWeeklyData] = useState<WeeklyUsageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 주간 mock 데이터
  useEffect(() => {
    const days = ["월", "화", "수", "목", "금", "토", "일"];
    setWeeklyData(
      days.map((day) => ({
        day,
        usage: Math.floor(Math.random() * 500 + 300),
        cost: Math.floor(Math.random() * 50000 + 30000),
        users: Math.floor(Math.random() * 500 + 800),
      }))
    );
  }, []);

  // summary 기반 서비스 가용률
  const fetchSummaryMetrics = async () => {
    const body = await monitoringApi.getPrometheusSummary();

    if (!body.success) {
      throw new Error(body.message || "Prometheus 요약 메트릭 조회 실패");
    }

    const { totalTargets, upTargets, downTargets } = body.data;
    const nowLabel = new Date().toLocaleTimeString();

    const upRate = totalTargets > 0 ? (upTargets / totalTargets) * 100 : 0;
    const downRate = totalTargets > 0 ? (downTargets / totalTargets) * 100 : 0;

    setCpuData((prev) => [
      ...prev.slice(-29),
      { timestamp: nowLabel, value: Number(upRate.toFixed(2)) },
    ]);
    setMemoryData((prev) => [
      ...prev.slice(-29),
      { timestamp: nowLabel, value: Number(downRate.toFixed(2)) },
    ]);
  };

  const fetchVmRecharts = async (
    vmId: string,
    metricName: "vm_cpu_usage_percent" | "vm_memory_usage_percent",
    rangeMinutes = 60,
    stepSeconds = 60
  ) => {
    const body = await opsApi.getMetricsForRecharts(
      vmId,
      metricName,
      rangeMinutes,
      stepSeconds
    );

    if (!body.success) {
      throw new Error(body.message || `VM 메트릭 조회 실패: ${metricName}`);
    }

    return body.data.data;
  };

  const fetchVmCharts = async () => {
    const result: Record<string, CombinedVmMetricPoint[]> = {};

    for (const vm of VM_TARGETS) {
      try {
        const [cpuSeries, memSeries] = await Promise.all([
          fetchVmRecharts(vm.id, "vm_cpu_usage_percent"),
          fetchVmRecharts(vm.id, "vm_memory_usage_percent"),
        ]);

        const length = Math.min(cpuSeries.length, memSeries.length);
        const merged: CombinedVmMetricPoint[] = [];

        for (let i = 0; i < length; i++) {
          merged.push({
            timestamp: cpuSeries[i].timestamp,
            cpu: cpuSeries[i].value,
            memory: memSeries[i].value,
          });
        }

        result[vm.id] = merged;
      } catch (e) {
        console.error(`VM 차트 데이터 조회 실패: ${vm.id}`, e);
        result[vm.id] = [];
      }
    }

    setVmCharts(result);
  };

  const fetchAllMetrics = async () => {
    setLoading(true);
    setError(null);

    try {
      await fetchSummaryMetrics();
      await fetchVmCharts();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isConfigured) return;

    fetchAllMetrics();
    const interval = setInterval(fetchAllMetrics, 30000);
    return () => clearInterval(interval);
  }, [isConfigured]);

  const handleConnect = () => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setIsConfigured(true);
      setLoading(false);
    }, 500);
  };

  // === 초기 설정 화면 ===
  if (!isConfigured) {
    return (
      <Card className="p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Prometheus 연동 설정</h2>
            <p className="text-muted-foreground">
              Prometheus 서버 URL은 백엔드에서 관리되며, 연결 후 실시간
              서비스 가용률 및 VM 메트릭 데이터를 가져옵니다.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prometheus-url">Prometheus URL (표시용)</Label>
              <Input
                id="prometheus-url"
                type="text"
                placeholder="http://localhost:9090"
                value={prometheusUrl}
                onChange={(e) => setPrometheusUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                실제 연결은 백엔드{" "}
                <code>monitoring.prometheus.base-url</code> 설정을 사용합니다.
              </p>
            </div>

            <Button onClick={handleConnect} disabled={loading} className="w-full">
              {loading ? "연결 중..." : "Prometheus 연결"}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // === 메인 대시보드 화면 ===
  return (
    <div className="space-y-6">
      {/* 서비스 가용률 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">
              실시간 서비스 가용률 모니터링
            </h2>
            <p className="text-sm text-muted-foreground">
              CloudPilot 백엔드 → Prometheus <code>up</code> 메트릭 → Recharts
              시각화
            </p>
            {error && (
              <p className="text-xs text-red-400 mt-1">에러: {error}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAllMetrics}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {loading ? "불러오는 중..." : "새로고침"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfigured(false)}
            >
              <Settings className="h-4 w-4 mr-2" />
              설정
            </Button>
          </div>
        </div>

        {/* Up 비율 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">
            서비스 가용률 (Up 비율, %)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={cpuData}>
              <defs>
                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="timestamp" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#cpuGradient)"
                name="Up 비율 %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Down 비율 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            장애 비율 (Down 비율, %)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={memoryData}>
              <defs>
                <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="timestamp" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#memoryGradient)"
                name="Down 비율 %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 아래 VM별 리소스/주간 분석 카드는 필요하면 여기 이어서 추가 */}
    </div>
  );
}
