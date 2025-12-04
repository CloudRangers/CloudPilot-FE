"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Chatbot, type ChatMessage } from "@/components/chatbot";
import { useSse } from "@/lib/context/SseContext";

export function ChatbotWrapper() {
  const pathname = usePathname();
  const { status, errorDetails } = useSse();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasError, setHasError] = useState(false);

  // ⭐ N8N 오류 메시지 챗봇 출력 처리
  useEffect(() => {
    if (status === "error" && errorDetails) {
      const summary = (errorDetails.summary ?? "").trim();
const rootCause = (errorDetails.rootCause ?? "").trim();
const fix = (errorDetails.fix ?? "").trim();

      const errorText = `${summary}

${rootCause}

${fix}`.trim();

      if (errorText) {
        setMessages((prev) => [...prev, { text: errorText, isBot: true }]);
        setHasError(true);
      }
    }
  }, [status, errorDetails]);

  const handleSendMessage = (messageText: string) => {
    setMessages((prev) => [...prev, { text: messageText, isBot: false }]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          text: "문의 감사합니다. 관리자가 곧 답변드릴 예정입니다.",
          isBot: true,
        },
      ]);
    }, 800);
  };

  const handleErrorChange = (value: boolean) => {
    setHasError(value);
  };

  if (pathname === "/login") return null;

  return (
    <Chatbot
      messages={messages}
      onSendMessage={handleSendMessage}
      hasError={hasError}
      onErrorChange={handleErrorChange}
    />
  );
}
