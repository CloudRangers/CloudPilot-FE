"use client"

import { ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCurrentUser } from "@/hooks/useCurrentUser"

interface Props {
  children: ReactNode
}

export function RequireAuth({ children }: Props) {
  const router = useRouter()
  const { isLoggedIn } = useCurrentUser()

  useEffect(() => {
    // 아직 user 정보 로딩 전이면 잠깐 대기
    if (isLoggedIn === false) {
      // 로그인 안 돼 있으면 로그인 페이지로
      router.replace("/login")
    }
  }, [isLoggedIn, router])

  if (!isLoggedIn) {
    // 간단한 로딩 UI
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        인증 상태 확인 중...
      </div>
    )
  }

  return <>{children}</>
}
