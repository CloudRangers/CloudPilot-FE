// src/app/vm-status/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { VCenterSummaryCards } from "@/components/vcenter-summary-cards";
import { VCenterVmTable } from "@/components/vcenter-vm-table";

type RoleCode = "ADMIN" | "HEAD" | "LEADER" | "MEMBER" | null;

export default function VmStatusPage() {
  const router = useRouter();

  const [initializing, setInitializing] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<RoleCode>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<number | null>(null); // 🔹 숫자 teamId 상태 추가

  // ✅ 로그인/역할 정보 localStorage에서 읽기
  useEffect(() => {
    try {
      const storedIsLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      const storedRole = localStorage.getItem("userRole");
      const storedUsername = localStorage.getItem("username");
      const storedTeamName = localStorage.getItem("teamName");
      const storedTeamId = localStorage.getItem("teamId");

      if (!storedIsLoggedIn || !storedRole) {
        // 로그인 안 된 상태면 로그인 페이지로 보냄
        router.replace("/login");
        return;
      }

      let parsedTeamId: number | null = null;
      if (storedTeamId && !Number.isNaN(Number(storedTeamId))) {
        parsedTeamId = Number(storedTeamId);
      }

      setIsLoggedIn(true);
      setRole(storedRole as RoleCode);
      setUsername(storedUsername);
      setTeamName(storedTeamName);
      setTeamId(parsedTeamId);
    } finally {
      setInitializing(false);
    }
  }, [router]);

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">
          대시보드를 불러오는 중입니다...
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !role) {
    // 여기는 거의 안 타지만, 방어용
    return null;
  }

  const roleLabel: Record<string, string> = {
    ADMIN: "관리자",
    HEAD: "부장",
    LEADER: "팀장",
    MEMBER: "팀원",
  };

  const isHead = role === "HEAD";
  const isAdmin = role === "ADMIN";

  // 🔹 ADMIN/HEAD 는 전체, 그 외(LEADER/MEMBER)는 자신의 teamId 로 필터
  const effectiveTeamId: number | null =
    isAdmin || isHead ? null : teamId ?? null;

  // 👉 역할별로 화면 설명/범위 문구 다르게
  const scopeText =
    role === "HEAD"
      ? "여러 팀의 인프라 리소스를 한 번에 보는 부장용 대시보드입니다."
      : role === "LEADER"
      ? "내가 담당하는 팀의 리소스를 관리하는 팀장용 대시보드입니다."
      : role === "MEMBER"
      ? "내가 속한 팀의 리소스 현황을 조회하는 팀원용 대시보드입니다."
      : "역할 정보가 올바르지 않습니다.";

  const rangeText =
    role === "HEAD"
      ? "표시 범위: 내가 관리하는 모든 팀 (현재는 전체 vCenter 기준 데이터 또는 통합 데이터)"
      : role === "LEADER"
      ? `표시 범위: 팀 "${teamName ?? "-"}"${
          effectiveTeamId == null ? " (teamId 정보 없음, 전체 기준)" : ""
        }`
      : role === "MEMBER"
      ? `표시 범위: 팀 "${teamName ?? "-"}"${
          effectiveTeamId == null ? " (teamId 정보 없음, 전체 기준)" : ""
        }`
      : "";

  const showVmTable = role === "HEAD" || role === "LEADER"; // 👉 팀원은 Summary만

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="container px-4 py-12 md:px-6">
          {/* 상단 타이틀 */}
          <div className="mb-8 space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold">
              {role === "HEAD"
                ? "부장용 인프라 대시보드"
                : role === "LEADER"
                ? "팀장용 인프라 대시보드"
                : role === "MEMBER"
                ? "팀원용 인프라 대시보드"
                : "대시보드"}
            </h1>
            <p className="text-sm text-muted-foreground">{scopeText}</p>
          </div>

          {/* 사용자/역할 정보 카드 */}
          <Card className="p-4 mb-6 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">사용자</span>
                <span className="text-sm font-semibold">
                  {username ?? "알 수 없음"}
                </span>
                <Badge variant="outline" className="text-xs">
                  {roleLabel[role] ?? role}
                </Badge>
              </div>
              {teamName && (
                <p className="text-xs text-muted-foreground">
                  소속 팀: <span className="font-medium">{teamName}</span>
                </p>
              )}
              {rangeText && (
                <p className="text-xs text-muted-foreground">{rangeText}</p>
              )}
            </div>
          </Card>

          {/* ✅ vCenter Summary 카드: 모든 역할 공통으로 보여주되, teamId 기준 필터 가능 */}
          <VCenterSummaryCards teamId={effectiveTeamId} />

          {/* HEAD / LEADER 만 상세 VM 테이블 접근 가능 */}
          {showVmTable ? (
            <Card className="p-6 mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">vCenter VM 리소스 현황</h2>
                  <p className="text-xs text-muted-foreground">
                    현재는 vCenter 기준 데이터입니다.
                    <br />
                    나중에 VM-팀 매핑 규칙이 정리되면, 이 테이블을
                    &quot;내 조직/내 팀&quot; 기준으로 보다 정교하게 필터링할 수
                    있습니다.
                  </p>
                </div>
              </div>

              {/* 🔹 teamId 기반 필터링된 VM + 메트릭 */}
              <VCenterVmTable teamId={effectiveTeamId} />
            </Card>
          ) : (
            <Card className="p-6 mt-4 space-y-3">
              <h2 className="text-lg font-semibold">팀원 권한 안내</h2>
              <p className="text-sm text-muted-foreground">
                현재는 팀원 권한에서는 전체 VM 상세 목록 대신,
                <br />
                상단의 요약 카드 기준으로 팀 리소스 현황을 확인할 수 있습니다.
                <br />
                (필요 시, 추후 팀원에게 허용할 상세 정보 범위를 추가 설계할 수
                있습니다.)
              </p>
            </Card>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
