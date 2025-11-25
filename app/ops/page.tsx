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
				<MetricChart vmId="vm-001" />
				<AlertRuleList />
			</div>
		</div>
	);
}