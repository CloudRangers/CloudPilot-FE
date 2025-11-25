"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts"

// 임시 Mock 데이터 (Prometheus 시계열 흉내)
const mockVmMetrics = [
  { time: "10:00", cpu: 30, memory: 45 },
  { time: "10:05", cpu: 40, memory: 50 },
  { time: "10:10", cpu: 35, memory: 52 },
  { time: "10:15", cpu: 55, memory: 60 },
  { time: "10:20", cpu: 50, memory: 58 },
]

export function VmMetricsChart() {
  return (
    <div className="w-full h-80 border rounded-xl p-4 bg-card">
      <h3 className="text-sm font-medium mb-2">CPU / 메모리 사용률 추이 (Mock)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={mockVmMetrics}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis unit="%" />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="cpu" name="CPU" dot={false} />
          <Line type="monotone" dataKey="memory" name="메모리" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
