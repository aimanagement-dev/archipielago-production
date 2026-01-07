import { google } from 'googleapis';
import { Task, TaskStatus, TaskArea, Month, VisibilityLevel } from './types';

export class GoogleSheetsService {
    private auth;
    private sheets;
    private drive;

    constructor(accessToken: string) {
        this.auth = new google.auth.OAuth2();
        this.auth.setCredentials({ access_token: accessToken });
        this.sheets = google.sheets({ version: 'v4', auth: this.auth });
        this.drive = google.drive({ version: 'v3', auth: this.auth });
    }


    /**
     * Finds the Archipielago DB spreadsheet or creates it if it doesn't exist.
     */
    /**
     * Finds the Archipielago DB spreadsheet. Returns null if not found.
     */
    async findDatabase(): Promise<string | null> {
        try {
            const search = await this.drive.files.list({
                q: "name = 'Archipielago_DB' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false",
                fields: 'files(id, name)',
            });

            if (search.data.files && search.data.files.length > 0) {
                return search.data.files[0].id!;
            }
            return null;
        } catch (error) {
            console.error("Error searching for database:", error);
            return null;
        }
    }

    /**
     * Finds the Archipielago DB spreadsheet or creates it if it doesn't exist.
     */
    async getOrCreateDatabase(): Promise<string> {
        let spreadsheetId = await this.findDatabase();

        if (!spreadsheetId) {
            // Create if not found
            const resource = {
                properties: {
                    title: 'Archipielago_DB',
                },
            };
            const spreadsheet = await this.sheets.spreadsheets.create({
                requestBody: resource,
                fields: 'spreadsheetId',
            });
            spreadsheetId = spreadsheet.data.spreadsheetId!;

            // Initial setup will be handled by ensureSchema below
            // We just need to delete the default Sheet1 if we want to be clean, 
            // but ensureSchema can handle the rest.
        }

        await this.ensureSchema(spreadsheetId);
        return spreadsheetId;
    }

    private async ensureSchema(spreadsheetId: string) {
        const meta = await this.sheets.spreadsheets.get({ spreadsheetId });
        const existingTitles = meta.data.sheets?.map(s => s.properties?.title) || [];

        const requiredSheets = [
            { title: 'Tasks', headers: ['ID', 'Title', 'Status', 'Area', 'Month', 'Week', 'Responsible', 'Notes', 'ScheduledDate', 'ScheduledTime', 'Attachments', 'Visibility', 'VisibleTo', 'MeetLink', 'AttendeeResponses', 'CalendarId'] },
            { title: 'Gates', headers: ['ID', 'Title', 'Status', 'Date', 'Description'] },
            { title: 'Team', headers: ['ID', 'Name', 'Email', 'Role', 'Department', 'Position', 'Status', 'Type', 'Phone', 'AccessGranted', 'Metadata'] },
            { title: 'Subscriptions', headers: ['ID', 'Platform', 'Category', 'Amount', 'Currency', 'BillingCycle', 'RenewalDay', 'CardUsed', 'Status', 'OwnerId', 'Users', 'ReceiptUrl', 'Notes', 'CreatedAt', 'UpdatedAt', 'CreatedBy'] },
            { title: 'Transactions', headers: ['ID', 'Date', 'Vendor', 'Kind', 'Amount', 'Currency', 'Category', 'PayerId', 'Users', 'SubscriptionId', 'ReceiptRef', 'ReceiptUrl', 'Notes', 'Status', 'CreatedAt', 'UpdatedAt', 'CreatedBy'] },
            // Legacy sheet (mantener para migración)
            { title: 'Expenses', headers: ['ID', 'Date', 'Description', 'Amount', 'Currency', 'Category', 'Type', 'ReceiptUrl', 'Status'] }
        ];

        const requests = [];
        const headerUpdates = [];

        for (const req of requiredSheets) {
            if (!existingTitles.includes(req.title)) {
                console.log(`[GoogleSheets] Missing sheet found: ${req.title}. preparing creation.`);
                requests.push({
                    addSheet: { properties: { title: req.title } }
                });
                headerUpdates.push({
                    range: `${req.title}!A1`,
                    values: [req.headers]
                });
            }
        }

        if (requests.length > 0) {
            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: { requests }
            });

