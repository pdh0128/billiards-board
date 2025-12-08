import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePath, getDepthFromPath } from '@/utils/path';

// GET - 댓글 목록
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const articleId = searchParams.get('articleId');

    const comments = await prisma.comment.findMany({
      where: {
        isDeleted: false,
        ...(articleId ? { articleId } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: { comments },
    });
  } catch (error) {
    console.error('GET /api/comment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST - 새 댓글 생성 (게임 이벤트나 UI에서 사용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      content,
      articleId,
      parentPath,
      position,
      radius = 0.5,
      userId,
    } = body;

    if (!articleId || typeof articleId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'articleId is required' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    const trimmed = content.trim();
    if (trimmed.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Content too long (max 500 characters)' },
        { status: 400 }
      );
    }

    const parentDepth = parentPath ? parentPath.split('.').length - 1 : 0;
    const siblingCount = await prisma.comment.count({
      where: parentPath
        ? {
            articleId,
            path: {
              startsWith: `${parentPath}.`,
            },
            depth: parentDepth + 1,
          }
        : {
            articleId,
            depth: 0,
          },
    });

    const path = generatePath(parentPath ?? undefined, siblingCount);
    const depth = getDepthFromPath(path);

    const comment = await prisma.comment.create({
      data: {
        content: trimmed,
        articleId,
        userId: userId || 'system', // 게임 이벤트 시 시스템 사용자로 기록
        path,
        depth,
        positionX: position?.x ?? 0,
        positionY: position?.y ?? 0,
        positionZ: position?.z ?? 0,
        radius,
      },
    });

    return NextResponse.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error('POST /api/comment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
