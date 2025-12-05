// src/components/vcenter-vm-table.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowDownUp } from "lucide-react";

import { vcenterApi, LiveVcenterVm } from "@/lib/api/vcenter";
import { prometheusApi, VmMetricSummary } from "@/lib/api/prometheus";

/* -----------------------------
 * 메모리 GB 표기
 * ----------------------------- */
function formatMemoryGiB(gb: number | null | undefined): string {
  if (gb == null) return "-";
  return `${gb} GB`;
}

function formatDiskGiB(gb: number | null | undefined): string {
  if (gb == null) return "-";
  return `${gb} GB`;
}

function getPowerStateBadgeClass(powerState: string) {
  const upper = powerState?.toUpperCase();
  if (upper === "POWERED_ON") {
    return "bg-green-500/10 text-green-600 border-green-500/20";
  }
  if (upper === "POWERED_OFF") {
    return "bg-gray-500/10 text-gray-600 border-gray-500/20";
  }
  return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
}

type SortKey = "name" | "powerState";

interface Props {
  onVmClick?: (vm: LiveVcenterVm) => void;
}

function toPercent(value: number | null | undefined): number | null {
  if (value == null) return null;
  // 0~1 로 오면 퍼센트로 변환, 0~100 이면 그대로
  if (value <= 1) return Math.round(value * 100);
  return Math.round(value);
}

export function VCenterVmTable({ onVmClick }: Props) {
  const [vms, setVms] = useState<LiveVcenterVm[]>([]);
  const [metrics, setMetrics] =
    useState<Record<string, VmMetricSummary> | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);

  /* -----------------------------
   * vCenter 실시간 목록 + Prometheus 메트릭 동시 조회
   * ----------------------------- */
  // src/components/vcenter-vm-table.tsx (useEffect 부분만 변경)
// useEffect(() => {
//   const load = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const teamIdStr =
//         typeof window !== "undefined"
//           ? window.localStorage.getItem("teamId")
//           : null;
//       const teamId = teamIdStr ? Number(teamIdStr) : undefined;

//       const [vmRes, metricRes] = await Promise.all([
//         vcenterApi.getTeamVms(teamId),        // ✅ 우리 팀 vCenter VM
//         prometheusApi.getVmMetrics(teamId),   // ✅ 메트릭도 teamId 전달
//       ]);

//       if (!vmRes.success || !vmRes.data) {
//         setError(vmRes.message ?? "vCenter VM 목록 조회 실패");
//         setVms([]);
//         return;
//       }

//       setVms(vmRes.data);

//       if (metricRes.success && metricRes.data) {
//         setMetrics(metricRes.data);
//       } else {
//         setMetrics(null);
//       }
//     } catch (err) {
//       console.error("[VM Table] load error:", err);
//       setError("vCenter VM/메트릭 조회 중 오류 발생");
//       setVms([]);
//       setMetrics(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   load();
// }, []);
   /* -----------------------------
   * vCenter 실시간 목록 + Prometheus 메트릭 동시 조회
   * ----------------------------- */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [vmRes, metricRes] = await Promise.all([
          vcenterApi.getLiveVms(),
          prometheusApi.getVmMetrics(), // 전체 VM 기준 메트릭
        ]);

        if (!vmRes.success || !vmRes.data) {
          setError(vmRes.message ?? "vCenter VM 목록 조회 실패");
          return;
        }

        setVms(vmRes.data);

        if (metricRes.success && metricRes.data) {
          setMetrics(metricRes.data);
        }
      } catch (err) {
        console.error("[VM Table] load error:", err);
        setError("vCenter VM/메트릭 조회 중 오류 발생");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* -----------------------------
   * 특정 VM의 Prometheus 메트릭 찾기
   * ----------------------------- */
  const getMetric = (vm: LiveVcenterVm) => {
    if (!metrics) return undefined;
    // 우선 이름으로 찾고, 안 나오면 vmId 로도 시도
    return metrics[vm.name] ?? (vm.vmId ? metrics[vm.vmId] : undefined);
  };

  const renderMetricBadge = (vm: LiveVcenterVm) => {
    const m = getMetric(vm);

    // 🔸 hasMetrics 기반으로 처리
    if (!m || m.hasMetrics === false) {
      return (
        <Badge className="px-2 py-0.5 text-xs bg-gray-500/10 text-gray-600 border-gray-500/20">
          메트릭 없음
        </Badge>
      );
    }

    const cpu = toPercent(m.cpuUsage ?? null);
    const mem = toPercent(m.memoryUsage ?? null);
    const label = [cpu != null && `CPU ${cpu}%`, mem != null && `MEM ${mem}%`]
      .filter(Boolean)
      .join(" / ");

    return (
      <Badge className="px-2 py-0.5 text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
        {label || "메트릭 없음"}
      </Badge>
    );
  };

  /* -----------------------------
   * 검색 + 정렬
   * ----------------------------- */
  const filtered = useMemo(() => {
    let data = [...vms];

    if (searchText) {
      const q = searchText.toLowerCase();
      data = data.filter((vm) => vm.name.toLowerCase().includes(q));
    }

    data.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") {
        const res = av.localeCompare(bv);
        return sortAsc ? res : -res;
      }
      return 0;
    });

    return data;
  }, [vms, searchText, sortKey, sortAsc]);

  /* -----------------------------
   * UI 렌더링
   * ----------------------------- */
  if (loading) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">VM 목록 로딩 중...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <p className="text-sm text-red-500">{error}</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">vCenter VM 목록 (실시간)</h3>

        <div className="flex items-center gap-2">
          <Input
            placeholder="VM 검색"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="h-8 w-40 text-xs"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSortAsc((p) => !p)}
          >
            <ArrowDownUp className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>VM 이름</TableHead>
            <TableHead>클러스터</TableHead>
            <TableHead>팀</TableHead>
            <TableHead>vCPU</TableHead>
            <TableHead>Memory(GB)</TableHead>
            <TableHead>Disk(GB)</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>메트릭</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filtered.map((vm, index) => (
            <TableRow
              key={vm.vmId ?? `${vm.name}-${index}`} // 🔹 이름 + index 로 유니크 보장
              onClick={() => onVmClick?.(vm)}
              className={onVmClick ? "cursor-pointer hover:bg-muted/50" : ""}
            >
             <TableCell>{vm.name}</TableCell>
              <TableCell>{vm.clusterName ?? "-"}</TableCell>
              <TableCell>{vm.teamName ?? "-"}</TableCell>
              <TableCell>{vm.cpuCores ?? "-"}</TableCell>
              <TableCell>{formatMemoryGiB(vm.memoryGb)}</TableCell>
              <TableCell>{formatDiskGiB(vm.diskGb)}</TableCell>
              <TableCell>
                <Badge
                  className={`px-2 py-0.5 text-xs ${getPowerStateBadgeClass(
                    vm.powerState
                  )}`}
                >
                  {vm.powerState}
                </Badge>
              </TableCell>
              <TableCell>{renderMetricBadge(vm)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
