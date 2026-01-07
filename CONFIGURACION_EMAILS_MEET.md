# 📧 CONFIGURACIÓN DE EMAILS Y GOOGLE MEET

## 🎯 OBJETIVO

Configurar el sistema para que:
1. **Emails se envíen desde:** `ai.management@archipielagofilm.com`
2. **Google Meet se cree con:** credenciales de `ai.management@archipielagofilm.com`

## ⚙️ CONFIGURACIÓN REQUERIDA

### 1. **Google Cloud Console - OAuth 2.0**

#### Paso 1: Verificar/Configurar OAuth Client
1. Ve a: https://console.cloud.google.com
2. Selecciona el proyecto correcto
3. Ve a: **APIs & Services** → **Credentials**
4. Encuentra tu **OAuth 2.0 Client ID** (o créalo si no existe)

#### Paso 2: Configurar Scopes
Asegúrate de que los siguientes scopes estén habilitados:
- ✅ `https://www.googleapis.com/auth/gmail.send` - Para enviar emails
- ✅ `https://www.googleapis.com/auth/calendar` - Para crear eventos y Meet
- ✅ `https://www.googleapis.com/auth/calendar.events` - Para eventos de calendario

#### Paso 3: Configurar Redirect URIs
En "Authorized redirect URIs", agrega:
```
https://archipielago-production.vercel.app/api/auth/callback/google
http://localhost:3000/api/auth/callback/google (para desarrollo)
```

### 2. **Autenticación con ai.management@archipielagofilm.com**

#### Opción A: Usar cuenta de servicio (RECOMENDADO para producción)
1. Ve a: **APIs & Services** → **Credentials**
2. Click en **Create Credentials** → **Service Account**
3. Nombre: `archipielago-production`
4. Role: **Editor** o **Owner**
5. Click **Create Key** → **JSON**
6. Descarga el archivo JSON

**Configurar en Vercel:**
```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=archipielago-production@tu-proyecto.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

#### Opción B: Usar OAuth con cuenta personal (ACTUAL)
**IMPORTANTE:** Para que funcione con `ai.management@archipielagofilm.com`:

1. **Iniciar sesión con la cuenta correcta:**
   - La primera vez que alguien inicie sesión, debe usar `ai.management@archipielagofilm.com`
   - O asegurarse de que el OAuth Client esté configurado para esa cuenta

2. **Compartir acceso al calendario:**
   - Ve a Google Calendar
   - Settings → **Share with specific people**
   - Agrega `ai.management@archipielagofilm.com` con permisos de **Make changes to events**

3. **Habilitar Google Meet en el calendario:**
   - Ve a Google Calendar → Settings
   - Busca "Event settings"
   - Asegúrate de que "Automatically add video conferencing" esté habilitado
   - Selecciona "Google Meet" como opción predeterminada

### 3. **Variables de Entorno en Vercel**

Asegúrate de tener estas variables configuradas:

```bash
# OAuth (ya configuradas)
GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret
NEXTAUTH_SECRET=tu_nextauth_secret
NEXTAUTH_URL=https://archipielago-production.vercel.app

# Calendar (opcional, pero recomendado)
GOOGLE_CALENDAR_ID=ai.management@archipielagofilm.com
GOOGLE_CALENDAR_TIMEZONE=America/Santo_Domingo

# Service Account (si usas Opción A)
GOOGLE_SERVICE_ACCOUNT_EMAIL=archipielago-production@tu-proyecto.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 4. **Permisos de Gmail API**

Para enviar emails desde `ai.management@archipielagofilm.com`:

1. Ve a: **APIs & Services** → **Library**
2. Busca "Gmail API"
3. Click **Enable**
4. Asegúrate de que el OAuth Client tenga el scope `gmail.send`

### 5. **Permisos de Calendar API**

Para crear Google Meet:

1. Ve a: **APIs & Services** → **Library**
2. Busca "Google Calendar API"
3. Click **Enable**
4. Asegúrate de que el OAuth Client tenga los scopes de calendar

## 🔍 VERIFICACIÓN

### Verificar que los emails funcionan:
1. Crear una tarea con responsables
2. Hacer clic en "Compartir"
3. Seleccionar destinatarios
4. Enviar
5. Verificar que el email llegue **desde** `ai.management@archipielagofilm.com`

### Verificar que Google Meet funciona:
1. Crear una tarea con fecha y hora
2. Marcar "Video Call (Meet)"
3. Guardar la tarea
4. Verificar en Google Calendar que el evento tenga un link de Meet
5. El link debe estar asociado al calendario `ai.management@archipielagofilm.com`

## ⚠️ PROBLEMAS COMUNES

### Error: "Access denied" al enviar email
**Causa:** El scope `gmail.send` no está habilitado o la cuenta no tiene permisos
**Solución:**
1. Verificar scopes en Google Cloud Console
2. Re-autenticarse con la cuenta correcta
3. Asegurarse de que `ai.management@archipielagofilm.com` tenga permisos de Gmail

### Error: "Meet link not created"
**Causa:** Google Meet no está habilitado en el calendario o falta el scope
**Solución:**
1. Habilitar Google Meet en Calendar Settings
2. Verificar que el scope `calendar` esté habilitado
3. Asegurarse de que el calendario `ai.management@archipielagofilm.com` tenga Meet habilitado

### Emails se envían desde otra cuenta
**Causa:** El usuario que inició sesión no es `ai.management@archipielagofilm.com`
**Solución:**
- El sistema ahora usa `useSystemEmail=true` para compartir tareas
- Esto fuerza el uso de `ai.management@archipielagofilm.com`
- Sin embargo, necesita que esa cuenta tenga permisos OAuth configurados

## 📝 NOTAS IMPORTANTES

1. **Para producción:** Se recomienda usar Service Account en lugar de OAuth personal
2. **El calendario por defecto** ya está configurado como `ai.management@archipielagofilm.com`
3. **Los emails de compartir** ahora usan `useSystemEmail=true` automáticamente
4. **Google Meet** se crea automáticamente cuando `hasMeet=true` en la tarea

## 🚀 PRÓXIMOS PASOS

1. ✅ Configurar OAuth Client con scopes correctos
2. ✅ Habilitar Gmail API y Calendar API
3. ✅ Iniciar sesión con `ai.management@archipielagofilm.com` la primera vez
4. ✅ Compartir acceso al calendario con esa cuenta
5. ✅ Habilitar Google Meet en Calendar Settings
6. ✅ Probar envío de emails y creación de Meet
