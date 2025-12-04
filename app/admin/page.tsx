// app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Cpu, Network, Zap } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PrometheusMonitoring } from "@/components/prometheus-monitoring";
import { GrafanaEmbed } from "@/components/grafana-embed";

import { VCenterSummaryCards } from "@/components/vcenter-summary-cards";
import { VCenterVmTable } from "@/components/vcenter-vm-table";
import { DatastoreSummaryCards } from "@/components/datastore-summary-cards";

import { opsApi } from "@/lib/api/ops";
import type { AnomalyDetectionResultDto } from "@/lib/api/ops";
import type { LiveVcenterVm as VCenterVmApiVm } from "@/lib/api/vcenter";

import { apiClient, type ApiResponse } from "@/lib/api/base-client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// --- 운영 모니터링 요약 타입 ---
type AdminOverview = {
  dailyUserCount: number;
  dailyUserChange: number; // %
  systemLoadLevel: string; // "LOW" | "MEDIUM" | "HIGH"
  avgResponseMs: number;
  avgResponseValid: boolean; // ⭐ 추가
  errorCount24h: number;
  errorCountValid: boolean; // ⭐ 추가
};

// vCenter VM 타입 (이슈 VM 섹션용)
type IssueVCenterPowerState = "POWERED_ON" | "POWERED_OFF" | "SUSPENDED";
type IssueVCenterAlarmStatus = "OK" | "WARNING" | "CRITICAL";

type IssueVCenterVm = {
  id: string | number;
  name: string;
  cpuCores: number;
  memoryGb: number;
  diskGb: number;
  osName?: string | null;
  powerState: IssueVCenterPowerState;
  alarmStatus: IssueVCenterAlarmStatus;
  teamId?: number | null;
  teamName?: string | null;
  clusterName?: string | null;
  createdAt: string;
};

/**
 * ✅ 운영 모니터링 요약 데이터를 불러오는 helper
 */
async function fetchOverview(): Promise<AdminOverview> {
  const res = await apiClient.get<ApiResponse<AdminOverview>>(
    "/monitor/overview"
  );

  const body = res.data; // ApiResponse<AdminOverview>

  console.log("[Admin] /monitor/overview raw 응답:", body);

  if (!body.success || !body.data) {
    throw new Error(
      body.message ?? "운영 모니터링 데이터를 불러오지 못했습니다."
    );
  }

  return body.data;
}

