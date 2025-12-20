#!/bin/bash

# ============================================
# SCRIPT DE DEPLOYMENT AUTOMÁTICO A VERCEL
# ============================================
# Proyecto: Archipiélago Production OS
# Nota: NO guardes credenciales en este repo. Este script lee valores desde variables de entorno.
# ============================================

echo "🚀 Iniciando deployment a Vercel..."
echo ""

# Verificar que vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI no está instalado"
    echo "Instalando Vercel CLI..."
    npm install -g vercel
fi

echo "✅ Vercel CLI instalado"
echo ""

# Login a Vercel (abrirá el navegador)
echo "🔐 Autenticando con Vercel..."
echo "⚠️  IMPORTANTE: Usa tu cuenta de Vercel (esto abrirá el navegador)"
echo ""
# vercel login

# Deploy del proyecto
echo ""
echo "📦 Deploying proyecto..."
echo ""

# Configurar variables de entorno (desde tu terminal, NO desde el repo)
# Requiere que exportes estas variables antes de ejecutar el script:
#   export GOOGLE_CLIENT_ID="..."
#   export GOOGLE_CLIENT_SECRET="..."
#   export NEXTAUTH_SECRET="..."  # recomendado: openssl rand -base64 32
if [[ -z "${GOOGLE_CLIENT_ID:-}" || -z "${GOOGLE_CLIENT_SECRET:-}" || -z "${NEXTAUTH_SECRET:-}" ]]; then
  echo "❌ Faltan variables de entorno requeridas."
  echo "Define GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y NEXTAUTH_SECRET en tu shell y vuelve a ejecutar."
  exit 1
fi

printf "%s" "$GOOGLE_CLIENT_ID" | vercel env add GOOGLE_CLIENT_ID production
printf "%s" "$GOOGLE_CLIENT_SECRET" | vercel env add GOOGLE_CLIENT_SECRET production
printf "%s" "$NEXTAUTH_SECRET" | vercel env add NEXTAUTH_SECRET production

# Deploy a producción
vercel --prod

echo ""
echo "✅ ¡Deployment completado!"
echo ""
echo "📋 PRÓXIMOS PASOS IMPORTANTES:"
echo ""
echo "1. Copia la URL que te dio Vercel (ejemplo: https://arch-pm-xxx.vercel.app)"
echo ""
echo "2. Agrega NEXTAUTH_URL:"
echo "   vercel env add NEXTAUTH_URL production"
echo "   Pega la URL de Vercel cuando te lo pida"
echo ""
echo "3. Redeploy:"
echo "   vercel --prod"
echo ""
echo "4. Actualiza Google OAuth redirect URI:"
echo "   - Ve a: https://console.cloud.google.com"
echo "   - APIs & Services → Credentials"
echo "   - OAuth 2.0 Client ID → Authorized redirect URIs"
echo "   - Agrega: https://tu-url.vercel.app/api/auth/callback/google"
echo ""
echo "5. (Opcional) Agrega GEMINI_API_KEY para el AI Assistant:"
echo "   vercel env add GEMINI_API_KEY production"
echo ""
echo "🎉 ¡Tu app estará online!"
echo ""
