"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Cpu, HardDrive, Network, Zap } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PrometheusMonitoring } from "@/components/prometheus-monitoring";
import { GrafanaEmbed } from "@/components/grafana-embed";

import { HostResourceCharts } from "@/components/host-resource-charts";
import { VcenterVmResourceCharts } from "@/components/vcenter-vm-resource-charts";

import { VCenterSummaryCards } from "@/components/vcenter-summary-cards";
import { VCenterVmTable } from "@/components/vcenter-vm-table";

import { opsApi } from "@/lib/api/ops";
import type { AnomalyDetectionResultDto } from "@/lib/api/ops";

// ✅ vCenter VM 타입 (테이블/상세 모달용)
import type { VCenterVm as VCenterVmApiVm } from "@/lib/api/vcenter";

// ✅ 공통 axios 클라이언트 + ApiResponse 타입
import { apiClient } from "@/lib/api/base-client";
import type { ApiResponse } from "@/lib/api/monitoring";

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

// --- DEMO VM 타입 ---
type VM = {
  name: string;
  cpu: number; // %
  memory: number; // %
  status: "running" | "warning" | "stopped";
  disk?: number;
  network?: number;
  uptime?: string;
};

// --- 운영 모니터링 요약 타입 ---
type AdminOverview = {
  dailyUserCount: number;
  dailyUserChange: number;
  systemLoadLevel: string;
  avgResponseMs: number;
  errorCount24h: number;
};

// vCenter VM 타입 (이슈 VM 섹션용) → 이름 변경해서 충돌 방지
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

type RoleCode = "ADMIN" | "HEAD" | "LEADER" | "MEMBER" | null;

