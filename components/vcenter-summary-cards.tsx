// src/components/vcenter-summary-cards.tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { vcenterApi, VCenterSummary } from "@/lib/api/vcenter";
import { Cpu, Power, PowerOff, AlertTriangle } from "lucide-react";

const defaultSummary: VCenterSummary = {
  totalVms: 0,
  poweredOn: 0,
  poweredOff: 0,
  suspended: 0,
  unknown: 0,
};

// NaN / null / undefined 방어용 헬퍼
const safe = (v: number | null | undefined): number =>
  typeof v === "number" && !Number.isNaN(v) ? v : 0;

export function VCenterSummaryCards() {
  const [summary, setSummary] = useState<VCenterSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await vcenterApi.getSummary(); // ApiResponse<VCenterSummary>

        // ✅ BE에서 success=false로 온 경우만 에러로
        if (!res.success) {
          setError(res.message ?? "vCenter 요약 정보 조회 실패");
          setSummary(null);
          return;
        }

        // ✅ data가 없으면 기본값(전부 0)
        setSummary(res.data ?? defaultSummary);
      } catch (err) {
        console.error("[Summary] fetch error:", err);
        setError("vCenter 요약 정보 조회 중 오류 발생");
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx} className="p-4 flex flex-col gap-2 animate-pulse">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-8 w-16 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  if (error || !summary) {
    return (
      <p className="text-sm text-red-500 mb-4">
        {error ?? "Summary 데이터를 불러오지 못했습니다."}
      </p>
    );
  }

  const { totalVms, poweredOn, poweredOff, suspended, unknown } = summary;

  // ✅ 안전한 숫자 변환
  const total = safe(totalVms);
  const on = safe(poweredOn);
  const off = safe(poweredOff);
  const susp = safe(suspended);
  const unk = safe(unknown);
  const other = susp + unk;

  return (
    <div className="grid gap-4 md:grid-cols-4 mb-8">
      <Card className="p-4 flex items-center gap-3">
        <Cpu className="h-6 w-6 text-blue-500" />
        <div>
          <div className="text-xs text-muted-foreground mb-1">총 VM 수</div>
          <div className="text-2xl font-bold">{total}</div>
        </div>
      </Card>

      <Card className="p-4 flex items-center gap-3">
        <Power className="h-6 w-6 text-green-500" />
        <div>
          <div className="text-xs text-muted-foreground mb-1">실행 중</div>
          <div className="text-2xl font-bold">{on}</div>
        </div>
      </Card>

      <Card className="p-4 flex items-center gap-3">
        <PowerOff className="h-6 w-6 text-orange-500" />
        <div>
          <div className="text-xs text-muted-foreground mb-1">전원 꺼짐</div>
          <div className="text-2xl font-bold">{off}</div>
        </div>
      </Card>

      <Card className="p-4 flex items-center gap-3">
        <AlertTriangle className="h-6 w-6 text-yellow-500" />
        <div>
          <div className="text-xs text-muted-foreground mb-1">기타 상태</div>
          <div className="text-2xl font-bold">{other}</div>
        </div>
      </Card>
    </div>
  );
}
