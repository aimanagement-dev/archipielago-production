# 🗺️ Roadmap - Archipiélago Production OS

## 🔴 PRIORIDAD CRÍTICA (Hacer AHORA)

### 1. Fix GEMINI_API_KEY en Producción
**Estado:** ⚠️ Variable configurada pero no aplicada en runtime  
**Acción:** Redeploy manual desde Vercel dashboard sin cache  
**Tiempo estimado:** 5 minutos  
**Bloquea:** Funcionalidad completa del asistente de IA

---

## 🟠 PRIORIDAD ALTA (Esta semana)

### 2. Autenticación en API Routes
**Estado:** ✅ Completado
**Por qué:** Seguridad crítica - las APIs están expuestas sin protección  
**Implementación:**
```typescript
// lib/api-auth.ts
export function requireAdmin(request: NextRequest) {
  // Verificar token/sesión
  // Verificar rol admin
  // Lanzar error 403 si no es admin
}
```

**Aplicar en:**
- `/api/gemini/chat` - Solo usuarios autenticados
- `/api/google/calendar/sync` - Solo admins
- Cualquier endpoint que modifique datos

**Tiempo estimado:** 2-3 horas

### 3. Probar y Validar Gemini
**Después de fix:**
- Probar con preguntas reales del proyecto
- Validar que el contexto se envía correctamente
- Ajustar prompts si es necesario
- Documentar casos de uso

**Tiempo estimado:** 1 hora

---

## 🟡 PRIORIDAD MEDIA (Próximas 2 semanas)

### 4. Google Calendar Integration
**Estado:** Código listo, falta configurar env vars  
**Requisitos:**
- Service account con permisos de edición
- `GOOGLE_CALENDAR_ID` configurado
- Probar sincronización bidireccional

**Tiempo estimado:** 3-4 horas

### 5. ESLint + Prettier
**Configuración:**
```bash
npm install -D eslint-config-next prettier
```

**Archivos:**
- `.eslintrc.json` - Preset Next.js
- `.prettierrc` - Configuración consistente
- Scripts en `package.json`

**Tiempo estimado:** 1 hora

---

## 🟢 PRIORIDAD BAJA (Futuro)

### 6. Backend y Persistencia
**Decisión requerida:**
- ¿LocalStorage es suficiente por ahora?
- ¿Necesitas multi-usuario real-time?
- ¿Quieres historial de cambios?

**Opciones:**
- **Supabase:** Fácil, rápido, buen DX
- **Prisma + Postgres:** Más control, más setup
- **Mantener localStorage:** Simple, pero limitado

**Recomendación:** Si localStorage funciona, mantenerlo hasta que realmente necesites backend.

**Tiempo estimado:** 1-2 semanas (depende de opción)

### 7. Gemini Vertex AI (Opcional)
**Por qué considerar:**
- Mejor para producción enterprise
- Más control y cuotas
- Integración con Google Cloud

**Cuándo:** Solo si necesitas más control o cuotas mayores

**Tiempo estimado:** 1 semana

---

## 📊 Resumen de Prioridades

| Prioridad | Tarea | Tiempo | Bloquea |
|-----------|-------|--------|---------|
| 🔴 Crítica | Fix GEMINI_API_KEY | 5 min | Asistente IA |
| 🟠 Alta | API Auth | 2-3h | Seguridad |
| 🟠 Alta | Validar Gemini | 1h | Confianza |
| 🟡 Media | Google Calendar | 3-4h | Feature opcional |
| 🟡 Media | ESLint/Prettier | 1h | Calidad código |
| 🟢 Baja | Backend/Persistencia | 1-2 sem | Escalabilidad |

---

## 🎯 Recomendación de Orden

1. **HOY:** Fix GEMINI_API_KEY (redeploy manual)
2. **Esta semana:** API Auth + Validar Gemini
3. **Próximas 2 semanas:** Google Calendar + ESLint
4. **Futuro:** Evaluar backend solo si es necesario

---

## 💡 Notas Importantes

- **No apresurarse con backend:** Si localStorage funciona, mantenerlo
- **Seguridad primero:** API Auth es crítico antes de producción real
- **Gemini funciona bien:** No necesitas Vertex AI a menos que tengas necesidades específicas
- **Google Calendar es opcional:** El error no bloquea la app

---

**Última actualización:** 2025-12-02




