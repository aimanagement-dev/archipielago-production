# 📋 Reporte de Migración Git - Archipiélago Production OS

**Fecha:** 2025-12-03  
**Realizado por:** AI Management  
**Proyecto:** archipielago-production  
**Repositorio:** https://github.com/aimanagement-dev/archipielago-production

---

## 🎯 Objetivo

Migrar completamente el proyecto de referencias personales a la cuenta corporativa de AI Management, eliminando todas las referencias a cuentas personales anteriores.

---

## ✅ Cambios Realizados

### 1. Configuración de Git

#### Antes:
- **Nombre:** Fedeberonio
- **Email:** fberon@gmail.com
- **Usuario GitHub:** aimanagement-dev (con token personal anterior)

#### Después:
- **Nombre:** AI Management
- **Email:** ai.management@archipielagofilm.com
- **Usuario GitHub:** aimanagement-dev
- **Token:** Configurado nuevo token de acceso personal

#### Comandos ejecutados:
```bash
# Configuración global
git config --global user.name "AI Management"
git config --global user.email "ai.management@archipielagofilm.com"

# Configuración local del proyecto
git config user.name "AI Management"
git config user.email "ai.management@archipielagofilm.com"

# Actualización del remote con nuevo token
# git remote set-url origin https://TU_TOKEN@github.com/aimanagement-dev/archipielago-production.git
# (Posteriormente removido de la URL por seguridad)
# Nota: Reemplaza TU_TOKEN con el token de acceso personal
```

---

### 2. Cambios en Datos del Proyecto

#### `data/team.json`
**Cambio:** Actualización de miembro del equipo
- **Antes:** `"name": "Fede Berón"`
- **Después:** `"name": "AI Management"`
- **Rol:** AI Project Manager QA (sin cambios)
- **ID:** m6 (sin cambios)

#### `data/tasks.json`
**Cambio:** Actualización de responsables en tareas
- **Total de ocurrencias reemplazadas:** 8
- **Antes:** `"Fede"` en arrays de `responsible`
- **Después:** `"AI Management"` en arrays de `responsible`

**Tareas afectadas:**
- t8: "Definir workflow V1" - `["Fede", "Cindy"]` → `["AI Management", "Cindy"]`
- t11: "Pruebas de integración de actores - LoRA" - `["Fede", "Cindy", "AI Artist"]` → `["AI Management", "Cindy", "AI Artist"]`
- t12: "Pruebas lip-sync" - `["Fede", "Cindy", "AI Artist"]` → `["AI Management", "Cindy", "AI Artist"]`
- t13: "Pruebas mocap (opcional)" - `["Fede", "Cindy", "AI Artist"]` → `["AI Management", "Cindy", "AI Artist"]`
- t14: "Pruebas green screen" - `["Fede", "Cindy", "AI Artist"]` → `["AI Management", "Cindy", "AI Artist"]`
- t19: "Workflow V2" - `["Fede", "Cindy"]` → `["AI Management", "Cindy"]`
- t20: "Plan de ejecución definitivo / RODAJE" - `["Fede"]` → `["AI Management"]`
- t24: "Integración de prompt army" - `["Diego Amando", "Fede"]` → `["Diego Amando", "AI Management"]`

---

### 3. Commits Realizados

#### Commit principal:
```
commit 76de8ff
Author: AI Management <ai.management@archipielagofilm.com>
Date: 2025-12-03

chore: Eliminar todas las referencias a Fedeberonio - Actualizar a AI Management

Archivos modificados:
- data/team.json
- data/tasks.json
- GEMINI_SETUP.md
- ROADMAP.md
- app/api/debug/env/route.ts
```

---

## 🔐 Información de Acceso

### Token de Acceso Personal
- **Nombre:** Archipielago Production Deploy
- **Scope:** `repo` (acceso completo a repositorios)
- **Cuenta:** aimanagement-dev

**⚠️ IMPORTANTE:** 
- El token está configurado en las credenciales de Git local
- **NO está incluido en este documento por seguridad**
- Contacta al administrador del proyecto para obtener el token
- O crea uno nuevo en: https://github.com/settings/tokens/new

---

## 📝 Configuración Actual del Repositorio

### Remote:
```
origin  https://github.com/aimanagement-dev/archipielago-production.git
```

### Configuración Git Local:
```bash
user.name = "AI Management"
user.email = "ai.management@archipielagofilm.com"
```

### Branch Principal:
- `main` (actualizado y sincronizado)

---

## 🚀 Instrucciones para Otros Desarrolladores

### Para configurar el proyecto en una nueva máquina:

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/aimanagement-dev/archipielago-production.git
   cd archipielago-production
   ```

2. **Configurar Git (si no está configurado globalmente):**
   ```bash
   git config user.name "AI Management"
   git config user.email "ai.management@archipielagofilm.com"
   ```

3. **Configurar autenticación:**
   - Opción A: Usar token en la URL (temporal):
     ```bash
     git remote set-url origin https://TU_TOKEN_AQUI@github.com/aimanagement-dev/archipielago-production.git
     ```
     **Nota:** Reemplaza `TU_TOKEN_AQUI` con el token de acceso personal. Contacta al administrador del proyecto para obtenerlo.
   
   - Opción B: Usar credenciales de Git (recomendado):
     ```bash
     git config credential.helper store
     # En el primer push, Git pedirá usuario y contraseña
     # Usuario: aimanagement-dev
     # Contraseña: [Token de acceso personal - solicitar al administrador]
     ```

4. **Verificar configuración:**
   ```bash
   git config user.name
   git config user.email
   git remote -v
   ```

5. **Instalar dependencias:**
   ```bash
   npm install
   ```

6. **Verificar que todo funciona:**
   ```bash
   npm run build
   ```

---

## ✅ Verificaciones Realizadas

- [x] No quedan referencias a "Fedeberonio" en el código
- [x] No quedan referencias a "fberon@gmail.com" en el código
- [x] No quedan referencias a "Fede" como nombre personal en datos
- [x] Todos los commits futuros usarán "AI Management <ai.management@archipielagofilm.com>"
- [x] Token configurado y funcional
- [x] Cambios pusheados a GitHub
- [x] Repositorio sincronizado

---

## 📊 Estado del Repositorio

- **Último commit:** 76de8ff
- **Branch:** main
- **Estado:** Sincronizado con origin/main
- **Archivos modificados:** 5
- **Líneas cambiadas:** +12 / -9

---

## 🔄 Próximos Pasos Recomendados

1. **Para el nuevo desarrollador:**
   - Clonar el repositorio siguiendo las instrucciones arriba
   - Verificar que puede hacer push/pull correctamente
   - Configurar su entorno de desarrollo local

2. **Para el equipo:**
   - Todos los commits deben usar: `AI Management <ai.management@archipielagofilm.com>`
   - Mantener consistencia en nombres de responsables en datos
   - No hardcodear tokens en el código

3. **Seguridad:**
   - El token debe ser rotado periódicamente
   - **NUNCA** compartir el token públicamente o en el código
   - Usar variables de entorno cuando sea posible
   - El token actual está guardado de forma segura en credenciales locales
   - Para obtener el token, contacta a: ai.management@archipielagofilm.com

---

## 📞 Contacto

Para preguntas sobre esta migración:
- **Email:** ai.management@archipielagofilm.com
- **Repositorio:** https://github.com/aimanagement-dev/archipielago-production

---

## 📅 Historial de Cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2025-12-03 | Migración completa a AI Management | AI Management |

---

**Documento generado:** 2025-12-03  
**Versión:** 1.0

