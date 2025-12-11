# ⚡ Setup Rápido - Solo lo que DEBES hacer

## 🎯 Total: 10 minutos | 4 pasos simples

---

## ✅ PASO 1: Crear Proyecto Supabase (3 min)

### 1.1 - Ir a Supabase
👉 **Abre esta URL**: https://supabase.com/dashboard/sign-in

### 1.2 - Sign Up (si no tienes cuenta)
- Click en "Sign up now"
- Usa GitHub (más rápido) o email
- ✅ Confirma tu email si es necesario

### 1.3 - Crear nuevo proyecto
- Click en "New project"
- **Name**: `archipielago-production`
- **Database Password**: Crea una (guárdala, pero no la necesitarás después)
- **Region**: Elige el más cercano (ej: South America)
- Click "Create new project"
- ⏳ **Espera 2 minutos** (verás una barra de progreso)

---

## ✅ PASO 2: Copiar Credenciales (1 min)

### 2.1 - Ir a Settings
En tu proyecto de Supabase:
- Click en el ícono de engranaje ⚙️ (abajo izquierda)
- Click en "API"

### 2.2 - Copiar estos 2 valores:

📋 **Project URL**
```
Busca: "Project URL"
Se ve como: https://abcdefghijk.supabase.co
Cópialo
```

📋 **anon public key**
```
Busca: "anon public" (en la sección Project API keys)
Se ve como: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc...
Cópialo (es largo, ~300 caracteres)
```

---

## ✅ PASO 3: Ejecutar SQL Schema (2 min)

### 3.1 - Abrir SQL Editor
En Supabase:
- Click en "SQL Editor" (icono de código en la barra lateral)
- Click en "+ New query"

### 3.2 - Copiar y ejecutar el schema
1. Abre el archivo: `/supabase/schema.sql` (en tu editor de código)
2. **Selecciona TODO** (Ctrl+A / Cmd+A)
3. **Copia** (Ctrl+C / Cmd+C)
4. **Pega en el SQL Editor** de Supabase
5. Click en "Run" (o Ctrl+Enter)

✅ **Verás**: "Success. No rows returned"

---

## ✅ PASO 4: Pegar Credenciales (1 min)

### 4.1 - Abrir .env.local
Ya está creado en: `/home/user/archipielago-production/.env.local`

### 4.2 - Reemplazar los valores
```bash
# ANTES:
NEXT_PUBLIC_SUPABASE_URL=PEGA_AQUI_TU_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=PEGA_AQUI_TU_ANON_KEY

# DESPUÉS (ejemplo):
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk5OTk5OTksImV4cCI6MjAxNTU3NTk5OX0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Guarda el archivo.

---

## 🚀 LISTO! Ahora corre la app:

```bash
npm run dev
```

Abre: http://localhost:3000

### ✅ Verás funcionando:
- 💬 Chat bubble (bottom-right) → Abre el chat
- 🔔 Notification bell (top-right) → Muestra notificaciones
- 📎 File uploads en tasks/gates

---

## 🐛 Si algo no funciona:

### Error: "Invalid Supabase URL"
→ Revisa que copiaste bien el Project URL (debe empezar con https://)

### Error: "Invalid API key"
→ Revisa que copiaste el "anon public" key completo (es muy largo)

### Chat/Notificaciones vacías
→ Normal! No hay datos aún. Crea una tarea para ver notificaciones.

### SQL schema falla
→ Asegúrate de copiar TODO el archivo schema.sql (incluye las primeras líneas)

---

## 💡 Verificación Rápida

Para verificar que todo funciona:

1. **Abre la app** (http://localhost:3000)
2. **Login** con Google
3. **Click en el chat bubble** (bottom-right)
   - Debes ver 4 rooms: General, Producción, Post-producción, Técnico
   - Escribe un mensaje → Debe aparecer en tiempo real
4. **Crea o actualiza una tarea**
   - Asigna a alguien → Verás notificación en el bell icon
5. **Click en el bell icon**
   - Debes ver la notificación de la tarea

✅ **Si ves todo esto: ¡Perfecto! Todo funciona!**

---

## 📞 ¿Necesitas ayuda?

Si algo falla, dime:
- ¿Qué error ves? (consola del browser: F12)
- ¿En qué paso estás?

¡Te ayudo en tiempo real! 🚀
