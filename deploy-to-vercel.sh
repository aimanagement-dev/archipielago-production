#!/bin/bash

# ============================================
# SCRIPT DE DEPLOYMENT AUTOMÁTICO A VERCEL
# ============================================
# Proyecto: Archipiélago Production OS
# Cuenta: ai.management@archipielagofilm.com
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
echo "⚠️  IMPORTANTE: Usa la cuenta ai.management@archipielagofilm.com"
echo ""
vercel login

# Deploy del proyecto
echo ""
echo "📦 Deploying proyecto..."
echo ""

# Configurar variables de entorno
vercel env add GOOGLE_CLIENT_ID production << EOF
3160191465556-qcdd1ea8o6u8uboj756rad0r4turjech.apps.googleusercontent.com
EOF

vercel env add GOOGLE_CLIENT_SECRET production << EOF
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
EOF

vercel env add NEXTAUTH_SECRET production << EOF
tJ3z9RHouWo7v6JcTJY0ZTS6/KdbtSmZeqw86YTjKYY=
EOF

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
