export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth-jwt';

function summarizeVotes(grouped: Array<{ value: 'UP' | 'DOWN'; _count: { value: number } }>) {
  return grouped.reduce(
    (acc, item) => {
      if (item.value === 'UP') acc.up += item._count.value;
      if (item.value === 'DOWN') acc.down += item._count.value;
      return acc;
    },
    { up: 0, down: 0 }
  );
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Login required' }, { status: 401 });
    }

    const body = await request.json();
    const value = body?.value === 'DOWN' ? 'DOWN' : 'UP';

    const post = await prisma.post.findFirst({ where: { id, isDeleted: false } });
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    await prisma.vote.upsert({
      where: { postId_userId: { postId: id, userId: user.id } },
      update: { value },
      create: { value, postId: id, userId: user.id },
    });

    const votes = await prisma.vote.groupBy({
      by: ['value'],
      _count: { value: true },
      where: { postId: id },
    });

    return NextResponse.json({
      success: true,
      data: { votes: summarizeVotes(votes), value },
    });
  } catch (error) {
    console.error('POST /api/posts/[id]/vote error:', error);
    return NextResponse.json({ success: false, error: 'Failed to vote' }, { status: 500 });
  }
}
