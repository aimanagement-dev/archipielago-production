import { TeamMember, MemberStatus, MemberType } from './types';

export interface CSVParseResult {
    members: Partial<TeamMember>[];
    errors: string[];
}

export const parseCrewCSV = (csvContent: string): CSVParseResult => {
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) {
        return { members: [], errors: ['El archivo CSV parece estar vacío o no tiene cabeceras.'] };
    }

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
    const members: Partial<TeamMember>[] = [];
    const errors: string[] = [];

    // Map common CSV headers to our internal fields
    const fieldMapping: Record<string, keyof TeamMember | 'socials_linkedin' | 'socials_imdb'> = {
        'nombre': 'name',
        'name': 'name',
        'full name': 'name',
        'email': 'email',
        'correo': 'email',
        'telefono': 'phone',
        'celular': 'phone',
        'phone': 'phone',
        'puesto': 'position',
        'cargo': 'position',
        'position': 'position',
        'departamento': 'department',
        'department': 'department',
        'rol': 'role',
        'role': 'role',
        'status': 'status',
        'estado': 'status',
        'tipo': 'type',
        'type': 'type',
        'nota': 'notes',
        'notas': 'notes',
        'notes': 'notes',
        'rate': 'dailyRate',
        'tarifa': 'dailyRate',
        'linkedin': 'socials_linkedin',
        'imdb': 'socials_imdb'
    };

    for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i];
        // Split by comma causing issues with commas inside quotes? 
        // For simple CSV logic we assume standard commas. 
        // A more robust parser would use a library, but sticking to zero-deps for now unless requested.
        const values = currentLine.split(',').map(v => v.trim().replace(/"/g, ''));

        if (values.length < 2) continue; // Skip empty/malformed lines

        const member: any = {
            status: 'Activo', // Default
            type: 'Full-time', // Default
            socials: {}
        };

        let hasName = false;

        headers.forEach((header, index) => {
            const value = values[index];
            if (!value) return;

            const mappedField = fieldMapping[header] || fieldMapping[Object.keys(fieldMapping).find(k => header.includes(k)) || ''];

            if (mappedField) {
                if (mappedField === 'socials_linkedin') {
                    member.socials.linkedin = value;
                } else if (mappedField === 'socials_imdb') {
                    member.socials.imdb = value;
                } else if (mappedField === 'status') {
                    // Basic normalization
                    const lowerStatus = value.toLowerCase();
                    if (lowerStatus.includes('inactivo') || lowerStatus.includes('inactive')) member.status = 'Inactivo';
                } else if (mappedField === 'type') {
                    const lowerType = value.toLowerCase();
                    if (lowerType.includes('part') || lowerType.includes('medio')) member.type = 'Part-time';
                } else if (mappedField === 'dailyRate') {
                    const num = parseFloat(value.replace(/[^0-9.]/g, ''));
                    if (!isNaN(num)) member.dailyRate = num;
                } else {
                    member[mappedField] = value;
                }

                if (mappedField === 'name' && value) hasName = true;
            }
        });

        // Fallback: If no name but has email, use email username as name
        if (!hasName && member.email) {
            member.name = member.email.split('@')[0];
            hasName = true;
        }

        if (hasName) {
            if (!member.id) member.id = crypto.randomUUID();
            members.push(member);
        } else {
            errors.push(`Fila ${i + 1}: Ignorada por falta de Nombre/Email.`);
        }
    }

    return { members, errors };
};
