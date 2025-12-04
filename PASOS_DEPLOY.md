# 🚀 Pasos para Deploy Online - Archipiélago

## ✅ Estado Actual

- ✅ Código commiteado y pusheado a GitHub
- ✅ Vercel CLI instalado
- ✅ Proyecto existe en Vercel: `archipielago-production`
- ❌ Variables de entorno NO configuradas (por eso falló el deploy)

## 📝 Pasos para Completar el Deploy

### Paso 1: Configurar Variables de Entorno en Vercel

1. **Abre Vercel Dashboard:**
   - Ve a: https://vercel.com/dashboard
   - O ejecuta: `open https://vercel.com/dashboard`

2. **Selecciona tu proyecto:**
   - Busca: `archipielago-production`
   - Haz clic en él

3. **Ve a Settings:**
   - Click en **Settings** (en el menú superior)
   - Click en **Environment Variables** (en el menú lateral)

4. **Agrega las variables:**

   **Variable 1:**
   - Key: `GOOGLE_CLIENT_ID`
   - Value: `316019146556-qcdd1ea8o6u8uboj756rad0r4turjech.apps.googleusercontent.com`
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

   **Variable 2:**
   - Key: `GOOGLE_CLIENT_SECRET`
   - Value: (Copia de tu `.env.local` - empieza con `GOCSPX-`)
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

   **Variable 3:**
   - Key: `NEXTAUTH_SECRET`
   - Value: (Copia de tu `.env.local`)
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

   **Variable 4:**
   - Key: `NEXTAUTH_URL`
   - Value: `https://archipielago-production.vercel.app` (o la URL que te dé Vercel)
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

### Paso 2: Actualizar Redirect URI en Google Cloud Console

1. **Obtén la URL de producción:**
   - En Vercel, ve a **Deployments**
   - Copia la URL del deployment (algo como: `https://archipielago-production.vercel.app`)

2. **Actualiza Google Cloud Console:**
   - Ve a: https://console.cloud.google.com/
   - **APIs & Services** > **Credentials**
   - Edita tu OAuth Client ID
   - En **"Authorized redirect URIs"**, agrega:
     ```
     https://archipielago-production.vercel.app/api/auth/callback/google
     ```
   - **GUARDA** los cambios

### Paso 3: Redeploy

**Opción A: Desde Vercel Dashboard**
1. Ve a **Deployments**
2. Click en los **3 puntos** del último deployment
3. Click en **Redeploy**

**Opción B: Desde Terminal**
```bash
vercel --prod
```

### Paso 4: Verificar

1. Abre la URL de tu proyecto en Vercel
2. Deberías ver la página de login
3. Prueba hacer login con Google
4. Deberías ser redirigido al dashboard

---

## 🎯 Comandos Útiles

```bash
# Ver deployments
vercel ls

# Ver información del proyecto
vercel inspect

# Redeploy
vercel --prod

# Ver logs
vercel logs
```

---

## ✅ Checklist Final

- [ ] Variables de entorno configuradas en Vercel
- [ ] NEXTAUTH_URL apunta a la URL correcta
- [ ] Redirect URI de producción agregada en Google Cloud Console
- [ ] Redeploy realizado
- [ ] App accesible y funcionando

---

**¿Listo?** Una vez que configures las variables de entorno, el deploy funcionará correctamente.


