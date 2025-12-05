"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle, Plus, X } from "lucide-react"

import { pkgApi, type PkgRequestCreateRequest } from "@/lib/api/pkg"

interface PackageRequestFormRow {
  id: string
  name: string
  version: string
  reason: string
}

export default function RequestPackagePage() {
  const router = useRouter()

  const [packages, setPackages] = useState<PackageRequestFormRow[]>([
    { id: "1", name: "", version: "", reason: "" },
  ])

  const [submitting, setSubmitting] = useState(false)

  const addPackage = () => {
    const newPackage: PackageRequestFormRow = {
      id: Date.now().toString(),
      name: "",
      version: "",
      reason: "",
    }
    setPackages((prev) => [...prev, newPackage])
  }

  const removePackage = (id: string) => {
    if (packages.length <= 1) return
    setPackages((prev) => prev.filter((pkg) => pkg.id !== id))
  }

  const updatePackage = (
    id: string,
    field: keyof PackageRequestFormRow,
    value: string,
  ) => {
    setPackages((prev) =>
      prev.map((pkg) => (pkg.id === id ? { ...pkg, [field]: value } : pkg)),
    )
  }

  const handleSubmit = async () => {
    const isValid = packages.every((pkg) => pkg.name.trim() !== "")
    if (!isValid) {
      alert("모든 패키지 이름을 입력해주세요.")
      return
    }

    try {
      setSubmitting(true)

      // FE에서 입력된 각 패키지를 BE 요청으로 변환
      const requests: PkgRequestCreateRequest[] = packages.map((pkg) => ({
        packageName: pkg.name.trim(),
        packageVer: pkg.version.trim() || "latest", // 버전 없으면 기본값
        description: pkg.reason.trim() || undefined,
      }))

      // 하나씩 순차 호출 (실패 시 어떤 요청에서 터졌는지 로그로 확인하기 좋음)
      for (const req of requests) {
        await pkgApi.createRequest(req)
      }

      alert(`총 ${packages.length}개의 패키지 신청이 정상적으로 등록되었습니다.`)

      // 폼 초기화
      setPackages([{ id: "1", name: "", version: "", reason: "" }])

      // 내 신청 현황 페이지로 이동
      router.push("/package-status")
    } catch (e) {
      console.error("[request-package] submit error", e)
      const msg =
        e instanceof Error
          ? e.message
          : "패키지 신청 처리 중 오류가 발생했습니다."
      alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <Header />

      <main className="flex-1">
        <div className="container px-4 py-8 md:px-6 md:py-12">
          <div className="mx-auto max-w-6xl">
            {/* 헤더 영역 */}
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
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  패키지 신청
                </h1>
              </div>
              <p className="text-lg text-muted-foreground">
                필요한 패키지 정보를 입력하고 승인을 요청하세요
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              {/* 왼쪽: 패키지 입력 목록 */}
              <div className="space-y-4">
                <Card className="border-2 border-primary/30 shadow-lg overflow-hidden">
                  <div className="border-b bg-muted/30 px-6 py-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-semibold">패키지 목록</h2>
                      <p className="text-base text-muted-foreground">
                        {packages.length}개의 패키지 신청
                      </p>
                    </div>
                    <Button
                      onClick={addPackage}
                      size="lg"
                      type="button"
                      className="bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg transition-all"
                      disabled={submitting}
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
                            <h3 className="text-xl font-semibold">
                              패키지 {index + 1}
                            </h3>
                          </div>
                          {packages.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              type="button"
                              onClick={() => removePackage(pkg.id)}
                              className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              disabled={submitting}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-base font-medium flex items-center gap-2">
                              패키지 이름
                              <span className="rounded bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">
                                필수
                              </span>
                            </label>
                            <Input
                              placeholder={`예: 패키지 이름 ${index + 1}`}
                              value={pkg.name}
                              onChange={(e) =>
                                updatePackage(pkg.id, "name", e.target.value)
                              }
                              className="border-2 focus-visible:ring-primary"
                              disabled={submitting}
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-base font-medium">버전</label>
                            <Input
                              placeholder="예: 1.0.0 (비우면 latest)"
                              value={pkg.version}
                              onChange={(e) =>
                                updatePackage(
                                  pkg.id,
                                  "version",
                                  e.target.value,
                                )
                              }
                              className="border-2 focus-visible:ring-primary"
                              disabled={submitting}
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-base font-medium">
                              패키지 간단 사유
                            </label>
                            <Textarea
                              placeholder="패키지가 필요한 이유를 간단히 설명해주세요"
                              value={pkg.reason}
                              onChange={(e) =>
                                updatePackage(pkg.id, "reason", e.target.value)
                              }
                              className="min-h-[100px] border-2 focus-visible:ring-primary resize-none"
                              disabled={submitting}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* 오른쪽: 설명/승인 플로우/버튼 */}
              <div className="space-y-4">
                <Card className="border-2 shadow-lg">
                  <div className="border-b bg-muted/30 px-6 py-4">
                    <h3 className="font-semibold text-xl">승인 담당자</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      2단계 승인 프로세스 (팀장 → 부장)
                    </p>
                  </div>
                  <div className="p-6 space-y-6">
                    {/* 1차 승인 (팀장) */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted-foreground/20 text-xs font-bold text-muted-foreground">
                          1
                        </div>
                        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          1차 승인
                        </span>
                      </div>
                      <div className="rounded-lg border-2 border-muted-foreground/20 bg-muted/30 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted-foreground/10 text-lg font-semibold text-muted-foreground">
                            OO
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              OO 팀장
                            </p>
                            <p className="text-sm text-muted-foreground">
                              1차 승인 담당
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 화살표 */}
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

                    {/* 2차 승인 (부장) */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          2
                        </div>
                        <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                          최종 승인
                        </span>
                      </div>
                      <div className="rounded-lg border-2 border-primary/50 bg-primary/5 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground shadow-md">
                            OO
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              OO 부장
                            </p>
                            <p className="text-sm text-muted-foreground">
                              최종 승인 권한자
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        onClick={handleSubmit}
                        size="lg"
                        type="button"
                        disabled={submitting}
                        className="w-full bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-60"
                      >
                        {submitting ? "전송 중..." : "전송"}
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
                      패키지 신청에 대한 문의사항이 있으시면 담당자에게 연락하거나
                      채팅 상담을 이용해주세요.
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      

      <Footer />
    </div>
  )
}
