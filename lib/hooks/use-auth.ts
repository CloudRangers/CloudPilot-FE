'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState } from '@/lib/types/auth';
import { getUserFromToken, isTokenExpired } from '@/lib/utils/jwt';

interface AuthStore extends AuthState {
	setAuth: (token: string) => void;
	logout: () => void;
	checkAuth: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
	persist(
		(set, get) => ({
			user: null,
			token: null,
			isAuthenticated: false,

			setAuth: (token: string) => {
				const user = getUserFromToken(token);
				if (user) {
					set({ user, token, isAuthenticated: true });
				}
			},

			logout: () => {
				set({ user: null, token: null, isAuthenticated: false });
			},

			checkAuth: () => {
				const { token } = get();
				if (!token) return false;
				
				if (isTokenExpired(token)) {
					get().logout();
					return false;
				}
				
				return true;
			},
		}),
		{
			name: 'auth-storage',
		}
	)
);

export function useAuth() {
	const { user, token, isAuthenticated, setAuth, logout, checkAuth } = useAuthStore();

	return {
		user,
		token,
		isAuthenticated,
		setAuth,
		logout,
		checkAuth,
	};
}