            await this.sheets.spreadsheets.values.batchUpdate({
                spreadsheetId,
                requestBody: {
                    valueInputOption: 'USER_ENTERED',
                    data: headerUpdates
                }
            });
        }

        // Verificar y actualizar headers de Tasks si falta CalendarId
        await this.ensureTasksHeaders(spreadsheetId);
    }

    /**
     * Asegura que la hoja Tasks tenga todas las columnas necesarias, incluyendo CalendarId
     */
    private async ensureTasksHeaders(spreadsheetId: string) {
        try {
            // Obtener la primera fila (headers)
            const headerResponse = await this.sheets.spreadsheets.values.get({
                spreadsheetId,
                range: 'Tasks!A1:P1',
            });

            const headers = headerResponse.data.values?.[0] || [];
            const requiredHeaders = ['ID', 'Title', 'Status', 'Area', 'Month', 'Week', 'Responsible', 'Notes', 'ScheduledDate', 'ScheduledTime', 'Attachments', 'Visibility', 'VisibleTo', 'MeetLink', 'AttendeeResponses', 'CalendarId'];
            
            // Verificar si falta CalendarId (columna P)
            if (headers.length < 16 || headers[15] !== 'CalendarId') {
                console.log('[GoogleSheets] Actualizando headers de Tasks para incluir CalendarId');
                
                // Actualizar solo la columna P si falta
                if (headers.length < 16) {
                    // Agregar CalendarId al final
                    await this.sheets.spreadsheets.values.update({
                        spreadsheetId,
                        range: 'Tasks!P1',
                        valueInputOption: 'USER_ENTERED',
                        requestBody: {
                            values: [['CalendarId']]
                        }
                    });
                } else if (headers[15] !== 'CalendarId') {
                    // Reemplazar el header incorrecto
                    await this.sheets.spreadsheets.values.update({
                        spreadsheetId,
                        range: 'Tasks!P1',
                        valueInputOption: 'USER_ENTERED',
                        requestBody: {
                            values: [['CalendarId']]
                        }
                    });
                }
            }
        } catch (error) {
            console.error('[GoogleSheets] Error verificando headers de Tasks:', error);
            // No fallar si hay error, solo loguear
        }
    }

    async getTasks(spreadsheetId: string): Promise<Task[]> {
        const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Tasks!A2:P', // Updated range to include meetLink (N), attendeeResponses (O), and calendarId (P)
        });

        const rows = response.data.values;
        if (!rows) return [];

        return rows
            .filter((row) => row.length > 0 && row[0]) // Filtrar filas vacías
            .map((row) => {
                // Validar y mapear tipos de forma segura
                const status = row[2] as string;
                const area = row[3] as string;
                const month = row[4] as string;

                // Parse visibility and visibleTo (columns L and M, if they exist)
                let visibility: VisibilityLevel = 'all';
                let visibleTo: string[] = [];
                if (row[11] !== undefined && row[11] !== null && String(row[11]).trim()) {
                    const visValue = String(row[11]).trim();
                    if (['all', 'department', 'individual'].includes(visValue)) {
                        visibility = visValue as VisibilityLevel;
                    }
                }
                if (row[12] !== undefined && row[12] !== null && String(row[12]).trim()) {
                    try {
                        const visibleToString = String(row[12]).trim();
                        if (visibleToString.startsWith('[') || visibleToString.startsWith('{')) {
                            // JSON array
                            const parsed = JSON.parse(visibleToString);
                            visibleTo = Array.isArray(parsed) ? parsed : [];
                        } else {
                            // Comma-separated string
                            visibleTo = visibleToString.split(',').map((s: string) => s.trim()).filter(Boolean);
                        }
                    } catch (e) {
                        console.error(`[GoogleSheets] Error parsing visibleTo for task ${row[0]}:`, e);
                        visibleTo = [];
                    }
                }

                // Parse meetLink (column N, if it exists)
                const meetLink = row[13] ? String(row[13]).trim() : undefined;
                
                // Debug logging para meetLink
                if (meetLink) {
                    console.log(`[GoogleSheets] Task ${row[0]} tiene meetLink: ${meetLink.substring(0, 50)}...`);
                } else if (row[13] !== undefined && row[13] !== null) {
                    console.log(`[GoogleSheets] Task ${row[0]} tiene columna N pero está vacía o inválida:`, row[13]);
                }

                // Parse hasMeet from notes or dedicated field
                let hasMeet = false;
                const notesString = String(row[7] || '');
                if (notesString.includes('Meet:') || meetLink) {
                    hasMeet = true;
                }
                
                // Si tiene meetLink, asegurar que hasMeet sea true
                if (meetLink && !hasMeet) {
                    hasMeet = true;
                }

                // Parse attendeeResponses (column O, if it exists)
                let attendeeResponses: { email: string; response: 'accepted' | 'declined' | 'tentative' }[] = [];
                if (row[14] !== undefined && row[14] !== null && String(row[14]).trim()) {
                    try {
                        const responsesString = String(row[14]).trim();
                        const parsed = JSON.parse(responsesString);
                        if (Array.isArray(parsed)) {
                            attendeeResponses = parsed.filter((r: any) => 
                                r.email && ['accepted', 'declined', 'tentative'].includes(r.response)
                            );
                        }
                    } catch (e) {
                        console.error(`[GoogleSheets] Error parsing attendeeResponses for task ${row[0]}:`, e);
                    }
                }

                // Parse calendarId (column P, if it exists)
                const calendarId = row[15] ? String(row[15]).trim() : undefined;

                return {
                    id: String(row[0] || ''),
                    title: String(row[1] || ''),
                    status: (['Pendiente', 'En Progreso', 'Completado', 'Bloqueado'].includes(status)
                        ? status : 'Pendiente') as TaskStatus,
                    area: (area && (['Guión', 'Técnico', 'Casting', 'Reporting', 'Pipeline',
                        'Post-producción', 'Investigación', 'Pre-visualización', 'Producción',
                        'Planificación', 'Crew'] as TaskArea[]).includes(area as TaskArea))
                        ? (area as TaskArea) : 'Planificación' as TaskArea,
                    month: (month && ['Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago'].includes(month)
                        ? month : 'Ene') as Month,
                    week: String(row[5] || 'Week 1'),
                    responsible: row[6] ? String(row[6]).split(',').map((s: string) => s.trim()).filter(Boolean) : [],
                    notes: String(row[7] || ''),
                    scheduledDate: row[8] ? String(row[8]) : undefined,
                    scheduledTime: row[9] ? String(row[9]) : undefined,
                    isScheduled: !!row[8],
                    hasMeet: hasMeet,
                    meetLink: meetLink,
                    visibility: visibility,
                    visibleTo: visibleTo,
                    attendeeResponses: attendeeResponses,
                    calendarId: calendarId,
                    attachments: (() => {
                        try {
                            if (!row[10] || !row[10].toString().trim()) {
                                console.log(`[GoogleSheets] Task ${row[0]} has no attachments (column K is empty)`);
                                return [];
                            }
                            const attachmentString = row[10].toString().trim();
                            console.log(`[GoogleSheets] Parsing attachments for task ${row[0]}:`, attachmentString.substring(0, 100));
                            const parsed = JSON.parse(attachmentString);
                            const result = Array.isArray(parsed) ? parsed : [];
                            console.log(`[GoogleSheets] Task ${row[0]} loaded ${result.length} attachments`);
                            return result;
                        } catch (e) {
                            console.error(`[GoogleSheets] Error parsing attachments for task ${row[0]}:`, e);
                            console.error(`[GoogleSheets] Raw value:`, row[10]);
                            return [];
                        }
                    })()
                } as Task;
            });
    }

    async addTask(spreadsheetId: string, task: Task) {
        // Asegurar que attachments sea un array válido antes de stringify
        const attachmentsToSave = Array.isArray(task.attachments) ? task.attachments : [];
        const attachmentsJson = attachmentsToSave.length > 0 ? JSON.stringify(attachmentsToSave) : '';
        
        // Asegurar que responsible sea un array válido
        const responsibleArray = Array.isArray(task.responsible) ? task.responsible : [];
        const responsibleString = responsibleArray.length > 0 ? responsibleArray.join(', ') : '';
        
        // Guardar visibility y visibleTo
        const visibility = task.visibility || 'all';
        const visibleToArray = Array.isArray(task.visibleTo) ? task.visibleTo : [];
        const visibleToJson = visibleToArray.length > 0 ? JSON.stringify(visibleToArray) : '';
        
        const values = [
            [
                task.id,
                task.title,
                task.status,
                task.area,
                task.month,
                task.week,
                responsibleString,
                task.notes || '',
                task.scheduledDate || '',
                task.scheduledTime || '',
                attachmentsJson,
                visibility,
                visibleToJson,
                task.meetLink || '', // Column N for meetLink
                task.attendeeResponses && task.attendeeResponses.length > 0 
                    ? JSON.stringify(task.attendeeResponses) 
                    : '', // Column O for attendeeResponses
                task.calendarId || '' // Column P for calendarId
            ],
        ];

        await this.sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Tasks!A:P',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values,
            },
        });
    }

    async updateTask(spreadsheetId: string, task: Task) {
        const rowIndex = await this.findTaskRowIndex(spreadsheetId, task.id);
        if (rowIndex === -1) {
            throw new Error(`Task with ID ${task.id} not found`);
        }

        // Asegurar que attachments sea un array válido antes de stringify
        const attachmentsToSave = Array.isArray(task.attachments) ? task.attachments : [];
        const attachmentsJson = attachmentsToSave.length > 0 ? JSON.stringify(attachmentsToSave) : '';

        // Asegurar que responsible sea un array válido
        const responsibleArray = Array.isArray(task.responsible) ? task.responsible : [];
        const responsibleString = responsibleArray.length > 0 ? responsibleArray.join(', ') : '';
        
        // Guardar visibility y visibleTo
        const visibility = task.visibility || 'all';
        const visibleToArray = Array.isArray(task.visibleTo) ? task.visibleTo : [];
        const visibleToJson = visibleToArray.length > 0 ? JSON.stringify(visibleToArray) : '';

        const values = [
            [
                task.id,
                task.title,
                task.status,
                task.area,
                task.month,
                task.week,
                responsibleString,
                task.notes || '',
                task.scheduledDate || '',
                task.scheduledTime || '',
                attachmentsJson,
                visibility,
                visibleToJson,
                task.meetLink || '', // Column N for meetLink
                task.attendeeResponses && task.attendeeResponses.length > 0 
                    ? JSON.stringify(task.attendeeResponses) 
                    : '', // Column O for attendeeResponses
                task.calendarId || '' // Column P for calendarId
            ],
        ];

        await this.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Tasks!A${rowIndex}:P${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values,
            },
        });
    }

    async deleteTask(spreadsheetId: string, taskId: string) {
        console.log(`[GoogleSheets] deleteTask called for taskId: ${taskId}`);

        const rowIndex = await this.findTaskRowIndex(spreadsheetId, taskId);
        console.log(`[GoogleSheets] Found task at rowIndex: ${rowIndex}`);

        if (rowIndex === -1) {
            throw new Error(`Task with ID ${taskId} not found`);
        }

        const sheetId = await this.getSheetId(spreadsheetId, 'Tasks');
        console.log(`[GoogleSheets] Sheet ID: ${sheetId}, deleting row ${rowIndex} (0-based: ${rowIndex - 1} to ${rowIndex})`);

        await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    {
                        deleteDimension: {
                            range: {
                                sheetId,
                                dimension: 'ROWS',
                                startIndex: rowIndex - 1,
                                endIndex: rowIndex,
                            },
                        },
                    },
                ],
            },
        });

        console.log(`[GoogleSheets] Row deleted successfully`);
    }

    private async findTaskRowIndex(spreadsheetId: string, taskId: string): Promise<number> {
        const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Tasks!A:A',
        });

        const rows = response.data.values;
        if (!rows) return -1;

        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] === taskId) {
                return i + 1;
            }
        }

        return -1;
    }

    // --- Team Methods ---

    async getTeam(spreadsheetId: string): Promise<any[]> {
        const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Team!A2:K', // Extended range for all fields
        });

        const rows = response.data.values;
        if (!rows) return [];

        return rows
            .filter((row) => row.length > 0 && row[0])
            .map((row) => ({
                id: row[0],
                name: row[1],
                email: row[2],
                role: row[3], // Legacy/Display Role
                department: row[4],
                position: row[5],
                status: row[6],
                type: row[7],
                phone: row[8],
                accessGranted: row[9] === 'TRUE', // Persisted Access Flag
                metadata: row[10] ? JSON.parse(row[10]) : {}, // Store extras in JSON to save columns? Or flatten.
            }));
    }

    async addMember(spreadsheetId: string, member: any) {
        const values = [
            [
                member.id,
                member.name,
                member.email || '',
                member.role || '',
                member.department || '',
                member.position || '',
                member.status || '',
                member.type || '',
                member.phone || '',
                member.accessGranted === true ? 'TRUE' : 'FALSE',
                JSON.stringify({
                    socials: member.socials,
                    union: member.union,
                    notes: member.notes
                })
            ],
        ];

        await this.sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Team!A:K',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values },
        });
    }

    async updateMember(spreadsheetId: string, member: any) {
        const rowIndex = await this.findMemberRowIndex(spreadsheetId, member.id);
        if (rowIndex === -1) throw new Error(`Member ${member.id} not found`);

        const values = [
            [
                member.id,
                member.name,
                member.email || '',
                member.role || '',
                member.department || '',
                member.position || '',
                member.status || '',
                member.type || '',
                member.phone || '',
                member.accessGranted === true ? 'TRUE' : 'FALSE',
                JSON.stringify({
                    socials: member.socials,
                    union: member.union,
                    notes: member.notes
                })
            ],
        ];

        await this.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Team!A${rowIndex}:K${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values },
        });
    }

    async deleteMember(spreadsheetId: string, memberId: string) {
        const rowIndex = await this.findMemberRowIndex(spreadsheetId, memberId);
        if (rowIndex === -1) throw new Error(`Member ${memberId} not found`);

        const sheetId = await this.getSheetId(spreadsheetId, 'Team');

        await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex - 1,
                            endIndex: rowIndex,
                        },
                    },
                }],
            },
        });
    }

    private async findMemberRowIndex(spreadsheetId: string, memberId: string): Promise<number> {
        const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Team!A:A',
        });
        const rows = response.data.values;
        if (!rows) return -1;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] === memberId) return i + 1;
        }
        return -1;
    }

    // ... existing helpers ...

    private async getSheetId(spreadsheetId: string, sheetName: string): Promise<number> {
        const response = await this.sheets.spreadsheets.get({
            spreadsheetId,
            fields: 'sheets.properties',
        });

        const sheet = response.data.sheets?.find(
            (s) => s.properties?.title === sheetName
        );

        if (!sheet?.properties?.sheetId) {
            throw new Error(`Sheet ${sheetName} not found`);
        }

        return sheet.properties.sheetId;
    }

    // Push Subscriptions Management
    async ensurePushSubscriptionsSheet(spreadsheetId: string): Promise<void> {
        try {
            await this.getSheetId(spreadsheetId, 'PushSubscriptions');
        } catch {
            // Sheet doesn't exist, create it
            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: 'PushSubscriptions',
                            },
                        },
                    }],
                },
            });

            // Add headers
            await this.sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'PushSubscriptions!A1:D1',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [['User Email', 'Subscription', 'Created At', 'Last Used']],
                },
            });
        }
    }

    async savePushSubscription(
        spreadsheetId: string,
        data: { userEmail: string; subscription: string; createdAt: string }
    ): Promise<void> {
        await this.ensurePushSubscriptionsSheet(spreadsheetId);

        const rowIndex = await this.findPushSubscriptionRowIndex(spreadsheetId, data.userEmail);
        
        const values = [[
            data.userEmail,
            data.subscription,
            data.createdAt,
            new Date().toISOString(), // Last Used
        ]];

        if (rowIndex === -1) {
            // Nueva suscripción
            await this.sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'PushSubscriptions!A:D',
                valueInputOption: 'USER_ENTERED',
                requestBody: { values },
            });
        } else {
            // Actualizar existente
            await this.sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `PushSubscriptions!A${rowIndex}:D${rowIndex}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values },
            });
        }
    }

    async getPushSubscription(spreadsheetId: string, userEmail: string): Promise<{
        userEmail: string;
        subscription: string;
        createdAt: string;
        lastUsed?: string;
    } | null> {
        await this.ensurePushSubscriptionsSheet(spreadsheetId);

        const rowIndex = await this.findPushSubscriptionRowIndex(spreadsheetId, userEmail);
        if (rowIndex === -1) return null;

        const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `PushSubscriptions!A${rowIndex}:D${rowIndex}`,
        });

        const row = response.data.values?.[0];
        if (!row || row.length < 3) return null;

        return {
            userEmail: String(row[0] || ''),
            subscription: String(row[1] || ''),
            createdAt: String(row[2] || ''),
            lastUsed: row[3] ? String(row[3]) : undefined,
        };
    }

    async updatePushSubscriptionLastUsed(spreadsheetId: string, userEmail: string): Promise<void> {
        const rowIndex = await this.findPushSubscriptionRowIndex(spreadsheetId, userEmail);
        if (rowIndex === -1) return;

        await this.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `PushSubscriptions!D${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[new Date().toISOString()]],
            },
        });
    }

    async deletePushSubscription(spreadsheetId: string, userEmail: string): Promise<void> {
        const rowIndex = await this.findPushSubscriptionRowIndex(spreadsheetId, userEmail);
        if (rowIndex === -1) return;

        const sheetId = await this.getSheetId(spreadsheetId, 'PushSubscriptions');

        await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex - 1,
                            endIndex: rowIndex,
                        },
                    },
                }],
            },
        });
    }

    async getAllPushSubscriptions(spreadsheetId: string): Promise<Array<{
        userEmail: string;
        subscription: string;
        createdAt: string;
        lastUsed?: string;
    }>> {
        await this.ensurePushSubscriptionsSheet(spreadsheetId);

        const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'PushSubscriptions!A2:D',
        });

        const rows = response.data.values || [];
        return rows
            .filter(row => row[0] && row[1]) // Tiene email y subscription
            .map(row => ({
                userEmail: String(row[0]),
                subscription: String(row[1]),
                createdAt: String(row[2] || ''),
                lastUsed: row[3] ? String(row[3]) : undefined,
            }));
    }

    private async findPushSubscriptionRowIndex(spreadsheetId: string, userEmail: string): Promise<number> {
        await this.ensurePushSubscriptionsSheet(spreadsheetId);

        const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'PushSubscriptions!A:A',
        });
        const rows = response.data.values;
        if (!rows) return -1;
        for (let i = 1; i < rows.length; i++) { // Start from 1 to skip header
            if (rows[i][0]?.toLowerCase() === userEmail.toLowerCase()) {
                return i + 1; // +1 because Sheets is 1-indexed
            }
        }
        return -1;
    }
}
