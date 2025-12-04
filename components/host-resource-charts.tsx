// src/components/host-resource-charts.tsx
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

type HostResourceChartResponse = {
    hostName: string;
    cpuSeries: ChartPoint[];
    memorySeries: ChartPoint[];
};

type Props = {
    hostName: string;       // 예: "172.16.0.30" (vmware_exporter host_name)
    rangeMinutes?: number;  // 기본 60분
    stepSeconds?: number;   // 기본 60초
};

export function HostResourceCharts({
                                       hostName,
                                       rangeMinutes = 60,
                                       stepSeconds = 60,
                                   }: Props) {
    const [data, setData] = useState<HostResourceChartResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const res = await apiClient.get<
                    ApiResponse<HostResourceChartResponse>
                >(
                    `/monitor/prometheus/hosts/${encodeURIComponent(
                        hostName,
                    )}/resources`,
                    {
                        params: {
                            rangeMinutes,
                            stepSeconds,
                        },
                    },
                );

                const body = res.data;

                if (!body.success || !body.data) {
                    throw new Error("invalid response");
                }

                setData(body.data);
            } catch (e) {
                console.error("[HostResourceCharts] fetch error", e);
                setError("호스트 리소스 메트릭을 불러오지 못했습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [hostName, rangeMinutes, stepSeconds]);

    const cpuSeries = data?.cpuSeries ?? [];
    const memorySeries = data?.memorySeries ?? [];

    return (
        <div className="space-y-3">
            {/* 타이틀 / 설명 */}
            <div className="flex items-baseline justify-between">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold">
                        vSphere 호스트 리소스 사용률
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        대상 호스트:{" "}
                        <span className="font-mono">{hostName}</span> · 최근{" "}
                        {rangeMinutes}분 기준
                    </p>
                </div>
                {loading && (
                    <p className="text-xs text-muted-foreground">
                        메트릭 조회 중...
                    </p>
                )}
            </div>

            {/* 에러 메시지 */}
            {error && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{error}</span>
                </div>
            )}

            {/* 🔹 여기서부터가 진짜: 좌측 CPU, 우측 메모리 그래프 */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* 왼쪽: CPU 그래프 */}
                <Card className="p-3">
                    <div className="mb-2 flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-primary" />
                        <p className="text-xs font-semibold text-muted-foreground">
                            호스트 CPU 사용률 (%)
                        </p>
                    </div>

                    {cpuSeries.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                            표시할 CPU 데이터가 없습니다.
                        </p>
                    ) : (
                        <div className="h-56">
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
                                        formatter={(value: number) =>
                                            `${value.toFixed(1)} %`
                                        }
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

                {/* 오른쪽: 메모리 그래프 */}
                <Card className="p-3">
                    <div className="mb-2 flex items-center gap-2">
                        <MemoryStick className="h-4 w-4 text-primary" />
                        <p className="text-xs font-semibold text-muted-foreground">
                            호스트 메모리 사용률 (%)
                        </p>
                    </div>

                    {memorySeries.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                            표시할 메모리 데이터가 없습니다.
                        </p>
                    ) : (
                        <div className="h-56">
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
                                        formatter={(value: number) =>
                                            `${value.toFixed(1)} %`
                                        }
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
