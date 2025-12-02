// src/types/mypage-head.ts
import type { MyPageVm } from "./mypage"

export interface HeadMyPageTeamMember {
  teamMember: string
  servers: MyPageVm[]
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
