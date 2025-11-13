"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, MessageCircle, Check, Server } from "lucide-react"

interface PackageType {
  id: string
  name: string
  description: string
}

interface VMType {
  id: string
  name: string
  type: "public" | "private"
  specs: string
  count?: number
}

const AVAILABLE_PACKAGES: PackageType[] = [
  {
    id: "pkg-1",
    name: "패키지 이름1",
    description: "설명~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  },
  {
    id: "pkg-2",
    name: "패키지 이름2",
    description: "설명~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  },
  {
    id: "pkg-3",
    name: "패키지 이름3",
    description: "설명~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  },
  {
    id: "pkg-4",
    name: "패키지 이름4",
    description: "설명~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  },
  {
    id: "pkg-5",
    name: "패키지 이름5",
    description: "설명~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  },
]

const EXISTING_VMS: VMType[] = [
  {
    id: "vm-1",
    name: "Web Server 01",
    type: "public",
    specs: "리전: ap-northeast-2, 인스턴스: t3.medium, 스토리지: 50GB, OS: Ubuntu 22.04",
  },
  {
    id: "vm-2",
    name: "Database Server",
    type: "private",
    specs: "CPU: 4 vCPU, 메모리: 8GB, 저장공간: 100GB, OS: Ubuntu 22.04",
  },
  {
    id: "vm-3",
    name: "API Server 01",
    type: "public",
    specs: "리전: us-east-1, 인스턴스: t3.large, 스토리지: 100GB, OS: Amazon Linux 2",
  },
  {
    id: "vm-4",
    name: "Cache Server",
    type: "private",
    specs: "CPU: 2 vCPU, 메모리: 4GB, 저장공간: 25GB, OS: Ubuntu 22.04",
  },
]

export default function InstallPackagePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode") // URL 파라미터로 모드 확인

  const [packages, setPackages] = useState<PackageType[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPackages, setSelectedPackages] = useState<string[]>([])
  const [currentVM, setCurrentVM] = useState<VMType | null>(null)

  const [selectedVMs, setSelectedVMs] = useState<string[]>([])
  const [availableVMs, setAvailableVMs] = useState<VMType[]>([])

  useEffect(() => {
    if (mode === "select") {
      // 이미 생성된 VM 목록 로드
      setAvailableVMs(EXISTING_VMS)
    } else {
      // 방금 생성한 VM 정보 로드
      const newVMData = localStorage.getItem("newlyCreatedVM")
      if (newVMData) {
        const vmData = JSON.parse(newVMData)
        setCurrentVM(vmData)
      }
    }
  }, [mode])

  const handleDelete = (id: string) => {
    setPackages(packages.filter((pkg) => pkg.id !== id))
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
    setSelectedPackages([])
  }

  const togglePackageSelection = (id: string) => {
    setSelectedPackages((prev) => (prev.includes(id) ? prev.filter((pkgId) => pkgId !== id) : [...prev, id]))
  }

  const toggleVMSelection = (id: string) => {
    setSelectedVMs((prev) => (prev.includes(id) ? prev.filter((vmId) => vmId !== id) : [...prev, id]))
  }

  const handleAddSelectedPackages = () => {
    const packagesToAdd = AVAILABLE_PACKAGES.filter((pkg) => selectedPackages.includes(pkg.id))
    const newPackages = packagesToAdd.filter((pkg) => !packages.some((existingPkg) => existingPkg.id === pkg.id))
    setPackages([...packages, ...newPackages])
    setIsModalOpen(false)
    setSelectedPackages([])
  }

  const handleInstallPackages = () => {
    if (mode === "select") {
      if (packages.length === 0 || selectedVMs.length === 0) return
    } else {
      if (packages.length === 0 || !currentVM) return
      localStorage.removeItem("newlyCreatedVM")
    }
    router.push("/installing-package")
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <Header />

      <main className="flex-1">
        <div className="container px-4 py-8 md:px-6 md:py-12">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="space-y-3 text-center">
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
                    <rect x="1" y="3" width="15" height="13" rx="2" ry="2"></rect>
                    <path d="M10 3L21 14L19 18L8 9L4 15"></path>
                  </svg>
                </div>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">패키지 설치</h1>
              </div>
              <p className="text-muted-foreground">
                {mode === "select"
                  ? "VM을 선택하고 필요한 패키지를 설치하세요"
                  : "생성된 VM에 필요한 패키지를 설치하세요"}
              </p>
            </div>

            {mode === "select" ? (
              <Card className="overflow-hidden border-2 shadow-lg">
                <div className="border-b bg-muted/30 px-6 py-4">
                  <h2 className="text-xl font-semibold">가상머신 선택</h2>
                  <p className="text-sm text-muted-foreground">
                    패키지를 설치할 VM을 선택하세요 ({selectedVMs.length}개 선택됨)
                  </p>
                </div>
                <div className="p-6">
                  {availableVMs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="rounded-full bg-muted/50 p-6 mb-4">
                        <Server className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-medium text-muted-foreground">생성된 VM이 없습니다</p>
                      <p className="text-sm text-muted-foreground mt-2">먼저 VM을 생성해주세요</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {availableVMs.map((vm) => {
                        const isSelected = selectedVMs.includes(vm.id)
                        return (
                          <div
                            key={vm.id}
                            onClick={() => toggleVMSelection(vm.id)}
                            className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                              isSelected
                                ? "border-primary bg-primary/5 shadow-md"
                                : "border-transparent bg-card hover:border-muted hover:shadow-sm"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox checked={isSelected} className="mt-1" />
                              <div className="flex-1 space-y-1">
                                <p className="font-semibold">{vm.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {vm.type === "public" ? "퍼블릭" : "프라이빗"} VM
                                </p>
                                <p className="text-sm text-muted-foreground">{vm.specs}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              // 기존 로직: 방금 생성한 VM 표시
              currentVM && (
                <Card className="overflow-hidden border-2 shadow-lg">
                  <div className="border-b bg-muted/30 px-6 py-4">
                    <h2 className="text-xl font-semibold">생성된 가상머신</h2>
                    <p className="text-sm text-muted-foreground">방금 생성한 VM에 패키지를 설치합니다</p>
                  </div>
                  <div className="p-6">
                    <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-md bg-primary/10 p-2">
                          <Server className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="font-semibold">{currentVM.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {currentVM.type === "public" ? "퍼블릭" : "프라이빗"} VM
                          </p>
                          <p className="text-sm text-muted-foreground">{currentVM.specs}</p>
                          <p className="text-sm text-primary font-medium">생성 개수: {currentVM.count}개</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            )}

            <Card className="overflow-hidden border-2 shadow-lg">
              <div className="border-b bg-muted/30 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">패키지 목록</h2>
                    <p className="text-sm text-muted-foreground">{packages.length}개의 패키지가 선택되었습니다</p>
                  </div>
                  <Button
                    onClick={handleOpenModal}
                    size="lg"
                    className="bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg transition-all"
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
                      <rect x="1" y="3" width="15" height="13" rx="2" ry="2"></rect>
                      <path d="M10 3L21 14L19 18L8 9L4 15"></path>
                    </svg>
                    패키지 추가
                  </Button>
                </div>
              </div>

              <div className="p-6">
                {packages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="rounded-full bg-muted/50 p-6 mb-4">
                      <svg
                        className="h-12 w-12 text-muted-foreground"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="1" y="3" width="15" height="13" rx="2" ry="2"></rect>
                        <path d="M10 3L21 14L19 18L8 9L4 15"></path>
                      </svg>
                    </div>
                    <p className="text-lg font-medium text-muted-foreground">추가된 패키지가 없습니다</p>
                    <p className="text-sm text-muted-foreground mt-2">패키지 추가 버튼을 눌러 시작하세요</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {packages.map((pkg, index) => (
                      <div
                        key={pkg.id}
                        className="group rounded-xl border-2 bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-primary" />
                              <h3 className="font-semibold text-lg">{pkg.name}</h3>
                            </div>
                            <p className="break-all text-sm leading-relaxed text-muted-foreground pl-4">
                              {pkg.description}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            onClick={() => handleDelete(pkg.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <div className="flex justify-end">
              <a
                href="/request-package"
                className="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <MessageCircle className="h-4 w-4" />
                <p>필요하신 패키지가 없으신가요?</p>
              </a>
            </div>

            <div className="flex justify-center pt-4">
              <Button
                size="lg"
                className="min-w-[240px] h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary to-primary/80"
                onClick={handleInstallPackages}
                disabled={packages.length === 0 || (mode === "select" ? selectedVMs.length === 0 : !currentVM)}
              >
                <svg
                  className="mr-2 h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="1" y="3" width="15" height="13" rx="2" ry="2"></rect>
                  <path d="M10 3L21 14L19 18L8 9L4 15"></path>
                </svg>
                패키지 설치 요청
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative mx-4 max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl border-2 bg-card shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b bg-muted/30 px-6 py-4">
              <h2 className="text-xl font-semibold">사용 가능한 패키지</h2>
              <p className="text-sm text-muted-foreground mt-1">설치할 패키지를 선택하세요</p>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-6">
              <div className="space-y-3">
                {AVAILABLE_PACKAGES.map((pkg) => {
                  const isSelected = selectedPackages.includes(pkg.id)
                  const isAlreadyAdded = packages.some((p) => p.id === pkg.id)
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => !isAlreadyAdded && togglePackageSelection(pkg.id)}
                      disabled={isAlreadyAdded}
                      className={`w-full rounded-xl border-2 bg-background p-5 text-left transition-all ${
                        isAlreadyAdded
                          ? "cursor-not-allowed opacity-50"
                          : isSelected
                            ? "border-primary shadow-md scale-[1.02]"
                            : "border-transparent hover:border-muted hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <h3 className="font-semibold text-lg">{pkg.name}</h3>
                          <p className="break-all text-sm leading-relaxed text-muted-foreground">{pkg.description}</p>
                          {isAlreadyAdded && (
                            <p className="text-xs text-primary font-medium">✓ 이미 추가된 패키지입니다</p>
                          )}
                        </div>
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all ${
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-md scale-110"
                              : "border-2 border-muted-foreground/30"
                          }`}
                        >
                          {isSelected && <Check className="h-5 w-5" />}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="border-t bg-muted/30 p-6">
              <div className="flex justify-center gap-3">
                <Button variant="outline" size="lg" onClick={() => setIsModalOpen(false)} className="min-w-[120px]">
                  취소
                </Button>
                <Button
                  size="lg"
                  onClick={handleAddSelectedPackages}
                  disabled={selectedPackages.length === 0}
                  className="min-w-[160px] shadow-md hover:shadow-lg transition-all"
                >
                  <Check className="mr-2 h-4 w-4" />
                  패키지 추가 ({selectedPackages.length})
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
