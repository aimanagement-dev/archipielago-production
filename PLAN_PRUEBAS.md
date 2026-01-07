# 🧪 PLAN DE PRUEBAS - Mejoras Implementadas

## ✅ Funcionalidades a Probar

### 1. Notificaciones Automáticas al Crear Tareas
**Objetivo:** Verificar que se envíen emails automáticamente cuando se crea una tarea con responsables asignados.

**Pasos:**
1. Ir a `/tasks`
2. Crear una nueva tarea
3. Asignar al menos un responsable (usar email o ID de team member)
4. Guardar la tarea
5. Verificar que se reciba el email de notificación

**Resultado Esperado:**
- ✅ Tarea se crea correctamente
- ✅ Email se envía a los responsables asignados
- ✅ Email contiene: título, fecha, área, notas, link a la app

---

### 2. Notificaciones al Actualizar Tareas
**Objetivo:** Verificar que se envíen notificaciones cuando se actualiza una tarea con cambios relevantes.

**Pasos:**
1. Abrir una tarea existente
2. Cambiar la fecha programada
3. O agregar/remover responsables
4. O cambiar estado a "Completado"
5. Guardar cambios
6. Verificar que se reciba el email de actualización

**Resultado Esperado:**
- ✅ Tarea se actualiza correctamente
- ✅ Email se envía solo si hay cambios relevantes
- ✅ Email indica qué cambió (fecha, responsables, estado)

---

### 3. Validaciones de Datos
**Objetivo:** Verificar que las validaciones funcionen correctamente.

**Pruebas:**
1. **Fecha inválida:**
   - Intentar crear tarea con fecha `2024-13-45`
   - ✅ Debe mostrar error: "Invalid scheduledDate format"

2. **Hora inválida:**
   - Intentar crear tarea con hora `25:99`
   - ✅ Debe mostrar error: "Invalid scheduledTime format"

3. **Título vacío:**
   - Intentar crear tarea sin título
   - ✅ Debe mostrar error: "Task title is required"

---

### 4. Manejo de Refresh Token
**Objetivo:** Verificar que el manejo de sesión expirada funcione correctamente.

**Pasos:**
1. Esperar a que expire el access token (o simular)
2. Intentar realizar una acción que requiera autenticación
3. Verificar que se muestre mensaje claro de sesión expirada

**Resultado Esperado:**
- ✅ Mensaje claro: "Tu sesión ha expirado. Por favor, cierra sesión y vuelve a iniciar sesión."
- ✅ Usuario puede re-autenticarse sin problemas

---

## 📋 Checklist de Pruebas

### Notificaciones
- [ ] Crear tarea con 1 responsable → Email recibido
- [ ] Crear tarea con múltiples responsables → Todos reciben email
- [ ] Crear tarea con responsable por ID → Email enviado correctamente
- [ ] Crear tarea con responsable por email → Email enviado correctamente
- [ ] Actualizar fecha de tarea → Email de actualización recibido
- [ ] Cambiar responsables → Email recibido por nuevos responsables
- [ ] Completar tarea → Email de notificación recibido

### Validaciones
- [ ] Fecha inválida rechazada
- [ ] Hora inválida rechazada
- [ ] Título vacío rechazado
- [ ] Mensajes de error claros y útiles

### Integración
- [ ] Tarea se guarda en Google Sheets
- [ ] Tarea se sincroniza con Calendar (si tiene fecha)
- [ ] Notificaciones no bloquean creación de tarea si fallan
- [ ] Logs muestran información útil en consola

---

## 🔍 Cómo Verificar Logs

### En Desarrollo (Terminal):
```bash
# Buscar logs de notificaciones
grep "Notificaciones enviadas" logs
grep "Error enviando notificaciones" logs
```

### En Producción (Vercel):
- Ir a Vercel Dashboard → Project → Functions → Logs
- Buscar: `[POST /api/tasks]` o `[PUT /api/tasks]`
- Verificar mensajes de éxito o error

---

## ⚠️ Problemas Conocidos y Soluciones

### Email no se envía
**Posibles causas:**
1. `GOOGLE_CLIENT_SECRET` no configurado
2. Refresh token expirado
3. Email del remitente no tiene permisos de Gmail

**Solución:**
- Verificar variables de entorno en Vercel
- Re-autenticarse si es necesario
- Verificar permisos de Gmail API en Google Cloud Console

### Error "RefreshAccessTokenError"
**Solución:**
- Cerrar sesión y volver a iniciar sesión
- Verificar que `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` estén correctos

---

## 📊 Métricas de Éxito

- ✅ 100% de tareas con responsables reciben notificación
- ✅ 0 errores de validación no capturados
- ✅ Mensajes de error claros y accionables
- ✅ Logs informativos para debugging
