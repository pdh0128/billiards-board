'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Mode = 'login' | 'signup';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password.trim()) {
      setError('아이디와 비밀번호를 입력하세요');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || '요청에 실패했습니다');
      if (typeof window !== 'undefined') {
        localStorage.setItem('jwt', json.data.token);
        if (json.data.user?.id) localStorage.setItem('userId', json.data.user.id);
      }
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '요청에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <Link href="/" className="text-emerald-400 underline text-sm">
          ← 홈으로
        </Link>
        <h1 className="text-3xl font-bold mt-4 mb-6">
          {mode === 'login' ? '로그인' : '회원가입'}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">아이디</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 p-3"
              maxLength={32}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 p-3"
              maxLength={64}
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 font-semibold disabled:opacity-50"
          >
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>
        <div className="mt-6 text-sm text-slate-400 flex justify-between">
          <span>{mode === 'login' ? '계정이 없나요?' : '이미 계정이 있나요?'}</span>
          <button
            type="button"
            className="text-emerald-400 underline"
            onClick={() => setMode((prev) => (prev === 'login' ? 'signup' : 'login'))}
          >
            {mode === 'login' ? '회원가입으로' : '로그인으로'}
          </button>
        </div>
      </div>
    </main>
  );
}
