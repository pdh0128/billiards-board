import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      uuid: string;
    };
  }

  interface User {
    id: string;
    uuid: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    uuid?: string;
  }
}
