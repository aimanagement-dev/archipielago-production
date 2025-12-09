import { NextRequest, NextResponse } from 'next/server';
import { Task, Gate, TeamMember, Stats } from '@/lib/types';
import { checkAuth } from '@/lib/api-auth';

// Función para construir el contexto del proyecto
function buildProjectContext(context: {
  tasks: Task[];
  gates: Gate[];
  team: TeamMember[];
  stats: Stats;
}) {
  const { tasks, gates, team, stats } = context;

  // Construir resumen de tareas
  const tasksByStatus = {
    completadas: tasks.filter(t => t.status === 'Completado').length,
    enProgreso: tasks.filter(t => t.status === 'En Progreso').length,
    pendientes: tasks.filter(t => t.status === 'Pendiente').length,
    bloqueadas: tasks.filter(t => t.status === 'Bloqueado').length,
  };

  const blockedTasks = tasks.filter(t => t.status === 'Bloqueado');
  const upcomingTasks = tasks
    .filter(t => t.status !== 'Completado' && t.dueDate)
    .sort((a, b) => new Date(a.dueDate || '').getTime() - new Date(b.dueDate || '').getTime())
    .slice(0, 5);

  // Construir resumen de gates
  const gatesByStatus = {
    aprobados: gates.filter(g => g.status === 'Aprobado').length,
    enProgreso: gates.filter(g => g.status === 'En Progreso').length,
    pendientes: gates.filter(g => g.status === 'Pendiente').length,
  };

  const upcomingGates = gates
    .filter(g => g.status !== 'Aprobado' && g.date)
    .sort((a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime())
    .slice(0, 3);

  // Construir resumen del equipo
  const activeTeam = team.filter(m => m.status === 'Activo');
  const teamByType = {
    fullTime: team.filter(m => m.type === 'Full-time').length,
    partTime: team.filter(m => m.type === 'Part-time').length,
  };

  return `
CONTEXTO DEL PROYECTO ARCHIPIÉLAGO:

📊 ESTADÍSTICAS GENERALES:
- Total de Tareas: ${stats.totalTasks}
- Tareas Completadas: ${tasksByStatus.completadas}
- Tareas en Progreso: ${tasksByStatus.enProgreso}
- Tareas Pendientes: ${tasksByStatus.pendientes}
- Tareas Bloqueadas: ${tasksByStatus.bloqueadas}
- Gates Totales: ${stats.totalGates}
- Gates Completados: ${stats.gatesCompleted}

🚨 TAREAS BLOQUEADAS (requieren atención):
${blockedTasks.length > 0
      ? blockedTasks.map(t => `- ${t.title} (${t.area}) - Responsable: ${t.responsible.join(', ')}`).join('\n')
      : 'No hay tareas bloqueadas actualmente.'
    }

📅 PRÓXIMAS TAREAS:
${upcomingTasks.length > 0
      ? upcomingTasks.map(t => `- ${t.title} (${t.area}) - Vence: ${t.dueDate} - Estado: ${t.status}`).join('\n')
      : 'No hay tareas próximas programadas.'
    }

🎯 GATES:
- Gates Aprobados: ${gatesByStatus.aprobados}
- Gates en Progreso: ${gatesByStatus.enProgreso}
- Gates Pendientes: ${gatesByStatus.pendientes}

${upcomingGates.length > 0 ? `Próximos Gates:\n${upcomingGates.map(g => `- ${g.name} (Semana ${g.week}) - Estado: ${g.status}`).join('\n')}` : ''}

👥 EQUIPO:
- Miembros Activos: ${activeTeam.length}
- Full-time: ${teamByType.fullTime}
- Part-time: ${teamByType.partTime}

ÁREAS DE TRABAJO:
${Array.from(new Set(tasks.map(t => t.area))).map(area => {
      const areaTasks = tasks.filter(t => t.area === area);
      const completed = areaTasks.filter(t => t.status === 'Completado').length;
      return `- ${area}: ${areaTasks.length} tareas (${completed} completadas)`;
    }).join('\n')}
`;
}

// Función para construir el prompt del sistema
function buildSystemPrompt() {
  return `Eres un asistente de IA especializado en gestión de producción cinematográfica para el proyecto "Archipiélago".

Tu rol es:
1. Ayudar al equipo a entender el estado del proyecto
2. Identificar riesgos y tareas bloqueadas
3. Sugerir mejoras y optimizaciones
4. Responder preguntas sobre tareas, gates, equipo y calendario
5. Proporcionar análisis inteligente basado en los datos del proyecto

INSTRUCCIONES:
- Responde siempre en español
- Sé conciso pero completo
- Usa emojis cuando sea apropiado para mejorar la legibilidad
- Si no tienes información suficiente, dilo claramente
- Prioriza información sobre tareas bloqueadas y próximas fechas límite
- Proporciona sugerencias prácticas y accionables
- Mantén un tono profesional pero amigable

Cuando el usuario pregunte sobre:
- "status" o "estado": Proporciona un resumen del estado general del proyecto
- "blocked" o "bloqueadas": Lista las tareas bloqueadas y sugiere acciones
- "schedule" o "calendario": Habla sobre próximas fechas y deadlines
- "team" o "equipo": Proporciona información sobre el equipo
- "gates" o "milestones": Habla sobre los gates y su estado
- Análisis o sugerencias: Proporciona insights basados en los datos disponibles`;
}

export async function POST(request: NextRequest) {
  const authResponse = await checkAuth();
  if (authResponse) return authResponse;

  try {
    // Validar que la API key esté configurada
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
      console.error('GEMINI_API_KEY no está configurada');
      return NextResponse.json(
        { error: 'GEMINI_API_KEY no está configurada. Por favor, configura la variable de entorno.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { message, context } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Mensaje requerido' },
        { status: 400 }
      );
    }

    // Construir el contexto del proyecto
    const projectContext = buildProjectContext(context);
    const systemPrompt = buildSystemPrompt();

    // Construir el prompt completo
    const fullPrompt = `${systemPrompt}

${projectContext}

USUARIO: ${message}

ASISTENTE:`;

    // Llamada directa a la API REST de Gemini
    // Usamos gemini-pro que es el modelo estable
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }]
      })
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error('Error de Gemini API:', errorData);
      throw new Error(errorData.error?.message || 'Error al comunicarse con Gemini API');
    }

    const data = await geminiResponse.json();

    // Extraer el texto de la respuesta
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo generar una respuesta.';

    return NextResponse.json({
      message: text,
      success: true,
    });

  } catch (error) {
    console.error('Error en Gemini API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      {
        error: 'Error al procesar la solicitud',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

