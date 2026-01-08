# 🧪 INSTRUCCIONES PARA PROBAR LA APLICACIÓN ONLINE

**URL de Producción:** https://archipielago-production.vercel.app

---

## ✅ VERIFICACIÓN RÁPIDA

### 1. Acceso a la Aplicación
1. Abre tu navegador
2. Ve a: **https://archipielago-production.vercel.app**
3. Deberías ver la página de login

### 2. Login con Google
1. Click en **"Iniciar sesión con Google"**
2. Selecciona una cuenta autorizada:
   - `ai.management@archipielagofilm.com`
   - `ai.lantica@lanticastudios.com`
   - `federico.beron@lanticastudios.com`
   - `cindy.toribio@archipielagofilm.com`
   - `cindy.toribio@lanticastudios.com`
3. Autoriza los permisos solicitados
4. Deberías ser redirigido al dashboard

---

## 🧪 PRUEBAS DETALLADAS POR FUNCIONALIDAD

### ✅ Dashboard Principal
**Ruta:** `/` (página principal)

**Qué verificar:**
- [ ] La página carga correctamente
- [ ] Se muestran las estadísticas (tareas, equipo, gates)
- [ ] El timeline de gates se muestra
- [ ] Las tareas recientes aparecen
- [ ] El header con perfil de usuario está visible
- [ ] La navegación lateral funciona

### ✅ Gestión de Tareas
**Ruta:** `/tasks`

**Qué verificar:**
- [ ] La lista de tareas se carga
- [ ] Los filtros funcionan (por área, estado, etc.)
- [ ] Crear nueva tarea funciona (si eres admin)
- [ ] Editar tarea funciona
- [ ] Cambiar estado de tarea funciona
- [ ] Asignar responsables funciona
- [ ] Adjuntar archivos de Drive funciona
- [ ] Generar Google Meet link funciona

### ✅ Calendario
**Ruta:** `/calendar`

**Qué verificar:**
- [ ] El calendario se muestra correctamente
- [ ] Las tareas con fecha aparecen en el calendario
- [ ] La navegación entre meses funciona
- [ ] Crear evento desde calendario funciona (si eres admin)
- [ ] La sincronización con Google Calendar funciona

### ✅ Gestión de Equipo
**Ruta:** `/team`

**Qué verificar:**
- [ ] La lista de miembros del equipo se carga
- [ ] Ver detalles de un miembro funciona
- [ ] Crear nuevo miembro funciona (si eres admin)
- [ ] Editar miembro funciona
- [ ] Importar desde Google Contacts funciona

### ✅ Production Gates
**Ruta:** `/gates`

**Qué verificar:**
- [ ] El timeline de gates se muestra
- [ ] Los estados de los gates son correctos
- [ ] Las fechas se muestran correctamente
- [ ] Editar gates funciona (si eres admin)

### ✅ Finanzas
**Ruta:** `/finance`

**Qué verificar:**
- [ ] El dashboard financiero se carga
- [ ] Los gráficos se muestran correctamente
- [ ] La vista mensual funciona
- [ ] Crear transacción funciona
- [ ] Crear suscripción funciona
- [ ] Los totales se calculan correctamente

### ✅ Google Drive
**Ruta:** `/drive`

**Qué verificar:**
- [ ] La navegación de archivos funciona
- [ ] Puedes navegar entre carpetas
- [ ] Los archivos se listan correctamente
- [ ] Subir archivos funciona

### ✅ Chat con IA
**Ruta:** `/chat`

**Qué verificar:**
- [ ] El chat se carga
- [ ] Puedes enviar mensajes
- [ ] El asistente responde (requiere GEMINI_API_KEY)
- [ ] El historial se mantiene al recargar
- [ ] Las funciones del asistente funcionan (crear tareas, buscar info)

### ✅ Panel de Administración
**Ruta:** `/admin`

**Qué verificar:**
- [ ] Solo usuarios admin pueden acceder
- [ ] Las estadísticas del sistema se muestran
- [ ] La información de usuarios se muestra
- [ ] La información del sistema se muestra

### ✅ Perfil de Usuario
**Ruta:** `/profile`

**Qué verificar:**
- [ ] La información del usuario se muestra
- [ ] El email se muestra correctamente
- [ ] El nombre se muestra correctamente

### ✅ Configuración
**Ruta:** `/settings`

**Qué verificar:**
- [ ] Las opciones de configuración se muestran
- [ ] Cambiar tema funciona (si está implementado)
- [ ] Las preferencias se guardan

---

## 🔧 PRUEBAS DE INTEGRACIÓN

### Google Calendar Sync
1. Ve a `/tasks`
2. Crea una tarea con fecha y hora específica
3. Click en "Sync Google Calendar"
4. Verifica que el evento aparece en Google Calendar
5. Edita el evento en Google Calendar
6. Verifica que los cambios se reflejan en la app

