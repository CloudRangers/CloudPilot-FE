// src/lib/api/provision.ts
import { apiClient } from "@/lib/api/base-client"

// BE ProvisionResponse (우리가 사용하는 필드만 정의)
export interface ProvisionResponse {
  jobId?: string | null
  batchId?: string | null
  totalCount: number
  jobIds: number[]
  status: string
  message: string
  createdAt: string
}

// BE ProvisionRequest 에 맞춘 요청 페이로드 타입
export interface ProvisionRequestPayload {
  zoneId: number
  cpuCores: number
  memoryGb: number
  diskGb: number
  teamId?: number | null
  vmName?: string
  vmCount?: number
  providerType?: "VSPHERE" | string
  catalogId?: number
  purpose?: string
  tags?: Record<string, string>
  additionalConfig?: Record<string, unknown>
}

export const provisionApi = {
  createProvision: async (payload: ProvisionRequestPayload) => {
    // POST /provision (ProvisionController)
    const res = await apiClient.post<ProvisionResponse>("/provision", payload)
    return res.data
  },
}
