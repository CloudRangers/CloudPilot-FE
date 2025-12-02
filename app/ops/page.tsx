// src/app/ops/page.tsx

import { MetricChart } from '@/components/ops/metric-chart';
import { AlertRuleList } from '@/components/ops/alert-rule-list';

export default function OpsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ops 대시보드</h1>
        <p className="text-muted-foreground">
          VM 메트릭 모니터링 및 알림 관리
        </p>
      </div>

      <div className="grid gap-6">
        {/* TODO: vmId는 실제 vm_instance.id로 교체 */}
        <MetricChart vmId="1" title="CPU 사용률" metricName="cloudpilot_vm_cpu_usage" />

        {/* AlertRuleList는 BE stub으로만 일단 비워두고, 나중에 구현 */}
        <AlertRuleList />
      </div>
    </div>
  );
}
