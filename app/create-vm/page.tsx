"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Server, AlertCircle } from "lucide-react"

interface VMSpec {
  name: string
  type: "private"
  cpu?: string
  memory?: string
  storage?: string
  os: string
}

interface FormErrors {
  memory?: string
  storage?: string
  cpu?: string
  general?: string
}

export default function CreateVMPage() {
  const router = useRouter()
  const [errors, setErrors] = useState<FormErrors>({})
  const [vmName, setVmName] = useState("")
  const [storage, setStorage] = useState("")
  const [cpu, setCpu] = useState("")
  const [memory, setMemory] = useState("")
  const [os, setOs] = useState("")
  const [vmCount, setVmCount] = useState("1")
  const [teamId, setTeamId] = useState("")

  const teams = [
    { id: "DEVELOPMENT", name: "DEVELOPMENT" },
    { id: "OPS", name: "OPS" },
    { id: "QA", name: "QA" },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: FormErrors = {}

    if (!vmName.trim() || !cpu || !memory || !storage || !os) {
      newErrors.general = "선택하지 않은 옵션이 있습니다."
    }

    const memoryValue = Number.parseInt(memory)
    const cpuValue = Number.parseInt(cpu)
    const storageValue = Number.parseInt(storage)

    if (memoryValue > 32) {
      newErrors.memory = "서버 메모리가 부족합니다. 최대 32GB까지 선택 가능합니다."
    }

    if (cpuValue > 8 && memoryValue < 16) {
      newErrors.cpu = "CPU와 메모리 비율이 적절하지 않습니다."
    }

    if (storageValue > 500) {
      newErrors.storage = "스토리지 용량이 제한을 초과했습니다. 최대 500GB까지 가능합니다."
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    const newVM = {
      id: `vm-${Date.now()}`,
      name: vmName,
      type: "private",
      cpu,
      memory,
      storage,
      os,
      count: Number(vmCount),
      assignedTeam: teamId,
    }

    localStorage.setItem("newlyCreatedVM", JSON.stringify(newVM))
    router.push("/creating-vm?next=assign-member")
  }

  const previousSpecs: VMSpec[] = [
    { name: "web-server-01", type: "private", cpu: "2", memory: "4", storage: "50", os: "ubuntu-22" },
    { name: "db-server-01", type: "private", cpu: "4", memory: "8", storage: "100", os: "ubuntu-22" },
    { name: "api-server-02", type: "private", cpu: "2", memory: "4", storage: "30", os: "centos-8" },
  ]

  const applySpec = (spec: VMSpec) => {
    setVmName(spec.name + "-copy")
    setErrors({})
    setCpu(spec.cpu || "")
    setMemory(spec.memory || "")
    setStorage(spec.storage || "")
    setOs(spec.os)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-background">
        <div className="container px-4 py-8 md:px-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">가상머신 생성</h1>
            <p className="mt-2 text-muted-foreground">새로운 프라이빗 가상머신을 구성해보세요</p>
          </div>

          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">팀 선택</h2>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="팀을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.name}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="p-6">
                <form className="space-y-6" onSubmit={handleSubmit}>
                  {errors.general && (
                    <div className="flex items-start gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                      <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-medium text-destructive">{errors.general}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="vm-name">VM 이름</Label>
                    <Input
                      id="vm-name"
                      placeholder="예: production-server-01"
                      value={vmName}
                      onChange={(e) => setVmName(e.target.value)}
                    />
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
                      <Select value={os} onValueChange={setOs}>
                        <SelectTrigger id="private-os">
                          <SelectValue placeholder="OS 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ubuntu-22">Ubuntu 22.04</SelectItem>
                          <SelectItem value="ubuntu-20">Ubuntu 20.04</SelectItem>
                          <SelectItem value="centos-8">CentOS 8</SelectItem>
                          <SelectItem value="rhel-9">RHEL 9</SelectItem>
                          <SelectItem value="windows-2022">Windows Server 2022</SelectItem>
                        </SelectContent>
                      </Select>
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
                      {spec.cpu} vCPU / {spec.memory}GB / {spec.storage}GB / {spec.os}
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
  )
}
