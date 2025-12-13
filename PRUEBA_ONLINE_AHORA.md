# 🚀 PRUEBA ONLINE - Sincronización Bidireccional

## ✅ Cambios Desplegados

Los cambios han sido pusheados a `main` y Vercel debería estar desplegando automáticamente.

**Commit:** `daf14dc` - feat: Implementar sincronización bidireccional con Google Calendar

## 🔗 URL de Producción

```
https://archipielago-production.vercel.app
```

## ⏱️ Tiempo de Deploy

Vercel normalmente tarda **2-3 minutos** en desplegar. Puedes verificar el estado en:
- Dashboard: https://vercel.com/aimanagements-projects/archipielago-production
- O esperar y probar directamente

## 🧪 Pasos para Probar Online

### 1. Abrir la Aplicación
```
https://archipielago-production.vercel.app
```

### 2. Hacer Login
- Click en "Sign in with Google"
- Usar cuenta: `ai.management@archipielagofilm.com`

### 3. Ir a la Página de Calendario
```
https://archipielago-production.vercel.app/calendar
```

### 4. Probar Sincronización App → Calendar

1. **Crear una tarea de prueba:**
   - Click en botón "Evento" (o "+")
   - Llenar:
     - Título: "Prueba Sync Bidireccional"
     - Fecha: Hoy o mañana
     - Hora: 10:00
     - Área: Planificación
   - Guardar

2. **Sincronizar hacia Calendar:**
   - Click en botón **"→ Calendar"** (flecha hacia arriba, icono RefreshCw)
   - Esperar mensaje de éxito
   - Debería mostrar: "✅ Sincronización hacia Calendar completa: X creadas"

3. **Verificar en Google Calendar:**
   - Abrir Google Calendar
   - Buscar el evento "Prueba Sync Bidireccional"
   - Verificar que tenga la fecha y hora correctas
   - Verificar que la descripción incluya área y estado

### 5. Probar Sincronización Calendar → App

1. **Modificar evento en Google Calendar:**
   - Abrir Google Calendar
   - Buscar el evento que acabas de crear
   - Cambiar el título a "Prueba Sync Bidireccional - MODIFICADO"
   - Cambiar la hora a 14:00
   - Guardar cambios

2. **Sincronizar desde Calendar:**
   - Volver a la app
   - Click en botón **"← Calendar"** (flecha hacia abajo, icono RefreshCw rotado)
   - Esperar mensaje de éxito
   - Debería mostrar: "✅ Sincronización desde Calendar completa: X eventos encontrados, X actualizados"

3. **Verificar cambios en la app:**
   - La tarea debería mostrar el nuevo título
   - La hora debería ser 14:00
   - Los cambios deberían estar guardados

### 6. Probar en Página de Tareas

1. **Ir a `/tasks`:**
   ```
   https://archipielago-production.vercel.app/tasks
   ```

2. **Verificar botones de sincronización:**
   - Deberías ver dos botones:
     - "→ Calendar" (sincronizar hacia Calendar)
     - "← Calendar" (sincronizar desde Calendar)

3. **Probar sincronización desde aquí también**

## ✅ Checklist de Verificación

- [ ] App carga correctamente
- [ ] Login funciona
- [ ] Botones de sincronización visibles en `/calendar`
- [ ] Botones de sincronización visibles en `/tasks`
- [ ] Sincronización App → Calendar funciona
- [ ] Eventos aparecen en Google Calendar
- [ ] Sincronización Calendar → App funciona
- [ ] Cambios en Calendar se reflejan en la app
- [ ] Mensajes de éxito/error se muestran correctamente
- [ ] Las tareas se recargan automáticamente después de sincronizar

## 🐛 Si Algo No Funciona

### Error: "Unauthorized"
- **Causa:** No hay sesión activa
- **Solución:** Hacer login de nuevo

### Error: "No se pudo sincronizar"
- **Causa:** Permisos de Google Calendar no otorgados
- **Solución:** 
  1. Ir a Google Account Settings
  2. Security → Third-party apps
  3. Verificar que la app tenga permisos de Calendar

### Los botones no aparecen
- **Causa:** El deploy aún no terminó o hay error de build
- **Solución:** 
  1. Verificar en Vercel Dashboard que el deploy terminó
  2. Verificar que no haya errores de build
  3. Hard refresh del navegador (Cmd+Shift+R o Ctrl+Shift+R)

### Los cambios no se reflejan
- **Causa:** Cache del navegador o error en la sincronización
- **Solución:**
  1. Hard refresh del navegador
  2. Verificar logs de Vercel
  3. Verificar que las variables de entorno estén configuradas

## 📊 Verificar Estado del Deploy

1. **Ir a Vercel Dashboard:**
   ```
   https://vercel.com/aimanagements-projects/archipielago-production
   ```

2. **Verificar:**
   - Último deployment está en "Ready" (verde)
   - No hay errores de build
   - El commit es `daf14dc`

3. **Si hay errores:**
   - Click en el deployment
   - Ver logs de build
   - Verificar variables de entorno

## 🎉 ¡Listo para Probar!

Los cambios están desplegados. Solo necesitas:
1. Esperar 2-3 minutos para que termine el deploy
2. Abrir la app en producción
3. Hacer login
4. Probar los botones de sincronización bidireccional

---

**Fecha:** $(date)
**Commit:** daf14dc
**Estado:** ✅ Desplegado

