
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

export const authOptions: NextAuthOptions = {
  // No usar adapter con CredentialsProvider (incompatible)
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Credenciales requeridas');
        }

        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email,
            isActive: true
          },
          include: {
            sucursal: {
              select: {
                id: true,
                nombre: true,
                direccion: true,
                telefono: true,
                esBodega: true,
              }
            }
          }
        });

        if (!user?.password) {
          throw new Error('Usuario no encontrado');
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) {
          throw new Error('Contraseña incorrecta');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          sucursalId: user.sucursalId,
          sucursal: user.sucursal,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días en segundos
    updateAge: 24 * 60 * 60, // Se actualiza cada 24 horas
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
        path: '/',
        secure: process.env.NODE_ENV === 'development' ? false : true,
        maxAge: 30 * 24 * 60 * 60, // 30 días
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
        path: '/',
        secure: process.env.NODE_ENV === 'development' ? false : true,
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
        path: '/',
        secure: process.env.NODE_ENV === 'development' ? false : true,
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.sucursalId = (user as any).sucursalId;
        token.sucursal = (user as any).sucursal;
      } else if (token.id && !token.sucursal) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              sucursalId: true,
              sucursal: {
                select: {
                  id: true,
                  nombre: true,
                  direccion: true,
                  telefono: true,
                  esBodega: true
                }
              }
            }
          });
          if (dbUser) {
            token.sucursalId = dbUser.sucursalId;
            token.sucursal = dbUser.sucursal;
          }
        } catch {
          // Ignorar error si base de datos no está disponible
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id || token.sub;
        (session.user as any).role = token.role;
        (session.user as any).sucursalId = token.sucursalId;
        (session.user as any).sucursal = token.sucursal;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};
