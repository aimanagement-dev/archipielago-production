/**
 * Helper para verificar si un usuario tiene accessGranted = true
 * Usa las credenciales proporcionadas para verificar acceso al DB
 */
import { GoogleSheetsService } from '@/lib/google-sheets';

export async function checkUserAccess(userEmail: string, accessToken: string): Promise<boolean> {
  try {
    const service = new GoogleSheetsService(accessToken);
    
    // Intentar encontrar el DB con las credenciales proporcionadas
    let spreadsheetId = await service.findDatabase();
    
    // Si no se encuentra, intentar crear/obtener (solo funciona si el usuario tiene permisos)
    if (!spreadsheetId) {
      try {
        spreadsheetId = await service.getOrCreateDatabase();
      } catch (error) {
        // El usuario no tiene permisos para crear/obtener el DB
        console.log(`[checkUserAccess] User ${userEmail} cannot access DB, will check via admin credentials`);
        return false; // Necesitamos verificar con credenciales de admin
      }
    }

    const team = await service.getTeam(spreadsheetId);
    const member = team.find((m: any) => m.email?.toLowerCase() === userEmail.toLowerCase());

    return member?.accessGranted === true;
  } catch (error) {
    console.error('[checkUserAccess] Error:', error);
    return false;
  }
}

/**
 * Verifica el acceso del usuario actual usando las credenciales proporcionadas
 * Si el usuario no tiene acceso al DB, asume que tiene accessGranted=true (verificado al invitar)
 */
export async function verifyCurrentUserAccess(userAccessToken: string, userEmail: string): Promise<{ hasAccess: boolean; reason?: string }> {
  // 1. Check if user is a super admin
  const superAdmins = [
    'ai.management@archipielagofilm.com',
    'ai.lantica@lanticastudios.com',
    'federico.beron@lanticastudios.com',
    // Cindy Toribio removida de admins - ahora es user regular
  ];
  
  if (superAdmins.includes(userEmail.toLowerCase())) {
    return { hasAccess: true };
  }

  // 2. Intentar verificar con las credenciales del usuario si tiene acceso al DB
  try {
    const hasAccess = await checkUserAccess(userEmail, userAccessToken);
    if (hasAccess) {
      return { hasAccess: true };
    } else {
      // Usuario tiene acceso al DB pero accessGranted=false
      return { 
        hasAccess: false, 
        reason: 'Tu cuenta no tiene acceso habilitado (accessGranted = false). Contacta al administrador.' 
      };
    }
  } catch (error) {
    // El usuario no tiene acceso al DB
    // Si llegó hasta aquí haciendo login, significa que tiene credenciales válidas
    // y fue invitado (accessGranted=true fue establecido al invitar)
    // Permitir el acceso - el usuario puede usar la app aunque no tenga acceso directo al DB
    console.log(`[verifyCurrentUserAccess] User ${userEmail} doesn't have DB access, but allowing access (verified at invitation)`);
    return { hasAccess: true };
  }
}
