# 📎 SISTEMA DE ADJUNTOS EN TASKS

## 🔍 DÓNDE SE GUARDAN LOS ADJUNTOS

### 1. **Google Sheets (Metadatos)**
- **Ubicación:** Columna K (índice 10) de la hoja `Tasks`
- **Formato:** JSON stringificado
- **Ejemplo:** `[{"id":"123","name":"archivo.pdf","type":"file","url":"https://drive.google.com/...","addedBy":"user@email.com","addedAt":"2025-01-07T..."}]`
- **Función:** Almacena la información de los attachments (nombre, URL, tipo, etc.)

### 2. **Google Drive (Archivos Físicos)**
- **Carpeta:** `Archipielago_Assets/Task_Attachments/`
- **Creación:** Se crea automáticamente si no existe
- **Función:** Almacena los archivos físicos subidos desde la computadora local
- **Links:** Cada archivo tiene un `webViewLink` permanente que se guarda en Sheets

## 🔄 FLUJO DE GUARDADO

### Archivos desde Google Drive:
1. Usuario selecciona archivo desde Drive Picker
2. Se obtiene el `webViewLink` del archivo
3. Se crea un objeto `Attachment` con el link
4. Se guarda en `formData.attachments`
5. Al guardar la tarea, se serializa a JSON y se guarda en columna K de Sheets

### Archivos Locales (Subida):
1. Usuario selecciona archivo desde su computadora
2. **NUEVO:** Se sube automáticamente a Drive en `/api/drive/upload-task-file`
3. Se crea la carpeta `Task_Attachments` si no existe
4. Se obtiene el `webViewLink` del archivo subido
5. Se crea un objeto `Attachment` con el link permanente
6. Se guarda en `formData.attachments`
7. Al guardar la tarea, se serializa a JSON y se guarda en columna K de Sheets

## 📋 ESTRUCTURA DE DATOS

```typescript
interface Attachment {
  id: string;              // UUID único
  name: string;            // Nombre del archivo
  type: 'file' | 'link';   // Tipo: archivo o link externo
  url: string;             // URL permanente (Drive link o link externo)
  addedBy: string;         // Email del usuario que lo agregó
  addedAt: string;         // ISO timestamp
  size?: number;           // Tamaño en bytes (opcional)
}
```

## ✅ SOLUCIÓN IMPLEMENTADA

### Problema Anterior:
- Los archivos locales se guardaban con `URL.createObjectURL()` que genera URLs temporales
- Estas URLs desaparecen cuando se cierra el navegador
- Los attachments no persistían al reabrir la tarea

### Solución Actual:
- ✅ Todos los archivos locales se suben automáticamente a Google Drive
- ✅ Se guardan en la carpeta `Task_Attachments` dentro de `Archipielago_Assets`
- ✅ Se usa el `webViewLink` permanente de Drive
- ✅ Los attachments se guardan correctamente en la columna K de Sheets como JSON
- ✅ Al cargar la tarea, se parsean correctamente desde Sheets

## 🛠️ ENDPOINTS RELACIONADOS

### `/api/drive/upload-task-file` (POST)
- **Función:** Subir archivo local a Drive
- **Parámetros:** `file` (FormData)
- **Retorna:** `{ success: true, file: { id, name, webViewLink, ... } }`
- **Crea automáticamente:** Carpeta `Task_Attachments` si no existe

### `/api/tasks` (POST/PUT)
- **Función:** Guardar/actualizar tarea con attachments
- **Guarda attachments en:** Columna K de Sheets como JSON stringificado

## 🔍 DEBUGGING

Si los attachments desaparecen:

1. **Verificar en Google Sheets:**
   - Abrir la hoja `Tasks`
   - Verificar columna K (Attachments)
   - Debe contener JSON válido con los attachments

2. **Verificar en Google Drive:**
   - Ir a `Archipielago_Assets/Task_Attachments/`
   - Verificar que los archivos estén ahí

3. **Verificar en consola del navegador:**
   - Buscar errores de parsing JSON
   - Verificar que `row[10]` tenga datos

4. **Verificar logs del servidor:**
   - Buscar `[GoogleSheets] Error parsing attachments`
   - Verificar que los attachments se guarden correctamente

## 📝 NOTAS IMPORTANTES

- Los attachments se guardan como **JSON stringificado** en Sheets
- Los archivos físicos se guardan en **Google Drive**
- Los links de Drive son **permanentes** y no expiran
- La carpeta `Task_Attachments` se crea automáticamente la primera vez que se sube un archivo
