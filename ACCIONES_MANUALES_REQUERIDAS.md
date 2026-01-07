# ✅ ACCIONES MANUALES REQUERIDAS

## 🎯 RESUMEN RÁPIDO

**¿Qué ya está configurado?**
- ✅ Scopes de OAuth ya incluyen `gmail.send` y `calendar` (en `lib/auth-config.ts`)
- ✅ Código listo para enviar emails desde `ai.management@archipielagofilm.com`
- ✅ Código listo para crear Google Meet
- ✅ Dropdown de crew members funcionando

**¿Qué DEBES hacer manualmente?**

## 🔴 CRÍTICO - HACER AHORA

### 1. Habilitar APIs en Google Cloud Console (5 minutos)

1. Ve a: https://console.cloud.google.com
2. Selecciona tu proyecto (probablemente `archipielago-os` o similar)
3. Ve a: **APIs & Services** → **Library**
4. Busca y habilita estas APIs:
   - ✅ **Gmail API** → Click "Enable"
   - ✅ **Google Calendar API** → Click "Enable"

**¿Por qué?** Sin estas APIs habilitadas, los emails y Google Meet no funcionarán aunque el código esté listo.

---

### 2. Habilitar Google Meet en Calendar (2 minutos)

**Opción A: Desde Calendar Settings (Cuenta Personal o Workspace con permisos)**

1. Ve a: https://calendar.google.com
2. Click en el **⚙️ (icono de engranaje)** en la esquina superior derecha
3. Selecciona **"Settings"** (Configuración)
4. En el menú lateral izquierdo, busca y haz click en **"Event settings"** (Configuración de eventos)
   - Si no lo ves, busca en el menú: puede estar como "Eventos" o "Event settings"
5. Busca la sección **"Video conferencing"** o **"Conferencias de video"**
6. ✅ Marca el checkbox: **"Automatically add Google Meet video conferences to events I create"**
   - En español: "Agregar automáticamente videollamadas de Google Meet a los eventos que creo"
7. Si hay una opción de seleccionar el tipo, elige **"Google Meet"**
8. **IMPORTANTE:** Haz scroll hacia abajo y haz click en **"Save"** (Guardar) si aparece

**Si no encuentras "Event settings" en el menú lateral:**

**Opción B: Buscar directamente**
1. En la página de Settings, usa **Ctrl+F** (o Cmd+F en Mac)
2. Busca: "video conferencing" o "Meet" o "conferencia"
3. Deberías encontrar el checkbox directamente

**Opción C: Si es cuenta de Google Workspace (empresarial)**
Si `ai.management@archipielagofilm.com` es una cuenta de Google Workspace:
1. Puede que necesites permisos de administrador
2. O contacta al administrador de Google Workspace para habilitarlo
3. El admin debe ir a: https://admin.google.com → **Apps** → **Google Workspace** → **Calendar** → **Sharing settings** → Habilitar "Automatically add video conferences"

**Opción D: Verificar si ya está habilitado**
- Crea un evento de prueba manualmente en Calendar
- Si automáticamente aparece un link de Meet, ya está habilitado ✅
- Si no aparece, sigue las opciones A, B o C

**¿Por qué?** Sin esto, aunque el código intente crear Meet, Google no generará el link.

---

### 3. Iniciar sesión con la cuenta correcta (1 minuto)

**IMPORTANTE:** La primera vez que uses la app después del deploy:

1. Ve a: https://archipielago-production.vercel.app
2. Haz clic en "Iniciar sesión con Google"
3. **Selecciona o ingresa:** `ai.management@archipielagofilm.com`
4. Autoriza todos los permisos (Gmail, Calendar, Drive, Sheets)

**¿Por qué?** El sistema necesita tokens de acceso de esa cuenta específica para enviar emails y crear Meet desde esa cuenta.

---

## 🟡 RECOMENDADO - Hacer después

### 4. Verificar Redirect URI en Google Cloud (2 minutos)

1. Ve a: https://console.cloud.google.com
2. **APIs & Services** → **Credentials**
3. Click en tu OAuth 2.0 Client ID
4. En **"Authorized redirect URIs"**, verifica que esté:
   ```
   https://archipielago-production.vercel.app/api/auth/callback/google
   ```
5. Si no está, agrégalo y guarda

**¿Por qué?** Asegura que el login funcione correctamente en producción.

---

### 5. Agregar variable de entorno en Vercel (opcional, 1 minuto)

Si quieres asegurar que el calendario siempre use `ai.management@archipielagofilm.com`:

1. Ve a: https://vercel.com → Tu proyecto → **Settings** → **Environment Variables**
2. Agrega:
   ```
   GOOGLE_CALENDAR_ID=ai.management@archipielagofilm.com
   ```
3. Aplica a: Production, Preview, Development
4. Guarda

**Nota:** Ya está configurado por defecto en el código, pero esto lo hace explícito.

---

## ✅ VERIFICACIÓN - Probar que funciona

### Probar emails:
1. Ve a la app: https://archipielago-production.vercel.app
2. Abre cualquier tarea existente
3. Click en **"Compartir"**
4. Selecciona destinatarios (usa el dropdown de crew members)
5. Click **"Enviar"**
6. Verifica que el email llegue **desde** `ai.management@archipielagofilm.com`

### Probar Google Meet:
1. Crea una nueva tarea
2. Asigna fecha y hora
3. Marca el checkbox **"Video Call (Meet)"**
4. Guarda la tarea
5. Ve a Google Calendar: https://calendar.google.com
6. Busca el evento recién creado
7. Verifica que tenga un **link de Google Meet**

---

## ⚠️ SI ALGO NO FUNCIONA

### Error: "Access denied" al enviar email
**Solución:**
- Verifica que Gmail API esté habilitada (Paso 1)
- Re-autentícate con `ai.management@archipielagofilm.com` (Paso 3)
- Verifica que autorizaste el scope `gmail.send`

### Error: No se crea link de Meet
**Solución:**
- Verifica que Calendar API esté habilitada (Paso 1)
- Verifica que Google Meet esté habilitado en Calendar Settings (Paso 2)
- Re-autentícate con `ai.management@archipielagofilm.com` (Paso 3)

### Emails se envían desde otra cuenta
**Solución:**
- El código ya está configurado para usar `ai.management@archipielagofilm.com`
- Asegúrate de haber iniciado sesión con esa cuenta (Paso 3)
- Si persiste, verifica que los tokens de acceso sean de esa cuenta

---

## 📋 CHECKLIST RÁPIDO

- [ ] **Paso 1:** Habilitar Gmail API y Calendar API en Google Cloud
- [ ] **Paso 2:** Habilitar Google Meet en Calendar Settings
- [ ] **Paso 3:** Iniciar sesión con `ai.management@archipielagofilm.com`
- [ ] **Paso 4:** (Opcional) Verificar Redirect URI
- [ ] **Paso 5:** (Opcional) Agregar `GOOGLE_CALENDAR_ID` en Vercel
- [ ] **Probar:** Enviar email de compartir
- [ ] **Probar:** Crear tarea con Google Meet

---

## 🎉 LISTO

Una vez completados los pasos críticos (1, 2, 3), todo debería funcionar automáticamente. El código ya está desplegado y listo.

