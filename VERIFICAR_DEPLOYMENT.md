# ✅ VERIFICACIÓN Y ACTUALIZACIÓN DEL DEPLOYMENT

**Proyecto:** Archipiélago Production OS
**URL Vercel:** https://vercel.com/aimanagements-projects/archipielago-production
**Cuenta:** ai.management@archipielagofilm.com

---

## 🎯 ESTADO ACTUAL

Ya tienes el proyecto deployado en Vercel. Ahora necesitamos:

1. ✅ Verificar que las últimas actualizaciones estén deployadas
2. ✅ Configurar variables de entorno
3. ✅ Actualizar Google OAuth
4. ✅ Probar que todo funcione

---

## 📋 PASO 1: VERIFICAR DEPLOYMENT AUTOMÁTICO

### Opción A: Desde Vercel Dashboard (MÁS FÁCIL)

1. **Ir a tu proyecto:**
   ```
   https://vercel.com/aimanagements-projects/archipielago-production
   ```

2. **Verificar branch deployada:**
   - Ve a "Deployments"
   - Busca el último deployment
   - Verifica que sea del branch `elated-herschel` o `main`
   - Verifica que el commit sea: `19014ec` (chore: Preparar proyecto para producción)

3. **Si NO es el último commit:**
   - Click en "Redeploy" en el deployment más reciente
   - O espera unos minutos (Vercel auto-deploys en cada push)

### Opción B: Desde CLI

```bash
# Verificar deployments
vercel list

# Ver último deployment
vercel ls archipielago-production
```

---

## 📋 PASO 2: CONFIGURAR VARIABLES DE ENTORNO

### Variables CRÍTICAS que deben estar configuradas:

Ve a: **Settings → Environment Variables**

#### Variables Obligatorias:

| Variable | Valor | Entornos |
|----------|-------|----------|
| `GOOGLE_CLIENT_ID` | `tu_google_client_id.apps.googleusercontent.com` | Production, Preview, Development |
| `GOOGLE_CLIENT_SECRET` | `tu_google_client_secret_aqui` | Production, Preview, Development |
| `NEXTAUTH_SECRET` | `tu_nextauth_secret_aqui` | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://[tu-url].vercel.app` | Production |

**⚠️ IMPORTANTE:**
- Si `NEXTAUTH_URL` NO está configurada → agrégala con la URL de producción
- Después de agregar/modificar variables → **REDEPLOY**

**🔒 Seguridad (CRÍTICO):** No pegues secretos reales en este archivo. Si algún secreto real llegó a GitHub, **róta** credenciales (Google OAuth, NextAuth, service account) inmediatamente.

#### Variables Opcionales:

| Variable | Para qué sirve |
|----------|----------------|
| `GEMINI_API_KEY` | AI Assistant (chatbot) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Google Calendar sync |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Google Calendar sync |
| `GOOGLE_CALENDAR_ID` | Google Calendar sync |

### Cómo agregar variables desde Dashboard:

1. Settings → Environment Variables
2. Click "Add New"
3. Name: `NEXTAUTH_URL`
4. Value: La URL de tu proyecto (ej: `https://archipielago-production.vercel.app`)
5. Environments: Seleccionar "Production"
6. Save

### Cómo agregar variables desde CLI:

```bash
# Login primero
vercel login

# Agregar NEXTAUTH_URL
vercel env add NEXTAUTH_URL production
# Cuando te pregunte, pega: https://tu-url.vercel.app

# Verificar variables
vercel env ls
```

---

## 📋 PASO 3: OBTENER URL DE PRODUCCIÓN

### Desde Dashboard:

1. Ve a: https://vercel.com/aimanagements-projects/archipielago-production
2. La URL estará en la parte superior
3. Ejemplo: `https://archipielago-production.vercel.app`

### Desde CLI:

```bash
vercel ls archipielago-production --prod
```

---

## 📋 PASO 4: ACTUALIZAR GOOGLE OAUTH (CRÍTICO)

**Sin este paso, el login NO funcionará en producción**

### 4.1 Ir a Google Cloud Console

```
https://console.cloud.google.com
```

### 4.2 Seleccionar proyecto y abrir Credentials

1. Seleccionar el proyecto correcto
2. "APIs & Services" → "Credentials"
3. Click en el OAuth 2.0 Client ID que estás usando

### 4.3 Agregar Redirect URI

En "Authorized redirect URIs", agregar:

```
https://[tu-url-de-vercel].vercel.app/api/auth/callback/google
```

Ejemplo:
```
https://archipielago-production.vercel.app/api/auth/callback/google
```

### 4.4 Save

Click en "Save" en Google Console

**Esperar 5 minutos** para que los cambios se propaguen

