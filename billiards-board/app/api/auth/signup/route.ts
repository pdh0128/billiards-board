import { randomBytes, pbkdf2Sync } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signJwt } from '@/lib/jwt';

const EXPIRES_IN = 24 * 60 * 60; // 24h

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
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

    if (String(username).length < 2 || String(username).length > 32) {
      return NextResponse.json(
        { success: false, error: 'Username must be 2-32 characters' },
        { status: 400 }
      );
    }

    if (String(password).length < 4 || String(password).length > 64) {
      return NextResponse.json(
        { success: false, error: 'Password must be 4-64 characters' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);
    const user = await prisma.user.create({
      data: { username, passwordHash },
      select: { id: true, username: true, uuid: true },
    });

    const token = signJwt({ sub: user.id, username: user.username }, EXPIRES_IN);

    return NextResponse.json(
      { success: true, data: { user, token, expiresIn: EXPIRES_IN } },
      {
        headers: {
          'Set-Cookie': `token=${token}; HttpOnly; Path=/; Max-Age=${EXPIRES_IN}`,
        },
      }
    );
  } catch (error) {
    console.error('POST /api/auth/signup error:', error);
    return NextResponse.json({ success: false, error: 'Failed to signup' }, { status: 500 });
  }
}
