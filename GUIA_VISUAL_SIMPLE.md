# 🎯 GUÍA VISUAL SIMPLE - DEPLOYMENT VERCEL

## PASO 1: Ir al Dashboard de Vercel

### Qué hacer:
1. Abre tu navegador (Chrome, Safari, etc.)
2. Ve a: https://vercel.com
3. Haz login con: `ai.management@archipielagofilm.com`

### Qué verás:
```
┌─────────────────────────────────────┐
│ Vercel Dashboard                    │
├─────────────────────────────────────┤
│                                     │
│ Your Projects:                      │
│                                     │
│ 📦 archipielago-production         │
│    https://archipielago-xxx.vercel.app
│    [Visit]  [Settings]             │
│                                     │
└─────────────────────────────────────┘
```

### Acción:
**Click en "archipielago-production"** (el nombre del proyecto)

---

## PASO 2: Ver la URL de tu Proyecto

### Qué verás:
```
┌─────────────────────────────────────────────┐
│ archipielago-production                     │
├─────────────────────────────────────────────┤
│                                             │
│ Production Deployment                       │
│ https://archipielago-production.vercel.app  │ ← ESTA ES TU URL
│                                             │
│ [Visit] [Domains] [Deployments]            │
│                                             │
└─────────────────────────────────────────────┘
```

### Acción:
**COPIA esta URL completa**
Ejemplo: `https://archipielago-production.vercel.app`

---

## PASO 3: Ir a Settings (Configuración)

### Qué hacer:
1. En la parte superior del dashboard, busca el menú
2. Click en **"Settings"** (o "Configuración")

### Qué verás:
```
┌─────────────────────────────────────┐
│ Settings                            │
├─────────────────────────────────────┤
│                                     │
│ > General                           │
│ > Domains                           │
│ > Environment Variables      ← AQUÍ│
│ > Git                               │
│ > Functions                         │
│                                     │
└─────────────────────────────────────┘
```

### Acción:
**Click en "Environment Variables"**

---

## PASO 4: Verificar Variables de Entorno

### Qué verás:
```
┌─────────────────────────────────────────────┐
│ Environment Variables                       │
├─────────────────────────────────────────────┤
│                                             │
│ Name                    Value      Env      │
│ ─────────────────────────────────────────  │
│ GOOGLE_CLIENT_ID        316...     Prod ✓  │
│ GOOGLE_CLIENT_SECRET    GOC...     Prod ✓  │
│ NEXTAUTH_SECRET         tJ3...     Prod ✓  │
│ NEXTAUTH_URL            ???        ???     │ ← VERIFICAR
│                                             │
│ [Add New]                                   │
└─────────────────────────────────────────────┘
```

### Verificar:
**¿Hay una variable llamada `NEXTAUTH_URL`?**

**CASO A: SÍ existe NEXTAUTH_URL**
- Verificar que su valor sea: `https://archipielago-production.vercel.app` (tu URL)
- Si es correcta → Continúa al PASO 5
- Si dice `http://localhost:3000` → Necesitas editarla

**CASO B: NO existe NEXTAUTH_URL**
- Necesitas crearla → Ve al PASO 4B

---

## PASO 4B: Agregar NEXTAUTH_URL (si no existe)

### Qué hacer:
1. Click en **"Add New"** (Agregar Nueva)

### Verás un formulario:
```
┌─────────────────────────────────────┐
│ Add Environment Variable            │
├─────────────────────────────────────┤
│                                     │
│ Name:                               │
│ [_________________]                 │
│                                     │
│ Value:                              │
│ [_________________]                 │
│                                     │
│ Environments:                       │
│ ☐ Production                        │
│ ☐ Preview                           │
│ ☐ Development                       │
│                                     │
│ [Cancel]  [Save]                    │
└─────────────────────────────────────┘
```

### Llenar el formulario:

**Name (Nombre):**
```
NEXTAUTH_URL
```

**Value (Valor):**
```
https://archipielago-production.vercel.app
```
(Pega la URL que copiaste en PASO 2)

**Environments (Entornos):**
- ✅ **Marca "Production"** (Production)
- ☐ Preview (dejar sin marcar)
- ☐ Development (dejar sin marcar)

### Acción:
**Click en "Save"** (Guardar)

---

## PASO 5: Redeploy (Volver a Deployar)

### Por qué:
Cuando cambias variables de entorno, necesitas hacer un "redeploy" para que se apliquen.

### Qué hacer:
1. En el menú superior, click en **"Deployments"**

