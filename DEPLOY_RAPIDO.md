# ⚡ DEPLOYMENT RÁPIDO - 5 MINUTOS

## 🎯 OPCIÓN RÁPIDA: Vercel

### 1️⃣ Abre Vercel (1 min)
```
https://vercel.com
```
- Click "Sign Up" (con GitHub)
- Autoriza Vercel en GitHub

### 2️⃣ Importa el Proyecto (30 seg)
- Click "Add New..." → "Project"
- Busca `arch-pm` (o el nombre de tu repo)
- Click "Import"

### 3️⃣ Configura Variables (2 min)

**En "Environment Variables", agrega:**

```bash
GOOGLE_CLIENT_ID
3160191465556-qcdd1ea8o6u8uboj756rad0r4turjech.apps.googleusercontent.com

GOOGLE_CLIENT_SECRET
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

NEXTAUTH_SECRET
tJ3z9RHouWo7v6JcTJY0ZTS6/KdbtSmZeqw86YTjKYY=
```

**Opcional (para AI Assistant):**
```bash
GEMINI_API_KEY
tu_api_key_de_gemini
```

**Aplica a:** Production + Preview + Development ✅

### 4️⃣ Deploy (1 min)
- Click "Deploy"
- Espera 2-3 minutos
- ✅ ¡Listo!

**Tu URL:** `https://arch-pm-xxx.vercel.app`

---

## ⚙️ POST-DEPLOYMENT (IMPORTANTE)

### 5️⃣ Agregar NEXTAUTH_URL (30 seg)

**Cuando tengas la URL de Vercel:**

1. Vercel Dashboard → Settings → Environment Variables
2. Agregar:
   ```
   NEXTAUTH_URL=https://tu-proyecto.vercel.app
   ```
3. Redeploy (Settings → Deployments → "Redeploy")

### 6️⃣ Google OAuth Redirect (1 min)

**MUY IMPORTANTE - Sin esto el login NO funciona:**

1. Ve a: https://console.cloud.google.com
2. APIs & Services → Credentials
3. Click en tu OAuth Client ID
4. "Authorized redirect URIs" → Agregar:
   ```
   https://tu-proyecto.vercel.app/api/auth/callback/google
   ```
5. Save

---

## ✅ VERIFICAR

Probar en tu URL de Vercel:

- [ ] Login con Google funciona
- [ ] Dashboard carga
- [ ] Tasks, Calendar, Gates, Team funcionan
- [ ] AI Assistant responde (si configuraste GEMINI_API_KEY)

---

## 🆘 PROBLEMAS COMUNES

**"Unauthorized" al hacer login:**
→ Falta agregar redirect URI en Google Console (Paso 6)

**"NEXTAUTH_URL required":**
→ Falta agregar variable NEXTAUTH_URL (Paso 5)

**AI Assistant no responde:**
→ Falta GEMINI_API_KEY en variables de entorno

---

## 📚 MÁS DETALLES

Ver: `DEPLOY_VERCEL.md` (guía completa)

---

**TIEMPO TOTAL: ~5-7 minutos** ⏱️
