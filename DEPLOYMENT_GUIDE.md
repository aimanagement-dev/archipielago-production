# 🚀 Guía de Deployment - Archipiélago Online

## ✅ Resumen
Tu app está lista para ser desplegada online **GRATIS** usando **Vercel**.

---

## 🎯 Opción Recomendada: VERCEL (100% Gratis)

### ¿Por qué Vercel?
- ✅ **Gratis** - Plan gratuito muy generoso
- ✅ **Perfecto para Next.js** - Creado por los mismos desarrolladores
- ✅ **Deploy en 2 minutos** - Super rápido
- ✅ **HTTPS automático** - Certificado SSL gratis
- ✅ **Dominio gratis** - Recibes un dominio `.vercel.app`
- ✅ **Updates automáticos** - Cada push a GitHub se despliega solo

---

## 📝 PASO A PASO - Deploy en Vercel

### OPCIÓN 1: Deploy Directo (Más Rápido - 2 minutos)

#### Paso 1: Crear cuenta en Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Click en **"Sign Up"**
3. Elige **"Continue with GitHub"** (recomendado)
4. Autoriza Vercel a acceder a tus repositorios

#### Paso 2: Subir código a GitHub (si no lo has hecho)
```bash
# En la terminal, desde la carpeta del proyecto:
cd "/Users/aimac/Documents/arch-pm ANTIGRAVITY"

# Inicializar git (si no está inicializado)
git init

# Agregar todos los archivos
git add .

# Commit inicial
git commit -m "Initial commit - Archipiélago Production OS"

# Crear repositorio en GitHub:
# 1. Ve a github.com
# 2. Click en "New repository"
# 3. Nombre: "archipielago-production"
# 4. NO marques "Initialize with README"
# 5. Click "Create repository"

# Conectar y subir (reemplaza con tu URL)
git remote add origin https://github.com/TU_USUARIO/archipielago-production.git
git branch -M main
git push -u origin main
```

#### Paso 3: Deploy en Vercel
1. En Vercel, click **"Add New..."** → **"Project"**
2. **Import Git Repository** → Selecciona tu repo de GitHub
3. Vercel detecta automáticamente que es Next.js
4. **Framework Preset**: Next.js (ya seleccionado)
5. **Root Directory**: `./` (dejar por defecto)
6. **Build Command**: `npm run build` (ya configurado)
7. Click **"Deploy"** 🚀

#### Paso 4: ¡Listo!
- Vercel construye y despliega tu app (2-3 minutos)
- Te da una URL tipo: `https://archipielago-production.vercel.app`
- ¡Ya está online! 🎉

---

### OPCIÓN 2: Deploy sin GitHub (CLI de Vercel)

Si no quieres usar GitHub:

```bash
# Instalar Vercel CLI
npm install -g vercel

# Desde la carpeta del proyecto
cd "/Users/aimac/Documents/arch-pm ANTIGRAVITY"

# Login
vercel login

# Deploy
vercel

# Seguir las instrucciones:
# - Set up and deploy? Y
# - Which scope? (tu cuenta)
# - Link to existing project? N
# - Project name? archipielago-production
# - In which directory is your code? ./
# - Auto-detected Next.js. Correct? Y
# - Override settings? N

# Para deploy a producción:
vercel --prod
```

---

## 🔧 Configuraciones Importantes

### Variables de Entorno (Opcional)
Crea archivo `.env.local` si necesitas variables:

```env
NEXT_PUBLIC_APP_NAME=Archipiélago
NEXT_PUBLIC_VERSION=2.5.0
```

En Vercel:
1. Ve a **Settings** → **Environment Variables**
2. Agrega las variables necesarias

---

## 🌐 Alternativas a Vercel

### 1. **Netlify**
- También gratis
- Muy similar a Vercel
- Instrucciones: [netlify.com](https://www.netlify.com)

### 2. **Railway**
- Gratis por 5$ de crédito al mes
- Bueno para apps con backend
- [railway.app](https://railway.app)

### 3. **Render**
- Free tier disponible
- [render.com](https://render.com)

---

## ✅ Checklist Pre-Deploy

Antes de deployar, verifica:

- [x] ✅ `npm run build` funciona sin errores
- [x] ✅ No hay errores de TypeScript
- [x] ✅ El proyecto es Next.js 14+
- [x] ✅ Todas las dependencias están en package.json
- [ ] 📝 (Opcional) README.md actualizado
- [ ] 🔒 (Opcional) Variables de entorno configuradas
- [ ] 🎨 (Opcional) Favicon personalizado

---

## 🎯 Después del Deploy

### Compartir tu app:
```
Tu app estará en:
https://TU-PROYECTO.vercel.app

Autenticación:
Este proyecto usa Google OAuth. La cuenta autorizada es:
ai.management@archipielagofilm.com
```

### Dominio personalizado (Opcional):
1. En Vercel → Settings → Domains
2. Agregar tu dominio (ej: archipielago.com)
3. Configurar DNS según instrucciones
4. Vercel maneja HTTPS automáticamente

### Updates automáticos:
Cada vez que hagas `git push`:
```bash
git add .
git commit -m "Actualización: nuevas features"
git push
```
Vercel automáticamente:
1. Detecta el push
2. Construye la nueva versión
3. La despliega en producción
4. Te notifica cuando termina

---

## 🐛 Troubleshooting

### Error: "Build failed"
```bash
# Verificar que build funciona localmente
npm run build

# Si funciona local pero falla en Vercel:
# 1. Check Node version en Vercel (Settings → General)
# 2. Debe ser Node 18.x o superior
```

### Error: "Module not found"
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Datos no persisten
- Los datos están en localStorage (lado del cliente)
- Cada usuario mantiene sus propios datos
- Para persistencia real, necesitarías un backend

---

## 💡 Tips Profesionales

### 1. Preview Deployments
Vercel crea un preview único para cada branch:
- Branch `main` → Producción
- Branch `dev` → Preview de desarrollo
- Pull requests → Preview automático

### 2. Analytics
Vercel incluye analytics gratis:
- Project → Analytics
- Ve visitas, performance, etc.

### 3. Logs
Ver logs en tiempo real:
- Project → Deployments → Select deployment → Logs

---

## 📱 Resultado Final

Tu app estará disponible 24/7 en:
```
https://archipielago-production.vercel.app
```

Con:
- ✅ HTTPS automático
- ✅ CDN global (carga rápida worldwide)
- ✅ Backups automáticos
- ✅ Updates con cada git push
- ✅ 100% gratis

---

## 🚀 COMANDO RÁPIDO (Todo en uno)

Si ya tienes GitHub configurado:

```bash
# 1. Asegúrate de estar en la carpeta correcta
cd "/Users/aimac/Documents/arch-pm ANTIGRAVITY"

# 2. Commit todo
git add .
git commit -m "Ready for deployment"
git push

# 3. Ve a vercel.com
# 4. Import project from GitHub
# 5. Click Deploy
# ¡Listo en 3 minutos! 🎉
```

---

**Tiempo estimado total: 5-10 minutos**  
**Costo: $0 (100% gratis)**  
**Dificultad: ⭐⭐☆☆☆ (Fácil)**

¿Necesitas ayuda con algún paso? ¡Avísame!
