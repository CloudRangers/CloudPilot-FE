'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { RoleCode } from '@/lib/types/auth';

interface RoleGuardProps {
	children: ReactNode;
	allowedRoles: RoleCode[];
	fallback?: ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
	const { user } = useAuth();

	if (!user) {
		return fallback || (
			<div className="text-center py-8 text-muted-foreground">
				로그인이 필요합니다.
			</div>
		);
	}

	const hasRole = user.userRoles.some(ur => allowedRoles.includes(ur.roleCode));

	if (!hasRole) {
		return fallback || (
			<div className="text-center py-8 text-muted-foreground">
				권한이 없습니다.
			</div>
		);
	}
    	return <>{children}</>;
}
