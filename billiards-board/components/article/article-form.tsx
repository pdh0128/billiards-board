'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useGame } from '@/contexts/game-context';
import { getAuthToken } from '@/utils/client-auth';

interface ArticleFormProps {
  onSuccess?: () => void;
}

export function ArticleForm({ onSuccess }: ArticleFormProps) {
  const { myPlayer, isMyTurn, nextTurn, getPlayerStartPosition } = useGame();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    if (content.length > 500) {
      setError('Content too long (max 500 characters)');
      return;
    }

    if (!isMyTurn) {
      setError('내 차례가 아닙니다');
      return;
    }

    setIsSubmitting(true);

    try {
      const startPosition = myPlayer ? getPlayerStartPosition(myPlayer.id) : null;
      const token = getAuthToken();

      const response = await fetch('/api/article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          content: content.trim(),
          startPosition,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create article');
      }

      // 성공 - 새 글 즉시 반영 및 턴 넘기기
      if (data.data && typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('articles:refresh', {
            detail: { article: data.data },
          })
        );
      }
      setContent('');
      setOpen(false);
      nextTurn();
      onSuccess?.();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create article');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={`fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-lg z-50 ${
            isMyTurn
              ? 'bg-blue-500 hover:bg-blue-600 animate-pulse'
              : 'bg-gray-500 cursor-not-allowed'
          }`}
          size="icon"
          disabled={!isMyTurn}
        >
          <Plus className="h-8 w-8 text-white" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Ball</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full min-h-[150px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={500}
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
              <span>{content.length} / 500</span>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !content.trim()}>
              {isSubmitting ? 'Creating...' : 'Create Ball'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
