import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type UpdatePayload = {
  id: string;
  type: 'article' | 'comment';
  position: { x: number; y: number; z: number };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updates: UpdatePayload[] = body?.updates;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'updates array required' },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      updates.map((u) => {
        if (u.type === 'article') {
          return prisma.article.update({
            where: { id: u.id },
            data: {
              positionX: u.position.x,
              positionY: u.position.y,
              positionZ: u.position.z,
            },
          });
        }
        return prisma.comment.update({
          where: { id: u.id },
          data: {
            positionX: u.position.x,
            positionY: u.position.y,
            positionZ: u.position.z,
          },
        });
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/ball/position error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to persist positions' },
      { status: 500 }
    );
  }
}
