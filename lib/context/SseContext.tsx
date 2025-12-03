"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';

interface SseState {
  progress: number;
  stage: string;
  message: string;
  status: 'idle' | 'connecting' | 'connected' | 'error' | 'completed';
  errorDetails: any | null;
}

interface SseContextType extends SseState {
  startSseConnection: (jobId: string) => void;
  stopSseConnection: () => void;
  resetSseState: () => void; // ⭐ 1. Context 인터페이스: resetSseState 추가
}

const SseContext = createContext<SseContextType | undefined>(undefined);

export const SseProvider = ({ children }: { children: ReactNode }) => {
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [sseState, setSseState] = useState<SseState>({
    progress: 0,
    stage: '',
    message: 'Initializing...',
    status: 'idle',
    errorDetails: null,
  });

  // ⭐ 4. 상태 초기화: resetSseState 함수 정의
  const resetSseState = useCallback(() => {
    setSseState({
      progress: 0,
      stage: '',
      message: 'Initializing...',
      status: 'idle',
      errorDetails: null,
    });
  }, []);

  const stopSseConnection = useCallback(() => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
  }, [eventSource]);

  // ⭐ 2. Cleanup 로직: useEffect 추가
  useEffect(() => {
    return () => {
      stopSseConnection();
    };
  }, [stopSseConnection]);

  const startSseConnection = useCallback((jobId: string) => {
    if (eventSource) {
      stopSseConnection();
    }
    
    // ⭐ 4. 상태 초기화: resetSseState 호출 후, 상태 설정
    resetSseState();

    const newEventSource = new EventSource(`http://localhost:8080/sse/package-install/${jobId}`);
    setEventSource(newEventSource);

    newEventSource.onopen = () => {
      setSseState((prevState) => ({ ...prevState, status: 'connected' }));
    };
    
    const updateState = (data: any) => {
      // ⭐ 5. Progress 업데이트: 단일 setSseState 호출 내에서 모든 상태 변화 처리
      setSseState((prevState) => {
        const newState = {
          ...prevState,
          progress: data.progress !== undefined ? data.progress : prevState.progress,
          stage: data.stage !== undefined ? data.stage : prevState.stage,
          message: data.message !== undefined ? data.message : prevState.message,
          errorDetails: { ...prevState.errorDetails, ...data }, // Merge all data into details
        };

        // ⭐ 6. Error/Completion: 단일 setSseState 내부에서 최종 상태 설정
        if (data.stage === 'ERROR' || data.status === 'error') {
          newState.status = 'error';
        } else if (data.progress === 100) {
          newState.status = 'completed';
        }
        return newState;
      });

      // ⭐ 6. Error/Completion: 최종 상태 설정 후 stopSseConnection 호출
      if ((data.stage === 'ERROR' || data.status === 'error') || data.progress === 100) {
        stopSseConnection();
      }
    };

    newEventSource.addEventListener("progress", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        updateState(data);
      } catch (e) {
        console.error("JSON parse error (progress event)", e);
      }
    });

    newEventSource.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        updateState(data);
      } catch (e) {
        console.error("JSON parse error (message event)", e);
      }
    };

    newEventSource.onerror = () => {
      setSseState((prevState) => ({ ...prevState, status: 'error', message: 'Connection to server failed.' }));
      stopSseConnection();
    };
  }, [stopSseConnection, resetSseState]); // ⭐ 3. Callback 의존성: eventSource 제거

  const contextValue: SseContextType = {
    ...sseState,
    startSseConnection,
    stopSseConnection,
    resetSseState, // ⭐ resetSseState 추가
  };

  return <SseContext.Provider value={contextValue}>{children}</SseContext.Provider>;
};

export const useSse = (): SseContextType => {
  const context = useContext(SseContext);
  if (context === undefined) {
    throw new Error('useSse must be used within an SseProvider');
  }
  return context;
};
