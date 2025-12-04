# Archipiélago - Production Management System

## 🎬 Sistema de Gestión de Producción Cinematográfica

Sistema completo de gestión para producción de cine con autenticación, calendario, tareas, equipo y gates de producción.

### ✨ Características Principales

- 🔐 **Autenticación** con roles (Admin/User)
- 📅 **Calendario** con eventos programados y vista de tareas en curso
- 📋 **Gestión de Tareas** con agrupación por mes/semana/área/estado
- 👥 **Gestión de Equipo** con información de contacto
- 🎯 **Production Gates** con estados y entregables
- 🤖 **AI Assistant** para consultas del proyecto
- 📊 **Dashboard** interactivo con métricas en tiempo real

### 🚀 Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Framer Motion
- **State**: Zustand con persistencia
- **UI**: Componentes personalizados con Glassmorphism
- **Icons**: Lucide React

### 📦 Instalación

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Build producción
npm run build

# Iniciar producción
npm start
```

### 🔐 Autenticación

Este proyecto usa **Google OAuth** para autenticación. 

**Cuenta autorizada:**
- Email: `ai.management@archipielagofilm.com`

**Nota:** Solo usuarios con esta cuenta pueden acceder al sistema. La autenticación se realiza a través de Google OAuth.

### 📁 Estructura del Proyecto

```
app/
├── login/          # Página de login
├── admin/          # Panel de administración
├── calendar/       # Calendario de producción
├── tasks/          # Gestión de tareas
├── team/           # Gestión de equipo
├── gates/          # Production gates
└── page.tsx        # Dashboard principal

components/
├── Layout/         # Componentes de layout
├── Dashboard/      # Componentes del dashboard
├── Tasks/          # Componentes de tareas
├── Team/           # Componentes de equipo
├── Gates/          # Componentes de gates
└── AIAssistant.tsx # Asistente AI

lib/
├── auth.ts         # Sistema de autenticación
├── store.ts        # Store de Zustand
├── types.ts        # Definiciones TypeScript
└── utils.ts        # Utilidades
```

### 🎯 Funcionalidades por Rol

#### Admin (Control Total)
- ✅ Crear/editar/eliminar tasks
- ✅ Crear/editar/eliminar gates
- ✅ Crear/editar/eliminar miembros del equipo
- ✅ Programar eventos en calendario
- ✅ Acceso al panel de administración

#### User (Vista y Actualización)
- ✅ Ver todas las secciones
- ✅ Actualizar estado de tareas
- ❌ Crear/eliminar contenido

### 📅 Sistema de Calendario

- **Vista Mes**: Grid completo del mes
- **Vista Semana**: 7 días con detalles
- **Vista Día**: Timeline horario
- **Panel Lateral**: Tareas en curso por departamento

Solo muestra tareas con fecha programada específica.

### 🎨 Tema

Diseño dark cinematográfico con:
- Glassmorphism
- Gradientes dorados (primary color)
- Animaciones suaves
- Responsive design

### 🌐 Deploy

La app está optimizada para Vercel:

```bash
# Deploy en Vercel
vercel

# O conectar repositorio GitHub a Vercel
```

Ver [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) para instrucciones detalladas.

### 📄 Documentación

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Guía de deployment
- [ADMIN_CONTROL.md](./ADMIN_CONTROL.md) - Control de administrador
- [NUEVAS_FUNCIONES.md](./NUEVAS_FUNCIONES.md) - Nuevas funcionalidades
- [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md) - Resumen del sistema

### 🔧 Scripts Disponibles

```bash
npm run dev      # Desarrollo en http://localhost:3000
npm run build    # Build de producción
npm start        # Servidor de producción
npm run lint     # Linting
```

### 💾 Persistencia

Los datos se guardan en localStorage:
- `arch-pm-storage`: Datos de la app (tasks, team, gates)
- `auth-storage`: Estado de autenticación

### 🛠️ Tecnologías Adicionales

- `date-fns`: Manejo de fechas
- `framer-motion`: Animaciones
- `clsx`: Utilidades CSS
- `tailwindcss-animate`: Animaciones Tailwind

### 🔗 Integraciones

- **Google Calendar (one-way)**: botón "Sync Google Calendar" en `Tasks` envía tareas programadas al calendario configurado. Requiere variables de entorno:
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
  - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (usa `\n` para saltos de línea)
  - `GOOGLE_CALENDAR_ID` (ID del calendario destino)
  - `GOOGLE_CALENDAR_TIMEZONE` (opcional, ej. `America/New_York`)

---

**Versión**: 2.5.0  
**Proyecto**: Archipiélago  
**Cliente**: Lantica Studios  
**Build**: ✅ Ready for Production
