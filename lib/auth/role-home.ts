// src/lib/auth/role-home.ts

export const getHomePathByRole = (roleCode: string) => {
  const role = roleCode.trim().toUpperCase();

  // 🔥 지금 실제로 존재하는 페이지 기준으로만 매핑
  switch (role) {
    case "ADMIN":
      return "/admin";
    // HEAD, LEADER, MEMBER 는 일단 공용 대시보드로
    case "HEAD":
    case "LEADER":
    case "MEMBER":
      return "/";
    default:
      return "/";
  }
};
