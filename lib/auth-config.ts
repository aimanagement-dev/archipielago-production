import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getRequiredEnv, getOptionalEnv } from "./env";

/**
 * Configuración compartida de NextAuth
 * Exportada para ser reutilizada en rutas API
 */
export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            authorization: {
                params: {
                    prompt: "select_account consent",
                    access_type: "offline",
                    response_type: "code",
                    scope: "openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/calendar",
                },
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            console.log('[Auth] signIn callback - user:', user?.email);
            console.log('[Auth] signIn callback - account type:', account?.provider);

            // Lista de usuarios autorizados
            const authorizedUsers = [
                'ai.management@archipielagofilm.com',
                'ai.lantica@lanticastudio.com',
            ];

            if (user?.email && authorizedUsers.includes(user.email)) {
                console.log('[Auth] User authorized:', user.email);
                return true;
            }

            console.log('[Auth] User NOT authorized:', user?.email);
            // Bloquear usuarios no autorizados
            return false;
        },
        async jwt({ token, account, user }) {
            // Guardar access token cuando se obtiene
            if (account) {
                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token;
            }
            // Guardar información del usuario
            if (user) {
                token.email = user.email;
                token.name = user.name;
            }
            return token;
        },
        async session({ session, token }) {
            // Agregar access token a la sesión
            if (session.user) {
                session.accessToken = token.accessToken as string;
                session.user.email = token.email as string;
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            // Después del login exitoso, redirigir al dashboard
            if (url === baseUrl || url.startsWith(baseUrl + '/')) {
                return baseUrl;
            }
            return baseUrl;
        },
    },
    pages: {
        signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET || '',
    debug: process.env.NODE_ENV === 'development',
};

