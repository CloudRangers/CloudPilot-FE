// src/types/mypage-leader.ts
import type { MyPageVm } from "./mypage"

/**
 * 🔹 MyPageVm 안에 assignedMembers 포함됨
 */

export interface TeamLeaderMember {
  teamMember: string
  servers: MyPageVm[]   // VM 안에 assignedMembers 포함됨
}

export interface TeamLeaderMyPageData {
  leaderName: string
  leaderEmployeeId: string
  department: string
  teamName: string
  roleName: string
  members: TeamLeaderMember[]
}
