"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PrometheusMonitoring } from "@/components/prometheus-monitoring";
import { vcenterApi, VCenterVm } from "@/lib/api/vcenter";
import { VMMetricChart } from "@/components/vm-metric-chart";

// ====== 🔐 /auth/me 응답 타입 & API URL ======
interface MeApiResponse<T> {
  success: boolean;
  data: T;
  message?: string | null;
}

interface MeResponseDto {
  username: string;
  roleCode: string;
  roleName: string;
  teamName: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
// ==========================================

export default function VMStatusPage() {
  const router = useRouter();

  const [role, setRole] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string>("");
  const [username, setUsername] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  // vCenter VM 리스트
  const [vmList, setVmList] = useState<VCenterVm[]>([]);
  const [loadingVms, setLoadingVms] = useState(true);

  // 선택된 VM (그래프용)
  const [selectedVm, setSelectedVm] = useState<VCenterVm | null>(null);

  // 🔐 로그인 여부 / 역할 확인
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          method: "GET",
          credentials: "include", // access_token 쿠키 전송
        });

        if (!res.ok) {
          throw new Error("auth/me failed");
        }

        const json: MeApiResponse<MeResponseDto> = await res.json();
        if (!json.success || !json.data) {
          throw new Error("auth/me success=false");
        }

        setRole(json.data.roleCode);
        setTeamName(json.data.teamName);
        setUsername(json.data.username);

        localStorage.setItem("userRole", json.data.roleCode);
        localStorage.setItem("username", json.data.username);
        localStorage.setItem("teamName", json.data.teamName);
      } catch (err) {
        console.error("auth/me error", err);
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("userRole");
        localStorage.removeItem("username");
        localStorage.removeItem("teamName");
        router.push("/login");
      } finally {
        setLoadingRole(false);
      }
    })();
  }, [router]);

  // 📡 vCenter VM 리스트 가져오기
  useEffect(() => {
    const fetchVms = async () => {
      try {
        setLoadingVms(true);
        const res = await vcenterApi.getAllVms();
        if (res.success && res.data) {
          setVmList(res.data);
          // 기본 선택값: 첫 번째 VM
          if (res.data.length > 0) {
            setSelectedVm(res.data[0]);
          }
        }
      } catch (err) {
        console.error("vCenter VM 조회 실패", err);
      } finally {
        setLoadingVms(false);
      }
    };

    fetchVms();
  }, []);

  if (loadingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">
          대시보드를 불러오는 중입니다...
        </p>
      </div>
    );
  }

  const isAdminOrHead = role === "ADMIN" || role === "HEAD";
  const isLeader = role === "LEADER";
  const isMember = role === "MEMBER";

  const teamTitle = isAdminOrHead ? "전체 조직" : teamName || "소속 팀";

  const getPowerBadgeClass = (powerState: string) => {
    if (powerState === "POWERED_ON") {
      return "bg-green-500/10 text-green-600 border-green-500/20";
    }
    if (powerState === "POWERED_OFF") {
      return "bg-gray-500/10 text-gray-600 border-gray-300";
    }
    return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-primary/5">
      <Header />

      <main className="flex-1 container px-4 py-8 md:px-6">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Header Section */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {teamTitle}
            </h1>
            <h2 className="text-xl font-semibold text-muted-foreground">
              VM 현황 및 리소스 모니터링
            </h2>

            <p className="text-sm text-muted-foreground">
              현재 로그인 역할:{" "}
              <span className="font-mono">{role}</span>
            </p>
            {username && (
              <p className="text-sm text-muted-foreground">
                사용자: <span className="font-medium">{username}</span> / 팀:{" "}
                <span className="font-medium">{teamName || "-"}</span>
              </p>
            )}
          </div>

          {/* 🔍 권한별 모니터링 대시보드 섹션 */}
          {(isAdminOrHead || isLeader) && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {isAdminOrHead ? "조직/팀 리소스 모니터링" : "팀 리소스 모니터링"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  CloudPilot 백엔드를 통해 Prometheus 메트릭을 조회합니다.
                </p>
              </div>
              <PrometheusMonitoring />
            </section>
          )}

          {/* MEMBER는 안내 문구만 */}
          {isMember && (
            <p className="text-sm text-muted-foreground">
              팀원 역할은 VM 상태 및 리소스를 조회할 수 있습니다.
            </p>
          )}

          {/* ✅ vCenter VM 리스트 (기존 F 섹션이 여기로 교체된 느낌이라고 보면 됨) */}
          <section className="space-y-3 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">vCenter VM 목록</h3>
              {loadingVms && (
                <span className="text-xs text-muted-foreground">
                  VM 목록을 불러오는 중입니다...
                </span>
              )}
            </div>

            {vmList.length === 0 && !loadingVms && (
              <p className="text-sm text-muted-foreground">
                표시할 VM이 없습니다.
              </p>
            )}

            {vmList.map((vm) => (
              <button
                key={vm.vm}
                type="button"
                onClick={() => setSelectedVm(vm)}
                className={`w-full flex items-center justify-between rounded-lg border bg-background/80 p-4 text-left transition-all hover:border-primary/50 hover:shadow-md ${
                  selectedVm?.vm === vm.vm ? "border-primary/70 shadow-md" : ""
                }`}
              >
                <div className="flex flex-col gap-1 flex-1">
                  <span className="font-medium text-foreground/90">
                    {vm.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    VM ID: {vm.vm} · CPU {vm.cpu_count} vCPU · 메모리{" "}
                    {vm.memory_size_MiB} MiB
                  </span>
                </div>

                <Badge
                  variant="outline"
                  className={`min-w-[110px] justify-center ${getPowerBadgeClass(
                    vm.power_state
                  )}`}
                >
                  {vm.power_state}
                </Badge>
              </button>
            ))}
          </section>

          {/* 📊 선택된 VM 리소스 그래프 (AI 연동 전에 보는 기본 메트릭 뷰) */}
          {selectedVm && (
            <section className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    선택된 VM 리소스 상세
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedVm.name} (ID: {selectedVm.vm}) · 상태:{" "}
                    {selectedVm.power_state}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <VMMetricChart
                  vmId={selectedVm.vm}
                  metricName="cpu_usage"   // ⚠️ BE/Prometheus에서 사용하는 실제 metric 이름으로 맞춰야 함
                  title="CPU 사용률"
                  unit="%"
                />
                <VMMetricChart
                  vmId={selectedVm.vm}
                  metricName="memory_usage" // ⚠️ 마찬가지로 BE와 협의 필요
                  title="메모리 사용률"
                  unit="%"
                />
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Chatbot Button */}
      <div className="fixed bottom-24 right-6 z-40">
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 bg-gradient-to-br from-primary to-primary/80"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="sr-only">챗봇 열기</span>
        </Button>
      </div>

      <Footer />
    </div>
  );
}
