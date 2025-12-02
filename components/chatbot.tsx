"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, X, Send, AlertCircle } from "lucide-react"

export interface ChatMessage {
  text: string
  isBot: boolean
}

interface ChatbotProps {
  messages: ChatMessage[]
  onSendMessage: (messageText: string) => void
  hasError?: boolean
  onErrorChange?: (hasError: boolean) => void
}

export function Chatbot({ messages, onSendMessage, hasError = false, onErrorChange }: ChatbotProps) {
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessage, setChatMessage] = useState("")

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      onSendMessage(chatMessage);
      setChatMessage("")
    }
  }

  return (
    <>
      {chatOpen ? (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-background border border-border rounded-lg shadow-lg flex flex-col z-50">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <span className="font-semibold">Cloud Pilot 도우미</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setChatOpen(false)
                if (onErrorChange) onErrorChange(false)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`rounded-lg p-3 text-sm whitespace-pre-line ${
                  msg.isBot ? "bg-muted" : "bg-primary text-primary-foreground ml-8"
                }`}
              >
                <p>{msg.text}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="icon"
            className={`h-14 w-14 rounded-full shadow-lg relative ${hasError ? "animate-pulse" : ""}`}
            onClick={() => setChatOpen(true)}
          >
            <MessageCircle className="h-6 w-6" />
            {hasError && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-destructive items-center justify-center">
                  <AlertCircle className="h-3 w-3 text-destructive-foreground" />
                </span>
              </span>
            )}
          </Button>
        </div>
      )}
    </>
  )
}
