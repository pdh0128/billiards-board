'use client';

import { useSession, signIn } from 'next-auth/react';
import { useEffect } from 'react';

export function AutoSignIn() {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log('Auth status:', status, 'Session:', session);
    if (status === 'unauthenticated') {
      // 자동으로 익명 로그인
      console.log('Auto-signing in...');
      signIn('credentials', { redirect: false });
    }
  }, [status, session]);

  // 로딩 중이거나 인증되지 않은 경우 표시
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return null;
}
