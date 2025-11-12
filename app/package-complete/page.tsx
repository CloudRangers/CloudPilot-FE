"use client"

import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2, Home, Package } from "lucide-react"

export default function PackageCompletePage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <Header />

      <main className="flex-1 flex items-center justify-center">
        <div className="container px-4 py-8 md:px-6">
          <div className="mx-auto max-w-2xl">
            <Card className="overflow-hidden border-2 shadow-2xl">
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-12 text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 animate-in zoom-in-95 duration-500">
                  <CheckCircle2 className="h-12 w-12 text-primary animate-in zoom-in duration-700 delay-200" />
                </div>

                <h1 className="text-4xl font-bold tracking-tight mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                  패키지 설치 완료
                </h1>

                <p className="text-lg text-muted-foreground mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
                  요청하신 모든 패키지가 성공적으로 설치되었습니다
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
                  <Button
                    size="lg"
                    className="min-w-[180px] shadow-md hover:shadow-lg transition-all"
                    onClick={() => router.push("/")}
                  >
                    <Home className="mr-2 h-5 w-5" />
                    홈으로 이동
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="min-w-[180px] shadow-sm hover:shadow-md transition-all bg-transparent"
                    onClick={() => router.push("/package-list")}
                  >
                    <Package className="mr-2 h-5 w-5" />
                    패키지 현황 보기
                  </Button>
                </div>
              </div>

              <div className="border-t bg-muted/30 px-12 py-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">설치된 패키지</p>
                      <p className="text-sm text-muted-foreground">모든 패키지가 정상적으로 설치되어 사용 가능합니다</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">다음 단계</p>
                      <p className="text-sm text-muted-foreground">
                        패키지 현황 페이지에서 설치된 패키지를 확인하고 관리할 수 있습니다
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
