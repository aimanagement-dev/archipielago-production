import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/api-auth';

export async function GET() {
  const authResponse = await checkAdmin();
  if (authResponse) return authResponse;

  // Solo mostrar si la key existe, no su valor por seguridad
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;
  const geminiKeyLength = process.env.GEMINI_API_KEY?.length || 0;
  const geminiKeyPrefix = process.env.GEMINI_API_KEY?.substring(0, 10) || 'NO_KEY';

  return NextResponse.json({
    GEMINI_API_KEY: {
      exists: hasGeminiKey,
      length: geminiKeyLength,
      prefix: geminiKeyPrefix + '...',
      // No exponer el valor completo por seguridad
    },
    allEnvKeys: Object.keys(process.env).filter(key =>
      key.includes('GEMINI') || key.includes('GOOGLE')
    ),
  });
}