export default function AdminPage() {
  const router = useRouter();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  // DEMO VM 상세 모달용
  const [selectedVM, setSelectedVM] = useState<VM | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // vCenter VM 상세 모달용
  const [selectedVcenterVm, setSelectedVcenterVm] =
      useState<VCenterVmApiVm | null>(null);
  const [isVcenterDetailOpen, setIsVcenterDetailOpen] = useState(false);

  // AI 이상징후 분석 상태 (DEMO VM용)
  const [anomalyResult, setAnomalyResult] =
      useState<AnomalyDetectionResultDto | null>(null);
  const [anomalyLoading, setAnomalyLoading] = useState(false);
  const [anomalyError, setAnomalyError] = useState<string | null>(null);

  // DEMO VM 리스트
  const [vmList, setVmList] = useState<VM[]>([]);
  const [vmLoading, setVmLoading] = useState(false);
  const [vmError, setVmError] = useState<string | null>(null);

  // 운영 모니터링 요약 상태
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // vCenter VM 실데이터 (이슈 VM 섹션용)
  const [vcenterVms, setVcenterVms] = useState<IssueVCenterVm[]>([]);
  const [vcenterLoading, setVcenterLoading] = useState(false);
  const [vcenterError, setVcenterError] = useState<string | null>(null);

  // 🔹 챗봇 상태
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatHasError, setChatHasError] = useState(false);

  const handleViewDetail = (vm: VM) => {
    setSelectedVM(vm);
    setAnomalyResult(null);
    setAnomalyError(null);
    setIsDetailOpen(true);
  };

  // ✅ vCenter 테이블에서 row 클릭했을 때
  const handleVcenterVmClick = (vm: VCenterVmApiVm) => {
    setSelectedVcenterVm(vm);
    setIsVcenterDetailOpen(true);
  };

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

  // 운영 모니터링 요약 데이터 로딩 (axios 사용)
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setOverviewLoading(true);
        setOverviewError(null);

        const res = await apiClient.get<ApiResponse<AdminOverview>>(
            "/monitor/overview"
        );
        const body = res.data;

        console.log("[Admin] /monitor/overview 응답:", body);

        if (!body.success || !body.data) {
          throw new Error("invalid response");
        }

        setOverview(body.data);
      } catch (e) {
        console.error("failed to load overview", e);
        setOverviewError("운영 모니터링 데이터를 불러오지 못했습니다.");
      } finally {
        setOverviewLoading(false);
      }
    };

    if (isAuthorized) {
      fetchOverview();
    }
  }, [isAuthorized]);

  // DEMO VM 목록 로딩
  useEffect(() => {
    const fetchDemoVms = async () => {
      try {
        setVmLoading(true);
        setVmError(null);

        const teamId = localStorage.getItem("teamId");

        type DemoVmDto = {
          name: string;
          cpuUsage?: number | null;
          memoryUsage?: number | null;
        };

        const res = await apiClient.get<
            ApiResponse<DemoVmDto[] | { items: DemoVmDto[] }>
        >("/monitor/vcenter/demo-vms", {
          params: teamId ? { teamId } : undefined,
        });

        const body = res.data;

        if (!body.success) {
          setVmError("DEMO VM 리스트를 불러오지 못했습니다.");
          setVmList([]);
          return;
        }

        // data가 배열일 수도 있고 { items: [] }일 수도 있게 방어
        const raw = body.data as any;
        let items: DemoVmDto[] = [];

        if (Array.isArray(raw)) {
          items = raw;
        } else if (raw && Array.isArray(raw.items)) {
          items = raw.items;
        } else {
          setVmList([]);
          return;
        }

        const vms: VM[] = items.map((item) => {
          const cpuPercent =
              item.cpuUsage != null ? Math.round(item.cpuUsage * 100) : 0;
          const memPercent =
              item.memoryUsage != null ? Math.round(item.memoryUsage * 100) : 0;

          const isWarning = cpuPercent >= 80 || memPercent >= 85;

          return {
            name: item.name,
            cpu: cpuPercent,
            memory: memPercent,
            status: isWarning ? "warning" : "running",
          };
        });

        setVmList(vms);
      } catch (e) {
        console.error("failed to load demo vms", e);
        setVmError("DEMO VM 리스트를 불러오지 못했습니다.");
        setVmList([]);
      } finally {
        setVmLoading(false);
      }
    };

    if (isAuthorized) {
      fetchDemoVms();
    }
  }, [isAuthorized]);

  // vCenter VM 실데이터 로딩 (이슈 VM 섹션용, axios 사용)
  useEffect(() => {
    const fetchVcenterVms = async () => {
      try {
        setVcenterLoading(true);
        setVcenterError(null);

        const res = await apiClient.get<
            ApiResponse<IssueVCenterVm[] | { items: IssueVCenterVm[] }>
        >("/monitor/vcenter/vms");

        const body = res.data;

        if (!body.success || !body.data) {
          throw new Error("invalid response");
        }

        const payload = body.data;
        let items: IssueVCenterVm[] = Array.isArray(payload)
            ? payload
            : payload.items ?? [];

        // 로그인한 사용자 teamId 기준으로 필터링
        const teamIdStr = localStorage.getItem("teamId");
        if (teamIdStr) {
          const myTeamId = Number(teamIdStr);
          items = items.filter(
              (vm) => vm.teamId != null && Number(vm.teamId) === myTeamId
          );
        }

        setVcenterVms(items);
      } catch (e) {
        console.error("failed to load vCenter vms", e);
        setVcenterError("vCenter VM 목록을 불러오지 못했습니다.");
      } finally {
        setVcenterLoading(false);
      }
    };

    if (isAuthorized) {
      fetchVcenterVms();
    }
  }, [isAuthorized]);

  // 이슈 VM 필터링
  const issueVms = vcenterVms.filter(
      (vm) => vm.powerState === "POWERED_OFF" || vm.alarmStatus !== "OK"
  );

  // AI 이상징후 분석 호출 (DEMO VM용)
  const handleAnalyzeAnomaly = async () => {
    if (!selectedVM) return;

    try {
      setAnomalyLoading(true);
      setAnomalyError(null);

      const payload = {
        vmId: selectedVM.name,
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
      console.error("anomaly detection error", e);
      setAnomalyError("이상징후 분석 중 오류가 발생했습니다.");
    } finally {
      setAnomalyLoading(false);
    }
  };

  // 상세 모니터링 버튼 (Grafana 링크 - DEMO VM)
  const handleOpenDetailMonitoring = () => {
    if (!selectedVM) return;

    const base =
        process.env.NEXT_PUBLIC_GRAFANA_BASE_URL ?? "http://172.16.5.68:3000";
    const uid = process.env.NEXT_PUBLIC_GRAFANA_DASHBOARD_UID ?? "vm-detail";
    const slug = process.env.NEXT_PUBLIC_GRAFANA_DASHBOARD_SLUG ?? "vm-detail";

    const url = `${base}/d/${uid}/${slug}?var-instance=${encodeURIComponent(
        selectedVM.name
    )}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  // vCenter VM 메모리 GB 포맷
  const formatMemoryGiB = (miB: number) => `${(miB / 1024).toFixed(1)} GB`;

  // vCenter VM Grafana 링크
  const openVcenterGrafana = (vm: VCenterVmApiVm) => {
    const base =
        process.env.NEXT_PUBLIC_GRAFANA_BASE_URL ?? "http://172.16.5.68:3000";
    const uid = process.env.NEXT_PUBLIC_GRAFANA_DASHBOARD_UID ?? "vm-detail";
    const slug = process.env.NEXT_PUBLIC_GRAFANA_DASHBOARD_SLUG ?? "vm-detail";

    const url = `${base}/d/${uid}/${slug}?var-instance=${encodeURIComponent(
        vm.name
    )}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  // 🔹 챗봇에서 사용자 메시지 보냈을 때 (지금은 상태만 업데이트, 나중에 n8n/AI API 연동)
  const handleChatSend = async (messageText: string) => {
    if (!messageText.trim()) return;

    setChatMessages((prev) => [
      ...prev,
      {
        text: messageText,
        isBot: false,
      },
    ]);

    // TODO: 여기서 백엔드 /ops/chat 이나 n8n Webhook 호출해서
    //       AI 응답 받아오고, setChatMessages로 isBot: true 메시지 추가
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

        let parsed = JSON.parse(event.data || "{}");

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

        // 데이터가 비어있거나 message만 있는 경우 무시
        if (!parsed || Object.keys(parsed).length === 0) {
          console.log("[Admin SSE] empty data. ignore.");
          return;
        }

        // EMPTY_BODY_FROM_N8N 메시지 무시
        if (parsed.message === "EMPTY_BODY_FROM_N8N") {
          console.log("[Admin SSE] empty body from n8n. ignore.");
          return;
        }

        // ✅ 데이터 추출
        const vmName = parsed.vmName ?? "알 수 없는 VM";
        const eventType = parsed.eventType ?? "";
        const reason = parsed.reason ?? "";
        const actionRequired = parsed.actionRequired ?? "";
        const additionalChecks = parsed.additionalChecks ?? "";

        // ✅ 메시지 생성
        const lines: string[] = [];
        lines.push("🚨 vSphere 알람 분석 결과");

        if (eventType) {
          lines.push(`📌 유형: ${eventType}`);
        }
        lines.push(`🖥️ 대상 VM: ${vmName}`);

        if (reason) {
          lines.push("");
          lines.push(`📋 상세 내용:`);
          lines.push(reason);
        }
        if (actionRequired) {
          lines.push("");
          lines.push(`🔧 조치 필요:`);
          lines.push(actionRequired);
        }
        if (additionalChecks) {
          lines.push("");
          lines.push(`🔍 추가 점검:`);
          lines.push(additionalChecks);
        }

        const text = lines.join("\n");

        console.log("[Admin SSE] Generated message:", text.substring(0, 100));

        // ✅ 메시지가 있을 때만 추가
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
          eventSource.readyState
      );
    };

    // ✔️ 기본 message 이벤트도 듣고,
    eventSource.onmessage = handleEvent;

    // ✔️ 서버가 `event: vsphere-error` 로 보내는 커스텀 이벤트도 같이 듣기
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
            <div className="mb-8">
              <h1 className="mb-2 text-4xl font-bold">관리자 대시보드</h1>
              <p className="text-muted-foreground">
                vCenter + Prometheus 기반 실시간 리소스 현황 및 VM 모니터링
              </p>
            </div>

            {/* vCenter Summary 카드 */}
            <VCenterSummaryCards />

            {/* 🔹 운영 모니터링 요약 카드 */}
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
                        평균 응답 속도 {overview.avgResponseMs} ms
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
                        {overview.avgResponseMs} ms
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
                        {overview.errorCount24h.toLocaleString("ko-KR")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        어플리케이션 / 인프라 에러 집계
                      </div>
                    </Card>
                  </div>
              )}
            </div>

            {/* 이슈 VM 섹션 (vCenter 실데이터 기반) */}
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
                  <div className="space-y-6">
                    {/* 172.16.0.30 호스트 CPU/메모리 */}
                    <HostResourceCharts hostName="172.16.0.30" />

                    {/* 기존 실시간 서비스 가용률 모니터링 */}
                    <PrometheusMonitoring />
                  </div>
                </TabsContent>

                <TabsContent value="grafana">
                  <GrafanaEmbed />
                </TabsContent>
              </Tabs>
            </Card>

            {/* vCenter VM 전체 목록 (클릭 시 상세 모달) */}
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

              {/* ✅ 클릭 핸들러 연결 */}
              <VCenterVmTable onVmClick={handleVcenterVmClick} />
            </Card>

            {/* DEMO VM 리스트 (클릭 시 간단 상세 + AI 분석) */}
            <Card className="mt-8 space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">VM 리스트 (DEMO)</h2>
                <p className="text-xs text-muted-foreground">
                  카드 클릭 시 상세 모니터링 및 AI 이상징후 분석 실행
                </p>
              </div>

              {vmLoading && (
                  <p className="text-sm text-muted-foreground">
                    VM 정보를 불러오는 중입니다...
                  </p>
              )}
              {vmError && (
                  <p className="text-sm text-red-500">{vmError}</p>
              )}

              {!vmLoading && !vmError && vmList.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    표시할 VM이 없습니다.
                  </p>
              )}

              <div className="space-y-2">
                {vmList.map((vm, idx) => (
                    <button
                        key={`${vm.name}-${idx}`}
                        type="button"
                        onClick={() => handleViewDetail(vm)}
                        className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors hover:bg-muted/60"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{vm.name}</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                        <Zap className="h-3 w-3" />
                            {vm.status === "running"
                                ? "정상"
                                : vm.status === "warning"
                                    ? "주의"
                                    : "중지"}
                      </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          CPU 사용률 {vm.cpu}% · 메모리 사용률 {vm.memory}%
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Cpu className="h-3 w-3" />
                      {vm.cpu}%
                    </span>
                        <span className="inline-flex items-center gap-1">
                      <Network className="h-3 w-3" />
                          {vm.memory}%
                    </span>
                        <HardDrive className="h-4 w-4" />
                      </div>
                    </button>
                ))}
              </div>
            </Card>
          </section>
        </main>

        <Footer />

        {/* 🔹 vCenter VM 상세 모달 */}
        <Dialog
            open={isVcenterDetailOpen}
            onOpenChange={setIsVcenterDetailOpen}
        >
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>
                {selectedVcenterVm
                    ? `${selectedVcenterVm.name} (vCenter) 상세`
                    : "vCenter VM 상세"}
              </DialogTitle>
              <DialogDescription>
                Grafana/Prometheus 기반 VM 리소스 그래프를 확인할 수 있습니다.
              </DialogDescription>
            </DialogHeader>

            {selectedVcenterVm && (
                <div className="text-sm">
                  {/* 🔹 메타데이터 카드 제거하고, 그래프만 표시 */}
                  <VcenterVmResourceCharts vmName={selectedVcenterVm.name} />
                </div>
            )}
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
