export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth-jwt';
import { buildCommentTree } from '@/utils/path';

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

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const post = await prisma.post.findFirst({
      where: { id, isDeleted: false },
      include: {
        user: { select: { id: true, username: true, uuid: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    const comments = await prisma.comment.findMany({
      where: { postId: id },
      orderBy: { path: 'asc' },
    });

    const votes = await prisma.vote.groupBy({
      by: ['value'],
      _count: { value: true },
      where: { postId: id },
    });

    return NextResponse.json({
      success: true,
      data: {
        post: { ...post, votes: summarizeVotes(votes) },
        comments,
        commentTree: buildCommentTree(comments.filter((c) => !c.isDeleted)),
      },
    });
  } catch (error) {
    console.error('GET /api/posts/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch post' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Login required' }, { status: 401 });
    }

    const body = await request.json();
    const title = (body?.title ?? '').trim();
    const content = (body?.content ?? '').trim();

    const existing = await prisma.post.findFirst({ where: { id } });
    if (!existing || existing.isDeleted) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }
    if (existing.userId !== user.id) {
      return NextResponse.json({ success: false, error: '권한이 없습니다' }, { status: 403 });
    }

    const updated = await prisma.post.update({
      where: { id },
      data: {
        title: title || existing.title,
        content: content || existing.content,
      },
      include: { user: { select: { id: true, username: true, uuid: true } } },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('PATCH /api/posts/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Login required' }, { status: 401 });
    }

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }
    if (existing.userId !== user.id) {
      return NextResponse.json({ success: false, error: '권한이 없습니다' }, { status: 403 });
    }

    await prisma.post.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/posts/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete post' }, { status: 500 });
  }
}
