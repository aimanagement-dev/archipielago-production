import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth-config';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { Subscription, Transaction } from '@/lib/types';
import { isUserAdmin } from '@/lib/constants';
import crypto from 'crypto';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const accessToken = (session as any).accessToken;
    const sheetsService = new GoogleSheetsService(accessToken);
    const spreadsheetId = await sheetsService.getOrCreateDatabase();

    try {
        const response = await sheetsService['sheets'].spreadsheets.values.batchGet({
            spreadsheetId,
            ranges: ['Subscriptions!A2:P', 'Transactions!A2:Q']
        });

        const subsRows = response.data.valueRanges?.[0].values || [];
        const transRows = response.data.valueRanges?.[1].values || [];

        // Helper: Validar si una fila de suscripción es válida
        const isValidSubscription = (row: any[]): boolean => {
            const platform = row[1] || ''; // Columna B (Platform)
            if (!platform || typeof platform !== 'string') return false;

            // Excluir headers y resúmenes
            const invalidPlatforms = [
                'RESUMEN MENSUAL', 'Mes', 'Total Proyecto', 'Promedio Mensual',
                'Platform', 'ID', 'ID', '' // Headers posibles
            ];
            if (invalidPlatforms.includes(platform.trim())) return false;

            // Excluir nombres de meses (November 2025, December 2025, etc.)
            if (platform.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s\d{4}$/i)) {
                return false;
            }

            // Excluir si el status es "Total" o similar
            const status = row[8] || '';
            if (status && typeof status === 'string' && status.toLowerCase().includes('total')) {
                return false;
            }

            return true;
        };

        // Parse Subscriptions (nuevo formato con integración Crew) - FILTRAR inválidas
        const subscriptions = subsRows
            .filter(isValidSubscription)
            .map(row => {
                const sub: Partial<Subscription> = {
                    id: row[0] || '',
                    platform: row[1] || '',
                    category: row[2] || '',
                    amount: parseFloat(row[3] || '0'),
                    currency: (row[4] || 'USD') as 'USD' | 'DOP' | 'EUR',
                    billingCycle: (row[5] || 'Monthly') as 'Monthly' | 'Yearly',
                    renewalDay: parseInt(row[6] || '1'),
                    cardUsed: row[7] || '',
                    status: (row[8] || 'Active') as Subscription['status'],
                    ownerId: row[9] || undefined,
                    users: row[10] ? (typeof row[10] === 'string' ? row[10].split(',').filter(Boolean) : []) : [],
                    receiptUrl: row[11] || undefined,
                    notes: row[12] || undefined,
                    createdAt: row[13] || new Date().toISOString(),
                    updatedAt: row[14] || new Date().toISOString(),
                    createdBy: row[15] || undefined,
                };
                // Legacy compatibility
                if (!sub.ownerId && row[9]) sub.owner = row[9];
                if (!sub.amount && row[3]) sub.cost = parseFloat(row[3] || '0');
                return sub as Subscription;
            });

        // Parse Transactions (nuevo formato)
        const transactions = transRows.map(row => {
            const trans: Partial<Transaction> = {
                id: row[0] || '',
                date: row[1] || new Date().toISOString().split('T')[0],
                vendor: row[2] || '',
                kind: (row[3] || 'one_off') as Transaction['kind'],
                amount: parseFloat(row[4] || '0'),
                currency: (row[5] || 'USD') as 'USD' | 'DOP' | 'EUR',
                category: row[6] || '',
                payerId: row[7] || undefined,
                users: row[8] ? (typeof row[8] === 'string' ? row[8].split(',').filter(Boolean) : []) : [],
                subscriptionId: row[9] || undefined,
                receiptRef: row[10] || undefined,
                receiptUrl: row[11] || undefined,
                notes: row[12] || undefined,
                status: (row[13] || 'pending') as Transaction['status'],
                createdAt: row[14] || new Date().toISOString(),
                updatedAt: row[15] || new Date().toISOString(),
                createdBy: row[16] || undefined,
            };
            return trans as Transaction;
        });

        // Si no hay Transactions, intentar leer Expenses (legacy)
        let expenses: any[] = [];
        if (transactions.length === 0) {
            try {
                const expResponse = await sheetsService['sheets'].spreadsheets.values.get({
                    spreadsheetId,
                    range: 'Expenses!A2:I'
                });
                const expRows = expResponse.data.values || [];
                expenses = expRows.map(row => ({
                    id: row[0],
                    date: row[1],
                    description: row[2],
                    amount: parseFloat(row[3] || '0'),
                    currency: row[4] || 'USD',
                    category: row[5] || '',
                    type: row[6] || 'One-off',
                    receiptUrl: row[7] || undefined,
                    status: row[8] || 'Pending'
                }));
            } catch (e) {
                // Expenses sheet no existe o está vacía, no pasa nada
            }
        }

        return NextResponse.json({ subscriptions, transactions, expenses });
    } catch (error) {
        console.error('Error fetching finance data:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userEmail = session.user?.email || '';
    const isAdmin = isUserAdmin(userEmail);
    if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const accessToken = (session as any).accessToken;
    const sheetsService = new GoogleSheetsService(accessToken);
    const spreadsheetId = await sheetsService.getOrCreateDatabase();

    const body = await req.json();
    const { type, data } = body; // type: 'subscription' | 'expense' | 'import_legacy'

    try {
        if (type === 'import_legacy') {
            // 1. Read from Legacy Sheet
            const legacySpreadsheetId = '1ZSVEv_c2bZ1PUpX9uWuiaz32rJSJdch14Psy3J7F_qY';
            const response = await sheetsService['sheets'].spreadsheets.values.get({
                spreadsheetId: legacySpreadsheetId,
                range: 'OVERVIEW!A5:I60', // Read enough rows
            });

            const rows = response.data.values;
            if (!rows || rows.length === 0) return NextResponse.json({ success: true, message: 'No data found' });

            // 2. Map to New Schema - Filtro mejorado
            const newSubs = rows
                .filter(row => {
                    const platform = row[0];
                    if (!platform || typeof platform !== 'string') return false;

                    // Filter out empty rows, summary headers
                    const invalidPlatforms = [
                        'RESUMEN MENSUAL', 'Mes', 'Total Proyecto', 'Promedio Mensual',
                        'Platform', 'ID', '' // Headers posibles
                    ];
                    if (invalidPlatforms.includes(platform.trim())) return false;

                    // Check for dates in platform like "November 2025" or "Nov 2025" (case insensitive)
                    if (platform.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s\d{4}$/i)) {
                        return false;
                    }

                    // Check Col G (Status). If it is "Total", it's a summary row.
                    const status = row[6];
                    if (status && typeof status === 'string' && status.toLowerCase().includes('total')) {
                        return false;
                    }

                    return true;
                })
                .map(row => {
                    // Parse Cost: "$11.00" -> 11.00
                    const costString = row[3] ? row[3].replace(/[$,]/g, '') : '0';
                    const renewalMonthStr = row[2] || '';

                    let day = 1;
                    const dayMatch = renewalMonthStr.match(/\d+/);
                    if (dayMatch) day = parseInt(dayMatch[0]);

                    // Map Status (Col G / index 6)
                    let status = 'Active';
                    if (row[6]) {
                        const s = row[6].toLowerCase();
                        if (s.includes('cancel')) status = 'Cancelled';
                        else if (s.includes('activ')) status = 'Active';
                        else if (s.includes('paus')) status = 'Paused';
                    }

                    return [
                        crypto.randomUUID(), // ID
                        row[0], // Platform
                        row[1], // Category
                        parseFloat(costString), // Cost
                        row[4] || 'USD', // Currency
                        'Monthly', // BillingCycle (Default)
                        day, // RenewalDay
                        row[5], // CardUsed
                        status, // Status (Mapped)
                        row[7], // Owner
                        row[8] // Notes
                    ];
                });

            // 3. Write to Subscriptions
            if (newSubs.length > 0) {
                await sheetsService['sheets'].spreadsheets.values.append({
                    spreadsheetId,
                    range: 'Subscriptions!A:K',
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: newSubs }
                });
            }
            return NextResponse.json({ success: true, count: newSubs.length });

        } else if (type === 'import_monthly_expenses') {
            const legacySpreadsheetId = '1ZSVEv_c2bZ1PUpX9uWuiaz32rJSJdch14Psy3J7F_qY';
            const monthsToImport = ['Noviembre 2025', 'Diciembre 2025']; // Add more if needed or dynamic
            let totalImported = 0;

            for (const monthSheet of monthsToImport) {
                try {
                    const response = await sheetsService['sheets'].spreadsheets.values.get({
                        spreadsheetId: legacySpreadsheetId,
                        range: `${monthSheet}!A4:F50`, // Adjust range based on typical sheet structure
                    });

                    const rows = response.data.values;
                    if (!rows || rows.length === 0) continue;

                    // Map rows to Expenses
                    // Assumed Legacy Structure:
                    // Col A: Date? Or Item Name?
                    // Typically: Item | Category | ... | Cost | ...
                    // Let's assume:
                    // A: Item/Description
                    // B: Category
                    // C: ???
                    // D: Cost (Amount)
                    // E: Currency?

                    const expenses = rows
                        .filter(row => row[0] && row[0] !== 'Total' && row[3]) // Basic filter
                        .map(row => {
                            const amountStr = row[3] ? row[3].replace(/[$,]/g, '') : '0';
                            const amount = parseFloat(amountStr);

                            if (isNaN(amount) || amount === 0) return null;

                            // construct a date. 
                            // If sheet is "Noviembre 2025", we can default to 1st of month or try to find a date column.
                            // If no date col, use 1st of month.
                            const monthIndex = monthSheet.includes('Noviembre') ? 10 : 11; // 0-indexed
                            const year = 2025;
                            // check if row has a specific date? Maybe Col F? 
                            // Let's default to Day 1 for now to ensure it lands in the month.
                            const date = new Date(year, monthIndex, 1).toISOString();

                            return [
                                crypto.randomUUID(), // ID
                                date,
                                row[0], // Description (Item)
                                amount,
                                'USD', // Default currency
                                row[1] || 'General', // Category
                                'variable', // Type (vs fixed)
                                '', // Receipt
                                'Paid' // Status
                            ];
                        })
                        .filter(x => x !== null);

                    if (expenses.length > 0) {
                        await sheetsService['sheets'].spreadsheets.values.append({
                            spreadsheetId,
                            range: 'Expenses!A:I',
                            valueInputOption: 'USER_ENTERED',
                            requestBody: { values: expenses }
                        });
                        totalImported += expenses.length;
                    }

                } catch (err) {
                    console.error(`Failed to import ${monthSheet}:`, err);
                }
            }
            return NextResponse.json({ success: true, count: totalImported, months: monthsToImport });

        } else if (type === 'subscription') {
            const now = new Date().toISOString();
            const subId = data.id || crypto.randomUUID();
            await sheetsService['sheets'].spreadsheets.values.append({
                spreadsheetId,
                range: 'Subscriptions!A:P',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [[
                        subId,
                        data.platform || '',
                        data.category || '',
                        parseFloat(data.amount || data.cost || '0'), // Support both 'amount' and legacy 'cost'
                        data.currency || 'USD',
                        data.billingCycle || 'Monthly',
                        parseInt(data.renewalDay || '1'),
                        data.cardUsed || '',
                        data.status || 'Active',
                        data.ownerId || '', // TeamMember ID
                        (data.users && Array.isArray(data.users) ? data.users.join(',') : '') || '', // Users as comma-separated
                        data.receiptUrl || '',
                        data.notes || '',
                        data.createdAt || now,
                        now, // updatedAt
                        session.user?.email || '' // createdBy
                    ]]
                }
            });
        } else if (type === 'transaction') {
            const now = new Date().toISOString();
            const transId = data.id || crypto.randomUUID();
            await sheetsService['sheets'].spreadsheets.values.append({
                spreadsheetId,
                range: 'Transactions!A:Q',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [[
                        transId,
                        data.date || new Date().toISOString().split('T')[0],
                        data.vendor || '',
                        data.kind || 'one_off',
                        parseFloat(data.amount || '0'),
                        data.currency || 'USD',
                        data.category || '',
                        data.payerId || '', // TeamMember ID
                        (data.users && Array.isArray(data.users) ? data.users.join(',') : '') || '',
                        data.subscriptionId || '',
                        data.receiptRef || '',
                        data.receiptUrl || '',
                        data.notes || '',
                        data.status || 'pending',
                        data.createdAt || now,
                        now, // updatedAt
                        session.user?.email || '' // createdBy
                    ]]
                }
            });
        } else if (type === 'import_monthly_expenses') {
            // Importar gastos variables desde hojas mensuales (Nov y Dec)
            const legacySpreadsheetId = '1ZSVEv_c2bZ1PUpX9uWuiaz32rJSJdch14Psy3J7F_qY';
            const months = ['November 2025', 'December 2025']; // Solo estos tienen datos

            const allTransactions: any[] = [];

            for (const monthName of months) {
                try {
                    // Leer hoja mensual - buscar rango "REGISTRO DE GASTOS"
                    const monthResponse = await sheetsService['sheets'].spreadsheets.values.get({
                        spreadsheetId: legacySpreadsheetId,
                        range: `'${monthName}'!A:J`, // Ajustar rango según estructura
                    });

                    const monthRows = monthResponse.data.values || [];
                    if (!monthRows || monthRows.length === 0) continue;

                    // Buscar fila "REGISTRO DE GASTOS" o similar
                    let startRow = -1;
                    for (let i = 0; i < monthRows.length; i++) {
                        const row = monthRows[i];
                        if (row && row[0] && typeof row[0] === 'string') {
                            if (row[0].toLowerCase().includes('registro') ||
                                row[0].toLowerCase().includes('gastos') ||
                                row[0].toLowerCase().includes('expenses')) {
                                startRow = i + 1; // Siguiente fila después del header
                                break;
                            }
                        }
                    }

                    if (startRow === -1) {
                        // Si no encuentra header, asumir que empieza después de fila 5
                        startRow = 5;
                    }

                    // Parsear gastos desde startRow
                    for (let i = startRow; i < monthRows.length; i++) {
                        const row = monthRows[i];
                        if (!row || !row[0]) continue; // Skip empty rows

                        const description = row[0] || '';
                        if (!description || description.trim() === '') continue;

                        // Skip headers y totales
                        if (description.toLowerCase().includes('total') ||
                            description.toLowerCase().includes('subtotal') ||
                            description.toLowerCase().includes('mes') ||
                            description.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s\d{4}$/i)) {
                            continue;
                        }

                        // Parsear campos (ajustar índices según estructura real del Excel)
                        const amountStr = row[1] || row[2] || '0'; // Ajustar según columna de monto
                        const amount = parseFloat(amountStr.toString().replace(/[$,]/g, '')) || 0;
                        if (amount === 0) continue; // Skip si no hay monto

                        const dateStr = row[2] || row[3] || ''; // Ajustar según columna de fecha
                        let date = new Date().toISOString().split('T')[0];
                        if (dateStr) {
                            // Intentar parsear fecha
                            const parsedDate = new Date(dateStr);
                            if (!isNaN(parsedDate.getTime())) {
                                date = parsedDate.toISOString().split('T')[0];
                            } else {
                                // Si no se puede parsear, usar mes del nombre de la hoja
                                const monthMatch = monthName.match(/(\w+)\s(\d{4})/);
                                if (monthMatch) {
                                    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                                        'July', 'August', 'September', 'October', 'November', 'December'];
                                    const monthIndex = monthNames.indexOf(monthMatch[1]);
                                    if (monthIndex !== -1) {
                                        date = `${monthMatch[2]}-${String(monthIndex + 1).padStart(2, '0')}-01`;
                                    }
                                }
                            }
                        }

                        // Determinar si es gasto extra de suscripción o one-off
                        let kind: 'fixed' | 'extra' | 'one_off' | 'trial' = 'one_off';
                        let subscriptionId: string | undefined = undefined;

                        // Buscar suscripción por nombre en description
                        const descLower = description.toLowerCase();
                        const allSubs = await sheetsService['sheets'].spreadsheets.values.get({
                            spreadsheetId,
                            range: 'Subscriptions!A2:B'
                        });
                        const existingSubs = allSubs.data.values || [];
                        for (const subRow of existingSubs) {
                            if (subRow && subRow[1]) {
                                const subPlatform = subRow[1].toLowerCase();
                                if (descLower.includes(subPlatform) || subPlatform.includes(descLower)) {
                                    subscriptionId = subRow[0]; // ID de suscripción
                                    kind = 'extra'; // Es gasto extra de suscripción
                                    break;
                                }
                            }
                        }

                        const category = row[3] || row[4] || 'Other'; // Ajustar según columna

                        allTransactions.push({
                            id: crypto.randomUUID(),
                            date,
                            vendor: description,
                            kind,
                            amount,
                            currency: 'USD', // Default, ajustar si hay columna de moneda
                            category: category.toString(),
                            payerId: '',
                            users: [],
                            subscriptionId,
                            receiptRef: '',
                            receiptUrl: '',
                            notes: `Importado de ${monthName}`,
                            status: 'pending',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            createdBy: session.user?.email || ''
                        });
                    }
                } catch (error) {
                    console.error(`Error importing ${monthName}:`, error);
                    // Continuar con siguiente mes
                }
            }

            // Escribir todas las transacciones
            if (allTransactions.length > 0) {
                const transactionRows = allTransactions.map(t => [
                    t.id,
                    t.date,
                    t.vendor,
                    t.kind,
                    t.amount,
                    t.currency,
                    t.category,
                    t.payerId || '',
                    t.users.join(','),
                    t.subscriptionId || '',
                    t.receiptRef || '',
                    t.receiptUrl || '',
                    t.notes || '',
                    t.status,
                    t.createdAt,
                    t.updatedAt,
                    t.createdBy || ''
                ]);

                await sheetsService['sheets'].spreadsheets.values.append({
                    spreadsheetId,
                    range: 'Transactions!A:Q',
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: transactionRows }
                });
            }

            return NextResponse.json({ success: true, count: allTransactions.length, months: months });

        } else if (type === 'expense') {
            // Legacy support: crear como Transaction
            const now = new Date().toISOString();
            await sheetsService['sheets'].spreadsheets.values.append({
                spreadsheetId,
                range: 'Transactions!A:Q',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [[
                        crypto.randomUUID(),
                        data.date || new Date().toISOString().split('T')[0],
                        data.description || data.vendor || '',
                        'one_off', // kind
                        parseFloat(data.amount || '0'),
                        data.currency || 'USD',
                        data.category || '',
                        '', // payerId
                        '', // users
                        '', // subscriptionId
                        '', // receiptRef
                        data.receiptUrl || '',
                        data.notes || '',
                        (data.status || 'pending').toLowerCase(),
                        now,
                        now,
                        session.user?.email || ''
                    ]]
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving finance data:', error);
        return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userEmail = session.user?.email || '';
    const isAdmin = isUserAdmin(userEmail);
    if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const accessToken = (session as any).accessToken;
    const sheetsService = new GoogleSheetsService(accessToken);
    const spreadsheetId = await sheetsService.getOrCreateDatabase();

    const body = await req.json();
    const { type, id, data } = body; // type: 'subscription' | 'transaction'

    try {
        // Obtener todas las filas
        const response = await sheetsService['sheets'].spreadsheets.values.get({
            spreadsheetId,
            range: type === 'subscription' ? 'Subscriptions!A2:P' : 'Transactions!A2:Q'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const now = new Date().toISOString();
        let updatedRow: any[];

        if (type === 'subscription') {
            updatedRow = [
                id, // Mantener ID
                data.platform || rows[rowIndex][1] || '',
                data.category || rows[rowIndex][2] || '',
                parseFloat(data.amount || data.cost || rows[rowIndex][3] || '0'),
                data.currency || rows[rowIndex][4] || 'USD',
                data.billingCycle || rows[rowIndex][5] || 'Monthly',
                parseInt(data.renewalDay || rows[rowIndex][6] || '1'),
                data.cardUsed !== undefined ? data.cardUsed : (rows[rowIndex][7] || ''),
                data.status || rows[rowIndex][8] || 'Active',
                data.ownerId !== undefined ? data.ownerId : (rows[rowIndex][9] || ''),
                (data.users && Array.isArray(data.users) ? data.users.join(',') : '') || (rows[rowIndex][10] || ''),
                data.receiptUrl !== undefined ? data.receiptUrl : (rows[rowIndex][11] || ''),
                data.notes !== undefined ? data.notes : (rows[rowIndex][12] || ''),
                rows[rowIndex][13] || now, // createdAt (mantener original)
                now, // updatedAt
                session.user?.email || rows[rowIndex][15] || '' // createdBy
            ];
        } else {
            // transaction
            updatedRow = [
                id, // Mantener ID
                data.date || rows[rowIndex][1] || new Date().toISOString().split('T')[0],
                data.vendor || rows[rowIndex][2] || '',
                data.kind || rows[rowIndex][3] || 'one_off',
                parseFloat(data.amount || rows[rowIndex][4] || '0'),
                data.currency || rows[rowIndex][5] || 'USD',
                data.category || rows[rowIndex][6] || '',
                data.payerId !== undefined ? data.payerId : (rows[rowIndex][7] || ''),
                (data.users && Array.isArray(data.users) ? data.users.join(',') : '') || (rows[rowIndex][8] || ''),
                data.subscriptionId !== undefined ? data.subscriptionId : (rows[rowIndex][9] || ''),
                data.receiptRef !== undefined ? data.receiptRef : (rows[rowIndex][10] || ''),
                data.receiptUrl !== undefined ? data.receiptUrl : (rows[rowIndex][11] || ''),
                data.notes !== undefined ? data.notes : (rows[rowIndex][12] || ''),
                data.status || rows[rowIndex][13] || 'pending',
                rows[rowIndex][14] || now, // createdAt (mantener original)
                now, // updatedAt
                session.user?.email || rows[rowIndex][16] || '' // createdBy
            ];
        }

        // Actualizar fila específica (rowIndex + 2 porque empieza en A2)
        await sheetsService['sheets'].spreadsheets.values.update({
            spreadsheetId,
            range: `${type === 'subscription' ? 'Subscriptions' : 'Transactions'}!A${rowIndex + 2}:${type === 'subscription' ? 'P' : 'Q'}${rowIndex + 2}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [updatedRow] }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating finance data:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userEmail = session.user?.email || '';
    const isAdmin = isUserAdmin(userEmail);
    if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const accessToken = (session as any).accessToken;
    const sheetsService = new GoogleSheetsService(accessToken);
    const spreadsheetId = await sheetsService.getOrCreateDatabase();

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const type = searchParams.get('type'); // 'subscription' | 'transaction'
    const id = searchParams.get('id');

    try {
        if (action === 'reset_all') {
            // Clear all data leaving header
            await sheetsService['sheets'].spreadsheets.values.clear({
                spreadsheetId,
                range: 'Subscriptions!A2:P',
            });
            await sheetsService['sheets'].spreadsheets.values.clear({
                spreadsheetId,
                range: 'Transactions!A2:Q',
            });
            // Legacy: también limpiar Expenses si existe
            try {
                await sheetsService['sheets'].spreadsheets.values.clear({
                    spreadsheetId,
                    range: 'Expenses!A2:I',
                });
            } catch (e) {
                // Expenses sheet puede no existir, no pasa nada
            }
            return NextResponse.json({ success: true, message: 'Reset complete' });
        }

        // Delete specific item
        if (type && id) {
            const range = type === 'subscription' ? 'Subscriptions!A2:P' : 'Transactions!A2:Q';
            const response = await sheetsService['sheets'].spreadsheets.values.get({
                spreadsheetId,
                range
            });

            const rows = response.data.values || [];
            const rowIndex = rows.findIndex(row => row[0] === id);

            if (rowIndex === -1) {
                return NextResponse.json({ error: 'Not found' }, { status: 404 });
            }

            // Eliminar fila (rowIndex + 2 porque empieza en A2)
            await sheetsService['sheets'].spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [{
                        deleteDimension: {
                            range: {
                                sheetId: await (async () => {
                                    const meta = await sheetsService['sheets'].spreadsheets.get({ spreadsheetId });
                                    const sheet = meta.data.sheets?.find(s =>
                                        s.properties?.title === (type === 'subscription' ? 'Subscriptions' : 'Transactions')
                                    );
                                    return sheet?.properties?.sheetId || 0;
                                })(),
                                dimension: 'ROWS',
                                startIndex: rowIndex + 1, // +1 porque el header está en fila 1
                                endIndex: rowIndex + 2
                            }
                        }
                    }]
                }
            });

            return NextResponse.json({ success: true, deleted: id });
        }

        return NextResponse.json({ error: 'Invalid action or missing parameters' }, { status: 400 });
    } catch (error) {
        console.error('Error deleting finance data:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
