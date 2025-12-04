/**
 * Script de diagnóstico para problemas de OAuth con Google
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnóstico de OAuth - Google\n');
console.log('=====================================\n');

// 1. Verificar variables de entorno
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ No se encontró .env.local');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

console.log('📋 Variables de Entorno:\n');
const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
required.forEach(key => {
  const value = envVars[key];
  if (value) {
    const display = key.includes('SECRET') 
      ? `${value.substring(0, 10)}... (${value.length} chars)`
      : value.length > 60 
        ? `${value.substring(0, 60)}...`
        : value;
    console.log(`  ✅ ${key}: ${display}`);
  } else {
    console.log(`  ❌ ${key}: NO CONFIGURADA`);
  }
});

console.log('\n🔗 URLs de Redirección:\n');
const nextAuthUrl = envVars.NEXTAUTH_URL || 'http://localhost:3000';
const redirectUri = `${nextAuthUrl}/api/auth/callback/google`;
console.log(`  NEXTAUTH_URL: ${nextAuthUrl}`);
console.log(`  Redirect URI: ${redirectUri}`);

console.log('\n📝 Checklist de Google Cloud Console:\n');
console.log('  1. Ve a: https://console.cloud.google.com/');
console.log('  2. Selecciona el proyecto correcto');
console.log('  3. Ve a: APIs & Services > Credentials');
console.log(`  4. Verifica que el Client ID sea: ${envVars.GOOGLE_CLIENT_ID?.substring(0, 30)}...`);
console.log(`  5. En "Authorized redirect URIs" debe estar EXACTAMENTE:`);
console.log(`     ${redirectUri}`);
console.log('\n  6. Ve a: APIs & Services > OAuth consent screen');
console.log('  7. Verifica:');
console.log('     - User support email: ai.management@archipielagofilm.com');
console.log('     - Developer contact: ai.management@archipielagofilm.com');
console.log('  8. Si es External, en "Test users" añade:');
console.log('     - ai.management@archipielagofilm.com');

console.log('\n🔧 Verificaciones Adicionales:\n');
const clientId = envVars.GOOGLE_CLIENT_ID;
if (clientId) {
  if (clientId.includes('.apps.googleusercontent.com')) {
    console.log('  ✅ Client ID tiene formato correcto');
  } else {
    console.log('  ⚠️  Client ID no tiene el formato esperado (.apps.googleusercontent.com)');
  }
  
  // Extraer el ID numérico
  const match = clientId.match(/^(\d+)-/);
  if (match) {
    console.log(`  📌 Project Number: ${match[1]}`);
  }
}

console.log('\n🌐 URLs de Prueba:\n');
console.log(`  Login: ${nextAuthUrl}/login`);
console.log(`  OAuth Callback: ${nextAuthUrl}/api/auth/callback/google`);
console.log(`  API Auth: ${nextAuthUrl}/api/auth/signin`);

console.log('\n💡 Si el error persiste:\n');
console.log('  1. Verifica que estés usando la cuenta correcta en Google Cloud Console');
console.log('  2. Asegúrate de que el proyecto esté activo');
console.log('  3. Verifica que las APIs estén habilitadas:');
console.log('     - Google Drive API');
console.log('     - Google Sheets API');
console.log('  4. Revisa los logs del servidor para errores específicos');
console.log('  5. Prueba crear un nuevo OAuth Client ID si el actual no funciona\n');

