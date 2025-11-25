'use client';

import { useEffect, useState } from 'react';
import { opsApi, AlertRule } from '@/lib/api/ops';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/lib/hooks/use-auth';
import { hasPermission } from '@/lib/types/auth';

export function AlertRuleList() {
	const { user } = useAuth();
	const [rules, setRules] = useState<AlertRule[]>([]);
	const [loading, setLoading] = useState(false);

	// 권한 체크
	if (!hasPermission.canViewAlertRules(user)) {
		return (
			<Card>
				<CardContent className="py-8">
					<div className="text-center text-muted-foreground">
						알림 규칙을 조회할 권한이 없습니다.
					</div>
				</CardContent>
			</Card>
		);
	}

	const canManage = hasPermission.canManageAlertRules(user);

	const fetchRules = async () => {
		setLoading(true);
		try {
			const result = await opsApi.getAlertRules();
			if (result.success) {
				setRules(result.data);
			}
		} catch (error) {
			console.error('Error fetching alert rules:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleToggle = async (id: number, enabled: boolean) => {
		if (!canManage) return;
		
		try {
			await opsApi.toggleAlertRule(id, enabled);
			fetchRules();
		} catch (error) {
			console.error('Error toggling alert rule:', error);
		}
	};

	useEffect(() => {
		fetchRules();
	}, []);

	const getSeverityVariant = (severity: string): "default" | "destructive" | "secondary" | "outline" => {
		switch (severity) {
			case 'critical':
				return 'destructive';
			case 'warning':
				return 'default';
			case 'info':
				return 'secondary';
			default:
				return 'outline';
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>알림 규칙</CardTitle>
				<CardDescription>VM 메트릭 알림 규칙 관리</CardDescription>
			</CardHeader>
			<CardContent>
				{loading ? (
					<div className="text-center py-8 text-muted-foreground">로딩 중...</div>
				) : rules.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						등록된 알림 규칙이 없습니다.
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>이름</TableHead>
								<TableHead>VM ID</TableHead>
								<TableHead>메트릭</TableHead>
								<TableHead>조건</TableHead>
								<TableHead>심각도</TableHead>
								{canManage && <TableHead>상태</TableHead>}
							</TableRow>
						</TableHeader>
						<TableBody>
							{rules.map((rule) => (
								<TableRow key={rule.id}>
									<TableCell className="font-medium">{rule.name}</TableCell>
									<TableCell>{rule.vmId}</TableCell>
									<TableCell className="text-xs">{rule.metricName}</TableCell>
									<TableCell>
										{rule.operator} {rule.threshold}
									</TableCell>
									<TableCell>
										<Badge variant={getSeverityVariant(rule.severity)}>
											{rule.severity}
										</Badge>
									</TableCell>
									{canManage && (
										<TableCell>
											<Switch
												checked={rule.enabled}
												onCheckedChange={(checked) => handleToggle(rule.id, checked)}
											/>
										</TableCell>
									)}
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</Card>
	);
}