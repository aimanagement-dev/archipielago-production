/**
 * Validación de variables de entorno
 * Este archivo valida que todas las variables de entorno requeridas estén configuradas
 */

interface EnvConfig {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL?: string;
  GEMINI_API_KEY?: string;
}

/**
 * Valida las variables de entorno requeridas
 * @throws Error si alguna variable requerida no está configurada
 */
export function validateEnv(): void {
  const required: (keyof EnvConfig)[] = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'NEXTAUTH_SECRET',
  ];

  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key] || process.env[key]!.trim() === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Variables de entorno faltantes: ${missing.join(', ')}\n` +
      'Por favor, configura estas variables en tu archivo .env.local'
    );
  }
}

/**
 * Obtiene una variable de entorno o lanza un error si no existe
 */
export function getRequiredEnv(key: keyof EnvConfig): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`Variable de entorno requerida no configurada: ${key}`);
  }
  return value;
}

/**
 * Obtiene una variable de entorno opcional
 */
export function getOptionalEnv(key: keyof EnvConfig): string | undefined {
  return process.env[key];
}


