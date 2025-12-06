# 🔑 Credenciales Requeridas - Archipiélago Production OS

Resumen de todas las credenciales/variables que necesita el proyecto. **No incluye valores sensibles.** Usa estos nombres exactos en `.env.local` y en Vercel → Settings → Environment Variables.

## 1) Google OAuth (Login)
- `GOOGLE_CLIENT_ID` — ID de cliente OAuth 2.0 (sensible)
- `GOOGLE_CLIENT_SECRET` — Secreto de cliente OAuth 2.0 (sensible)
- `NEXTAUTH_URL` — URL pública de la app (ej. `https://tu-proyecto.vercel.app`)
- Redirect URIs obligatorias en Google Cloud:
  - `http://localhost:3000/api/auth/callback/google`
  - `https://TU_DOMINIO/api/auth/callback/google`

## 2) NextAuth
- `NEXTAUTH_SECRET` — Secreto de sesiones (sensible)

## 3) Gemini AI
- `GEMINI_API_KEY` — API Key de Google Gemini (sensible)

## 4) Google Sheets (API Tasks)
- Requiere el `access_token` de Google obtenido al iniciar sesión (no se guarda aquí; NextAuth lo maneja).

## 5) Google Calendar Sync (opcional)
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` — Email de la service account (sensible)
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` — Private key de la service account, con saltos de línea escapados (`\n`) (sensible)
- `GOOGLE_CALENDAR_ID` — ID del calendario de destino
- `GOOGLE_CALENDAR_TIMEZONE` — Zona horaria (ej. `America/New_York`) — opcional
- `NEXT_PUBLIC_GOOGLE_CALENDAR_ENABLED` — `true` para mostrar botón de sync en UI

## Dónde configurarlas
- **Local**: archivo `.env.local` (ya en `.gitignore`).
- **Producción/Preview**: Vercel → Project → Settings → Environment Variables → agregar cada clave en Production, Preview y Development.

## Notas de seguridad
- No subir valores a Git ni a este repo.
- Rotar claves si fueron expuestas.
- Guardar claves sensibles en un secret manager si está disponible.***
