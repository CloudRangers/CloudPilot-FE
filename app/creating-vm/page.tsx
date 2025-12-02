"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Progress } from "@/components/ui/progress";
import { apiClient } from "@/lib/api/base-client";
import type {
  ProvisionResultMessage,
  NewlyCreatedVmInfo,
} from "@/lib/types/provision";

/** ===== 타입 ===== */

// BE 케이스를 넓게 잡아서 두 가지 형태 다 대응
// 1) { status, progress, message }
// 2) { success, message, data: { status, progress } }
interface JobDataShape {
  status?: string | null;
  progress?: number | null;
  message?: string | null;
}

interface JobApiResponse {
  success?: boolean;
  message?: string;
  data?: JobDataShape;
  status?: string;
  progress?: number;
}

type JobStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "ERROR" | null;

/** ===== 컴포넌트 ===== */

export default function CreatingVMPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams?.get("jobId");

  const [progress, setProgress] = useState(0);
  const [jobStatus, setJobStatus] = useState<JobStatus>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  const stopAllTimers = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  };

  const closeSse = () => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
  };

  /** 1) 진행바 애니메이션 (백엔드와 무관하게 95%까지) */
  useEffect(() => {
    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95;
        return prev + 1;
      });
    }, 200);

    return () => {
      stopAllTimers();
      closeSse();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 2) job 상태 폴링 (기존 로직 유지) */
  useEffect(() => {
    if (!jobId) return;

    const fetchJob = async () => {
      try {
        const res = await apiClient.get<JobApiResponse>(`/jobs/${jobId}`);
        const raw = res.data;

        // success 플래그가 있는데 false면 바로 에러 처리
        if (raw && raw.success === false) {
          stopAllTimers();
          setJobStatus("ERROR");
          setErrorMessage(
            raw.message || "VM 생성 중 서버 내부 오류가 발생했습니다.",
          );
          return;
        }

        const data: JobDataShape = raw?.data ?? raw ?? {};
        const status = (data.status ?? raw.status ?? null) as JobStatus;
        const serverProgress =
          typeof data.progress === "number"
            ? data.progress
            : typeof raw.progress === "number"
            ? raw.progress
            : null;

        if (serverProgress != null) {
          setProgress((prev) =>
            serverProgress > prev ? serverProgress : prev,
          );
        }

        setJobStatus(status);

        if (status === "SUCCESS") {
          stopAllTimers();
          setProgress(100);

          setTimeout(() => {
            router.replace(`/vm-complete?jobId=${jobId}`);
          }, 800);
        } else if (status === "FAILED") {
          stopAllTimers();
          setErrorMessage(
            data.message ||
              raw.message ||
              "VM 생성이 실패했습니다. 관리자에게 문의해주세요.",
          );
        }
      } catch (err: any) {
        console.error("[CreatingVM] job 조회 실패:", err);
        stopAllTimers();

        const msgFromServer =
          err?.response?.data?.message ||
          "서버와 통신 중 오류가 발생했습니다.";

        setErrorMessage(msgFromServer);
        setJobStatus("ERROR");
      }
    };

    // 최초 1번 + 5초마다 폴링
    fetchJob();
    pollingTimerRef.current = setInterval(fetchJob, 5000);

    return () => {
      stopAllTimers();
      closeSse();
    };
  }, [jobId, router]);

  /** 3) SSE 스트림 연결 (ProvisionResultMessage) */
  useEffect(() => {
    if (!jobId) return;

    const base =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

    const es = new EventSource(
      `${base}/vm/provision/stream?jobId=${encodeURIComponent(jobId)}`,
    );
    sseRef.current = es;

    es.onmessage = (event) => {
      try {
        const data: ProvisionResultMessage = JSON.parse(event.data);
        console.log("[SSE] provision message:", data);

        // lastProvisionResult 에 항상 최신 이벤트 저장
        window.localStorage.setItem(
          "lastProvisionResult",
          JSON.stringify(data),
        );

        // SUCCESS / ERROR 인 경우 newlyCreatedVM 업데이트 시도
        if (data.eventType === "SUCCESS" || data.eventType === "ERROR") {
          const existingStr = window.localStorage.getItem("newlyCreatedVM");
          let merged: NewlyCreatedVmInfo = {};

          if (existingStr) {
            try {
              merged = JSON.parse(existingStr) as NewlyCreatedVmInfo;
            } catch (e) {
              console.warn("failed to parse existing newlyCreatedVM", e);
            }
          }

          const instanceCount = data.instances?.length ?? merged.count;

          const updated: NewlyCreatedVmInfo = {
            ...merged,
            jobId: data.jobId ?? merged.jobId ?? jobId,
            status: data.status ?? merged.status,
            instances: data.instances ?? merged.instances,
            count: instanceCount ?? merged.count,
          };

          window.localStorage.setItem(
            "newlyCreatedVM",
            JSON.stringify(updated),
          );
        }

        // 진행 상태 텍스트용
        if (data.eventType === "LOG") {
          setJobStatus("RUNNING");
        }

        if (data.eventType === "SUCCESS") {
          // 최종 성공
          stopAllTimers();
          setJobStatus("SUCCESS");
          setProgress(100);

          closeSse();

          setTimeout(() => {
            router.replace(`/vm-complete?jobId=${jobId}`);
          }, 500);
        } else if (data.eventType === "ERROR") {
          // 최종 실패
          stopAllTimers();
          closeSse();

          setJobStatus("FAILED");
          setErrorMessage(
            data.message || "VM 생성 중 오류가 발생했습니다. (SSE)",
          );

          setTimeout(() => {
            router.replace(`/vm-failed?jobId=${jobId}`);
          }, 500);
        }
      } catch (e) {
        console.error("[SSE] invalid message:", event.data, e);
      }
    };

    es.onerror = (err) => {
      console.error("[SSE] error:", err);
      // 네트워크 문제 등으로 끊기면 일단 닫고, 폴링만으로도 동작 가능
      closeSse();
    };

    return () => {
      closeSse();
    };
  }, [jobId, router]);

  /** ===== UI용 텍스트 ===== */

  const renderStatusText = () => {
    if (!jobId) return "jobId가 전달되지 않았습니다.";
    if (errorMessage) return errorMessage;
    if (jobStatus === "FAILED") return "VM 생성이 실패했습니다.";
    if (jobStatus === "SUCCESS") return "VM 생성이 완료되었습니다.";
    return "잠시만 기다려주세요...";
  };

  const renderStepText = () => {
    if (errorMessage) return "에러가 발생하여 작업이 중단되었습니다.";
    if (progress < 30) return "서버 리소스 할당 중...";
    if (progress < 60) return "운영체제 설치 중...";
    if (progress < 90) return "네트워크 구성 중...";
    if (progress < 100) return "최종 설정 중...";
    return jobStatus === "SUCCESS"
      ? "VM 생성이 완료되었습니다."
      : "처리를 마무리하는 중입니다...";
  };

  /** ===== JSX ===== */

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-xl space-y-8 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              가상머신 생성 중
            </h1>
            <p
              className={
                errorMessage
                  ? "text-sm text-destructive"
                  : "text-muted-foreground"
              }
            >
              {renderStatusText()}
            </p>
            {jobId && (
              <p className="text-xs text-muted-foreground mt-1">
                Job ID: <span className="font-mono">{jobId}</span>
              </p>
            )}
          </div>

          <div className="relative">
            <Progress value={progress} className="h-3" />
            <div
              className="absolute -top-8 transition-all duration-150 ease-linear"
              style={{ left: `${progress}%`, transform: "translateX(-50%)" }}
            >
              <div className="text-4xl animate-bounce">🚶</div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-2xl font-semibold text-primary">
              {progress}%
            </p>
            <p className="text-sm text-muted-foreground">{renderStepText()}</p>

            {errorMessage && (
              <button
                type="button"
                className="mt-4 text-xs underline text-muted-foreground"
                onClick={() => router.push("/create-vm")}
              >
                VM 생성으로 돌아가기
              </button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
