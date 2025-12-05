// src/components/datastore-summary-cards.tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HardDrive, AlertTriangle } from "lucide-react";
import { prometheusApi, type DatastoreUsageMap } from "@/lib/api/prometheus";

const TARGET_DATASTORES = ["HDD1 (1)", "NVME (1)"];

function formatGiB(bytes: number | null | undefined) {
  if (bytes == null || bytes <= 0) return "-";
  const gib = bytes / 1024 / 1024 / 1024;
  return `${gib.toFixed(1)} GiB`;
}

export function DatastoreSummaryCards() {
  const [data, setData] = useState<DatastoreUsageMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await prometheusApi.getDatastoreUsage(TARGET_DATASTORES);

        if (!res.success || !res.data) {
          setError(res.message ?? "Datastore 사용량 조회 실패");
          return;
        }

        setData(res.data);
      } catch (e) {
        console.error("[DatastoreSummaryCards] datastore usage fetch error", e);
        setError("Datastore 사용량 조회 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ⏳ 로딩 상태: Skeleton 카드 2개
  if (loading) {
    return (
      <div className="mt-6 mb-4 grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, idx) => (
          <Skeleton key={idx} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  // ❌ 에러 상태
  if (error) {
    return (
      <div className="mt-6 mb-4">
        <p className="flex items-center gap-2 text-sm text-red-500">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mt-6 mb-4 text-sm text-red-500">
        Datastore 사용량을 불러오지 못했습니다.
      </div>
    );
  }

  // ✅ 정상 데이터 표시
  return (
    <div className="mt-6 mb-4 grid gap-4 md:grid-cols-2">
      {TARGET_DATASTORES.map((name) => {
        const ds = data[name];

        // 해당 이름에 대한 데이터가 없을 때
        if (!ds) {
          return (
            <Card key={name} className="flex items-center gap-3 p-4">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              <div>
                <div className="mb-1 text-xs text-muted-foreground">
                  {name}
                </div>
                <div className="text-sm text-muted-foreground">데이터 없음</div>
              </div>
            </Card>
          );
        }

        const danger = ds.usedPercent >= 80;

        return (
          <Card key={name} className="flex items-center gap-3 p-4">
            <HardDrive
              className={`h-6 w-6 ${
                danger ? "text-red-500" : "text-blue-500"
              }`}
            />
            <div>
              <div className="mb-1 text-xs text-muted-foreground">{name}</div>

              {/* 사용률 강조 */}
              <div className="text-lg font-bold">
                사용률 {ds.usedPercent.toFixed(1)}%
              </div>

              {/* 용량 / 사용량 정보 */}
              <div className="text-xs text-muted-foreground">
                사용 {formatGiB(ds.usedBytes)} / 총{" "}
                {formatGiB(ds.capacityBytes)}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
