// src/lib/api/auth.ts (혹은 현재 auth.ts 위치 기준)

// ✅ 기존 코드들 유지
export enum RoleCode {
  ADMIN = "ADMIN",
  HEAD = "HEAD",
  LEADER = "LEADER",
  MEMBER = "MEMBER",
}

export interface UserRoleInfo {
  roleCode: RoleCode;
  roleName: string;
  permissionLevel: number;
  teamId: number | null;
  teamName: string;
}

export interface User {
  userId: number;
  username: string;
  email: string;
  empno: number;
  userRoles: UserRoleInfo[];
  maxPermissionLevel: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface JWTPayload {
  sub: string;
  userId: number;
  username: string;
  email: string;
  empno: number;
  userRoles: UserRoleInfo[];
  maxPermissionLevel: number;
  iat: number;
  exp: number;
}

export const hasPermission = {
  isAdmin: (user: User | null) => {
    if (!user) return false;
    return user.userRoles.some((ur) => ur.roleCode === RoleCode.ADMIN);
  },

  isDirector: (user: User | null) => {
    if (!user) return false;
    return user.userRoles.some((ur) => ur.roleCode === RoleCode.HEAD);
  },

  canViewAllVms: (user: User | null) => {
    return hasPermission.isAdmin(user) || hasPermission.isDirector(user);
  },

  canManageAlertRules: (user: User | null) => {
    return hasPermission.isAdmin(user);
  },

  canViewAlertRules: (user: User | null) => {
    if (!user) return false;
    return user.userRoles.some((ur) =>
      [RoleCode.ADMIN, RoleCode.HEAD, RoleCode.LEADER].includes(ur.roleCode)
    );
  },

  canAccessTeamVm: (user: User | null, vmTeamId: number) => {
    if (!user) return false;
    if (hasPermission.canViewAllVms(user)) return true;
    return user.userRoles.some((ur) => ur.teamId === vmTeamId);
  },

  isTeamLeaderOrAbove: (user: User | null, teamId: number) => {
    if (!user) return false;
    return user.userRoles.some(
      (ur) =>
        ur.teamId === teamId &&
        [RoleCode.ADMIN, RoleCode.HEAD, RoleCode.LEADER].includes(ur.roleCode)
    );
  },

  getUserTeamIds: (user: User | null): number[] => {
    if (!user) return [];
    return [
      ...new Set(
        user.userRoles
          .map((ur) => ur.teamId)
          .filter((id): id is number => id !== null)
      ),
    ];
  },

  getLeaderTeamIds: (user: User | null): number[] => {
    if (!user) return [];
    return user.userRoles
      .filter((ur) => ur.roleCode === RoleCode.LEADER && ur.teamId !== null)
      .map((ur) => ur.teamId as number);
  },
};

// ===============================
// 🔥 여기서부터 새로 추가되는 부분
// ===============================
import { apiClient, ApiResponse } from "./base-client";

// BE LoginResponse 형태 매핑
export interface LoginInfo {
  username: string;
  roleCode: RoleCode | string;
  roleName: string;
  teamId: number | null;
  teamName: string | null;
}

const STORAGE_KEY = "cloudpilot:user";

// 로그인
export async function login(empnoInput: string, password: string) {
  const empnoNum = Number(empnoInput);
  if (Number.isNaN(empnoNum)) {
    throw new Error("사번은 숫자만 입력해주세요.");
  }

  const res = await apiClient.post<ApiResponse<LoginInfo>>(
    "/auth/login",
    {
      empno: empnoNum,
      password,
    },
    { withCredentials: true }
  );

  const user = res.data.data;

  if (typeof window !== "undefined" && user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  return user;
}

// /auth/me 로 현재 로그인 유저 정보 가져오기
export async function fetchMe(): Promise<LoginInfo | null> {
  try {
    const res = await apiClient.get<ApiResponse<LoginInfo>>("/auth/me", {
      withCredentials: true,
    });
    const user = res.data.data;

    if (typeof window !== "undefined" && user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
    return user;
  } catch {
    return null;
  }
}

// localStorage에서 유저 정보 가져오기
export function getStoredUser(): LoginInfo | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as LoginInfo;
  } catch {
    return null;
  }
}

// 로그아웃
export async function logout() {
  await apiClient.post<ApiResponse<void>>("/auth/logout", null, {
    withCredentials: true,
  });

  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}
