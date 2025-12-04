# 🔧 Solución al Error "invalid_client" (401)

El error **"Access blocked: Authorization Error - Error 401: invalid_client"** significa que Google no reconoce tu Client ID. Sigue estos pasos:

## ✅ Paso 1: Verificar el Client ID en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona el proyecto correcto (probablemente `archipielago-os` o similar)
3. Ve a **APIs & Services** > **Credentials**
4. Busca tu OAuth 2.0 Client ID con el nombre `Archipiélago Web` o similar
5. **VERIFICA** que el Client ID mostrado sea exactamente:
   ```
   3160191465556-qcdd1ea8o6u8uboj756rad0r4turjech.apps.googleusercontent.com
   ```

## ✅ Paso 2: Verificar la URL de Redirección

En la misma página del Client ID, verifica que en **"Authorized redirect URIs"** esté exactamente:

```
http://localhost:3000/api/auth/callback/google
```

**IMPORTANTE:**
- Debe ser `http://` (no `https://`) para desarrollo local
- Debe terminar en `/api/auth/callback/google` (no `/callback` ni otra ruta)
- No debe tener espacios ni caracteres extra

## ✅ Paso 3: Verificar la Pantalla de Consentimiento OAuth

1. Ve a **APIs & Services** > **OAuth consent screen**
2. Verifica que esté configurada:
   - **User Type**: External o Internal (según tu caso)
   - **App name**: "Archipiélago OS" o similar
   - **User support email**: Tu email
   - **Scopes**: Deben incluir:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `.../auth/drive.file`
     - `.../auth/spreadsheets`

## ✅ Paso 4: Si es App Externa, Añadir Test Users

Si tu app es **External** (no Internal de Google Workspace):

1. En **OAuth consent screen**, ve a la sección **"Test users"**
2. Haz clic en **"+ ADD USERS"**
3. Añade tu email: `ai.management@archipielagofilm.com`
4. Guarda los cambios

**NOTA**: Si no añades tu email como Test User, no podrás iniciar sesión aunque tengas todo configurado.

## ✅ Paso 5: Verificar que el Proyecto esté Activo

1. En Google Cloud Console, verifica que el proyecto esté seleccionado
2. Asegúrate de que no esté en modo "suspended" o deshabilitado
3. Verifica que tengas permisos de editor o owner en el proyecto

## ✅ Paso 6: Verificar APIs Habilitadas

Asegúrate de que estas APIs estén habilitadas:

1. **Google Drive API**
2. **Google Sheets API**
3. **Google+ API** (a veces necesaria para OAuth)

Ve a **APIs & Services** > **Library** y busca cada una para verificar.

## ✅ Paso 7: Si el Client ID es Incorrecto

Si el Client ID en `.env.local` no coincide con el de Google Cloud Console:

1. Copia el Client ID correcto de Google Cloud Console
2. Copia el Client Secret correspondiente
3. Actualiza `.env.local`:
   ```env
   GOOGLE_CLIENT_ID=el_client_id_correcto_aqui
   GOOGLE_CLIENT_SECRET=el_client_secret_correcto_aqui
   ```
4. Reinicia el servidor de desarrollo:
   ```bash
   # Detén el servidor (Ctrl+C) y reinícialo
   npm run dev
   ```

## ✅ Paso 8: Crear Nuevo Client ID (Si es Necesario)

Si el Client ID actual no funciona, crea uno nuevo:

1. Ve a **APIs & Services** > **Credentials**
2. Haz clic en **"+ CREATE CREDENTIALS"** > **OAuth client ID**
3. Application type: **Web application**
4. Name: `Archipiélago Web Local`
5. **Authorized redirect URIs**: 
   ```
   http://localhost:3000/api/auth/callback/google
   ```
6. Haz clic en **CREATE**
7. Copia el nuevo Client ID y Client Secret
8. Actualiza `.env.local` con los nuevos valores
9. Reinicia el servidor

## 🔍 Verificación Final

Ejecuta el script de diagnóstico:

```bash
node scripts/check-oauth-config.js
```

Luego intenta iniciar sesión nuevamente.

## 📞 Si Aún No Funciona

1. Verifica los logs del servidor de desarrollo para ver errores específicos
2. Revisa la consola del navegador (F12) para ver errores de JavaScript
3. Asegúrate de que estés usando el mismo email que añadiste como Test User
4. Verifica que no haya espacios extra en las variables de entorno

---

**Error común**: Si cambiaste el Client ID en `.env.local`, asegúrate de reiniciar el servidor de desarrollo para que cargue los nuevos valores.



