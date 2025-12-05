// app/admin/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Cpu, Network, Zap } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PrometheusMonitoring } from "@/components/prometheus-monitoring";
import { GrafanaEmbed } from "@/components/grafana-embed";

import { HostResourceCharts } from "@/components/host-resource-charts";
import { VcenterVmResourceCharts } from "@/components/vcenter-vm-resource-charts";

import { VCenterSummaryCards } from "@/components/vcenter-summary-cards";
import { DatastoreSummaryCards } from "@/components/datastore-summary-cards";
import { PrometheusSummaryCards } from "@/components/prometheus-summary-cards";

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

// 🔹 챗봇 관련
import { Chatbot } from "@/components/chatbot";
import type { ChatMessage } from "@/components/chatbot/chatbot-types";

// --- 운영 모니터링 요약 타입 ---
type AdminOverview = {
  dailyUserCount: number;
  dailyUserChange: number; // %
  systemLoadLevel: string; // "LOW" | "MEDIUM" | "HIGH"
  avgResponseMs: number;
  avgResponseValid: boolean;
  errorCount24h: number;
  errorCountValid: boolean;
};

type RoleCode = "ADMIN" | "HEAD" | "LEADER" | "MEMBER" | null;

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
    "/monitor/overview",
  );

  const body = res.data;

  console.log("[Admin] /monitor/overview raw 응답:", body);

  if (!body.success || !body.data) {
    throw new Error(
      body.message ?? "운영 모니터링 데이터를 불러오지 못했습니다.",
    );
  }

  return body.data;
}

