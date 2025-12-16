import { createHmac, timingSafeEqual } from 'crypto';

const BASE64URL_REGEX = /[\-_]/g;

function base64UrlEncode(input: Buffer) {
  return input
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(BASE64URL_REGEX, (c) => (c === '-' ? '+' : '/'));
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, 'base64');
}

interface JwtPayload {
  sub: string;
  exp: number;
  [key: string]: unknown;
}

const ALGO = 'HS256';

export function signJwt(payload: Record<string, unknown>, expiresInSeconds: number) {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');

  const header = { alg: ALGO, typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = { ...payload, exp: now + expiresInSeconds };

  const headerPart = base64UrlEncode(Buffer.from(JSON.stringify(header)));
  const payloadPart = base64UrlEncode(Buffer.from(JSON.stringify(fullPayload)));
  const data = `${headerPart}.${payloadPart}`;

  const signature = createHmac('sha256', secret).update(data).digest();
  const signaturePart = base64UrlEncode(signature);

  return `${data}.${signaturePart}`;
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) throw new Error('JWT_SECRET not configured');
    const [headerPart, payloadPart, signaturePart] = token.split('.');
    if (!headerPart || !payloadPart || !signaturePart) return null;
    const data = `${headerPart}.${payloadPart}`;
    const expected = createHmac('sha256', secret).update(data).digest();
    const received = base64UrlDecode(signaturePart);
    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(payloadPart).toString()) as JwtPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) return null;
    return payload;
  } catch (err) {
    console.error('verifyJwt failed', err);
    return null;
  }
}
