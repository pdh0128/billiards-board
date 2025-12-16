import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth-jwt';

async function pruneDeletedComments(postId: string) {
  // 반복적으로 고아 댓글을 물리 삭제
  while (true) {
    const candidates = await prisma.comment.findMany({
      where: { postId, isDeleted: true },
      select: { id: true, path: true },
    });

    if (candidates.length === 0) break;

    const deletableIds: string[] = [];

    for (const candidate of candidates) {
      const activeDescendant = await prisma.comment.findFirst({
        where: {
          postId,
          isDeleted: false,
          path: { startsWith: `${candidate.path}.` },
        },
        select: { id: true },
      });

      if (!activeDescendant) {
        deletableIds.push(candidate.id);
      }
    }

    if (deletableIds.length === 0) break;

    await prisma.comment.deleteMany({
      where: { id: { in: deletableIds } },
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id?: string }> }
) {
  try {
    const { id: commentId } = await params;
    if (!commentId) {
      return NextResponse.json({ success: false, error: 'Comment id is required' }, { status: 400 });
    }

    const user = await getUserFromRequest(request);
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Login required' }, { status: 401 });
    }

    const comment = await prisma.comment.findFirst({ where: { id: commentId } });
    if (!comment) {
      return NextResponse.json({ success: false, error: 'Comment not found' }, { status: 404 });
    }

    if (comment.userId !== user.id) {
      return NextResponse.json({ success: false, error: '권한이 없습니다' }, { status: 403 });
    }

    const pathPrefix = `${comment.path}.`;

    await prisma.$transaction([
      prisma.comment.updateMany({
        where: { id: commentId },
        data: { isDeleted: true, deletedAt: new Date() },
      }),
      prisma.comment.updateMany({
        where: {
          postId: comment.postId,
          path: { startsWith: pathPrefix },
        },
        data: { isDeleted: true, deletedAt: new Date() },
      }),
    ]);

    await pruneDeletedComments(comment.postId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/comments/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete comment' }, { status: 500 });
  }
}
