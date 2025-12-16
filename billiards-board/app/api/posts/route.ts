export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth-jwt';

type VoteSummary = Record<string, { up: number; down: number }>;

async function getVoteSummary(postIds: string[]): Promise<VoteSummary> {
  if (postIds.length === 0) return {};
  const grouped = await prisma.vote.groupBy({
    by: ['postId', 'value'],
    _count: { value: true },
    where: { postId: { in: postIds } },
  });

  return grouped.reduce<VoteSummary>((acc, item) => {
    const { postId, value, _count } = item;
    if (!acc[postId]) {
      acc[postId] = { up: 0, down: 0 };
    }
    if (value === 'UP') acc[postId].up += _count.value;
    if (value === 'DOWN') acc[postId].down += _count.value;
    return acc;
  }, {});
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cursor = searchParams.get('cursor');
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);

  try {
    const posts = await prisma.post.findMany({
      where: { isDeleted: false },
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        user: { select: { id: true, username: true, uuid: true } },
        _count: { select: { comments: true } },
      },
    });

    const hasMore = posts.length > limit;
    const data = hasMore ? posts.slice(0, -1) : posts;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    const voteSummary = await getVoteSummary(data.map((p) => p.id));
    const enriched = data.map((post) => ({
      ...post,
      votes: voteSummary[post.id] ?? { up: 0, down: 0 },
    }));

    return NextResponse.json({
      success: true,
      data: {
        posts: enriched,
        nextCursor,
        hasMore,
      },
    });
  } catch (error) {
    console.error('GET /api/posts error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Debug: ensure prisma has post model
    if (!('post' in prisma)) {
      console.error('Prisma client missing post model. Available keys:', Object.keys(prisma));
    }
    const user = await getUserFromRequest(request);
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Login required' }, { status: 401 });
    }

    const body = await request.json();
    const title = (body?.title ?? '').trim();
    const content = (body?.content ?? '').trim();

    if (!title || title.length < 2) {
      return NextResponse.json({ success: false, error: '제목은 2글자 이상이어야 합니다' }, { status: 400 });
    }
    if (!content) {
      return NextResponse.json({ success: false, error: '내용을 입력해주세요' }, { status: 400 });
    }
    if (content.length > 5000) {
      return NextResponse.json(
        { success: false, error: '내용이 너무 깁니다 (최대 5000자)' },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        userId: user.id,
      },
      include: {
        user: { select: { id: true, username: true, uuid: true } },
        _count: { select: { comments: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: { ...post, votes: { up: 0, down: 0 } },
    });
  } catch (error) {
    console.error('POST /api/posts error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create post' }, { status: 500 });
  }
}
