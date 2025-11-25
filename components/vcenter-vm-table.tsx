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

import { vcenterApi, VCenterVm } from "@/lib/api/vcenter";
import { prometheusApi, VmMetricSummary } from "@/lib/api/prometheus";

function formatMemoryGiB(miB: number): string {
  if (!miB && miB !== 0) return "-";
  const gib = miB / 1024;
  return `${gib.toFixed(1)} GiB`;
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

// 정렬 키: 이름 / 상태
type SortKey = "name" | "powerState";

// Prometheus 값이 0~1 로 올 수도, 0~100 으로 올 수도 있을 때 안전하게 퍼센트로 바꾸는 헬퍼
function toPercent(value: number | null | undefined): number | null {
  if (value == null) return null;
  // 0~1 범위면 100 곱하고, 그 이상이면 있는 그대로 사용
  if (value <= 1) return Math.round(value * 100);
  return Math.round(value);
}

export function VCenterVmTable() {
  const [vms, setVms] = useState<VCenterVm[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);

  // 🔹 Prometheus 메트릭 (vmName 또는 vmId 를 키로 사용하는 맵)
  const [metrics, setMetrics] =
    useState<Record<string, VmMetricSummary> | null>(null);

  // 🔹 vCenter VM + Prometheus 메트릭 동시에 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [vmRes, metricRes] = await Promise.all([
          vcenterApi.getAllVms(),
          prometheusApi.getVmMetrics(),
        ]);

        if (!vmRes.success) {
          setError("vCenter VM 목록 조회 실패");
          return;
        }

        setVms(vmRes.data);

        if (metricRes.success && metricRes.data) {
          setMetrics(metricRes.data);
        } else {
          setMetrics(null);
        }
      } catch (err) {
        console.error("vCenter VM/메트릭 조회 중 오류:", err);
        setError("vCenter VM/메트릭 조회 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 🔹 특정 VM에 해당하는 Prometheus 메트릭 찾기 (이름 우선, 없으면 vmId)
  const getMetricForVm = (vm: VCenterVm): VmMetricSummary | undefined => {
    if (!metrics) return undefined;

    // BE 가 vmName 을 키로 줄 가능성이 높아서 이름 먼저
    const byName = metrics[vm.name];
    if (byName) return byName;

    // 혹시 vmId 기준으로 올 때 대비해서 fallback
    const byId = metrics[vm.vmId];
    if (byId) return byId;

    return undefined;
  };

  // 🔹 메트릭 뱃지 렌더링
  const renderMetricBadge = (vm: VCenterVm) => {
    const metric = getMetricForVm(vm);

    if (!metrics || !metric || metric.metricsAvailable === false) {
      // 아직 Prometheus 미연동 / 대상 없음
      return (
        <Badge
          variant="outline"
          className="px-2 py-0.5 text-xs bg-gray-500/10 text-gray-600 border-gray-500/20"
        >
          메트릭 미연동
        </Badge>
      );
    }

    const cpu = toPercent(metric.cpuUsage);
    const mem = toPercent(metric.memoryUsage);

    // 값이 하나도 없으면 그냥 "연동됨" 정도만
    if (cpu == null && mem == null) {
      return (
        <Badge
          variant="outline"
          className="px-2 py-0.5 text-xs bg-blue-500/10 text-blue-600 border-blue-500/20"
        >
          메트릭 연동됨
        </Badge>
      );
    }

    const cpuText = cpu != null ? `CPU ${cpu}%` : "";
    const memText = mem != null ? `MEM ${mem}%` : "";
    const label = [cpuText, memText].filter(Boolean).join(" / ");

    return (
      <Badge
        variant="outline"
        className="px-2 py-0.5 text-xs bg-blue-500/10 text-blue-600 border-blue-500/20"
      >
        {label}
      </Badge>
    );
  };

  // 🔎 검색 + 정렬된 VM 리스트
  const filteredSortedVms = useMemo(() => {
    let data = [...vms];

    if (searchText.trim().length > 0) {
      const q = searchText.trim().toLowerCase();
      data = data.filter((vm) => vm.name.toLowerCase().includes(q));
    }

    data.sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];

      if (typeof av === "string" && typeof bv === "string") {
        const res = av.localeCompare(bv);
        return sortAsc ? res : -res;
      }
      return 0;
    });

    return data;
  }, [vms, searchText, sortKey, sortAsc]);

  // 로딩/에러/빈 데이터 처리
  if (loading) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">
          vCenter VM 목록을 불러오는 중입니다...
        </p>
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

  if (!vms.length) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">
          표시할 VM 데이터가 없습니다.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">vCenter VM 목록</h3>
          <p className="text-xs text-muted-foreground">
            CloudPilot 백엔드 /monitor/vcenter/vms + /monitor/vcenter/metrics
            연동
          </p>
        </div>

        {/* 🔍 검색 + 정렬 컨트롤 영역 */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="VM 이름 검색"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="h-8 w-40 text-xs"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSortAsc((prev) => !prev)}
            title={`정렬 기준: ${sortKey === "name" ? "이름" : "상태"}`}
          >
            <ArrowDownUp className="h-3 w-3" />
          </Button>
          <Button
            variant={sortKey === "name" ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setSortKey("name")}
          >
            이름
          </Button>
          <Button
            variant={sortKey === "powerState" ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setSortKey("powerState")}
          >
            상태
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>VM ID</TableHead>
            <TableHead>이름</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>vCPU</TableHead>
            <TableHead>메모리</TableHead>
            <TableHead>메트릭</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSortedVms.map((vm) => (
            <TableRow key={vm.vmId}>
              <TableCell className="font-mono text-xs">{vm.vmId}</TableCell>
              <TableCell>{vm.name}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`px-2 py-0.5 text-xs ${getPowerStateBadgeClass(
                    vm.powerState
                  )}`}
                >
                  {vm.powerState}
                </Badge>
              </TableCell>
              <TableCell>{vm.cpuCount}</TableCell>
              <TableCell>{formatMemoryGiB(vm.memorySizeMiB)}</TableCell>
              <TableCell>{renderMetricBadge(vm)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
