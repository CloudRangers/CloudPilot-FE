"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Check } from "lucide-react";
import { fetchWithAuth } from "@/lib/api/fetchWithAuth";
// useSse는 InstallingPackagePage에서 처리하므로 여기서 주석 처리합니다.
// import { useSse } from "@/lib/context/SseContext"; 

interface PackageType {
  id: number;
  name: string;
  description: string;
  version: string;
  arch: string;
}
interface VMType {
  id: string;
  name: string;
  vcpu: number;
  memoryGb: number;
  rootDiskGb: number;
  osType: string;
}

export default function InstallPackagePage() {
  const router = useRouter();
  // const { startSseConnection } = useSse();

  const [packages, setPackages] = useState<PackageType[]>([]);
  const [availablePackages, setAvailablePackages] = useState<PackageType[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);

  const [availableVMs, setAvailableVMs] = useState<VMType[]>([]);
  const [selectedVMs, setSelectedVMs] = useState<string[]>([]);
  const [isVMModalOpen, setIsVMModalOpen] = useState(false);

    useEffect(() => {
    const fetchPackages = async () => {
      try {
        const json = await fetchWithAuth("/api/backend/packages"); 
        if (json?.data) {
          setAvailablePackages(json.data);
        }
      } catch (err) {
        console.error("PACKAGE ERROR:", err);
      }
    };

    const fetchVMs = async () => {
      try {
        const json = await fetchWithAuth("/api/backend/vms?size=1000"); 
        if (!json?.data?.items) return;

        const mapped = json.data.items.map((vm: any) => {
          const tags =
            typeof vm.tags === "string"
              ? JSON.parse(vm.tags || "{}")
              : vm.tags || {};

          return {
            id: String(vm.id),
            name: vm.name,
            vcpu: vm.vcpu,
            memoryGb: vm.memoryMb ? vm.memoryMb / 1024 : 0,
            rootDiskGb: vm.rootDiskGb ?? 0,
            osType: vm.osType ?? tags.osType ?? "unknown",
          };
        });

        mapped.sort((a: VMType, b: VMType) => a.name.localeCompare(b.name));

        setAvailableVMs(mapped);
      } catch (err) {
        console.error("VM ERROR:", err);
      }
    };

    fetchPackages();
    fetchVMs();
  }, []);

  const togglePackageSelection = (id: string) => {
    setSelectedPackages((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const toggleVMSelection = (id: string) => {
    setSelectedVMs((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const handleAddSelectedPackages = () => {
    const add = availablePackages.filter((p) =>
      selectedPackages.includes(String(p.id))
    );
    const unique = add.filter((p) => !packages.some((x) => x.id === p.id));
    setPackages([...packages, ...unique]);
    setSelectedPackages([]);
    setIsPackageModalOpen(false);
  };

  const handleInstallPackages = async () => {
    if (packages.length === 0 || selectedVMs.length === 0) return;

    const payload = {
      // 선택된 VM ID 목록을 서버에 전달합니다.
      vmIds: selectedVMs.map(Number),
      packages: packages.map((pkg) => ({
        name: pkg.name,
        version: pkg.version,
      })),
    };

    try {
      const result = await fetchWithAuth("/api/backend/packages/install", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!result?.success || !result.data?.jobIds || result.data.jobIds.length === 0) {
        console.error("INSTALL FAIL RESPONSE:", result);
        throw new Error("Failed to get valid job IDs.");
      }
      
      const jobIds = result.data.jobIds as (string | number)[];
      
      // 서버로부터 받은 Job ID 배열을 쿼리 파라미터로 변환하여 전달합니다.
      const jobIdsString = jobIds.join(',');

      // SSE 연결 대신, jobIds를 파라미터로 넘겨 페이지 이동합니다.
      router.push(`/installing-package?jobIds=${jobIdsString}`);

    } catch (err) {
      console.error(err);
      alert("An error occurred during the installation request.");
    }
  };


  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-10">
          <div className="mx-auto max-w-5xl space-y-10">

            {/* VM 선택 영역 (UI 구조 유지) */}
            <Card className="relative border-2 shadow-lg p-6 min-h-[220px]">
              <Button
                size="sm"
                className="absolute top-4 right-4 bg-primary text-white shadow-md hover:bg-primary/90"
                onClick={() => setIsVMModalOpen(true)}
              >
                VM 선택하기
              </Button>

              <h2 className="text-xl font-semibold mb-4">선택된 VM ({selectedVMs.length}대)</h2>

              {selectedVMs.length === 0 ? (
                <div className="flex items-center justify-center h-[240px]">
                  <p className="text-muted-foreground text-center">
                    선택된 VM이 없습니다
                  </p>
                </div>
              ) : (
                <div className="space-y-3 h-[240px] overflow-y-auto pr-2">
                  {selectedVMs.map((id) => {
                    const vm = availableVMs.find((v) => v.id === id);
                    if (!vm) return null;

                    return (
                      <div
                        key={vm.id}
                        className="flex items-start justify-between rounded-xl border p-4 bg-card hover:border-primary/40 transition-all"
                      >
                        <div>
                          <p className="font-semibold">{vm.name}</p>
                          <p className="text-sm text-muted-foreground">OS: {vm.osType}</p>
                          <p className="text-sm text-muted-foreground">
                            vCPU: {vm.vcpu} | Memory: {vm.memoryGb}GB | Disk: {vm.rootDiskGb}GB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedVMs(selectedVMs.filter((vmId) => vmId !== vm.id))}
                        >
                          <Trash2 className="h-5 w-5 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* 패키지 선택 영역 (UI 구조 유지) */}
            <Card className="relative border-2 shadow-lg p-6 min-h-[220px]">
              <Button
                size="sm"
                className="absolute top-4 right-4 bg-primary text-white shadow-md hover:bg-primary/90"
                onClick={() => setIsPackageModalOpen(true)}
              >
                패키지 추가
              </Button>

              <h2 className="text-xl font-semibold mb-4">선택된 패키지</h2>

              {packages.length === 0 ? (
                <div className="flex items-center justify-center h-[240px]">
                  <p className="text-muted-foreground text-center">
                    선택된 패키지가 없습니다
                  </p>
                </div>
              ) : (
                <div className="space-y-3 h-[240px] overflow-y-auto pr-2">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="flex items-start justify-between p-4 rounded-xl border hover:border-primary/40 transition-all bg-card"
                    >
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{pkg.name}</h3>
                        <p className="text-sm text-muted-foreground">{pkg.description}</p>

                        {pkg.name !== "vscode" && (
                          <p className="text-sm text-muted-foreground">
                            Version: {pkg.version}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setPackages(packages.filter((x) => x.id !== pkg.id))
                        }
                      >
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* 설치 버튼 */}
            <div className="flex justify-center">
              <Button
                size="lg"
                disabled={packages.length === 0 || selectedVMs.length === 0}
                className="min-w-[260px] h-12 font-semibold shadow-lg"
                onClick={handleInstallPackages}
              >
                패키지 설치 요청 ({selectedVMs.length}대)
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* VM 선택 모달 (UI 구조 유지) */}
      {isVMModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setIsVMModalOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl max-h-[85vh] bg-card rounded-2xl border shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b bg-muted/30 px-6 py-4 flex-shrink-0">
              <h2 className="text-xl font-semibold">VM 선택</h2>
            </div>

            <div className="overflow-y-auto p-6 space-y-3 flex-1">
              {availableVMs.map((vm) => {
                const selected = selectedVMs.includes(vm.id);

                return (
                  <button
                    key={vm.id}
                    onClick={() => toggleVMSelection(vm.id)}
                    className={`w-full text-left rounded-xl border-2 p-5 transition-all ${
                      selected
                        ? "border-primary shadow-md scale-[1.02]"
                        : "border-transparent hover:border-muted hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">{vm.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          vCPU: {vm.vcpu} | Memory: {vm.memoryGb}GB | Disk: {vm.rootDiskGb}GB
                        </p>
                        <p className="text-sm text-muted-foreground">OS: {vm.osType}</p>
                      </div>

                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          selected
                            ? "bg-primary text-primary-foreground"
                            : "border-2 border-muted-foreground/30"
                        }`}
                      >
                        {selected && <Check className="h-5 w-5" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="border-t p-6 bg-muted/30 flex justify-center gap-3 flex-shrink-0">
              <Button variant="outline" size="lg" onClick={() => setIsVMModalOpen(false)}>
                닫기
              </Button>
              <Button size="lg" onClick={() => setIsVMModalOpen(false)}>
                선택 완료 ({selectedVMs.length})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 패키지 선택 모달 (UI 구조 유지) */}
      {isPackageModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setIsPackageModalOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl max-h-[85vh] bg-card rounded-2xl overflow-hidden border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b px-6 py-4 bg-muted/30">
              <h2 className="text-xl font-semibold">패키지 선택</h2>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-6 space-y-3">
              {availablePackages.map((pkg) => {
                const selected = selectedPackages.includes(String(pkg.id));
                const added = packages.some((x) => x.id === pkg.id);

                return (
                  <button
                    key={pkg.id}
                    onClick={() => !added && togglePackageSelection(String(pkg.id))}
                    disabled={added}
                    className={`w-full rounded-xl border-2 p-5 text-left transition-all ${
                      added
                        ? "cursor-not-allowed opacity-50"
                        : selected
                        ? "border-primary shadow-md scale-[1.02]"
                        : "border-transparent hover:border-muted hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <h3 className="font-semibold text-lg">{pkg.name}</h3>
                        <p className="text-sm text-muted-foreground">{pkg.description}</p>

                        {pkg.name !== "vscode" && (
                          <p className="text-xs text-muted-foreground">
                            Version: {pkg.version}
                          </p>
                        )}

                        {added && (
                          <p className="text-xs text-primary">이미 추가된 패키지</p>
                        )}
                      </div>

                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          selected
                            ? "bg-primary text-primary-foreground"
                            : "border-2 border-muted-foreground/30"
                        }`}
                      >
                        {selected && <Check className="h-5 w-5" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="border-t bg-muted/30 p-6 flex justify-center gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setIsPackageModalOpen(false)}
              >
                취소
              </Button>

              <Button
                size="lg"
                onClick={handleAddSelectedPackages}
                disabled={selectedPackages.length === 0}
              >
                추가 ({selectedPackages.length})
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}