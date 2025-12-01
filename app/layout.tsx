"use client";

import type React from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ChatbotWrapper } from "@/components/chatbot-wrapper";
import { AuthProvider } from "@/app/providers/AuthProvider";
import { SseProvider } from "@/lib/context/SseContext";
import { Toaster } from "@/components/ui/toaster";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          <SseProvider>
            {children}
            <ChatbotWrapper />
            <Toaster />
          </SseProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
