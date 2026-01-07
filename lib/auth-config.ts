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
            clientId: getRequiredEnv("GOOGLE_CLIENT_ID"),
            clientSecret: getRequiredEnv("GOOGLE_CLIENT_SECRET"),
            authorization: {
                params: {
                    prompt: "select_account consent",
                    access_type: "offline",
                    response_type: "code",
                    scope: "openid email profile https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/contacts.readonly https://www.googleapis.com/auth/gmail.send",
                },
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            // 1. Super Admin Bypass (Hardcoded + Env)
            const allowedEmails = (process.env.ALLOWED_LOGIN_EMAILS ||
                'ai.management@archipielagofilm.com,ai.lantica@lanticastudios.com,federico.beron@lanticastudios.com')
                .split(',')
                .map((e) => e.trim().toLowerCase())
                .filter(Boolean);

            const email = user?.email?.toLowerCase();
            if (!email) return false;

            if (allowedEmails.includes(email)) {
                return true; // Always allow Admins
            }

            // 2. Dynamic Check via Google Sheets
            // Requires Access Token to read the DB
            if (account?.access_token) {
                try {
                    // Lazy import to avoid circular dep issues in some contexts? 
                    // No, standard import should be fine if built correctly.
                    // But we need to use the Service we defined.
                    const { GoogleSheetsService } = await import("@/lib/google-sheets");
                    const service = new GoogleSheetsService(account.access_token);

                    // Attempt to find the DB. 
                    // NOTE: The user MUST have the 'Archipielago_DB' shared with them to find it.
                    const dbId = await service.findDatabase();

                    if (dbId) {
                        const team = await service.getTeam(dbId);
                        const member = team.find((m: any) => m.email?.toLowerCase() === email);

                        if (member && member.accessGranted) {
                            console.log(`[Auth] Access Granted dynamically for: ${email}`);
                            return true;
                        } else {
                            console.warn(`[Auth] User found but Access DENIED: ${email}`);
                        }
                    } else {
                        console.warn(`[Auth] DB not found for user (Not shared?): ${email}`);
                    }
                } catch (error) {
                    console.error("[Auth] Error checking dynamic access:", error);
                }
            }

            console.warn('Intento de login bloqueado para', user?.email);
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
                session.refreshToken = token.refreshToken as string;
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
    secret: getRequiredEnv("NEXTAUTH_SECRET"),
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

        // Validar que tenemos refresh token
        if (!token.refreshToken) {
            console.error("[refreshAccessToken] No refresh token available");
            return {
                ...token,
                error: "RefreshAccessTokenError",
            };
        }

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
            // Si el refresh token expiró o es inválido
            const errorCode = refreshedTokens.error;
            if (errorCode === 'invalid_grant' || errorCode === 'invalid_request') {
                console.error("[refreshAccessToken] Refresh token expired or invalid. User needs to re-authenticate.");
                return {
                    ...token,
                    error: "RefreshAccessTokenError",
                    errorDetails: "Tu sesión ha expirado. Por favor, cierra sesión y vuelve a iniciar sesión.",
                };
            }
            throw refreshedTokens;
        }

        return {
            ...token,
            accessToken: refreshedTokens.access_token,
            accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
            // Fall back to old refresh token if new one is not returned
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
            error: undefined, // Clear any previous errors
        };
    } catch (error) {
        console.error("[refreshAccessToken] Error refreshing access token:", error);
        const errorDetails = error instanceof Error ? error.message : "Error desconocido al renovar sesión";

        return {
            ...token,
            error: "RefreshAccessTokenError",
            errorDetails: errorDetails,
        };
    }
}
