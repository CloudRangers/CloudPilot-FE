"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Cpu, Network, Server } from "lucide-react";
import type {
  ProvisionResultMessage,
  NewlyCreatedVmInfo,
  InstanceInfo,
} from "@/lib/types/provision";

export default function VmCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobIdFromQuery = searchParams?.get("jobId") ?? undefined;

  const [vmInfo, setVmInfo] = useState<NewlyCreatedVmInfo | null>(null);
  const [result, setResult] = useState<ProvisionResultMessage | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const vmStr = window.localStorage.getItem("newlyCreatedVM");
    if (vmStr) {
      try {
        const parsed = JSON.parse(vmStr) as NewlyCreatedVmInfo;
        setVmInfo(parsed);
      } catch (e) {
        console.warn("[vm-complete] failed to parse newlyCreatedVM", e);
      }
    }

    const resStr = window.localStorage.getItem("lastProvisionResult");
    if (resStr) {
      try {
        const parsed = JSON.parse(resStr) as ProvisionResultMessage;
        setResult(parsed);
      } catch (e) {
        console.warn("[vm-complete] failed to parse lastProvisionResult", e);
      }
    }
  }, []);

  const instances: InstanceInfo[] =
    result?.instances ?? vmInfo?.instances ?? [];

  const totalCount =
    vmInfo?.count ??
    result?.instances?.length ??
    (instances ? instances.length : 0);

  const titleName =
    vmInfo?.name ??
    (instances.length > 0 ? instances[0].name : undefined) ??
    "VM";

  const jobId = jobIdFromQuery ?? vmInfo?.jobId ?? result?.jobId;

  const successMessage =
    result?.message ??
    `${titleName} 포함 ${totalCount || ""}대 VM 생성이 완료되었습니다.`;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container px-4 py-8 md:px-6 md:py-12">
          <div className="mx-auto max-w-5xl space-y-8">
            {/* 상단 헤더 */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                VM 생성이 완료되었습니다
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                {successMessage}
              </p>
              {jobId && (
                <p className="text-xs text-muted-foreground">
                  Job ID: <span className="font-mono">{jobId}</span>
                </p>
              )}
            </div>

            {/* 요약 카드 */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Server className="h-4 w-4" />
                  생성된 VM 수
                </div>
                <p className="text-2xl font-bold">
                  {totalCount ?? "-"}
                  {totalCount != null && (
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      대
                    </span>
                  )}
                </p>
                {vmInfo?.assignedTeam && (
                  <p className="text-xs text-muted-foreground">
                    팀: <span className="font-medium">{vmInfo.assignedTeam}</span>
                  </p>
                )}
              </Card>

              <Card className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Cpu className="h-4 w-4" />
                  기본 스펙
                </div>
                {vmInfo ? (
                  <div className="space-y-1 text-sm">
                    <p>
                      {vmInfo.cpu} vCPU / {vmInfo.memory}GB RAM
                    </p>
                    <p>디스크 {vmInfo.storage}GB</p>
                    <p className="text-xs text-muted-foreground">
                      OS: {vmInfo.os}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    생성 요청 정보를 찾을 수 없습니다.
                  </p>
                )}
              </Card>

              <Card className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Network className="h-4 w-4" />
                  네트워크 / IP
                </div>
                {instances.length > 0 ? (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>
                      대표 IP:{" "}
                      <span className="font-mono">
                        {instances[0].ipAddress ?? "-"}
                      </span>
                    </p>
                    {instances[0].nicAddresses && (
                      <p className="line-clamp-2">
                        NIC: {instances[0].nicAddresses}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    인스턴스 상세 정보가 없습니다.
                  </p>
                )}
              </Card>
            </div>

            {/* 인스턴스 상세 목록 */}
            {instances.length > 0 && (
              <Card className="p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">생성된 VM 상세 정보</h2>
                  <Badge variant="outline" className="text-xs">
                    총 {instances.length}대
                  </Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs md:text-sm">
                    <thead className="border-b bg-muted/50 text-[11px] uppercase text-muted-foreground">
                      <tr>
                        <th className="py-2 pr-4">이름</th>
                        <th className="py-2 px-4">스펙</th>
                        <th className="py-2 px-4">디스크</th>
                        <th className="py-2 px-4">OS</th>
                        <th className="py-2 px-4">IP</th>
                        <th className="py-2 pl-4">NIC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {instances.map((vm, idx) => (
                        <tr
                          key={vm.externalId ?? vm.name ?? idx}
                          className="border-b last:border-0"
                        >
                          <td className="py-2 pr-4">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {vm.name ?? `VM-${idx + 1}`}
                              </span>
                              {vm.externalId && (
                                <span className="text-[10px] text-muted-foreground">
                                  ID: {vm.externalId}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-4 text-xs">
                            {vm.cpuCores} vCPU / {vm.memoryGb}GB
                          </td>
                          <td className="py-2 px-4 text-xs">
                            {vm.diskGb}GB
                          </td>
                          <td className="py-2 px-4 text-xs">
                            {vm.osType ?? "-"}
                          </td>
                          <td className="py-2 px-4 text-xs font-mono">
                            {vm.ipAddress ?? "-"}
                          </td>
                          <td className="py-2 pl-4 text-[10px] text-muted-foreground">
                            {vm.nicAddresses ?? "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* 다음 액션 버튼들 */}
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="outline" onClick={() => router.push("/")}>
                대시보드로 돌아가기
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/request-package")}
              >
                패키지 설치 요청하기
              </Button>
              <Button onClick={() => router.push("/assign-member")}>
                VM 담당자 할당하러 가기
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
