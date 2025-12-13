# 🤖 Gemini puede crear eventos y tareas

## ✅ Funcionalidad Implementada

Gemini ahora puede **crear eventos en Google Calendar** directamente cuando se lo solicitas.

### 🎯 Capacidades

1. **Crear eventos desde conversación natural:**
   - "crea una llamada para hoy a las 4pm"
   - "programa una reunión mañana a las 10am"
   - "agenda una llamada con Juan para el viernes"
   - "crea una tarea para revisar el guión"

2. **Invitar usuarios automáticamente:**
   - Gemini identifica nombres del equipo y busca sus emails
   - Envía invitaciones automáticamente a Google Calendar
   - Los usuarios reciben notificaciones por email

3. **Integración completa:**
   - Los eventos se crean directamente en Google Calendar
   - Se sincronizan automáticamente con la app
   - Se pueden ver en la página de calendario

## 🚀 Cómo Usar

### Ejemplo 1: Crear evento simple
```
Usuario: "crea una llamada para hoy a las 4pm"

Gemini: ✅ Evento creado exitosamente! 
        "Llamada" programada para hoy a las 16:00.
        El evento ha sido agregado a tu calendario de Google.
```

### Ejemplo 2: Crear evento con invitados
```
Usuario: "agenda una reunión con María y Juan para mañana a las 2pm"

Gemini: ✅ Evento creado exitosamente!
        "Reunión" programada para mañana a las 14:00.
        Se han enviado invitaciones a:
        - María (maria@example.com)
        - Juan (juan@example.com)
        Los invitados recibirán notificaciones por email.
```

### Ejemplo 3: Crear evento con descripción
```
Usuario: "crea una llamada de producción para el viernes a las 3pm para revisar el guión"

Gemini: ✅ Evento creado exitosamente!
        "Llamada de producción" programada para el viernes a las 15:00.
        Descripción: "Revisar el guión"
        El evento ha sido agregado a tu calendario.
```

## 🔧 Implementación Técnica

### Function Calling de Gemini

Se implementó **Function Calling** que permite que Gemini:
1. Detecte cuando el usuario quiere crear un evento
2. Extraiga la información (título, fecha, hora, participantes)
3. Llame a la función `createCalendarEvent` automáticamente
4. Confirme al usuario que el evento fue creado

### Archivos Modificados

1. **`app/api/gemini/chat/route.ts`**
   - Agregado Function Calling
   - Procesamiento de llamadas de función
   - Búsqueda automática de emails del equipo

2. **`lib/google/calendar.ts`**
   - Nueva función `createCalendarEventWithAttendees()`
   - Soporte para invitados (attendees)
   - Envío automático de invitaciones por email

3. **`components/AIAssistant.tsx`**
   - Recarga automática de tareas después de crear eventos
   - Mejoras en la UI

## 📋 Formato de Solicitudes

Gemini entiende solicitudes en lenguaje natural:

### Fechas soportadas:
- "hoy" / "today"
- "mañana" / "tomorrow"
- Días de la semana: "viernes", "friday", etc.
- Fechas específicas: "15 de diciembre", "2025-12-15"

### Horas soportadas:
- Formato 12h: "4pm", "10am", "2:30pm"
- Formato 24h: "16:00", "14:30"
- Formato natural: "las 4 de la tarde", "a las 10 de la mañana"

### Invitados:
- Nombres del equipo: "María", "Juan"
- Emails: "maria@example.com"
- Múltiples: "con María y Juan"

## 🎨 Ejemplos de Uso

### Crear evento simple
```
Usuario: crea una llamada para hoy a las 4pm
```

### Crear evento con invitados
```
Usuario: agenda una reunión con el equipo para mañana a las 10am
```

### Crear evento con descripción
```
Usuario: programa una llamada de producción para el viernes a las 3pm para revisar el guión
```

### Crear evento específico
```
Usuario: crea una llamada con María para el 20 de diciembre a las 2pm
```

## ⚠️ Notas Importantes

1. **Permisos requeridos:**
   - El usuario debe tener permisos de Google Calendar
   - Los emails de invitados deben ser válidos

2. **Búsqueda de usuarios:**
   - Gemini busca usuarios del equipo por nombre
   - Si no encuentra el usuario, intentará usar el texto como email
   - Los usuarios deben estar en la lista del equipo

3. **Zona horaria:**
   - Se usa la zona horaria configurada en `GOOGLE_CALENDAR_TIMEZONE`
   - Por defecto: `America/Santo_Domingo`

4. **Duración del evento:**
   - Por defecto: 1 hora
   - Se puede especificar hora de fin en el mensaje

## 🚀 Estado del Deploy

- ✅ Código compilado sin errores
- ✅ Push exitoso a `main`
- ✅ Vercel desplegando automáticamente
- ⏱️ Tiempo estimado: 2-3 minutos

## 🧪 Probar Online

1. Espera 2-3 minutos para que termine el deploy
2. Abre: https://archipielago-production.vercel.app
3. Haz login
4. Abre el asistente de Gemini (botón en esquina inferior derecha)
5. Prueba: "crea una llamada para hoy a las 4pm"
6. Verifica que el evento aparezca en Google Calendar

---

**Fecha de implementación:** $(date)
**Commit:** 49d4b11
**Estado:** ✅ Desplegado

