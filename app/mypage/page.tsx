"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function MyPageRouter() {
  const router = useRouter()

  useEffect(() => {
    // 로컬스토리지에서 role 가져오기
    const role = localStorage.getItem("userRole")

    // role이 없을 때 (비로그인 사용자)
    if (!role) {
      router.replace("/login")
      return
    }

    // 역할별로 라우팅
    switch (role.toUpperCase()) {
      case "ADMIN":
        router.replace("/admin")
        break
      case "HEAD":
        router.replace("/head-mypage")
        break
      case "LEADER":
        router.replace("/team-leader-mypage")
        break
      case "MEMBER":
      default:
        router.replace("/member-mypage")
        break
    }
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      <p>🔄 페이지로 이동 중입니다...</p>
    </div>
  )
}
