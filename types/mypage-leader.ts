// src/types/mypage-leader.ts
import type { MyPageVm } from "./mypage"

export interface TeamLeaderMember {
  teamMember: string
  servers: MyPageVm[]
}

export interface TeamLeaderMyPageData {
  leaderName: string
  leaderEmployeeId: string
  department: string
  teamName: string
  roleName: string
  members: TeamLeaderMember[]
}
