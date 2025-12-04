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

interface SseContextType {
  sseStates: Record<string, SseState>;
  startSseConnection: (jobId: string) => void;
  stopSseConnection: (jobId: string) => void;
  resetSseState: (jobId: string) => void;
}

const SseContext = createContext<SseContextType | undefined>(undefined);

// 문자열 클린
const clean = (v: any) =>
  typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;

// errorDetails 클린
const cleanData = (data: any, prev: any = {}) => {
  const cleaned: any = {};

  for (const key of Object.keys(data)) {
    const value = data[key];
    if (clean(value) !== undefined) cleaned[key] = clean(value);
    else if (typeof value !== "string") cleaned[key] = value;
  }

  return { ...prev, ...cleaned };
};

const defaultState: SseState = {
  progress: 0,
  stage: "",
  message: "Initializing...",
  status: "idle",
  errorDetails: null,
};

export const SseProvider = ({ children }: { children: ReactNode }) => {
  const [eventSources, setEventSources] = useState<
    Record<string, EventSource>
  >({});
  const [sseStates, setSseStates] = useState<Record<string, SseState>>({});

  // jobId별 상태 초기화
  const resetSseState = useCallback((jobId: string) => {
    setSseStates((prev) => ({
      ...prev,
      [jobId]: { ...defaultState },
    }));
  }, []);

  // jobId 단위 SSE 종료
  const stopSseConnection = useCallback(
    (jobId: string) => {
      const es = eventSources[jobId];
      if (es) {
        es.close();
        setEventSources((prev) => {
          const newMap = { ...prev };
          delete newMap[jobId];
          return newMap;
        });
      }
    },
    [eventSources]
  );

  // jobId별 상태 업데이트
  const updateState = useCallback((jobId: string, data: any) => {
    setSseStates((prev) => {
      const current = prev[jobId] || defaultState;

      const updated: SseState = {
        ...current,
        progress:
          typeof data.progress === "number" ? data.progress : current.progress,
        stage: clean(data.stage) ?? current.stage,
        message:
          clean(data.message) ??
          clean(data.summary) ??
          current.message,
        errorDetails: cleanData(data, current.errorDetails),
        status:
          data.stage === "ERROR" || data.status === "error"
            ? "error"
            : data.progress === 100
            ? "completed"
            : current.status,
      };

      return {
        ...prev,
        [jobId]: updated,
      };
    });

    // job 종료 시 해당 SSE만 끊음
    if (
      data.stage === "ERROR" ||
      data.status === "error" ||
      data.progress === 100
    ) {
      stopSseConnection(jobId);
    }
  }, [stopSseConnection]);

  // jobId별 SSE 생성
  const startSseConnection = useCallback(
    (jobId: string) => {
      // 초기 상태 세팅
      resetSseState(jobId);

      // 이미 연결된 SSE가 있다면 먼저 종료
      if (eventSources[jobId]) stopSseConnection(jobId);

      const es = new EventSource(`http://localhost:8080/sse/${jobId}`);

      // EventSource 저장
      setEventSources((prev) => ({
        ...prev,
        [jobId]: es,
      }));

      // open
      es.onopen = () => {
        setSseStates((prev) => ({
          ...prev,
          [jobId]: {
            ...(prev[jobId] || defaultState),
            status: "connected",
          },
        }));
      };

      // 공용 업데이트 핸들러
      const handleEvent = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          updateState(jobId, data);
        } catch (e) {
          console.error(`[${jobId}] JSON parse error`, e);
        }
      };

      es.addEventListener("progress", handleEvent);
      es.addEventListener("message", handleEvent);
      es.onmessage = handleEvent;

      es.onerror = (err) => {
        console.warn(`[${jobId}] SSE connection error`, err);

        setSseStates((prev) => ({
          ...prev,
          [jobId]: {
            ...(prev[jobId] || defaultState),
            status: "error",
            message: "Connection failed.",
          },
        }));

        stopSseConnection(jobId);
      };
    },
    [eventSources, resetSseState, stopSseConnection, updateState]
  );

  const value: SseContextType = {
    sseStates,
    startSseConnection,
    stopSseConnection,
    resetSseState,
  };

  return (
    <SseContext.Provider value={value}>{children}</SseContext.Provider>
  );
};

// Hook
export const useSse = (): SseContextType => {
  const context = useContext(SseContext);
  if (!context) {
    throw new Error("useSse must be used within SseProvider");
  }
  return context;
};
