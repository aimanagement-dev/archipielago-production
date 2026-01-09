import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { Task, TaskArea, TaskStatus, Month } from '@/lib/types';
import { isUserAdmin } from '@/lib/constants';
import { generateId } from '@/lib/utils';

const TASKS_RANGE = 'A8:F20';
const MONTH_TAB_MAP: Record<string, Month> = {
    noviembre: 'Nov',
    diciembre: 'Dic',
    enero: 'Ene',
    febrero: 'Feb',
    marzo: 'Mar',
    abril: 'Abr',
    mayo: 'May',
    junio: 'Jun',
    julio: 'Jul',
    agosto: 'Ago',
};

const AREA_MAP: Record<string, TaskArea> = {
    guion: 'Guión',
    tecnico: 'Técnico',
    casting: 'Casting',
    reporting: 'Reporting',
    pipeline: 'Pipeline',
    postproduccion: 'Post-producción',
    investigacion: 'Investigación',
    previsualizacion: 'Pre-visualización',
    produccion: 'Producción',
    planificacion: 'Planificación',
    crew: 'Crew',
};

const normalizeText = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

const getMonthFromTab = (title: string): Month | null => {
    const key = normalizeText(title);
    for (const [monthName, code] of Object.entries(MONTH_TAB_MAP)) {
        if (key.includes(monthName)) {
            return code;
        }
    }
    return null;
};

const normalizeArea = (raw?: string): TaskArea => {
    const key = raw ? normalizeText(raw) : '';
    return AREA_MAP[key] || 'Planificación';
};

const normalizeStatus = (raw?: string): TaskStatus => {
    const value = raw ? normalizeText(raw) : '';
    if (value.includes('progreso') || value.includes('curso')) return 'En Progreso';
    if (value.includes('complet')) return 'Completado';
    if (value.includes('bloque')) return 'Bloqueado';
    return 'Pendiente';
};

const parseResponsible = (raw?: string): string[] => {
    if (!raw) return [];
    const normalized = raw.replace(/\s+y\s+/gi, ',').replace(/&/g, ',');
    return normalized
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
};

export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) { // Simple auth check
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user?.email || '';
    const isAdmin = isUserAdmin(userEmail);
    if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const service = new GoogleSheetsService(session.accessToken as string);
        const spreadsheetId = await service.findDatabase();
        
        if (!spreadsheetId) {
            return NextResponse.json({ 
                error: "No se encontró el spreadsheet centralizado. Verifica los permisos." 
            }, { status: 500 });
        }

        await service.ensureSchema(spreadsheetId);

        const sheetTitles = await service.listSheetTitles(spreadsheetId);
        const monthTabs = sheetTitles
            .map((title) => ({ title, month: getMonthFromTab(title) }))
            .filter((entry): entry is { title: string; month: Month } => Boolean(entry.month));

        if (monthTabs.length === 0) {
            return NextResponse.json({
                error: "No se encontraron tabs mensuales (Noviembre, Diciembre, Enero, etc.) en el Google Sheet."
            }, { status: 400 });
        }

        const tasksToImport: Task[] = [];

        for (const { title, month } of monthTabs) {
            const rows = await service.getRangeValues(spreadsheetId, `${title}!${TASKS_RANGE}`);

            for (const row of rows) {
                if (!row || row.length === 0) continue;

                const titleRaw = row[2] ? String(row[2]).trim() : '';
                if (!titleRaw) continue;

                const titleKey = normalizeText(titleRaw);
                if (titleKey.includes('descripcion')) continue;

                const weekRaw = row[0] ? String(row[0]).trim() : '';
                const areaRaw = row[1] ? String(row[1]).trim() : '';
                const responsibleRaw = row[3] ? String(row[3]).trim() : '';
                const statusRaw = row[4] ? String(row[4]).trim() : '';
                const notesRaw = row[5] ? String(row[5]).trim() : '';

                tasksToImport.push({
                    id: generateId(),
                    title: titleRaw,
                    area: normalizeArea(areaRaw),
                    status: normalizeStatus(statusRaw),
                    month,
                    week: weekRaw || 'Week 1',
                    responsible: parseResponsible(responsibleRaw),
                    notes: notesRaw,
                    isScheduled: false,
                    attachments: [],
                    visibility: 'all',
                    visibleTo: [],
                });
            }
        }

        if (tasksToImport.length === 0) {
            return NextResponse.json({
                error: "No se encontraron tareas para importar. Verifica que las tabs mensuales tengan datos entre A8:F20."
            }, { status: 400 });
        }

        await service.clearTasks(spreadsheetId);

        for (const task of tasksToImport) {
            await service.addTask(spreadsheetId, task);
        }

        return NextResponse.json({
            success: true,
            imported: tasksToImport.length,
            count: tasksToImport.length,
            tabs: monthTabs.map((entry) => entry.title),
        });

    } catch (error: any) {
        console.error("Import error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
