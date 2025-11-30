"use client"

import { useEffect, useState } from "react"
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

export default function CreatingVMPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobId = searchParams.get("jobId")

  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<ProvisionStatus>("RUNNING")
  const [description, setDescription] = useState("서버 리소스 할당 중...")
  const [logLine, setLogLine] = useState<string | null>(null) // 지금은 UI에 안 씀

  useEffect(() => {
    if (!jobId) {
      setStatus("FAILED")
      setDescription("jobId가 없어 작업을 시작할 수 없습니다.")
      return
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
    if (!apiBaseUrl) {
      setStatus("FAILED")
      setDescription("API 서버 주소(NEXT_PUBLIC_API_BASE_URL)가 설정되지 않았습니다.")
      return
    }

    const es = new EventSource(`${apiBaseUrl}/sse/provision/${jobId}`)

    const handleProgress = (event: MessageEvent) => {
      const data = JSON.parse(event.data) as ProvisionProgressPayload

      if (typeof data.progress === "number") {
        setProgress(data.progress)
      }
      if (data.description) {
        setDescription(data.description)
      }
      if (data.logLine) {
        setLogLine(data.logLine)
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
      if (data.logLine) {
        setLogLine(data.logLine)
      }
      setStatus("SUCCEEDED")

      setTimeout(() => {
        router.push("/assign-member")
      }, 500)

      es.close()
    }

    const handleErrorEvent = (event: Event) => {
      const msgEvent = event as MessageEvent
      if (msgEvent.data) {
        try {
          const data = JSON.parse(msgEvent.data) as ProvisionProgressPayload
          if (data.description) {
            setDescription(data.description)
          }
          if (data.logLine) {
            setLogLine(data.logLine)
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
    es.addEventListener("error", handleErrorEvent)

    es.onopen = () => {
      // 연결 성공 시 필요하면 description 업데이트 가능
    }

    return () => {
      es.close()
    }
  }, [jobId, router])

  const isFailed = status === "FAILED"

  return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">가상머신 생성 중</h1>
            <p className="text-muted-foreground">
              {isFailed ? "작업 중 오류가 발생했습니다." : "잠시만 기다려주세요..."}
            </p>
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
