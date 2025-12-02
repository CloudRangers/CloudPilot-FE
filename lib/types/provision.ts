// lib/types/provision.ts

export type ProvisionEventType = "LOG" | "SUCCESS" | "ERROR";

export interface InstanceInfo {
  name?: string;
  externalId?: string;
  zoneId?: number;
  providerType?: string;
  cpuCores?: number;
  memoryGb?: number;
  diskGb?: number;
  ipAddress?: string;
  osType?: string;
  /**
   * "172.16.0.10,172.16.0.11" 형식의 콤마 구분 문자열
   */
  nicAddresses?: string;
}

export interface ProvisionResultMessage {
  jobId?: string;
  eventType?: ProvisionEventType;
  /**
   * RUNNING / SUCCEEDED / FAILED 등 자유 텍스트
   */
  status?: string;
  vmId?: string;
  message?: string;
  step?: string;
  timestamp?: string; // OffsetDateTime → ISO string

  /**
   * SUCCESS일 때 VM 여러 개 정보
   */
  instances?: InstanceInfo[];
}

/**
 * localStorage.newlyCreatedVM 에서 쓸 확장된 타입 (기존 + SSE 결과)
 * - 네 기존 구조랑 합치기 좋게 일부 필드를 널 허용으로 둠
 */
export interface NewlyCreatedVmInfo {
  name?: string;
  assignedTeam?: string;
  count?: number;
  cpu?: number;
  memory?: number;
  storage?: number;
  os?: string;

  // SSE / Job 정보
  jobId?: string;
  status?: string;
  instances?: InstanceInfo[];

  // assign-member 단계에서 붙이는 정보
  assignedEmployeesByVM?: Record<number, string>;
}
