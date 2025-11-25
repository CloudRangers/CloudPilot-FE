import { JWTPayload, User } from '@/lib/types/auth';

export function parseJWT(token: string): JWTPayload | null {
	try {
		const base64Url = token.split('.')[1];
		const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
		const jsonPayload = decodeURIComponent(
			atob(base64)
				.split('')
				.map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
				.join('')
		);
		return JSON.parse(jsonPayload);
	} catch (error) {
		console.error('JWT 파싱 실패:', error);
		return null;
	}
}

export function isTokenExpired(token: string): boolean {
	const payload = parseJWT(token);
	if (!payload) return true;
	
	const now = Math.floor(Date.now() / 1000);
	return payload.exp < now;
}

export function getUserFromToken(token: string): User | null {
	const payload = parseJWT(token);
	if (!payload) return null;

	return {
		userId: payload.userId,
		username: payload.username,
		email: payload.email,
		empno: payload.empno,
		userRoles: payload.userRoles,
		maxPermissionLevel: payload.maxPermissionLevel,
	};
}