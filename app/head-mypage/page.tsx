// app/head-mypage/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Server,
  CheckCircle2,
  Clock,
  AlertCircle,
  Shield,
  Users,
  CheckCircle,
  ChevronDown,
  Package,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api/base-client"

// 공통 마이페이지 타입 (VM 타입 포함)
import type { ApiResponse, MyPageVm, VmAssignedMember } from "@/types/mypage"
// 부장용 마이페이지 타입
import type { HeadMyPageData } from "@/types/mypage-head"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

export default function HeadMyPage() {
  const [expandedServers, setExpandedServers] = useState<Set<number>>(new Set())
  const [data, setData] = useState<HeadMyPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedVm, setSelectedVm] = useState<MyPageVm | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const toggleServerDetails = (serverId: number) => {
    const next = new Set(expandedServers)
    if (next.has(serverId)) {
      next.delete(serverId)
    } else {
      next.add(serverId)
    }
    setExpandedServers(next)
  }

  useEffect(() => {
    const fetchHeadMyPage = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await apiClient.get<ApiResponse<HeadMyPageData>>(
          "/mypage/head",
        )
        console.log("[HeadMyPage] /mypage/head 응답:", res.data)
        setData(res.data.data)
      } catch (err: any) {
        console.error("[HeadMyPage] /mypage/head 오류:", err?.response ?? err)
        setError("마이페이지 정보를 불러오지 못했습니다.")
      } finally {
        setLoading(false)
      }
    }

    fetchHeadMyPage()
  }, [])

  // 🔹 status 값이 RUNNING / running 둘 다 올 수 있으니까 대문자로 통일해서 비교
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

  // 날짜 포맷 간단 정리용 헬퍼
  const formatDateTime = (value?: string | null) => {
    if (!value) return "-"
    return value.replace("T", " ")
  }

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

    // 기존 응답에 assignedMembers가 없다면 그대로 "할당됨" 취급 (기존 화면 보장)
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
          <p className="text-destructive">{error ?? "데이터가 없습니다."}</p>
        </main>
        <Footer />
      </div>
    )
  }

  const managerInfo = {
    name: data.managerName,
    employeeId: data.managerEmployeeId,
    department: data.department,
    role: data.roleName,
  }

  const allTeamsServers = data.teams

  const totalServers = allTeamsServers.reduce(
    (acc, team) =>
      acc +
      team.members.reduce(
        (sum, member) => sum + member.servers.length,
        0,
      ),
    0,
  )
  const runningServers = allTeamsServers.reduce(
    (acc, team) =>
      acc +
      team.members.reduce(
        (sum, member) =>
          sum +
          member.servers.filter(
            (s) => (s.status ?? "").toString().toUpperCase() === "RUNNING",
          ).length,
        0,
      ),
    0,
  )
  const totalMembers = allTeamsServers.reduce(
    (acc, team) => acc + team.members.length,
    0,
  )

  // 🔻 "팀원이 할당되지 않은 VM" 수집 + 기존 리스트에서 분리
  const unassignedVms: MyPageVm[] = []
  const teamsForList = allTeamsServers.map((team) => {
    const members = team.members
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
      .filter((m) => m.servers.length > 0)

    return { ...team, members }
  })

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <Header />

      <main className="flex-1">
        <div className="container px-4 py-8 md:px-6">
          {/* 상단 타이틀 + 요약 카드들 */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-xl bg-primary/10 p-3">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">부장 마이페이지</h1>
            </div>
            <p className="text-muted-foreground">
              모든 팀의 가상머신을 관리하고 패키지 승인을 처리하세요
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-4 mb-6">
            {/* 관리자 정보 */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                관리자 정보
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">이름</p>
                  <p className="font-medium">{managerInfo.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">사번</p>
                  <p className="font-medium">{managerInfo.employeeId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">부서</p>
                  <p className="font-medium">{managerInfo.department}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">직급</p>
                  <Badge variant="secondary">{managerInfo.role}</Badge>
                </div>
              </div>
            </Card>

            {/* 전체 서버 수 */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Server className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">전체 서버</p>
                  <p className="text-2xl font-bold">{totalServers}</p>
                </div>
              </div>
            </Card>

            {/* 실행 중 서버 수 */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-lg bg-green-100 p-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">실행 중</p>
                  <p className="text-2xl font-bold">{runningServers}</p>
                </div>
              </div>
            </Card>

            {/* 전체 팀원 수 */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-lg bg-purple-100 p-2">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">전체 팀원</p>
                  <p className="text-2xl font-bold">{totalMembers}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* 패키지 승인 관리 버튼 */}
          <div className="mb-6">
            <Link href="/head-approval">
              <Button
                size="lg"
                className="w-full md:w-auto gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-5 w-5" />
                패키지 승인 관리
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

          {/* 팀/팀원/VM 아코디언 */}
          <Accordion type="multiple" className="space-y-4">
            {teamsForList.map((team, teamIndex) => (
              <AccordionItem
                key={teamIndex}
                value={`team-${teamIndex}`}
                className="border-2 rounded-lg"
              >
                <Card className="border-0">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <Shield className="h-6 w-6 text-primary" />
                        <div className="text-left">
                          <h2 className="text-2xl font-bold">{team.teamName}</h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            팀장: {team.teamLeader}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-base px-3 py-1">
                          {team.members.length}명
                        </Badge>
                        <Badge variant="secondary" className="text-base px-3 py-1">
                          {team.members.reduce(
                            (sum, member) => sum + member.servers.length,
                            0,
                          )}
                          개 서버
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-6 pb-6">
                    <div className="space-y-6 pt-4">
                      {team.members.map((member, memberIndex) => (
                        <div
                          key={memberIndex}
                          className="pl-4 border-l-2 border-muted"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              <Users className="h-5 w-5 text-muted-foreground" />
                              {member.teamMember}
                            </h3>
                            <Badge variant="outline">
                              {member.servers.length}개 서버
                            </Badge>
                          </div>

                          <div className="space-y-3">
                            {member.servers.map((vm) => {
                              const assignedMembers = getAssignedMembersForVm(vm)
                              return (
                                <div
                                  key={vm.id}
                                  className="rounded-lg border border-border overflow-hidden"
                                >
                                  {/* 상단 요약 행 */}
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
                                            <h4 className="font-semibold">
                                              {vm.name}
                                            </h4>
                                            <span className="text-xs px-2 py-1 rounded-full bg-muted">
                                              {vm.type}
                                            </span>
                                          </div>

                                          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                            <div>CPU: {vm.cpu} vCPU</div>
                                            <div>메모리: {vm.memory} GB</div>
                                            <div>스토리지: {vm.storage} GB</div>
                                            <div>OS: {vm.os}</div>
                                          </div>

                                          <p className="text-xs text-muted-foreground">
                                            생성일: {formatDateTime(vm.createdAt)}
                                          </p>

                                          {/* 요약 행에서도 담당자 한 줄 표시 (옵션) */}
                                          <p className="text-xs text-muted-foreground">
                                            담당자:{" "}
                                            {assignedMembers.length > 0
                                              ? `${assignedMembers
                                                  .map((m) => m.name ?? m.username ?? "이름 없음")
                                                  .join(", ")}`
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

                                      {/* ⛔ Grafana 상세 모니터링 버튼 제거 */}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>

      {/* 🔹 Grafana 상세 모달 (버튼만 제거된 상태) */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {selectedVm ? `${selectedVm.name} 상세 모니터링` : "VM 상세"}
            </DialogTitle>
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
