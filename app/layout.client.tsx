"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { Chatbot } from "@/components/chatbot"
import "./globals.css"

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // <CHANGE> Get current pathname to conditionally render chatbot
  const pathname = usePathname()
  const isLoginPage = pathname === "/login"

  return (
    <>
      {children}
      {/* <CHANGE> Show chatbot on all pages except login */}
      {!isLoginPage && <Chatbot />}
    </>
  )
}
