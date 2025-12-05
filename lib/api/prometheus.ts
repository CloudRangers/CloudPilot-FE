// src/lib/api/prometheus.ts
import { apiClient } from "@/lib/api/base-client";
import type { ApiResponse } from "@/lib/api/ops";

/* ------------------------------------
 * 🔹 VM 메트릭 요약 타입
 *    BE 응답: { "<vmName or vmId>": VmMetricSummary }
 * ------------------------------------ */
export interface VmMetricSummary {
  hasMetrics: boolean; // BE: 메트릭 보유 여부
  cpuUsage?: number;   // 0~1 (비율) 또는 0~100 (퍼센트) - BE 구현에 맞춤
  memoryUsage?: number;
}

export type VmMetricMap = Record<string, VmMetricSummary>;

/* ------------------------------------
 * 🔹 Datastore usage 타입
 *    BE 응답: DatastoreUsageDto[]
 *    FE 내부: { "<dsName>": DatastoreUsage } 로 변환해서 사용
 * ------------------------------------ */
export interface DatastoreUsage {
  dsName: string;
  capacityBytes: number;
  freeBytes: number;
  usedBytes: number;
  usedPercent: number; // 0~100
}

export type DatastoreUsageMap = Record<string, DatastoreUsage>;

// BE 응답 DTO(실제로는 배열로 내려옴) – 모양은 DatastoreUsage 와 동일
type DatastoreUsageDto = DatastoreUsage;

export const prometheusApi = {
  /* ============================================================
   * 1) VM 메트릭 조회
   *    GET /monitor/vcenter/metrics
   *    (옵션) teamId 쿼리 파라미터
   * ============================================================ */
  getVmMetrics: async (teamId?: number) => {
    const res = await apiClient.get<ApiResponse<VmMetricMap>>(
      "/monitor/vcenter/metrics",
      teamId != null ? { params: { teamId } } : undefined
    );
    return res.data; // { success, data, message }
  },

  /* ============================================================
   * 2) Datastore usage 조회
   *    GET /monitoring/prometheus/datastores
   *    - BE 응답: ApiResponse<DatastoreUsageDto[]> (배열)
   *    - FE 리턴: ApiResponse<DatastoreUsageMap> (dsName 기준 Map)
   * ============================================================ */
  getDatastoreUsage: async (
    names: string[]
  ): Promise<ApiResponse<DatastoreUsageMap>> => {
    // ❗ 실제 BE 응답은 배열이다.
    const res = await apiClient.get<ApiResponse<DatastoreUsageDto[]>>(
      "/monitoring/prometheus/datastores",
      {
        params: {
          // names[]=HDD1 (1)&names[]=NVME (1) 이런 식으로 날아감
          names,
        },
      }
    );

    const body = res.data;

    // 실패 / 데이터 없음 → 빈 Map 반환
    if (!body.success || !body.data) {
      return {
        success: false,
        data: {} as DatastoreUsageMap,
        message: body.message ?? "Datastore 사용량 조회 실패",
      };
    }

    const list = body.data; // DatastoreUsageDto[]
    const map: DatastoreUsageMap = {};

    list.forEach((ds) => {
      if (ds && ds.dsName) {
        map[ds.dsName] = ds;
      }
    });

    // 디버깅용 로그 (원하면 지워도 됨)
    console.log("[prometheusApi.getDatastoreUsage] map =", map);

    return {
      success: true,
      data: map,
      message: body.message,
    };
  },
};
