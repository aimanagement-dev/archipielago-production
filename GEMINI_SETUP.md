# 🤖 Configuración de Gemini AI

Esta guía te ayudará a configurar Google Gemini para potenciar el asistente de IA de Archipiélago.

## 📋 Requisitos Previos

1. **Cuenta de Google** con acceso a Gemini API
2. **API Key de Gemini** (obtener desde Google AI Studio o Google Cloud Console)

## 🔑 Obtener tu API Key

### Opción 1: Google AI Studio (Recomendado para empezar)
1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Click en "Create API Key"
4. Copia la API key generada

### Opción 2: Google Cloud Console (Para workspaces pagos)
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto o crea uno nuevo
3. Habilita la API de Gemini:
   - Ve a "APIs & Services" → "Library"
   - Busca "Generative Language API"
   - Click en "Enable"
4. Crea credenciales:
   - Ve a "APIs & Services" → "Credentials"
   - Click en "Create Credentials" → "API Key"
   - Copia la API key

## ⚙️ Configuración en el Proyecto

### Paso 1: Crear archivo de variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# Desde la terminal
cd "/Users/aimac/Documents/arch-pm ANTIGRAVITY"
touch .env.local
```

### Paso 2: Agregar tu API Key

Abre `.env.local` y agrega:

```env
GEMINI_API_KEY=tu_api_key_aqui
```

**⚠️ IMPORTANTE**: 
- Nunca subas `.env.local` a GitHub (ya está en `.gitignore`)
- Mantén tu API key segura y privada

### Paso 3: Reiniciar el servidor de desarrollo

```bash
# Detén el servidor (Ctrl+C) y reinícialo
npm run dev
```

## 🧪 Verificar la Configuración

1. Inicia la aplicación: `npm run dev`
2. Inicia sesión en la app
3. Click en el botón del asistente de IA (esquina inferior derecha)
4. Haz una pregunta de prueba: "¿Cuál es el estado del proyecto?"
5. Si ves una respuesta inteligente de Gemini, ¡está funcionando! ✅

## 🎯 Funcionalidades Disponibles

El asistente de Gemini puede:

- ✅ **Analizar el estado del proyecto** - Estadísticas, métricas, progreso
- ✅ **Identificar tareas bloqueadas** - Análisis de problemas y sugerencias
- ✅ **Gestionar calendario** - Próximas fechas, deadlines, conflictos
- ✅ **Analizar el equipo** - Distribución de trabajo, recomendaciones
- ✅ **Responder preguntas específicas** - Sobre tareas, gates, miembros del equipo
- ✅ **Proporcionar insights** - Análisis inteligente basado en datos reales

## 🔧 Configuración Avanzada

### Cambiar el Modelo de Gemini

Por defecto se usa `gemini-pro`. Para usar otro modelo, edita `app/api/gemini/chat/route.ts`:

```typescript
// Cambiar de:
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// A:
const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
```

### Personalizar el Prompt del Sistema

Edita la función `buildSystemPrompt()` en `app/api/gemini/chat/route.ts` para ajustar el comportamiento del asistente.

### Agregar Funciones Especializadas

Puedes crear funciones especializadas en `lib/gemini.ts`:

```typescript
export async function miFuncionEspecializada(context: GeminiContext): Promise<string> {
  return sendMessageToGemini(
    'Tu prompt especializado aquí',
    context
  );
}
```

## 🚀 Deploy en Producción

### Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega: `GEMINI_API_KEY` con tu API key
4. Redeploy el proyecto

### Otras Plataformas

Agrega `GEMINI_API_KEY` como variable de entorno en tu plataforma de hosting.

## 🐛 Troubleshooting

### Error: "GEMINI_API_KEY no está configurada"
- Verifica que el archivo `.env.local` existe
- Verifica que la variable se llama exactamente `GEMINI_API_KEY`
- Reinicia el servidor de desarrollo

### Error: "API key not valid"
- Verifica que copiaste la API key completa
- Asegúrate de que no hay espacios extra
- Verifica que la API key no haya expirado

### Error: "Quota exceeded"
- Has alcanzado el límite de requests
- Verifica tu cuota en Google Cloud Console
- Considera actualizar tu plan si es necesario

### El asistente no responde
- Abre la consola del navegador (F12) para ver errores
- Verifica los logs del servidor
- Asegúrate de que la API route está funcionando: `/api/gemini/chat`

## 📚 Recursos Adicionales

- [Documentación de Gemini API](https://ai.google.dev/docs)
- [Google AI Studio](https://makersuite.google.com/)
- [Google Cloud Console](https://console.cloud.google.com/)

## 💡 Tips

1. **Contexto Inteligente**: El asistente recibe automáticamente información sobre tareas, gates, equipo y estadísticas
2. **Respuestas en Español**: El asistente está configurado para responder siempre en español
3. **Análisis Profundo**: Puedes pedir análisis específicos como "analiza las tareas bloqueadas" o "sugiere optimizaciones"
4. **Historial de Conversación**: El asistente mantiene el contexto de la conversación durante la sesión

---

¿Necesitas ayuda? Revisa los logs del servidor o contacta al equipo de desarrollo.






