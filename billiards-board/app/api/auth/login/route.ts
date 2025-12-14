import { NextRequest, NextResponse } from 'next/server';
import { pbkdf2Sync } from 'crypto';
import { prisma } from '@/lib/prisma';
import { signJwt } from '@/lib/jwt';

const EXPIRES_IN = 24 * 60 * 60; // 24h

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const computed = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return computed === hash;
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, uuid: true, passwordHash: true },
    });

    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = signJwt({ sub: user.id, username: user.username }, EXPIRES_IN);
    const { passwordHash, ...safeUser } = user;

    return NextResponse.json(
      { success: true, data: { user: safeUser, token, expiresIn: EXPIRES_IN } },
      {
        headers: {
          'Set-Cookie': `token=${token}; HttpOnly; Path=/; Max-Age=${EXPIRES_IN}`,
        },
      }
    );
  } catch (error) {
    console.error('POST /api/auth/login error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to login' },
      { status: 500 }
    );
  }
}
