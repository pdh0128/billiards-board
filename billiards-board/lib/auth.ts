import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from './prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'Anonymous',
      credentials: {},
      async authorize() {
        // 익명 사용자 생성
        const user = await prisma.user.create({
          data: {},
        });

        return {
          id: user.id,
          uuid: user.uuid,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        const withUuid = user as { uuid?: string };
        if (withUuid.uuid) {
          token.uuid = withUuid.uuid;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.userId as string,
          uuid: token.uuid as string,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
});

// 현재 사용자 가져오기 (서버 컴포넌트용)
export async function getCurrentUser(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    return user;
  } catch {
    return null;
  }
}
