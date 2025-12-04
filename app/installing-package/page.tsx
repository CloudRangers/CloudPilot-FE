"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

import { useSse } from "@/lib/context/SseContext";

type ProvisionStatus = "RUNNING" | "SUCCEEDED" | "FAILED";

function InstallingPackageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 🔥 SSE Context (여기서 status/message 안씀)
  const { sseStates, startSseConnection } = useSse();

  const rawJobIds = searchParams.get("jobIds");
  const jobIds = useMemo<string[]>(() => {
    if (rawJobIds && rawJobIds.trim().length > 0) {
      return rawJobIds
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id.length > 0);
    }
    return [];
  }, [rawJobIds]);

  const totalCount = jobIds.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [description, setDescription] = useState("설치 작업 준비 중...");
  const [isProcessing, setIsProcessing] = useState(true);

  const currentJobId = jobIds[currentIndex] ?? null;

  // 🔥 현재 jobId의 SSE 상태 가져오기
  const currentJob = currentJobId ? sseStates[currentJobId] : null;

  const progress = currentJob?.progress ?? 0;
  const stage = currentJob?.stage;
  const stageStatus = currentJob?.status;

  const isFailed = stageStatus === "error";
  const isDone = stageStatus === "completed";

  // jobIds 바뀌면 재시작
  useEffect(() => {
    setCurrentIndex(0);
    setIsProcessing(true);
  }, [rawJobIds]);

  // 🔥 현재 jobId에서 SSE 연결
  useEffect(() => {
    if (!currentJobId || !isProcessing) return;

    setDescription(
      totalCount > 1
        ? `총 ${totalCount}대 중 ${currentIndex + 1}번째 VM 패키지 설치 중입니다.`
        : "패키지 설치 시작 중..."
    );

    startSseConnection(currentJobId);
  }, [currentJobId, currentIndex, isProcessing]);

  // 🔥 SSE 데이터 기반 UI 업데이트
  useEffect(() => {
    if (!currentJobId || !currentJob || !isProcessing) return;

    // 오류 처리
    if (isFailed) {
      setIsProcessing(false);
      setTimeout(() => router.push("/package-failed"), 600);
      return;
    }

    // progress 갱신
    if (currentJob.message) setDescription(currentJob.message);

    // Job 완료 처리
    if (isDone && progress >= 100) {
      if (currentIndex < totalCount - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsProcessing(false);
        setTimeout(() => router.push("/package-complete"), 600);
      }
    }
  }, [currentJob, currentJobId, progress, stageStatus, isProcessing]);

  if (totalCount === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            작업 정보를 찾을 수 없습니다
          </h1>
          <p className="text-muted-foreground text-sm">
            유효한 jobIds 파라미터가 필요합니다.
          </p>
          <Button onClick={() => router.push("/install-package")}>
            설치 페이지로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const overallProgress = Math.min(
    100,
    Math.floor((currentIndex / totalCount) * 100 + progress / totalCount)
  );

  const stageMessage = () => {
    switch (stage) {
      case "CHECK_VM":
        return "VM 응답 확인 중...";
      case "WAIT_SSH":
        return "SSH 접속 대기 중...";
      case "PKG_START":
        return "패키지 설치 시작...";
      case "PKG_END":
        return "패키지 설치 완료...";
      case "DONE":
        return "설치 완료!";
      case "ERROR":
        return "설치 오류 발생!";
      default:
        return "준비 중...";
    }
  };

  const isCompleted =
    stageStatus === "completed" &&
    currentIndex === totalCount - 1 &&
    progress >= 100;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">패키지 설치 중</h1>
          <p className="text-muted-foreground">
            {isFailed ? "작업 중 오류가 발생했습니다." : "잠시만 기다려주세요..."}
          </p>
          {totalCount > 1 && (
            <p className="text-sm text-muted-foreground">
              총 {totalCount}대 중 {currentIndex + 1}번째 VM 설치 중입니다.
            </p>
          )}
        </div>

        <div className="relative">
          <Progress value={overallProgress} className="h-3 bg-gray-200" />

          <div
            className="absolute -top-8 transition-all duration-150 ease-linear"
            style={{
              left: `${overallProgress}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="text-4xl animate-bounce">
              {isFailed ? "🙁" : isCompleted ? "🎉" : "📦"}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-2xl font-semibold text-primary">
            {overallProgress}%
          </p>
          <p className="text-sm text-muted-foreground">{description}</p>
          <p className="text-xs text-muted-foreground font-medium">
            {stageMessage()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function InstallingPackagePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
          <div className="w-full max-w-md space-y-4 text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              패키지 설치 화면 준비 중...
            </h1>
            <p className="text-muted-foreground text-sm">잠시만 기다려 주세요.</p>
          </div>
        </div>
      }
    >
      <InstallingPackageContent />
    </Suspense>
  );
}
