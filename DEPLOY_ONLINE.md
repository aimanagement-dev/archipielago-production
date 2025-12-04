# 🚀 Deploy Online - Archipiélago

## 📋 Pasos para Deploy en Vercel

### 1. Verificar que el código esté actualizado

```bash
# Verificar cambios pendientes
git status

# Si hay cambios, hacer commit
git add .
git commit -m "Update OAuth configuration and fixes"
git push origin main
```

### 2. Deploy con Vercel CLI

```bash
# Si no estás logueado en Vercel
vercel login

# Deploy (primera vez)
vercel

# Deploy a producción
vercel --prod
```

### 3. Configurar Variables de Entorno en Vercel

**IMPORTANTE:** Después del deploy, debes configurar las variables de entorno en Vercel:

1. Ve a tu proyecto en [vercel.com](https://vercel.com)
2. Ve a **Settings** → **Environment Variables**
3. Agrega estas variables:

```
GOOGLE_CLIENT_ID=316019146556-qcdd1ea8o6u8uboj756rad0r4turjech.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
NEXTAUTH_SECRET=tu_nextauth_secret_aqui
NEXTAUTH_URL=https://tu-proyecto.vercel.app
GEMINI_API_KEY=tu_gemini_key_aqui (opcional)
```

### 4. Actualizar Redirect URI en Google Cloud Console

**CRÍTICO:** Después de obtener la URL de Vercel, debes agregar la URL de producción a Google Cloud Console:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** > **Credentials**
3. Edita tu OAuth Client ID
4. En **"Authorized redirect URIs"**, agrega:
   ```
   https://tu-proyecto.vercel.app/api/auth/callback/google
   ```
5. **GUARDA** los cambios

### 5. Redeploy después de cambiar variables

Después de agregar las variables de entorno en Vercel:

```bash
vercel --prod
```

O desde el dashboard de Vercel, haz clic en **"Redeploy"**.

---

## 🎯 Comandos Rápidos

```bash
# Deploy a producción
vercel --prod

# Ver logs
vercel logs

# Ver información del proyecto
vercel inspect
```

---

## ✅ Checklist Post-Deploy

- [ ] Variables de entorno configuradas en Vercel
- [ ] Redirect URI de producción agregada en Google Cloud Console
- [ ] App accesible en la URL de Vercel
- [ ] Login con Google funciona
- [ ] Test user agregado en OAuth consent screen

---

**¿Listo para deploy?** Ejecuta los comandos arriba o dime si necesitas ayuda con algún paso específico.