### Verás:
```
┌─────────────────────────────────────────────┐
│ Deployments                                 │
├─────────────────────────────────────────────┤
│                                             │
│ Production                                  │
│ ┌─────────────────────────────────────┐    │
│ │ ✓ Ready                             │    │
│ │ main - 19014ec                      │    │
│ │ chore: Preparar proyecto para...   │    │
│ │ 10 minutes ago                      │    │
│ │ [Visit]  [...]  ← Click aquí       │    │
│ └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

### Acción:
1. Click en los **tres puntos** [...] del deployment más reciente
2. En el menú que aparece, click en **"Redeploy"**
3. Te preguntará "Are you sure?" → Click **"Redeploy"**
4. **IMPORTANTE:** Si te da opción "Use existing Build Cache" → **NO la marques**
5. Espera 2-3 minutos

---

## PASO 6: Actualizar Google OAuth

### Qué hacer:
1. Abre una nueva pestaña
2. Ve a: https://console.cloud.google.com

### Login:
- Usa la misma cuenta: `ai.management@archipielagofilm.com`

### Navegar:
1. En el menú izquierdo, busca **"APIs & Services"**
2. Click en **"Credentials"** (Credenciales)

### Verás:
```
┌─────────────────────────────────────────────┐
│ Credentials                                 │
├─────────────────────────────────────────────┤
│                                             │
│ OAuth 2.0 Client IDs                        │
│ ┌─────────────────────────────────────┐    │
│ │ Web client                          │    │
│ │ 3160191465556-qcdd...               │    │ ← Click aquí
│ └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

### Acción:
**Click en el nombre del OAuth 2.0 Client ID**

### Editar:
Busca la sección **"Authorized redirect URIs"**

```
┌─────────────────────────────────────────────┐
│ Authorized redirect URIs                    │
├─────────────────────────────────────────────┤
│                                             │
│ • http://localhost:3000/api/auth/...       │
│                                             │
│ [+ ADD URI]  ← Click aquí                  │
└─────────────────────────────────────────────┘
```

### Agregar URI:
1. Click en **"+ ADD URI"**
2. Pega esto (cambia la URL por la tuya):
   ```
   https://archipielago-production.vercel.app/api/auth/callback/google
   ```
3. Scroll down y click en **"SAVE"** (Guardar)
4. Espera 5 minutos para que se aplique

---

## PASO 7: Probar Tu App

### Qué hacer:
1. Abre una pestaña nueva
2. Ve a tu URL: `https://archipielago-production.vercel.app`

### Qué deberías ver:
```
┌─────────────────────────────────────────────┐
│                                             │
│              Archipiélago                   │
│         Production Management               │
│                                             │
│     [Sign in with Google]  ← Click aquí    │
│                                             │
└─────────────────────────────────────────────┘
```

### Probar:
1. **Click en "Sign in with Google"**
2. Selecciona la cuenta: `ai.management@archipielagofilm.com`
3. Autoriza la aplicación
4. **Deberías ser redirigido al Dashboard**

### Si funciona:
```
┌─────────────────────────────────────────────┐
│ Dashboard                                   │
├─────────────────────────────────────────────┤
│                                             │
│ Buenos días! 👋                             │
│                                             │
│ Quick Stats:                                │
│ ┌────────┬────────┬────────┬────────┐      │
│ │  30    │   5    │   13   │   5    │      │
│ │ Tasks  │ Prog   │ Team   │ Gates  │      │
│ └────────┴────────┴────────┴────────┘      │
│                                             │
└─────────────────────────────────────────────┘
```

### ✅ ¡FUNCIONÓ!

Tu app está online y funcionando correctamente.

### ❌ Si dice "Unauthorized":
- Vuelve al PASO 6
- Verifica que agregaste el redirect URI correcto
- Espera 5 minutos más

### ❌ Si dice "NEXTAUTH_URL required":
- Vuelve al PASO 4
- Verifica que agregaste NEXTAUTH_URL
- Vuelve al PASO 5 (Redeploy)

---

## 📋 RESUMEN RÁPIDO

1. **Vercel Dashboard** → Copiar URL
2. **Settings → Environment Variables** → Agregar `NEXTAUTH_URL`
3. **Deployments** → Redeploy
4. **Google Console** → Agregar redirect URI
5. **Probar** → Login con Google

**Tiempo: 10-15 minutos**

---

## 🆘 SI TE ATASCAS

**Dime en qué paso estás y qué ves en pantalla.**

Ejemplo:
- "Estoy en PASO 3, veo Settings pero no encuentro Environment Variables"
- "Estoy en PASO 7, hice login pero me da error 'Unauthorized'"

**Te ayudaré específicamente con ese paso.**

---

## ✅ CUANDO TERMINES

Tu app estará:
- ✅ Online en Vercel
- ✅ Accesible desde cualquier lugar
- ✅ Login funcionando
- ✅ Todas las funcionalidades operativas

**¡Lista para usar!** 🚀
