// src/types/mypage.ts
export interface ApiResponse<T> {
  success: boolean
  data: T
}

export interface MyPageVm {
  id: number
  name: string
  type: string
  status: string
  cpu: number
  memory: number
  storage: number
  os: string
  ipAddress: string
  createdAt: string
  lastUpdated: string
  packages: string[]
}

export interface MyPageData {
  userId: number
  empno: number
  username: string
  email: string
  roleCode: string | null
  roleName: string | null
  teamId: number | null
  teamName: string | null
  vms: MyPageVm[]
}
