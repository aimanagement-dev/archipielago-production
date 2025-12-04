# 🚀 Guía de Configuración: Archipiélago x Google Workspace

Para conectar tu aplicación con Google Drive y Sheets, necesitamos configurar unas credenciales en Google Cloud. Es un proceso de única vez.

## Paso 1: Crear Proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un **Nuevo Proyecto** y llámalo `archipielago-os`.

## Paso 2: Habilitar APIs

En el menú lateral, ve a **APIs & Services** > **Library** y busca y habilita las siguientes APIs:
1. **Google Drive API**
2. **Google Sheets API**

## Paso 3: Configurar Pantalla de Consentimiento (OAuth Consent Screen)

1. Ve a **APIs & Services** > **OAuth consent screen**.
2. Selecciona **External** (o Internal si tienes Google Workspace empresarial).
3. Rellena los datos básicos:
   - **App name**: "Archipiélago OS"
   - **User support email**: `ai.management@archipielagofilm.com`
   - **Developer contact information**: `ai.management@archipielagofilm.com`
4. En **Scopes**, añade:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `.../auth/drive.file` (Para crear y editar archivos creados por la app)
   - `.../auth/spreadsheets` (Para usar Sheets como base de datos)
5. Añade `ai.management@archipielagofilm.com` como **Test User** (si seleccionaste External).

## Paso 4: Crear Credenciales

1. Ve a **APIs & Services** > **Credentials**.
2. Click en **Create Credentials** > **OAuth client ID**.
3. Application type: **Web application**.
4. Name: `Archipiélago Web`.
5. **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google`
6. Click **Create**.
7. Copia el **Client ID** y **Client Secret**.

## Paso 5: Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto y añade:

```env
GOOGLE_CLIENT_ID=tu_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=una_clave_secreta_random_haz_algo_largo
```

(Para generar un secret puedes usar en terminal: `openssl rand -base64 32`)

## ¡Listo! 🎉

Ahora, al iniciar sesión en la app, verás la opción de entrar con Google. La primera vez que entres, la app buscará (o creará) automáticamente una hoja de cálculo llamada `Archipielago_DB` en tu Drive.
