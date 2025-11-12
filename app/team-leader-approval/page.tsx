"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle, XCircle, Calendar, User } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface PackageRequest {
  id: string
  packages: Array<{
    id: string
    name: string
    version: string
    reason: string
  }>
  firstApprovalStatus: "pending" | "approved" | "rejected"
  finalApprovalStatus: "pending" | "approved" | "rejected"
  requestDate: string
  requester: string
  employeeId: string
  requesterRole: "employee" | "team-leader"
  firstApprovedDate?: string
  finalApprovedDate?: string
  firstRejectionReason?: string
  finalRejectionReason?: string
}

export default function TeamLeaderApprovalPage() {
  const [requests, setRequests] = useState<PackageRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<PackageRequest | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = () => {
    const storedRequests = JSON.parse(localStorage.getItem("packageRequests") || "[]")
    // 사원이 신청한 것만 팀장 승인 페이지에 표시
    const employeeRequests = storedRequests.filter((req: PackageRequest) => req.requesterRole === "employee")
    setRequests(employeeRequests)
  }

  const handleApprove = () => {
    if (!selectedRequest) return

    const updatedRequests = requests.map((req) =>
      req.id === selectedRequest.id
        ? {
            ...req,
            firstApprovalStatus: "approved" as const,
            firstApprovedDate: new Date().toISOString(),
          }
        : req,
    )

    // localStorage 전체 업데이트
    const allRequests = JSON.parse(localStorage.getItem("packageRequests") || "[]")
    const finalUpdated = allRequests.map((req: PackageRequest) =>
      req.id === selectedRequest.id
        ? {
            ...req,
            firstApprovalStatus: "approved" as const,
            firstApprovedDate: new Date().toISOString(),
          }
        : req,
    )
    localStorage.setItem("packageRequests", JSON.stringify(finalUpdated))

    const notifications = JSON.parse(localStorage.getItem("notifications") || "[]")
    notifications.push({
      id: Date.now().toString(),
      type: "first_approval",
      title: "패키지 신청 1차승인",
      message: `${selectedRequest.packages.map((p) => p.name).join(", ")} 패키지 신청이 1차 승인되었습니다.`,
      requestId: selectedRequest.id,
      timestamp: new Date().toISOString(),
      read: false,
    })
    localStorage.setItem("notifications", JSON.stringify(notifications))

    setRequests(updatedRequests)
    setShowDetailModal(false)
    setSelectedRequest(null)
  }

  const handleReject = () => {
    if (!selectedRequest || !rejectionReason.trim()) return

    const updatedRequests = requests.map((req) =>
      req.id === selectedRequest.id
        ? {
            ...req,
            firstApprovalStatus: "rejected" as const,
            firstRejectionReason: rejectionReason,
          }
        : req,
    )

    const allRequests = JSON.parse(localStorage.getItem("packageRequests") || "[]")
    const finalUpdated = allRequests.map((req: PackageRequest) =>
      req.id === selectedRequest.id
        ? {
            ...req,
            firstApprovalStatus: "rejected" as const,
            firstRejectionReason: rejectionReason,
          }
        : req,
    )
    localStorage.setItem("packageRequests", JSON.stringify(finalUpdated))

    setRequests(updatedRequests)
    setShowDetailModal(false)
    setSelectedRequest(null)
    setRejectionReason("")
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const pendingRequests = requests.filter((req) => req.firstApprovalStatus === "pending")
  const processedRequests = requests.filter((req) => req.firstApprovalStatus !== "pending")

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <Header />

      <main className="flex-1">
        <div className="container px-4 py-8 md:px-6 md:py-12">
          <div className="mx-auto max-w-6xl">
            <div className="space-y-3 text-center mb-8">
              <div className="flex items-center justify-center gap-3">
                <div className="rounded-xl bg-primary/10 p-3">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">패키지 승인 관리 (팀장)</h1>
              </div>
              <p className="text-muted-foreground">팀장님, 팀원의 패키지 신청을 검토하고 1차 승인해주세요</p>
            </div>

            <div className="space-y-8">
              {/* Pending Requests */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  1차 승인 대기중 ({pendingRequests.length})
                </h2>

                {pendingRequests.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">승인 대기중인 패키지 신청이 없습니다.</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <Card
                        key={request.id}
                        className="border-2 border-yellow-200 shadow-lg overflow-hidden cursor-pointer hover:border-yellow-300 transition-all"
                        onClick={() => {
                          setSelectedRequest(request)
                          setShowDetailModal(true)
                        }}
                      >
                        <div className="border-b bg-yellow-50 px-6 py-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{formatDate(request.requestDate)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {request.requester} ({request.employeeId})
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                            <Clock className="mr-1 h-3 w-3" />
                            1차 승인 대기중
                          </Badge>
                        </div>

                        <div className="p-6">
                          <h3 className="font-semibold mb-4">신청 패키지 목록</h3>
                          <div className="space-y-3">
                            {request.packages.map((pkg, index) => (
                              <div key={pkg.id} className="rounded-lg border bg-muted/30 p-4">
                                <div className="flex items-start gap-3">
                                  <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-semibold text-primary">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium">{pkg.name}</p>
                                      {pkg.version && (
                                        <Badge variant="secondary" className="text-xs">
                                          v{pkg.version}
                                        </Badge>
                                      )}
                                    </div>
                                    {pkg.reason && <p className="text-sm text-muted-foreground">{pkg.reason}</p>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Processed Requests */}
              {processedRequests.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    처리 완료 ({processedRequests.length})
                  </h2>

                  <div className="space-y-4">
                    {processedRequests.map((request) => (
                      <Card key={request.id} className="border-2 shadow-lg overflow-hidden opacity-75">
                        <div className="border-b bg-muted/30 px-6 py-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{formatDate(request.requestDate)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {request.requester} ({request.employeeId})
                              </span>
                            </div>
                          </div>
                          {request.firstApprovalStatus === "approved" ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              1차승인
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                              <XCircle className="mr-1 h-3 w-3" />
                              반려됨
                            </Badge>
                          )}
                        </div>

                        <div className="p-6">
                          <div className="space-y-3">
                            {request.packages.map((pkg) => (
                              <div key={pkg.id} className="rounded-lg border bg-muted/30 p-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{pkg.name}</span>
                                  {pkg.version && (
                                    <Badge variant="secondary" className="text-xs">
                                      v{pkg.version}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {request.firstApprovalStatus === "rejected" && request.firstRejectionReason && (
                            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3">
                              <p className="text-sm text-red-700">반려 사유: {request.firstRejectionReason}</p>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Detail Modal with Approval/Rejection */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>패키지 신청 상세 정보</DialogTitle>
            <DialogDescription>신청 ID: {selectedRequest?.id}</DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold">신청자 정보</h3>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm">
                    <span className="font-medium">이름:</span> {selectedRequest.requester}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">사번:</span> {selectedRequest.employeeId}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">신청일:</span> {formatDate(selectedRequest.requestDate)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">패키지 목록</h3>
                <div className="space-y-3">
                  {selectedRequest.packages.map((pkg, index) => (
                    <div key={pkg.id} className="rounded-lg border bg-muted/30 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-semibold text-primary">
                          {index + 1}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{pkg.name}</p>
                            {pkg.version && (
                              <Badge variant="secondary" className="text-xs">
                                v{pkg.version}
                              </Badge>
                            )}
                          </div>
                          {pkg.reason && <p className="text-sm text-muted-foreground">{pkg.reason}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedRequest.firstApprovalStatus === "pending" && (
                <>
                  <div className="space-y-2">
                    <h3 className="font-semibold">반려 사유 (선택사항)</h3>
                    <Textarea
                      placeholder="반려하는 경우 사유를 입력하세요..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      onClick={handleReject}
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
                      disabled={!rejectionReason.trim()}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      반려하기
                    </Button>
                    <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700 text-white">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      1차 승인
                    </Button>
                  </DialogFooter>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
