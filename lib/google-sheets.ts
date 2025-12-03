import { google } from 'googleapis';
import { Task, Gate, TeamMember } from './types';

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
    async getOrCreateDatabase(): Promise<string> {
        // Search for the file
        const search = await this.drive.files.list({
            q: "name = 'Archipielago_DB' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false",
            fields: 'files(id, name)',
        });

        if (search.data.files && search.data.files.length > 0) {
            return search.data.files[0].id!;
        }

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

        const spreadsheetId = spreadsheet.data.spreadsheetId!;

        // Initialize sheets (tabs)
        await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    {
                        addSheet: {
                            properties: { title: 'Tasks' },
                        },
                    },
                    {
                        addSheet: {
                            properties: { title: 'Gates' },
                        },
                    },
                    {
                        addSheet: {
                            properties: { title: 'Team' },
                        },
                    },
                    // Delete the default 'Sheet1'
                    {
                        deleteSheet: {
                            sheetId: 0,
                        },
                    },
                ],
            },
        });

        // Add headers
        await this.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId,
            requestBody: {
                valueInputOption: 'USER_ENTERED',
                data: [
                    {
                        range: 'Tasks!A1',
                        values: [['ID', 'Title', 'Status', 'Area', 'Month', 'Week', 'Responsible', 'Notes', 'ScheduledDate', 'ScheduledTime']],
                    },
                    {
                        range: 'Gates!A1',
                        values: [['ID', 'Title', 'Status', 'Date', 'Description']],
                    },
                    {
                        range: 'Team!A1',
                        values: [['ID', 'Name', 'Email', 'Role', 'Avatar']],
                    },
                ],
            },
        });

        return spreadsheetId;
    }

    async getTasks(spreadsheetId: string): Promise<Task[]> {
        const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Tasks!A2:J', // Updated range
        });

        const rows = response.data.values;
        if (!rows) return [];

        return rows.map((row) => ({
            id: row[0],
            title: row[1],
            status: row[2] as any,
            area: row[3] as any,
            month: row[4] as any,
            week: row[5] || 'Week 1',
            responsible: row[6] ? row[6].split(',').map((s: string) => s.trim()) : [],
            notes: row[7],
            scheduledDate: row[8] || undefined,
            scheduledTime: row[9] || undefined,
            isScheduled: !!row[8],
        }));
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

    // Similar methods for Gates and Team...
}
