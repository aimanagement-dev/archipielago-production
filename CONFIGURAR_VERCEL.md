# ⚙️ Configurar Variables de Entorno en Vercel

## 🔴 Problema

El deploy falló porque las variables de entorno no están configuradas en Vercel.

## ✅ Solución: Configurar Variables en Vercel

### Paso 1: Obtener la URL de tu Proyecto

Primero, necesitas saber la URL de tu proyecto en Vercel:

1. Ve a [vercel.com](https://vercel.com)
2. Inicia sesión
3. Busca tu proyecto "archipielago-production" o similar
4. Copia la URL (será algo como: `https://archipielago-production.vercel.app`)

### Paso 2: Configurar Variables de Entorno

1. En Vercel, ve a tu proyecto
2. Click en **Settings** (Configuración)
3. Click en **Environment Variables** (Variables de Entorno)
4. Agrega estas variables **UNA POR UNA**:

#### Variable 1: GOOGLE_CLIENT_ID
- **Key:** `GOOGLE_CLIENT_ID`
- **Value:** `316019146556-qcdd1ea8o6u8uboj756rad0r4turjech.apps.googleusercontent.com`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Click **Save**

#### Variable 2: GOOGLE_CLIENT_SECRET
- **Key:** `GOOGLE_CLIENT_SECRET`
- **Value:** (Copia el valor de tu `.env.local`)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Click **Save**

#### Variable 3: NEXTAUTH_SECRET
- **Key:** `NEXTAUTH_SECRET`
- **Value:** (Copia el valor de tu `.env.local`)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Click **Save**

#### Variable 4: NEXTAUTH_URL
- **Key:** `NEXTAUTH_URL`
- **Value:** `https://tu-proyecto.vercel.app` (reemplaza con tu URL real)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Click **Save**

#### Variable 5: GEMINI_API_KEY (Opcional)
- **Key:** `GEMINI_API_KEY`
- **Value:** (Si tienes una API key de Gemini)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Click **Save**

### Paso 3: Actualizar Redirect URI en Google Cloud Console

**CRÍTICO:** Después de obtener la URL de Vercel, debes agregarla a Google Cloud Console:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** > **Credentials**
3. Edita tu OAuth Client ID (`316019146556-qcdd1ea8o6u8uboj756rad0r4turjech...`)
4. En **"Authorized redirect URIs"**, asegúrate de tener:
   ```
   http://localhost:3000/api/auth/callback/google
   https://tu-proyecto.vercel.app/api/auth/callback/google
   ```
   (Reemplaza `tu-proyecto.vercel.app` con tu URL real)
5. **GUARDA** los cambios

### Paso 4: Redeploy

Después de configurar las variables:

1. En Vercel, ve a tu proyecto
2. Click en **Deployments**
3. Click en los **3 puntos** del último deployment
4. Click en **Redeploy**
5. O desde la terminal:
   ```bash
   vercel --prod
   ```

---

## 🎯 Comandos Rápidos

```bash
# Ver información del proyecto
vercel inspect

# Ver las variables de entorno (si tienes acceso)
vercel env ls

# Redeploy
vercel --prod
```

---

## ✅ Checklist

- [ ] Variables de entorno configuradas en Vercel
- [ ] NEXTAUTH_URL apunta a la URL correcta de Vercel
- [ ] Redirect URI de producción agregada en Google Cloud Console
- [ ] Redeploy realizado
- [ ] App accesible en la URL de Vercel
- [ ] Login con Google funciona

---

**¿Necesitas ayuda?** Una vez que configures las variables, el deploy debería funcionar correctamente.


