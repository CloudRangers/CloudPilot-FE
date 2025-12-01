"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { useSse } from "@/lib/context/SseContext";

export default function InstallingPackagePage() {
  const router = useRouter();
  const { progress, stage, message, status } = useSse();

  useEffect(() => {
    if (status === 'completed') {
      setTimeout(() => {
        router.push("/package-complete");
      }, 800);
    } else if (status === 'error') {
      setTimeout(() => {
        router.push("/package-failed");
      }, 800);
    }
  }, [status, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">패키지 설치 중</h1>
          <p className="text-muted-foreground">
            {message || "잠시만 기다려주세요..."}
          </p>
        </div>

        <div className="relative">
          <Progress value={progress} className="h-3" />

          <div
            className="absolute -top-8 transition-all duration-100 ease-linear"
            style={{ left: `${progress}%`, transform: "translateX(-50%)" }}
          >
            <div className="text-4xl animate-bounce">📦</div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-2xl font-semibold text-primary">{progress}%</p>
          <p className="text-sm text-muted-foreground">
            {stage === "CHECK_VM" && "VM 응답 확인 중..."}
            {stage === "WAIT_SSH" && "SSH 접속 대기 중..."}
            {stage === "PKG_START" && "패키지 설치 시작..."}
            {stage === "PKG_END" && "패키지 설치 완료..."}
            {stage === "DONE" && "설치 완료!"}
            {!stage && "준비 중..."}
          </p>
        </div>
      </div>
    </div>
  );
}
