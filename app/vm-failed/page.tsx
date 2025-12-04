"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, RefreshCcw, ServerOff } from "lucide-react";
import type { ProvisionResultMessage } from "@/lib/types/provision";

// ✅ Suspense 래퍼 컴포넌트
export default function VmFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 bg-background">
            <div className="container px-4 py-8 md:px-6 md:py-12">
              <div className="mx-auto max-w-3xl space-y-4 text-center">
                <div className="flex justify-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-destructive/40 border-t-destructive" />
                </div>
                <p className="text-sm text-muted-foreground">
                  실패한 작업 정보를 불러오는 중입니다...
                </p>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      }
    >
      <VmFailedContent />
    </Suspense>
  );
}

// ✅ 실제 로직 컴포넌트
function VmFailedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobIdFromQuery = searchParams?.get("jobId") ?? undefined;

  const [result, setResult] = useState<ProvisionResultMessage | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const resStr = window.localStorage.getItem("lastProvisionResult");
    if (!resStr) return;
    try {
      const parsed = JSON.parse(resStr) as ProvisionResultMessage;
      setResult(parsed);
    } catch (e) {
      console.warn("[vm-failed] failed to parse lastProvisionResult", e);
    }
  }, []);

  const jobId = jobIdFromQuery ?? result?.jobId;
  const errorMessage =
    result?.message ||
    "VM 생성 중 오류가 발생했습니다. 관리자에게 문의해주세요.";
  const statusText = result?.status ?? "FAILED";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container px-4 py-8 md:px-6 md:py-12">
          <div className="mx-auto max-w-3xl space-y-8">
            {/* 상단 경고 헤더 */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                VM 생성에 실패했습니다
              </h1>
              <p className="max-w-xl text-sm text-muted-foreground md:text-base">
                {errorMessage}
              </p>
              {jobId && (
                <p className="text-xs text-muted-foreground">
                  Job ID: <span className="font-mono">{jobId}</span>
                </p>
              )}
            </div>

            {/* 상태/원인 요약 */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <ServerOff className="h-4 w-4" />
                  작업 상태
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">
                    {statusText}
                  </Badge>
                  {result?.eventType && (
                    <span className="text-xs text-muted-foreground">
                      ({result.eventType})
                    </span>
                  )}
                </div>
                {result?.step && (
                  <p className="text-xs text-muted-foreground mt-1">
                    실패 단계: <span className="font-mono">{result.step}</span>
                  </p>
                )}
              </Card>

              <Card className="p-4 space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  다음에 시도해볼 수 있는 것들
                </div>
                <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1">
                  <li>입력한 VM 스펙/팀 정보가 올바른지 다시 한 번 확인해 주세요.</li>
                  <li>같은 오류가 반복되면 운영자에게 Job ID와 함께 문의해 주세요.</li>
                  <li>
                    일시적인 인프라 이슈일 수 있으니, 잠시 후 다시 시도해 보셔도 좋습니다.
                  </li>
                </ul>
              </Card>
            </div>

            {/* 액션 버튼 */}
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="outline" onClick={() => router.push("/")}>
                대시보드로 돌아가기
              </Button>
              <Button variant="outline" onClick={() => router.push("/create-vm")}>
                새로 VM 생성 시도
              </Button>
              <Button onClick={() => window.location.reload()}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                화면 새로고침
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
