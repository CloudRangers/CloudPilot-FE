// app/team-leader-mypage/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Server,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  CheckCircle,
  ChevronDown,
  Package,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api/base-client"
import type { ApiResponse, MyPageVm } from "@/types/mypage"
import type { TeamLeaderMyPageData } from "@/types/mypage-leader"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

export default function TeamLeaderMyPage() {
  const [expandedServers, setExpandedServers] = useState<Set<number>>(new Set())
  const [data, setData] = useState<TeamLeaderMyPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 🔹 Grafana 상세 모달용 상태
  const [selectedVm, setSelectedVm] = useState<MyPageVm | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // 🔹 삭제 모달용 상태
  const [deleteTargetVm, setDeleteTargetVm] = useState<MyPageVm | null>(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const { toast } = useToast()

  const toggleServerDetails = (serverId: number) => {
    const newExpanded = new Set(expandedServers)
    if (newExpanded.has(serverId)) newExpanded.delete(serverId)
    else newExpanded.add(serverId)
    setExpandedServers(newExpanded)
  }

  useEffect(() => {
    const fetchLeaderMyPage = async () => {
      try {
        setLoading(true)
        const res = await apiClient.get<ApiResponse<TeamLeaderMyPageData>>("/mypage/leader")
        console.log("[TeamLeaderMyPage] /mypage/leader 응답:", res.data)
        setData(res.data.data)
      } catch (err: any) {
        console.error("[TeamLeaderMyPage] /mypage/leader 오류:", err?.response ?? err)
        setError("마이페이지 정보를 불러오지 못했습니다.")
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderMyPage()
  }, [])

  const getStatusIcon = (status: MyPageVm["status"]) => {
    switch (status) {
      case "running":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "stopped":
        return <AlertCircle className="h-5 w-5 text-gray-400" />
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: MyPageVm["status"]) => {
    switch (status) {
      case "running":
        return "실행 중"
      case "stopped":
        return "중지됨"
      case "pending":
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

  // 🔹 삭제 다이얼로그 열기
  const openDeleteDialog = (vm: MyPageVm) => {
    setDeleteTargetVm(vm)
    setDeleteConfirmName("")
  }

  // 🔹 삭제 다이얼로그 닫기
  const closeDeleteDialog = () => {
    setDeleteTargetVm(null)
    setDeleteConfirmName("")
    setIsDeleting(false)
  }

  // 🔹 실제 삭제 처리
  const handleDeleteVm = async () => {
    if (!deleteTargetVm) return
    if (deleteConfirmName.trim() !== deleteTargetVm.name) return

    try {
      setIsDeleting(true)

      // 실제 삭제 API 호출
      await apiClient.delete(`/vms/${deleteTargetVm.id}`)

      // 프론트 상태에서도 제거
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          members: prev.members.map((member) => ({
            ...member,
            servers: member.servers.filter((s) => s.id !== deleteTargetVm.id),
          })),
        }
      })

      toast({
        title: "VM 삭제 완료",
        description: `'${deleteTargetVm.name}' VM이 삭제되었습니다.`,
      })

      closeDeleteDialog()
    } catch (e) {
      console.error("[TeamLeaderMyPage] VM 삭제 실패:", e)
      toast({
        variant: "destructive",
        title: "VM 삭제 실패",
        description: "VM 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      })
      setIsDeleting(false)
    }
  }

  const isConfirmMatched =
      deleteTargetVm && deleteConfirmName.trim() === deleteTargetVm.name

  // 🔄 로딩 상태
  if (loading) {
    return (
        <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">🔄 마이페이지 정보를 불러오는 중입니다...</p>
          </main>
          <Footer />
        </div>
    )
  }

  // ❌ 에러 또는 데이터 없음
  if (error || !data) {
    return (
        <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <p className="text-destructive">{error ?? "마이페이지 정보를 불러오지 못했습니다."}</p>
          </main>
          <Footer />
        </div>
    )
  }

  const teamLeaderInfo = {
    name: data.leaderName,
    employeeId: data.leaderEmployeeId,
    department: data.department,
    team: data.teamName,
    role: data.roleName,
  }

  const teamMembers = data.members

  const totalServers = teamMembers.reduce((acc, member) => acc + member.servers.length, 0)
  const runningServers = teamMembers.reduce(
      (acc, member) => acc + member.servers.filter((s) => s.status === "running").length,
      0,
  )

  return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
        <Header />

        <main className="flex-1">
          <div className="container px-4 py-8 md:px-6">
            {/* 상단 요약부 */}
            <div className="mb-6 grid gap-6 lg:grid-cols-4">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  팀장 정보
                </h2>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">이름</p>
                    <p className="font-medium">{teamLeaderInfo.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">사번</p>
                    <p className="font-medium">{teamLeaderInfo.employeeId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">부서 / 팀</p>
                    <p className="font-medium">
                      {teamLeaderInfo.department} / {teamLeaderInfo.team}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">역할</p>
                    <Badge variant="secondary">{teamLeaderInfo.role}</Badge>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <p className="text-sm text-muted-foreground mb-1">팀 전체 서버 수</p>
                <p className="text-2xl font-bold">{totalServers}</p>
              </Card>

              <Card className="p-6">
                <p className="text-sm text-muted-foreground mb-1">실행 중 서버</p>
                <p className="text-2xl font-bold">{runningServers}</p>
              </Card>

              <Card className="p-6 flex flex-col justify-between">
                <p className="text-sm text-muted-foreground mb-2">
                  패키지 승인 관리
                </p>
                <Link href="/leader-approval">
                  <Button className="w-full gap-2">
                    <CheckCircle className="h-5 w-5" />
                    팀 패키지 승인 페이지
                  </Button>
                </Link>
              </Card>
            </div>

            {/* 아래 VM 리스트 부분 */}
            <div className="space-y-6">
              {teamMembers.map((member, memberIndex) => (
                  <Card key={memberIndex} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        {member.teamMember}
                      </h2>
                      <Badge variant="outline">{member.servers.length}개 서버</Badge>
                    </div>

                    <div className="space-y-4">
                      {member.servers.map((vm) => (
                          <div key={vm.id} className="rounded-lg border border-border overflow-hidden">
                            {/* 상단 요약 */}
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
                                      <span className="text-xs px-2 py-1 rounded-full bg-muted">{vm.type}</span>
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

                            {/* 상세 영역 */}
                            {expandedServers.has(vm.id) && (
                                <div className="px-4 pb-4 pt-2 bg-muted/30 border-t">
                                  <div className="flex items-center justify-between mb-3">
                                    <h5 className="font-semibold flex items-center gap-2">
                                      <Package className="h-4 w-4" />
                                      상세 정보
                                    </h5>

                                    <div className="flex items-center gap-2">
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

                                      <Button
                                          size="sm"
                                          variant="destructive"
                                          className="flex items-center gap-1"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            openDeleteDialog(vm)
                                          }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        VM 삭제
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-muted-foreground mb-1">IP 주소</p>
                                      <p className="font-medium">{vm.ipAddress}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground mb-1">마지막 업데이트</p>
                                      <p className="font-medium">{formatDateTime(vm.lastUpdated)}</p>
                                    </div>
                                    <div className="col-span-2">
                                      <p className="text-muted-foreground mb-2">설치된 패키지</p>
                                      <div className="flex flex-wrap gap-2">
                                        {vm.packages.map((pkg, idx) => (
                                            <Badge key={idx} variant="secondary" className="text-xs">
                                              {pkg}
                                            </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                            )}
                          </div>
                      ))}
                    </div>
                  </Card>
              ))}
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

        {/* 🔹 VM 삭제 확인 모달 */}
        <Dialog
            open={!!deleteTargetVm}
            onOpenChange={(open) => {
              if (!open) closeDeleteDialog()
            }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>VM 삭제</DialogTitle>
              <DialogDescription>
                {deleteTargetVm ? (
                    <>
                  <span className="font-semibold text-foreground">
                    {deleteTargetVm.name}
                  </span>{" "}
                      VM을 정말로 삭제하시겠어요?
                      <br />
                      이 작업은 되돌릴 수 없습니다. 계속하려면 아래 입력란에 정확히{" "}
                      <span className="font-mono text-foreground">
                    {deleteTargetVm.name}
                  </span>{" "}
                      를 입력하세요.
                    </>
                ) : (
                    "VM을 삭제하시겠습니까?"
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">VM 이름 확인</p>
              <Input
                  placeholder={deleteTargetVm?.name ?? ""}
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
              />
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={closeDeleteDialog} disabled={isDeleting}>
                취소
              </Button>
              <Button
                  variant="destructive"
                  onClick={handleDeleteVm}
                  disabled={!isConfirmMatched || isDeleting}
              >
                {isDeleting ? "삭제 중..." : "삭제하기"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Footer />
      </div>
  )
}
