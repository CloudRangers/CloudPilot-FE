import type React from "react"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ChatbotWrapper } from "@/components/chatbot-wrapper"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`font-sans antialiased`}>
        {children}
        <ChatbotWrapper />
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.app'
    };
