"use client"

import { useEffect, useState } from "react"

type UserRoleCode = "ADMIN" | "HEAD" | "LEADER" | "MEMBER" | null

interface CurrentUser {
  isLoggedIn: boolean
  username: string | null
  roleCode: UserRoleCode
  teamName: string | null
}

export function useCurrentUser(): CurrentUser {
  const [user, setUser] = useState<CurrentUser>({
    isLoggedIn: false,
    username: null,
    roleCode: null,
    teamName: null,
  })

  useEffect(() => {
    // 클라이언트에서만 실행
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    const username = localStorage.getItem("username")
    const roleCode = (localStorage.getItem("userRole") as UserRoleCode) ?? null
    const teamName = localStorage.getItem("teamName")

    setUser({
      isLoggedIn,
      username,
      roleCode,
      teamName,
    })
  }, [])

  return user
}
