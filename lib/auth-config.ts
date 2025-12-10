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
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                    scope: "openid email profile https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/calendar",
                },
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            console.log('[Auth] signIn callback - user:', user?.email);
            console.log('[Auth] signIn callback - account type:', account?.provider);

            // TEMPORALMENTE: Permitir cualquier usuario de Google para debug
            if (user?.email) {
                console.log('[Auth] User allowed (debug mode):', user.email);
                return true;
            }

            console.log('[Auth] No email found');
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
    debug: true, // Temporarily enabled for debugging
};

