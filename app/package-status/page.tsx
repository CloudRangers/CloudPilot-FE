"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Package,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  ChevronRight,
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
} from "@/lib/api/pkg"

export default function PackageStatusPage() {
  const [requests, setRequests] = useState<PkgRequestResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedDetail, setSelectedDetail] =
    useState<PkgRequestDetailResponse | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // ─────────────────────────────────────
  // 1. 내 패키지 신청 목록 조회 (view = "my")
  // ─────────────────────────────────────
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await pkgApi.getRequests("my")
        setRequests(data)
      } catch (e) {
        console.error("[package-status] list error", e)
        const msg =
          e instanceof Error
            ? e.message
            : "패키지 신청 목록을 불러오지 못했습니다."
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [])

  // 날짜 포맷
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return "-"
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // 상태 텍스트/아이콘
  const getStatusDisplay = (status: PkgRequestResponse["status"]) => {
    if (status === "pending") {
      return (
        <div className="flex items-center gap-2">
          <span className="text-yellow-600 font-medium">승인 대기중</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-yellow-600 font-medium">
            팀장/부장 검토 중
          </span>
        </div>
      )
    }

    if (status === "l1_approved") {
      return (
        <div className="flex items-center gap-2">
          <span className="text-green-600 font-medium">팀장 승인</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-yellow-600 font-medium">부장 대기중</span>
        </div>
      )
    }

    if (status === "approved") {
      return (
        <div className="flex items-center gap-2">
          <span className="text-green-600 font-bold text-lg">최종승인</span>
        </div>
      )
    }

    if (status === "rejected") {
      return (
        <div className="flex items-center gap-2">
          <span className="text-red-600 font-medium">반려됨</span>
        </div>
      )
    }

    return <span className="text-muted-foreground">상태 확인 중</span>
  }

  // 카드 클릭 시 상세 조회
  const handleRequestClick = async (req: PkgRequestResponse) => {
    try {
      const detail = await pkgApi.getRequestDetail(req.id)
      setSelectedDetail(detail)
      setShowDetailModal(true)
    } catch (e) {
      console.error("[package-status] detail error", e)
      const msg =
        e instanceof Error
          ? e.message
          : "신청 상세 정보를 불러오지 못했습니다."
      alert(msg)
    }
  }

  const selectedRequest = selectedDetail?.request

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <Header />

      <main className="flex-1">
        <div className="container px-4 py-8 md:px-6 md:py-12">
          <div className="mx-auto max-w-6xl">
            {/* 헤더 */}
            <div className="space-y-3 text-center mb-8">
              <div className="flex items-center justify-center gap-3">
                <div className="rounded-xl bg-primary/10 p-3">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  패키지 신청현황
                </h1>
              </div>
              <p className="text-muted-foreground">
                신청한 패키지의 승인 상태를 확인하세요
              </p>
            </div>

            {/* 로딩 */}
            {loading && (
              <Card className="p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  신청 목록을 불러오는 중입니다...
                </p>
              </Card>
            )}

            {/* 에러 */}
            {error && !loading && (
              <Card className="p-8 text-center">
                <p className="text-sm text-destructive mb-2">{error}</p>
                <p className="text-xs text-muted-foreground">
                  문제가 계속되면 관리자에게 문의해주세요.
                </p>
              </Card>
            )}

            {/* 비어있음 */}
            {!loading && !error && requests.length === 0 && (
              <Card className="p-12 text-center">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  신청한 패키지가 없습니다
                </h3>
                <p className="text-muted-foreground">
                  패키지 신청 페이지에서 새로운 패키지를 신청해보세요.
                </p>
              </Card>
            )}

            {/* 목록 */}
            {!loading && !error && requests.length > 0 && (
              <div className="space-y-4">
                {requests.map((request) => (
                  <Card
                    key={request.id}
                    className="border-2 shadow-lg overflow-hidden cursor-pointer hover:border-primary/50 transition-all"
                    onClick={() => handleRequestClick(request)}
                  >
                    {/* 상단 상태/메타 정보 */}
                    <div className="border-b bg-muted/30 px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {formatDate(request.requestedAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            요청자 ID: {request.requestedBy}
                          </span>
                        </div>
                      </div>
                      {getStatusDisplay(request.status)}
                    </div>

                    {/* 내용 */}
                    <div className="p-6">
                      <h3 className="font-semibold mb-4">신청 패키지 정보</h3>
                      <div className="rounded-lg border bg-muted/30 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-semibold text-primary">
                            1
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {request.packageName}
                              </p>
                              {request.packageVer && (
                                <Badge variant="secondary" className="text-xs">
                                  v{request.packageVer}
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className="text-[10px]"
                              >
                                {request.status}
                              </Badge>
                            </div>
                            {request.description && (
                              <p className="text-sm text-muted-foreground">
                                {request.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 상세 모달 */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>패키지 신청 상세 정보</DialogTitle>
            {selectedRequest && (
              <DialogDescription>
                신청 ID: {selectedRequest.id}
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedDetail && selectedRequest && (
            <div className="space-y-6">
              {/* 신청 정보 */}
              <div className="space-y-2">
                <h3 className="font-semibold">신청 정보</h3>
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1 text-sm">
                  <p>
                    <span className="font-medium">패키지 이름:</span>{" "}
                    {selectedRequest.packageName}
                  </p>
                  <p>
                    <span className="font-medium">버전:</span>{" "}
                    {selectedRequest.packageVer}
                  </p>
                  {selectedRequest.description && (
                    <p>
                      <span className="font-medium">사유:</span>{" "}
                      {selectedRequest.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    요청자 ID: {selectedRequest.requestedBy}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    신청일: {formatDate(selectedRequest.requestedAt)}
                  </p>
                  {selectedRequest.decidedAt && (
                    <p className="text-xs text-muted-foreground">
                      최종 처리일: {formatDate(selectedRequest.decidedAt)}
                    </p>
                  )}
                </div>
              </div>

              {/* 승인 이력 */}
              <div className="space-y-2">
                <h3 className="font-semibold">승인 이력</h3>
                {selectedDetail.approvals.length === 0 ? (
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground">
                      아직 등록된 승인/반려 이력이 없습니다.
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {selectedDetail.approvals.map((appr) => (
                      <Card key={appr.id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-[10px]"
                            >
                              {appr.step === "L1" ? "1차 승인" : "최종 승인"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {appr.approverName} (ID: {appr.approverId})
                            </span>
                          </div>
                          {appr.result === "approved" ? (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              승인
                            </span>
                          ) : (
                            <span className="text-xs text-red-600 flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              반려
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          처리일: {formatDate(appr.decidedAt)}
                        </p>
                        {appr.description && (
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {appr.description}
                          </p>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* 반려 안내 */}
              {selectedRequest.status === "rejected" && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <p className="text-sm text-red-800 font-medium mb-1">
                    <XCircle className="inline h-4 w-4 mr-1" />
                    이 요청은 반려된 상태입니다.
                  </p>
                  <p className="text-xs text-red-700">
                    승인 이력에서 반려 단계의 사유를 확인하실 수 있습니다.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