export default function AdminPage() {
  const router = useRouter();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  // vCenter VM 상세 모달용
  const [selectedVcenterVm, setSelectedVcenterVm] =
    useState<VCenterVmApiVm | null>(null);
  const [isVcenterDetailOpen, setIsVcenterDetailOpen] = useState(false);

  // vCenter VM 실데이터 (이슈 VM 섹션용)
  const [vcenterVms, setVcenterVms] = useState<IssueVCenterVm[]>([]);
  const [vcenterLoading, setVcenterLoading] = useState(false);
  const [vcenterError, setVcenterError] = useState<string | null>(null);

  // AI 이상징후 분석 상태
  const [anomalyResult, setAnomalyResult] =
    useState<AnomalyDetectionResultDto | null>(null);
  const [anomalyLoading, setAnomalyLoading] = useState(false);
  const [anomalyError, setAnomalyError] = useState<string | null>(null);

  // 운영 모니터링 요약 상태
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // ADMIN 권한 체크
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const userRole = localStorage.getItem("userRole");

    if (!isLoggedIn || userRole !== "ADMIN") {
      router.push("/login");
      return;
    }

    setIsAuthorized(true);
    setLoading(false);
  }, [router]);

  // --- 운영 모니터링 요약 데이터 로딩 (/monitor/overview)
  useEffect(() => {
    const load = async () => {
      try {
        setOverviewLoading(true);
        setOverviewError(null);

        const data = await fetchOverview();
        setOverview(data);
      } catch (e: any) {
        console.warn("failed to load overview", e);
        const msgFromServer =
          e?.response?.data?.message ??
          e?.message ??
          (e?.response?.status === 401
            ? "운영 모니터링 데이터를 보기 위해 로그인이 필요합니다."
            : "운영 모니터링 데이터를 불러오지 못했습니다.");
        setOverviewError(msgFromServer);
      } finally {
        setOverviewLoading(false);
      }
    };

    load();
  }, []);

  // --- vCenter VM 실데이터 로딩 (이슈 VM 섹션용)
  useEffect(() => {
    const fetchVcenterVms = async () => {
      try {
        setVcenterLoading(true);
        setVcenterError(null);

        const res = await apiClient.get<
          ApiResponse<IssueVCenterVm[] | { items: IssueVCenterVm[] }>
        >("/monitor/vcenter/vms");

        const body = res.data;

        console.log("[Admin] /monitor/vcenter/vms raw 응답:", body);

        if (!body.success || !body.data) {
          setVcenterError(
            body.message ?? "vCenter VM 목록을 불러오지 못했습니다."
          );
          setVcenterVms([]);
          return;
        }

        const payload = body.data;
        let items: IssueVCenterVm[] = Array.isArray(payload)
          ? payload
          : payload.items ?? [];

        // 🔹 팀 필터
        const teamIdStr = localStorage.getItem("teamId");
        if (teamIdStr) {
          const myTeamId = Number(teamIdStr);
          items = items.filter(
            (vm) => vm.teamId != null && Number(vm.teamId) === myTeamId
          );
        }

        // 🔹 이슈 VM을 상단으로 올리는 정렬
        items = items.sort((a, b) => {
          const aIssue =
            a.powerState === "POWERED_OFF" || a.alarmStatus !== "OK";
          const bIssue =
            b.powerState === "POWERED_OFF" || b.alarmStatus !== "OK";

          if (aIssue === bIssue) return 0;
          return aIssue ? -1 : 1;
        });

        setVcenterVms(items);
      } catch (e: unknown) {
        console.warn("failed to load vCenter vms", e);
        const err = e as any;
        const msgFromServer =
          err?.response?.data?.message ??
          (err?.response?.status === 401
            ? "vCenter VM 목록을 보기 위해 로그인이 필요합니다."
            : "vCenter VM 목록을 불러오지 못했습니다.");
        setVcenterError(msgFromServer);
      } finally {
        setVcenterLoading(false);
      }
    };

    fetchVcenterVms();
  }, []);

  // 이슈 VM 필터링 (DOWN이거나 알람이 OK가 아닌 경우)
  const issueVms = vcenterVms.filter(
    (vm) => vm.powerState === "POWERED_OFF" || vm.alarmStatus !== "OK"
  );

  // vCenter VM 메모리 GB 포맷
  const formatMemoryGiB = (miB: number) => `${(miB / 1024).toFixed(1)} GB`;

  // vCenter Grafana 링크
  const openVcenterGrafana = (vm: VCenterVmApiVm) => {
    const base =
      process.env.NEXT_PUBLIC_GRAFANA_BASE_URL ?? "http://172.16.5.68:3000";
    const uid =
      process.env.NEXT_PUBLIC_GRAFANA_DASHBOARD_UID ?? "vm-detail";
    const slug =
      process.env.NEXT_PUBLIC_GRAFANA_DASHBOARD_SLUG ?? "vm-detail";

    const url = `${base}/d/${uid}/${slug}?var-instance=${encodeURIComponent(
      vm.name
    )}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  // vCenter 테이블 row 클릭
  const handleVcenterVmClick = (vm: VCenterVmApiVm) => {
    setSelectedVcenterVm(vm);
    setAnomalyResult(null);
    setAnomalyError(null);
    setIsVcenterDetailOpen(true);
  };

  // vCenter VM용 AI 이상징후 분석
  const handleAnalyzeVcenterAnomaly = async () => {
    if (!selectedVcenterVm) return;

    try {
      setAnomalyLoading(true);
      setAnomalyError(null);

      const payload = {
        vmId: selectedVcenterVm.vmId ?? selectedVcenterVm.name,
        metricNames: ["cpu_usage"],
        metrics: {
          cpu_usage: [0.3, 0.7, 0.85, 0.9, 0.88],
        },
      };

      const res = await opsApi.detectAnomaly(payload);
      if (res.success && res.data) {
        setAnomalyResult(res.data);
      } else {
        setAnomalyError("이상징후 분석 실패");
      }
    } catch (e) {
      console.warn("anomaly detection error", e);
      setAnomalyError("이상징후 분석 중 오류가 발생했습니다.");
    } finally {
      setAnomalyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="container px-4 py-12 md:px-6">
          {/* 페이지 타이틀 */}
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold">관리자 대시보드</h1>
            <p className="text-muted-foreground">
              vCenter + Prometheus 기반 실시간 리소스 현황 및 VM 모니터링
            </p>
          </div>

          {/* vCenter Summary 카드 */}
          <VCenterSummaryCards />

          {/* 🔹 Datastore 요약 카드 */}
          <DatastoreSummaryCards />

          {/* 운영 모니터링 요약 카드 + 경고 배너 */}
          <div className="mt-6">
            {overviewLoading && (
              <p className="text-sm text-muted-foreground">
                운영 모니터링 요약 데이터를 불러오는 중입니다...
              </p>
            )}
            {overviewError && (
              <p className="text-sm text-red-500">{overviewError}</p>
            )}

            {overview && !overviewLoading && !overviewError && (
              <>
                {/* 🔔 시스템 경고 배너 (HIGH 또는 에러 존재 시) */}
                {(overview.systemLoadLevel === "HIGH" ||
                  (overview.errorCountValid && overview.errorCount24h > 0)) && (
                  <Card className="mb-4 border-destructive/60 bg-destructive/5 p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <div>
                        <p className="text-sm font-semibold text-destructive">
                          시스템 경고
                        </p>
                        <p className="text-xs text-muted-foreground">
                          시스템 부하 또는 에러가 감지되었습니다. 상세 현황을
                          확인하세요.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* ✅ 기존 4개 카드 */}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {/* 일일 사용자 수 */}
                  <Card className="flex flex-col gap-2 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        일일 사용자 수
                      </span>
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-2xl font-bold">
                      {overview.dailyUserCount.toLocaleString("ko-KR")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      전일 대비{" "}
                      <span
                        className={
                          overview.dailyUserChange >= 0
                            ? "font-semibold text-emerald-600"
                            : "font-semibold text-red-600"
                        }
                      >
                        {overview.dailyUserChange >= 0 ? "+" : ""}
                        {overview.dailyUserChange}%
                      </span>
                    </div>
                  </Card>

                  {/* 시스템 부하 수준 */}
                  <Card className="flex flex-col gap-2 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        시스템 부하 수준
                      </span>
                      <Cpu className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-lg font-semibold">
                      {overview.systemLoadLevel}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      평균 응답 속도{" "}
                      {overview.avgResponseValid
                        ? `${overview.avgResponseMs} ms`
                        : "N/A"}
                    </div>
                  </Card>

                  {/* 평균 응답 시간 */}
                  <Card className="flex flex-col gap-2 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        평균 응답 시간
                      </span>
                      <Network className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-2xl font-bold">
                      {overview.avgResponseValid
                        ? `${overview.avgResponseMs} ms`
                        : "N/A"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Prometheus 기반 최근 구간 평균
                    </div>
                  </Card>

                  {/* 에러 발생 수 */}
                  <Card className="flex flex-col gap-2 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        최근 24시간 에러 수
                      </span>
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="text-2xl font-bold text-destructive">
                      {overview.errorCountValid
                        ? overview.errorCount24h.toLocaleString("ko-KR")
                        : "N/A"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      어플리케이션 / 인프라 에러 집계
                    </div>
                  </Card>
                </div>
              </>
            )}
          </div>

          {/* 이슈 VM 섹션 */}
          <div className="mt-8 space-y-4">
            {vcenterLoading && (
              <p className="text-sm text-muted-foreground">
                vCenter VM 상태를 불러오는 중입니다...
              </p>
            )}
            {vcenterError && (
              <p className="text-sm text-red-500">{vcenterError}</p>
            )}

            {issueVms.length > 0 && (
              <Card className="space-y-4 border-destructive/60 bg-destructive/5 p-6">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <h2 className="text-lg font-semibold text-destructive">
                    이슈 VM 감지
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    총 {issueVms.length}대의 VM에서 DOWN 또는 경고 상태가
                    감지되었습니다.
                  </span>
                </div>

                <div className="space-y-2">
                  {issueVms.map((vm, idx) => (
                    <div
                      key={vm.id ?? `${vm.name}-${idx}`}
                      className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      <div>
                        <div className="font-medium">{vm.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {vm.clusterName ?? "클러스터 미지정"} ·{" "}
                          {vm.teamName ?? "팀 미지정"}
                        </div>
                      </div>
                      <div className="flex flex-col items-end text-xs">
                        <span>
                          CPU {vm.cpuCores} / MEM {vm.memoryGb}GB / DISK{" "}
                          {vm.diskGb}GB
                        </span>
                        <span>OS: {vm.osName ?? "-"}</span>
                        <span className="mt-1">
                          상태:{" "}
                          <span className="font-semibold text-destructive">
                            {vm.powerState === "POWERED_OFF"
                              ? "DOWN"
                              : vm.alarmStatus}
                          </span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Prometheus / Grafana 탭 */}
          <Card className="mt-8 p-6">
            <h2 className="mb-2 text-2xl font-bold">리소스 모니터링</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Prometheus 메트릭 기반 차트와 Grafana 대시보드를 한 화면에서
              전환하며 확인할 수 있습니다.
            </p>

            <Tabs defaultValue="prometheus" className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="prometheus">
                  Prometheus + Recharts
                </TabsTrigger>
                <TabsTrigger value="grafana">Grafana 임베드</TabsTrigger>
              </TabsList>

              <TabsContent value="prometheus">
                <PrometheusMonitoring />
              </TabsContent>

              <TabsContent value="grafana">
                <GrafanaEmbed />
              </TabsContent>
            </Tabs>
          </Card>

          {/* vCenter VM 전체 목록 */}
          <Card className="mt-8 space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">vCenter VM 리소스 현황</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                전체 새로고침
              </Button>
            </div>

            <VCenterVmTable onVmClick={handleVcenterVmClick} />
          </Card>
        </section>
      </main>

      <Footer />

      {/* vCenter VM 상세 모달 */}
      <Dialog
        open={isVcenterDetailOpen}
        onOpenChange={(open) => {
          setIsVcenterDetailOpen(open);
          if (!open) {
            setAnomalyResult(null);
            setAnomalyError(null);
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {selectedVcenterVm
                ? `${selectedVcenterVm.name} (vCenter) 상세`
                : "vCenter VM 상세"}
            </DialogTitle>
            <DialogDescription>
              vCenter 메타데이터와 Grafana 대시보드를 통해 상세 모니터링을
              확인하고, AI 이상징후 분석을 실행할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          {selectedVcenterVm && (
            <div className="space-y-4 text-sm">
              <Card className="space-y-1 p-4">
                <p>
                  <span className="font-medium">VM ID: </span>
                  <span className="font-mono text-xs">
                    {selectedVcenterVm.vmId}
                  </span>
                </p>
                <p>
                  <span className="font-medium">이름: </span>
                  {selectedVcenterVm.name}
                </p>
                <p>
                  <span className="font-medium">전원 상태: </span>
                  {selectedVcenterVm.powerState}
                </p>
                <p>
                  <span className="font-medium">vCPU: </span>
                  {selectedVcenterVm.cpuCount}
                </p>
                <p>
                  <span className="font-medium">메모리: </span>
                  {formatMemoryGiB(selectedVcenterVm.memorySizeMiB)}
                </p>
              </Card>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={handleAnalyzeVcenterAnomaly}
                  disabled={anomalyLoading}
                >
                  {anomalyLoading ? "분석 중..." : "AI 이상징후 분석"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openVcenterGrafana(selectedVcenterVm)}
                >
                  Grafana 상세 대시보드 열기
                </Button>
              </div>

              {anomalyError && (
                <p className="text-xs text-red-500">{anomalyError}</p>
              )}

              {anomalyResult && (
                <Card className="max-h-60 overflow-auto bg-muted p-3 text-xs">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(anomalyResult, null, 2)}
                  </pre>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
