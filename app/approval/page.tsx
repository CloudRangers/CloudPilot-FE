"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ApprovalPage() {
  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem("userRole")

    if (role === "LEADER") {
      router.replace("/team-leader-approval")
    } else if (role === "HEAD" || role === "ADMIN") {
      router.replace("/head-approval")
    } else {
      alert("승인 권한이 없습니다.")
      router.replace("/")
    }
  }, [router])

  return null
}
