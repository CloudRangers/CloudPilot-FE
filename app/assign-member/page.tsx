"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AssignMemberPage() {
  const router = useRouter()
  const [vmInfo, setVmInfo] = useState<any>(null)
  const [assignments, setAssignments] = useState<Record<number, string>>({}) // ✅ 각 VM별 선택된 팀원 1명

  // 예시용 직원 데이터
  const employees = [
    { id: "emp-001", name: "홍길동", team: "DEVELOPMENT" },
    { id: "emp-002", name: "이영희", team: "DEVELOPMENT" },
    { id: "emp-003", name: "박철수", team: "OPS" },
    { id: "emp-004", name: "최민수", team: "OPS" },
    { id: "emp-005", name: "강지훈", team: "QA" },
  ]

  useEffect(() => {
    const storedVM = localStorage.getItem("newlyCreatedVM")
    if (storedVM) {
      const parsed = JSON.parse(storedVM)
      console.log("✅ 전달된 VM 정보:", parsed)
      setVmInfo(parsed)

      // ✅ VM 개수만큼 초기 상태 세팅
      const initialAssignments: Record<number, string> = {}
      for (let i = 0; i < parsed.count; i++) {
        initialAssignments[i] = ""
      }
      setAssignments(initialAssignments)
    } else {
      router.replace("/create-vm")
    }
  }, [router])

  // ✅ VM 인덱스별 선택 처리
  const handleSelectChange = (vmIndex: number, empId: string) => {
    setAssignments((prev) => ({
      ...prev,
      [vmIndex]: empId,
    }))
  }

  const handleAssign = () => {
    if (!vmInfo) return

    const updated = {
      ...vmInfo,
      assignedEmployeesByVM: assignments, // ✅ 각 VM별 선택된 팀원 1명
    }

    localStorage.setItem("newlyCreatedVM", JSON.stringify(updated))

    console.log("✅ 최종 할당 결과:", updated)
    alert("모든 VM에 대한 팀원 할당이 완료되었습니다.")
    router.push("/install-package")
  }

  if (!vmInfo) return null

  // ✅ 해당 팀의 팀원만 필터링
  const filtered = employees.filter((e) => e.team === vmInfo.assignedTeam)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">VM 팀원 할당</h1>

          {/* ✅ VM 기본 정보 */}
          <Card className="p-4 mb-6">
            <p className="text-sm">
              VM 이름: <strong>{vmInfo.name}</strong>
            </p>
            <p className="text-sm">
              팀: <strong>{vmInfo.assignedTeam}</strong>
            </p>
            <p className="text-sm">
              개수: <strong>{vmInfo.count}</strong>
            </p>
            <p className="text-sm">
              스펙: {vmInfo.cpu} vCPU / {vmInfo.memory}GB / {vmInfo.storage}GB / {vmInfo.os}
            </p>
          </Card>

          {/* ✅ VM 개수만큼 렌더링 */}
          <div className="space-y-6">
            {Array.from({ length: vmInfo.count }).map((_, index) => (
              <Card key={index} className="p-6 space-y-3">
                <h2 className="font-semibold mb-2">VM #{index + 1} 할당</h2>
                {filtered.length > 0 ? (
                  <>
                    <Label>팀원 선택</Label>
                    <Select
                      value={assignments[index] || ""}
                      onValueChange={(value) => handleSelectChange(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="팀원을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {filtered.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">팀원 정보가 없습니다.</p>
                )}
              </Card>
            ))}
          </div>

          <div className="flex justify-end mt-8">
            <Button
              onClick={handleAssign}
              disabled={Object.values(assignments).some((v) => !v)} // 하나라도 선택 안 되어 있으면 비활성화
            >
              전체 할당 완료
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
