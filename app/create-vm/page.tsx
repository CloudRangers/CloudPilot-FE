"use client";

import { apiClient } from "@/lib/api/base-client";

import { useEffect, useState } from "react";
import { Suspense } from "react";
import { useRouter } from "next/navigation";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Server, AlertCircle } from "lucide-react";

/** ===== 타입 정의 ===== */

interface VMSpec {
  name: string;
  type: "private";
  cpu?: string;
  memory?: string;
  storage?: string;
  os: string;
}

interface FormErrors {
  memory?: string;
  storage?: string;
  cpu?: string;
  general?: string;
}

interface ProvisionResponse {
  totalCount: number;
  jobIds: number[];
  status: string;
  message: string;
  createdAt: string;
  jobId: number | string;
  batchProvision: boolean;
  singleProvision: boolean;
  firstJobId: number;
}

interface OSImage {
  name: string;
  osFamily: string;
  zoneId: number;

  id?: number;
  code?: string;
  osVersion?: string;

  templateName?: string;
  imageId?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
  hasNext: boolean;
}

// ⭐ VM 이름 중복 체크 응답 타입
interface VmNameCheckResult {
  duplicate: boolean;
}

const TEMPLATE_NAME_MAP: Record<string, string> = {
  "ROCKY-LINUX": "/ce5-3/vm/Discovered virtual machine/rockylinux-template",
};

/**
 * 실제 로직이 들어 있는 컴포넌트
 */
