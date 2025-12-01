"use client"

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Chatbot, type ChatMessage } from "@/components/chatbot";
import { useSse } from "@/lib/context/SseContext";

export function ChatbotWrapper() {
  const pathname = usePathname();
  const { status, errorDetails } = useSse();

  const [messages, setMessages] = useState<ChatMessage[]>([
    // { text: "안녕하세요! Cloud Pilot 도우미입니다. 무엇을 도와드릴까요?", isBot: true },
  ]);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (status === 'error' && errorDetails && errorDetails.summary) {
      const errorText = `
패키지 설치 중 오류가 발생했습니다.

${errorDetails.summary}

${errorDetails.rootCause}

${errorDetails.fix}
      `.trim();

      const errorMessage: ChatMessage = { text: errorText, isBot: true };
      setMessages((prev) => [...prev, errorMessage]);
      setHasError(true);
    }
  }, [status, errorDetails]);

  const handleSendMessage = (messageText: string) => {
    setMessages((prev) => [...prev, { text: messageText, isBot: false }]);
    // Placeholder for a real bot response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { text: "문의 주셔서 감사합니다. 관리자가 곧 답변드리겠습니다.", isBot: true },
      ]);
    }, 1000);
  };

  const handleErrorChange = (errorState: boolean) => {
    setHasError(errorState);
  };

  if (pathname === "/login") {
    return null;
  }

  return (
    <Chatbot
      messages={messages}
      onSendMessage={handleSendMessage}
      hasError={hasError}
      onErrorChange={handleErrorChange}
    />
  );
}
