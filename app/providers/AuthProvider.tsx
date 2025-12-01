"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api/fetchWithAuth";

export interface UserInfo {
  username: string;
  roleCode: string;
  roleName: string;
  teamId: number | null;
  teamName: string;
}

interface AuthContextType {
  user: UserInfo | null;
  setUser: (user: UserInfo | null) => void;
  loading: boolean;
  isLoggingOut: boolean;
  setIsLoggingOut: (v: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // 인증 실패 시 리디렉션하지 않도록 옵션 추가
        const json = await fetchWithAuth(
          "/api/backend/auth/me",
          {},
          { redirectOnFail: false }
        );

        if (json?.success && json.data) {
          if (mounted) setUser(json.data);
        } else {
          if (mounted) setUser(null);
        }
      } catch (err: any) {
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
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

export function useUser() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useUser must be used within AuthProvider");
  return ctx;
}
