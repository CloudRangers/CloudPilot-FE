"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Package, Search, Calendar } from "lucide-react"

interface InstalledPackage {
  id: string
  name: string
  version: string
  installedDate: string
  requestId: string
  installedBy: string
}

export default function PackageListPage() {
  const [packages, setPackages] = useState<InstalledPackage[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const storedPackages = JSON.parse(localStorage.getItem("installedPackages") || "[]")
    setPackages(storedPackages)
  }, [])

  const filteredPackages = packages.filter((pkg) => pkg.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <Header />

      <main className="flex-1">
        <div className="container px-4 py-8 md:px-6 md:py-12">
          <div className="mx-auto max-w-6xl">
            <div className="space-y-3 text-center mb-8">
              <div className="flex items-center justify-center gap-3">
                <div className="rounded-xl bg-primary/10 p-3">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">패키지 현황</h1>
              </div>
              <p className="text-muted-foreground">설치된 패키지 목록을 확인하세요</p>
            </div>

            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="패키지 이름으로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {filteredPackages.length === 0 ? (
              <Card className="p-12 text-center">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {searchQuery ? "검색 결과가 없습니다" : "설치된 패키지가 없습니다"}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "다른 검색어로 시도해보세요" : "패키지 신청 후 승인되면 이곳에 표시됩니다"}
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPackages.map((pkg) => (
                  <Card
                    key={pkg.id}
                    className="border-2 shadow-lg overflow-hidden hover:border-primary/50 transition-all"
                  >
                    <div className="border-b bg-muted/30 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">{pkg.name}</h3>
                        <Badge variant="secondary">v{pkg.version}</Badge>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(pkg.installedDate)}</span>
                      </div>

                      <div className="text-sm">
                        <p className="text-muted-foreground">
                          <span className="font-medium">설치자:</span> {pkg.installedBy}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <div className="mt-8 text-center text-sm text-muted-foreground">
              총 {filteredPackages.length}개의 패키지가 설치되어 있습니다
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
