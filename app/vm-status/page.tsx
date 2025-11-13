"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { MessageCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"

interface VMCreationRequest {
  id: string
  timestamp: string
  status: "in progress" | "Success" | "Failed"
}

export default function VMStatusPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const vmRequests: VMCreationRequest[] = [
    {
      id: "VM-REQ-001",
      timestamp: "2025-10-21 16:21",
      status: "in progress",
    },
    {
      id: "VM-REQ-002",
      timestamp: "2025-10-21 15:11",
      status: "Success",
    },
    {
      id: "VM-REQ-003",
      timestamp: "2025-10-21 14:03",
      status: "Failed",
    },
    {
      id: "VM-REQ-004",
      timestamp: "2025-10-21 03:45",
      status: "Failed",
    },
    {
      id: "VM-REQ-005",
      timestamp: "2025-10-20 18:30",
      status: "Success",
    },
    {
      id: "VM-REQ-006",
      timestamp: "2025-10-20 16:15",
      status: "Success",
    },
    {
      id: "VM-REQ-007",
      timestamp: "2025-10-20 14:22",
      status: "in progress",
    },
    {
      id: "VM-REQ-008",
      timestamp: "2025-10-20 11:45",
      status: "Failed",
    },
  ]

  const totalPages = Math.ceil(vmRequests.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRequests = vmRequests.slice(startIndex, endIndex)

  const getStatusColor = (status: VMCreationRequest["status"]) => {
    switch (status) {
      case "Success":
        return "bg-green-500/10 text-green-600 border-green-500/20"
      case "Failed":
        return "bg-red-500/10 text-red-600 border-red-500/20"
      case "in progress":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20"
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-primary/5">
      <Header />

      <main className="flex-1 container px-4 py-8 md:px-6">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Header Section */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">A팀</h1>
            <h2 className="text-xl font-semibold text-muted-foreground">VM 생성 현황</h2>
          </div>

          {/* VM Creation Requests List */}
          <div className="space-y-3">
            {currentRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between rounded-lg border bg-background/80 p-4 transition-all hover:border-primary/50 hover:shadow-md"
              >
                <div className="flex items-center gap-4 flex-1">
                  <span className="font-medium text-foreground/80">VM 생성 관련 ID</span>
                  <span className="text-sm text-muted-foreground">{request.id}</span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-mono text-muted-foreground">{request.timestamp}</span>
                  <Badge variant="outline" className={`min-w-[100px] justify-center ${getStatusColor(request.status)}`}>
                    {request.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="min-w-[2.5rem]"
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Chatbot Button */}
      <div className="fixed bottom-24 right-6 z-40">
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 bg-gradient-to-br from-primary to-primary/80"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="sr-only">챗봇 열기</span>
        </Button>
      </div>

      <Footer />
    </div>
  )
}
