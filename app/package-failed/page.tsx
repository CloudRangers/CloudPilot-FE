"use client"

import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { XCircle, Home, RefreshCw } from "lucide-react"

export default function PackageFailedPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-destructive/10">
      <Header />

      <main className="flex-1 flex items-center justify-center">
        <div className="container px-4 py-8 md:px-6">
          <div className="mx-auto max-w-2xl">
            <Card className="overflow-hidden border-2 border-destructive/50 shadow-2xl">
              <div className="bg-gradient-to-br from-destructive/10 via-destructive/5 to-background p-12 text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10 animate-in zoom-in-95 duration-500">
                  <XCircle className="h-12 w-12 text-destructive animate-in zoom-in duration-700 delay-200" />
                </div>

                <h1 className="text-4xl font-bold tracking-tight text-destructive mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                  패키지 설치 실패
                </h1>

                <p className="text-lg text-muted-foreground mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
                  패키지 설치 중 오류가 발생했습니다.
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
                    onClick={() => router.push("/install-package")}
                  >
                    <RefreshCw className="mr-2 h-5 w-5" />
                    다시 시도
                  </Button>
                </div>
              </div>

              <div className="border-t border-destructive/20 bg-muted/30 px-12 py-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-destructive flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-destructive">오류 발생</p>
                      <p className="text-sm text-muted-foreground">서버 로그를 확인하거나 관리자에게 문의하세요.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-destructive flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">다음 단계</p>
                      <p className="text-sm text-muted-foreground">
                        '다시 시도'를 클릭하여 패키지 설치를 재시도하거나 홈으로 돌아가세요.
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
