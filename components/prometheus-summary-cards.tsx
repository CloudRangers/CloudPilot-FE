// src/components/prometheus-summary-cards.tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Server } from "lucide-react";
import { monitoringApi, type PrometheusSummary } from "@/lib/api/monitoring";

type SummaryState = PrometheusSummary | null;

interface PrometheusSummaryCardsProps {
  /** 상단 Summary 카드 클릭 시, 아래 메트릭 섹션으로 스크롤하는 콜백 */
  onClickGoToMetrics?: () => void;
}

export function PrometheusSummaryCards({
  onClickGoToMetrics,
}: PrometheusSummaryCardsProps) {
  const [summary, setSummary] = useState<SummaryState>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await monitoringApi.getPrometheusSummary(); // ApiResponse<PrometheusSummary>

        if (!res.success || !res.data) {
          setError(res.message ?? "Prometheus 요약 정보를 불러오지 못했습니다.");
          setSummary(null);
          return;
        }

        setSummary(res.data);
      } catch (e) {
        console.error("[PrometheusSummaryCards] fetch error", e);
        setError("Prometheus 요약 정보 조회 중 오류가 발생했습니다.");
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ⏳ 로딩 스켈레톤
  if (loading) {
    return (
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <Card
            key={idx}
            className="flex flex-col gap-2 p-4 animate-pulse"
          >
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-8 w-16 rounded bg-muted" />
          </Card>
        ))}
      </div>
    );
  }

  // ❌ 에러
  if (error || !summary) {
    return (
      <p className="mb-4 text-sm text-red-500">
        {error ?? "Prometheus Summary 데이터를 불러오지 못했습니다."}
      </p>
    );
  }

  const { totalTargets, upTargets, downTargets } = summary;

  const hasDown = downTargets > 0;

  // 전체 영역 클릭하면 아래 모니터링 섹션으로 스크롤
  const handleClick = () => {
    if (onClickGoToMetrics) {
      onClickGoToMetrics();
    }
  };

  return (
    <div
      className={`mb-4 grid gap-4 md:grid-cols-3 ${
        onClickGoToMetrics ? "cursor-pointer" : ""
      }`}
      onClick={handleClick}
    >
      {/* 전체 타겟 수 */}
      <Card className="flex items-center gap-3 p-4">
        <Server className="h-6 w-6 text-blue-500" />
        <div>
          <div className="mb-1 text-xs text-muted-foreground">
            전체 모니터링 타겟
          </div>
          <div className="text-2xl font-bold">{totalTargets}</div>
        </div>
      </Card>

      {/* UP 타겟 */}
      <Card className="flex items-center gap-3 p-4">
        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
        <div>
          <div className="mb-1 text-xs text-muted-foreground">UP(실행)</div>
          <div className="text-2xl font-bold">{upTargets}</div>
        </div>
      </Card>

      {/* DOWN 타겟 + 주의 뱃지 */}
      <Card
        className={`flex items-center justify-between p-4 ${
          hasDown ? "border-destructive/70 bg-destructive/5" : ""
        }`}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle
            className={`h-6 w-6 ${
              hasDown ? "text-destructive" : "text-yellow-500"
            }`}
          />
          <div>
            <div className="mb-1 text-xs text-muted-foreground">
            </div>
            <div className="text-2xl font-bold">{downTargets}</div>
            DOWN(종료 or 이슈)
          </div>
        </div>

        {hasDown && (
          <span className="rounded-full bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive">
            확인요망
          </span>
        )}
      </Card>
    </div>
  );
}
