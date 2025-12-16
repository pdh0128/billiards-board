'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuthToken } from '@/utils/client-auth';

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 입력해주세요');
      return;
    }

    try {
      setLoading(true);
      const token = getAuthToken();
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || '작성에 실패했습니다');
      router.push(`/posts/${json.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '작성에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/" className="text-emerald-400 underline">
          ← 목록으로
        </Link>
        <h1 className="text-3xl font-bold mt-6 mb-6">새 글 작성</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">제목</label>
            <input
              className="w-full rounded-lg bg-slate-900 border border-slate-800 p-3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="제목을 입력하세요"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">내용</label>
            <textarea
              className="w-full rounded-lg bg-slate-900 border border-slate-800 p-3 min-h-[240px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 font-semibold disabled:opacity-50"
          >
            {loading ? '작성 중...' : '등록'}
          </button>
        </form>
      </div>
    </main>
  );
}
