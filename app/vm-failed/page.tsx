"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { XCircle, Home, RefreshCw, Plus } from "lucide-react";
import type { ProvisionResultMessage } from "@/lib/types/provision";

// ✅ Suspense 래퍼 컴포넌트
export default function VmFailedPage() {
  return (
      <Suspense
          fallback={
            <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-destructive/10">
              <Header />
              <main className="flex-1 flex items-center justify-center">
                <div className="container px-4 py-8 md:px-6">
                  <div className="mx-auto max-w-2xl">
                    <Card className="overflow-hidden border-2 border-destructive/50 shadow-2xl">
                      <div className="bg-gradient-to-br from-destructive/10 via-destructive/5 to-background p-12 text-center">
                        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-destructive/40 border-t-destructive" />
                        </div>
                        <p className="text-lg text-muted-foreground">
                          실패한 작업 정보를 불러오는 중입니다...
                        </p>
                      </div>
                    </Card>
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
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-destructive/10">
        <Header />

        <main className="flex-1 flex items-center justify-center">
          <div className="container px-4 py-8 md:px-6">
            <div className="mx-auto max-w-2xl">
              <Card className="overflow-hidden border-2 border-destructive/50 shadow-2xl">
                <div className="bg-gradient-to-br from-destructive/10 via-destructive/5 to-background p-12 text-center">
                  <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10 animate-in zoom-in-95 duration-500">
                    <XCircle className="h-12 w-12 text-destructive animate-in zoom-in duration-700 delay-200" />
                  </div>

                  <h1 className="text-4xl font-bold tracking-tight text-destructive mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                    VM 생성 실패
                  </h1>

                  <p className="text-lg text-muted-foreground mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
                    VM 생성 중 오류가 발생했습니다.
                  </p>

                  {jobId && (
                      <p className="text-sm text-muted-foreground mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
                        Job ID: <span className="font-mono font-medium">{jobId}</span>
                      </p>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">

                    <Button
                        size="lg"
                        className="min-w-[180px] shadow-md hover:shadow-lg transition-all"
                        onClick={() => router.push("/")}
                    >
                      <Home className="mr-2 h-5 w-5" />
                      대시보드로 이동
                    </Button>

                    <Button
                        size="lg"
                        variant="outline"
                        className="min-w-[180px] shadow-sm hover:shadow-md transition-all bg-transparent"
                        onClick={() => router.push("/create-vm")}
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      VM 생성 재시도
                    </Button>

                  </div>
                </div>

                <div className="border-t border-destructive/20 bg-muted/30 px-12 py-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-destructive flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-destructive">오류 발생</p>
                        <div className="flex items-center gap-2 mt-1">
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
                            <p className="text-sm text-muted-foreground mt-1">
                              실패 단계: <span className="font-mono">{result.step}</span>
                            </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-destructive flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium">다음 단계</p>
                        <p className="text-sm text-muted-foreground">
                          입력한 VM 스펙/팀 정보가 올바른지 확인하거나, 같은 오류가 반복되면 운영자에게 Job ID와 함께 문의해주세요.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </main>

        <Footer />
      </div>
  );
}