function CreateVMPageInner() {
  const router = useRouter();
  const [errors, setErrors] = useState<FormErrors>({});
  const [vmName, setVmName] = useState("");

  // ⭐ VM 이름 중복 관련 state
  const [vmNameError, setVmNameError] = useState<string | null>(null);
  const [isCheckingVmName, setIsCheckingVmName] = useState(false);

  const [storage, setStorage] = useState("");
  const [cpu, setCpu] = useState("");
  const [memory, setMemory] = useState("");
  const [os, setOs] = useState<string>("");
  const [vmCount, setVmCount] = useState("1");

  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [authTeamId, setAuthTeamId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [osImages, setOsImages] = useState<OSImage[]>([]);
  const [isLoadingOS, setIsLoadingOS] = useState(false);
  const [osLoadError, setOsLoadError] = useState<string | null>(null);

  const teams = [
    { id: "1", name: "DEVELOPMENT" },
    { id: "2", name: "OPS" },
    { id: "3", name: "QA" },
  ];

  // 로그인 정보에서 팀/역할 가져오기
  useEffect(() => {
    try {
      const storedTeamId = localStorage.getItem("teamId");
      const storedRole = localStorage.getItem("userRole");
      if (storedTeamId) setAuthTeamId(storedTeamId);
      if (storedRole) setUserRole(storedRole);
    } catch {
      // ignore
    }
  }, []);

  /** OS 목록 로딩 */
  useEffect(() => {
    const fetchOsImages = async () => {
      setIsLoadingOS(true);
      setOsLoadError(null);
      try {
        const response = await apiClient.get<
          ApiResponse<PageResponse<OSImage>>
        >("/catalog/os-images", {
          params: { page: 0, size: 50, zoneId: 1, sort: "name,asc" },
        });

        const list = response.data?.data?.items ?? [];
        console.log("[CreateVM] OS 목록 응답:", list);
        setOsImages(list);
      } catch (err: any) {
        console.error(
          "[CreateVM] OS 이미지 목록 조회 실패:",
          err?.message,
          err
        );
        setOsLoadError(
          "OS 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
        );
      } finally {
        setIsLoadingOS(false);
      }
    };

    fetchOsImages();
  }, []);

  /** 최종 teamId 결정 */
  const resolveTeamId = (): number | undefined => {
    if (userRole === "LEADER" || userRole === "MEMBER") {
      return authTeamId ? Number(authTeamId) : undefined;
    }

    if (userRole === "ADMIN" || userRole === "HEAD") {
      if (!selectedTeamId) return undefined;
      return Number(selectedTeamId);
    }

    if (selectedTeamId) return Number(selectedTeamId);
    if (authTeamId) return Number(authTeamId);
    return undefined;
  };

  /** ⭐ VM 이름 실시간 중복 체크 (디바운스) */
  useEffect(() => {
    // 비어 있으면 에러 초기화
    if (!vmName.trim()) {
      setVmNameError(null);
      return;
    }

    let cancelled = false;

    const timeoutId = setTimeout(async () => {
      try {
        setIsCheckingVmName(true);

        const finalTeamId = resolveTeamId();

        const res = await apiClient.get<ApiResponse<VmNameCheckResult>>(
          "/vms/name-check",
          {
            params: {
              name: vmName,
              teamId: finalTeamId,
            },
          }
        );

        if (cancelled) return;

        const duplicate = res.data?.data?.duplicate;

        if (duplicate) {
          setVmNameError("중복된 VM 이름입니다.");
        } else {
          setVmNameError(null);
        }
      } catch (err) {
        console.error("[CreateVM] VM 이름 중복 체크 실패:", err);
        // 에러 시에는 조용히 넘어가도 됨 (서버 오류 때문에 이름 사용을 막고 싶지 않으면)
      } finally {
        if (!cancelled) {
          setIsCheckingVmName(false);
        }
      }
    }, 400); // 0.4초 디바운스

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [vmName, userRole, selectedTeamId, authTeamId]);

  /** 제출 처리 */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};

    if (!vmName.trim() || !cpu || !memory || !storage || !os) {
      newErrors.general = "선택하지 않은 옵션이 있습니다.";
    }

    // ⭐ 이름 중복 에러가 있는 경우도 막기
    if (vmNameError) {
      newErrors.general =
        "VM 이름이 이미 사용 중입니다. 다른 이름으로 입력해주세요.";
    }

    const memoryValue = Number.parseInt(memory, 10);
    const cpuValue = Number.parseInt(cpu, 10);
    const storageValue = Number.parseInt(storage, 10);
    const vmCountValue = Number.parseInt(vmCount, 10) || 1;

    if (memoryValue > 32) {
      newErrors.memory =
        "서버 메모리가 부족합니다. 최대 32GB까지 선택 가능합니다.";
    }

    if (cpuValue > 8 && memoryValue < 16) {
      newErrors.cpu = "CPU와 메모리 비율이 적절하지 않습니다.";
    }

    if (storageValue > 500) {
      newErrors.storage =
        "스토리지 용량이 제한을 초과했습니다. 최대 500GB까지 가능합니다.";
    }

    const finalTeamId = resolveTeamId();
    if (
      (userRole === "ADMIN" || userRole === "HEAD") &&
      (finalTeamId == null || Number.isNaN(finalTeamId))
    ) {
      newErrors.general = "VM을 소유할 팀을 선택해주세요.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // OS 템플릿 매핑
    const selectedOsImage = osImages.find((img) => img.name === os);
    const osKey = selectedOsImage?.name ?? os;

    const templateNameFromBE =
      TEMPLATE_NAME_MAP[osKey] ??
      selectedOsImage?.templateName ??
      selectedOsImage?.imageId ??
      selectedOsImage?.name;

    const additionalConfig =
      templateNameFromBE && templateNameFromBE.length > 0
        ? {
            templateName: templateNameFromBE,
            cloneType: "full" as const,
            diskProvisioning: "thin" as const,
            ipAllocationMode: "DHCP" as const,
          }
        : undefined;

    const payload: any = {
      zoneId: 1,
      cpuCores: cpuValue,
      memoryGb: memoryValue,
      diskGb: storageValue,
      vmName,
      vmCount: vmCountValue,
      teamId: finalTeamId,
      providerType: "VSPHERE",
      catalogId: 1,
      purpose: "VM Provisioning from UI",
      tags: { Environment: "Production", Team: "Backend" },
      additionalConfig,
    };

    console.log("[CreateVM] /provision payload:", payload);

    try {
      const response = await apiClient.post<ProvisionResponse>(
        "/provision",
        payload
      );

      const provision = response.data;

      console.log(
        "[CreateVM] /provision 응답:",
        JSON.stringify(provision, null, 2)
      );

      const primaryJobId =
        provision.firstJobId ??
        (provision.jobIds && provision.jobIds.length > 0
          ? provision.jobIds[0]
          : undefined) ??
        (typeof provision.jobId === "string"
          ? Number.parseInt(provision.jobId, 10)
          : provision.jobId);

      /** 🔥 팀 이름 / ID 정리해서 VM 정보에 같이 저장 */
      const teamKey = selectedTeamId || authTeamId || "";
      const teamName = teams.find((t) => t.id === teamKey)?.name ?? teamKey;

      const newVM = {
        id: `vm-${Date.now()}`,
        name: vmName,
        type: "private" as const,
        cpu,
        memory,
        storage,
        os,
        count: vmCountValue,
        assignedTeam: teamName, // 보기 좋은 팀 이름
        assignedTeamId: teamKey, // 실제 ID
        provisionStatus: provision.status,
        provisionMessage: provision.message,
        jobId: primaryJobId,
      };

      try {
        localStorage.setItem("newlyCreatedVM", JSON.stringify(newVM));
        localStorage.setItem(
          "lastProvisionResult",
          JSON.stringify(provision)
        );
        // 기존 할당 정보는 새 생성 때 초기화
        localStorage.removeItem("vmAssignments");
      } catch (e) {
        console.warn("[CreateVM] localStorage 저장 실패:", e);
      }

      /**
       * 🔥 creating-vm으로 이동 (jobId/jobIds 방식)
       */
      const isBatch =
        provision.batchProvision &&
        Array.isArray(provision.jobIds) &&
        provision.jobIds.length > 0;

      if (isBatch) {
        const jobIdsParam = provision.jobIds.join(",");
        router.push(`/creating-vm?jobIds=${jobIdsParam}`);
      } else if (primaryJobId) {
        router.push(`/creating-vm?jobId=${primaryJobId}`);
      } else {
        router.push("/creating-vm");
      }
    } catch (error: any) {
      console.error("[CreateVM] /provision 호출 중 오류:", error);
      const messageFromServer =
        error?.response?.data?.message ??
        (error?.response?.status === 403
          ? "권한이 없습니다. 다시 로그인 후 시도해주세요."
          : "서버와 통신 중 오류가 발생했습니다.");

      setErrors({ general: messageFromServer });
    }
  };

  /** 예전 스펙 */
  const previousSpecs: VMSpec[] = [
    {
      name: "web-server-01",
      type: "private",
      cpu: "2",
      memory: "4",
      storage: "50",
      os: "ubuntu-22.04",
    },
    {
      name: "db-server-01",
      type: "private",
      cpu: "4",
      memory: "8",
      storage: "100",
      os: "ubuntu-22.04",
    },
    {
      name: "api-server-02",
      type: "private",
      cpu: "2",
      memory: "4",
      storage: "30",
      os: "rocky",
    },
  ];

  const applySpec = (spec: VMSpec) => {
    setVmName(spec.name + "-copy");
    setVmNameError(null); // ⭐ 기존 에러 초기화
    setErrors({});
    setCpu(spec.cpu || "");
    setMemory(spec.memory || "");
    setStorage(spec.storage || "");
    setOs(spec.os);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-background">
        <div className="container px-4 py-8 md:px-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">가상머신 생성</h1>
            <p className="mt-2 text-muted-foreground">
              새로운 프라이빗 가상머신을 구성해보세요
            </p>
          </div>

          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">팀 선택</h2>
            <Select
              value={selectedTeamId}
              onValueChange={setSelectedTeamId}
              disabled={userRole === "LEADER" || userRole === "MEMBER"}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    userRole === "LEADER" || userRole === "MEMBER"
                      ? "내 팀으로 생성됩니다"
                      : "팀을 선택하세요"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name} (ID: {team.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(userRole === "LEADER" || userRole === "MEMBER") && (
              <p className="mt-2 text-xs text-muted-foreground">
                팀장/팀원은 로그인된 팀으로만 VM을 생성할 수 있습니다.
              </p>
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="p-6">
                <form className="space-y-6" onSubmit={handleSubmit}>
                  {errors.general && (
                    <div className="flex items-start gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                      <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-medium text-destructive">
                        {errors.general}
                      </span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="vm-name">VM 이름</Label>
                    <Input
                      id="vm-name"
                      placeholder="예: production-server-01"
                      value={vmName}
                      onChange={(e) => setVmName(e.target.value)}
                      className={
                        vmNameError
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
                    />
                    {vmNameError && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" /> {vmNameError}
                      </p>
                    )}
                    {isCheckingVmName && !vmNameError && vmName.trim() && (
                      <p className="text-xs text-muted-foreground">
                        이름 중복 여부 확인 중...
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vm-count">VM 개수</Label>
                    <Input
                      id="vm-count"
                      type="number"
                      min={1}
                      max={10}
                      placeholder="예: 3"
                      value={vmCount}
                      onChange={(e) => setVmCount(e.target.value)}
                    />
                  </div>

                  <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                    <h3 className="font-semibold text-sm">프라이빗 VM 옵션</h3>

                    <div className="space-y-2">
                      <Label htmlFor="private-cpu">CPU (vCPU)</Label>
                      <Select value={cpu} onValueChange={setCpu}>
                        <SelectTrigger id="private-cpu">
                          <SelectValue placeholder="CPU 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 4, 8, 16].map((v) => (
                            <SelectItem key={v} value={String(v)}>
                              {v} vCPU
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.cpu && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" /> {errors.cpu}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="private-memory">메모리 (GB)</Label>
                      <Select value={memory} onValueChange={setMemory}>
                        <SelectTrigger id="private-memory">
                          <SelectValue placeholder="메모리 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 4, 8, 16, 32, 64].map((v) => (
                            <SelectItem key={v} value={String(v)}>
                              {v} GB
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.memory && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" /> {errors.memory}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="private-storage">저장공간 (GB)</Label>
                      <Input
                        id="private-storage"
                        type="number"
                        placeholder="예: 100"
                        value={storage}
                        onChange={(e) => setStorage(e.target.value)}
                      />
                      {errors.storage && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" /> {errors.storage}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="private-os">운영체제</Label>
                      <Select
                        value={os}
                        onValueChange={(value) => setOs(value)}
                        disabled={isLoadingOS || !!osLoadError}
                      >
                        <SelectTrigger id="private-os">
                          <SelectValue
                            placeholder={
                              isLoadingOS
                                ? "OS 목록 불러오는 중..."
                                : osLoadError
                                ? "OS 목록 로딩 실패"
                                : "OS 선택"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {osImages.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              사용 가능한 OS가 없습니다.
                            </div>
                          ) : (
                            osImages.map((image, idx) => (
                              <SelectItem key={idx} value={image.name}>
                                {image.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {osLoadError && (
                        <p className="text-xs text-destructive mt-1">
                          {osLoadError}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button type="submit" size="lg" className="w-full">
                    생성 요청
                  </Button>
                </form>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-20">
                <h3 className="font-semibold mb-4">이전 생성 스펙</h3>
                {previousSpecs.map((spec, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border p-4 mb-3 hover:bg-muted/50 cursor-pointer"
                    onClick={() => applySpec(spec)}
                  >
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{spec.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {spec.cpu} vCPU / {spec.memory}GB / {spec.storage}GB /{" "}
                      {spec.os}
                    </p>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/**
 * Suspense Boundary 래퍼 컴포넌트
 */
export default function CreateVMPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 bg-background">
            <div className="container px-4 py-8 md:px-6">
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">
                  페이지를 불러오는 중입니다...
                </p>
              </Card>
            </div>
          </main>
          <Footer />
        </div>
      }
    >
      <CreateVMPageInner />
    </Suspense>
  );
}
