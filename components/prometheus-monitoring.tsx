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

export function PrometheusMonitoring() {
  const [prometheusUrl, setPrometheusUrl] = useState("http://localhost:9090")
  const [isConfigured, setIsConfigured] = useState(false)
  const [cpuData, setCpuData] = useState<MetricData[]>([])
  const [memoryData, setMemoryData] = useState<MetricData[]>([])
  const [weeklyData, setWeeklyData] = useState<WeeklyUsageData[]>([])
  const [loading, setLoading] = useState(false)

  // Mock data for demonstration
  useEffect(() => {
    if (isConfigured) {
      // Generate mock data
      const generateMockData = () => {
        const now = Date.now()
        return Array.from({ length: 20 }, (_, i) => ({
          timestamp: new Date(now - (19 - i) * 60000).toLocaleTimeString(),
          value: Math.random() * 40 + 40,
        }))
      }

      const generateWeeklyData = () => {
        const days = ["월", "화", "수", "목", "금", "토", "일"]
        return days.map((day) => ({
          day,
          usage: Math.floor(Math.random() * 500 + 300), // GB
          cost: Math.floor(Math.random() * 50000 + 30000), // 원
          users: Math.floor(Math.random() * 500 + 800), // 명
        }))
      }

      setCpuData(generateMockData())
      setMemoryData(generateMockData())
      setWeeklyData(generateWeeklyData())

      // Auto refresh every 30 seconds
      const interval = setInterval(() => {
        setCpuData(generateMockData())
        setMemoryData(generateMockData())
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [isConfigured])

  const handleConnect = async () => {
    setLoading(true)
    // Simulate connection
    setTimeout(() => {
      setIsConfigured(true)
      setLoading(false)
    }, 1000)
  }

  const fetchMetrics = async () => {
    setLoading(true)
    // In real implementation, call Prometheus API
    // Example: const response = await fetch(`/api/prometheus?query=rate(node_cpu_seconds_total[5m])`)
    setTimeout(() => {
      const generateMockData = () => {
        const now = Date.now()
        return Array.from({ length: 20 }, (_, i) => ({
          timestamp: new Date(now - (19 - i) * 60000).toLocaleTimeString(),
          value: Math.random() * 40 + 40,
        }))
      }
      setCpuData(generateMockData())
      setMemoryData(generateMockData())
      setLoading(false)
    }, 500)
  }

  if (!isConfigured) {
    return (
      <Card className="p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Prometheus 연동 설정</h2>
            <p className="text-muted-foreground">Prometheus 서버 URL을 입력하여 실시간 메트릭 데이터를 가져옵니다</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prometheus-url">Prometheus URL</Label>
              <Input
                id="prometheus-url"
                type="text"
                placeholder="http://localhost:9090"
                value={prometheusUrl}
                onChange={(e) => setPrometheusUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">예시: http://your-prometheus-server:9090</p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">주요 쿼리 예시:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>
                  • CPU 사용률:{" "}
                  <code className="bg-background px-1 py-0.5 rounded">
                    100 - (avg(rate(node_cpu_seconds_total{'mode="idle"'}[5m])) * 100)
                  </code>
                </li>
                <li>
                  • 메모리 사용률:{" "}
                  <code className="bg-background px-1 py-0.5 rounded">
                    (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
                  </code>
                </li>
                <li>
                  • 네트워크 트래픽:{" "}
                  <code className="bg-background px-1 py-0.5 rounded">rate(node_network_receive_bytes_total[5m])</code>
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

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">실시간 리소스 모니터링</h2>
            <p className="text-sm text-muted-foreground">Prometheus 메트릭 데이터 - Recharts 시각화</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchMetrics} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              새로고침
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsConfigured(false)}>
              <Settings className="h-4 w-4 mr-2" />
              설정
            </Button>
          </div>
        </div>

        {/* CPU Usage Chart */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">CPU 사용률 (%)</h3>
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
                contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
                labelStyle={{ color: "#fff" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#cpuGradient)"
                name="CPU %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Memory Usage Chart */}
        <div>
          <h3 className="text-lg font-semibold mb-4">메모리 사용률 (%)</h3>
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
                contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
                labelStyle={{ color: "#fff" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#memoryGradient)"
                name="메모리 %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* VM-specific metrics */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">VM별 리소스 사용률</h3>
        <p className="text-sm text-muted-foreground mb-4">각 VM의 실시간 CPU 및 메모리 사용률 (Prometheus에서 수집)</p>
        <div className="grid gap-6 md:grid-cols-2">
          {["web-server-01", "api-server-01", "db-server-01", "cache-server-01"].map((vmName) => (
            <div key={vmName} className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-3">{vmName}</h4>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart
                  data={cpuData.slice(-10).map((item, i) => ({
                    ...item,
                    cpu: item.value + (Math.random() - 0.5) * 20,
                    memory: memoryData[i]?.value + (Math.random() - 0.5) * 15,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="timestamp" stroke="#888" fontSize={10} />
                  <YAxis stroke="#888" fontSize={10} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", fontSize: 12 }} />
                  <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} dot={false} name="CPU" />
                  <Line type="monotone" dataKey="memory" stroke="#8b5cf6" strokeWidth={2} dot={false} name="메모리" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">주간 사용량 및 비용 분석</h3>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 사용량 차트 */}
          <div>
            <h4 className="font-semibold mb-3 text-sm text-muted-foreground">일일 리소스 사용량 (GB)</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="day" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="usage" fill="#3b82f6" name="사용량 (GB)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 비용 차트 */}
          <div>
            <h4 className="font-semibold mb-3 text-sm text-muted-foreground">일일 사용 비용 (₩)</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="day" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="cost" fill="#10b981" name="비용 (원)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 사용자 트렌드 */}
        <div className="mt-6">
          <h4 className="font-semibold mb-3 text-sm text-muted-foreground">주간 사용자 수 트렌드</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="day" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
                labelStyle={{ color: "#fff" }}
              />
              <Line type="monotone" dataKey="users" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} name="사용자 수" />
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
                  <strong>db-server-01</strong>의 메모리 사용률이 92%로 높습니다. 메모리 증설 또는 캐시 최적화를
                  권장합니다.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <TrendingDown className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>cache-server-01</strong>의 평균 사용률이 45%입니다. 리소스를 줄여 비용을 약{" "}
                  <strong>₩15,000/월</strong> 절감할 수 있습니다.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <p>
                  주말(토, 일) 사용자 수가 평일 대비 40% 감소합니다. 오토스케일링 설정을 통해 비용 최적화가 가능합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
