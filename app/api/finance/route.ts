import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth-config';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { Subscription, Transaction } from '@/lib/types';
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

        // Parse Subscriptions (nuevo formato con integración Crew)
        const subscriptions = subsRows.map(row => {
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

            // 2. Map to New Schema
            const newSubs = rows
                .filter(row => {
                    const platform = row[0];
                    // Filter out empty rows, summary headers, and rows without a valid status-like look
                    if (!platform) return false;
                    if (['RESUMEN MENSUAL', 'Mes', 'Total Proyecto', 'Promedio Mensual'].includes(platform)) return false;
                    // Check for dates in platform like "November 2025" or "Nov 2025"
                    if (platform.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s\d{4}$/)) return false;

                    // Check Col G (Status). If it is "Total", it's a summary row.
                    if (row[6] === 'Total') return false;

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

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const accessToken = (session as any).accessToken;
    const sheetsService = new GoogleSheetsService(accessToken);
    const spreadsheetId = await sheetsService.getOrCreateDatabase();

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

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

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error deleting finance data:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
