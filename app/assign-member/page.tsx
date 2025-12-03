"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Employee {
  id: string;
  name: string;
  team: string; // 팀 이름 (DEVELOPMENT / OPS / QA)
  teamId: string; // 팀 ID ("1" / "2" / "3")
}

interface NewlyCreatedVM {
  id: string;
  name: string;
  type: "private";
  cpu: string;
  memory: string;
  storage: string;
  os: string;
  count: number;
  assignedTeam?: string;   // 팀 이름
  assignedTeamId?: string; // 팀 ID ("1"/"2"/"3")
  jobId?: number | string;
}

// 🔹 페이지(겉껍데기): Suspense로 실제 내용을 감싸줌
export default function AssignMemberPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-muted-foreground">
            페이지를 불러오는 중입니다...
          </p>
        </div>
      }
    >
      <AssignMemberContent />
    </Suspense>
  );
}

// 🔹 실제 로직이 들어가는 컴포넌트
function AssignMemberContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobIdFromQuery = searchParams.get("jobId") ?? undefined;

  const [vmInfo, setVmInfo] = useState<NewlyCreatedVM | null>(null);
  const [assignments, setAssignments] = useState<Record<number, string>>({});

  // 예시용 직원 데이터
  const employees: Employee[] = [
    { id: "emp-001", name: "홍길동", team: "DEVELOPMENT", teamId: "1" },
    { id: "emp-002", name: "이영희", team: "DEVELOPMENT", teamId: "1" },
    { id: "emp-003", name: "박철수", team: "OPS", teamId: "2" },
    { id: "emp-004", name: "최민수", team: "OPS", teamId: "2" },
    { id: "emp-005", name: "강지훈", team: "QA", teamId: "3" },
  ];

  useEffect(() => {
    const storedVM = localStorage.getItem("newlyCreatedVM");
    if (storedVM) {
      try {
        const parsed = JSON.parse(storedVM) as NewlyCreatedVM;
        console.log("✅ assign-member 전달된 VM 정보:", parsed);
        setVmInfo(parsed);

        const count = Number(parsed.count) || 1;

        // 기존 할당값이 있다면 불러오기
        const storedAssignments = localStorage.getItem("vmAssignments");
        if (storedAssignments) {
          try {
            const parsedAssignments = JSON.parse(
              storedAssignments
            ) as Record<number, string>;
            setAssignments(() => {
              const next: Record<number, string> = {};
              for (let i = 0; i < count; i++) {
                next[i] = parsedAssignments[i] ?? "";
              }
              return next;
            });
            return;
          } catch (e) {
            console.warn("[assign-member] vmAssignments 파싱 실패:", e);
          }
        }

        // 없으면 초기화
        const initialAssignments: Record<number, string> = {};
        for (let i = 0; i < count; i++) {
          initialAssignments[i] = "";
        }
        setAssignments(initialAssignments);
      } catch (e) {
        console.error("[assign-member] newlyCreatedVM 파싱 실패:", e);
        router.replace("/create-vm");
      }
    } else {
      router.replace("/create-vm");
    }
  }, [router]);

  const handleSelectChange = (vmIndex: number, empId: string) => {
    setAssignments((prev) => ({
      ...prev,
      [vmIndex]: empId,
    }));
  };

  const handleAssign = () => {
    if (!vmInfo) return;

    try {
      // 🔥 VM 정보는 건드리지 않고, 할당 정보만 별도 key에 저장
      localStorage.setItem("vmAssignments", JSON.stringify(assignments));
      console.log("✅ 최종 할당 결과:", assignments);
    } catch (e) {
      console.warn("[assign-member] vmAssignments 저장 실패:", e);
    }

    alert("모든 VM에 대한 팀원 할당이 완료되었습니다.");

    const nextJobId = jobIdFromQuery ?? vmInfo.jobId;
    const nextUrl = nextJobId
      ? `/vm-complete?jobId=${nextJobId}`
      : "/vm-complete";

    router.push(nextUrl);
  };

  if (!vmInfo) {
    // Suspense fallback → hydration 이후 useEffect에서 vmInfo 세팅되면 자동 렌더됨
    return null;
  }

  const count = Number(vmInfo.count) || 1;

  // 팀 필터링: team 이름이든 teamId든 둘 다 지원
  const teamKey = vmInfo.assignedTeamId ?? vmInfo.assignedTeam ?? "";
  const filtered = employees.filter(
    (e) => e.teamId === String(teamKey) || e.team === String(teamKey)
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container px-4 py-8">
          <h1 className="mb-6 text-2xl font-bold">VM 팀원 할당</h1>

          {/* VM 기본 정보 */}
          <Card className="mb-6 space-y-1 p-4">
            <p className="text-sm">
              VM 이름: <strong>{vmInfo.name}</strong>
            </p>
            <p className="text-sm">
              팀:{" "}
              <strong>
                {vmInfo.assignedTeam ?? vmInfo.assignedTeamId ?? "-"}
              </strong>
            </p>
            <p className="text-sm">
              개수: <strong>{count}</strong>
            </p>
            <p className="text-sm">
              스펙: {vmInfo.cpu} vCPU / {vmInfo.memory}GB / {vmInfo.storage}GB /{" "}
              {vmInfo.os}
            </p>
          </Card>

          {/* VM 개수만큼 카드 렌더링 */}
          <div className="space-y-6">
            {Array.from({ length: count }).map((_, index) => (
              <Card key={index} className="space-y-3 p-6">
                <h2 className="mb-2 font-semibold">VM #{index + 1} 할당</h2>

                {filtered.length > 0 ? (
                  <>
                    <Label>팀원 선택</Label>
                    <Select
                      value={assignments[index] || ""}
                      onValueChange={(value) =>
                        handleSelectChange(index, value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="팀원을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {filtered.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    이 팀에 등록된 팀원 정보가 없습니다.
                  </p>
                )}
              </Card>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              onClick={handleAssign}
              disabled={Object.values(assignments).some((v) => !v)}
            >
              전체 할당 완료
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
