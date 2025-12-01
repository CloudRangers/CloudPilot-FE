"use client"

import { useEffect, useMemo, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Progress } from "@/components/ui/progress"

type ProvisionStatus = "RUNNING" | "SUCCEEDED" | "FAILED"

interface ProvisionProgressPayload {
  jobId: string
  stage?: string
  description?: string
  progress?: number
  elapsedSeconds?: number
  vmIpAddress?: string
  status?: ProvisionStatus
  logLine?: string
}

/**
 * 실제 로직이 들어 있는 컴포넌트
 * - useSearchParams 사용
 * - SSE 구독 및 진행률 표시
 */
function CreatingVMContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const rawJobIds = searchParams.get("jobIds")
  const singleJobIdParam = searchParams.get("jobId")
  const batchId = searchParams.get("batchId")

  // 단일/배치 모두 지원: ?jobId=123 또는 ?jobIds=123,124
  const jobIds = useMemo<string[]>(() => {
    if (rawJobIds && rawJobIds.trim().length > 0) {
      return rawJobIds
          .split(",")
          .map((id) => id.trim())
          .filter((id) => id.length > 0)
    }
    if (singleJobIdParam) {
      return [singleJobIdParam]
    }
    return []
  }, [rawJobIds, singleJobIdParam])

  const totalCount = jobIds.length

  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<ProvisionStatus>("RUNNING")
  const [description, setDescription] = useState("서버 리소스 할당 중...")

  const currentJobId = jobIds[currentIndex] ?? null
  const isFailed = status === "FAILED"

  // job 목록이 바뀌면 무조건 첫 번째부터 다시 시작
  useEffect(() => {
    setCurrentIndex(0)
  }, [rawJobIds, singleJobIdParam])

  useEffect(() => {
    if (!currentJobId) {
      setStatus("FAILED")
      setDescription("진행 중인 작업(jobId)을 찾을 수 없습니다.")
      return
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
    if (!apiBaseUrl) {
      setStatus("FAILED")
      setDescription("API 서버 주소(NEXT_PUBLIC_API_BASE_URL)가 설정되지 않았습니다.")
      return
    }

    // 새 job 시작할 때 기본 상태 초기화
    setProgress(0)
    setStatus("RUNNING")
    if (totalCount > 1) {
      setDescription(`총 ${totalCount}대 중 ${currentIndex + 1}번째 VM 생성 중입니다.`)
    } else {
      setDescription("서버 리소스 할당 중...")
    }

    const es = new EventSource(`${apiBaseUrl}/sse/provision/${currentJobId}`)

    const handleProgress = (event: MessageEvent) => {
      const data = JSON.parse(event.data) as ProvisionProgressPayload

      if (typeof data.progress === "number") {
        setProgress(data.progress)
      }
      if (data.description) {
        setDescription(data.description)
      }
      if (data.status) {
        setStatus(data.status)
      }
    }

    const handleComplete = (event: MessageEvent) => {
      const data = JSON.parse(event.data) as ProvisionProgressPayload

      setProgress(typeof data.progress === "number" ? data.progress : 100)
      if (data.description) {
        setDescription(data.description)
      }

      // 아직 남은 VM이 있다면 다음 job으로 넘어감
      if (currentIndex < totalCount - 1) {
        es.close()
        setCurrentIndex((prev) => prev + 1)
        return
      }

      // 마지막 VM 생성 완료 → 멤버 할당 페이지로 이동
      setStatus("SUCCEEDED")
      es.close()

      setTimeout(() => {
        if (batchId) {
          // 배치 생성이면 batchId 기준으로 멤버 할당
          router.push(`/assign-member?batchId=${batchId}`)
        } else if (currentJobId) {
          // 단일 생성이면 jobId 기준
          router.push(`/assign-member?jobId=${currentJobId}`)
        } else {
          router.push("/assign-member")
        }
      }, 500)
    }

    // Spring SseEmitter에서 name("error")로 보낸 이벤트 처리
    const handleProvisionErrorEvent = (event: Event) => {
      const msgEvent = event as MessageEvent
      if (msgEvent.data) {
        try {
          const data = JSON.parse(msgEvent.data) as ProvisionProgressPayload
          if (data.description) {
            setDescription(data.description)
          }
        } catch {
          // ignore
        }
      }

      setStatus("FAILED")
      es.close()
    }

    es.addEventListener("progress", handleProgress)
    es.addEventListener("complete", handleComplete)
    es.addEventListener("error", handleProvisionErrorEvent)

    es.onopen = () => {
      console.info("SSE 연결 성공:", currentJobId)
    }

    es.onerror = (event) => {
      console.error("SSE 연결 오류:", event)
      // 실제 작업 실패 여부는 서버에서 보내는 error 이벤트로 판단
    }

    return () => {
      es.close()
    }
  }, [currentJobId, currentIndex, totalCount, batchId, router])

  if (totalCount === 0) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
          <div className="w-full max-w-md space-y-4 text-center">
            <h1 className="text-2xl font-bold tracking-tight">작업 정보를 찾을 수 없습니다</h1>
            <p className="text-muted-foreground text-sm">
              유효한 jobId 또는 jobIds 파라미터가 필요합니다.
            </p>
          </div>
        </div>
    )
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
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
  )
}

export default function CreatingVMPage() {
  return (
      <Suspense
          fallback={
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
              <div className="w-full max-w-md space-y-4 text-center">
                <h1 className="text-2xl font-bold tracking-tight">가상머신 생성 화면 준비 중...</h1>
                <p className="text-muted-foreground text-sm">잠시만 기다려 주세요.</p>
              </div>
            </div>
          }
      >
        <CreatingVMContent />
      </Suspense>
  )
}
