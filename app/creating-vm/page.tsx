"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"

export default function CreatingVMPage() {
  const router = useRouter()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            router.push("/assign-member")
          }, 500)
          return 100
        }
        return prev + 2
      })
    }, 100)

    return () => clearInterval(interval)
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">가상머신 생성 중</h1>
          <p className="text-muted-foreground">잠시만 기다려주세요...</p>
        </div>

        <div className="relative">
          <Progress value={progress} className="h-3" />

          {/* Walking character animation */}
          <div
            className="absolute -top-8 transition-all duration-100 ease-linear"
            style={{ left: `${progress}%`, transform: "translateX(-50%)" }}
          >
            <div className="text-4xl animate-bounce">🚶</div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-2xl font-semibold text-primary">{progress}%</p>
          <p className="text-sm text-muted-foreground">
            {progress < 30 && "서버 리소스 할당 중..."}
            {progress >= 30 && progress < 60 && "운영체제 설치 중..."}
            {progress >= 60 && progress < 90 && "네트워크 구성 중..."}
            {progress >= 90 && "최종 설정 중..."}
          </p>
        </div>
      </div>
    </div>
  )
}