### Notificaciones por Email
1. Crea una tarea con responsables asignados
2. Verifica que los responsables reciben un email
3. Actualiza una tarea con cambios relevantes
4. Verifica que se envía notificación

### Google Drive Integration
1. Ve a `/tasks`
2. Crea o edita una tarea
3. Click en "Adjuntar archivo"
4. Selecciona un archivo de Google Drive
5. Verifica que el archivo se vincula correctamente

### AI Assistant Functions
1. Ve a `/chat`
2. Prueba: "Crea una tarea llamada 'Reunión de producción' para mañana"
3. Verifica que la tarea se crea
4. Prueba: "¿Cuántas tareas tengo pendientes?"
5. Verifica que el asistente responde correctamente

---

## 🐛 PROBLEMAS COMUNES Y SOLUCIONES

### Error: "Unauthorized" al hacer login
**Causa:** Redirect URI no configurado en Google Cloud Console

**Solución:**
1. Ve a Google Cloud Console
2. APIs & Services → Credentials
3. Edita tu OAuth Client ID
4. Agrega: `https://archipielago-production.vercel.app/api/auth/callback/google`
5. Guarda y espera 5 minutos

### Error: "NEXTAUTH_URL is required"
**Causa:** Variable de entorno no configurada

**Solución:**
1. Ve a Vercel Dashboard → Settings → Environment Variables
2. Agrega `NEXTAUTH_URL=https://archipielago-production.vercel.app`
3. Redeploy el proyecto

### Las tareas no se sincronizan con Calendar
**Causa:** Service Account no configurado o sin permisos

**Solución:**
1. Verifica que `GOOGLE_SERVICE_ACCOUNT_EMAIL` está configurado
2. Verifica que `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` está configurado
3. Verifica que `GOOGLE_CALENDAR_ID` está configurado
4. Verifica que el Service Account tiene permisos en el calendario

### El AI Assistant no responde
**Causa:** GEMINI_API_KEY no configurada o inválida

**Solución:**
1. Verifica que `GEMINI_API_KEY` está configurada en Vercel
2. Verifica que la API key es válida
3. Verifica los logs en Vercel Dashboard

### Las notificaciones no se envían
**Causa:** Gmail API no configurada o sin permisos

**Solución:**
1. Verifica que el usuario tiene permisos de Gmail
2. Verifica los logs en Vercel Dashboard
3. Verifica que el access token incluye el scope de Gmail

---

## 📊 VERIFICACIÓN DE RENDIMIENTO

### Métricas a Verificar
- [ ] Tiempo de carga inicial < 3 segundos
- [ ] Navegación entre páginas < 1 segundo
- [ ] APIs responden < 500ms
- [ ] No hay errores en la consola del navegador
- [ ] Las imágenes se cargan correctamente
- [ ] Los estilos se aplican correctamente

### Herramientas de Verificación
- **Chrome DevTools:** F12 → Network, Console, Performance
- **Vercel Analytics:** Dashboard → Analytics
- **Speed Insights:** Dashboard → Speed Insights

---

## ✅ CHECKLIST FINAL

### Funcionalidad Básica
- [ ] Login funciona
- [ ] Dashboard carga
- [ ] Navegación funciona
- [ ] Todas las páginas cargan

### Funcionalidad Avanzada
- [ ] CRUD de tareas funciona
- [ ] Sincronización con Calendar funciona
- [ ] Notificaciones se envían
- [ ] AI Assistant funciona
- [ ] Integración con Drive funciona

### Integraciones
- [ ] Google OAuth funciona
- [ ] Google Calendar sync funciona
- [ ] Google Drive funciona
- [ ] Gmail API funciona
- [ ] Gemini AI funciona

### Seguridad
- [ ] Rutas protegidas requieren autenticación
- [ ] Solo usuarios autorizados pueden acceder
- [ ] Las APIs requieren autenticación
- [ ] No hay información sensible expuesta

---

## 🎯 RESULTADO ESPERADO

Después de completar todas las pruebas, deberías tener:

✅ Una aplicación completamente funcional  
✅ Todas las integraciones trabajando  
✅ Sin errores críticos  
✅ Buen rendimiento  
✅ Seguridad implementada  

---

## 📞 SOPORTE

Si encuentras problemas:

1. **Revisa los logs:**
   - Vercel Dashboard → Deployments → Logs
   - Chrome DevTools → Console

2. **Verifica la configuración:**
   - Variables de entorno en Vercel
   - Google Cloud Console → Credentials
   - Google Calendar → Compartir con Service Account

3. **Consulta la documentación:**
   - `ANALISIS_EXHAUSTIVO_APP.md`
   - `RESUMEN_DESPLIEGUE.md`
   - `DEPLOYMENT_GUIDE.md`

---

**¡Buena suerte con las pruebas!** 🚀
