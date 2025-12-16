import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generatePath, getDepthFromPath } from '@/utils/path';
import { getUserFromRequest } from '@/lib/auth-jwt';

// GET /api/comments?postId=...&cursor=...&limit=...
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const postId = searchParams.get('postId');
  const cursor = searchParams.get('cursor');
  const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 100);

  if (!postId) {
    return NextResponse.json({ success: false, error: 'postId is required' }, { status: 400 });
  }

  try {
    const comments = await prisma.comment.findMany({
      where: {
        postId,
        isDeleted: false,
        ...(cursor ? { path: { gt: cursor } } : {}),
      },
      orderBy: { path: 'asc' },
      take: limit + 1,
    });

    const hasMore = comments.length > limit;
    const data = hasMore ? comments.slice(0, -1) : comments;
    const nextCursor = hasMore ? data[data.length - 1].path : null;

    return NextResponse.json({
      success: true,
      data: { comments: data, nextCursor, hasMore },
    });
  } catch (error) {
    console.error('GET /api/comments error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST /api/comments
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Login required' }, { status: 401 });
    }

    const body = await request.json();
    const { postId, parentPath } = body;
    const content = (body?.content ?? '').trim();

    if (!postId || typeof postId !== 'string') {
      return NextResponse.json({ success: false, error: 'postId is required' }, { status: 400 });
    }
    if (!content) {
      return NextResponse.json({ success: false, error: '내용을 입력해주세요' }, { status: 400 });
    }
    if (content.length > 2000) {
      return NextResponse.json(
        { success: false, error: '내용이 너무 깁니다 (최대 2000자)' },
        { status: 400 }
      );
    }

    const post = await prisma.post.findUnique({ where: { id: postId, isDeleted: false } });
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    // 현재 sibling count 계산 (삭제된 댓글 포함하여 path 충돌 방지)
    const siblingCount = await prisma.comment.count({
      where: parentPath
        ? {
            postId,
            path: { startsWith: `${parentPath}.` },
            depth: parentPath.split('.').length,
          }
        : {
            postId,
            depth: 0,
          },
    });

    const path = generatePath(parentPath ?? undefined, siblingCount);
    const depth = getDepthFromPath(path);

    const comment = await prisma.comment.create({
      data: {
        content,
        path,
        depth,
        postId,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true, data: comment });
  } catch (error) {
    console.error('POST /api/comments error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create comment' }, { status: 500 });
  }
}
