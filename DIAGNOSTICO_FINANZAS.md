# Diagnóstico del Módulo de Finanzas

## Problemas Identificados

### 1. ❌ Importación de Filas Inválidas (Meses y Headers)

**Problema:**
El CSV exportado muestra que se están importando filas como:
- `"RESUMEN MENSUAL"` (línea 14)
- `"Mes"` (línea 15)
- `"November 2025"`, `"December 2025"`, etc. (líneas 16-25)

Estas NO son suscripciones, son:
- Headers de resumen mensual
- Filas de totales/proyecciones del Excel

**Causa:**
El filtro en `app/api/finance/route.ts` (líneas 136-138) debería filtrar estos, pero:
1. El filtro solo funciona en la **importación** (`import_legacy`), no en el **GET** que lee datos existentes
2. Si los datos ya se importaron antes de que el filtro existiera, quedaron en la base
3. El filtro no está validando al leer desde Sheets (GET endpoint)

**Ubicación del código:**
- Filtro de importación: `app/api/finance/route.ts:132-144`
- Lectura sin filtro: `app/api/finance/route.ts:26-49`

**Solución necesaria:**
- Agregar filtro en el GET para excluir estas filas al leer desde Sheets
- Script de limpieza para eliminar registros inválidos existentes

---

### 2. ❌ Gastos Variables/Extras Faltantes

**Problema:**
No hay forma clara de registrar y visualizar:
- **Gastos variables mensuales** de suscripciones (ej: Claude con uso variable)
- **Gastos extras** que aparecen en las hojas mensuales del Excel ("REGISTRO DE GASTOS")
- **Importación** de estos gastos desde las hojas mensuales del Excel original

**Estructura del Excel original:**
- Hoja "OVERVIEW": Suscripciones fijas
- Hojas mensuales (Nov 2025, Dec 2025, etc.): "REGISTRO DE GASTOS" con:
  - Gastos variables de suscripciones (ej: Claude $50 extra este mes)
  - Gastos one-off
  - Total mensual

**Estado actual:**
- ✅ Tipo `Transaction` con `kind: 'extra'` existe
- ❌ No hay importación de hojas mensuales
- ❌ No hay vista/filtros para ver gastos variables por mes
- ❌ No hay forma fácil de registrar "gasto extra de Claude este mes"

**Solución necesaria:**
1. Importar hojas mensuales del Excel (REGISTRO DE GASTOS)
2. Crear transacciones con `kind: 'extra'` y `subscriptionId` vinculado
3. Vista de transacciones con filtros por mes/tipo/suscripción

---

### 3. ❌ Visualización y Filtrado Limitado

**Problema:**
El dashboard actual solo muestra:
- Lista de suscripciones activas
- Próximos 3 pagos
- Proyección mensual (fixed + variable)

**Falta:**
- ❌ Tabla completa de transacciones
- ❌ Filtros por:
  - Mes/Año
  - Tipo (fixed/extra/one_off)
  - Categoría
  - Suscripción vinculada
  - Estado (pending/approved/paid)
- ❌ Vista de calendario mensual
- ❌ Gráficos/tendencias
- ❌ Búsqueda de transacciones

**Solución necesaria:**
- Componente `TransactionsTable` con filtros
- Vista de calendario mensual
- Búsqueda y ordenamiento

---

### 4. ❌ Subida de Comprobantes

**Problema:**
Actualmente solo hay campo `receiptUrl` (texto), pero:
- ❌ No hay upload de archivos
- ❌ No hay integración con Google Drive para subir
- ❌ No hay preview de comprobantes

**Solución necesaria:**
- Endpoint para upload a Google Drive
- UI para drag & drop o selección de archivo
- Preview de comprobantes subidos
- Generar link automático en `receiptUrl`

---

### 5. ❌ Export Básico

**Problema:**
El export actual (`handleExportReport` en FinanceDashboard) solo exporta:
- Suscripciones básicas (Platform, Category, Cost, etc.)
- Formato CSV simple

**Falta:**
- ❌ Export de transacciones
- ❌ Export por rango de fechas
- ❌ Formato PDF profesional
- ❌ Incluir detalles del crew (owner, users)
- ❌ Totales y resúmenes

---

### 6. ❌ Edición/Eliminación No Implementada

**Problema:**
Los métodos en `store.ts` están definidos pero no implementados:
- `updateSubscription` - solo console.log
- `updateTransaction` - solo console.log
- `deleteSubscription` - solo console.log
- `deleteTransaction` - solo console.log

**Falta:**
- ❌ Endpoints PUT/DELETE en `/api/finance`
- ❌ UI para editar/eliminar en modales
- ❌ Confirmación antes de eliminar

---

## Resumen de Funcionalidades Faltantes

### Críticas (Bloquean uso básico):
1. ✅ **Filtro en GET** para excluir filas inválidas
2. ✅ **Importación de gastos variables** desde hojas mensuales
3. ✅ **Vista de transacciones** con filtros

### Importantes (Mejoran experiencia):
4. ✅ **Upload de comprobantes** a Google Drive
5. ✅ **Edición/Eliminación** de suscripciones y transacciones
6. ✅ **Export mejorado** (PDF, rangos, detalles)

### Deseables (Nice to have):
7. ✅ **Calendario mensual** de gastos
8. ✅ **Gráficos y tendencias**
9. ✅ **Búsqueda avanzada**

---

## Archivos a Modificar

### Backend:
- `app/api/finance/route.ts` - Agregar filtro GET, PUT, DELETE, upload endpoint
- `lib/google-sheets.ts` - Métodos para leer hojas mensuales

### Frontend:
- `components/Finance/FinanceDashboard.tsx` - Agregar tabla de transacciones, filtros
- `components/Finance/TransactionModal.tsx` - Mejorar UI
- `components/Finance/SubscriptionModal.tsx` - Agregar edición/eliminación
- `lib/store.ts` - Implementar métodos de actualización/eliminación

### Nuevos Componentes:
- `components/Finance/TransactionsTable.tsx` - Tabla con filtros
- `components/Finance/ReceiptUpload.tsx` - Upload de comprobantes
- `components/Finance/MonthlyCalendar.tsx` - Vista calendario

---

## Próximos Pasos Sugeridos

1. **Fase 1 - Limpieza y Filtros:**
   - Agregar filtro en GET para excluir filas inválidas
   - Script de limpieza de datos existentes
   - Validación al crear suscripciones

2. **Fase 2 - Gastos Variables:**
   - Importar hojas mensuales del Excel
   - Crear transacciones con `kind: 'extra'`
   - Vista de transacciones con filtros

3. **Fase 3 - Funcionalidades Avanzadas:**
   - Upload de comprobantes
   - Edición/Eliminación
   - Export mejorado




