// lib/api/pkg.ts

import { apiClient } from "@/lib/api/base-client"

export type PkgRequestStatus = "pending" | "l1_approved" | "approved" | "rejected"
export type PkgApprovalStep = "L1" | "FINAL"
export type PkgApprovalResult = "approved" | "rejected"

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PkgRequestResponse {
  id: number
  packageName: string
  packageVer: string
  description?: string | null
  status: PkgRequestStatus
  requestedAt: string
  decidedAt?: string | null
  requestedBy: number
}

export interface PkgApprovalHistoryResponse {
  id: number
  step: PkgApprovalStep
  result: PkgApprovalResult
  description?: string | null
  decidedAt: string
  approverId: number
  approverName: string
}

export interface PkgRequestDetailResponse {
  request: PkgRequestResponse
  approvals: PkgApprovalHistoryResponse[]
}

export interface PkgRequestCreateRequest {
  packageName: string
  packageVer: string
  description?: string
}

export interface PkgApprovalActionRequest {
  action: "approve" | "reject"
  reason?: string
}

export const pkgApi = {
  /** 1) 패키지 설치 요청 생성 */
  async createRequest(body: PkgRequestCreateRequest): Promise<PkgRequestResponse> {
    const res = await apiClient.post<ApiResponse<PkgRequestResponse>>("/packages/requests", body)
    if (!res.data?.success || !res.data.data) {
      throw new Error(res.data?.message || "패키지 요청 생성 실패")
    }
    return res.data.data
  },

  /** 2) 요청 목록 조회 (view=my|history|todo) */
  async getRequests(view: "my" | "history" | "todo" = "my"): Promise<PkgRequestResponse[]> {
    const res = await apiClient.get<ApiResponse<PkgRequestResponse[]>>("/packages/requests", {
      params: { view },
    })
    if (!res.data?.success || !Array.isArray(res.data.data)) {
      throw new Error(res.data?.message || "패키지 요청 목록 조회 실패")
    }
    return res.data.data
  },

  /** 3) 단일 요청 + 승인/반려 이력 상세 조회 */
  async getRequestDetail(requestId: number): Promise<PkgRequestDetailResponse> {
    const res = await apiClient.get<ApiResponse<PkgRequestDetailResponse>>(`/packages/requests/${requestId}`)
    if (!res.data?.success || !res.data.data) {
      throw new Error(res.data?.message || "패키지 요청 상세 조회 실패")
    }
    return res.data.data
  },

  /** 4) 승인/반려 실행 (팀장/부장 공통) */
  async approveOrReject(
    requestId: number,
    body: PkgApprovalActionRequest,
  ): Promise<PkgRequestResponse> {
    const res = await apiClient.post<ApiResponse<PkgRequestResponse>>(
      `/packages/requests/${requestId}/approve`,
      body,
    )
    if (!res.data?.success || !res.data.data) {
      throw new Error(res.data?.message || "패키지 승인/반려 처리 실패")
    }
    return res.data.data
  },
}
