import { google } from 'googleapis';
import { TeamMember } from '../types';

export interface GoogleContact {
    resourceName: string;
    names?: { displayName: string; familyName?: string; givenName?: string }[];
    emailAddresses?: { value: string; type?: string }[];
    phoneNumbers?: { value: string; type?: string }[];
    organizations?: { name: string; title: string }[];
    photos?: { url: string }[];
}

export async function getGoogleContacts(accessToken: string): Promise<Partial<TeamMember>[]> {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const service = google.people({ version: 'v1', auth });

    try {
        const response = await service.people.connections.list({
            resourceName: 'people/me',
            personFields: 'names,emailAddresses,phoneNumbers,organizations,photos',
            pageSize: 100, // Limit to 100 for now
            sortOrder: 'FIRST_NAME_ASCENDING',
        });

        const connections = response.data.connections || [];

        // Map to TeamMember
        return connections.map((person) => {
            const name = person.names?.[0]?.displayName || 'Sin Nombre';
            const email = person.emailAddresses?.[0]?.value || '';
            const phone = person.phoneNumbers?.[0]?.value || '';
            const organization = person.organizations?.[0];
            const photo = person.photos?.[0]?.url;

            // Try to map organization info
            let department = undefined;
            let position = undefined;
            let union = undefined;

            if (organization) {
                // Heuristic: If title contains specific keywords, map to department
                const title = organization.title || '';
                const orgName = organization.name || '';

                position = title;

                if (orgName.toLowerCase().includes('union') || orgName.toLowerCase().includes('guild')) {
                    union = orgName;
                }
            }

            const member: Partial<TeamMember> = {
                name,
                email,
                phone,
                position,
                department,
                union,
                status: 'Activo', // Default
                type: 'Full-time', // Default assumption, changeable
                notes: `Importado de Google Contacts`,
            };

            // Remove undefined keys
            Object.keys(member).forEach(key => member[key as keyof TeamMember] === undefined && delete member[key as keyof TeamMember]);

            return member;
        });

    } catch (error) {
        console.error('Error fetching Google Contacts:', error);
        throw new Error('Failed to fetch contacts');
    }
}
