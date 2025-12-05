"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Progress } from "@/components/ui/progress";

type ProvisionStatus = "RUNNING" | "SUCCEEDED" | "FAILED";

interface ProvisionProgressPayload {
  jobId: string;
  stage?: string;
  description?: string;
  progress?: number;
  elapsedSeconds?: number;
  vmIpAddress?: string;
  status?: ProvisionStatus;
  logLine?: string;
}

/**
 * 실제 로직이 들어 있는 컴포넌트
 * - useSearchParams 사용
 * - SSE 구독 및 진행률 표시
 */
function CreatingVMContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawJobIds = searchParams.get("jobIds");
  const singleJobIdParam = searchParams.get("jobId");
  const batchId = searchParams.get("batchId");

  // 단일/배치 모두 지원: ?jobId=123 또는 ?jobIds=123,124
  const jobIds = useMemo<string[]>(() => {
    if (rawJobIds && rawJobIds.trim().length > 0) {
      return rawJobIds
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id.length > 0);
    }
    if (singleJobIdParam) {
      return [singleJobIdParam];
    }
    return [];
  }, [rawJobIds, singleJobIdParam]);

  const totalCount = jobIds.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<ProvisionStatus>("RUNNING");
  const [description, setDescription] = useState("서버 리소스 할당 중...");

  const currentJobId = jobIds[currentIndex] ?? null;
  const isFailed = status === "FAILED";

  // job 목록이 바뀌면 무조건 첫 번째부터 다시 시작
  useEffect(() => {
    setCurrentIndex(0);
  }, [rawJobIds, singleJobIdParam]);

  // ... 위쪽 코드는 그대로 두고

  useEffect(() => {
    if (!currentJobId) {
      setStatus("FAILED");
      setDescription("진행 중인 작업(jobId)을 찾을 수 없습니다.");
      return;
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl) {
      setStatus("FAILED");
      setDescription(
        "API 서버 주소(NEXT_PUBLIC_API_BASE_URL)가 설정되지 않았습니다."
      );
      return;
    }

    // 새 job 시작할 때 기본 상태 초기화
    setProgress(0);
    setStatus("RUNNING");
    if (totalCount > 1) {
      setDescription(
        `총 ${totalCount}대 중 ${currentIndex + 1}번째 VM 생성 중입니다.`
      );
    } else {
      setDescription("서버 리소스 할당 중...");
    }

    console.log("[CreatingVM] SSE 연결 시도, jobId =", currentJobId);

    const es = new EventSource(`${apiBaseUrl}/sse/provision/${currentJobId}`);

    // ✅ progress 이벤트: JSON.parse 안전하게
    const handleProgress = (event: MessageEvent) => {
      let data: ProvisionProgressPayload | null = null;

      try {
        data = JSON.parse(event.data) as ProvisionProgressPayload;
      } catch (e) {
        console.warn(
          "[CreatingVM] progress 이벤트 JSON 파싱 실패, raw data =",
          event.data,
          e
        );
        // JSON이 아니면 그냥 무시 (바 UI만 안깨지게)
        return;
      }

      if (typeof data.progress === "number") {
        setProgress(data.progress);
      }
      if (data.description) {
        setDescription(data.description);
      }
      if (data.status) {
        setStatus(data.status);
      }
    };

    // ✅ complete 이벤트: JSON.parse 안전하게
    const handleComplete = (event: MessageEvent) => {
      let data: ProvisionProgressPayload | null = null;

      try {
        data = JSON.parse(event.data) as ProvisionProgressPayload;
      } catch (e) {
        console.warn(
          "[CreatingVM] complete 이벤트 JSON 파싱 실패, raw data =",
          event.data,
          e
        );
        // 마지막 complete인데 JSON이 아니면 그냥 100% 처리 + generic 메시지
        setProgress(100);
        setDescription("가상머신 생성이 완료되었습니다.");
        setStatus("SUCCEEDED");
      }

      if (data) {
        setProgress(
          typeof data.progress === "number" ? data.progress : 100
        );
        if (data.description) {
          setDescription(data.description);
        }
      }

      // 아직 남은 VM이 있다면 다음 job으로 넘어감
      if (currentIndex < totalCount - 1) {
        console.log(
          "[CreatingVM] 현재 job 완료, 다음 job으로 이동:",
          currentIndex + 1,
          "/",
          totalCount
        );
        es.close();
        setCurrentIndex((prev) => prev + 1);
        return;
      }

      // 마지막 VM 생성 완료 → 멤버 할당 페이지로 이동
      setStatus("SUCCEEDED");
      es.close();
      console.log("[CreatingVM] 모든 VM 생성 완료, assign-member로 이동");

      setTimeout(() => {
        if (batchId) {
          router.push(`/assign-member?batchId=${batchId}`);
        } else if (currentJobId) {
          router.push(`/assign-member?jobId=${currentJobId}`);
        } else {
          router.push("/assign-member");
        }
      }, 500);
    };

    // ✅ 서버에서 name("error")로 보낸 이벤트 처리 + vm-failed 연동
    const handleProvisionErrorEvent = (event: Event) => {
      const msgEvent = event as MessageEvent;
      let payload: any | null = null;

      if (msgEvent.data) {
        try {
          payload = JSON.parse(msgEvent.data);
          if (payload.description) {
            setDescription(payload.description);
          } else {
            setDescription("가상머신 생성 중 오류가 발생했습니다.");
          }
        } catch (e) {
          console.warn(
            "[CreatingVM] error 이벤트 JSON 파싱 실패, raw data =",
            msgEvent.data,
            e
          );
          setDescription("가상머신 생성 중 알 수 없는 오류가 발생했습니다.");
        }
      } else {
        setDescription("가상머신 생성 중 오류가 발생했습니다.");
      }

      setStatus("FAILED");
      // 실패 시에도 진행률 바를 끝까지 채우고 싶으면 100으로
      setProgress((prev) => (prev > 0 ? prev : 100));

      es.close();
      console.warn("[CreatingVM] SSE error 이벤트 수신, 연결 종료");

      // 🔥 vm-failed에서 볼 수 있게 lastProvisionResult 저장
      if (payload) {
        try {
          localStorage.setItem("lastProvisionResult", JSON.stringify(payload));
        } catch {
          // localStorage 실패해도 앱이 죽진 않게 무시
        }
      }

      // 🔥 실패 페이지로 라우팅
      const nextJobId = currentJobId;
      router.replace(nextJobId ? `/vm-failed?jobId=${nextJobId}` : "/vm-failed");
    };

    es.addEventListener("progress", handleProgress);
    es.addEventListener("complete", handleComplete);
    es.addEventListener("error", handleProvisionErrorEvent);

    es.onopen = () => {
      console.info("[CreatingVM] SSE 연결 성공:", currentJobId);
    };

    // 네트워크 레벨 오류만 조용히 경고 로그로 남김
    es.onerror = (event) => {
      console.warn("SSE 네트워크 오류(연결 종료):", event);
      // 실제 작업 실패 여부는 서버에서 보내는 error 이벤트로 처리
    };

    return () => {
      console.log("[CreatingVM] SSE 연결 해제, jobId =", currentJobId);
      es.close();
    };
  }, [currentJobId, currentIndex, totalCount, batchId, router]);


  if (totalCount === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            작업 정보를 찾을 수 없습니다
          </h1>
          <p className="text-muted-foreground text-sm">
            유효한 jobId 또는 jobIds 파라미터가 필요합니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">가상머신 생성 중</h1>
          <p className="text-muted-foreground">
            {isFailed ? "작업 중 오류가 발생했습니다." : "잠시만 기다려주세요..."}
          </p>
          {totalCount > 1 && (
            <p className="text-xs text-muted-foreground">
              총 {totalCount}대 중 {currentIndex + 1}번째 VM 생성 중입니다.
            </p>
          )}
        </div>

        <div className="relative">
          <Progress value={progress} className="h-3" />

          <div
            className="absolute -top-8 transition-all duration-150 ease-linear"
            style={{ left: `${progress}%`, transform: "translateX(-50%)" }}
          >
            <div className="text-4xl animate-bounce">
              {isFailed ? "🙁" : "💻"}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-2xl font-semibold text-primary">{progress}%</p>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CreatingVMPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
          <div className="w-full max-w-md space-y-4 text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              가상머신 생성 화면 준비 중...
            </h1>
            <p className="text-muted-foreground text-sm">
              잠시만 기다려 주세요.
            </p>
          </div>
        </div>
      }
    >
      <CreatingVMContent />
    </Suspense>
  );
}
