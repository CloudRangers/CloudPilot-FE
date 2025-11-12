import { NextResponse } from "next/server"

// Prometheus API proxy to avoid CORS issues
export async function POST(request: Request) {
  try {
    const { prometheusUrl, query } = await request.json()

    if (!prometheusUrl || !query) {
      return NextResponse.json({ error: "Missing prometheusUrl or query" }, { status: 400 })
    }

    // Build Prometheus query_range endpoint
    const url = new URL(`${prometheusUrl}/api/v1/query_range`)
    const now = Math.floor(Date.now() / 1000)
    const start = now - 3600 // Last 1 hour

    url.searchParams.append("query", query)
    url.searchParams.append("start", start.toString())
    url.searchParams.append("end", now.toString())
    url.searchParams.append("step", "60") // 1 minute intervals

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status !== "success") {
      return NextResponse.json({ error: "Prometheus query failed", details: data }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Prometheus API error:", error)
    return NextResponse.json({ error: "Failed to fetch metrics from Prometheus" }, { status: 500 })
  }
}

// Example usage:
// POST /api/prometheus
// Body: {
//   "prometheusUrl": "http://localhost:9090",
//   "query": "rate(node_cpu_seconds_total{mode='idle'}[5m])"
// }
