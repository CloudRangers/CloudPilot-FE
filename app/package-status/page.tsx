"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, CheckCircle, XCircle, Calendar, User, ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface PackageRequest {
  id: string
  packages: Array<{
    id: string
    name: string
    version: string
    reason: string
  }>
  teamLeaderStatus: "pending" | "approved" | "rejected"
  managerStatus: "pending" | "approved" | "rejected"
  requestDate: string
  requester: string
  employeeId: string
  teamLeaderApprovedDate?: string
  managerApprovedDate?: string
  teamLeaderRejectionReason?: string
  managerRejectionReason?: string
}

export default function PackageStatusPage() {
  const [requests, setRequests] = useState<PackageRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<PackageRequest | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    const storedRequests = JSON.parse(localStorage.getItem("packageRequests") || "[]")
    setRequests(storedRequests)
  }, [])

  const getStatusDisplay = (request: PackageRequest) => {
    if (request.teamLeaderStatus === "rejected") {
      return (
        <div className="flex items-center gap-2">
          <span className="text-red-600 font-medium">팀장 반려됨</span>
        </div>
      )
    }

    if (request.teamLeaderStatus === "pending") {
      return (
        <div className="flex items-center gap-2">
          <span className="text-yellow-600 font-medium">팀장 대기중</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-yellow-600 font-medium">부장 대기중</span>
        </div>
      )
    }

    if (request.teamLeaderStatus === "approved" && request.managerStatus === "pending") {
      return (
        <div className="flex items-center gap-2">
          <span className="text-green-600 font-medium">팀장 승인</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-yellow-600 font-medium">부장 대기중</span>
        </div>
      )
    }

    if (request.teamLeaderStatus === "approved" && request.managerStatus === "rejected") {
      return (
        <div className="flex items-center gap-2">
          <span className="text-green-600 font-medium">팀장 승인</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-red-600 font-medium">부장 반려됨</span>
        </div>
      )
    }

    if (request.teamLeaderStatus === "approved" && request.managerStatus === "approved") {
      return (
        <div className="flex items-center gap-2">
          <span className="text-green-600 font-bold text-lg">최종승인</span>
        </div>
      )
    }

    return <span className="text-muted-foreground">상태 확인 중</span>
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

  const handleRequestClick = (request: PackageRequest) => {
    setSelectedRequest(request)
    setShowDetailModal(true)
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <Header />

      <main className="flex-1">
        <div className="container px-4 py-8 md:px-6 md:py-12">
          <div className="mx-auto max-w-6xl">
            <div className="space-y-3 text-center mb-8">
              <div className="flex items-center justify-center gap-3">
                <div className="rounded-xl bg-primary/10 p-3">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">패키지 신청현황</h1>
              </div>
              <p className="text-muted-foreground">신청한 패키지의 승인 상태를 확인하세요</p>
            </div>

            {requests.length === 0 ? (
              <Card className="p-12 text-center">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">신청한 패키지가 없습니다</h3>
                <p className="text-muted-foreground">패키지 신청 페이지에서 새로운 패키지를 신청해보세요.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <Card
                    key={request.id}
                    className="border-2 shadow-lg overflow-hidden cursor-pointer hover:border-primary/50 transition-all"
                    onClick={() => handleRequestClick(request)}
                  >
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
                      {getStatusDisplay(request)}
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
        </div>
      </main>

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
                <h3 className="font-semibold">승인 현황</h3>
                <div className="rounded-lg border p-4 space-y-3">
                  {getStatusDisplay(selectedRequest)}

                  {selectedRequest.teamLeaderApprovedDate && (
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                      <p className="text-sm text-green-800">
                        <CheckCircle className="inline h-4 w-4 mr-1" />
                        팀장 승인: {formatDate(selectedRequest.teamLeaderApprovedDate)}
                      </p>
                    </div>
                  )}

                  {selectedRequest.managerApprovedDate && (
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                      <p className="text-sm text-green-800">
                        <CheckCircle className="inline h-4 w-4 mr-1" />
                        부장 승인: {formatDate(selectedRequest.managerApprovedDate)}
                      </p>
                    </div>
                  )}
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

              {selectedRequest.teamLeaderStatus === "rejected" && selectedRequest.teamLeaderRejectionReason && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <p className="text-sm text-red-800 font-medium mb-2">
                    <XCircle className="inline h-4 w-4 mr-1" />
                    팀장 반려 사유
                  </p>
                  <p className="text-sm text-red-700">{selectedRequest.teamLeaderRejectionReason}</p>
                </div>
              )}

              {selectedRequest.managerStatus === "rejected" && selectedRequest.managerRejectionReason && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <p className="text-sm text-red-800 font-medium mb-2">
                    <XCircle className="inline h-4 w-4 mr-1" />
                    부장 반려 사유
                  </p>
                  <p className="text-sm text-red-700">{selectedRequest.managerRejectionReason}</p>
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
