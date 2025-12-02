#!/bin/bash

# 🚀 Script de Deployment Rápido para Archipiélago
# Este script prepara tu proyecto para deployment en Vercel

echo "🎬 Archipiélago - Preparación para Deployment"
echo "=============================================="
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encuentra package.json"
    echo "Por favor ejecuta este script desde la raíz del proyecto"
    exit 1
fi

echo "✅ Proyecto detectado: Archipiélago Production OS"
echo ""

# 1. Verificar build
echo "📦 Paso 1/4: Verificando build..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error en el build. Por favor corrige los errores antes de deployar."
    exit 1
fi
echo "✅ Build exitoso"
echo ""

# 2. Inicializar git si no existe
if [ ! -d ".git" ]; then
    echo "🔧 Paso 2/4: Inicializando Git..."
    git init
    git add .
    git commit -m "Initial commit - Archipiélago Production OS v2.5.0"
    echo "✅ Git inicializado"
else
    echo "✅ Paso 2/4: Git ya está inicializado"
fi
echo ""

# 3. Mostrar instrucciones
echo "🌐 Paso 3/4: Opciones de Deployment"
echo ""
echo "OPCIÓN A - Deploy con Vercel CLI (Rápido):"
echo "  1. Instalar: npm install -g vercel"
echo "  2. Login: vercel login"
echo "  3. Deploy: vercel --prod"
echo ""
echo "OPCIÓN B - Deploy con GitHub + Vercel (Recomendado):"
echo "  1. Crea un repo en GitHub: https://github.com/new"
echo "  2. Ejecuta estos comandos:"
echo "     git remote add origin https://github.com/TU_USUARIO/TU_REPO.git"
echo "     git branch -M main"
echo "     git push -u origin main"
echo "  3. Ve a vercel.com"
echo "  4. Import project from GitHub"
echo "  5. Click Deploy"
echo ""

# 4. Verificar credenciales
echo "🔐 Paso 4/4: Credenciales de Prueba"
echo ""
echo "Admin:"
echo "  Email: admin@archipielago.com"
echo "  Password: admin123"
echo ""
echo "User:"
echo "  Email: user@archipielago.com"
echo "  Password: user123"
echo ""

echo "=============================================="
echo "✨ Proyecto listo para deployment!"
echo "📖 Ver DEPLOYMENT_GUIDE.md para más detalles"
echo "=============================================="
