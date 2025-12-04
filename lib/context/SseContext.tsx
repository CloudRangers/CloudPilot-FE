"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";

interface SseState {
  progress: number;
  stage: string;
  message: string;
  status: "idle" | "connecting" | "connected" | "error" | "completed";
  errorDetails: any | null;
}

interface SseContextType extends SseState {
  startSseConnection: (jobId: string) => void;
  stopSseConnection: () => void;
  resetSseState: () => void;
}

const SseContext = createContext<SseContextType | undefined>(undefined);

// 🔧 문자열 클린 함수 (빈 문자열 제거)
const clean = (v: any) =>
  typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;

// 🔧 errorDetails도 빈 문자열 제거
const cleanData = (data: any, prev: any = {}) => {
  const cleaned: any = {};

  for (const key of Object.keys(data)) {
    const value = data[key];
    if (clean(value) !== undefined) cleaned[key] = clean(value);
    else if (typeof value !== "string") cleaned[key] = value;
  }

  return { ...prev, ...cleaned };
};

export const SseProvider = ({ children }: { children: ReactNode }) => {
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [sseState, setSseState] = useState<SseState>({
    progress: 0,
    stage: "",
    message: "Initializing...",
    status: "idle",
    errorDetails: null,
  });

  const resetSseState = useCallback(() => {
    setSseState({
      progress: 0,
      stage: "",
      message: "Initializing...",
      status: "idle",
      errorDetails: null,
    });
  }, []);

  const stopSseConnection = useCallback(() => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
  }, [eventSource]);

  useEffect(() => {
    return () => stopSseConnection();
  }, [stopSseConnection]);

  const startSseConnection = useCallback(
    (jobId: string) => {
      if (eventSource) stopSseConnection();

      resetSseState();

      const newEventSource = new EventSource(
        `http://localhost:8080/sse/${jobId}`
      );
      setEventSource(newEventSource);

      newEventSource.onopen = () => {
        setSseState((prev) => ({ ...prev, status: "connected" }));
      };

      const updateState = (data: any) => {
        setSseState((prev) => {
          const newState = {
            ...prev,
            progress:
              typeof data.progress === "number"
                ? data.progress
                : prev.progress,

            stage: clean(data.stage) ?? prev.stage,

            // 🔥 핵심: message에 빈 문자가 절대 들어가지 않도록 처리
            message:
              clean(data.message) ??
              clean(data.summary) ??
              prev.message,

            // 🔥 errorDetails도 빈 값 절대 안 들어가게
            errorDetails: cleanData(data, prev.errorDetails),
          };

          if (data.stage === "ERROR" || data.status === "error") {
            newState.status = "error";
          } else if (data.progress === 100) {
            newState.status = "completed";
          }

          return newState;
        });

        // 종료 조건
        if (
          data.stage === "ERROR" ||
          data.status === "error" ||
          data.progress === 100
        ) {
          stopSseConnection();
        }
      };

      newEventSource.addEventListener("progress", (event: MessageEvent) => {
        try {
          updateState(JSON.parse(event.data));
        } catch (e) {
          console.error("JSON parse error (progress)", e);
        }
      });

      newEventSource.addEventListener("message", (event: MessageEvent) => {
        try {
          updateState(JSON.parse(event.data));
        } catch (e) {
          console.error("JSON parse error (custom message)", e);
        }
      });

      newEventSource.onmessage = (event: MessageEvent) => {
        try {
          updateState(JSON.parse(event.data));
        } catch (e) {
          console.error("JSON parse error (default)", e);
        }
      };

      newEventSource.onerror = () => {
        setSseState((prev) => ({
          ...prev,
          status: "error",
          message: "Connection failed.",
        }));
        stopSseConnection();
      };
    },
    [stopSseConnection, resetSseState]
  );

  const value: SseContextType = {
    ...sseState,
    startSseConnection,
    stopSseConnection,
    resetSseState,
  };

  return <SseContext.Provider value={value}>{children}</SseContext.Provider>;
};

export const useSse = (): SseContextType => {
  const context = useContext(SseContext);
  if (!context) {
    throw new Error("useSse must be used within SseProvider");
  }
  return context;
};
