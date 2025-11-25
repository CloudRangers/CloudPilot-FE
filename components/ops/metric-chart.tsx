'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { opsApi, TimeSeriesPoint, MetricAggregation } from '@/lib/api/ops';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/hooks/use-auth';
import { hasPermission } from '@/lib/types/auth';

interface MetricChartProps {
	vmId: string;
	vmTeamId?: number;
	metricName?: string;
	title?: string;
	refreshInterval?: number;
}

export function MetricChart({
	vmId,
	vmTeamId,
	metricName = 'cloudpilot_vm_cpu_usage',
	title = 'CPU 사용률',
	refreshInterval = 30000,
}: MetricChartProps) {
	const { user } = useAuth();
	const [metricData, setMetricData] = useState<TimeSeriesPoint[]>([]);
	const [aggregation, setAggregation] = useState<MetricAggregation | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// 권한 체크
	if (vmTeamId !== undefined && !hasPermission.canAccessTeamVm(user, vmTeamId)) {
		return (
			<Card>
				<CardContent className="py-8">
					<div className="text-center text-muted-foreground">
						이 VM에 대한 접근 권한이 없습니다.
					</div>
				</CardContent>
			</Card>
		);
	}

	const fetchData = async () => {
		setLoading(true);
		setError(null);
		try {
			const chartResult = await opsApi.getMetricsForRecharts(vmId, metricName, 5, 15);
			if (chartResult.success) {
				setMetricData(chartResult.data.data);
			}

			const aggResult = await opsApi.getMetricAggregation(vmId, metricName, 5);
			if (aggResult.success) {
				setAggregation(aggResult.data);
			}
		} catch (err) {
			console.error('Error fetching metrics:', err);
			setError('메트릭 데이터를 가져오는데 실패했습니다.');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
		const interval = setInterval(fetchData, refreshInterval);
		return () => clearInterval(interval);
	}, [vmId, metricName, refreshInterval]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>VM ID: {vmId}</CardDescription>
			</CardHeader>
			<CardContent>
				{error && <div className="text-red-500 text-sm mb-4">{error}</div>}

				{aggregation && (
					<div className="grid grid-cols-4 gap-4 mb-6">
						<div className="bg-muted/50 rounded-lg p-4">
							<div className="text-xs text-muted-foreground mb-1">현재</div>
							<div className="text-2xl font-bold">{aggregation.current.toFixed(1)}%</div>
						</div>
						<div className="bg-muted/50 rounded-lg p-4">
							<div className="text-xs text-muted-foreground mb-1">평균</div>
							<div className="text-2xl font-bold">{aggregation.average.toFixed(1)}%</div>
						</div>
						<div className="bg-muted/50 rounded-lg p-4">
							<div className="text-xs text-muted-foreground mb-1">최대</div>
							<div className="text-2xl font-bold">{aggregation.max.toFixed(1)}%</div>
						</div>
						<div className="bg-muted/50 rounded-lg p-4">
							<div className="text-xs text-muted-foreground mb-1">최소</div>
							<div className="text-2xl font-bold">{aggregation.min.toFixed(1)}%</div>
						</div>
					</div>
				)}

				{loading && !metricData.length ? (
					<div className="flex items-center justify-center h-[300px]">
						<div className="text-muted-foreground">로딩 중...</div>
					</div>
				) : metricData.length === 0 ? (
					<div className="flex items-center justify-center h-[300px]">
						<div className="text-muted-foreground">데이터가 없습니다.</div>
					</div>
				) : (
					<ResponsiveContainer width="100%" height={300}>
						<LineChart data={metricData}>
							<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
							<XAxis
								dataKey="timestamp"
								className="text-xs"
								tick={{ fill: 'hsl(var(--muted-foreground))' }}
							/>
							<YAxis
								domain={[0, 100]}
								className="text-xs"
								tick={{ fill: 'hsl(var(--muted-foreground))' }}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: 'hsl(var(--background))',
									border: '1px solid hsl(var(--border))',
									borderRadius: '6px',
								}}
							/>
							<Legend />
							<Line
								type="monotone"
								dataKey="value"
								stroke="hsl(var(--primary))"
								strokeWidth={2}
								name="사용률 (%)"
								dot={false}
							/>
						</LineChart>
					</ResponsiveContainer>
				)}
			</CardContent>
		</Card>
	);
}