/**
 * Script de prueba para verificar sincronización bidireccional del calendario
 * 
 * Uso:
 *   node scripts/test-calendar-sync.js
 * 
 * Requiere:
 *   - Variables de entorno configuradas (.env.local)
 *   - Sesión activa de NextAuth (necesitarás hacer login primero)
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const PROD_URL = 'https://archipielago-production.vercel.app';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testSyncToCalendar() {
  log('\n📤 Probando sincronización App → Calendar', 'cyan');
  log('─'.repeat(50), 'cyan');
  
  try {
    // Simular payload de tareas
    const testTasks = [
      {
        id: 'test-task-1',
        title: 'Tarea de Prueba - Sync Test',
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '10:00',
        responsible: ['Test User'],
        area: 'Planificación',
        status: 'Pendiente',
        notes: 'Esta es una tarea de prueba para verificar la sincronización',
      },
    ];

    log(`Enviando ${testTasks.length} tarea(s) a Google Calendar...`, 'blue');
    
    const response = await makeRequest(`${BASE_URL}/api/google/calendar/sync`, {
      method: 'POST',
      body: { tasks: testTasks },
    });

    if (response.status === 200 && response.data.ok) {
      log('✅ Sincronización hacia Calendar exitosa!', 'green');
      log(`   - Creadas: ${response.data.created || 0}`, 'green');
      log(`   - Actualizadas: ${response.data.updated || 0}`, 'green');
      log(`   - Eliminadas: ${response.data.deleted || 0}`, 'green');
      log(`   - Omitidas: ${response.data.skipped || 0}`, 'green');
      return true;
    } else {
      log('❌ Error en sincronización hacia Calendar', 'red');
      log(`   Status: ${response.status}`, 'red');
      log(`   Error: ${response.data.error || JSON.stringify(response.data)}`, 'red');
      return false;
    }
  } catch (error) {
    log('❌ Error de conexión:', 'red');
    log(`   ${error.message}`, 'red');
    return false;
  }
}

async function testSyncFromCalendar() {
  log('\n📥 Probando sincronización Calendar → App', 'cyan');
  log('─'.repeat(50), 'cyan');
  
  try {
    // Calcular rango de fechas (últimos 3 meses y próximos 6 meses)
    const now = new Date();
    const timeMin = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
    const timeMax = new Date(now.getFullYear(), now.getMonth() + 6, 0).toISOString();

    log(`Leyendo eventos desde ${timeMin} hasta ${timeMax}...`, 'blue');
    
    const url = `${BASE_URL}/api/google/calendar/sync?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&updateSheets=true`;
    const response = await makeRequest(url, {
      method: 'GET',
    });

    if (response.status === 200 && response.data.ok) {
      log('✅ Sincronización desde Calendar exitosa!', 'green');
      log(`   - Eventos encontrados: ${response.data.tasksFound || 0}`, 'green');
      log(`   - Tareas actualizadas: ${response.data.updated || 0}`, 'green');
      log(`   - Tareas creadas: ${response.data.created || 0}`, 'green');
      
      if (response.data.errors && response.data.errors.length > 0) {
        log(`   ⚠️  Errores: ${response.data.errors.length}`, 'yellow');
        response.data.errors.forEach((err, i) => {
          log(`      ${i + 1}. ${err.id}: ${err.message}`, 'yellow');
        });
      }
      
      return true;
    } else {
      log('❌ Error en sincronización desde Calendar', 'red');
      log(`   Status: ${response.status}`, 'red');
      log(`   Error: ${response.data.error || JSON.stringify(response.data)}`, 'red');
      return false;
    }
  } catch (error) {
    log('❌ Error de conexión:', 'red');
    log(`   ${error.message}`, 'red');
    return false;
  }
}

async function testBidirectionalSync() {
  log('\n🔄 PRUEBA DE SINCRONIZACIÓN BIDIRECCIONAL', 'cyan');
  log('='.repeat(50), 'cyan');
  log(`URL Base: ${BASE_URL}`, 'blue');
  log('='.repeat(50), 'cyan');

  // Nota: Estas pruebas requieren autenticación
  // En producción, necesitarías cookies de sesión válidas
  log('\n⚠️  NOTA: Estas pruebas requieren autenticación', 'yellow');
  log('   Para probar completamente, necesitas:', 'yellow');
  log('   1. Hacer login en la aplicación', 'yellow');
  log('   2. Obtener cookies de sesión', 'yellow');
  log('   3. Incluir las cookies en las peticiones', 'yellow');
  log('\n   Alternativamente, puedes probar manualmente desde la UI:', 'yellow');
  log('   - Ve a /calendar o /tasks', 'yellow');
  log('   - Usa los botones de sincronización bidireccional', 'yellow');

  // Intentar las pruebas de todas formas
  const results = {
    toCalendar: false,
    fromCalendar: false,
  };

  log('\n📋 Ejecutando pruebas...', 'blue');
  
  results.toCalendar = await testSyncToCalendar();
  results.fromCalendar = await testSyncFromCalendar();

  // Resumen
  log('\n' + '='.repeat(50), 'cyan');
  log('📊 RESUMEN DE PRUEBAS', 'cyan');
  log('='.repeat(50), 'cyan');
  log(`App → Calendar: ${results.toCalendar ? '✅ OK' : '❌ FALLÓ'}`, results.toCalendar ? 'green' : 'red');
  log(`Calendar → App: ${results.fromCalendar ? '✅ OK' : '❌ FALLÓ'}`, results.fromCalendar ? 'green' : 'red');
  
  if (results.toCalendar && results.fromCalendar) {
    log('\n🎉 ¡Todas las pruebas pasaron!', 'green');
  } else {
    log('\n⚠️  Algunas pruebas fallaron. Verifica:', 'yellow');
    log('   - Que el servidor esté corriendo', 'yellow');
    log('   - Que tengas sesión activa (cookies)', 'yellow');
    log('   - Que las variables de entorno estén configuradas', 'yellow');
    log('   - Que tengas permisos de Google Calendar', 'yellow');
  }
  
  log('\n');
}

// Ejecutar pruebas
if (require.main === module) {
  testBidirectionalSync().catch(console.error);
}

module.exports = { testSyncToCalendar, testSyncFromCalendar, testBidirectionalSync };

