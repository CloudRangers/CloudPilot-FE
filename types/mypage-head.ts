// src/types/mypage-head.ts
import type { MyPageVm } from "./mypage"

/**
 * 🔹 MyPageVm 안에 assignedMembers 포함됨
 * Head/Leader 페이지에서 재사용 가능
 */

export interface HeadMyPageTeamMember {
  teamMember: string
  servers: MyPageVm[]   // 각 VM 안에 assignedMembers 포함
}

export interface HeadMyPageTeam {
  teamName: string
  teamLeader: string
  members: HeadMyPageTeamMember[]
}

export interface HeadMyPageData {
  managerName: string
  managerEmployeeId: string
  department: string
  roleName: string
  teams: HeadMyPageTeam[]
}
