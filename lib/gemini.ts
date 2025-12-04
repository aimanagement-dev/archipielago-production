/**
 * Servicio para interactuar con Gemini API
 * Proporciona funciones helper para construir contexto y hacer llamadas
 */

import { Task, Gate, TeamMember, Stats } from './types';

export interface GeminiContext {
  tasks: Task[];
  gates: Gate[];
  team: TeamMember[];
  stats: Stats;
}

/**
 * Envía un mensaje a Gemini y obtiene una respuesta
 */
export async function sendMessageToGemini(
  message: string,
  context: GeminiContext
): Promise<string> {

  try {
    const response = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        context,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al comunicarse con Gemini');
    }

    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error('Error en sendMessageToGemini:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido al comunicarse con Gemini');
  }
}

/**
 * Funciones especializadas para diferentes tipos de consultas
 */

export async function analyzeProjectStatus(context: GeminiContext): Promise<string> {
  return sendMessageToGemini(
    'Proporciona un análisis completo del estado actual del proyecto. Incluye métricas clave, riesgos identificados y recomendaciones.',
    context
  );
}

export async function getBlockedTasksAnalysis(context: GeminiContext): Promise<string> {
  return sendMessageToGemini(
    'Analiza las tareas bloqueadas del proyecto. Identifica patrones, causas potenciales y sugiere acciones para desbloquearlas.',
    context
  );
}

export async function getScheduleInsights(context: GeminiContext): Promise<string> {
  return sendMessageToGemini(
    'Analiza el calendario y las fechas límite del proyecto. Identifica posibles conflictos, tareas urgentes y sugerencias para optimizar el cronograma.',
    context
  );
}

export async function getTeamRecommendations(context: GeminiContext): Promise<string> {
  return sendMessageToGemini(
    'Analiza la distribución del equipo y las tareas. Proporciona recomendaciones sobre asignación de recursos y optimización del trabajo del equipo.',
    context
  );
}

