"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { LogOut, LogIn, User, UserCircle, Server, Package, Bell, CheckCircle, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  requestId?: string
  timestamp: string
  read: boolean
}

export function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const router = useRouter()

  /** ✅ 로그인 상태 및 알림 불러오기 */
  useEffect(() => {
  const loggedIn = localStorage.getItem("isLoggedIn") === "true"
  const role = localStorage.getItem("userRole")
  setIsLoggedIn(loggedIn)
  setUserRole(role)

  const loadNotifications = () => {
    const stored = JSON.parse(localStorage.getItem("notifications") || "[]")
    setNotifications(stored)
  }

  loadNotifications()
  const interval = setInterval(loadNotifications, 2000)
  return () => clearInterval(interval)
}, [])

  /** ✅ 로그아웃 처리 */
  const handleLogout = () => {
  // ✅ 로그인 상태 초기화
  localStorage.removeItem("isLoggedIn")
  localStorage.removeItem("userRole")

  setIsLoggedIn(false)
  setUserRole(null)

  // ✅ 홈으로 이동
  router.push("/")
  window.dispatchEvent(new Event("storage"))

}

  /** ✅ 로그인 페이지 이동 */
  const handleLogin = () => router.push("/login")

  /** ✅ 읽지 않은 알림 개수 계산 */
  const unreadCount = notifications.filter((n) => !n.read).length

  /** ✅ 알림 클릭 시 모달 표시 */
  const handleNotificationClick = (notification: Notification) => {
    const updatedNotifications = notifications.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    setNotifications(updatedNotifications)
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications))

    if (notification.type === "final_approval" && notification.requestId) {
      const requests = JSON.parse(localStorage.getItem("packageRequests") || "[]")
      const request = requests.find((r: any) => r.id === notification.requestId)
      if (request) {
        setSelectedNotification(notification)
        setShowNotificationModal(true)
      }
    }
  }

  /** ✅ 시간 포맷 변환 함수 */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60) // minutes

    if (diff < 1) return "방금 전"
    if (diff < 60) return `${diff}분 전`
    if (diff < 1440) return `${Math.floor(diff / 60)}시간 전`
    return date.toLocaleDateString("ko-KR")
  }

  /** ✅ 승인 권한 여부 */
  const hasApprovalRole = userRole === "team-leader" || userRole === "manager" || userRole === "admin"

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">CP</span>
            </div>
            <span className="text-xl font-semibold tracking-tight">Cloud Pilot</span>
          </Link>

          {/* 오른쪽 메뉴 */}
          <div className="flex items-center gap-3">
            {/* ✅ 여기 추가 */}
            {isLoggedIn && (
              <div className="flex flex-col text-right mr-2">
                <span className="text-sm font-medium">{localStorage.getItem("username")}</span>
                <span className="text-xs text-muted-foreground">{localStorage.getItem("userRole")}</span>
              </div>
            )}
            {/* 🔔 알림 */}
            {isLoggedIn && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="p-2">
                    <p className="font-semibold mb-2 px-2">알림</p>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">알림이 없습니다</div>
                    ) : (
                      <div className="space-y-1 max-h-96 overflow-y-auto">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-3 hover:bg-muted rounded-md cursor-pointer ${
                              !notification.read ? "bg-primary/5" : ""
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">{formatDate(notification.timestamp)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* 👤 사용자 아바타 */}
            {isLoggedIn && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                    <Avatar className="h-9 w-9 cursor-pointer">
                      <AvatarImage src="/placeholder.svg" alt="User" />
                      <AvatarFallback className="bg-secondary">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/mypage" className="flex items-center gap-2 cursor-pointer">
                      <UserCircle className="h-4 w-4" />
                      <span>마이페이지</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/vm-status" className="flex items-center gap-2 cursor-pointer">
                      <Server className="h-4 w-4" />
                      <span>VM 생성 현황</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/package-status" className="flex items-center gap-2 cursor-pointer">
                      <Package className="h-4 w-4" />
                      <span>패키지 신청현황</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/package-list" className="flex items-center gap-2 cursor-pointer">
                      <Package className="h-4 w-4" />
                      <span>패키지 현황</span>
                    </Link>
                  </DropdownMenuItem>

                  {userRole === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                          <Shield className="h-4 w-4" />
                          <span>관리자 대시보드</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {hasApprovalRole && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/approval" className="flex items-center gap-2 cursor-pointer">
                          <CheckCircle className="h-4 w-4" />
                          <span>승인</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* 로그인 / 로그아웃 버튼 */}
            {isLoggedIn ? (
              <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">로그아웃</span>
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={handleLogin}>
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">로그인</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ✅ 알림 상세 모달 */}
      <Dialog open={showNotificationModal} onOpenChange={setShowNotificationModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>패키지 신청 최종승인</DialogTitle>
            <DialogDescription>패키지 신청이 최종 승인되었습니다</DialogDescription>
          </DialogHeader>

          {selectedNotification &&
            selectedNotification.requestId &&
            (() => {
              const requests = JSON.parse(localStorage.getItem("packageRequests") || "[]")
              const request = requests.find((r: any) => r.id === selectedNotification.requestId)

              if (!request) return null

              return (
                <div className="space-y-4">
                  <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                    <p className="text-sm text-green-800 font-medium">
                      <CheckCircle className="inline h-4 w-4 mr-1" />
                      최종 승인 완료
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">패키지 목록</h3>
                    <div className="space-y-2">
                      {request.packages.map((pkg: any, index: number) => (
                        <div key={pkg.id} className="rounded-lg border bg-muted/30 p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {index + 1}. {pkg.name}
                            </span>
                            {pkg.version && (
                              <Badge variant="secondary" className="text-xs">
                                v{pkg.version}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })()}
        </DialogContent>
      </Dialog>
    </>
  )
}
