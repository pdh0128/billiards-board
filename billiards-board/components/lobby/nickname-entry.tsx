'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

interface NicknameEntryProps {
  onEnter: (nickname: string) => void;
}

export function NicknameEntry({ onEnter }: NicknameEntryProps) {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
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

    onEnter(nickname.trim());
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
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-300 mb-2">
              닉네임
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
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 text-lg font-semibold"
            disabled={!nickname.trim()}
          >
            <Play className="h-6 w-6 mr-2" />
            게임 참여
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-700">
          <p className="text-gray-500 text-sm text-center">
            💡 여러 명이 참여하면 순서대로 턴이 돌아갑니다
          </p>
        </div>
      </div>
    </div>
  );
}
