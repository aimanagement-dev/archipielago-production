# 🚀 Guía Rápida: Solucionar Login de Google

## ⚡ Pasos Inmediatos

### 1. Verificar en Google Cloud Console

**URL:** https://console.cloud.google.com/

#### A. Verificar el Proyecto
- Asegúrate de estar en el proyecto correcto (Project Number: `3160191465556`)
- Verifica que estés logueado con: `ai.management@archipielagofilm.com`

#### B. Verificar OAuth Client ID
1. Ve a: **APIs & Services** > **Credentials**
2. Busca el Client ID que empieza con: `3160191465556-qcdd1ea8o6u8uboj756rad0r4turjech`
3. Haz clic en él para editarlo
4. **CRÍTICO:** Verifica que en **"Authorized redirect URIs"** esté EXACTAMENTE:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
   - Debe ser `http://` (NO `https://`)
   - Debe terminar en `/api/auth/callback/google`
   - No debe tener espacios ni caracteres extra
   - Si no está, **AÑÁDELO** y guarda

#### C. Verificar OAuth Consent Screen
1. Ve a: **APIs & Services** > **OAuth consent screen**
2. Verifica:
   - **User support email:** `ai.management@archipielagofilm.com`
   - **Developer contact information:** `ai.management@archipielagofilm.com`
3. Si el **User Type** es **External**:
   - Ve a la sección **"Test users"**
   - Haz clic en **"+ ADD USERS"**
   - Añade: `ai.management@archipielagofilm.com`
   - **GUARDA** los cambios

#### D. Verificar APIs Habilitadas
1. Ve a: **APIs & Services** > **Library**
2. Busca y habilita (si no están):
   - ✅ **Google Drive API**
   - ✅ **Google Sheets API**

### 2. Si el Client ID No Funciona

Si después de verificar todo sigue sin funcionar:

1. Ve a: **APIs & Services** > **Credentials**
2. Haz clic en **"+ CREATE CREDENTIALS"** > **OAuth client ID**
3. Configura:
   - **Application type:** Web application
   - **Name:** `Archipiélago Web Local`
   - **Authorized redirect URIs:** 
     ```
     http://localhost:3000/api/auth/callback/google
     ```
4. Haz clic en **CREATE**
5. Copia el nuevo **Client ID** y **Client Secret**
6. Actualiza `.env.local`:
   ```env
   GOOGLE_CLIENT_ID=nuevo_client_id_aqui
   GOOGLE_CLIENT_SECRET=nuevo_client_secret_aqui
   ```
7. Reinicia el servidor:
   ```bash
   # Detén el servidor (Ctrl+C) y reinícialo
   npm run dev
   ```

### 3. Verificar Variables de Entorno

Ejecuta el diagnóstico:
```bash
node scripts/diagnose-oauth.js
```

### 4. Errores Comunes

#### Error: "invalid_client" (401)
- ✅ Client ID incorrecto o no existe
- ✅ URL de redirección no coincide exactamente
- ✅ Proyecto incorrecto seleccionado en Google Cloud Console

#### Error: "Access blocked"
- ✅ Email no está en "Test users" (si app es External)
- ✅ OAuth consent screen no está configurado
- ✅ Estás usando una cuenta diferente a `ai.management@archipielagofilm.com`

#### Error: "redirect_uri_mismatch"
- ✅ La URL en Google Cloud Console no coincide exactamente con la del código
- ✅ Verifica que sea `http://localhost:3000/api/auth/callback/google` (sin espacios, sin trailing slash)

### 5. Probar el Login

1. Abre: http://localhost:3000/login
2. Haz clic en "Continue with Google"
3. Deberías ver la pantalla de consentimiento de Google
4. Asegúrate de estar logueado con `ai.management@archipielagofilm.com`
5. Acepta los permisos
6. Deberías ser redirigido de vuelta a la app

---

**¿Sigue sin funcionar?** Revisa los logs del servidor en la terminal donde ejecutaste `npm run dev` para ver errores específicos.

