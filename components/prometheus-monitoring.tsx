"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { RefreshCw, Settings, TrendingDown, AlertTriangle } from "lucide-react"

// === 공통: 백엔드 응답 타입 ===
interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

// === Prometheus summary 응답 타입 (/api/monitoring/prometheus/summary) ===
interface PrometheusSummary {
  totalTargets: number
  upTargets: number
  downTargets: number
}

// === RechartsDataResponse (/ops/v1/vms/{vmId}/metrics/recharts) ===
interface RechartsPoint {
  timestamp: string
  value: number
}

interface VmMetricRechartsResponse {
  vmId: string
  metricName: string
  data: RechartsPoint[]
}

// 프론트에서 차트에 사용하는 형태
interface MetricData {
  timestamp: string
  value: number
}

interface WeeklyUsageData {
  day: string
  usage: number
  cost: number
  users: number
}

interface CombinedVmMetricPoint {
  timestamp: string
  cpu: number | null
  memory: number | null
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"

// 🔹 임시 VM 타겟 목록 (vmId = node-exporter instance)
const VM_TARGETS = [
     { id: "172.16.5.112:9100", name: "worker-node1 (112)" },
     { id: "172.16.5.117:9100", name: "worker-node2 (117)" },
  // { id: "172.16.5.112:9100", name: "web-server-01" },
  // { id: "172.16.5.113:9100", name: "api-server-01" },
  // { id: "172.16.5.114:9100", name: "db-server-01" },
  // { id: "172.16.5.115:9100", name: "cache-server-01" },
] as const

export function PrometheusMonitoring() {
  const [prometheusUrl, setPrometheusUrl] = useState("http://localhost:9090") // UI 표시용
  const [isConfigured, setIsConfigured] = useState(false)

  // summary 기반 서비스 가용률 (Up / Down 비율)
  const [cpuData, setCpuData] = useState<MetricData[]>([]) // Up 비율
  const [memoryData, setMemoryData] = useState<MetricData[]>([]) // Down 비율

  // VM별 cpu/memory 시계열
  const [vmCharts, setVmCharts] = useState<
    Record<string, CombinedVmMetricPoint[]>
  >({})

  const [weeklyData, setWeeklyData] = useState<WeeklyUsageData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // --- 주간 사용량/비용/사용자: 지금은 기존 mock 유지 ---
  useEffect(() => {
    const generateWeeklyData = () => {
      const days = ["월", "화", "수", "목", "금", "토", "일"]
      return days.map((day) => ({
        day,
        usage: Math.floor(Math.random() * 500 + 300),
        cost: Math.floor(Math.random() * 50000 + 30000),
        users: Math.floor(Math.random() * 500 + 800),
      }))
    }

    setWeeklyData(generateWeeklyData())
  }, [])

  // === summary 기반 서비스 가용률 호출 ===
  const fetchSummaryMetrics = async () => {
    const res = await fetch(
      `${API_BASE_URL}/api/monitoring/prometheus/summary`,
      {
        method: "GET",
        credentials: "include",
      },
    )

    if (!res.ok) {
      throw new Error(`백엔드 summary 요청 실패: ${res.status}`)
    }

    const body: ApiResponse<PrometheusSummary> = await res.json()

    if (!body.success) {
      throw new Error(body.message || "Prometheus 요약 메트릭 조회 실패")
    }

    const { totalTargets, upTargets, downTargets } = body.data
    const nowLabel = new Date().toLocaleTimeString()

    const upRate = totalTargets > 0 ? (upTargets / totalTargets) * 100 : 0
    const downRate = totalTargets > 0 ? (downTargets / totalTargets) * 100 : 0

    // 최근 30개까지만 유지
    setCpuData((prev) => [
      ...prev.slice(-29),
      { timestamp: nowLabel, value: Number(upRate.toFixed(2)) },
    ])
    setMemoryData((prev) => [
      ...prev.slice(-29),
      { timestamp: nowLabel, value: Number(downRate.toFixed(2)) },
    ])
  }

  // === 특정 VM + 특정 metricName 에 대한 Recharts 데이터 조회 ===
  const fetchVmRecharts = async (
    vmId: string,
    metricName: "vm_cpu_usage_percent" | "vm_memory_usage_percent",
    rangeMinutes = 60,
    stepSeconds = 60,
  ): Promise<RechartsPoint[]> => {
    const encodedVmId = encodeURIComponent(vmId)

    const res = await fetch(
      `${API_BASE_URL}/ops/v1/vms/${encodedVmId}/metrics/recharts` +
        `?metricName=${metricName}&rangeMinutes=${rangeMinutes}&stepSeconds=${stepSeconds}`,
      {
        method: "GET",
        credentials: "include",
      },
    )

    if (!res.ok) {
      throw new Error(
        `VM 메트릭 요청 실패 (${metricName}): ${res.status} ${res.statusText}`,
      )
    }

    const body: ApiResponse<VmMetricRechartsResponse> = await res.json()

    if (!body.success) {
      throw new Error(body.message || `VM 메트릭 조회 실패: ${metricName}`)
    }

    return body.data.data
  }

  // === VM_TARGETS 전체에 대한 cpu/memory 시계열 조회 ===
  const fetchVmCharts = async () => {
    const result: Record<string, CombinedVmMetricPoint[]> = {}

    for (const vm of VM_TARGETS) {
      try {
        const [cpuSeries, memSeries] = await Promise.all([
          fetchVmRecharts(vm.id, "vm_cpu_usage_percent"),
          fetchVmRecharts(vm.id, "vm_memory_usage_percent"),
        ])

        const length = Math.min(cpuSeries.length, memSeries.length)

        const merged: CombinedVmMetricPoint[] = []
        for (let i = 0; i < length; i++) {
          merged.push({
            timestamp: cpuSeries[i].timestamp,
            cpu: cpuSeries[i].value,
            memory: memSeries[i].value,
          })
        }

        result[vm.id] = merged
      } catch (e) {
        console.error(`VM 차트 데이터 조회 실패: ${vm.id}`, e)
        result[vm.id] = []
      }
    }

    setVmCharts(result)
  }

  // === summary + VM 메트릭 한 번에 호출 ===
  const fetchAllMetrics = async () => {
    setLoading(true)
    setError(null)

    try {
      await fetchSummaryMetrics()
      await fetchVmCharts()
    } catch (err) {
      console.error(err)
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
      )
    } finally {
      setLoading(false)
    }
  }

