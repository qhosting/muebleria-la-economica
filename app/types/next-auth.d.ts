import { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface User extends DefaultUser {
    role?: string;
    sucursalId?: string | null;
    sucursal?: {
      id: string;
      nombre: string;
      direccion?: string | null;
      telefono?: string | null;
      esBodega?: boolean;
    } | null;
  }

  interface Session {
    user: {
      id?: string;
      role?: string;
      sucursalId?: string | null;
      sucursal?: {
        id: string;
        nombre: string;
        direccion?: string | null;
        telefono?: string | null;
        esBodega?: boolean;
      } | null;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    sucursalId?: string | null;
    sucursal?: {
      id: string;
      nombre: string;
      direccion?: string | null;
      telefono?: string | null;
      esBodega?: boolean;
    } | null;
  }
}
