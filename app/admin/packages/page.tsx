// app/admin/packages/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Loader2,
  Package,
  User,
  XCircle,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  pkgApi,
  type PkgRequestResponse,
  type PkgRequestDetailResponse,
  type PkgRequestStatus,
} from "@/lib/api/pkg"

type UserRole = "ADMIN" | "HEAD" | "LEADER" | "MEMBER" | string

export default function AdminPackageApprovalPage() {
  const router = useRouter()

  // ── 1) 권한/인증 상태 ─────────────────
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [userRole, setUserRole] = useState<UserRole>("")

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    const role = (localStorage.getItem("userRole") || "") as UserRole

    if (!isLoggedIn) {
      router.push("/login")
      return
    }

    setUserRole(role)

    // ✅ 팀장/부장만 승인 페이지 접근 가능
    if (role === "HEAD" || role === "LEADER") {
      setIsAuthorized(true)
    } else {
      setIsAuthorized(false)
    }

    setLoadingAuth(false)
  }, [router])

  // ── 2) To-do 목록 ─────────────────────
  const [todo, setTodo] = useState<PkgRequestResponse[]>([])
  const [loadingTodo, setLoadingTodo] = useState(false)
  const [errorTodo, setErrorTodo] = useState<string | null>(null)

  const loadTodo = async () => {
    try {
      setLoadingTodo(true)
      setErrorTodo(null)
      const list = await pkgApi.getRequests("todo")
      setTodo(list)
    } catch (e) {
      console.error(e)
      setErrorTodo(
        e instanceof Error ? e.message : "승인 대기 목록을 불러오지 못했습니다.",
      )
    } finally {
      setLoadingTodo(false)
    }
  }

  useEffect(() => {
    if (!isAuthorized) return
    loadTodo()
  }, [isAuthorized])

  // ── 3) 상세 + 승인/반려 ────────────────
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [selected, setSelected] = useState<PkgRequestDetailResponse | null>(
    null,
  )

  const [actionLoading, setActionLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  const openDetail = async (req: PkgRequestResponse) => {
    setDetailOpen(true)
    setDetailLoading(true)
    setDetailError(null)
    setSelected(null)

    try {
      const detail = await pkgApi.getRequestDetail(req.id)
      setSelected(detail)
    } catch (e) {
      console.error(e)
      setDetailError(
        e instanceof Error
          ? e.message
          : "신청 상세 정보를 불러오지 못했습니다.",
      )
    } finally {
      setDetailLoading(false)
    }
  }

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return "-"
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return "-"
    return d.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderStatusBadge = (status: PkgRequestStatus) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">대기</Badge>
      case "l1_approved":
        return <Badge className="bg-sky-600 text-sky-50">1차 승인</Badge>
      case "approved":
        return (
          <Badge className="bg-emerald-600 text-emerald-50">최종 승인</Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive" className="bg-red-600 text-red-50">
            반려
          </Badge>
        )
      default:
        return <Badge variant="outline">-</Badge>
    }
  }

  // 간단 권한: 팀장은 pending만, 부장은 pending/l1_approved 모두 처리 가능하다고 가정
  const canActOn = (status: PkgRequestStatus): boolean => {
    if (userRole === "LEADER") {
      return status === "pending"
    }
    if (userRole === "HEAD") {
      return status === "pending" || status === "l1_approved"
    }
    return false
  }

  const handleApprove = async () => {
    if (!selected) return

    try {
      setActionLoading(true)
      await pkgApi.approveOrReject(selected.request.id, {
        action: "approve",
      })
      await loadTodo()
      const updated = await pkgApi.getRequestDetail(selected.request.id)
      setSelected(updated)
      setRejectReason("")
      alert("승인되었습니다.")
    } catch (e) {
      console.error(e)
      alert(
        e instanceof Error
          ? e.message
          : "승인 처리 중 오류가 발생했습니다.",
      )
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selected) return

    if (!rejectReason.trim()) {
      alert("반려 사유를 입력해주세요.")
      return
    }

    try {
      setActionLoading(true)
      await pkgApi.approveOrReject(selected.request.id, {
        action: "reject",
        reason: rejectReason.trim(),
      })
      await loadTodo()
      const updated = await pkgApi.getRequestDetail(selected.request.id)
      setSelected(updated)
      setRejectReason("")
      alert("반려 처리되었습니다.")
    } catch (e) {
      console.error(e)
      alert(
        e instanceof Error
          ? e.message
          : "반려 처리 중 오류가 발생했습니다.",
      )
    } finally {
      setActionLoading(false)
    }
  }

  // ── 4) 렌더링 ─────────────────────────

  if (loadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            이 페이지에 접근할 권한이 없습니다.
          </p>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="container px-4 py-10 md:px-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">패키지 승인 To-do</h1>
              <p className="text-sm text-muted-foreground">
                팀원들이 신청한 패키지를{" "}
                {userRole === "LEADER" ? "팀장" : "부장"} 권한으로 승인 또는
                반려합니다.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={loadTodo}>
              새로고침
            </Button>
          </div>

          {errorTodo && (
            <Card className="mb-4 border-destructive/40 bg-destructive/5 p-4 text-xs text-red-600">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>{errorTodo}</span>
              </div>
            </Card>
          )}

          <Card className="space-y-2 p-4">
            {loadingTodo && (
              <p className="text-sm text-muted-foreground">
                승인 대기 목록을 불러오는 중입니다...
              </p>
            )}

            {!loadingTodo && todo.length === 0 && (
              <p className="text-sm text-muted-foreground">
                현재 승인 대기 중인 패키지 신청이 없습니다.
              </p>
            )}

            {!loadingTodo &&
              todo.map((req) => (
                <button
                  key={req.id}
                  type="button"
                  onClick={() => openDetail(req)}
                  className="flex w-full flex-col gap-3 rounded-md border bg-card px-3 py-3 text-left text-sm transition-colors hover:bg-muted"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {req.packageName} ({req.packageVer})
                      </span>
                    </div>
                    {renderStatusBadge(req.status)}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      신청일: {formatDateTime(req.requestedAt)}
                    </span>
                    {req.decidedAt && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        결정일: {formatDateTime(req.decidedAt)}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3 w-3" />
                      요청자 ID: {req.requestedBy}
                    </span>
                  </div>

                  {req.description && (
                    <p className="text-xs text-muted-foreground">
                      사유: {req.description}
                    </p>
                  )}
                </button>
              ))}
          </Card>
        </section>
      </main>
      <Footer />

      {/* 상세 모달 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>패키지 신청 상세</DialogTitle>
            <DialogDescription>
              승인 또는 반려 시 신청자에게 결과가 전달됩니다.
            </DialogDescription>
          </DialogHeader>

          {detailLoading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          {detailError && (
            <p className="text-xs text-red-500">{detailError}</p>
          )}

          {selected && !detailLoading && (
            <div className="space-y-6 text-sm">
              {/* 기본 정보 */}
              <Card className="space-y-1 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {selected.request.packageName} (
                    {selected.request.packageVer})
                  </span>
                  {renderStatusBadge(selected.request.status)}
                </div>
                <p className="text-xs text-muted-foreground">
                  요청 ID #{selected.request.id} · 요청자 ID{" "}
                  {selected.request.requestedBy}
                </p>
                <p className="text-xs text-muted-foreground">
                  신청일 {formatDateTime(selected.request.requestedAt)}{" "}
                  {selected.request.decidedAt &&
                    `· 결정일 ${formatDateTime(
                      selected.request.decidedAt,
                    )}`}
                </p>
                {selected.request.description && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    요청 사유: {selected.request.description}
                  </p>
                )}
              </Card>

              {/* 승인/반려 이력 */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">승인/반려 이력</h3>
                {selected.approvals.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    아직 승인/반려 이력이 없습니다.
                  </p>
                )}
                {selected.approvals.map((a) => (
                  <Card
                    key={a.id}
                    className="flex flex-col gap-1 p-3 text-xs text-muted-foreground"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {a.result === "approved" ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                        <span className="font-medium">
                          {a.step === "L1" ? "1차" : "최종"} ·{" "}
                          {a.result === "approved" ? "승인" : "반려"}
                        </span>
                      </div>
                      <span>{formatDateTime(a.decidedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span>
                        {a.approverName} (ID: {a.approverId})
                      </span>
                    </div>
                    {a.description && (
                      <p className="mt-1">사유: {a.description}</p>
                    )}
                  </Card>
                ))}
              </div>

              {/* 승인/반려 액션 */}
              {canActOn(selected.request.status) ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">승인/반려 처리</h3>
                  <Textarea
                    placeholder="반려 시 사유를 입력해주세요 (승인 시 비워두어도 됩니다)"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReject}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      반려
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleApprove}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      승인
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  현재 권한 또는 상태에서는 승인/반려할 수 없습니다.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