  // === 설정 후 30초마다 자동 refresh ===
  useEffect(() => {
    if (!isConfigured) return

    // 처음 한 번
    fetchAllMetrics()

    const interval = setInterval(() => {
      fetchAllMetrics()
    }, 30000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfigured])

  const handleConnect = () => {
    setLoading(true)
    setError(null)
    setTimeout(() => {
      setIsConfigured(true)
      setLoading(false)
    }, 500)
  }

  // === 초기 설정 화면 ===
  if (!isConfigured) {
    return (
      <Card className="p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Prometheus 연동 설정</h2>
            <p className="text-muted-foreground">
              Prometheus 서버 URL은 백엔드에서 관리되며, 연결 후 실시간
              서비스 가용률 및 VM 메트릭 데이터를 가져옵니다.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prometheus-url">Prometheus URL (표시용)</Label>
              <Input
                id="prometheus-url"
                type="text"
                placeholder="http://localhost:9090"
                value={prometheusUrl}
                onChange={(e) => setPrometheusUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                실제 연결은 백엔드{" "}
                <code>monitoring.prometheus.base-url</code> 설정을 사용합니다.
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">주요 쿼리 예시:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>
                  • 서비스 상태(up):{" "}
                  <code className="bg-background px-1 py-0.5 rounded">up</code>
                </li>
                <li>
                  • 특정 job 상태:{" "}
                  <code className="bg-background px-1 py-0.5 rounded">
                    up&#123;job="node-exporter"&#125;
                  </code>
                </li>
                <li>
                  • 장애 대상만:{" "}
                  <code className="bg-background px-1 py-0.5 rounded">
                    up == 0
                  </code>
                </li>
              </ul>
            </div>

            <Button onClick={handleConnect} disabled={loading} className="w-full">
              {loading ? "연결 중..." : "Prometheus 연결"}
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  // === 메인 대시보드 화면 ===
  return (
    <div className="space-y-6">
      {/* 서비스 가용률 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">
              실시간 서비스 가용률 모니터링
            </h2>
            <p className="text-sm text-muted-foreground">
              CloudPilot 백엔드 → Prometheus <code>up</code> 메트릭 → Recharts
              시각화
            </p>
            {error && (
              <p className="text-xs text-red-400 mt-1">에러: {error}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAllMetrics}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {loading ? "불러오는 중..." : "새로고침"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfigured(false)}
            >
              <Settings className="h-4 w-4 mr-2" />
              설정
            </Button>
          </div>
        </div>

        {/* Up 비율 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">
            서비스 가용률 (Up 비율, %)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={cpuData}>
              <defs>
                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="timestamp" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#cpuGradient)"
                name="Up 비율 %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Down 비율 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            장애 비율 (Down 비율, %)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={memoryData}>
              <defs>
                <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="timestamp" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#memoryGradient)"
                name="Down 비율 %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* VM별 리소스 사용률 – 실제 /ops/v1/vms 기반 */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">VM별 리소스 사용률</h3>
        <p className="text-sm text-muted-foreground mb-4">
          node-exporter 메트릭을 기반으로 VM CPU/메모리 사용률을 시각화합니다.
          (현재는 instance 주소를 직접 매핑해서 사용 중)
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          {VM_TARGETS.map((vm) => {
            const data = vmCharts[vm.id] ?? []
            return (
              <div key={vm.id} className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3">{vm.name}</h4>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="timestamp" stroke="#888" fontSize={10} />
                    <YAxis stroke="#888" fontSize={10} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #333",
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cpu"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      name="CPU 사용률(%)"
                    />
                    <Line
                      type="monotone"
                      dataKey="memory"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={false}
                      name="메모리 사용률(%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )
          })}
        </div>
      </Card>

      {/* 기존 주간 분석/최적화 카드들 그대로 유지 */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">주간 사용량 및 비용 분석</h3>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h4 className="font-semibold mb-3 text-sm text-muted-foreground">
              일일 리소스 사용량 (GB)
            </h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="day" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar
                  dataKey="usage"
                  fill="#3b82f6"
                  name="사용량 (GB)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm text-muted-foreground">
              일일 사용 비용 (₩)
            </h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="day" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar
                  dataKey="cost"
                  fill="#10b981"
                  name="비용 (원)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-semibold mb-3 text-sm text-muted-foreground">
            주간 사용자 수 트렌드
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="day" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 4 }}
                name="사용자 수"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6 bg-blue-950/20 border-blue-500/30">
        <div className="flex items-start gap-3">
          <TrendingDown className="h-6 w-6 text-blue-400 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-2">최적화 제안</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>db-server-01</strong>의 메모리 사용률이 92%로
                  높습니다. 메모리 증설 또는 캐시 최적화를 권장합니다.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <TrendingDown className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>cache-server-01</strong>의 평균 사용률이 45%입니다.
                  리소스를 줄여 비용을 약{" "}
                  <strong>₩15,000/월</strong> 절감할 수 있습니다.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <p>
                  주말(토, 일) 사용자 수가 평일 대비 40% 감소합니다.
                  오토스케일링 설정을 통해 비용 최적화가 가능합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
