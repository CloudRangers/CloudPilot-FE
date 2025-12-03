"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InfraFlowAnimation } from "@/components/infra-flow-animation";
import { useUser } from "@/app/providers/AuthProvider";
import { useToast } from "@/hooks/use-toast"; // ⭐ useToast 임포트

interface LoginApiResponse<T> {
  success: boolean;
  data: T;
  message?: string | null;
}

interface LoginResponseDto {
  username: string;
  roleCode: string;
  roleName: string;
  teamId: number | null;
  teamName: string;
}

export default function LoginPage() {
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmployeeId, setResetEmployeeId] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const { setUser } = useUser();
  const router = useRouter();
  const { toast } = useToast(); // ⭐ useToast 훅 사용

  // -----------------------------------
  // 🔥 로그인 실행
  // -----------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/backend/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          empno: parseInt(employeeId, 10),
          password: password,
        }),
      });

      const result: LoginApiResponse<LoginResponseDto> = await res.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "로그인 실패",
          description: result.message || "서버 오류가 발생했습니다.",
        });
        setLoading(false);
        return;
      }

      // ✅ roleCode 정규화 (예: "ROLE_ADMIN" → "ADMIN")
      const normalizedRole = result.data.roleCode
        .replace(/^ROLE_/, "")
        .trim()
        .toUpperCase();

      toast({
        title: "로그인 성공",
        description: `${result.data.username}님, 환영합니다.`,
      });

      // ✅ AuthProvider 컨텍스트 업데이트
      setUser({
        ...result.data,
        roleCode: normalizedRole,
      });

      // ✅ localStorage에 로그인 정보 저장 (AdminPage, /mypage 라우팅에서 사용)
      if (typeof window !== "undefined") {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userRole", normalizedRole);

        if (result.data.teamId != null) {
          localStorage.setItem("teamId", String(result.data.teamId));
        } else {
          localStorage.removeItem("teamId");
        }

        // 선택: 전체 유저 정보 저장 (이미 사용하는 곳 있으면 유지)
        localStorage.setItem(
          "cloudpilot:user",
          JSON.stringify({
            ...result.data,
            roleCode: normalizedRole,
          }),
        );
      }

      // ✅ 역할별 리다이렉트
      if (normalizedRole === "ADMIN") {
        router.push("/admin");
      } else {
        // 나머지는 홈으로 보내고, 헤더의 "마이페이지" → /mypage에서 역할별 분기
        router.push("/");
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "오류 발생",
        description: "로그인 중 예기치 않은 오류가 발생했습니다.",
      });
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------
  // 🔧 비밀번호 재설정 시뮬레이션
  // -----------------------------------
  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "재설정 요청 완료",
      description: `사번 ${resetEmployeeId}에 대한 비밀번호 재설정 요청이 처리되었습니다.`,
    });
    setIsPasswordReset(false);
  };

  // ------------------------------------------------------------
  // UI 영역 그대로
  // ------------------------------------------------------------
  return (
    <div className="min-h-screen flex relative">
      <button
        onClick={() => router.push("/")}
        className="absolute top-4 left-4 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="hidden sm:inline text-sm font-medium">홈으로</span>
      </button>

      <div
        className={`w-full lg:w-1/2 flex items-center justify-center p-8 bg-background transition-all duration-700 ${
          isPasswordReset ? "lg:order-2" : "lg:order-1"
        }`}
      >
        <div className="w-full max-w-md">
          {!isPasswordReset ? (
            <>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Whisk_ea16510fc56430cb7834e78b3ccf3091dr%20%281%29_imgupscaler.ai_%EC%9D%BC%EB%B0%98%20%ED%99%95%EB%8C%80__16K-Photoroom-cyxtUobdT0S1PjVlwoZ7nC9lycmi3f.png"
                    alt="Cloud Pilot Logo"
                    className="h-12 w-12 object-contain"
                  />
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Whisk_ea16510fc56430cb7834e78b3ccf3091dr%20%281%29__imgupscaler.ai_%EC%9D%BC%EB%B0%98%20%ED%99%95%EB%8C%80_16K-Photoroom-PzhGNd5YQzkPoNMIUE8bMfW4OhplG6.png"
                    alt="Cloud Pilot Text"
                    className="h-8 object-contain"
                  />
                </div>
                <p className="text-muted-foreground font-medium">
                  Fly Your Infra With Us
                </p>
              </div>

              <div className="mt-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  로그인
                </h1>
                <p className="text-muted-foreground">
                  계정에 로그인하여 시작하세요
                </p>
              </div>

              <form className="space-y-6 mt-6" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <Label htmlFor="employeeId" className="text-foreground">
                    사번
                  </Label>
                  <Input
                    id="employeeId"
                    type="text"
                    placeholder="사번을 입력하세요 (예: 1001)"
                    className="w-full h-12"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">
                    비밀번호
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    className="w-full h-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsPasswordReset(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    비밀번호 찾기
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? "로그인 중..." : "로그인"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsPasswordReset(false)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>로그인으로 돌아가기</span>
              </button>

              <div className="mt-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  비밀번호 찾기
                </h1>
                <p className="text-muted-foreground">
                  사번과 이메일을 입력하시면 재설정 요청을 시뮬레이션합니다.
                </p>
              </div>

              <form className="space-y-6 mt-6" onSubmit={handlePasswordReset}>
                <div className="space-y-2">
                  <Label
                    htmlFor="resetEmployeeId"
                    className="text-foreground"
                  >
                    사번
                  </Label>
                  <Input
                    id="resetEmployeeId"
                    type="text"
                    placeholder="사번을 입력하세요"
                    className="w-full h-12"
                    value={resetEmployeeId}
                    onChange={(e) => setResetEmployeeId(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    이메일
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="이메일을 입력하세요"
                    className="w-full h-12"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full h-12" size="lg">
                  재설정 요청 시뮬레이션
                </Button>
              </form>
            </>
          )}
        </div>
      </div>

      <div
        className={`hidden lg:flex w-1/2 bg-primary items-center justify-center p-12 transition-all duration-700 ${
          isPasswordReset ? "lg:order-1" : "lg:order-2"
        }`}
      >
        <div className="max-w-lg text-center space-y-8">
          <div className="flex items-center justify-center gap-4 mb-8">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Whisk_ea16510fc56430cb7834e78b3ccf3091dr%20%281%29_imgupscaler.ai_%EC%9D%BC%EB%B0%98%20%ED%99%95%EB%8C%80__16K-Photoroom-cyxtUobdT0S1PjVlwoZ7nC9lycmi3f.png"
              alt="Cloud Pilot Logo"
              className="h-20 w-20 object-contain drop-shadow-lg"
            />
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Whisk_ea16510fc56430cb7834e78b3ccf3091dr%20%281%29__imgupscaler.ai_%EC%9D%BC%EB%B0%98%20%ED%99%95%EB%8C%80_16K-Photoroom-PzhGNd5YQzkPoNMIUE8bMfW4OhplG6.png"
              alt="Cloud Pilot Text"
              className="h-12 object-contain drop-shadow-lg brightness-0 invert"
            />
          </div>

          <h2 className="text-4xl font-bold text-primary-foreground leading-tight">
            인프라 자동화의 새로운 기준
          </h2>

          <div className="space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary-foreground mt-2" />
              <p className="text-lg text-primary-foreground/90">
                클릭 몇 번으로 서버 생성 및 관리
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary-foreground mt-2" />
              <p className="text-lg text-primary-foreground/90">
                자동화된 패키지 설치 및 배포
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary-foreground mt-2" />
              <p className="text-lg text-primary-foreground/90">
                실시간 인프라 모니터링
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary-foreground mt-2" />
              <p className="text-lg text-primary-foreground/90">
                팀 협업을 위한 통합 대시보드
              </p>
            </div>
          </div>

          <div className="pt-8 pointer-events-none">
            <InfraFlowAnimation />
          </div>
        </div>
      </div>
    </div>
  );
}
