'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { getUserIdFromToken } from '@/utils/client-auth';

interface NicknameEntryProps {
  onEnter: (nickname: string, userId?: string) => void;
}

export function NicknameEntry({ onEnter }: NicknameEntryProps) {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요');
      return;
    }

    if (nickname.trim().length < 2) {
      setError('닉네임은 2글자 이상이어야 합니다');
      return;
    }

    if (nickname.trim().length > 20) {
      setError('닉네임은 20글자 이하여야 합니다');
      return;
    }

    if (password.length < 4) {
      setError('비밀번호는 4글자 이상이어야 합니다');
      return;
    }

    setLoading(true);
    try {
      const payload = { username: nickname.trim(), password };
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || '인증에 실패했습니다');
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('jwt', data.data.token);
        if (data.data.user?.id) {
          localStorage.setItem('userId', data.data.user.id);
        }
      }

      const effectiveUserId = data.data.user?.id || getUserIdFromToken() || undefined;

      onEnter(nickname.trim(), effectiveUserId);
    } catch (err: any) {
      setError(err.message || '인증에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            🎱 Billiards Board
          </h1>
          <p className="text-gray-400">
            닉네임을 입력하고 게임에 참여하세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-300 mb-2">
                닉네임 (아이디)
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임 입력..."
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                maxLength={20}
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                비밀번호 (최소 4자)
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력..."
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                maxLength={50}
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 text-lg font-semibold"
            disabled={!nickname.trim() || !password || loading}
          >
            <Play className="h-6 w-6 mr-2" />
            {loading ? '진행 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>💡 여러 명이 참여하면 순서대로 턴이 돌아갑니다</span>
            <button
              type="button"
              className="text-blue-400 hover:text-blue-300 font-semibold"
              onClick={() => setMode((prev) => (prev === 'login' ? 'signup' : 'login'))}
            >
              {mode === 'login' ? '회원가입으로 전환' : '로그인으로 전환'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
