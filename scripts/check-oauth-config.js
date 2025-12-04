/**
 * Script de diagnóstico para verificar la configuración de OAuth
 * No expone valores sensibles, solo verifica que existan y tengan formato correcto
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');

console.log('🔍 Verificando configuración de OAuth...\n');

// Verificar que existe .env.local
if (!fs.existsSync(envPath)) {
  console.error('❌ No se encontró el archivo .env.local');
  console.log('📝 Crea el archivo .env.local en la raíz del proyecto');
  process.exit(1);
}

// Leer variables de entorno
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

// Verificar variables requeridas
const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'NEXTAUTH_SECRET'];
const missing = [];
const invalid = [];

required.forEach(key => {
  if (!envVars[key]) {
    missing.push(key);
  } else {
    // Verificar formato básico
    if (key === 'GOOGLE_CLIENT_ID') {
      // Client ID de Google suele tener formato: xxxxxx-xxxxx.apps.googleusercontent.com
      if (!envVars[key].includes('.apps.googleusercontent.com') && !envVars[key].includes('-')) {
        invalid.push(`${key}: formato sospechoso (debería contener .apps.googleusercontent.com o guiones)`);
      }
    }
    if (key === 'GOOGLE_CLIENT_SECRET') {
      // Client Secret suele ser una cadena alfanumérica
      if (envVars[key].length < 20) {
        invalid.push(`${key}: parece muy corto (debería tener al menos 20 caracteres)`);
      }
    }
    if (key === 'NEXTAUTH_SECRET') {
      if (envVars[key].length < 32) {
        invalid.push(`${key}: parece muy corto (recomendado: al menos 32 caracteres)`);
      }
    }
  }
});

// Mostrar resultados
console.log('📋 Variables de entorno encontradas:\n');

required.forEach(key => {
  const value = envVars[key];
  if (value) {
    const display = key.includes('SECRET') 
      ? `${value.substring(0, 8)}... (${value.length} caracteres)`
      : value.length > 50 
        ? `${value.substring(0, 50)}...`
        : value;
    console.log(`  ✅ ${key}: ${display}`);
  } else {
    console.log(`  ❌ ${key}: NO CONFIGURADA`);
  }
});

if (envVars.NEXTAUTH_URL) {
  console.log(`  ✅ NEXTAUTH_URL: ${envVars.NEXTAUTH_URL}`);
} else {
  console.log(`  ⚠️  NEXTAUTH_URL: No configurada (usará http://localhost:3000 por defecto)`);
}

console.log('\n');

// Mostrar errores
if (missing.length > 0) {
  console.error('❌ Variables faltantes:');
  missing.forEach(key => console.error(`   - ${key}`));
  console.log('\n');
}

if (invalid.length > 0) {
  console.warn('⚠️  Advertencias:');
  invalid.forEach(msg => console.warn(`   - ${msg}`));
  console.log('\n');
}

// Verificar URL de redirección
const redirectUri = envVars.NEXTAUTH_URL 
  ? `${envVars.NEXTAUTH_URL}/api/auth/callback/google`
  : 'http://localhost:3000/api/auth/callback/google';

console.log('🔗 URL de redirección esperada:');
console.log(`   ${redirectUri}\n`);

console.log('📝 Verifica en Google Cloud Console:');
console.log('   1. Ve a APIs & Services > Credentials');
console.log('   2. Encuentra tu OAuth 2.0 Client ID');
console.log('   3. Verifica que "Authorized redirect URIs" incluya:');
console.log(`      ${redirectUri}\n`);

if (missing.length === 0 && invalid.length === 0) {
  console.log('✅ Configuración básica correcta');
  console.log('\n💡 Si aún tienes el error "invalid_client":');
  console.log('   1. Verifica que el Client ID sea correcto en Google Cloud Console');
  console.log('   2. Verifica que la URL de redirección esté exactamente como se muestra arriba');
  console.log('   3. Asegúrate de que el proyecto de Google Cloud esté activo');
  console.log('   4. Verifica que la pantalla de consentimiento OAuth esté configurada');
  console.log('   5. Si es una app externa, añade tu email como "Test User"\n');
} else {
  console.log('❌ Hay problemas con la configuración. Corrígelos antes de continuar.\n');
  process.exit(1);
}



