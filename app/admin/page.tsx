// app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Cpu,
  HardDrive,
  Network,
  Users,
  Zap,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PrometheusMonitoring } from "@/components/prometheus-monitoring";
import { GrafanaEmbed } from "@/components/grafana-embed";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// 🔹 vCenter 컴포넌트
import { VCenterSummaryCards } from "@/components/vcenter-summary-cards";
import { VCenterVmTable } from "@/components/vcenter-vm-table";

// 🔹 AI 이상징후 분석 API
import { opsApi } from "@/lib/api/ops";
import type { AnomalyDetectionResultDto } from "@/lib/api/ops";

type VM = {
  name: string;
  cpu: number;
  memory: number;
  status: "running" | "warning" | "stopped";
  disk?: number;
  network?: number;
  uptime?: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedVM, setSelectedVM] = useState<VM | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 🔹 AI 이상징후 분석 상태
  const [anomalyResult, setAnomalyResult] =
    useState<AnomalyDetectionResultDto | null>(null);
  const [anomalyLoading, setAnomalyLoading] = useState(false);
  const [anomalyError, setAnomalyError] = useState<string | null>(null);

  // 🔹 DEMO용 하드코딩 VM 리스트 (모달에서만 사용)
  const vmList: VM[] = [
    {
      name: "web-server-01",
      cpu: 45,
      memory: 68,
      status: "running",
      disk: 55,
      network: 120,
      uptime: "15일 3시간",
    },
    {
      name: "api-server-01",
      cpu: 72,
      memory: 81,
      status: "running",
      disk: 67,
      network: 340,
      uptime: "22일 8시간",
    },
    {
      name: "db-server-01",
      cpu: 88,
      memory: 92,
      status: "warning",
      disk: 89,
      network: 85,
      uptime: "30일 12시간",
    },
    {
      name: "cache-server-01",
      cpu: 34,
      memory: 56,
      status: "running",
      disk: 42,
      network: 210,
      uptime: "7일 15시간",
    },
  ];

  const handleViewDetail = (vm: VM) => {
    setSelectedVM(vm);
    setAnomalyResult(null); // 🔁 VM 바꿀 때마다 결과 초기화
    setAnomalyError(null);
    setIsDetailOpen(true);
  };

  // 🔐 ADMIN 권한 체크
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

  // 🔍 AI 이상징후 분석 호출
  const handleAnalyzeAnomaly = async () => {
    if (!selectedVM) return;

    try {
      setAnomalyLoading(true);
      setAnomalyError(null);

      // TODO: 나중에는 Prometheus나 BE에서 실제 메트릭 가져와서 넣기
      const payload = {
        vmId: selectedVM.name, // 지금은 이름 기준. 나중에 실제 vmId로 교체 가능
        metricNames: ["cpu_usage"],
        metrics: {
          cpu_usage: [0.3, 0.7, 0.85, 0.9, 0.88], // 데모용 더미 데이터
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
            <h1 className="text-4xl font-bold mb-2">관리자 대시보드</h1>
            <p className="text-muted-foreground">
              vCenter + Prometheus 기반 실시간 리소스 현황 및 VM 모니터링
            </p>
          </div>

          {/* ✅ vCenter Summary 카드 (실데이터) */}
          <VCenterSummaryCards />

          {/* 운영 모니터링 (현재는 데모 값) */}
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6">운영 모니터링</h2>
            <div className="grid gap-6 md:grid-cols-3 mb-6">
              <Card className="p-4 border-2">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold">일일 사용자 수</h3>
                </div>
                <div className="text-2xl font-bold mb-1">1,247명</div>
                <p className="text-xs text-muted-foreground">
                  전일 대비 +12.5%
                </p>
              </Card>

              <Card className="p-4 border-2">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="h-5 w-5 text-orange-500" />
                  <h3 className="font-semibold">시스템 부하</h3>
                </div>
                <div className="text-2xl font-bold mb-1">중간</div>
                <p className="text-xs text-muted-foreground">
                  평균 응답시간: 245ms
                </p>
              </Card>

              <Card className="p-4 border-2">
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <h3 className="font-semibold">에러 발생 수</h3>
                </div>
                <div className="text-2xl font-bold mb-1">3건</div>
                <p className="text-xs text-muted-foreground">
                  지난 24시간 기준
                </p>
              </Card>
            </div>
          </Card>

          {/* Prometheus / Grafana 탭 */}
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

          {/* ✅ vCenter VM 목록 (실데이터) */}
          <Card className="p-6 mt-8 space-y-4">
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

            <VCenterVmTable />
          </Card>

          {/* DEMO: 기존 하드코딩 VM 리스트 + 상세 모달 */}
          <Card className="p-6 mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">DEMO: 기존 VM 리스트</h2>
              <p className="text-xs text-muted-foreground">
                (추후 vCenter VM 상세와 연동 가능)
              </p>
            </div>

            <div className="space-y-4">
              {vmList.map((vm, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{vm.name}</h3>
                      {vm.status === "warning" && (
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">CPU:</span>
                        <span
                          className={
                            vm.cpu > 80 ? "text-orange-500 font-medium" : ""
                          }
                        >
                          {vm.cpu}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">메모리:</span>
                        <span
                          className={
                            vm.memory > 85
                              ? "text-orange-500 font-medium"
                              : ""
                          }
                        >
                          {vm.memory}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetail(vm)}
                  >
                    상세보기
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </main>
      <Footer />

      {/* DEMO 상세 모달 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedVM?.name} 상세 정보
            </DialogTitle>
            <DialogDescription>
              실시간 리소스 사용 현황 및 상태
            </DialogDescription>
          </DialogHeader>

          {selectedVM && (
            <div className="space-y-6 py-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">상태:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedVM.status === "running"
                      ? "bg-green-100 text-green-700"
                      : selectedVM.status === "warning"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {selectedVM.status === "running"
                    ? "실행 중"
                    : selectedVM.status === "warning"
                    ? "경고"
                    : "정지"}
                </span>
              </div>

              {/* Resource Metrics */}
              <div className="grid gap-4">
                {/* CPU */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">CPU 사용률</span>
                    </div>
                    <span
                      className={`font-bold ${
                        selectedVM.cpu > 80 ? "text-orange-500" : ""
                      }`}
                    >
                      {selectedVM.cpu}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        selectedVM.cpu > 80 ? "bg-orange-500" : "bg-blue-500"
                      }`}
                      style={{ width: `${selectedVM.cpu}%` }}
                    />
                  </div>
                </div>

                {/* Memory */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">메모리 사용률</span>
                    </div>
                    <span
                      className={`font-bold ${
                        selectedVM.memory > 85 ? "text-orange-500" : ""
                      }`}
                    >
                      {selectedVM.memory}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        selectedVM.memory > 85
                          ? "bg-orange-500"
                          : "bg-purple-500"
                      }`}
                      style={{ width: `${selectedVM.memory}%` }}
                    />
                  </div>
                </div>

                {/* Disk */}
                {selectedVM.disk !== undefined && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5 text-green-500" />
                        <span className="font-medium">디스크 사용률</span>
                      </div>
                      <span className="font-bold">{selectedVM.disk}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${selectedVM.disk}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Network */}
                {selectedVM.network !== undefined && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Network className="h-5 w-5 text-orange-500" />
                        <span className="font-medium">네트워크 트래픽</span>
                      </div>
                      <span className="font-bold">
                        {selectedVM.network} MB/s
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 transition-all"
                        style={{
                          width: `${Math.min(
                            (selectedVM.network / 500) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              <div className="grid gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    가동 시간
                  </span>
                  <span className="font-medium">
                    {selectedVM.uptime || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    마지막 업데이트
                  </span>
                  <span className="font-medium">
                    {new Date().toLocaleString("ko-KR")}
                  </span>
                </div>
              </div>

              {/* 🔍 AI 기반 이상징후 분석 영역 */}
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">이상징후 분석</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAnalyzeAnomaly}
                    disabled={anomalyLoading}
                  >
                    {anomalyLoading ? "분석 중..." : "이 VM 분석하기"}
                  </Button>
                </div>

                {anomalyError && (
                  <p className="text-xs text-red-500 mt-1">
                    {anomalyError}
                  </p>
                )}

                {anomalyResult && (
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">결과:</span>
                      <span
                        className={
                          anomalyResult.anomaly
                            ? "text-red-600 font-semibold"
                            : "text-green-600 font-semibold"
                        }
                      >
                        {anomalyResult.anomaly
                          ? "이상 징후 감지됨"
                          : "정상"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">심각도: </span>
                      <span>{anomalyResult.severity}</span>
                    </div>
                    <div>
                      <span className="font-medium">Score: </span>
                      <span>{anomalyResult.score.toFixed(2)}</span>
                    </div>
                    {anomalyResult.summary && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {anomalyResult.summary}
                      </p>
                    )}
                    {anomalyResult.explanation && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {anomalyResult.explanation}
                      </p>
                    )}
                  </div>
                )}

                {!anomalyResult && !anomalyLoading && !anomalyError && (
                  <p className="text-xs text-muted-foreground mt-1">
                    이 VM에 대해 AI 기반 이상징후 분석을 실행할 수 있습니다.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}
                >
                  닫기
                </Button>
                <Button variant="default">상세 모니터링</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
