"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Chatbot, type ChatMessage } from "@/components/chatbot";
import { useSse } from "@/lib/context/SseContext";

export function ChatbotWrapper() {
  const pathname = usePathname();

  // 🔥 전체 jobId 상태 가져오기
  const { sseStates } = useSse();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasError, setHasError] = useState(false);

  // 🔥 상태 중 마지막 error 찾기
  const latestError = (() => {
    const entries = Object.values(sseStates);
    const errors = entries.filter((s) => s.status === "error");
    return errors.length > 0 ? errors[errors.length - 1] : null;
  })();

  // ⭐ N8N 오류 메시지 챗봇 출력 처리
  useEffect(() => {
    if (latestError && latestError.errorDetails) {
      const summary = (latestError.errorDetails.summary ?? "").trim();
      const rootCause = (latestError.errorDetails.rootCause ?? "").trim();
      const fix = (latestError.errorDetails.fix ?? "").trim();

      const errorText = `${summary}

${rootCause}

${fix}`.trim();

      if (errorText) {
        setMessages((prev) => [...prev, { text: errorText, isBot: true }]);
        setHasError(true);
      }
    }
  }, [latestError]);

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
