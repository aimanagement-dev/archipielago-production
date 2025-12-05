# 🚀 GUÍA DE DEPLOYMENT A VERCEL

**Proyecto:** Archipiélago Production OS
**Fecha:** 5 de Diciembre, 2025
**Plataforma:** Vercel (Recomendada para Next.js)

---

## 📋 PRE-REQUISITOS

Antes de empezar, asegúrate de tener:

- [ ] Cuenta en GitHub (con el repositorio del proyecto)
- [ ] Cuenta en Vercel (crear en https://vercel.com/signup)
- [ ] Google Cloud Console configurado (OAuth credentials)
- [ ] GEMINI_API_KEY (opcional, pero recomendado)

---

## 🎯 OPCIÓN 1: DEPLOYMENT AUTOMÁTICO (RECOMENDADO)

### Paso 1: Conectar con Vercel

1. **Ir a Vercel:**
   - Abre https://vercel.com
   - Click en "Sign Up" o "Login"
   - Conecta con tu cuenta de GitHub

2. **Importar Proyecto:**
   - Click en "Add New..." → "Project"
   - Selecciona el repositorio `arch-pm` (o como se llame tu repo)
   - Click en "Import"

### Paso 2: Configurar el Proyecto

**Framework Preset:**
- Vercel detectará automáticamente que es Next.js ✅

**Build Settings (dejar por defecto):**
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

**Root Directory:**
- Dejar en raíz (`.`)

### Paso 3: Configurar Variables de Entorno

**CRÍTICO: Agregar estas variables ANTES de hacer deploy**

En la sección "Environment Variables", agregar:

#### Variables REQUERIDAS:

```bash
# OAuth
GOOGLE_CLIENT_ID=3160191465556-qcdd1ea8o6u8uboj756rad0r4turjech.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# NextAuth
NEXTAUTH_SECRET=tJ3z9RHouWo7v6JcTJY0ZTS6/KdbtSmZeqw86YTjKYY=
```

**IMPORTANTE:** NO agregar `NEXTAUTH_URL` todavía (Vercel lo genera automáticamente)

#### Variables OPCIONALES:

```bash
# Gemini AI (para AI Assistant)
GEMINI_API_KEY=tu_api_key_aqui

# Google Calendar (si lo necesitas)
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu_email@proyecto.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=tu_calendario@group.calendar.google.com
```

**Aplicar a:** Production, Preview, Development (seleccionar los 3)

### Paso 4: Deploy

1. Click en "Deploy"
2. Esperar 2-3 minutos
3. ✅ Tu app estará en línea

**URL generada:** `https://arch-pm-xxx.vercel.app`

---

## ⚙️ PASO 5: CONFIGURACIÓN POST-DEPLOYMENT

### 5.1 Configurar NEXTAUTH_URL

Una vez que tengas la URL de Vercel:

1. Ir a Vercel Dashboard → tu proyecto → "Settings" → "Environment Variables"
2. Agregar nueva variable:
   ```
   NEXTAUTH_URL=https://tu-proyecto.vercel.app
   ```
3. Aplicar a: Production, Preview, Development
4. **Redeploy:** Settings → Deployments → Click en "..." → "Redeploy"

### 5.2 Actualizar Google OAuth Redirect URIs

**MUY IMPORTANTE:** Agregar la URL de Vercel a Google Cloud Console

1. Ir a https://console.cloud.google.com
2. Seleccionar tu proyecto
3. Ir a "APIs & Services" → "Credentials"
4. Click en tu OAuth 2.0 Client ID
5. En "Authorized redirect URIs", agregar:
   ```
   https://tu-proyecto.vercel.app/api/auth/callback/google
   ```
6. Click "Save"

**Sin este paso, el login NO funcionará en producción**

### 5.3 Verificar el Deployment

Probar estas rutas:

- [ ] `https://tu-proyecto.vercel.app` → Debería mostrar login
- [ ] `https://tu-proyecto.vercel.app/login` → Página de login
- [ ] Login con Google → Debería funcionar
- [ ] Dashboard → Debería cargar después de login
- [ ] `/tasks`, `/calendar`, `/gates`, `/team` → Todas funcionan

---

## 🎯 OPCIÓN 2: DEPLOYMENT CON VERCEL CLI

### Instalar Vercel CLI

```bash
npm install -g vercel
```

### Login

```bash
vercel login
```

### Deploy

```bash
# Desde la raíz del proyecto
vercel

# Seguir las instrucciones:
# - Set up and deploy? Y
# - Which scope? (seleccionar tu cuenta)
# - Link to existing project? N
# - Project name? arch-pm
# - In which directory is your code located? ./
# - Override settings? N
```

### Deploy a Producción

```bash
vercel --prod
```

---

## 🔧 CONFIGURACIÓN AVANZADA

### Custom Domain (Opcional)

1. Ir a Vercel Dashboard → tu proyecto → "Settings" → "Domains"
2. Agregar tu dominio personalizado
3. Configurar DNS según instrucciones de Vercel
4. Actualizar `NEXTAUTH_URL` con el nuevo dominio
5. Actualizar Google OAuth redirect URIs

### Variables por Entorno

Puedes configurar variables diferentes para:
- **Production:** Deploy final
- **Preview:** Branches y PRs
- **Development:** Local development

### Logs y Monitoring

**Ver logs:**
- Vercel Dashboard → tu proyecto → "Deployments" → Click en deployment → "View Function Logs"

**Analytics:**
- Vercel Dashboard → tu proyecto → "Analytics" (gratis)

---

## 🐛 TROUBLESHOOTING

### Error: "Unauthorized" al hacer login

**Causa:** Redirect URI no configurado en Google Cloud Console

**Solución:**
1. Ir a Google Cloud Console → Credentials
2. Agregar `https://tu-proyecto.vercel.app/api/auth/callback/google`
3. Esperar 5 minutos y volver a intentar

### Error: "NEXTAUTH_URL is required"

**Solución:**
1. Agregar variable `NEXTAUTH_URL` en Vercel
2. Redeploy el proyecto

### AI Assistant no funciona

**Causa:** GEMINI_API_KEY no configurada

**Solución:**
1. Obtener API key de https://makersuite.google.com/app/apikey
2. Agregar a Environment Variables en Vercel
3. Redeploy

### Build falla

**Ver logs:**
1. Vercel Dashboard → Deployments → Click en deployment fallido
2. Ver "Build Logs"
3. Identificar error

**Soluciones comunes:**
```bash
# Limpiar caché y redeploy
# En Vercel Dashboard → Settings → General
# "Clear Build Cache & Redeploy"
```

### Variables de entorno no se aplican

**Causa:** Necesitas redeploy después de cambiar variables

**Solución:**
1. Cambiar variable en Vercel Settings
2. Settings → Deployments → "Redeploy"
3. NO usar "Redeploy with existing Build Cache"

---

## 📊 CHECKLIST FINAL DE DEPLOYMENT

### Antes de Deploy:

- [ ] Código commiteado y pusheado a GitHub
- [ ] `.env.local` NO está en el repositorio (verificar .gitignore)
- [ ] `package.json` actualizado (Next.js 14.2.33)
- [ ] Build local exitoso (`npm run build`)

### Durante Deploy:

- [ ] Proyecto importado en Vercel
- [ ] Variables de entorno configuradas
- [ ] Deploy exitoso (status verde)

### Después de Deploy:

- [ ] `NEXTAUTH_URL` configurada con URL de Vercel
- [ ] Google OAuth redirect URI actualizado
- [ ] Login funciona en producción
- [ ] Todas las páginas cargan correctamente
- [ ] AI Assistant funciona (si GEMINI_API_KEY está configurado)

---

## 🚀 DEPLOYMENT AUTOMÁTICO

### Configurar Auto-Deploy

Una vez conectado con GitHub, Vercel automáticamente:

- ✅ Deploy en cada push a `main` (producción)
- ✅ Deploy preview en cada PR
- ✅ Deploy preview en cada branch

**Configuración:**
- Vercel Dashboard → Settings → Git
- "Production Branch": `main`
- "Deploy Hooks": Configurar si necesitas

### Proteger Branches

Recomendado:
1. GitHub → Settings → Branches
2. "Add rule" para `main`
3. Requerir PR reviews
4. Requerir status checks (Vercel build)

---

## 📈 MONITOREO Y ANALYTICS

### Vercel Analytics (Gratis)

**Activar:**
1. Vercel Dashboard → tu proyecto → "Analytics"
2. Click "Enable Analytics"

**Métricas incluidas:**
- Page views
- Unique visitors
- Top pages
- Devices
- Browsers
- Locations

### Speed Insights (Gratis)

**Activar:**
1. Vercel Dashboard → "Speed Insights"
2. Click "Enable"

**Métricas Web Vitals:**
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- First Input Delay (FID)

---

## 🔒 SEGURIDAD EN PRODUCCIÓN

### Headers de Seguridad (Recomendado)

Agregar a `next.config.js`:

```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

### Proteger Variables Sensibles

- ✅ NUNCA commitear `.env.local` a GitHub
- ✅ Usar variables de entorno en Vercel
- ✅ Rotar secrets periódicamente
- ✅ Limitar scope de Google OAuth

---

## 💰 COSTOS

### Plan Gratuito de Vercel (Hobby)

**Incluye:**
- Deployments ilimitados
- 100 GB bandwidth/mes
- Analytics básico
- SSL automático
- Preview deployments
- Dominio `.vercel.app`

**Suficiente para:**
- Equipos pequeños (< 20 usuarios)
- Prototipos
- Proyectos personales

### Plan Pro ($20/mes)

**Incluye todo del Free, más:**
- 1 TB bandwidth/mes
- Password protection
- Advanced analytics
- Team collaboration
- 100 GB serverless function execution

---

## 📚 RECURSOS ÚTILES

**Documentación:**
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)

**Soporte:**
- Vercel Discord: https://vercel.com/discord
- GitHub Discussions: En tu repo

---

## 🎬 RESUMEN RÁPIDO (5 MINUTOS)

1. **Vercel:** Import proyecto desde GitHub
2. **Variables:** Agregar GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET
3. **Deploy:** Click "Deploy"
4. **Post-deploy:** Agregar NEXTAUTH_URL y actualizar Google OAuth redirect URI
5. **Verificar:** Probar login y navegación

**¡Listo! Tu app está online en 5 minutos** 🚀

---

## ✅ SIGUIENTE PASO

**Haz tu primer deployment ahora:**

1. Ve a https://vercel.com
2. Click "New Project"
3. Importa tu repositorio
4. Sigue esta guía

**¿Necesitas ayuda?** Avísame en cualquier paso.

---

**Última actualización:** 5 de Diciembre, 2025
