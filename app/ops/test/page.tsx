'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function TestAuthPage() {
	const { user, setAuth, logout, checkAuth } = useAuth();
	const [tokenInput, setTokenInput] = useState('');

	const handleSetToken = () => {
		if (tokenInput.trim()) {
			setAuth(tokenInput.trim());
		}
	};

	return (
		<div className="container mx-auto p-6 space-y-6">
			<h1 className="text-2xl font-bold">JWT 인증 테스트</h1>
			
			<div className="space-y-4">
				<div>
					<p className="text-sm text-muted-foreground mb-2">현재 로그인 정보:</p>
					{user ? (
						<pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs">
							{JSON.stringify(user, null, 2)}
						</pre>
					) : (
						<p className="text-muted-foreground">로그인되지 않음</p>
					)}
				</div>

				<div className="space-y-2">
					<label className="text-sm font-medium">JWT 토큰 입력:</label>
					<div className="flex gap-2">
						<Input
							type="text"
							value={tokenInput}
							onChange={(e) => setTokenInput(e.target.value)}
							placeholder="백엔드에서 받은 JWT 토큰을 붙여넣으세요"
							className="flex-1 font-mono text-xs"
						/>
						<Button onClick={handleSetToken}>로그인</Button>
					</div>
				</div>

				<div className="space-x-2">
					<Button onClick={() => checkAuth()} variant="outline">
						인증 확인
					</Button>
					<Button onClick={logout} variant="destructive">
						로그아웃
					</Button>
				</div>

				<div className="space-y-2 pt-4 border-t">
					<Link href="/ops" className="text-blue-500 underline block">
						→ Ops 대시보드로 이동
					</Link>
					<p className="text-xs text-muted-foreground">
						💡 백엔드 로그인 명령어:
					</p>
					<pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`curl -X POST http://localhost:8080/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"empno":12345,"password":"yourpassword"}'`}
					</pre>
				</div>
			</div>
		</div>
	);
}