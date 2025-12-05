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
  AlertTriangle,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api/base-client"
import type { ApiResponse, MyPageVm, VmAssignedMember } from "@/types/mypage"
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

  // 🔹 삭제 모달용 상태
  const [deleteTargetVm, setDeleteTargetVm] = useState<MyPageVm | null>(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const { toast } = useToast()

  const toggleServerDetails = (serverId: number) => {
    const next = new Set(expandedServers)
    if (next.has(serverId)) next.delete(serverId)
    else next.add(serverId)
    setExpandedServers(next)
  }

  useEffect(() => {
    const fetchLeaderMyPage = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await apiClient.get<ApiResponse<TeamLeaderMyPageData>>(
          "/mypage/leader",
        )
        console.log("[TeamLeaderMyPage] /mypage/leader 응답:", res.data)
        setData(res.data.data)
      } catch (err: any) {
        console.error(
          "[TeamLeaderMyPage] /mypage/leader 오류:",
          err?.response ?? err,
        )
        setError("마이페이지 정보를 불러오지 못했습니다.")
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderMyPage()
  }, [])

  // 상태 아이콘 / 텍스트 - 대문자 통일 처리
  const getStatusIcon = (status: MyPageVm["status"]) => {
    const upper = (status ?? "").toString().toUpperCase()
    switch (upper) {
      case "RUNNING":
      case "ON":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "STOPPED":
      case "OFF":
        return <AlertCircle className="h-5 w-5 text-gray-400" />
      case "PENDING":
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: MyPageVm["status"]) => {
    const upper = (status ?? "").toString().toUpperCase()
    switch (upper) {
      case "RUNNING":
      case "ON":
        return "실행 중"
      case "STOPPED":
      case "OFF":
        return "중지됨"
      case "PENDING":
        return "대기 중"
      default:
        return status
    }
  }

  const formatDateTime = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleString("ko-KR") : "-"

  /** VM에 연결된 할당 팀원 목록(팀장/팀원만) */
  const getAssignedMembersForVm = (vm: MyPageVm): VmAssignedMember[] => {
    const raw = vm.assignedMembers
    if (!raw) return []
    return raw.filter((m) => {
      const code = (m.roleCode ?? "").toUpperCase()
      return code === "LEADER" || code === "MEMBER"
    })
  }

  /** 이 VM이 "이미 팀원에게 할당된 상태"인지 여부 */
  const isVmAssigned = (vm: MyPageVm): boolean => {
    const raw = vm.assignedMembers

    // 백엔드가 아직 assignedMembers를 내려주지 않는 기존 구조라면
    // 기존 화면 깨지지 않도록 "할당됨"으로 취급
    if (raw === undefined) return true

    const filtered = getAssignedMembersForVm(vm)
    return filtered.length > 0
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
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">
            🔄 마이페이지 정보를 불러오는 중입니다...
          </p>
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
        <main className="flex flex-1 items-center justify-center">
          <p className="text-destructive">
            {error ?? "마이페이지 정보를 불러오지 못했습니다."}
          </p>
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

  const totalServers = teamMembers.reduce(
    (acc, member) => acc + member.servers.length,
    0,
  )

  const runningServers = teamMembers.reduce(
    (acc, member) =>
      acc +
      member.servers.filter(
        (s) => (s.status ?? "").toString().toUpperCase() === "RUNNING",
      ).length,
    0,
  )

  // 🔻 팀원이 할당되지 않은 VM 수집 + 기존 리스트에서 분리
  const unassignedVms: MyPageVm[] = []
  const membersForList = teamMembers
    .map((member) => {
      const assignedServers = member.servers.filter((vm) => {
        const assigned = isVmAssigned(vm)
        if (!assigned) {
          unassignedVms.push(vm)
        }
        return assigned
      })
      return { ...member, servers: assignedServers }
    })
    .filter((member) => member.servers.length > 0)

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <Header />

      <main className="flex-1">
        <div className="container px-4 py-8 md:px-6">
          {/* 상단 타이틀 + 요약 카드들 */}
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                팀장 마이페이지
              </h1>
            </div>
            <p className="text-muted-foreground">
              내 팀의 가상머신 상태를 한눈에 보고, 팀 패키지 승인을 관리하세요.
            </p>
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-4">
            <Card className="p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
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
              <p className="mb-1 text-sm text-muted-foreground">
                팀 전체 서버 수
              </p>
              <p className="text-2xl font-bold">{totalServers}</p>
            </Card>

            <Card className="p-6">
              <p className="mb-1 text-sm text-muted-foreground">
                실행 중 서버
              </p>
              <p className="text-2xl font-bold">{runningServers}</p>
            </Card>

            {/* 네 번째 칸은 추후 다른 요약 카드용으로 비워둠 */}
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">
                추가 지표가 여기에 들어갈 수 있습니다.
              </p>
            </Card>
          </div>

          {/* ✅ 패키지 승인 관리 버튼 (상단 버전 유지) */}
          <div className="mb-6">
            <Link href="/leader-approval">
              <Button
                size="lg"
                className="w-full gap-2 bg-green-600 hover:bg-green-700 md:w-auto"
              >
                <CheckCircle className="h-5 w-5" />
                팀 패키지 승인 페이지
              </Button>
            </Link>
          </div>

          {/* 🟥 팀원이 할당되지 않은 VM들 */}
          {unassignedVms.length > 0 && (
            <Card className="mb-6 border-destructive bg-destructive/5">
              <div className="mb-3 flex items-start gap-3">
                <div className="mt-1 rounded-full bg-destructive/10 p-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-destructive">
                    팀원이 할당되지 않은 VM입니다.
                  </h2>
                  <p className="text-xs text-destructive/80">
                    아래 VM은 반드시 팀장 또는 팀원에게 할당해주세요.
                  </p>
                </div>
              </div>

              <div className="divide-y">
                {unassignedVms.map((vm) => (
                  <div
                    key={vm.id}
                    className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-destructive" />
                        <span className="font-semibold">{vm.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {vm.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        CPU: {vm.cpu ?? "-"} vCPU · 메모리: {vm.memory ?? "-"} GB ·
                        스토리지: {vm.storage ?? "-"} GB
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusIcon(vm.status)}
                      <span className="text-sm font-medium">
                        {getStatusText(vm.status)}
                      </span>
                      <Link href={`/assign-member?vmId=${vm.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive text-destructive hover:bg-destructive/10"
                        >
                          팀원 할당하기
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 팀원별 VM 리스트 */}
          <div className="space-y-6">
            {membersForList.map((member, memberIndex) => (
              <Card key={memberIndex} className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <Users className="h-5 w-5 text-primary" />
                    {member.teamMember}
                  </h2>
                  <Badge variant="outline">
                    {member.servers.length}개 서버
                  </Badge>
                </div>

                <div className="space-y-4">
                  {member.servers.map((vm) => {
                    const assignedMembers = getAssignedMembersForVm(vm)
                    return (
                      <div
                        key={vm.id}
                        className="overflow-hidden rounded-lg border border-border"
                      >
                        {/* 상단 요약 */}
                        <div
                          className="cursor-pointer p-4 transition-colors hover:bg-muted/50"
                          onClick={() => toggleServerDetails(vm.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex flex-1 items-start gap-3">
                              <div className="rounded-md bg-primary/10 p-2">
                                <Server className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">{vm.name}</h3>
                                  <span className="rounded-full bg-muted px-2 py-1 text-xs">
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
                                <p className="text-xs text-muted-foreground">
                                  담당자:{" "}
                                  {assignedMembers.length > 0
                                    ? assignedMembers
                                        .map(
                                          (m) =>
                                            m.name ??
                                            m.username ??
                                            "이름 없음",
                                        )
                                        .join(", ")
                                    : "할당된 팀원이 없습니다."}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(vm.status)}
                              <span className="text-sm font-medium">
                                {getStatusText(vm.status)}
                              </span>
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${
                                  expandedServers.has(vm.id)
                                    ? "rotate-180"
                                    : ""
                                }`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* 펼친 상세 영역 */}
                        {expandedServers.has(vm.id) && (
                          <div className="border-t bg-muted/30 px-4 pb-4 pt-2">
                            <div className="mb-3 flex items-center justify-between">
                              <h5 className="flex items-center gap-2 font-semibold">
                                <Package className="h-4 w-4" />
                                상세 정보
                              </h5>

                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="flex items-center gap-1"
                                  onClick={() => openDeleteDialog(vm)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  VM 삭제
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="mb-1 text-muted-foreground">
                                  IP 주소
                                </p>
                                <p className="font-medium">
                                  {vm.ipAddress || "-"}
                                </p>
                              </div>
                              <div>
                                <p className="mb-1 text-muted-foreground">
                                  마지막 업데이트
                                </p>
                                <p className="font-medium">
                                  {formatDateTime(vm.lastUpdated)}
                                </p>
                              </div>

                              {/* 할당된 팀원 정보 */}
                              <div className="col-span-2">
                                <p className="mb-2 text-muted-foreground">
                                  할당된 팀원
                                </p>
                                {assignedMembers.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {assignedMembers.map((m, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {m.name ??
                                          m.username ??
                                          "이름 없음"}
                                        {m.employeeId
                                          ? ` (${m.employeeId})`
                                          : ""}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    할당된 팀원이 없습니다.
                                  </span>
                                )}
                              </div>

                              <div className="col-span-2">
                                <p className="mb-2 text-muted-foreground">
                                  설치된 패키지
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {vm.packages && vm.packages.length > 0 ? (
                                    vm.packages.map((pkg, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {pkg}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-xs text-muted-foreground">
                                      등록된 패키지가 없습니다.
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>

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
            <Button
              variant="outline"
              onClick={closeDeleteDialog}
              disabled={isDeleting}
            >
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
