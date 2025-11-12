"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ExternalLink } from "lucide-react"

export function GrafanaEmbed() {
  const [grafanaUrl, setGrafanaUrl] = useState("")
  const [embedUrl, setEmbedUrl] = useState("")
  const [isConfigured, setIsConfigured] = useState(false)

  const handleConnect = () => {
    // Convert regular Grafana URL to embed URL with kiosk mode
    const url = grafanaUrl.trim()

    // Add kiosk mode parameters
    const separator = url.includes("?") ? "&" : "?"
    const finalUrl = `${url}${separator}theme=light&kiosk=tv`

    setEmbedUrl(finalUrl)
    setIsConfigured(true)
  }

  if (!isConfigured) {
    return (
      <Card className="p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Grafana 대시보드 임베드</h2>
            <p className="text-muted-foreground">Grafana 대시보드 URL을 입력하여 페이지에 임베드합니다</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grafana-url">Grafana 대시보드 URL</Label>
              <Input
                id="grafana-url"
                type="text"
                placeholder="https://your-grafana.com/d/dashboard-id"
                value={grafanaUrl}
                onChange={(e) => setGrafanaUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">예시: https://grafana.example.com/d/xyz123/vm-monitoring</p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">설정 가이드:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>1. Grafana에서 대시보드를 생성하고 VM 메트릭을 추가합니다</li>
                <li>2. Prometheus를 데이터 소스로 연결합니다</li>
                <li>3. 대시보드 URL을 복사하여 위에 입력합니다</li>
                <li>4. Grafana 설정에서 iframe 임베딩을 허용해야 합니다</li>
              </ul>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm text-blue-400">Grafana 설정 필수사항:</h4>
              <p className="text-xs text-muted-foreground">
                Grafana의 <code className="bg-background px-1 py-0.5 rounded">grafana.ini</code> 파일에서 다음 설정을
                활성화해야 합니다:
              </p>
              <pre className="bg-background p-2 rounded text-xs overflow-x-auto">
                {`[security]
allow_embedding = true

[auth.anonymous]
enabled = true
org_role = Viewer`}
              </pre>
            </div>

            <Button onClick={handleConnect} disabled={!grafanaUrl} className="w-full">
              Grafana 대시보드 연동
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Grafana 대시보드</h2>
          <p className="text-sm text-muted-foreground">실시간 VM 리소스 모니터링</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={grafanaUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />새 탭에서 열기
            </a>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsConfigured(false)}>
            URL 변경
          </Button>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden border bg-background" style={{ height: "800px" }}>
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          title="Grafana Dashboard"
          style={{ display: "block" }}
        />
      </div>

      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Grafana 대시보드가 표시되지 않는 경우, Grafana 서버 설정에서 iframe 임베딩이 허용되어 있는지 확인하세요.
        </p>
      </div>
    </Card>
  )
}
