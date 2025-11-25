"use client";

import { createContext, useContext, useEffect, useState } from "react";

// 🔥 User 타입 정의
export interface UserInfo {
  username: string;
  roleCode: string;
  roleName: string;
  teamId: number | null;
  teamName: string;
}

// 🔥 Context 타입 정의
interface AuthContextType {
  user: UserInfo | null;
  setUser: (user: UserInfo | null) => void;
  loading: boolean;
  isLoggingOut: boolean;
  setIsLoggingOut: (v: boolean) => void;
}

// 🔥 context 생성
const AuthContext = createContext<AuthContextType | null>(null);

// 🔥 Provider
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ★ 초기 로그인 상태 확인 (Race Condition 방어)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/backend/auth/me", {
          credentials: "include",
        });

        const raw = await res.text();
        if (!raw) {
          // ❗ 이미 로그인 상태가 설정되어 있으면 유지
          setUser((prev) => prev);
          setLoading(false);
          return;
        }

        const json = JSON.parse(raw);

        if (json.success && json.data) {
          // ❗ 기존 user가 있다면 덮어쓰지 않음
          setUser((prev) => prev ?? json.data);
        } else {
          // ❗ null로 덮어쓰지 않음
          setUser((prev) => prev);
        }
      } catch {
        // ❗ 에러여도 기존 상태 유지
        setUser((prev) => prev);
      }

      setLoading(false);
    })();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        isLoggingOut,
        setIsLoggingOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// 🔥 인증 훅
export function useUser() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useUser must be used within AuthProvider");
  return ctx;
}
