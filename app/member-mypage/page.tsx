// app/member-mypage/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Server, CheckCircle2, Clock, AlertCircle, ChevronDown, Package } from "lucide-react"
import { apiClient } from "@/lib/api/base-client"

// ✅ 공통 타입으로 통일 (중복 정의 제거)
import type { ApiResponse, MyPageData, MyPageVm } from "@/types/mypage"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

export default function MemberMyPage() {
  const [expandedServers, setExpandedServers] = useState<Set<number>>(new Set())
  const [myPage, setMyPage] = useState<MyPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 🔹 Grafana 모달용
  const [selectedVm, setSelectedVm] = useState<MyPageVm | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    const fetchMyPage = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await apiClient.get<ApiResponse<MyPageData>>("/mypage/me")
        setMyPage(res.data.data)
      } catch (err: any) {
        console.error("[MemberMyPage] /mypage/me 호출 실패:", err)
        const msg =
          err?.response?.data?.message ??
          (err?.response?.status === 401
            ? "로그인이 필요합니다."
            : "마이페이지 정보를 불러오지 못했습니다.")
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    fetchMyPage()
  }, [])

  const toggleServerDetails = (serverId: number) => {
    const next = new Set(expandedServers)
    if (next.has(serverId)) next.delete(serverId)
    else next.add(serverId)
    setExpandedServers(next)
  }

  const getStatusIcon = (status: MyPageVm["status"]) => {
    switch (status.toUpperCase()) {
      case "RUNNING":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "STOPPED":
        return <AlertCircle className="h-5 w-5 text-gray-400" />
      case "PENDING":
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: MyPageVm["status"]) => {
    switch (status.toUpperCase()) {
      case "RUNNING":
        return "실행 중"
      case "STOPPED":
        return "중지됨"
      case "PENDING":
        return "대기 중"
      default:
        return status
    }
  }

  const formatDateTime = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleString("ko-KR") : "-"

  const openGrafanaForVm = (vmName: string) => {
    const base =
      process.env.NEXT_PUBLIC_GRAFANA_BASE_URL ?? "http://172.16.5.68:3000"
    const uid =
      process.env.NEXT_PUBLIC_GRAFANA_DASHBOARD_UID ?? "vm-detail"
    const slug =
      process.env.NEXT_PUBLIC_GRAFANA_DASHBOARD_SLUG ?? "vm-detail"

    const url = `${base}/d/${uid}/${slug}?var-instance=${encodeURIComponent(
      vmName,
    )}`

    window.open(url, "_blank", "noopener,noreferrer")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center text-muted-foreground">
          <p>마이페이지 정보를 불러오는 중입니다...</p>
        </main>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="p-6 max-w-md">
            <p className="text-sm text-destructive mb-4">{error}</p>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = "/login"
              }}
            >
              로그인 페이지로 이동
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  if (!myPage) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center text-muted-foreground">
          <p>마이페이지 정보를 찾을 수 없습니다.</p>
        </main>
        <Footer />
      </div>
    )
  }

  const { username, empno, teamName, roleName, vms } = myPage

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-background">
        <div className="container px-4 py-8 md:px-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">마이페이지</h1>
            <p className="mt-2 text-muted-foreground">내 정보와 생성한 가상머신을 관리하세요</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* 사용자 정보 카드 */}
            <div className="lg:col-span-1">
              <Card className="p-6 space-y-3">
                <h2 className="text-lg font-semibold mb-2">사용자 정보</h2>
                <div>
                  <p className="text-sm text-muted-foreground">이름</p>
                  <p className="font-medium">{username}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">사번</p>
                  <p className="font-medium">{empno}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">팀</p>
                  <p className="font-medium">{teamName ?? "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">역할</p>
                  <Badge variant="secondary" className="mt-1">
                    {roleName ?? myPage.roleCode ?? "알 수 없음"}
                  </Badge>
                </div>
              </Card>
            </div>

            {/* VM 리스트 카드 */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">내 가상머신</h2>
                  <Button
                    onClick={() => {
                      window.location.href = "/create-vm"
                    }}
                  >
                    새 VM 생성
                  </Button>
                </div>

                {vms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    아직 생성한 가상머신이 없습니다. &nbsp;
                    <button
                      className="underline underline-offset-4"
                      onClick={() => {
                        window.location.href = "/create-vm"
                      }}
                    >
                      첫 번째 VM을 만들어보세요.
                    </button>
                  </p>
                ) : (
                  <div className="space-y-4">
                    {vms.map((vm) => (
                      <div key={vm.id} className="rounded-lg border border-border overflow-hidden">
                        <div
                          className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => toggleServerDetails(vm.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="rounded-md bg-primary/10 p-2">
                                <Server className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">{vm.name}</h3>
                                  <span className="text-xs px-2 py-1 rounded-full bg-muted">
                                    {vm.type}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                  <div>CPU: {vm.cpu ?? "-"} vCPU</div>
                                  <div>메모리: {vm.memory ?? "-"} GB</div>
                                  <div>스토리지: {vm.storage ?? "-"} GB</div>
                                  <div>OS: {vm.os || "-"}</div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  생성일: {formatDateTime(vm.createdAt)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(vm.status)}
                              <span className="text-sm font-medium">{getStatusText(vm.status)}</span>
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${
                                  expandedServers.has(vm.id) ? "rotate-180" : ""
                                }`}
                              />
                            </div>
                          </div>
                        </div>

                        {expandedServers.has(vm.id) && (
                          <div className="px-4 pb-4 pt-2 bg-muted/30 border-t">
                            <h5 className="font-semibold mb-3 flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              상세 정보
                            </h5>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground mb-1">IP 주소</p>
                                <p className="font-medium">{vm.ipAddress || "-"}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">마지막 업데이트</p>
                                <p className="font-medium">
                                  {formatDateTime(vm.lastUpdated)}
                                </p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-muted-foreground mb-2">설치된 패키지</p>
                                <div className="flex flex-wrap gap-2">
                                  {vm.packages?.length
                                    ? vm.packages.map((pkg, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-xs">
                                          {pkg}
                                        </Badge>
                                      ))
                                    : (
                                      <span className="text-xs text-muted-foreground">
                                        등록된 패키지가 없습니다.
                                      </span>
                                      )}
                                </div>
                              </div>
                            </div>

                            {/* 🔹 Grafana 상세 모니터링 버튼 */}
                            <div className="mt-4 flex justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedVm(vm)
                                  setDetailOpen(true)
                                }}
                              >
                                Grafana 상세 모니터링
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* 🔹 Grafana 상세 모달 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {selectedVm ? `${selectedVm.name} 상세 모니터링` : "VM 상세"}
            </DialogTitle>
            <DialogDescription>
              VM 스펙과 네트워크 정보를 확인하고 Grafana 대시보드로 이동할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          {selectedVm && (
            <div className="space-y-4 text-sm">
              <Card className="p-4 space-y-1">
                <p>
                  <span className="font-medium">이름: </span>
                  {selectedVm.name}
                </p>
                <p>
                  <span className="font-medium">타입: </span>
                  {selectedVm.type}
                </p>
                <p>
                  <span className="font-medium">CPU: </span>
                  {selectedVm.cpu ?? "-"} vCPU
                </p>
                <p>
                  <span className="font-medium">메모리: </span>
                  {selectedVm.memory ?? "-"} GB
                </p>
                <p>
                  <span className="font-medium">스토리지: </span>
                  {selectedVm.storage ?? "-"} GB
                </p>
                <p>
                  <span className="font-medium">OS: </span>
                  {selectedVm.os || "-"}
                </p>
                <p>
                  <span className="font-medium">IP: </span>
                  {selectedVm.ipAddress || "-"}
                </p>
                <p>
                  <span className="font-medium">생성일: </span>
                  {formatDateTime(selectedVm.createdAt)}
                </p>
              </Card>

              <Button
                size="sm"
                variant="outline"
                onClick={() => openGrafanaForVm(selectedVm.name)}
              >
                Grafana 상세 대시보드 열기
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
