// src/types/mypage.ts

export interface ApiResponse<T> {
  success: boolean
  data: T
}

/** 🔹 VM 담당자 정보 타입 */
export interface VmAssignedMember {
  userId?: number
  username?: string
  name?: string
  employeeId?: string
  roleCode?: string   // "LEADER" | "MEMBER" 등
  roleName?: string   // "팀장" | "팀원" 등
}

/** 🔹 마이페이지 VM 정보 */
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

  /** 백엔드에서 내려주는 담당 팀원 정보 (없으면 undefined 또는 빈 배열) */
  assignedMembers?: VmAssignedMember[]
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
