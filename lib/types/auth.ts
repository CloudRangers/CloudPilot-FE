export enum RoleCode {
	ADMIN = 'ADMIN',
	HEAD = 'HEAD',
	LEADER = 'LEADER',
	MEMBER = 'MEMBER'
}

export interface UserRoleInfo {
	roleCode: RoleCode;
	roleName: string;
	permissionLevel: number;
	teamId: number | null;
	teamName: string;
}

export interface User {
	userId: number;
	username: string;
	email: string;
	empno: number;
	userRoles: UserRoleInfo[];
	maxPermissionLevel: number;
}

export interface AuthState {
	user: User | null;
	token: string | null;
	isAuthenticated: boolean;
}

export interface JWTPayload {
	sub: string;
	userId: number;
	username: string;
	email: string;
	empno: number;
	userRoles: UserRoleInfo[];
	maxPermissionLevel: number;
	iat: number;
	exp: number;
}

export const hasPermission = {
	isAdmin: (user: User | null) => {
		if (!user) return false;
		return user.userRoles.some(ur => ur.roleCode === RoleCode.ADMIN);
	},

	isDirector: (user: User | null) => {
		if (!user) return false;
		return user.userRoles.some(ur => ur.roleCode === RoleCode.HEAD);
	},

	canViewAllVms: (user: User | null) => {
		return hasPermission.isAdmin(user) || hasPermission.isDirector(user);
	},

	canManageAlertRules: (user: User | null) => {
		return hasPermission.isAdmin(user);
	},

	canViewAlertRules: (user: User | null) => {
		if (!user) return false;
		return user.userRoles.some(ur => 
			[RoleCode.ADMIN, RoleCode.HEAD, RoleCode.LEADER].includes(ur.roleCode)
		);
	},

	canAccessTeamVm: (user: User | null, vmTeamId: number) => {
		if (!user) return false;
		if (hasPermission.canViewAllVms(user)) return true;
		return user.userRoles.some(ur => ur.teamId === vmTeamId);
	},

	isTeamLeaderOrAbove: (user: User | null, teamId: number) => {
		if (!user) return false;
		return user.userRoles.some(ur => 
			ur.teamId === teamId && 
			[RoleCode.ADMIN, RoleCode.HEAD, RoleCode.LEADER].includes(ur.roleCode)
		);
	},

	getUserTeamIds: (user: User | null): number[] => {
		if (!user) return [];
		return [...new Set(user.userRoles.map(ur => ur.teamId).filter((id): id is number => id !== null))];
	},

	getLeaderTeamIds: (user: User | null): number[] => {
		if (!user) return [];
		return user.userRoles
			.filter(ur => ur.roleCode === RoleCode.LEADER && ur.teamId !== null)
			.map(ur => ur.teamId as number);
	},
};