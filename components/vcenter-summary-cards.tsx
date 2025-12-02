// src/components/vcenter-summary-cards.tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { vcenterApi, VCenterSummary } from "@/lib/api/vcenter";
import { Cpu, Power, PowerOff, AlertTriangle } from "lucide-react";

interface VCenterSummaryCardsProps {
  teamId?: number | null;
}

export function VCenterSummaryCards({ teamId }: VCenterSummaryCardsProps) {
  const [summary, setSummary] = useState<VCenterSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);

        // 🔹 teamId 있으면 쿼리에 붙여서 호출
        const res = await vcenterApi.getSummary(
          typeof teamId === "number" ? teamId : undefined
        );

        if (!res.success || !res.data) {
          setError("vCenter 요약 정보 조회 실패");
          return;
        }

        setSummary(res.data);
      } catch (e) {
        console.error("vCenter summary fetch error", e);
        setError("vCenter 요약 정보 조회 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [teamId]);

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
      <div className="mb-4 text-sm text-red-500">
        {error ?? "vCenter 요약 정보를 불러오지 못했습니다."}
      </div>
    );
  }

  const { totalVms, poweredOn, poweredOff, suspended, unknown } = summary;
  const otherStates = suspended + unknown;

  return (
    <div className="grid gap-4 md:grid-cols-4 mb-8">
      {/* 총 VM 수 */}
      <Card className="p-4 flex items-center gap-3">
        <Cpu className="h-6 w-6 text-blue-500" />
        <div>
          <div className="text-xs text-muted-foreground mb-1">총 VM 수</div>
          <div className="text-2xl font-bold">{totalVms}</div>
        </div>
      </Card>

      {/* 실행 중 */}
      <Card className="p-4 flex items-center gap-3">
        <Power className="h-6 w-6 text-green-500" />
        <div>
          <div className="text-xs text-muted-foreground mb-1">실행 중</div>
          <div className="text-2xl font-bold">{poweredOn}</div>
        </div>
      </Card>

      {/* 전원 꺼짐 */}
      <Card className="p-4 flex items-center gap-3">
        <PowerOff className="h-6 w-6 text-orange-500" />
        <div>
          <div className="text-xs text-muted-foreground mb-1">전원 꺼짐</div>
          <div className="text-2xl font-bold">{poweredOff}</div>
        </div>
      </Card>

      {/* 기타 상태 (Suspended + Unknown) */}
      <Card className="p-4 flex items-center gap-3">
        <AlertTriangle className="h-6 w-6 text-yellow-500" />
        <div>
          <div className="text-xs text-muted-foreground mb-1">
            기타 상태 (Susp/Unknown)
          </div>
          <div className="text-2xl font-bold">{otherStates}</div>
        </div>
      </Card>
    </div>
  );
}
