import { NextRequest, NextResponse } from 'next/server';
import { Task, Gate, TeamMember, Stats } from '@/lib/types';
import { checkAuth } from '@/lib/api-auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { createCalendarEventWithAttendees } from '@/lib/google/calendar';

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
6. CREAR TAREAS Y EVENTOS cuando el usuario lo solicite

INSTRUCCIONES:
- Responde siempre en español
- Sé conciso pero completo
- Usa emojis cuando sea apropiado para mejorar la legibilidad
- Si no tienes información suficiente, dilo claramente
- Prioriza información sobre tareas bloqueadas y próximas fechas límite
- Proporciona sugerencias prácticas y accionables
- Mantén un tono profesional pero amigable

CAPACIDADES DE ACCIÓN:
Puedes CREAR eventos y tareas cuando el usuario lo solicite. Ejemplos:
- "crea una llamada para hoy a las 4pm" → Crear evento en calendario
- "programa una reunión mañana a las 10am" → Crear evento
- "agenda una llamada con Juan para el viernes" → Crear evento con invitado
- "crea una tarea para revisar el guión" → Crear tarea

Cuando el usuario solicite crear un evento o tarea:
1. Extrae la información: título, fecha, hora, participantes
2. Si menciona usuarios del equipo, identifícalos por nombre o email
3. Usa la función createCalendarEvent para crear el evento
4. Confirma al usuario que el evento fue creado exitosamente

Cuando el usuario pregunte sobre:
- "status" o "estado": Proporciona un resumen del estado general del proyecto
- "blocked" o "bloqueadas": Lista las tareas bloqueadas y sugiere acciones
- "schedule" o "calendario": Habla sobre próximas fechas y deadlines
- "team" o "equipo": Proporciona información sobre el equipo
- "gates" o "milestones": Habla sobre los gates y su estado
- Análisis o sugerencias: Proporciona insights basados en los datos disponibles`;
}

// Definir funciones disponibles para Gemini Function Calling
function getAvailableFunctions(team: TeamMember[]) {
  return [
    {
      name: 'createCalendarEvent',
      description: 'Crea un evento en Google Calendar. Úsalo cuando el usuario solicite crear una llamada, reunión, evento o tarea programada.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Título del evento (ej: "Llamada con el equipo", "Reunión de producción")',
          },
          description: {
            type: 'string',
            description: 'Descripción opcional del evento',
          },
          startDateTime: {
            type: 'string',
            description: 'Fecha y hora de inicio en formato ISO 8601 (ej: "2025-12-15T16:00:00-04:00" para hoy a las 4pm hora de Santo Domingo)',
          },
          endDateTime: {
            type: 'string',
            description: 'Fecha y hora de fin en formato ISO 8601 (opcional, por defecto será 1 hora después del inicio)',
          },
          attendees: {
            type: 'array',
            items: { type: 'string' },
            description: `Array de emails de los participantes. Usa los emails del equipo cuando mencione nombres. Emails disponibles: ${team.map(m => m.email || m.name).join(', ')}`,
          },
        },
        required: ['title', 'startDateTime'],
      },
    },
  ];
}

// Función helper para encontrar emails del equipo por nombre
function findTeamMemberEmails(names: string[], team: TeamMember[]): string[] {
  const emails: string[] = [];
  
  for (const name of names) {
    const lowerName = name.toLowerCase().trim();
    const member = team.find(m => 
      m.name.toLowerCase().includes(lowerName) || 
      lowerName.includes(m.name.toLowerCase()) ||
      (m.email && m.email.toLowerCase().includes(lowerName))
    );
    
    if (member && member.email) {
      emails.push(member.email);
    }
  }
  
  return emails;
}

export async function POST(request: NextRequest) {
  const authResponse = await checkAuth();
  if (authResponse) return authResponse;

  // Obtener sesión para access token
  const session = await getServerSession(authOptions);
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
    const functions = getAvailableFunctions(context.team || []);

    // Construir el prompt completo
    const fullPrompt = `${systemPrompt}

${projectContext}

EQUIPO DISPONIBLE (para invitar a eventos):
${(context.team || []).map((m: TeamMember) => `- ${m.name}${m.email ? ` (${m.email})` : ''}`).join('\n')}

USUARIO: ${message}

ASISTENTE:`;

    // Llamada a Gemini con Function Calling
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

    let geminiResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        tools: [{
          functionDeclarations: functions
        }]
      })
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error('Error de Gemini API:', errorData);
      throw new Error(errorData.error?.message || 'Error al comunicarse con Gemini API');
    }

    let data = await geminiResponse.json();
    let responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    let functionCalls = data.candidates?.[0]?.content?.parts?.filter((p: any) => p.functionCall) || [];

    // Si Gemini quiere llamar una función, ejecutarla
    if (functionCalls.length > 0) {
      const functionCall = functionCalls[0].functionCall;
      
      if (functionCall.name === 'createCalendarEvent') {
        const args = functionCall.args;
        
        // Procesar attendees: si Gemini envió nombres, buscar sus emails
        let attendeeEmails = args.attendees || [];
        if (attendeeEmails.length > 0 && context.team) {
          // Si algunos no son emails válidos, intentar encontrarlos por nombre
          attendeeEmails = attendeeEmails.map((attendee: string) => {
            // Si ya es un email válido, usarlo
            if (attendee.includes('@')) {
              return attendee;
            }
            // Si no, buscar en el equipo
            const member = context.team?.find((m: TeamMember) => 
              m.name.toLowerCase().includes(attendee.toLowerCase()) ||
              attendee.toLowerCase().includes(m.name.toLowerCase())
            );
            return member?.email || attendee;
          }).filter(Boolean);
        }
        
        // Crear el evento en Google Calendar
        const result = await createCalendarEventWithAttendees(
          session.accessToken,
          {
            title: args.title,
            description: args.description,
            startDateTime: args.startDateTime,
            endDateTime: args.endDateTime,
            attendees: attendeeEmails.length > 0 ? attendeeEmails : undefined,
          }
        );

        // Enviar respuesta de la función a Gemini para que genere una respuesta final
        const functionResponsePrompt = `${fullPrompt}

ASISTENTE: [Llamando función createCalendarEvent con: ${JSON.stringify(args)}]

FUNCIÓN EJECUTADA:
${result.success 
  ? `✅ Evento creado exitosamente! Event ID: ${result.eventId}${result.eventLink ? `\nEnlace: ${result.eventLink}` : ''}`
  : `❌ Error al crear evento: ${result.error}`
}

Ahora responde al usuario confirmando que el evento fue creado (o explicando el error si hubo uno).`;

        geminiResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: fullPrompt }]
              },
              {
                parts: [
                  { functionCall: functionCall },
                  { 
                    functionResponse: {
                      name: functionCall.name,
                      response: result
                    }
                  }
                ]
              },
              {
                parts: [{ text: 'Responde al usuario confirmando que el evento fue creado exitosamente o explicando el error si hubo uno.' }]
              }
            ],
            tools: [{
              functionDeclarations: functions
            }]
          })
        });

        if (!geminiResponse.ok) {
          const errorData = await geminiResponse.json();
          throw new Error(errorData.error?.message || 'Error al comunicarse con Gemini API');
        }

        data = await geminiResponse.json();
        responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Evento creado exitosamente.';
      }
    }

    return NextResponse.json({
      message: responseText,
      success: true,
      actionExecuted: functionCalls.length > 0,
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

