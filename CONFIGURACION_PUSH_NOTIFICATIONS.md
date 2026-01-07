# 🔔 CONFIGURACIÓN DE PUSH NOTIFICATIONS

## ✅ Implementación Completada

El sistema de push notifications está completamente implementado y listo para usar.

## 🔑 Paso 1: Generar VAPID Keys (OBLIGATORIO)

Las VAPID keys son necesarias para que las push notifications funcionen. Solo necesitas generarlas **una vez**.

### Opción A: Usar el script (Recomendado)

```bash
node scripts/generate-vapid-keys.js
```

Esto generará las keys y te mostrará las variables de entorno que necesitas agregar.

### Opción B: Generar manualmente

```bash
npm install -g web-push
web-push generate-vapid-keys
```

## 📝 Paso 2: Configurar Variables de Entorno

### En `.env.local` (desarrollo):

```bash
VAPID_PUBLIC_KEY=tu_public_key_aqui
VAPID_PRIVATE_KEY=tu_private_key_aqui
VAPID_SUBJECT=mailto:ai.management@archipielagofilm.com
```

### En Vercel (producción):

1. Ve a: https://vercel.com → Tu proyecto → **Settings** → **Environment Variables**
2. Agrega las 3 variables:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT` (debe ser `mailto:ai.management@archipielagofilm.com`)
3. Aplica a: **Production**, **Preview**, **Development**
4. Guarda y haz **Redeploy**

## 🚀 Cómo Funciona

### Para Usuarios:

1. **Activar Notificaciones:**
   - Ve a **Settings** → **Push Notifications**
   - Click en "Activar Notificaciones Push"
   - El navegador pedirá permiso → Aceptar
   - Listo! Ya recibirás notificaciones

2. **Recibir Notificaciones:**
   - Cuando alguien te comparta una tarea o te asigne una
   - Recibirás una notificación push (incluso si la app está cerrada)
   - Click en la notificación para abrir la app

### Para Admins:

1. **Enviar Push Notifications:**
   - Al compartir una tarea, selecciona "Notificación App"
   - Selecciona destinatarios
   - Click "Enviar"
   - Los usuarios con push activado recibirán la notificación

2. **Fallback Automático:**
   - Si un usuario no tiene push activado, se envía por email automáticamente
   - Si push falla, se envía por email como respaldo

## 🔧 Componentes Implementados

### Frontend:
- `public/sw.js` - Service Worker para recibir push
- `hooks/usePushNotifications.ts` - Hook de React para manejar suscripciones
- `components/Notifications/PushNotificationPrompt.tsx` - UI para activar/desactivar
- `components/ServiceWorkerRegistration.tsx` - Registro automático del SW
- `components/Comms/ComposeModal.tsx` - Integrado para enviar push

### Backend:
- `app/api/push/subscribe/route.ts` - Guardar/obtener/eliminar suscripciones
- `app/api/push/send/route.ts` - Enviar push notifications
- `app/api/push/vapid-public-key/route.ts` - Obtener public key para el cliente
- `lib/google-sheets.ts` - Métodos para almacenar suscripciones en Sheets

## 📊 Almacenamiento

Las suscripciones se guardan en Google Sheets en una nueva hoja llamada **"PushSubscriptions"** con columnas:
- User Email
- Subscription (JSON con endpoint y keys)
- Created At
- Last Used

## ⚠️ Requisitos

1. **HTTPS:** Push notifications solo funcionan en HTTPS (Vercel ya lo tiene)
2. **Navegador compatible:** Chrome, Firefox, Edge, Safari (iOS 16.4+)
3. **Permisos:** El usuario debe permitir notificaciones en el navegador

## 🧪 Probar

1. Genera las VAPID keys (Paso 1)
2. Configura las variables de entorno (Paso 2)
3. Haz deploy
4. Ve a Settings → Activa Push Notifications
5. Comparte una tarea seleccionando "Notificación App"
6. Deberías recibir una notificación push

## 🐛 Troubleshooting

### "VAPID keys not configured"
- Verifica que las variables estén en `.env.local` y Vercel
- Haz redeploy después de agregar las variables

### "Service Worker registration failed"
- Verifica que `/public/sw.js` exista
- Abre DevTools → Application → Service Workers para ver errores

### "No push subscription found"
- El usuario debe activar push notifications primero en Settings
- Verifica que la suscripción se guardó en Sheets

### Notificaciones no aparecen
- Verifica permisos del navegador (Settings → Site Settings → Notifications)
- Verifica que el Service Worker esté activo (DevTools → Application → Service Workers)
- Revisa la consola del navegador por errores
