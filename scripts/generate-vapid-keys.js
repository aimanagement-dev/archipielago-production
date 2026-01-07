#!/usr/bin/env node

/**
 * Script para generar VAPID keys para push notifications
 * Ejecutar: node scripts/generate-vapid-keys.js
 */

const webpush = require('web-push');

console.log('Generando VAPID keys para push notifications...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID Keys generadas:\n');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('VAPID_SUBJECT=mailto:ai.management@archipielagofilm.com\n');
console.log('📋 Agrega estas variables a tu archivo .env.local y a Vercel:\n');
console.log('1. Copia las líneas de arriba a tu .env.local');
console.log('2. En Vercel: Settings → Environment Variables → Agrega las 3 variables');
console.log('3. Redeploy la aplicación\n');
