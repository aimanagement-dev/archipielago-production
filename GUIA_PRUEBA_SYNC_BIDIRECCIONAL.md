# 🧪 Guía de Prueba - Sincronización Bidireccional

## ✅ Estado del Código

- ✅ Código compilado sin errores
- ✅ Funciones de sincronización implementadas
- ✅ UI actualizada con botones bidireccionales
- ✅ Endpoints API funcionando

## 🎯 Cómo Probar la Sincronización Bidireccional

### Opción 1: Probar en Local (Recomendado para desarrollo)

1. **Iniciar el servidor local:**
   ```bash
   npm run dev
   ```

2. **Abrir la aplicación:**
   ```
   http://localhost:3000
   ```

3. **Hacer login** con tu cuenta de Google

4. **Ir a la página de Calendario:**
   ```
   http://localhost:3000/calendar
   ```

5. **Probar sincronización App → Calendar:**
   - Crear una nueva tarea con fecha y hora programada
   - Click en el botón **"→ Calendar"** (flecha hacia arriba)
   - Verificar que aparezca mensaje de éxito
   - Abrir Google Calendar y verificar que el evento aparezca

6. **Probar sincronización Calendar → App:**
   - Abrir Google Calendar
   - Modificar un evento que fue creado por la app (buscar eventos con "arch-pm" en la descripción)
   - Cambiar título, fecha u hora
   - Volver a la app
   - Click en el botón **"← Calendar"** (flecha hacia abajo)
   - Verificar que aparezca mensaje de éxito
   - Verificar que los cambios se reflejen en las tareas

### Opción 2: Probar en Producción

1. **Abrir la aplicación en producción:**
   ```
   https://archipielago-production.vercel.app
   ```

2. **Seguir los mismos pasos que en local**

## 📋 Checklist de Pruebas

### Prueba 1: Sincronización App → Calendar
- [ ] Crear tarea nueva con fecha programada
- [ ] Click en "→ Calendar"
- [ ] Ver mensaje de éxito
- [ ] Verificar evento en Google Calendar
- [ ] Verificar que el evento tenga la información correcta (título, fecha, hora, descripción)

### Prueba 2: Sincronización Calendar → App
- [ ] Modificar evento existente en Google Calendar
- [ ] Cambiar título del evento
- [ ] Cambiar fecha u hora
- [ ] Click en "← Calendar" en la app
- [ ] Ver mensaje de éxito con número de eventos encontrados
- [ ] Verificar que la tarea se actualizó en la app

### Prueba 3: Crear Evento en Calendar
- [ ] Crear evento nuevo directamente en Google Calendar
- [ ] Agregar en la descripción: `Área: Planificación` y `Estado: Pendiente`
- [ ] Click en "← Calendar" en la app
- [ ] Verificar que se cree una nueva tarea (si el evento tiene `source=arch-pm`)

### Prueba 4: Eliminar Tarea
- [ ] Eliminar una tarea programada en la app
- [ ] Click en "→ Calendar"
- [ ] Verificar que el evento se elimine de Google Calendar

## 🔍 Verificación Técnica

### Verificar que los endpoints funcionan:

1. **Endpoint POST (App → Calendar):**
   ```bash
   curl -X POST http://localhost:3000/api/google/calendar/sync \
     -H "Content-Type: application/json" \
     -H "Cookie: [tu-cookie-de-sesion]" \
     -d '{"tasks":[{"id":"test","title":"Test","scheduledDate":"2025-12-15","scheduledTime":"10:00"}]}'
   ```

2. **Endpoint GET (Calendar → App):**
   ```bash
   curl "http://localhost:3000/api/google/calendar/sync?timeMin=2025-09-01T00:00:00Z&timeMax=2026-06-30T23:59:59Z&updateSheets=true" \
     -H "Cookie: [tu-cookie-de-sesion]"
   ```

## ⚠️ Problemas Comunes

### Error: "Unauthorized"
- **Causa:** No hay sesión activa
- **Solución:** Hacer login primero

### Error: "No se pudo sincronizar"
- **Causa:** Permisos de Google Calendar no otorgados
- **Solución:** Verificar que el scope de Calendar esté en `auth-config.ts`

### Los eventos no aparecen en Calendar
- **Causa:** El `GOOGLE_CALENDAR_ID` puede estar mal configurado
- **Solución:** Verificar variable de entorno, usar `'primary'` para calendario principal

### Los cambios no se reflejan
- **Causa:** La sincronización no está actualizando Sheets correctamente
- **Solución:** Verificar logs del servidor, verificar permisos de Sheets

## 📊 Resultados Esperados

### Sincronización App → Calendar:
```json
{
  "ok": true,
  "direction": "app_to_calendar",
  "created": 1,
  "updated": 0,
  "deleted": 0,
  "skipped": 0,
  "errors": []
}
```

### Sincronización Calendar → App:
```json
{
  "ok": true,
  "direction": "calendar_to_app",
  "tasksFound": 5,
  "updated": 2,
  "created": 1,
  "errors": []
}
```

## 🎉 Prueba Exitosa

Si todas las pruebas pasan:
- ✅ Los eventos se crean correctamente en Google Calendar
- ✅ Los cambios en Calendar se reflejan en la app
- ✅ Las tareas se actualizan en Google Sheets
- ✅ Los mensajes de éxito/error se muestran correctamente
- ✅ La UI se actualiza después de sincronizar

---

**Nota:** La sincronización es manual por ahora. Para automatizarla, se necesitaría:
- Webhooks de Google Calendar (push notifications)
- O un cron job que sincronice periódicamente

