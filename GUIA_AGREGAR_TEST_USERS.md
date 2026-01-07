# 📋 Guía: Agregar Usuarios como Test Users en Google Cloud

## ⚠️ Problema Actual

Cuando envías una invitación a un usuario nuevo, Google bloquea el acceso porque la app está en modo de prueba y solo usuarios en la lista de "Test Users" pueden acceder.

## ✅ Solución Estándar (Gratis y Rápida)

### Paso 1: Ir a Google Cloud Console

1. Ve a: https://console.cloud.google.com/
2. Selecciona el proyecto: `archipielago-production` (o el proyecto donde está configurado OAuth)
3. Asegúrate de estar logueado con: `ai.management@archipielagofilm.com`

### Paso 2: Agregar Test Users

1. Ve a: **APIs & Services** > **OAuth consent screen**
2. Desplázate hasta la sección **"Test users"**
3. Haz clic en **"+ ADD USERS"**
4. Agrega los emails de los usuarios invitados (uno por línea o separados por comas)
5. Haz clic en **"ADD"**
6. **GUARDA** los cambios

### Paso 3: Verificar

Los usuarios agregados ahora pueden:
- Recibir el email de invitación
- Hacer clic en "Acceder a la Plataforma"
- Iniciar sesión con Google OAuth sin ser bloqueados

## 🔄 Proceso Recomendado

Cada vez que invites a un usuario nuevo:

1. **Envía la invitación** desde la app (esto otorga `accessGranted = true`)
2. **Agrega el email del usuario** a la lista de Test Users en Google Cloud Console
3. **Notifica al usuario** que ya puede acceder

## 📝 Lista de Usuarios Pendientes

Cuando invites a un usuario, el sistema te mostrará un mensaje recordándote agregarlo como Test User.

## 🚀 Solución a Largo Plazo

Para producción, puedes:
1. **Solicitar verificación de Google** (proceso más largo, pero permite acceso público)
2. **Usar Google Workspace** y cambiar a modo "Internal" (solo usuarios de tu organización)
3. **Mantener lista de Test Users** actualizada (solución actual, gratis y funciona)
