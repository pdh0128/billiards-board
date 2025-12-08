import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateNonCollidingPosition } from '@/utils/position';
import { broadcastArticleCreated } from '@/lib/socket-server';

// GET - 모든 글 조회 (페이지네이션)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20');

    const articles = await prisma.article.findMany({
      where: {
        isDeleted: false,
      },
      take: limit + 1,
      ...(cursor && {
        cursor: {
          id: cursor,
        },
        skip: 1,
      }),
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            uuid: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    const hasMore = articles.length > limit;
    const data = hasMore ? articles.slice(0, -1) : articles;
    const nextCursor = hasMore ? articles[limit - 1].id : null;

    return NextResponse.json({
      success: true,
      data: {
        articles: data,
        nextCursor,
        hasMore,
      },
    });
  } catch (error) {
    console.error('GET /api/article error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

// POST - 새 글 작성
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, startPosition } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Content too long (max 500 characters)' },
        { status: 400 }
      );
    }

    // 기존 공들의 위치 가져오기
    const existingArticles = await prisma.article.findMany({
      where: { isDeleted: false },
      select: {
        positionX: true,
        positionY: true,
        positionZ: true,
        radius: true,
      },
    });

    const existingPositions = existingArticles.map((a) => ({
      position: { x: a.positionX, y: a.positionY, z: a.positionZ },
      radius: a.radius,
    }));

    // 시작 위치 기반으로 공 생성
    let position;
    if (startPosition) {
      // 시작 위치 주변에 랜덤하게 배치 (±2 범위)
      const offsetX = (Math.random() - 0.5) * 4;
      const offsetZ = (Math.random() - 0.5) * 4;
      position = {
        x: startPosition.x + offsetX,
        y: startPosition.y,
        z: startPosition.z + offsetZ,
      };

      // 다른 공과 겹치지 않도록 조정
      let attempts = 0;
      while (attempts < 10) {
        const collision = existingPositions.some(({ position: pos, radius }) => {
          const distance = Math.sqrt(
            Math.pow(position.x - pos.x, 2) +
            Math.pow(position.y - pos.y, 2) +
            Math.pow(position.z - pos.z, 2)
          );
          return distance < (1.0 + radius);
        });

        if (!collision) break;

        const newOffsetX = (Math.random() - 0.5) * 4;
        const newOffsetZ = (Math.random() - 0.5) * 4;
        position = {
          x: startPosition.x + newOffsetX,
          y: startPosition.y,
          z: startPosition.z + newOffsetZ,
        };
        attempts++;
      }
    } else {
      // 시작 위치가 없으면 기존 로직 사용
      position = generateNonCollidingPosition(existingPositions, 1.0, 10);
    }

    // DB에 저장
    const article = await prisma.article.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
        positionX: position.x,
        positionY: position.y,
        positionZ: position.z,
        radius: 1.0,
      },
      include: {
        user: {
          select: {
            id: true,
            uuid: true,
          },
        },
      },
    });

    // WebSocket으로 브로드캐스트
    try {
      broadcastArticleCreated(article);
    } catch (error) {
      console.error('WebSocket broadcast error:', error);
      // WebSocket 에러는 무시하고 계속 진행
    }

    return NextResponse.json({
      success: true,
      data: article,
    });
  } catch (error) {
    console.error('POST /api/article error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create article' },
      { status: 500 }
    );
  }
}
