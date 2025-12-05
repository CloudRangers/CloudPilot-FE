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
} from "@/components/ui/dialog"

export default function TeamLeaderMyPage() {
  const [expandedServers, setExpandedServers] = useState<Set<number>>(new Set())
  const [data, setData] = useState<TeamLeaderMyPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedVm, setSelectedVm] = useState<MyPageVm | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

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
        console.error("[TeamLeaderMyPage] /mypage/leader 오류:", err?.response ?? err)
        setError("마이페이지 정보를 불러오지 못했습니다.")
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderMyPage()
  }, [])

  // 상태 아이콘 / 텍스트 - 대문자 통일 처리 (RUNNING / running 둘 다 대응)
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

  // 🔄 로딩 상태
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
        <Header />
        <main className="flex-1 flex items-center justify-center">
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
        <main className="flex-1 flex items-center justify-center">
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

  // 🔻 "팀원이 할당되지 않은 VM" 수집 + 기존 리스트에서 분리
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
    // 모든 VM이 비어버린 멤버는 리스트에서 제거
    .filter((member) => member.servers.length > 0)

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <Header />

      <main className="flex-1">
        <div className="container px-4 py-8 md:px-6">
          {/* 상단 타이틀 + 요약 카드들 */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-xl bg-primary/10 p-3">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">팀장 마이페이지</h1>
            </div>
            <p className="text-muted-foreground">
              내 팀의 가상머신 상태를 한눈에 보고, 팀 패키지 승인을 관리하세요.
            </p>
          </div>

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

            {/* 네 번째 칸은 비워두거나 나중에 다른 요약 카드 추가 가능 */}
          </div>

          {/* ✅ 패키지 승인 관리 버튼 */}
          <div className="mb-6">
            <Link href="/leader-approval">
              <Button
                size="lg"
                className="w-full md:w-auto gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-5 w-5" />
                팀 패키지 승인 페이지
              </Button>
            </Link>
          </div>

          {/* 🟥 팀원이 할당되지 않은 VM들 */}
          {unassignedVms.length > 0 && (
            <Card className="mb-6 border-destructive bg-destructive/5">
              <div className="flex items-start gap-3 mb-3">
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

          {/* 아래 VM 리스트 부분 */}
          <div className="space-y-6">
            {membersForList.map((member, memberIndex) => (
              <Card key={memberIndex} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {member.teamMember}
                  </h2>
                  <Badge variant="outline">{member.servers.length}개 서버</Badge>
                </div>

                <div className="space-y-4">
                  {member.servers.map((vm) => {
                    const assignedMembers = getAssignedMembersForVm(vm)
                    return (
                      <div
                        key={vm.id}
                        className="rounded-lg border border-border overflow-hidden"
                      >
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

                        {expandedServers.has(vm.id) && (
                          <div className="px-4 pb-4 pt-2 bg-muted/30 border-t">
                            <h5 className="font-semibold mb-3 flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              상세 정보
                            </h5>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground mb-1">
                                  IP 주소
                                </p>
                                <p className="font-medium">
                                  {vm.ipAddress || "-"}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">
                                  마지막 업데이트
                                </p>
                                <p className="font-medium">
                                  {formatDateTime(vm.lastUpdated)}
                                </p>
                              </div>

                              {/* 할당된 팀원 정보 */}
                              <div className="col-span-2">
                                <p className="text-muted-foreground mb-2">
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
                                        {m.name ?? m.username ?? "이름 없음"}
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
                                <p className="text-muted-foreground mb-2">
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

                            {/* ⛔ Grafana 버튼 제거 (요청사항) */}
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

      {/* 🔹 Grafana 상세 모달 (내부 내용만 유지, 버튼은 위에서 이미 제거됨) */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {selectedVm ? `${selectedVm.name} 상세 모니터링` : "VM 상세"}
            </DialogTitle>
            <DialogDescription>
              VM 스펙과 네트워크 정보를 확인할 수 있습니다.
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
