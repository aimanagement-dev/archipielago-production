import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getRequiredEnv, validateEnv } from "@/lib/env";

/**
 * Configuración compartida de NextAuth
 * Exportada para ser reutilizada en rutas API
 */

// Validar variables de entorno al cargar el módulo
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;

if (!clientId || clientId.trim() === '') {
    console.error('❌ ERROR: GOOGLE_CLIENT_ID no está configurado o está vacío');
}

if (!clientSecret || clientSecret.trim() === '') {
    console.error('❌ ERROR: GOOGLE_CLIENT_SECRET no está configurado o está vacío');
}

if (!nextAuthSecret || nextAuthSecret.trim() === '') {
    console.error('❌ ERROR: NEXTAUTH_SECRET no está configurado o está vacío');
}

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
<<<<<<< HEAD
            clientId: clientId || '',
            clientSecret: clientSecret || '',
=======
            clientId: getRequiredEnv("GOOGLE_CLIENT_ID"),
            clientSecret: getRequiredEnv("GOOGLE_CLIENT_SECRET"),
>>>>>>> a375377ec7273516cd8886076dfda48a390c5ac9
            authorization: {
                params: {
                    prompt: "select_account consent",
                    access_type: "offline",
                    response_type: "code",
                    scope: "openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/contacts.readonly",
                },
            },
        }),
    ],
    callbacks: {
<<<<<<< HEAD
        async signIn({ user, account, profile }) {
            // Logging para diagnóstico
            console.log('[NextAuth] signIn callback ejecutado');
            console.log('[NextAuth] User email:', user?.email);
            console.log('[NextAuth] User name:', user?.name);

            // Si no hay email, bloquear
            if (!user?.email) {
                console.error('[NextAuth] ❌ Usuario sin email, bloqueando login');
                return false;
            }

            // Verificar si se permite cualquier email (para desarrollo/testing)
            const allowAnyEmail = process.env.NEXTAUTH_ALLOW_ANY_EMAIL === 'true';
            if (allowAnyEmail) {
                console.log('[NextAuth] ✅ NEXTAUTH_ALLOW_ANY_EMAIL=true, permitiendo cualquier email');
                return true;
            }

            // Lista de usuarios autorizados
            const authorizedUsers = [
                'ai.management@archipielagofilm.com',
                'ai.lantica@lanticastudio.com',
            ];

            // Verificar si el email está autorizado
            const isAuthorized = authorizedUsers.includes(user.email);

            if (isAuthorized) {
                console.log('[NextAuth] ✅ Usuario autorizado:', user.email);
                return true;
            }

            // Usuario no autorizado
            console.error('[NextAuth] ❌ Usuario NO autorizado:', user.email);
            console.error('[NextAuth] Usuarios autorizados:', authorizedUsers.join(', '));
            return false;
=======
        async signIn({ user }) {
            // Limitar quién puede iniciar sesión
            const allowedEmails = (process.env.ALLOWED_LOGIN_EMAILS ||
                'ai.management@archipielagofilm.com,ia.lantica@lanticastudios.com')
                .split(',')
                .map((email) => email.trim().toLowerCase())
                .filter(Boolean);

            const email = user?.email?.toLowerCase();
            const isAllowed = email ? allowedEmails.includes(email) : false;

            if (!isAllowed) {
                console.warn('Intento de login bloqueado para', user?.email);
                return false;
            }

            return true;
>>>>>>> a375377ec7273516cd8886076dfda48a390c5ac9
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
        error: '/login', // Redirigir errores de autenticación al login
    },
<<<<<<< HEAD
    secret: nextAuthSecret || '',
=======
    secret: getRequiredEnv("NEXTAUTH_SECRET"),
>>>>>>> a375377ec7273516cd8886076dfda48a390c5ac9
    debug: process.env.NODE_ENV === 'development',
    // Mejorar el manejo de errores
    events: {
        async signIn(message) {
            console.log('[NextAuth] Event: signIn', message);
        },
        async signOut(message) {
            console.log('[NextAuth] Event: signOut', message);
        },
        async createUser(message) {
            console.log('[NextAuth] Event: createUser', message);
        },
        async updateUser(message) {
            console.log('[NextAuth] Event: updateUser', message);
        },
        async linkAccount(message) {
            console.log('[NextAuth] Event: linkAccount', message);
        },
        async session(message) {
            console.log('[NextAuth] Event: session', message);
        },
    },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function refreshAccessToken(token: any) {
    try {
        // Asegura que la app no corra con configuración incompleta
        validateEnv();

        const url = "https://oauth2.googleapis.com/token";
        const response = await fetch(url, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            method: "POST",
            body: new URLSearchParams({
                client_id: getRequiredEnv("GOOGLE_CLIENT_ID"),
                client_secret: getRequiredEnv("GOOGLE_CLIENT_SECRET"),
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

