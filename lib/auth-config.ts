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
            // Lista de usuarios autorizados
            const authorizedUsers = [
                'ai.management@archipielagofilm.com',
                'ai.lantica@lanticastudio.com',
            ];

            if (user?.email && authorizedUsers.includes(user.email)) {
                return true;
            }

            // Bloquear usuarios no autorizados
            return false;
        },
        async jwt({ token, account, user }) {
            // Initial sign in
            if (account && user) {
                return {
                    accessToken: account.access_token,
                    accessTokenExpires: Date.now() + (account.expires_in as number) * 1000,
                    refreshToken: account.refresh_token,
                    user,
                    email: user.email,
                    name: user.name,
                };
            }

            // Return previous token if the access token has not expired yet
            // Give a 10 second buffer
            if (Date.now() < (token.accessTokenExpires as number) - 10000) {
                return token;
            }

            // Access token has expired, try to update it
            return refreshAccessToken(token);
        },
        async session({ session, token }) {
            // Agregar access token a la sesión
            if (session.user) {
                session.accessToken = token.accessToken as string;
                session.user.email = token.email as string;
                session.error = token.error as string; // Pass error to client if any
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

async function refreshAccessToken(token: any) {
    try {
        const url = "https://oauth2.googleapis.com/token";
        const response = await fetch(url, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            method: "POST",
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                grant_type: "refresh_token",
                refresh_token: token.refreshToken,
            }),
        });

        const refreshedTokens = await response.json();

        if (!response.ok) {
            throw refreshedTokens;
        }

        return {
            ...token,
            accessToken: refreshedTokens.access_token,
            accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
            // Fall back to old refresh token if new one is not returned
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
        };
    } catch (error) {
        console.log("Error refreshing access token", error);

        return {
            ...token,
            error: "RefreshAccessTokenError",
        };
    }
}

