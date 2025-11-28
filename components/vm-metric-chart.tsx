"use client";

import { useEffect, useState } from "react";
import {
  opsApi,
  RechartsDataResponse,
  TimeSeriesPoint,
} from "@/lib/api/ops";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface VMMetricChartProps {
  vmId: string;
  metricName: string; // 예: "cpu_usage", "memory_usage" 등 (BE 팀이랑 이름 맞춰야 함)
  title: string;
  unit?: string; // 예: "%", "MiB", "MB/s"
}

export function VMMetricChart({
  vmId,
  metricName,
  title,
  unit,
}: VMMetricChartProps) {
  const [data, setData] = useState<TimeSeriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchMetric = async () => {
      try {
        setLoading(true);
        setError(null);

        // rangeMinutes/stepSeconds는 필요에 따라 조절 가능
        const res = await opsApi.getMetricsForRecharts(
          vmId,
          metricName,
          10, // 최근 10분
          30  // 30초 간격
        );

        if (!res.success) {
          throw new Error("success=false");
        }

        if (!cancelled) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("메트릭 조회 실패", err);
        if (!cancelled) {
          setError("메트릭을 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchMetric();
    return () => {
      cancelled = true;
    };
  }, [vmId, metricName]);

  // Recharts용 데이터 변환
  const chartData = data.map((point) => ({
    time: point.timestamp.slice(11, 19), // "HH:mm:ss" 정도로 잘라서 표시
    value: point.value,
  }));

  return (
    <Card className="h-72">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-56">
        {loading && (
          <p className="text-xs text-muted-foreground">
            {title} 데이터를 불러오는 중입니다...
          </p>
        )}
        {error && (
          <p className="text-xs text-destructive">
            {error}
          </p>
        )}
        {!loading && !error && chartData.length === 0 && (
          <p className="text-xs text-muted-foreground">
            표시할 데이터가 없습니다.
          </p>
        )}
        {!loading && !error && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10 }}
                tickMargin={4}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickMargin={4}
                width={35}
              />
              <Tooltip
                formatter={(value: number) =>
                  unit ? [`${value.toFixed(2)} ${unit}`, title] : [value, title]
                }
              />
              <Line
                type="monotone"
                dataKey="value"
                strokeWidth={2}
                dot={false}
                // 색상은 기본값 사용 (프로젝트 전반 스타일에 따라 조정 가능)
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
