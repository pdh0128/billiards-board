import { verifyJwt } from './jwt';
import { prisma } from './prisma';
import { NextRequest } from 'next/server';

export async function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('token')?.value;
  const rawToken =
    authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : cookieToken;

  if (!rawToken) return null;
  const payload = verifyJwt(rawToken);
  if (!payload?.sub) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, username: true, uuid: true },
  });
  return user;
}