export default function AdminPage() {
  const router = useRouter();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Prometheus Monitoring 섹션 스크롤용 ref
  const metricsSectionRef = useRef<HTMLDivElement | null>(null);

  // ✅ 대시보드 튜토리얼 모달 상태
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // vCenter VM 상세 모달용
  const [selectedVcenterVm, setSelectedVcenterVm] =
    useState<VCenterVmApiVm | null>(null);
  const [isVcenterDetailOpen, setIsVcenterDetailOpen] = useState(false);

  // vCenter VM 실데이터 (이슈 VM / 테이블 공용)
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

  // 🔹 챗봇 상태
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatHasError, setChatHasError] = useState(false);

  // ADMIN 권한 체크
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const userRole = localStorage.getItem("userRole") as RoleCode;

    if (!isLoggedIn || userRole !== "ADMIN") {
      router.push("/login");
      return;
    }

    setIsAuthorized(true);
    setLoading(false);
  }, [router]);

  // --- 운영 모니터링 요약 데이터 로딩 (/monitor/overview)
  useEffect(() => {
    if (!isAuthorized) return;

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
  }, [isAuthorized]);

  // 🔽 상단 Summary → 아래 Prometheus Monitoring 섹션으로 스크롤
  const handleScrollToMonitoring = () => {
    metricsSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // --- vCenter VM 실데이터 로딩 (이슈 VM 섹션 + 테이블 공용)
  useEffect(() => {
    if (!isAuthorized) return;

    const fetchVcenterVms = async () => {
      try {
        setVcenterLoading(true);
        setVcenterError(null);

        const teamIdStr = localStorage.getItem("teamId");
        const teamId = teamIdStr ? Number(teamIdStr) : undefined;

        const res = await apiClient.get<ApiResponse<IssueVCenterVm[]>>(
          "/monitor/vcenter/vms",
          teamId != null
            ? {
                params: { teamId },
              }
            : undefined,
        );

        const body = res.data;

        console.log("[Admin] /monitor/vcenter/vms raw 응답:", body);

        if (!body.success || !body.data) {
          setVcenterError(
            body.message ?? "vCenter VM 목록을 불러오지 못했습니다.",
          );
          setVcenterVms([]);
          return;
        }

        let items: IssueVCenterVm[] = body.data;

        // 백업용 teamId 필터
        if (teamId != null) {
          items = items.filter(
            (vm) => vm.teamId != null && Number(vm.teamId) === teamId,
          );
        }

        // 이슈 VM이 위로 오도록 정렬
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
  }, [isAuthorized]);

  // 이슈 VM 필터링 (DOWN이거나 알람이 OK가 아닌 경우)
  const issueVms = vcenterVms.filter(
    (vm) => vm.powerState === "POWERED_OFF" || vm.alarmStatus !== "OK",
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
      vm.name,
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

  // 🔹 챗봇에서 사용자 메시지 보냈을 때 (지금은 상태만 업데이트, 나중에 연동)
  const handleChatSend = async (messageText: string) => {
    if (!messageText.trim()) return;

    setChatMessages((prev) => [
      ...prev,
      {
        text: messageText,
        isBot: false,
      },
    ]);

    // TODO: /ops/chat 같은 곳에 연동
  };

  // 🔥 vSphere AI 오류 분석 SSE 구독 (관리자 전용)
  useEffect(() => {
    if (!isAuthorized) return;

    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
    const trimmedBase = baseUrl.endsWith("/")
      ? baseUrl.slice(0, -1)
      : baseUrl;
    const sseUrl = `${trimmedBase}/sse/admin/vsphere-error`;

    console.log("[Admin SSE] Connecting to", sseUrl);

    const eventSource = new EventSource(sseUrl, {
      withCredentials: true,
    } as EventSourceInit);

    const handleEvent = (event: MessageEvent) => {
      console.log("[Admin SSE] raw event:", event.data);

      try {
        if (!event.data) {
          console.log("[Admin SSE] empty event. ignore.");
          return;
        }

        let parsed: any = JSON.parse(event.data || "{}");

        // 배열이면 첫 번째 요소 추출
        if (Array.isArray(parsed)) {
          parsed = parsed[0] ?? {};
        }

        // 문자열로 온 경우 다시 파싱
        if (typeof parsed === "string") {
          let str = parsed.trim();
          if (str.startsWith("=")) {
            str = str.substring(1);
          }
          try {
            parsed = JSON.parse(str);
          } catch {
            // 파싱 실패 시 그대로 사용
          }
        }

        console.log("[Admin SSE] parsed data:", parsed);

        if (!parsed || Object.keys(parsed).length === 0) {
          console.log("[Admin SSE] empty data. ignore.");
          return;
        }

        if (parsed.message === "EMPTY_BODY_FROM_N8N") {
          console.log("[Admin SSE] empty body from n8n. ignore.");
          return;
        }

        const vmName = parsed.vmName ?? "알 수 없는 VM";
        const eventType = parsed.eventType ?? "";
        const reason = parsed.reason ?? "";
        const actionRequired = parsed.actionRequired ?? "";
        const additionalChecks = parsed.additionalChecks ?? "";

        const lines: string[] = [];
        lines.push("🚨 vSphere 알람 분석 결과");

        if (eventType) {
          lines.push(`📌 유형: ${eventType}`);
        }
        lines.push(`🖥️ 대상 VM: ${vmName}`);

        if (reason) {
          lines.push("");
          lines.push("📋 상세 내용:");
          lines.push(reason);
        }
        if (actionRequired) {
          lines.push("");
          lines.push("🔧 조치 필요:");
          lines.push(actionRequired);
        }
        if (additionalChecks) {
          lines.push("");
          lines.push("🔍 추가 점검:");
          lines.push(additionalChecks);
        }

        const text = lines.join("\n");

        if (text && text.trim().length > 0) {
          setChatMessages((prev) => [
            ...prev,
            {
              text,
              isBot: true,
            },
          ]);
          setChatHasError(true);
        }
      } catch (e) {
        console.error("[Admin SSE] 메시지 파싱 실패", e, event.data);
      }
    };

    eventSource.onopen = () => {
      console.log("[Admin SSE] Connected");
    };

    eventSource.onerror = (err) => {
      console.error(
        "[Admin SSE] Error",
        err,
        "readyState=",
        eventSource.readyState,
      );
    };

    eventSource.onmessage = handleEvent;
    eventSource.addEventListener("vsphere-error", handleEvent as any);

    return () => {
      console.log("[Admin SSE] Disconnected");
      eventSource.close();
    };
  }, [isAuthorized]);

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
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="mb-2 text-4xl font-bold">관리자 대시보드</h1>
              <p className="text-muted-foreground">
                vCenter + Prometheus 기반 실시간 리소스 현황 및 VM 모니터링
              </p>
            </div>

            {/* ❓ 대시보드 튜토리얼 버튼 */}
            <Button
              variant="outline"
              size="icon"
              className="mt-1 h-8 w-8 rounded-full text-xs"
              onClick={() => setIsGuideOpen(true)}
            >
              ?
            </Button>
          </div>

          {/* 🔹 Prometheus up() Summary 카드 (클릭 시 아래 모니터링 섹션으로 이동) */}
          <PrometheusSummaryCards onClickGoToMetrics={handleScrollToMonitoring} />

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

          {/* 리소스 모니터링 섹션 (HOST 차트 + Prometheus + Grafana) */}
          <div ref={metricsSectionRef} className="mt-8">
            <Card className="p-6">
              <h2 className="mb-2 text-2xl font-bold">리소스 모니터링</h2>
              <p className="mb-6 text-sm text-muted-foreground">
              </p>

              <Tabs defaultValue="prometheus" className="space-y-6">
               

                <TabsContent value="prometheus">
                  <div className="space-y-6">
                    {/* HOST 리소스 차트 */}
                    <HostResourceCharts hostName="172.16.0.30" />

                    {/* 기존 Prometheus 모니터링 컴포넌트 */}
                    <PrometheusMonitoring />
                  </div>
                </TabsContent>

                <TabsContent value="grafana">
                  <GrafanaEmbed />
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* vCenter VM 전체 목록 (우리 팀 기준 필터) */}
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

            {vcenterLoading && (
              <p className="text-sm text-muted-foreground">
                vCenter VM 목록을 불러오는 중입니다...
              </p>
            )}

            {vcenterError && !vcenterLoading && (
              <p className="text-sm text-red-500">{vcenterError}</p>
            )}

            {!vcenterLoading && !vcenterError && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b bg-muted/40">
                    <tr>
                      <th className="px-3 py-2 text-left">VM 이름</th>
                      <th className="px-3 py-2 text-left">클러스터</th>
                      <th className="px-3 py-2 text-left">팀</th>
                      <th className="px-3 py-2 text-right">vCPU</th>
                      <th className="px-3 py-2 text-right">Memory(GB)</th>
                      <th className="px-3 py-2 text-right">Disk(GB)</th>
                      <th className="px-3 py-2 text-left">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vcenterVms.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-3 py-4 text-center text-xs text-muted-foreground"
                        >
                          현재 이 팀에 할당된 VM 이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      vcenterVms.map((vm) => (
                        <tr
                          key={vm.id}
                          className="cursor-pointer border-b hover:bg-muted/40"
                          onClick={() =>
                            handleVcenterVmClick({
                              vmId: String(vm.id),
                              name: vm.name,
                              powerState: vm.powerState,
                              cpuCores: vm.cpuCores,
                              memoryGb: vm.memoryGb,
                              diskGb: vm.diskGb,
                              alarmStatus: vm.alarmStatus,
                            } as VCenterVmApiVm)
                          }
                        >
                          <td className="px-3 py-2 align-middle font-medium">
                            {vm.name}
                          </td>
                          <td className="px-3 py-2 align-middle text-xs text-muted-foreground">
                            {vm.clusterName ?? "-"}
                          </td>
                          <td className="px-3 py-2 align-middle text-xs text-muted-foreground">
                            {vm.teamName ?? "-"}
                          </td>
                          <td className="px-3 py-2 align-middle text-right">
                            {vm.cpuCores}
                          </td>
                          <td className="px-3 py-2 align-middle text-right">
                            {vm.memoryGb}
                          </td>
                          <td className="px-3 py-2 align-middle text-right">
                            {vm.diskGb}
                          </td>
                          <td className="px-3 py-2 align-middle text-xs">
                            <span
                              className={
                                vm.powerState === "POWERED_ON"
                                  ? "rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-600"
                                  : "rounded-full bg-destructive/10 px-2 py-1 font-medium text-destructive"
                              }
                            >
                              {vm.powerState === "POWERED_ON"
                                ? "UP"
                                : vm.powerState === "POWERED_OFF"
                                ? "DOWN"
                                : vm.powerState}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </section>
      </main>

      <Footer />

      {/* vCenter VM 상세 모달 (상세 모달 + 리소스 차트 둘 다) */}
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
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              {selectedVcenterVm
                ? `${selectedVcenterVm.name} (vCenter) 상세`
                : "vCenter VM 상세"}
            </DialogTitle>
            <DialogDescription>
              vCenter 메타데이터, 리소스 그래프 및 Grafana 대시보드를 통해 상세
              모니터링을 확인하고, AI 이상징후 분석을 실행할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          {selectedVcenterVm && (
            <div className="space-y-4 text-sm">
              {/* 메타 정보 카드 */}
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
                  {selectedVcenterVm.cpuCores ?? "-"}
                </p>
                <p>
                  <span className="font-medium">메모리: </span>
                  {selectedVcenterVm.memoryGb != null
                    ? `${selectedVcenterVm.memoryGb} GB`
                    : "N/A"}
                </p>
              </Card>

              {/* 액션 버튼들 */}
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

              {/* 🔹 vCenter VM 리소스 차트 (HOST랑 별개, VM 단위 그래프) */}
              <VcenterVmResourceCharts vmName={selectedVcenterVm.name} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 🔹 대시보드 가이드 모달 (간단 버전) */}
      <Dialog open={isGuideOpen} onOpenChange={setIsGuideOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>관리자 대시보드 사용 가이드</DialogTitle>
            <DialogDescription>
              상단 Summary 카드 → 이슈 VM → 리소스 모니터링 탭 → vCenter VM
              테이블 순으로 확인하면서 인프라 상태를 점검할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Prometheus Summary 카드 클릭 시 리소스 모니터링 섹션으로 이동합니다.</p>
            <p>• 이슈 VM 카드에서는 DOWN/경고 상태인 VM을 빠르게 확인할 수 있습니다.</p>
            <p>• vCenter VM 테이블에서 행을 클릭하면 VM 단위 상세 모달이 열립니다.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* 🔹 관리자 전용 vSphere AI 오류 챗봇 */}
      <Chatbot
        messages={chatMessages}
        onSendMessage={handleChatSend}
        hasError={chatHasError}
        onErrorChange={setChatHasError}
      />
    </div>
  );
}
