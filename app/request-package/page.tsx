"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle, Plus, X } from "lucide-react"

interface PackageRequest {
  id: string
  name: string
  version: string
  reason: string
}

export default function RequestPackagePage() {
  const [packages, setPackages] = useState<PackageRequest[]>([{ id: "1", name: "", version: "", reason: "" }])

  const addPackage = () => {
    const newPackage: PackageRequest = {
      id: Date.now().toString(),
      name: "",
      version: "",
      reason: "",
    }
    setPackages([...packages, newPackage])
  }

  const removePackage = (id: string) => {
    if (packages.length > 1) {
      setPackages(packages.filter((pkg) => pkg.id !== id))
    }
  }

  const updatePackage = (id: string, field: keyof PackageRequest, value: string) => {
    setPackages(packages.map((pkg) => (pkg.id === id ? { ...pkg, [field]: value } : pkg)))
  }

  const handleSubmit = () => {
    const isValid = packages.every((pkg) => pkg.name.trim() !== "")
    if (isValid) {
      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || '{"name": "홍길동", "employeeId": "2024001", "role": "employee"}',
      )

      const existingRequests = JSON.parse(localStorage.getItem("packageRequests") || "[]")
      const newRequest = {
        id: Date.now().toString(),
        packages: packages,
        firstApprovalStatus: currentUser.role === "team-leader" ? "approved" : "pending",
        finalApprovalStatus: "pending",
        requestDate: new Date().toISOString(),
        requester: currentUser.name || "홍길동",
        employeeId: currentUser.employeeId || "2024001",
        requesterRole: currentUser.role || "employee",
      }
      localStorage.setItem("packageRequests", JSON.stringify([...existingRequests, newRequest]))

      const notifications = JSON.parse(localStorage.getItem("notifications") || "[]")
      notifications.push({
        id: Date.now().toString(),
        type: currentUser.role === "team-leader" ? "manager_package_request" : "team_leader_package_request",
        title: "패키지 신청 도착",
        message: `${currentUser.name}님이 ${packages.length}개의 패키지 신청을 제출했습니다.`,
        requestId: newRequest.id,
        timestamp: new Date().toISOString(),
        read: false,
      })
      localStorage.setItem("notifications", JSON.stringify(notifications))

      alert("패키지 신청이 제출되었습니다!")
      setPackages([{ id: "1", name: "", version: "", reason: "" }])
    } else {
      alert("모든 패키지 이름을 입력해주세요.")
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <Header />

      <main className="flex-1">
        <div className="container px-4 py-8 md:px-6 md:py-12">
          <div className="mx-auto max-w-6xl">
            <div className="space-y-3 text-center mb-8">
              <div className="flex items-center justify-center gap-3">
                <div className="rounded-xl bg-primary/10 p-3">
                  <svg
                    className="h-8 w-8 text-primary"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                  </svg>
                </div>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">패키지 신청</h1>
              </div>
              <p className="text-muted-foreground">필요한 패키지 정보를 입력하고 승인을 요청하세요</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                <Card className="border-2 border-primary/30 shadow-lg overflow-hidden">
                  <div className="border-b bg-muted/30 px-6 py-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">패키지 목록</h2>
                      <p className="text-sm text-muted-foreground">{packages.length}개의 패키지 신청</p>
                    </div>
                    <Button
                      onClick={addPackage}
                      size="lg"
                      className="bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg transition-all"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      패키지 추가
                    </Button>
                  </div>

                  <div className="p-6 space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
                    {packages.map((pkg, index) => (
                      <div
                        key={pkg.id}
                        className="rounded-xl border-2 bg-background p-6 space-y-4 hover:border-primary/50 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                              {index + 1}
                            </div>
                            <h3 className="text-lg font-semibold">패키지 {index + 1}</h3>
                          </div>
                          {packages.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removePackage(pkg.id)}
                              className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                              패키지 이름
                              <span className="rounded bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">
                                필수
                              </span>
                            </label>
                            <Input
                              placeholder={`예: 패키지 이름 ${index + 1}`}
                              value={pkg.name}
                              onChange={(e) => updatePackage(pkg.id, "name", e.target.value)}
                              className="border-2 focus-visible:ring-primary"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">버전</label>
                            <Input
                              placeholder="예: 1.0.0"
                              value={pkg.version}
                              onChange={(e) => updatePackage(pkg.id, "version", e.target.value)}
                              className="border-2 focus-visible:ring-primary"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">패키지 간단 사유</label>
                            <Textarea
                              placeholder="패키지가 필요한 이유를 간단히 설명해주세요"
                              value={pkg.reason}
                              onChange={(e) => updatePackage(pkg.id, "reason", e.target.value)}
                              className="min-h-[100px] border-2 focus-visible:ring-primary resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="space-y-4">
                <Card className="border-2 shadow-lg">
                  <div className="border-b bg-muted/30 px-6 py-4">
                    <h3 className="font-semibold">승인 담당자</h3>
                    <p className="text-xs text-muted-foreground mt-1">2단계 승인 프로세스</p>
                  </div>
                  <div className="p-6 space-y-6">
                    {/* Team Leader - First Approval */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted-foreground/20 text-xs font-bold text-muted-foreground">
                          1
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          1차 승인
                        </span>
                      </div>
                      <div className="rounded-lg border-2 border-muted-foreground/20 bg-muted/30 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted-foreground/10 text-lg font-semibold text-muted-foreground">
                            OO
                          </div>
                          <div>
                            <p className="font-medium text-foreground">OO 팀장</p>
                            <p className="text-xs text-muted-foreground">1차 승인 담당</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <div className="flex justify-center">
                      <div className="flex flex-col items-center gap-1">
                        <svg
                          className="h-4 w-4 text-muted-foreground/50"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                        <div className="h-6 w-0.5 bg-gradient-to-b from-muted-foreground/20 to-muted-foreground/50" />
                      </div>
                    </div>

                    {/* Manager - Final Approval */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          2
                        </div>
                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">최종 승인</span>
                      </div>
                      <div className="rounded-lg border-2 border-primary/50 bg-primary/5 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground shadow-md">
                            OO
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">OO 부장</p>
                            <p className="text-xs text-muted-foreground">최종 승인 권한자</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        onClick={handleSubmit}
                        size="lg"
                        className="w-full bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all"
                      >
                        <svg
                          className="mr-2 h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="22" y1="2" x2="11" y2="13"></line>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                        전송
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card className="border-2 shadow-lg bg-muted/30">
                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      <span>도움이 필요하신가요?</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      패키지 신청에 대한 문의사항이 있으시면 담당자에게 연락하거나 채팅 상담을 이용해주세요.
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="container px-4 pb-8 md:px-6">
        <div className="mx-auto max-w-6xl flex justify-end">
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full border-2 bg-background shadow-xl hover:shadow-2xl hover:scale-110 transition-all relative group"
          >
            <MessageCircle className="h-6 w-6 text-primary" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse" />
          </Button>
        </div>
      </div>

      <div className="container px-4 pb-8 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={handleSubmit}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all px-8"
            >
              패키지 설치
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-2 shadow-lg hover:shadow-xl transition-all px-8 bg-transparent"
              onClick={() => {
                alert("VM만 생성합니다.")
              }}
            >
              무시하고 VM만 생성
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