---

## 📋 PASO 5: REDEPLOY (SI MODIFICASTE VARIABLES)

Si agregaste o modificaste variables de entorno:

### Desde Dashboard:

1. Ve a "Deployments"
2. Click en el deployment más reciente
3. Click en "..." (tres puntos)
4. Click "Redeploy"
5. **IMPORTANTE:** NO seleccionar "Use existing Build Cache"

### Desde CLI:

```bash
vercel --prod
```

---

## 📋 PASO 6: VERIFICAR QUE TODO FUNCIONE

### 6.1 Abrir la URL de producción

```
https://[tu-url].vercel.app
```

### 6.2 Checklist de pruebas:

- [ ] Página de login carga
- [ ] Click en "Sign in with Google"
- [ ] Autorización de Google funciona
- [ ] Redirección al dashboard
- [ ] Dashboard muestra estadísticas
- [ ] Navegación a `/tasks` funciona
- [ ] Navegación a `/calendar` funciona
- [ ] Navegación a `/gates` funciona
- [ ] Navegación a `/team` funciona
- [ ] Panel `/admin` es accesible

### 6.3 Verificar AI Assistant (si configuraste GEMINI_API_KEY):

- [ ] Botón flotante del chat aparece
- [ ] Al hacer click, se abre el chat
- [ ] Puedes enviar un mensaje
- [ ] Recibe respuesta del asistente

---

## 🐛 TROUBLESHOOTING

### Error: "Unauthorized" al hacer login

**Causa:** Redirect URI no está configurado en Google Cloud Console

**Solución:**
1. Verifica PASO 4 arriba
2. Asegúrate de que la URL sea EXACTA (sin trailing slash)
3. Espera 5 minutos después de guardar en Google Console

### Error: "NEXTAUTH_URL is required"

**Causa:** Variable no configurada en Vercel

**Solución:**
1. Agregar variable `NEXTAUTH_URL` (PASO 2)
2. Redeploy (PASO 5)

### Error 500 o página en blanco

**Solución:**
1. Ver logs: Vercel Dashboard → Deployments → Click en deployment → "Function Logs"
2. Buscar el error específico
3. Verificar que TODAS las variables requeridas estén configuradas

### Login funciona pero logout redirige mal

**Solución:**
Verificar que `NEXTAUTH_URL` sea la URL de producción (no localhost)

### AI Assistant no responde

**Causa:** `GEMINI_API_KEY` no configurada

**Solución:**
1. Obtener API key: https://makersuite.google.com/app/apikey
2. Agregar a Vercel: Settings → Environment Variables
3. Redeploy

---

## 📊 COMANDOS ÚTILES CLI

```bash
# Ver todos los proyectos
vercel list

# Ver deployments de este proyecto
vercel ls archipielago-production

# Ver logs del último deployment
vercel logs archipielago-production

# Ver variables de entorno
vercel env ls

# Agregar variable
vercel env add [NOMBRE] production

# Redeploy
vercel --prod

# Ver información del proyecto
vercel inspect archipielago-production
```

---

## ✅ CHECKLIST FINAL

### Pre-deployment:
- [x] Código actualizado (Next.js 14.2.33)
- [x] Push a GitHub exitoso
- [x] Proyecto importado en Vercel

### Configuración:
- [ ] `GOOGLE_CLIENT_ID` configurada
- [ ] `GOOGLE_CLIENT_SECRET` configurada
- [ ] `NEXTAUTH_SECRET` configurada
- [ ] `NEXTAUTH_URL` configurada (con URL de producción)
- [ ] Google OAuth redirect URI actualizado
- [ ] (Opcional) `GEMINI_API_KEY` configurada

### Verificación:
- [ ] Deployment exitoso (status verde)
- [ ] Login funciona en producción
- [ ] Todas las páginas cargan
- [ ] Datos se persisten correctamente

---

## 🎯 SIGUIENTE ACCIÓN INMEDIATA

1. **Verificar URL de producción:**
   - Ir a: https://vercel.com/aimanagements-projects/archipielago-production
   - Copiar la URL (ejemplo: https://archipielago-production.vercel.app)

2. **Configurar NEXTAUTH_URL:**
   - Settings → Environment Variables → Add
   - Variable: `NEXTAUTH_URL`
   - Value: La URL que copiaste
   - Save → Redeploy

3. **Actualizar Google OAuth:**
   - https://console.cloud.google.com
   - Agregar redirect URI con tu URL

4. **Probar:**
   - Abrir tu URL
   - Login con Google
   - Verificar que todo funcione

---

**Tiempo estimado:** 10-15 minutos

**¡Tu app estará completamente funcional en producción!** 🚀
