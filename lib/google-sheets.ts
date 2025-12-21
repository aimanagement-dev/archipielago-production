import { google } from 'googleapis';
import { Task, TaskStatus, TaskArea, Month } from './types';

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
            { title: 'Tasks', headers: ['ID', 'Title', 'Status', 'Area', 'Month', 'Week', 'Responsible', 'Notes', 'ScheduledDate', 'ScheduledTime'] },
            { title: 'Gates', headers: ['ID', 'Title', 'Status', 'Date', 'Description'] },
            { title: 'Team', headers: ['ID', 'Name', 'Email', 'Role', 'Department', 'Position', 'Status', 'Type', 'Phone', 'AccessGranted', 'Metadata'] },
            { title: 'Subscriptions', headers: ['ID', 'Platform', 'Category', 'Cost', 'Currency', 'BillingCycle', 'RenewalDay', 'CardUsed', 'Status', 'Owner', 'Notes'] },
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
    }

    async getTasks(spreadsheetId: string): Promise<Task[]> {
        const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Tasks!A2:J', // Updated range
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
                    responsible: row[6] ? String(row[6]).split(',').map((s: string) => s.trim()) : [],
                    notes: String(row[7] || ''),
                    scheduledDate: row[8] ? String(row[8]) : undefined,
                    scheduledTime: row[9] ? String(row[9]) : undefined,
                    isScheduled: !!row[8],
                } as Task;
            });
    }

    async addTask(spreadsheetId: string, task: Task) {
        const values = [
            [
                task.id,
                task.title,
                task.status,
                task.area,
                task.month,
                task.week,
                task.responsible.join(', '),
                task.notes || '',
                task.scheduledDate || '',
                task.scheduledTime || '',
            ],
        ];

        await this.sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Tasks!A:J',
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

        const values = [
            [
                task.id,
                task.title,
                task.status,
                task.area,
                task.month,
                task.week,
                task.responsible.join(', '),
                task.notes || '',
                task.scheduledDate || '',
                task.scheduledTime || '',
            ],
        ];

        await this.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Tasks!A${rowIndex}:J${rowIndex}`,
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
}
