// ...existing code...
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/providers/AuthProvider";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import {
  LogOut,
  LogIn,
  User,
  UserCircle,
  Server,
  Package,
  Bell,
  CheckCircle,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// 알림 타입
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  requestId?: string;
  timestamp: string;
  read: boolean;
}

export function Header() {
  const { user, setUser, setIsLoggingOut } = useUser(); // ⭐ isLoggingOut도 사용
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // ⭐ 로그아웃
  const logout = async () => {
    try {
      setIsLoggingOut(true);

      const res = await fetch("/api/backend/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        console.warn("❗ 백엔드 로그아웃 요청 실패");
      }
    } catch (err) {
      console.error("[LOGOUT ERROR]", err);
    } finally {
      // 🔥 로그아웃 시 관련 캐시만 선별적으로 삭제
      localStorage.removeItem("notifications");
      localStorage.removeItem("packageRequests");

      // 상태 초기화
      setUser(null);

      // 홈으로 이동
      router.push("/");
    }
  };

  // TODO: [성능 개선] 현재 2초마다 폴링하는 방식은 데모용이며, 실제 서비스에서는 매우 비효율적입니다.
  // WebSocket 또는 SSE(Server-Sent Events) 방식으로 서버가 클라이언트에게 알림을 푸시하는 방식으로 변경해야 합니다.
  useEffect(() => {
    const loadNotifications = () => {
      const stored = JSON.parse(localStorage.getItem("notifications") || "[]");
      setNotifications(stored);
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = () => router.push("/login");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    const updatedNotifications = notifications.map((n) =>
      n.id === notification.id ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifications);
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications));

    if (notification.type === "final_approval" && notification.requestId) {
      const requests = JSON.parse(
        localStorage.getItem("packageRequests") || "[]"
      );
      const request = requests.find((r: any) => r.id === notification.requestId);

      if (request) {
        setSelectedNotification(notification);
        setShowNotificationModal(true);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);

    if (diff < 1) return "방금 전";
    if (diff < 60) return `${diff}분 전`;
    if (diff < 1440) return `${Math.floor(diff / 60)}시간 전`;
    return date.toLocaleDateString("ko-KR");
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">
                CP
              </span>
            </div>
            <span className="text-xl font-semibold tracking-tight">
              Cloud Pilot
            </span>
          </Link>

          {/* 오른쪽 그룹: 컨트롤들과 로그인 버튼을 분리하여 버튼이 항상 맨 오른쪽에 위치하도록 함 */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              {/* 로그인 정보 */}
              {user && (
                <div className="flex flex-col text-right">
                  <span className="text-sm font-medium">{user.username}</span>
                  <span className="text-xs text-muted-foreground">
                    {user.roleName}
                  </span>
                </div>
              )}

              {/* 알림 */}
              {user && (
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
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          알림이 없습니다
                        </div>
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
                              <p className="text-sm font-medium">
                                {notification.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(notification.timestamp)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* 프로필 */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-full focus:outline-none">
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
                      <Link href="/mypage" className="flex items-center gap-2">
                        <UserCircle className="h-4 w-4" /> 마이페이지
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link href="/vm-status" className="flex items-center gap-2">
                        <Server className="h-4 w-4" /> VM 생성 현황
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link
                        href="/package-status"
                        className="flex items-center gap-2"
                      >
                        <Package className="h-4 w-4" /> 패키지 신청현황
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link
                        href="/package-list"
                        className="flex items-center gap-2"
                      >
                        <Package className="h-4 w-4" /> 패키지 현황
                      </Link>
                    </DropdownMenuItem>

                    {/* ADMIN 전용 */}
                    {user.roleCode === "ADMIN" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex items-center gap-2">
                            <Shield className="h-4 w-4" /> 관리자 대시보드
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    {/* 승인 메뉴 */}
                    {["LEADER", "HEAD", "ADMIN"].includes(user.roleCode) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link
                            href="/approval"
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="h-4 w-4" /> 승인
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* 로그인 / 로그아웃 버튼 (항상 그룹의 맨 오른쪽에 위치) */}
            <div className="ml-4">
              {user ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4" /> 로그아웃
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent"
                  onClick={handleLogin}
                >
                  <LogIn className="h-4 w-4" /> 로그인
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 알림 모달 */}
      <Dialog
        open={showNotificationModal}
        onOpenChange={setShowNotificationModal}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>패키지 신청 최종승인</DialogTitle>
            <DialogDescription>
              패키지 신청이 최종 승인되었습니다.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
// ...existing code...