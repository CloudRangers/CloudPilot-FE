"use client"

import { usePathname } from "next/navigation"
import { Chatbot } from "@/components/chatbot"

export function ChatbotWrapper() {
  const pathname = usePathname()

  if (pathname === "/login") {
    return null
  }

  return <Chatbot />
}
