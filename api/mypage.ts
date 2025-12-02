// src/api/mypage.ts
import apiClient from "@/lib/apiClient"

// ✅ 공통 VM 타입 (모든 역할에서 같이 사용)
export interface MyPageVm {
  id: number
  name: string
  type: string
  status: string
  cpu: string
  memory: string
  storage: string
  os: string
  ipAddress: string
  createdAt: string
  lastUpdated: string
  packages: string[]
}

// ✅ 사원(MEMBER)용 마이페이지 응답
export interface MyPageResponse {
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

// ✅ 팀장(LEADER)용: 팀장 + 팀원 + 각자의 VM
export interface TeamLeaderMemberVmGroup {
  memberId: number
  empno: number
  memberName: string
  email: string
  vms: MyPageVm[]
}

export interface TeamLeaderMyPageResponse {
  leaderId: number
  empno: number
  username: string
  email: string
  roleCode: string | null
  roleName: string | null
  teamId: number
  teamName: string
  members: TeamLeaderMemberVmGroup[]
  totalVmCount: number
  runningVmCount: number
}

// ✅ 부장(HEAD)용: 부장 + 팀 단위 → 팀장 → 팀원 + VM
export interface HeadTeamMemberVmGroup {
  memberId: number
  empno: number
  memberName: string
  email: string
  vms: MyPageVm[]
}

export interface HeadTeamVmGroup {
  teamId: number
  teamName: string
  teamLeaderId: number
  teamLeaderEmpno: number
  teamLeaderName: string
  teamLeaderEmail: string
  members: HeadTeamMemberVmGroup[]
}

export interface HeadMyPageResponse {
  headId: number
  empno: number
  username: string
  email: string
  roleCode: string | null
  roleName: string | null
  deptId: number | null
  deptName: string | null
  teams: HeadTeamVmGroup[]
  totalVmCount: number
  runningVmCount: number
  totalMemberCount: number
}

// -----------------------------
// 실제 호출 함수들
// -----------------------------

// 🔹 사원 마이페이지(/users/me) – 기존 그대로
export const fetchMyPage = async (): Promise<MyPageResponse> => {
  const { data } = await apiClient.get<{ data: MyPageResponse }>("/users/me")
  return data.data
}

// 🔹 팀장 마이페이지 – ✅ 엔드포인트는 실제 BE에 맞게 수정
export const fetchTeamLeaderMyPage = async (): Promise<TeamLeaderMyPageResponse> => {
  const { data } = await apiClient.get<{ data: TeamLeaderMyPageResponse }>("/users/me/team")
  return data.data
}

// 🔹 부장 마이페이지 – ✅ 엔드포인트는 실제 BE에 맞게 수정
export const fetchHeadMyPage = async (): Promise<HeadMyPageResponse> => {
  const { data } = await apiClient.get<{ data: HeadMyPageResponse }>("/users/me/dept")
  return data.data
}
