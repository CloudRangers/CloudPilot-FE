"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FeatureCard } from "@/components/feature-card"
import { ServerCog, Package, FileCheck, LockKeyhole } from "lucide-react"

export default function HomePage() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [featuresToShow, setFeaturesToShow] = useState<any[]>([])

  /** ✅ featureMap 정의 */
  const featureMap: Record<
    string,
    { title: string; description: string; icon: any; href: string }[]
  > = {
    ADMIN: [
      {
        title: "관리자 대시보드",
        description: "모든 팀의 인프라 리소스를 한눈에 모니터링하세요.",
        icon: ServerCog,
        href: "/admin",
      },
      {
        title: "패키지 승인 관리",
        description: "각 팀의 패키지 요청을 검토하고 승인할 수 있습니다.",
        icon: FileCheck,
        href: "/approval",
      },
    ],
    HEAD: [
      {
        title: "서버 생성",
        description: "필요한 서버를 빠르게 생성하고 배포합니다.",
        icon: ServerCog,
        href: "/create-vm",
      },
      {
        title: "패키지 설치",
        description: "자동화된 설치 프로세스로 빠르게 패키지를 구성하세요.",
        icon: Package,
        href: "/install-package?mode=select",
      },
      {
        title: "패키지 신청",
        description: "새로운 리소스 요청 및 승인 진행 상황을 확인하세요.",
        icon: FileCheck,
        href: "/request-package",
      },
    ],
    LEADER: [
      {
        title: "서버 생성",
        description: "팀 리더 권한으로 서버를 생성하고 관리합니다.",
        icon: ServerCog,
        href: "/create-vm",
      },
      {
        title: "패키지 설치",
        description: "팀 내 서버에 필요한 패키지를 구성합니다.",
        icon: Package,
        href: "/install-package?mode=select",
      },
      {
        title: "패키지 신청",
        description: "필요한 패키지를 신청하고 상태를 확인하세요.",
        icon: FileCheck,
        href: "/request-package",
      },
    ],
    MEMBER: [
      {
        title: "패키지 신청",
        description: "필요한 패키지나 리소스를 신청하고 진행 상황을 추적하세요.",
        icon: FileCheck,
        href: "/request-package",
      },
    ],
  }

  /** ✅ 로그인 상태 실시간 반영 */
  useEffect(() => {
    const checkLoginStatus = () => {
      const storedRole = localStorage.getItem("userRole")
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
      setIsLoggedIn(isLoggedIn)
      setUserRole(storedRole)
      setFeaturesToShow(featureMap[storedRole ?? ""] ?? [])
    }

    // ✅ 초기 로드
    checkLoginStatus()
    // ✅ 다른 탭/컴포넌트에서 localStorage 변경 시 실시간 반영
    window.addEventListener("storage", checkLoginStatus)
    return () => window.removeEventListener("storage", checkLoginStatus)
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="container px-4 py-12 md:px-6 md:py-20">
          <div className="mx-auto max-w-3xl text-center space-y-4 mb-16">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-balance">
              인프라 자동 생성으로
              <br />
              <span className="text-primary">더 빠른 배포</span>를 경험하세요
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed text-pretty">
              Cloud Pilot은 복잡한 인프라 설정을 자동화하여 팀이 비즈니스 로직에 집중할 수 있도록 돕습니다.
            </p>
          </div>

          {/* ✅ 로그인 상태별 분기 */}
          {!isLoggedIn ? (
            <div className="flex justify-center mt-12">
              <FeatureCard
                title="로그인이 필요합니다"
                description="서비스 기능을 사용하려면 먼저 로그인하세요."
                icon={LockKeyhole}
                href="/login"
              />
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-20">
              {featuresToShow.map((feature, index) => (
                <FeatureCard
                  key={index}
                  title={feature.title}
                  description={feature.description}
                  icon={feature.icon}
                  href={feature.href}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
