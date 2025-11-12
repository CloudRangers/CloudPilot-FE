"use client"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Server,
  CheckCircle2,
  Clock,
  AlertCircle,
  Shield,
  Users,
  CheckCircle,
  ChevronDown,
  Package,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function HeadMyPage() {
  const [expandedServers, setExpandedServers] = useState<Set<number>>(new Set())

  const toggleServerDetails = (serverId: number) => {
    const newExpanded = new Set(expandedServers)
    if (newExpanded.has(serverId)) {
      newExpanded.delete(serverId)
    } else {
      newExpanded.add(serverId)
    }
    setExpandedServers(newExpanded)
  }

  const managerInfo = {
    name: "김부장",
    employeeId: "MGR-2024-001",
    department: "개발본부",
    role: "부장",
  }

  const allTeamsServers = [
    {
      teamName: "A팀",
      teamLeader: "이팀장 (TL-2024-001)",
      members: [
        {
          teamMember: "홍길동 (EMP-2024-001)",
          servers: [
            {
              id: 1,
              name: "web-server-01",
              type: "퍼블릭",
              status: "running",
              cpu: "2 vCPU",
              memory: "4GB",
              storage: "50GB",
              os: "Ubuntu 22.04",
              createdAt: "2024-01-15",
              ipAddress: "192.168.1.10",
              packages: ["nginx", "nodejs", "pm2"],
              lastUpdated: "2024-01-20 14:30",
            },
            {
              id: 2,
              name: "db-server-01",
              type: "프라이빗",
              status: "running",
              cpu: "4 vCPU",
              memory: "8GB",
              storage: "100GB",
              os: "CentOS 8",
              createdAt: "2024-01-10",
              ipAddress: "10.0.1.20",
              packages: ["postgresql", "redis"],
              lastUpdated: "2024-01-19 10:15",
            },
          ],
        },
        {
          teamMember: "이영희 (EMP-2024-002)",
          servers: [
            {
              id: 3,
              name: "api-server-01",
              type: "퍼블릭",
              status: "running",
              cpu: "4 vCPU",
              memory: "8GB",
              storage: "80GB",
              os: "Ubuntu 22.04",
              createdAt: "2024-01-12",
              ipAddress: "192.168.1.15",
              packages: ["docker", "kubernetes", "helm"],
              lastUpdated: "2024-01-21 09:00",
            },
          ],
        },
      ],
    },
    {
      teamName: "B팀",
      teamLeader: "박팀장 (TL-2024-002)",
      members: [
        {
          teamMember: "박철수 (EMP-2024-003)",
          servers: [
            {
              id: 4,
              name: "cache-server-01",
              type: "프라이빗",
              status: "running",
              cpu: "2 vCPU",
              memory: "8GB",
              storage: "50GB",
              os: "Ubuntu 22.04",
              createdAt: "2024-01-14",
              ipAddress: "10.0.2.10",
              packages: ["redis", "memcached"],
              lastUpdated: "2024-01-20 16:45",
            },
            {
              id: 5,
              name: "test-server-01",
              type: "프라이빗",
              status: "stopped",
              cpu: "2 vCPU",
              memory: "4GB",
              storage: "40GB",
              os: "Ubuntu 20.04",
              createdAt: "2024-01-08",
              ipAddress: "10.0.2.15",
              packages: ["jenkins", "git"],
              lastUpdated: "2024-01-18 11:20",
            },
          ],
        },
        {
          teamMember: "최민수 (EMP-2024-004)",
          servers: [
            {
              id: 6,
              name: "monitoring-server-01",
              type: "퍼블릭",
              status: "running",
              cpu: "2 vCPU",
              memory: "4GB",
              storage: "60GB",
              os: "Ubuntu 22.04",
              createdAt: "2024-01-16",
              ipAddress: "192.168.1.25",
              packages: ["prometheus", "grafana", "alertmanager"],
              lastUpdated: "2024-01-21 08:30",
            },
          ],
        },
      ],
    },
    {
      teamName: "C팀",
      teamLeader: "정팀장 (TL-2024-003)",
      members: [
        {
          teamMember: "강지훈 (EMP-2024-005)",
          servers: [
            {
              id: 7,
              name: "backup-server-01",
              type: "프라이빗",
              status: "running",
              cpu: "4 vCPU",
              memory: "16GB",
              storage: "200GB",
              os: "CentOS 8",
              createdAt: "2024-01-13",
              ipAddress: "10.0.3.10",
              packages: ["rsync", "bacula"],
              lastUpdated: "2024-01-20 22:00",
            },
          ],
        },
      ],
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "stopped":
        return <AlertCircle className="h-5 w-5 text-gray-400" />
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "running":
        return "실행 중"
      case "stopped":
        return "중지됨"
      case "pending":
        return "대기 중"
      default:
        return status
    }
  }

  const totalServers = allTeamsServers.reduce(
    (acc, team) => acc + team.members.reduce((sum, member) => sum + member.servers.length, 0),
    0,
  )
  const runningServers = allTeamsServers.reduce(
    (acc, team) =>
      acc + team.members.reduce((sum, member) => sum + member.servers.filter((s) => s.status === "running").length, 0),
    0,
  )
  const totalMembers = allTeamsServers.reduce((acc, team) => acc + team.members.length, 0)

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <Header />

      <main className="flex-1">
        <div className="container px-4 py-8 md:px-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-xl bg-primary/10 p-3">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">부장 마이페이지</h1>
            </div>
            <p className="text-muted-foreground">모든 팀의 가상머신을 관리하고 패키지 승인을 처리하세요</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-4 mb-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                관리자 정보
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">이름</p>
                  <p className="font-medium">{managerInfo.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">사번</p>
                  <p className="font-medium">{managerInfo.employeeId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">부서</p>
                  <p className="font-medium">{managerInfo.department}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">직급</p>
                  <Badge variant="secondary">{managerInfo.role}</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Server className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">전체 서버</p>
                  <p className="text-2xl font-bold">{totalServers}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-lg bg-green-100 p-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">실행 중</p>
                  <p className="text-2xl font-bold">{runningServers}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-lg bg-purple-100 p-2">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">전체 팀원</p>
                  <p className="text-2xl font-bold">{totalMembers}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="mb-6">
            <Link href="/head-approval">
              <Button size="lg" className="w-full md:w-auto gap-2 bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-5 w-5" />
                패키지 승인 관리
              </Button>
            </Link>
          </div>

          <Accordion type="multiple" className="space-y-4">
            {allTeamsServers.map((team, teamIndex) => (
              <AccordionItem key={teamIndex} value={`team-${teamIndex}`} className="border-2 rounded-lg">
                <Card className="border-0">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <Shield className="h-6 w-6 text-primary" />
                        <div className="text-left">
                          <h2 className="text-2xl font-bold">{team.teamName}</h2>
                          <p className="text-sm text-muted-foreground mt-1">팀장: {team.teamLeader}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-base px-3 py-1">
                          {team.members.length}명
                        </Badge>
                        <Badge variant="secondary" className="text-base px-3 py-1">
                          {team.members.reduce((sum, member) => sum + member.servers.length, 0)}개 서버
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div className="space-y-6 pt-4">
                      {team.members.map((member, memberIndex) => (
                        <div key={memberIndex} className="pl-4 border-l-2 border-muted">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              <Users className="h-5 w-5 text-muted-foreground" />
                              {member.teamMember}
                            </h3>
                            <Badge variant="outline">{member.servers.length}개 서버</Badge>
                          </div>

                          <div className="space-y-3">
                            {member.servers.map((vm) => (
                              <div key={vm.id} className="rounded-lg border border-border overflow-hidden">
                                <div
                                  className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                                  onClick={() => toggleServerDetails(vm.id)}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                      <div className="rounded-md bg-primary/10 p-2">
                                        <Server className="h-5 w-5 text-primary" />
                                      </div>
                                      <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-semibold">{vm.name}</h4>
                                          <span className="text-xs px-2 py-1 rounded-full bg-muted">{vm.type}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                          <div>CPU: {vm.cpu}</div>
                                          <div>메모리: {vm.memory}</div>
                                          <div>스토리지: {vm.storage}</div>
                                          <div>OS: {vm.os}</div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">생성일: {vm.createdAt}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {getStatusIcon(vm.status)}
                                      <span className="text-sm font-medium">{getStatusText(vm.status)}</span>
                                      <ChevronDown
                                        className={`h-4 w-4 transition-transform ${
                                          expandedServers.has(vm.id) ? "rotate-180" : ""
                                        }`}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {expandedServers.has(vm.id) && (
                                  <div className="px-4 pb-4 pt-2 bg-muted/30 border-t">
                                    <h5 className="font-semibold mb-3 flex items-center gap-2">
                                      <Package className="h-4 w-4" />
                                      상세 정보
                                    </h5>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <p className="text-muted-foreground mb-1">IP 주소</p>
                                        <p className="font-medium">{vm.ipAddress}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground mb-1">마지막 업데이트</p>
                                        <p className="font-medium">{vm.lastUpdated}</p>
                                      </div>
                                      <div className="col-span-2">
                                        <p className="text-muted-foreground mb-2">설치된 패키지</p>
                                        <div className="flex flex-wrap gap-2">
                                          {vm.packages.map((pkg, idx) => (
                                            <Badge key={idx} variant="secondary" className="text-xs">
                                              {pkg}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>

      <Footer />
    </div>
  )
}
